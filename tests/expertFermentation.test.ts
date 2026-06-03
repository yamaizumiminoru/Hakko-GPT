import assert from "node:assert/strict";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { designWithExpert, evaluateLabWithExpert } from "../lib/expertFermentation";
import { designSampleInputs } from "../lib/fermentationDesigner";
import { sampleInputs } from "../lib/fermentationRules";

describe("expert fermentation server fallback", () => {
  it("falls back to local lab rules when codex app-server cannot start", async () => {
    const previousCommand = process.env.CODEX_APP_SERVER_COMMAND;
    process.env.CODEX_APP_SERVER_COMMAND = "definitely-missing-codex-app-server";

    const response = await evaluateLabWithExpert(sampleInputs[0]);

    assert.equal(response.expertMode.source, "rule-fallback");
    assert.match(response.expertMode.message, /ローカルルール/);
    assert.ok(response.result.proposalName.length > 0);

    if (previousCommand) process.env.CODEX_APP_SERVER_COMMAND = previousCommand;
    else delete process.env.CODEX_APP_SERVER_COMMAND;
  });

  it("falls back to local design rules when codex app-server cannot start", async () => {
    const previousCommand = process.env.CODEX_APP_SERVER_COMMAND;
    process.env.CODEX_APP_SERVER_COMMAND = "definitely-missing-codex-app-server";

    const response = await designWithExpert(designSampleInputs[0]);

    assert.equal(response.expertMode.source, "rule-fallback");
    assert.match(response.expertMode.message, /ローカルルール/);
    assert.equal(response.result.recommendedStarter, "米麹");

    if (previousCommand) process.env.CODEX_APP_SERVER_COMMAND = previousCommand;
    else delete process.env.CODEX_APP_SERVER_COMMAND;
  });
});

describe("expert fermentation stdio app-server client", () => {
  it("uses a stdio JSON-RPC app-server response when available", async () => {
    const previousCommand = process.env.CODEX_APP_SERVER_COMMAND;
    const previousArgs = process.env.CODEX_APP_SERVER_ARGS;
    process.env.CODEX_APP_SERVER_COMMAND = process.execPath;
    process.env.CODEX_APP_SERVER_ARGS = resolve("tests/fixtures/fakeCodexAppServer.cjs");

    const response = await designWithExpert(designSampleInputs[0]);

    assert.equal(response.expertMode.source, "codex-app-server");
    assert.match(response.result.proposalName, /専門家AI/);
    assert.equal(response.result.recommendedStarter, "米麹");
    assert.ok(response.result.subIngredientSuggestions.some((item) => item.name === "昆布"));
    assert.ok(response.result.reasoning.some((reason) => reason.includes("偽app-server")));

    if (previousCommand) process.env.CODEX_APP_SERVER_COMMAND = previousCommand;
    else delete process.env.CODEX_APP_SERVER_COMMAND;
    if (previousArgs) process.env.CODEX_APP_SERVER_ARGS = previousArgs;
    else delete process.env.CODEX_APP_SERVER_ARGS;
  });

  it("does not accept hallucinated meat or fish hazards for fruit inputs", async () => {
    const previousCommand = process.env.CODEX_APP_SERVER_COMMAND;
    const previousArgs = process.env.CODEX_APP_SERVER_ARGS;
    const previousFakeResponse = process.env.FAKE_CODEX_RESPONSE;
    process.env.CODEX_APP_SERVER_COMMAND = process.execPath;
    process.env.CODEX_APP_SERVER_ARGS = resolve("tests/fixtures/fakeCodexAppServer.cjs");
    process.env.FAKE_CODEX_RESPONSE = JSON.stringify({
      proposalName: "レモンスイカ短時間観察発酵案（非食用前提・家庭向け非推奨）",
      recommendedStarter: "なし（家庭向け非推奨）",
      recommendedTemperature: "4〜8℃",
      recommendedHumidity: "過湿を避ける",
      recommendedDuration: "数時間〜24時間",
      expectedTaste: "スイカの淡い甘味にレモンの酸味が立つ。",
      expectedAroma: "青い果皮様香、酸香。",
      expectedTexture: "離水しやすい。",
      similarity: "酸性果実の短時間試験",
      successLikelihood: "低い",
      dangerLevel: "非常に高い",
      emojiRating: "🤮 安全リスクが高く非推奨",
      reasoning: ["肉または魚を含むため、家庭向けの発酵スターター推薦より安全警告を優先。"],
      safetyNotice: "肉または魚を含むため非推奨。",
    });

    const response = await designWithExpert({
      mainIngredient: "スイカ",
      subIngredients: "レモン",
      purpose: "実験",
      preference: "さっぱり",
      difficulty: "上級者",
      suggestSubIngredients: true,
    });

    assert.notEqual(response.result.recommendedStarter, "なし（家庭向け非推奨）");
    assert.notEqual(response.result.dangerLevel, "非常に高い");
    assert.ok(!response.result.reasoning.join(" ").includes("肉または魚"));
    assert.ok(!response.result.safetyNotice.includes("肉または魚"));

    if (previousCommand) process.env.CODEX_APP_SERVER_COMMAND = previousCommand;
    else delete process.env.CODEX_APP_SERVER_COMMAND;
    if (previousArgs) process.env.CODEX_APP_SERVER_ARGS = previousArgs;
    else delete process.env.CODEX_APP_SERVER_ARGS;
    if (previousFakeResponse) process.env.FAKE_CODEX_RESPONSE = previousFakeResponse;
    else delete process.env.FAKE_CODEX_RESPONSE;
  });
});
