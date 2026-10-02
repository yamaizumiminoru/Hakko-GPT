import { callCodexAppServerJson } from "@/lib/codexAppServer";
import { designFermentationPlan } from "@/lib/fermentationDesigner";
import { evaluateFermentationPlan } from "@/lib/fermentationRules";
import type { FermentationDesignInput, FermentationDesignOutput, SubIngredientSuggestion } from "@/types/design";
import type { EmojiRating, FermentationEvaluation, FermentationInput, RecommendedConditions } from "@/types/fermentation";
import type { ExpertApiResponse } from "@/types/expert";

type DangerLevel = FermentationDesignOutput["dangerLevel"];
type StarterRecommendation = FermentationDesignOutput["recommendedStarter"];

const FERMENTATION_EXPERT_SYSTEM = [
  "あなたは発酵の専門家です。",
  "食品安全を最優先し、食用可否を保証しない発酵設計の仮説として回答します。",
  "危険条件を楽観視してはいけません。肉・魚、低塩分高水分の常温長期、密閉酵母、にんにくオイル、pH不明の保存、野生発酵は強く警告します。",
  "回答は指定されたJSONだけにしてください。Markdownや説明文をJSON外に出してはいけません。",
].join("\n");

const ADDITIONAL_REVIEW_REASON =
  "発酵専門家AIがローカルルールでは確定できない追加警告を返したため、実作前に根拠確認と専門家確認が必要。";
const ADDITIONAL_REVIEW_NOTICE =
  "発酵専門家AIの追加警告は食品安全性を確認したものではありません。ルール判定と食い違うため、実際に作る前に根拠、pH、塩分、水分活性、温度履歴を確認してください。";
const NO_HOME_RECOMMENDATION: StarterRecommendation = "なし（家庭向け非推奨）";

const ratingRank: Record<EmojiRating, number> = {
  "😋 有望": 0,
  "😐 条件次第": 1,
  "🤢 風味・失敗リスク高め": 2,
  "🤮 安全リスクが高く非推奨": 3,
};

const dangerRank = {
  低: 0,
  中: 1,
  高: 2,
  非常に高い: 3,
} as const;

const animalIngredientPattern = /肉|牛|豚|鶏|魚|魚介|鮭|鯖|サバ|刺身|海老|エビ|蝦|イカ|烏賊|タコ|蛸|貝|牡蠣|シーフード/;
const oilIngredientPattern = /油脂|オイル|油漬け|にんにくオイル|ガーリックオイル/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringArrayValue(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
  return items.length ? items : fallback;
}

function unionStrings(primary: string[], secondary: string[]): string[] {
  return [...new Set([...primary, ...secondary])];
}

function ratingValue(value: unknown, fallback: EmojiRating): EmojiRating {
  return typeof value === "string" && value in ratingRank ? (value as EmojiRating) : fallback;
}

function saferRating(ruleRating: EmojiRating, expertRating: EmojiRating): EmojiRating {
  return ratingRank[ruleRating] >= ratingRank[expertRating] ? ruleRating : expertRating;
}

function ratingForDanger(danger: DangerLevel, fallback: EmojiRating): EmojiRating {
  if (danger === "非常に高い") return "🤮 安全リスクが高く非推奨";
  if (danger === "高") return saferRating(fallback, "🤢 風味・失敗リスク高め");
  if (danger === "中") return saferRating(fallback, "😐 条件次第");
  return fallback;
}

function recommendedConditionsValue(value: unknown, fallback: RecommendedConditions): RecommendedConditions {
  if (!isRecord(value)) return fallback;
  return {
    temperature: stringValue(value.temperature, fallback.temperature),
    humidity: stringValue(value.humidity, fallback.humidity),
    duration: stringValue(value.duration, fallback.duration),
    salt: stringValue(value.salt, fallback.salt),
    oxygen: stringValue(value.oxygen, fallback.oxygen),
  };
}

function mergeLabEvaluation(ruleResult: FermentationEvaluation, expert: unknown): FermentationEvaluation {
  if (!isRecord(expert)) return ruleResult;

  return {
    emojiRating: saferRating(ruleResult.emojiRating, ratingValue(expert.emojiRating, ruleResult.emojiRating)),
    proposalName: stringValue(expert.proposalName, ruleResult.proposalName),
    similarity: stringValue(expert.similarity, ruleResult.similarity),
    recommendedStarter: stringValue(expert.recommendedStarter, ruleResult.recommendedStarter),
    recommendedConditions: recommendedConditionsValue(expert.recommendedConditions, ruleResult.recommendedConditions),
    expectedTaste: stringValue(expert.expectedTaste, ruleResult.expectedTaste),
    expectedAroma: stringValue(expert.expectedAroma, ruleResult.expectedAroma),
    expectedTexture: stringValue(expert.expectedTexture, ruleResult.expectedTexture),
    mechanism: stringValue(expert.mechanism, ruleResult.mechanism),
    risks: unionStrings(ruleResult.risks, stringArrayValue(expert.risks, [])),
    improvements: unionStrings(stringArrayValue(expert.improvements, []), ruleResult.improvements),
    safetyNotice: `${ruleResult.safetyNotice} ${stringValue(expert.safetyNotice, "")}`.trim(),
  };
}

function dangerValue(value: unknown, fallback: DangerLevel): DangerLevel {
  return typeof value === "string" && value in dangerRank ? (value as DangerLevel) : fallback;
}

function saferDanger(ruleDanger: DangerLevel, expertDanger: DangerLevel): DangerLevel {
  return dangerRank[ruleDanger] >= dangerRank[expertDanger] ? ruleDanger : expertDanger;
}

function successValue(value: unknown, fallback: FermentationDesignOutput["successLikelihood"]): FermentationDesignOutput["successLikelihood"] {
  return value === "高い" || value === "中程度" || value === "低い" ? value : fallback;
}

function inputTextForDesign(input: FermentationDesignInput): string {
  return `${input.mainIngredient} ${input.subIngredients} ${input.purpose} ${input.preference}`;
}

function inputTextWithoutKnownFalsePositives(input: FermentationDesignInput): string {
  return inputTextForDesign(input).replaceAll("スイカ", "").replaceAll("西瓜", "");
}

function isContradictedIngredientWarning(input: FermentationDesignInput, item: string): boolean {
  const inputText = inputTextForDesign(input);
  const ingredientText = inputTextWithoutKnownFalsePositives(input);

  if (animalIngredientPattern.test(item) && !animalIngredientPattern.test(ingredientText)) return true;
  if (oilIngredientPattern.test(item) && !oilIngredientPattern.test(inputText)) return true;
  return false;
}

function removeContradictedReasoning(input: FermentationDesignInput, items: string[]): string[] {
  return items.filter((item) => !isContradictedIngredientWarning(input, item));
}

function removedContradictedReasoningCount(input: FermentationDesignInput, items: string[]): number {
  return items.filter((item) => isContradictedIngredientWarning(input, item)).length;
}

function isHardNonRecommendedExpert(expert: Record<string, unknown>): boolean {
  return (
    expert.recommendedStarter === NO_HOME_RECOMMENDATION ||
    expert.dangerLevel === "非常に高い" ||
    expert.emojiRating === "🤮 安全リスクが高く非推奨" ||
    (typeof expert.proposalName === "string" && /非推奨|非食用/.test(expert.proposalName))
  );
}

type ExpertWarningReview = {
  reasoning: string[];
  safetyNotice: string;
  onlyContradictedHardWarning: boolean;
  needsAdditionalReview: boolean;
};

function expertWarningReview(
  input: FermentationDesignInput,
  expert: Record<string, unknown>,
  ruleDanger: DangerLevel,
  expertDanger: DangerLevel,
): ExpertWarningReview {
  const rawReasoning = stringArrayValue(expert.reasoning, []);
  const rawSafetyNotice = stringValue(expert.safetyNotice, "");
  const rawSafetyNotices = rawSafetyNotice ? [rawSafetyNotice] : [];
  const reasoning = removeContradictedReasoning(input, rawReasoning);
  const safetyNotice = removeContradictedReasoning(input, rawSafetyNotices)[0] ?? "";
  const removedWarnings = removedContradictedReasoningCount(input, rawReasoning) + removedContradictedReasoningCount(input, rawSafetyNotices);
  const rawHadTextualWarning = rawReasoning.length > 0 || rawSafetyNotices.length > 0;
  const hasNonContradictedWarning = reasoning.length > 0 || Boolean(safetyNotice);
  const hardSignal = isHardNonRecommendedExpert(expert);
  const onlyContradictedHardWarning = hardSignal && rawHadTextualWarning && removedWarnings > 0 && !hasNonContradictedWarning;
  const expertRaisesDanger = dangerRank[expertDanger] > dangerRank[ruleDanger];
  const needsAdditionalReview =
    !onlyContradictedHardWarning &&
    (hardSignal || expertRaisesDanger) &&
    (hasNonContradictedWarning || !rawHadTextualWarning);

  return { reasoning, safetyNotice, onlyContradictedHardWarning, needsAdditionalReview };
}

function mergedDangerLevel(ruleDanger: DangerLevel, expertDanger: DangerLevel, review: ExpertWarningReview): DangerLevel {
  if (ruleDanger === "非常に高い") return "非常に高い";
  if (review.onlyContradictedHardWarning) return ruleDanger;
  if (review.needsAdditionalReview && dangerRank[expertDanger] > dangerRank[ruleDanger]) {
    if (expertDanger === "非常に高い" && dangerRank[ruleDanger] <= dangerRank.中) return "高";
    return expertDanger;
  }
  return saferDanger(ruleDanger, expertDanger);
}

function filteredExpertSafetyNotice(input: FermentationDesignInput, expertNotice: unknown): string {
  const notice = stringValue(expertNotice, "");
  if (!notice) return "";
  return removeContradictedReasoning(input, [notice])[0] ?? "";
}

function subIngredientSuggestionsValue(input: FermentationDesignInput, value: unknown, fallback: SubIngredientSuggestion[]): SubIngredientSuggestion[] {
  if (!input.suggestSubIngredients || !Array.isArray(value)) return fallback;

  const suggestions: SubIngredientSuggestion[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const name = stringValue(item.name, "");
    const reason = filteredExpertSafetyNotice(input, item.reason);
    const caution = filteredExpertSafetyNotice(input, item.caution);
    if (!name || !reason) continue;
    if (animalIngredientPattern.test(name) && !animalIngredientPattern.test(inputTextWithoutKnownFalsePositives(input))) continue;
    suggestions.push(caution ? { name, reason, caution } : { name, reason });
  }

  return unionSubIngredientSuggestions(fallback, suggestions);
}

function unionSubIngredientSuggestions(primary: SubIngredientSuggestion[], secondary: SubIngredientSuggestion[]): SubIngredientSuggestion[] {
  const seen = new Set<string>();
  const merged: SubIngredientSuggestion[] = [];

  for (const item of [...primary, ...secondary]) {
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    merged.push(item);
  }

  return merged.slice(0, 6);
}

function starterValue(value: unknown, fallback: StarterRecommendation): StarterRecommendation {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value as StarterRecommendation;
}

function mergeDesignOutput(input: FermentationDesignInput, ruleResult: FermentationDesignOutput, expert: unknown): FermentationDesignOutput {
  if (!isRecord(expert)) return ruleResult;

  const expertDanger = dangerValue(expert.dangerLevel, ruleResult.dangerLevel);
  const review = expertWarningReview(input, expert, ruleResult.dangerLevel, expertDanger);
  const dangerLevel = mergedDangerLevel(ruleResult.dangerLevel, expertDanger, review);
  const ruleHardNonRecommended = ruleResult.recommendedStarter === NO_HOME_RECOMMENDATION || ruleResult.dangerLevel === "非常に高い";
  const expertRating = ratingValue(expert.emojiRating, ruleResult.emojiRating);

  if (ruleHardNonRecommended) {
    return {
      ...ruleResult,
      emojiRating: saferRating(ruleResult.emojiRating, expertRating),
      successLikelihood: "低い",
      reasoning: unionStrings(ruleResult.reasoning, review.reasoning),
      safetyNotice: `${ruleResult.safetyNotice} ${review.safetyNotice}`.trim(),
    };
  }

  if (review.onlyContradictedHardWarning) return ruleResult;

  const validExpertHardNonRecommended = isHardNonRecommendedExpert(expert);
  const expertStarter = starterValue(expert.recommendedStarter, ruleResult.recommendedStarter);
  const forceNonRecommended = dangerLevel === "非常に高い" || review.needsAdditionalReview;
  const recommendedStarter = forceNonRecommended
    ? NO_HOME_RECOMMENDATION
    : validExpertHardNonRecommended
      ? ruleResult.recommendedStarter
      : expertStarter === NO_HOME_RECOMMENDATION
        ? ruleResult.recommendedStarter
        : expertStarter;
  const additionalReasoning = review.needsAdditionalReview ? [ADDITIONAL_REVIEW_REASON] : [];
  const additionalNotice = review.needsAdditionalReview ? ADDITIONAL_REVIEW_NOTICE : "";
  const proposalName = review.needsAdditionalReview
    ? `${ruleResult.proposalName}（追加確認が必要）`
    : validExpertHardNonRecommended
      ? ruleResult.proposalName
      : stringValue(expert.proposalName, ruleResult.proposalName);
  const emojiRating = ratingForDanger(dangerLevel, review.needsAdditionalReview ? "🤢 風味・失敗リスク高め" : ruleResult.emojiRating);

  return {
    proposalName,
    recommendedStarter,
    recommendedTemperature: stringValue(expert.recommendedTemperature, ruleResult.recommendedTemperature),
    recommendedHumidity: stringValue(expert.recommendedHumidity, ruleResult.recommendedHumidity),
    recommendedDuration: stringValue(expert.recommendedDuration, ruleResult.recommendedDuration),
    expectedTaste: stringValue(expert.expectedTaste, ruleResult.expectedTaste),
    expectedAroma: stringValue(expert.expectedAroma, ruleResult.expectedAroma),
    expectedTexture: stringValue(expert.expectedTexture, ruleResult.expectedTexture),
    similarity: stringValue(expert.similarity, ruleResult.similarity),
    successLikelihood: dangerRank[dangerLevel] >= dangerRank.高 || review.needsAdditionalReview ? "低い" : successValue(expert.successLikelihood, ruleResult.successLikelihood),
    dangerLevel,
    emojiRating,
    subIngredientSuggestions: subIngredientSuggestionsValue(input, expert.subIngredientSuggestions, ruleResult.subIngredientSuggestions),
    reasoning: unionStrings(ruleResult.reasoning, unionStrings(review.reasoning, additionalReasoning)),
    safetyNotice: `${ruleResult.safetyNotice} ${review.safetyNotice} ${additionalNotice}`.trim(),
  };
}

function fallbackErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error)) return String(error);
  if (error.message === "CODEX_APP_SERVER_URL is not set.") return undefined;
  return error.message;
}

function assertExpertObject(expert: unknown): Record<string, unknown> {
  if (!isRecord(expert)) throw new Error("発酵専門家AIの応答が不正です。");
  return expert;
}

export async function evaluateLabWithExpert(input: FermentationInput): Promise<ExpertApiResponse<FermentationEvaluation>> {
  const ruleResult = evaluateFermentationPlan(input);

  try {
    const expert = assertExpertObject(
      await callCodexAppServerJson<unknown>({
        system: FERMENTATION_EXPERT_SYSTEM,
        user: JSON.stringify({
          task: "入力済みスターターと条件を、発酵専門家として評価してください。既存ルール結果を参考にしつつ、味・香り・食感・リスクを専門的に補強してください。",
          input,
          ruleResult,
          outputShape: {
            emojiRating: "😋 有望 | 😐 条件次第 | 🤢 風味・失敗リスク高め | 🤮 安全リスクが高く非推奨",
            proposalName: "string",
            similarity: "string",
            recommendedStarter: "string",
            recommendedConditions: { temperature: "string", humidity: "string", duration: "string", salt: "string", oxygen: "string" },
            expectedTaste: "string",
            expectedAroma: "string",
            expectedTexture: "string",
            mechanism: "string",
            risks: ["string"],
            improvements: ["string"],
            safetyNotice: "string",
          },
        }),
      }),
    );

    return {
      result: mergeLabEvaluation(ruleResult, expert),
      expertMode: {
        source: "codex-app-server",
        message: "発酵専門家AIの補正を適用しました。安全判定はルール側を優先しています。",
      },
    };
  } catch (error) {
    return {
      result: ruleResult,
      expertMode: {
        source: "rule-fallback",
        message: "発酵専門家AIは未接続または応答不正です。ローカルルールで評価しました。",
        error: fallbackErrorMessage(error),
      },
    };
  }
}

export async function designWithExpert(input: FermentationDesignInput): Promise<ExpertApiResponse<FermentationDesignOutput>> {
  const ruleResult = designFermentationPlan(input);

  try {
    const expert = assertExpertObject(
      await callCodexAppServerJson<unknown>({
        system: FERMENTATION_EXPERT_SYSTEM,
        user: JSON.stringify({
          task: "材料・目的・好み・難易度から、発酵専門家として発酵案を提案してください。スターター候補を専門知識で選び、既存ルール結果を安全ガードレールとして尊重してください。",
          input,
          ruleResult,
          outputShape: {
            proposalName: "string",
            recommendedStarter: "米麹 | 麦麹 | 豆麹 | 酵母 | 乳酸菌 | 酢酸菌 | 納豆菌 | テンペ菌 | ぬか床 | その他 | なし（家庭向け非推奨）",
            recommendedTemperature: "string",
            recommendedHumidity: "string",
            recommendedDuration: "string",
            expectedTaste: "string",
            expectedAroma: "string",
            expectedTexture: "string",
            similarity: "string",
            successLikelihood: "高い | 中程度 | 低い",
            dangerLevel: "低 | 中 | 高 | 非常に高い",
            emojiRating: "😋 有望 | 😐 条件次第 | 🤢 風味・失敗リスク高め | 🤮 安全リスクが高く非推奨",
            subIngredientSuggestions: [{ name: "string", reason: "string", caution: "string optional" }],
            reasoning: ["string"],
            safetyNotice: "string",
          },
        }),
      }),
    );

    return {
      result: mergeDesignOutput(input, ruleResult, expert),
      expertMode: {
        source: "codex-app-server",
        message: "発酵専門家AIの提案を適用しました。警告の根拠がルールと食い違う場合は追加確認扱いにしています。",
      },
    };
  } catch (error) {
    return {
      result: ruleResult,
      expertMode: {
        source: "rule-fallback",
        message: "発酵専門家AIは未接続または応答不正です。ローカルルールで提案しました。",
        error: fallbackErrorMessage(error),
      },
    };
  }
}
