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

  it("keeps non-contradicted expert hard warnings as additional-review results", async () => {
    const previousCommand = process.env.CODEX_APP_SERVER_COMMAND;
    const previousArgs = process.env.CODEX_APP_SERVER_ARGS;
    const previousFakeResponse = process.env.FAKE_CODEX_RESPONSE;
    process.env.CODEX_APP_SERVER_COMMAND = process.execPath;
    process.env.CODEX_APP_SERVER_ARGS = resolve("tests/fixtures/fakeCodexAppServer.cjs");
    process.env.FAKE_CODEX_RESPONSE = JSON.stringify({
      proposalName: "架空素材の追加確認が必要な発酵案（家庭向け非推奨）",
      recommendedStarter: "なし（家庭向け非推奨）",
      recommendedTemperature: "条件確定まで推奨しない",
      recommendedHumidity: "条件確定まで推奨しない",
      recommendedDuration: "条件確定まで推奨しない",
      expectedTaste: "追加確認が必要。",
      expectedAroma: "追加確認が必要。",
      expectedTexture: "追加確認が必要。",
      similarity: "低酸性・密閉・pH不明の長期保存リスクが疑われる架空ケース",
      successLikelihood: "低い",
      dangerLevel: "非常に高い",
      emojiRating: "🤮 安全リスクが高く非推奨",
      reasoning: ["低酸性・密閉・pH不明の長期保存リスクが疑われるため、ルール判定とは別に追加確認が必要。"],
      safetyNotice: "低酸性・密閉・pH不明の長期保存リスクが疑われるため、実作せず追加確認する。",
    });

    const response = await designWithExpert({
      mainIngredient: "スイカ",
      subIngredients: "レモン",
      purpose: "実験",
      preference: "さっぱり",
      difficulty: "上級者",
      suggestSubIngredients: true,
    });

    assert.equal(response.result.recommendedStarter, "なし（家庭向け非推奨）");
    assert.notEqual(response.result.emojiRating, "😋 有望");
    assert.notEqual(response.result.dangerLevel, "低");
    assert.notEqual(response.result.dangerLevel, "中");
    assert.equal(response.result.successLikelihood, "低い");
    assert.match(response.result.proposalName, /追加確認/);
    assert.match(response.result.reasoning.join(" "), /追加確認/);
    assert.match(response.result.safetyNotice, /追加確認/);

    if (previousCommand) process.env.CODEX_APP_SERVER_COMMAND = previousCommand;
    else delete process.env.CODEX_APP_SERVER_COMMAND;
    if (previousArgs) process.env.CODEX_APP_SERVER_ARGS = previousArgs;
    else delete process.env.CODEX_APP_SERVER_ARGS;
    if (previousFakeResponse) process.env.FAKE_CODEX_RESPONSE = previousFakeResponse;
    else delete process.env.FAKE_CODEX_RESPONSE;
  });

  it("keeps strong rule warnings over optimistic expert responses", async () => {
    const previousCommand = process.env.CODEX_APP_SERVER_COMMAND;
    const previousArgs = process.env.CODEX_APP_SERVER_ARGS;
    const previousFakeResponse = process.env.FAKE_CODEX_RESPONSE;
    process.env.CODEX_APP_SERVER_COMMAND = process.execPath;
    process.env.CODEX_APP_SERVER_ARGS = resolve("tests/fixtures/fakeCodexAppServer.cjs");
    process.env.FAKE_CODEX_RESPONSE = JSON.stringify({
      proposalName: "架空の楽観的発酵案",
      recommendedStarter: "乳酸菌",
      recommendedTemperature: "20〜25℃",
      recommendedHumidity: "通常管理",
      recommendedDuration: "数日",
      expectedTaste: "うま味が出る。",
      expectedAroma: "穏やか。",
      expectedTexture: "しっとり。",
      similarity: "漬物",
      successLikelihood: "高い",
      dangerLevel: "低",
      emojiRating: "😋 有望",
      reasoning: ["楽観的な架空応答。"],
      safetyNotice: "テスト用応答。",
    });

    const response = await designWithExpert({
      mainIngredient: "魚",
      subIngredients: "",
      purpose: "保存食",
      preference: "旨味強め",
      difficulty: "初心者",
      suggestSubIngredients: false,
    });

    assert.equal(response.result.recommendedStarter, "なし（家庭向け非推奨）");
    assert.equal(response.result.dangerLevel, "非常に高い");
    assert.equal(response.result.emojiRating, "🤮 安全リスクが高く非推奨");
    assert.equal(response.result.successLikelihood, "低い");
    assert.match(response.result.reasoning.join(" "), /肉または魚/);

    if (previousCommand) process.env.CODEX_APP_SERVER_COMMAND = previousCommand;
    else delete process.env.CODEX_APP_SERVER_COMMAND;
    if (previousArgs) process.env.CODEX_APP_SERVER_ARGS = previousArgs;
    else delete process.env.CODEX_APP_SERVER_ARGS;
    if (previousFakeResponse) process.env.FAKE_CODEX_RESPONSE = previousFakeResponse;
    else delete process.env.FAKE_CODEX_RESPONSE;
  });

  it("falls back when the expert response shape is invalid", async () => {
    const previousCommand = process.env.CODEX_APP_SERVER_COMMAND;
    const previousArgs = process.env.CODEX_APP_SERVER_ARGS;
    const previousFakeResponse = process.env.FAKE_CODEX_RESPONSE;
    process.env.CODEX_APP_SERVER_COMMAND = process.execPath;
    process.env.CODEX_APP_SERVER_ARGS = resolve("tests/fixtures/fakeCodexAppServer.cjs");
    process.env.FAKE_CODEX_RESPONSE = JSON.stringify(["invalid expert response"]);

    const response = await designWithExpert(designSampleInputs[0]);

    assert.equal(response.expertMode.source, "rule-fallback");
    assert.match(response.expertMode.message, /応答不正/);
    assert.equal(response.result.recommendedStarter, "米麹");

    if (previousCommand) process.env.CODEX_APP_SERVER_COMMAND = previousCommand;
    else delete process.env.CODEX_APP_SERVER_COMMAND;
    if (previousArgs) process.env.CODEX_APP_SERVER_ARGS = previousArgs;
    else delete process.env.CODEX_APP_SERVER_ARGS;
    if (previousFakeResponse) process.env.FAKE_CODEX_RESPONSE = previousFakeResponse;
    else delete process.env.FAKE_CODEX_RESPONSE;
  });
});
