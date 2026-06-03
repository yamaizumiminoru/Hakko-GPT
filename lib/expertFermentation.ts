import { callCodexAppServerJson } from "@/lib/codexAppServer";
import { designFermentationPlan } from "@/lib/fermentationDesigner";
import { evaluateFermentationPlan } from "@/lib/fermentationRules";
import type { FermentationDesignInput, FermentationDesignOutput, SubIngredientSuggestion } from "@/types/design";
import type { EmojiRating, FermentationEvaluation, FermentationInput, RecommendedConditions } from "@/types/fermentation";
import type { ExpertApiResponse } from "@/types/expert";

const FERMENTATION_EXPERT_SYSTEM = [
  "あなたは発酵の専門家です。",
  "食品安全を最優先し、食用可否を保証しない発酵設計の仮説として回答します。",
  "危険条件を楽観視してはいけません。肉・魚、低塩分高水分の常温長期、密閉酵母、にんにくオイル、pH不明の保存、野生発酵は強く警告します。",
  "回答は指定されたJSONだけにしてください。Markdownや説明文をJSON外に出してはいけません。",
].join("\n");

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

function dangerValue(value: unknown, fallback: FermentationDesignOutput["dangerLevel"]): FermentationDesignOutput["dangerLevel"] {
  return typeof value === "string" && value in dangerRank ? (value as FermentationDesignOutput["dangerLevel"]) : fallback;
}

function saferDanger(
  ruleDanger: FermentationDesignOutput["dangerLevel"],
  expertDanger: FermentationDesignOutput["dangerLevel"],
): FermentationDesignOutput["dangerLevel"] {
  return dangerRank[ruleDanger] >= dangerRank[expertDanger] ? ruleDanger : expertDanger;
}

function successValue(value: unknown, fallback: FermentationDesignOutput["successLikelihood"]): FermentationDesignOutput["successLikelihood"] {
  return value === "高い" || value === "中程度" || value === "低い" ? value : fallback;
}

function inputTextForDesign(input: FermentationDesignInput): string {
  return `${input.mainIngredient} ${input.subIngredients} ${input.purpose} ${input.preference}`;
}

function removeContradictedReasoning(input: FermentationDesignInput, items: string[]): string[] {
  const text = inputTextForDesign(input);
  const textWithoutWatermelon = text.replaceAll("スイカ", "");
  const mentionsMeatOrFish = (item: string) => item.includes("肉") || item.includes("魚");
  const inputHasMeatOrFish = /肉|牛|豚|鶏|魚|鮭|鯖|サバ|刺身|海老|エビ|イカ|タコ|貝/.test(textWithoutWatermelon);
  const mentionsOilRisk = (item: string) => item.includes("油脂") || item.includes("オイル") || item.includes("ボツリヌス");
  const inputHasOilRisk = /油|オイル|にんにくオイル|ガーリックオイル/.test(text);

  return items.filter((item) => {
    if (mentionsMeatOrFish(item) && !inputHasMeatOrFish) return false;
    if (mentionsOilRisk(item) && !inputHasOilRisk) return false;
    return true;
  });
}

function cappedExpertDanger(
  ruleDanger: FermentationDesignOutput["dangerLevel"],
  expertDanger: FermentationDesignOutput["dangerLevel"],
): FermentationDesignOutput["dangerLevel"] {
  if (ruleDanger === "非常に高い") return "非常に高い";
  if (expertDanger === "非常に高い") return ruleDanger === "高" ? "高" : "中";
  return saferDanger(ruleDanger, expertDanger);
}

function isHardNonRecommendedExpert(expert: Record<string, unknown>): boolean {
  return (
    expert.recommendedStarter === "なし（家庭向け非推奨）" ||
    expert.dangerLevel === "非常に高い" ||
    expert.emojiRating === "🤮 安全リスクが高く非推奨" ||
    (typeof expert.proposalName === "string" && /非推奨|非食用/.test(expert.proposalName))
  );
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
    if (/肉|魚/.test(name) && !inputTextForDesign(input).replaceAll("スイカ", "").match(/肉|魚/)) continue;
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

function mergeDesignOutput(input: FermentationDesignInput, ruleResult: FermentationDesignOutput, expert: unknown): FermentationDesignOutput {
  if (!isRecord(expert)) return ruleResult;

  const expertDanger = dangerValue(expert.dangerLevel, ruleResult.dangerLevel);
  const dangerLevel = cappedExpertDanger(ruleResult.dangerLevel, expertDanger);
  const ruleHardNonRecommended = ruleResult.recommendedStarter === "なし（家庭向け非推奨）" || ruleResult.dangerLevel === "非常に高い";
  const expertHardNonRecommended = isHardNonRecommendedExpert(expert);
  const emojiRating = ruleHardNonRecommended
    ? saferRating(ruleResult.emojiRating, ratingValue(expert.emojiRating, ruleResult.emojiRating))
    : ruleResult.emojiRating;
  const forceNonRecommended = ruleResult.recommendedStarter === "なし（家庭向け非推奨）" || dangerLevel === "非常に高い";
  const expertReasoning = removeContradictedReasoning(input, stringArrayValue(expert.reasoning, []));
  const expertStarter = stringValue(expert.recommendedStarter, "");
  const recommendedStarter = forceNonRecommended
    ? "なし（家庭向け非推奨）"
    : expertHardNonRecommended && !ruleHardNonRecommended
      ? ruleResult.recommendedStarter
      : expertStarter === "なし（家庭向け非推奨）" || !expertStarter
        ? ruleResult.recommendedStarter
        : expertStarter as FermentationDesignOutput["recommendedStarter"];

  return {
    proposalName: expertHardNonRecommended && !ruleHardNonRecommended ? ruleResult.proposalName : stringValue(expert.proposalName, ruleResult.proposalName),
    recommendedStarter,
    recommendedTemperature: stringValue(expert.recommendedTemperature, ruleResult.recommendedTemperature),
    recommendedHumidity: stringValue(expert.recommendedHumidity, ruleResult.recommendedHumidity),
    recommendedDuration: stringValue(expert.recommendedDuration, ruleResult.recommendedDuration),
    expectedTaste: stringValue(expert.expectedTaste, ruleResult.expectedTaste),
    expectedAroma: stringValue(expert.expectedAroma, ruleResult.expectedAroma),
    expectedTexture: stringValue(expert.expectedTexture, ruleResult.expectedTexture),
    similarity: stringValue(expert.similarity, ruleResult.similarity),
    successLikelihood: dangerLevel === "非常に高い" ? "低い" : successValue(expert.successLikelihood, ruleResult.successLikelihood),
    dangerLevel,
    emojiRating,
    subIngredientSuggestions: subIngredientSuggestionsValue(input, expert.subIngredientSuggestions, ruleResult.subIngredientSuggestions),
    reasoning: unionStrings(ruleResult.reasoning, expertReasoning),
    safetyNotice: `${ruleResult.safetyNotice} ${filteredExpertSafetyNotice(input, expert.safetyNotice)}`.trim(),
  };
}

function fallbackErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error)) return String(error);
  if (error.message === "CODEX_APP_SERVER_URL is not set.") return undefined;
  return error.message;
}

export async function evaluateLabWithExpert(input: FermentationInput): Promise<ExpertApiResponse<FermentationEvaluation>> {
  const ruleResult = evaluateFermentationPlan(input);

  try {
    const expert = await callCodexAppServerJson<FermentationEvaluation>({
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
    });

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
        message: "発酵専門家AIは未接続です。ローカルルールで評価しました。",
        error: fallbackErrorMessage(error),
      },
    };
  }
}

export async function designWithExpert(input: FermentationDesignInput): Promise<ExpertApiResponse<FermentationDesignOutput>> {
  const ruleResult = designFermentationPlan(input);

  try {
    const expert = await callCodexAppServerJson<FermentationDesignOutput>({
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
    });

    return {
      result: mergeDesignOutput(input, ruleResult, expert),
      expertMode: {
        source: "codex-app-server",
        message: "発酵専門家AIの提案を適用しました。危険度はルール側を優先しています。",
      },
    };
  } catch (error) {
    return {
      result: ruleResult,
      expertMode: {
        source: "rule-fallback",
        message: "発酵専門家AIは未接続です。ローカルルールで提案しました。",
        error: fallbackErrorMessage(error),
      },
    };
  }
}
