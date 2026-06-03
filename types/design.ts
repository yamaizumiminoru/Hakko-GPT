import type { Difficulty, EmojiRating, Starter } from "@/types/fermentation";

export const designPurposeOptions = [
  "おかず",
  "調味料",
  "保存食",
  "実験",
  "甘味",
  "旨味",
  "酸味",
  "香り",
] as const;

export type DesignPurpose = (typeof designPurposeOptions)[number];

export const designPreferenceOptions = [
  "甘め",
  "塩辛め",
  "酸っぱめ",
  "旨味強め",
  "香り強め",
  "発泡感",
  "まろやか",
  "さっぱり",
] as const;

export type DesignPreference = (typeof designPreferenceOptions)[number];

export type FermentationDesignInput = {
  mainIngredient: string;
  subIngredients: string;
  purpose: DesignPurpose;
  preference: DesignPreference;
  difficulty: Difficulty;
  suggestSubIngredients: boolean;
};

export type SuccessLikelihood = "高い" | "中程度" | "低い";

export type DangerLevel = "低" | "中" | "高" | "非常に高い";

export type SubIngredientSuggestion = {
  name: string;
  reason: string;
  caution?: string;
};

export type FermentationDesignOutput = {
  proposalName: string;
  recommendedStarter: Starter | "なし（家庭向け非推奨）";
  recommendedTemperature: string;
  recommendedHumidity: string;
  recommendedDuration: string;
  expectedTaste: string;
  expectedAroma: string;
  expectedTexture: string;
  similarity: string;
  successLikelihood: SuccessLikelihood;
  dangerLevel: DangerLevel;
  emojiRating: EmojiRating;
  subIngredientSuggestions: SubIngredientSuggestion[];
  reasoning: string[];
  safetyNotice: string;
};
