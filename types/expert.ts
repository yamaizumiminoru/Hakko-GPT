export type ExpertModeStatus = {
  source: "codex-app-server" | "rule-fallback";
  message: string;
  error?: string;
};

export type ExpertApiResponse<T> = {
  result: T;
  expertMode: ExpertModeStatus;
};
