export const starterOptions = [
  "米麹",
  "麦麹",
  "豆麹",
  "酵母",
  "乳酸菌",
  "酢酸菌",
  "納豆菌",
  "テンペ菌",
  "ぬか床",
  "その他",
] as const;

export type Starter = (typeof starterOptions)[number];

export const difficultyOptions = ["初心者", "中級者", "上級者"] as const;

export type Difficulty = (typeof difficultyOptions)[number];

export type EmojiRating =
  | "😋 有望"
  | "😐 条件次第"
  | "🤢 風味・失敗リスク高め"
  | "🤮 安全リスクが高く非推奨";

export type FermentationInput = {
  mainIngredient: string;
  subIngredients: string;
  starter: Starter;
  purpose: string;
  preference: string;
  difficulty: Difficulty;
  temperatureC: number;
  humidity: number;
  duration: string;
  saltPercent: number;
  sealed: boolean;
  cooked: boolean;
};

export type RecommendedConditions = {
  temperature: string;
  humidity: string;
  duration: string;
  salt: string;
  oxygen: string;
};

export type FermentationEvaluation = {
  emojiRating: EmojiRating;
  proposalName: string;
  similarity: string;
  recommendedStarter: string;
  recommendedConditions: RecommendedConditions;
  expectedTaste: string;
  expectedAroma: string;
  expectedTexture: string;
  mechanism: string;
  risks: string[];
  improvements: string[];
  safetyNotice: string;
};
