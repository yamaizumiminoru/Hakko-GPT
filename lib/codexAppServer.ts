import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import readline from "node:readline";

type CodexAppServerRequest = {
  system: string;
  user: string;
};

type JsonRpcMessage = {
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { message?: string; code?: number; [key: string]: unknown };
};

type PendingRequest = {
  resolve: (value: JsonRpcMessage) => void;
  reject: (error: Error) => void;
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Codex app-server returned an empty response.");

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Codex app-server did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function getStringField(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string") return field;
  }

  return "";
}

function getNestedRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const field = (value as Record<string, unknown>)[key];
  return field && typeof field === "object" && !Array.isArray(field) ? (field as Record<string, unknown>) : null;
}

function splitArgs(value: string | undefined, fallback: string[]): string[] {
  if (!value?.trim()) return fallback;
  return value.match(/"[^"]+"|'[^']+'|\S+/g)?.map((arg) => arg.replace(/^["']|["']$/g, "")) ?? fallback;
}

function resolveCodexCommand(): string {
  if (process.env.CODEX_APP_SERVER_COMMAND?.trim()) return process.env.CODEX_APP_SERVER_COMMAND.trim();

  const localAppData = process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local");
  const candidates = [
    join(localAppData, "OpenAI", "Codex", "bin", "codex.exe"),
    "codex",
  ];

  return candidates.find((candidate) => candidate === "codex" || existsSync(candidate)) ?? "codex";
}

function buildPrompt(system: string, user: string): string {
  return [
    system,
    "",
    "重要: このturnではコマンド実行、ファイル操作、Web検索、外部ツール呼び出しを行わないでください。",
    "発酵専門家として、与えられた入力と既存ルール結果だけを使って回答してください。",
    "最終回答はJSONオブジェクトのみです。JSON以外の文章、Markdown、コードブロックは禁止です。",
    "",
    user,
  ].join("\n");
}

function isServerRequest(message: JsonRpcMessage): boolean {
  return message.id !== undefined && Boolean(message.method) && message.result === undefined && message.error === undefined;
}

class CodexAppServerSession {
  private nextId = 1;
  private readonly pending = new Map<number | string, PendingRequest>();
  private readonly agentMessageByItem = new Map<string, string>();
  private readonly stderrChunks: string[] = [];
  private turnCompleted:
    | {
        resolve: (value: string) => void;
        reject: (error: Error) => void;
      }
    | null = null;

  constructor(
    private readonly proc: ChildProcessWithoutNullStreams,
    private readonly timeoutMs: number,
  ) {}

  start() {
    const rl = readline.createInterface({ input: this.proc.stdout });

    rl.on("line", (line) => {
      this.handleLine(line);
    });

    this.proc.stderr.on("data", (chunk: Buffer) => {
      this.stderrChunks.push(chunk.toString("utf8"));
    });

    this.proc.on("error", (error) => {
      for (const request of this.pending.values()) request.reject(error);
      this.pending.clear();
      this.turnCompleted?.reject(error);
    });

    this.proc.on("exit", (code) => {
      const error = new Error(`codex app-server exited with code ${code ?? "unknown"}. ${this.stderrTail()}`.trim());
      for (const request of this.pending.values()) request.reject(error);
      this.pending.clear();
      this.turnCompleted?.reject(error);
    });
  }

  private stderrTail(): string {
    return this.stderrChunks.join("").slice(-1200);
  }

  private send(message: unknown) {
    this.proc.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private request(method: string, params?: unknown): Promise<JsonRpcMessage> {
    const id = this.nextId++;
    const message = params === undefined ? { method, id } : { method, id, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for ${method}. ${this.stderrTail()}`.trim()));
      }, this.timeoutMs);

      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });

      this.send(message);
    });
  }

  private notify(method: string, params?: unknown) {
    this.send(params === undefined ? { method } : { method, params });
  }

  private handleLine(line: string) {
    let message: JsonRpcMessage;
    try {
      message = JSON.parse(line) as JsonRpcMessage;
    } catch {
      return;
    }

    if (message.id !== undefined && this.pending.has(message.id) && !message.method) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) {
        pending?.reject(new Error(message.error.message ?? `JSON-RPC error ${message.error.code ?? ""}`.trim()));
      } else {
        pending?.resolve(message);
      }
      return;
    }

    if (isServerRequest(message)) {
      this.declineServerRequest(message);
      return;
    }

    this.handleNotification(message);
  }

  private declineServerRequest(message: JsonRpcMessage) {
    const method = message.method ?? "";
    if (method.includes("requestApproval")) {
      this.send({ id: message.id, result: { decision: "decline" } });
      return;
    }

    if (method === "item/tool/requestUserInput") {
      this.send({ id: message.id, result: { decision: "cancel" } });
      return;
    }

    this.send({ id: message.id, error: { code: -32000, message: "This client only accepts text generation." } });
  }

  private handleNotification(message: JsonRpcMessage) {
    if (message.method === "item/agentMessage/delta") {
      const params = message.params as Record<string, unknown> | undefined;
      const itemId = getStringField(params, ["itemId", "id"]);
      const delta = getStringField(params, ["delta", "text"]);
      if (itemId && delta) {
        this.agentMessageByItem.set(itemId, `${this.agentMessageByItem.get(itemId) ?? ""}${delta}`);
      }
      return;
    }

    if (message.method === "item/completed") {
      const params = message.params as Record<string, unknown> | undefined;
      const item = getNestedRecord(params, "item");
      if (item?.type === "agentMessage") {
        const id = getStringField(item, ["id"]);
        const text = getStringField(item, ["text"]);
        if (id && text) this.agentMessageByItem.set(id, text);
      }
      return;
    }

    if (message.method === "error") {
      const params = message.params as Record<string, unknown> | undefined;
      const error = getNestedRecord(params, "error");
      this.turnCompleted?.reject(new Error(getStringField(error, ["message"]) || "Codex app-server turn failed."));
      return;
    }

    if (message.method === "turn/completed") {
      const params = message.params as Record<string, unknown> | undefined;
      const turn = getNestedRecord(params, "turn");
      const status = getStringField(turn, ["status"]);
      if (status && status !== "completed") {
        this.turnCompleted?.reject(new Error(`Codex app-server turn finished with status ${status}.`));
        return;
      }

      const messages = [...this.agentMessageByItem.values()].filter(Boolean);
      this.turnCompleted?.resolve(messages.at(-1) ?? "");
    }
  }

  async run(prompt: string): Promise<string> {
    this.start();

    await this.request("initialize", {
      clientInfo: {
        name: "virtual_fermentation_lab",
        title: "Virtual Fermentation Lab",
        version: "0.1.0",
      },
      capabilities: {
        optOutNotificationMethods: [
          "item/reasoning/summaryTextDelta",
          "item/reasoning/textDelta",
          "item/commandExecution/outputDelta",
        ],
      },
    });
    this.notify("initialized", {});

    const threadResponse = await this.request("thread/start", {
      model: process.env.CODEX_APP_SERVER_MODEL ?? "gpt-5.4",
      cwd: process.cwd(),
    });
    const thread = getNestedRecord(threadResponse.result, "thread");
    const threadId = getStringField(thread, ["id"]);
    if (!threadId) throw new Error("Codex app-server did not return a thread id.");

    const output = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for turn completion. ${this.stderrTail()}`.trim()));
      }, this.timeoutMs);

      this.turnCompleted = {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };
    });

    await this.request("turn/start", {
      threadId,
      input: [{ type: "text", text: prompt }],
    });

    return output;
  }

  close() {
    if (!this.proc.killed) this.proc.kill();
  }
}

export async function callCodexAppServerJson<T>({ system, user }: CodexAppServerRequest): Promise<T> {
  const command = resolveCodexCommand();
  const args = splitArgs(process.env.CODEX_APP_SERVER_ARGS, ["app-server"]);
  const timeoutMs = Number(process.env.CODEX_APP_SERVER_TIMEOUT_MS ?? 120000);
  const proc = spawn(command, args, {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });

  const session = new CodexAppServerSession(proc, timeoutMs);
  try {
    const text = await session.run(buildPrompt(system, user));
    return extractJson(text) as T;
  } finally {
    session.close();
  }
}
