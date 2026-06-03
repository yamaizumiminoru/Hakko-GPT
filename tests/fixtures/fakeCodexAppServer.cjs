const readline = require("node:readline");

const rl = readline.createInterface({ input: process.stdin });

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function expertResponse() {
  if (process.env.FAKE_CODEX_RESPONSE) return JSON.parse(process.env.FAKE_CODEX_RESPONSE);

  return {
    proposalName: "専門家AIの柚子ひよこ豆麹ペースト",
    recommendedStarter: "米麹",
    recommendedTemperature: "20〜25℃",
    recommendedHumidity: "乾燥を避ける",
    recommendedDuration: "1〜2週間",
    expectedTaste: "柚子の香りと麹由来の甘み、豆の旨味が重なる。",
    expectedAroma: "柑橘と麹の穏やかな香り。",
    expectedTexture: "なめらかなペースト状。",
    similarity: "塩麹、味噌、醤油麹",
    successLikelihood: "高い",
    dangerLevel: "低",
    emojiRating: "😋 有望",
    subIngredientSuggestions: [{ name: "昆布", reason: "旨味を補いやすい。" }],
    reasoning: ["偽app-serverによる専門家AIテスト応答。"],
    safetyNotice: "これはテスト用応答です。",
  };
}

rl.on("line", (line) => {
  const message = JSON.parse(line);

  if (message.method === "initialize") {
    send({ id: message.id, result: { userAgent: "fake-codex-app-server/0.1.0" } });
    return;
  }

  if (message.method === "initialized") {
    return;
  }

  if (message.method === "thread/start") {
    send({ id: message.id, result: { thread: { id: "thread-test" } } });
    return;
  }

  if (message.method === "turn/start") {
    send({ id: message.id, result: { turn: { id: "turn-test", status: "inProgress" } } });
    send({
      method: "item/completed",
      params: {
        item: {
          type: "agentMessage",
          id: "agent-message-test",
          phase: "final_answer",
          text: JSON.stringify(expertResponse()),
        },
      },
    });
    send({ method: "turn/completed", params: { turn: { id: "turn-test", status: "completed" } } });
  }
});
