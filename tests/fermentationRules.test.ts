import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateFermentationPlan, sampleInputs } from "../lib/fermentationRules";

describe("evaluateFermentationPlan", () => {
  it("rates a yuzu chickpea koji paste as promising or conditional", () => {
    const result = evaluateFermentationPlan(sampleInputs[0]);

    assert.match(result.proposalName, /柚子ひよこ豆麹ペースト/);
    assert.match(result.similarity, /味噌|塩麹/);
    assert.ok(result.emojiRating === "😋 有望" || result.emojiRating === "😐 条件次第");
  });

  it("warns that banana with natto starter has high flavor risk", () => {
    const result = evaluateFermentationPlan(sampleInputs[1]);

    assert.equal(result.emojiRating, "🤢 風味・失敗リスク高め");
    assert.match(result.risks.join(" "), /果物|糖分過多|風味/);
  });

  it("rates cooked soybeans with natto starter as promising", () => {
    const result = evaluateFermentationPlan(sampleInputs[2]);

    assert.equal(result.emojiRating, "😋 有望");
    assert.match(result.proposalName, /大豆納豆/);
  });

  it("rates rice koji at saccharification temperature as amazake-like and promising", () => {
    const result = evaluateFermentationPlan(sampleInputs[3]);

    assert.equal(result.emojiRating, "😋 有望");
    assert.match(result.proposalName, /甘酒/);
  });

  it("strongly rejects fish fermentation at room temperature for seven days", () => {
    const result = evaluateFermentationPlan(sampleInputs[4]);

    assert.equal(result.emojiRating, "🤮 安全リスクが高く非推奨");
    assert.match(result.risks.join(" "), /肉または魚|安全リスク/);
  });
});
