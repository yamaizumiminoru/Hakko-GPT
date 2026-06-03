import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { designFermentationPlan, designSampleInputs } from "../lib/fermentationDesigner";

describe("designFermentationPlan", () => {
  it("recommends koji for a yuzu chickpea seasoning idea", () => {
    const result = designFermentationPlan(designSampleInputs[0]);

    assert.equal(result.recommendedStarter, "米麹");
    assert.match(result.proposalName, /柚子ひよこ豆/);
    assert.ok(result.emojiRating === "😋 有望" || result.emojiRating === "😐 条件次第");
    assert.ok(result.subIngredientSuggestions.some((item) => item.name === "昆布"));
  });

  it("recommends lactic acid bacteria for sour vegetable side dishes", () => {
    const result = designFermentationPlan(designSampleInputs[1]);

    assert.equal(result.recommendedStarter, "乳酸菌");
    assert.match(result.similarity, /漬物|キムチ/);
  });

  it("recommends amazake-like rice koji for sweet rice", () => {
    const result = designFermentationPlan(designSampleInputs[2]);

    assert.equal(result.recommendedStarter, "米麹");
    assert.match(result.proposalName, /甘酒/);
    assert.match(result.recommendedTemperature, /55〜60/);
  });

  it("can choose natto starter for soybean umami side dishes", () => {
    const result = designFermentationPlan(designSampleInputs[3]);

    assert.equal(result.recommendedStarter, "納豆菌");
    assert.match(result.similarity, /納豆/);
  });

  it("rejects fish as a home fermentation recommendation", () => {
    const result = designFermentationPlan(designSampleInputs[4]);

    assert.equal(result.recommendedStarter, "なし（家庭向け非推奨）");
    assert.equal(result.dangerLevel, "非常に高い");
    assert.equal(result.emojiRating, "🤮 安全リスクが高く非推奨");
  });

  it("does not misread watermelon as squid", () => {
    const result = designFermentationPlan({
      mainIngredient: "スイカ",
      subIngredients: "レモン",
      purpose: "実験",
      preference: "さっぱり",
      difficulty: "上級者",
      suggestSubIngredients: true,
    });

    assert.notEqual(result.recommendedStarter, "なし（家庭向け非推奨）");
    assert.notEqual(result.dangerLevel, "非常に高い");
    assert.ok(!result.reasoning.join(" ").includes("肉または魚"));
  });

  it("does not suggest sub ingredients when disabled", () => {
    const result = designFermentationPlan({
      mainIngredient: "ひよこ豆",
      subIngredients: "",
      purpose: "調味料",
      preference: "旨味強め",
      difficulty: "初心者",
      suggestSubIngredients: false,
    });

    assert.equal(result.subIngredientSuggestions.length, 0);
  });
});
