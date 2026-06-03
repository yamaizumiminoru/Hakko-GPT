import { starterOptions } from "@/types/fermentation";
import type { Difficulty, EmojiRating, Starter } from "@/types/fermentation";
import type {
  DangerLevel,
  FermentationDesignInput,
  FermentationDesignOutput,
  SuccessLikelihood,
  SubIngredientSuggestion,
} from "@/types/design";

type IngredientCategory =
  | "bean"
  | "grain"
  | "vegetable"
  | "fruit"
  | "dairy"
  | "meat"
  | "fish"
  | "oilRisk"
  | "spice"
  | "starchy"
  | "sugary";

type StarterCandidate = {
  starter: Starter;
  score: number;
  dangerPenalty: number;
  reasons: string[];
};

const SAFETY_NOTICE =
  "この提案は発酵設計の仮説生成です。食用可否や安全性を保証しません。実作する場合は衛生管理、pH、温度、塩分、水分活性を測定し、危険が疑われる場合は食べずに廃棄してください。";

const categoryTerms: Record<IngredientCategory, string[]> = {
  bean: ["豆", "大豆", "ひよこ豆", "レンズ豆", "小豆", "黒豆", "えんどう豆"],
  grain: ["米", "麦", "小麦", "玄米", "もち米", "オーツ", "雑穀", "とうもろこし"],
  vegetable: ["野菜", "白菜", "大根", "きゅうり", "胡瓜", "人参", "にんじん", "キャベツ", "なす", "玉ねぎ", "トマト"],
  fruit: ["果物", "バナナ", "りんご", "林檎", "柚子", "ゆず", "レモン", "スイカ", "ぶどう", "葡萄", "みかん", "桃", "梨", "いちご"],
  dairy: ["牛乳", "乳", "ヨーグルト", "チーズ", "生クリーム", "バター"],
  meat: ["肉", "牛", "豚", "鶏", "ラム", "ベーコン", "ハム", "ソーセージ"],
  fish: ["魚", "鮭", "鯖", "サバ", "鰯", "イワシ", "牡蠣", "貝", "刺身", "海老", "エビ", "イカ", "タコ"],
  oilRisk: ["にんにくオイル", "ガーリックオイル", "オイル漬け", "油漬け"],
  spice: ["柚子", "ゆず", "唐辛子", "山椒", "生姜", "しょうが", "にんにく", "ニンニク", "ハーブ"],
  starchy: ["米", "麦", "小麦", "芋", "じゃがいも", "さつまいも", "とうもろこし"],
  sugary: ["砂糖", "蜂蜜", "はちみつ", "シロップ", "果汁", "バナナ", "りんご", "ぶどう", "甘酒"],
};

const starterBase: Record<
  Starter,
  {
    temperature: string;
    humidity: string;
    duration: string;
    similarity: string;
    taste: string;
    aroma: string;
    texture: string;
  }
> = {
  米麹: {
    temperature: "甘味目的は55〜60℃、調味料・旨味目的は20〜25℃",
    humidity: "乾燥を避け、清潔な容器内で水分を保つ",
    duration: "甘酒系は6〜12時間、塩麹・ペースト系は1〜2週間",
    similarity: "甘酒、塩麹、味噌、醤油麹",
    taste: "甘みと旨味が出やすく、塩を加えると調味料らしい輪郭が出る。",
    aroma: "米麹由来の穏やかな甘い香り、熟成時は味噌様の香り。",
    texture: "粥状、ペースト状、またはなめらかなソース状。",
  },
  麦麹: {
    temperature: "20〜25℃",
    humidity: "乾燥を避ける",
    duration: "1〜2週間から数か月",
    similarity: "麦味噌、麦麹漬け、醤油麹",
    taste: "香ばしさと旨味が出やすく、甘みは米麹より穀物感がある。",
    aroma: "麦の香ばしさ、味噌様の熟成香。",
    texture: "粒感のあるペースト、またはもろみ状。",
  },
  豆麹: {
    temperature: "15〜25℃",
    humidity: "乾燥を避ける",
    duration: "数週間〜数か月",
    similarity: "豆味噌、豆鼓、醤油もろみ",
    taste: "強い旨味、苦味、熟成感が出やすい。",
    aroma: "濃い味噌様、豆由来の熟成香。",
    texture: "濃厚なペースト、粒感のあるもろみ状。",
  },
  酵母: {
    temperature: "20〜30℃",
    humidity: "液体や生地の水分を保つ",
    duration: "数時間〜数日",
    similarity: "パン種、果実酒、微炭酸飲料",
    taste: "糖が減り、軽い酸味、炭酸感、アルコール感が出る可能性。",
    aroma: "果実様、パン様、発酵酒様の香り。",
    texture: "液体は発泡し、生地は気泡が出る。",
  },
  乳酸菌: {
    temperature: "20〜40℃",
    humidity: "素材が乾かない状態",
    duration: "半日〜数日",
    similarity: "漬物、キムチ、ヨーグルト",
    taste: "酸味と軽い旨味が中心。塩分があると漬物らしい味になる。",
    aroma: "爽やかな酸味、乳酸発酵香、素材由来の香り。",
    texture: "野菜はしんなり、乳系はとろみや凝固が出る可能性。",
  },
  酢酸菌: {
    temperature: "25〜30℃",
    humidity: "液面の乾燥を避ける",
    duration: "数日〜数週間",
    similarity: "酢、コンブチャ、ビネガー",
    taste: "鋭い酸味。基質によって甘みや苦味が残る。",
    aroma: "酢酸由来のビネガー香。",
    texture: "液体主体。表面に膜ができることがある。",
  },
  納豆菌: {
    temperature: "38〜42℃",
    humidity: "乾燥しない高めの湿度",
    duration: "18〜24時間",
    similarity: "納豆",
    taste: "豆類では強い旨味、軽い苦味、アルカリ寄りの味。",
    aroma: "納豆様、アンモニア様の強い香り。",
    texture: "豆類では糸引きと粘りが出る。",
  },
  テンペ菌: {
    temperature: "30〜32℃",
    humidity: "高め",
    duration: "24〜48時間",
    similarity: "テンペ",
    taste: "ナッツ様の旨味、豆の丸み。",
    aroma: "きのこ様、ナッツ様の穏やかな香り。",
    texture: "菌糸で固まり、ケーキ状にまとまる。",
  },
  ぬか床: {
    temperature: "15〜25℃",
    humidity: "ぬか床のしっとり感を維持",
    duration: "数時間〜数日",
    similarity: "ぬか漬け",
    taste: "塩味、酸味、ぬか由来の旨味。",
    aroma: "ぬか床らしい乳酸発酵香と米ぬか香。",
    texture: "野菜がしんなりし、歯切れは残る。",
  },
  その他: {
    temperature: "スターター特性が明確になるまで短時間・低リスク条件に限定",
    humidity: "過湿と乾燥を避ける",
    duration: "短時間の観察に留める",
    similarity: "スターター特定後に判断",
    taste: "スターター不明のため予想精度は低い。",
    aroma: "未知の微生物相に依存し、異臭リスクが高い。",
    texture: "素材と微生物相に依存する。",
  },
};

export const designSampleInputs: FermentationDesignInput[] = [
  {
    mainIngredient: "ひよこ豆",
    subIngredients: "柚子",
    purpose: "調味料",
    preference: "旨味強め",
    difficulty: "初心者",
    suggestSubIngredients: true,
  },
  {
    mainIngredient: "白菜",
    subIngredients: "唐辛子、にんにく",
    purpose: "おかず",
    preference: "酸っぱめ",
    difficulty: "初心者",
    suggestSubIngredients: true,
  },
  {
    mainIngredient: "米",
    subIngredients: "",
    purpose: "甘味",
    preference: "甘め",
    difficulty: "初心者",
    suggestSubIngredients: true,
  },
  {
    mainIngredient: "大豆",
    subIngredients: "",
    purpose: "おかず",
    preference: "旨味強め",
    difficulty: "中級者",
    suggestSubIngredients: true,
  },
  {
    mainIngredient: "魚",
    subIngredients: "",
    purpose: "保存食",
    preference: "旨味強め",
    difficulty: "初心者",
    suggestSubIngredients: false,
  },
];

function allText(input: FermentationDesignInput): string {
  return `${input.mainIngredient} ${input.subIngredients} ${input.purpose} ${input.preference}`;
}

function termMatches(text: string, term: string): boolean {
  if (term === "イカ") return text.replaceAll("スイカ", "").includes(term);
  return text.includes(term);
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => termMatches(text, term));
}

function categoriesFor(input: FermentationDesignInput): Set<IngredientCategory> {
  const text = allText(input);
  const categories = new Set<IngredientCategory>();

  for (const [category, terms] of Object.entries(categoryTerms) as [IngredientCategory, string[]][]) {
    if (hasAny(text, terms)) categories.add(category);
  }

  return categories;
}

function hasPurpose(input: FermentationDesignInput, term: string): boolean {
  return input.purpose.includes(term) || input.preference.includes(term);
}

function pushReason(candidate: StarterCandidate, condition: boolean, score: number, reason: string) {
  if (!condition) return;
  candidate.score += score;
  candidate.reasons.push(reason);
}

function candidateFor(starter: Starter, input: FermentationDesignInput, categories: Set<IngredientCategory>): StarterCandidate {
  const candidate: StarterCandidate = {
    starter,
    score: 35,
    dangerPenalty: 0,
    reasons: [],
  };

  if (starter === "米麹") {
    pushReason(candidate, categories.has("grain") || categories.has("bean") || categories.has("starchy"), 26, "穀物・豆・でんぷん質と麹の相性がよい。");
    pushReason(candidate, hasPurpose(input, "甘"), 22, "甘味目的なら糖化による甘酒方向に設計しやすい。");
    pushReason(candidate, hasPurpose(input, "調味料") || hasPurpose(input, "旨味"), 18, "調味料・旨味目的なら塩麹や味噌方向に展開しやすい。");
    pushReason(candidate, input.difficulty === "初心者", 6, "米麹は短時間の甘酒や塩麹として観察しやすい。");
  }

  if (starter === "麦麹") {
    pushReason(candidate, categories.has("grain") || categories.has("bean"), 22, "穀物・豆と合わせると香ばしい調味料にしやすい。");
    pushReason(candidate, hasPurpose(input, "旨味") || hasPurpose(input, "調味料"), 17, "旨味や調味料目的に向く。");
    pushReason(candidate, hasPurpose(input, "甘"), -8, "甘味目的では米麹のほうが扱いやすい。");
  }

  if (starter === "豆麹") {
    pushReason(candidate, categories.has("bean"), 26, "豆類の強い旨味設計に向く。");
    pushReason(candidate, hasPurpose(input, "旨味") || hasPurpose(input, "保存"), 18, "熟成・保存・旨味目的に合う。");
    pushReason(candidate, input.difficulty === "初心者", -12, "豆麹は熟成寄りで初心者には管理項目が多い。");
  }

  if (starter === "酵母") {
    pushReason(candidate, categories.has("fruit") || categories.has("sugary") || categories.has("grain"), 26, "糖を含む素材は酵母の基質になりやすい。");
    pushReason(candidate, hasPurpose(input, "香り") || hasPurpose(input, "実験"), 13, "香りや発泡感を狙う実験に向く。");
    pushReason(candidate, hasPurpose(input, "甘"), -8, "甘味を残したい場合は糖が消費されやすい。");
  }

  if (starter === "乳酸菌") {
    pushReason(candidate, categories.has("vegetable") || categories.has("dairy") || categories.has("sugary"), 26, "野菜・乳・糖を含む素材と乳酸発酵の相性がよい。");
    pushReason(candidate, hasPurpose(input, "おかず") || hasPurpose(input, "保存") || hasPurpose(input, "酸っぱ"), 22, "おかず・保存・酸味目的に向く。");
    pushReason(candidate, input.difficulty === "初心者", 8, "短期間で変化が見えやすい。");
  }

  if (starter === "酢酸菌") {
    pushReason(candidate, allText(input).includes("酒") || allText(input).includes("アルコール"), 30, "酢酸菌にはアルコール基質が必要。");
    pushReason(candidate, hasPurpose(input, "酸っぱ") || hasPurpose(input, "酢"), 14, "酢やビネガー方向の酸味目的に合う。");
    pushReason(candidate, !allText(input).includes("酒") && !allText(input).includes("アルコール"), -24, "アルコール基質が見えないため成立条件が弱い。");
  }

  if (starter === "納豆菌") {
    pushReason(candidate, categories.has("bean"), 34, "豆類なら納豆方向の設計が成立しやすい。");
    pushReason(candidate, hasPurpose(input, "おかず") || hasPurpose(input, "旨味"), 15, "おかず・旨味目的に合う。");
    pushReason(candidate, categories.has("fruit") || categories.has("sugary"), -35, "果物や糖分過多素材とは風味相性が悪い。");
    pushReason(candidate, input.difficulty === "初心者", -6, "温度と通気の管理が必要。");
  }

  if (starter === "テンペ菌") {
    pushReason(candidate, categories.has("bean") || categories.has("grain"), 28, "豆類・穀物ならテンペ方向に設計しやすい。");
    pushReason(candidate, hasPurpose(input, "おかず") || hasPurpose(input, "旨味"), 14, "食材としてのおかず化に向く。");
    pushReason(candidate, input.difficulty === "初心者", -8, "通気と菌糸形成の管理が必要。");
  }

  if (starter === "ぬか床") {
    pushReason(candidate, categories.has("vegetable"), 32, "野菜ならぬか漬け方向が自然。");
    pushReason(candidate, hasPurpose(input, "おかず") || hasPurpose(input, "保存"), 16, "日常のおかず・短期保存に向く。");
    pushReason(candidate, !categories.has("vegetable"), -18, "野菜以外ではぬか床の強みが出にくい。");
  }

  if (starter === "その他") {
    candidate.score -= 35;
    candidate.dangerPenalty += 20;
    candidate.reasons.push("スターター未特定は再現性と安全設計が弱い。");
  }

  if (categories.has("meat") || categories.has("fish")) {
    candidate.score -= 50;
    candidate.dangerPenalty += 60;
  }
  if (categories.has("oilRisk")) {
    candidate.score -= 45;
    candidate.dangerPenalty += 60;
  }
  if (categories.has("dairy") && (hasPurpose(input, "保存") || input.difficulty === "初心者")) {
    candidate.dangerPenalty += 20;
  }

  return candidate;
}

function proposalName(input: FermentationDesignInput, starter: Starter | "なし（家庭向け非推奨）"): string {
  const main = input.mainIngredient.trim() || "未指定素材";
  const firstSub = input.subIngredients.trim().split(/[、,\s]+/).filter(Boolean)[0] ?? "";
  const prefix = firstSub ? `${firstSub}${main}` : main;

  if (starter === "なし（家庭向け非推奨）") return `${prefix}発酵案（非推奨）`;
  if (starter === "米麹" && hasPurpose(input, "甘")) return `${prefix}甘酒`;
  if (starter === "米麹" || starter === "麦麹" || starter === "豆麹") return `${prefix}${starter.replace("麹", "")}麹ペースト`;
  if (starter === "乳酸菌") return `${prefix}乳酸発酵`;
  if (starter === "酵母") return `${prefix}酵母発酵`;
  if (starter === "酢酸菌") return `${prefix}ビネガー発酵`;
  if (starter === "納豆菌") return `${prefix}納豆`;
  if (starter === "テンペ菌") return `${prefix}テンペ`;
  if (starter === "ぬか床") return `${prefix}ぬか漬け`;
  return `${prefix}発酵プロトタイプ`;
}

function dangerLevel(categories: Set<IngredientCategory>, candidate: StarterCandidate): DangerLevel {
  if (categories.has("meat") || categories.has("fish") || categories.has("oilRisk") || candidate.dangerPenalty >= 60) return "非常に高い";
  if (candidate.dangerPenalty >= 35 || candidate.score < 35) return "高";
  if (candidate.dangerPenalty >= 15 || candidate.score < 58) return "中";
  return "低";
}

function successLikelihood(score: number, danger: DangerLevel): SuccessLikelihood {
  if (danger === "非常に高い" || danger === "高" || score < 45) return "低い";
  if (score >= 76) return "高い";
  return "中程度";
}

function emojiRating(success: SuccessLikelihood, danger: DangerLevel): EmojiRating {
  if (danger === "非常に高い") return "🤮 安全リスクが高く非推奨";
  if (danger === "高" || success === "低い") return "🤢 風味・失敗リスク高め";
  if (success === "高い" && danger === "低") return "😋 有望";
  return "😐 条件次第";
}

function overrideProfileForPurpose(starter: Starter, input: FermentationDesignInput) {
  const profile = starterBase[starter];

  if (starter === "米麹" && hasPurpose(input, "甘")) {
    return {
      ...profile,
      temperature: "55〜60℃",
      humidity: "通常の容器内水分で管理",
      duration: "6〜12時間",
      taste: "でんぷんの糖化による自然な甘みが中心。",
      texture: "粥状からなめらかな甘いペースト状。",
    };
  }

  return profile;
}

function suggestion(name: string, reason: string, caution?: string): SubIngredientSuggestion {
  return caution ? { name, reason, caution } : { name, reason };
}

function hasUserSubIngredient(input: FermentationDesignInput, name: string): boolean {
  return input.subIngredients.includes(name);
}

function addSuggestion(
  suggestions: SubIngredientSuggestion[],
  input: FermentationDesignInput,
  name: string,
  reason: string,
  caution?: string,
) {
  if (hasUserSubIngredient(input, name)) return;
  if (suggestions.some((item) => item.name === name)) return;
  suggestions.push(suggestion(name, reason, caution));
}

function suggestSubIngredientsFor(
  input: FermentationDesignInput,
  categories: Set<IngredientCategory>,
  starter: Starter | "なし（家庭向け非推奨）",
): SubIngredientSuggestion[] {
  if (!input.suggestSubIngredients || starter === "なし（家庭向け非推奨）") return [];

  const suggestions: SubIngredientSuggestion[] = [];

  if (input.preference === "旨味強め" || input.purpose === "調味料" || input.purpose === "旨味") {
    addSuggestion(suggestions, input, "昆布", "グルタミン酸系の旨味を補いやすい。", "長期常温ではなく、塩分やpHの管理を前提にする。");
    addSuggestion(suggestions, input, "干し椎茸", "核酸系の旨味と熟成香を足しやすい。");
    if (categories.has("bean")) addSuggestion(suggestions, input, "麦麹", "豆の旨味に香ばしさと甘みを重ねやすい。");
  }

  if (input.preference === "酸っぱめ" || input.preference === "さっぱり" || input.purpose === "酸味") {
    addSuggestion(suggestions, input, "柚子", "酸味と香りを足し、発酵臭を軽く見せやすい。");
    addSuggestion(suggestions, input, "レモン", "酸味の方向性を明確にできる。", "酸味があっても安全なpHとは限らないため測定が必要。");
    if (categories.has("vegetable")) addSuggestion(suggestions, input, "唐辛子", "漬物・キムチ方向の香味を作りやすい。");
  }

  if (input.preference === "香り強め" || input.purpose === "香り") {
    addSuggestion(suggestions, input, "生姜", "清涼感と辛みで香りの輪郭を作りやすい。");
    addSuggestion(suggestions, input, "山椒", "少量で発酵香に立体感を加えやすい。");
    addSuggestion(suggestions, input, "柚子皮", "柑橘のトップノートを加えやすい。");
  }

  if (input.preference === "甘め" || input.purpose === "甘味") {
    addSuggestion(suggestions, input, "米麹", "糖化による自然な甘みを作りやすい。");
    addSuggestion(suggestions, input, "もち米", "甘酒方向の濃い甘みと粘度を出しやすい。");
    addSuggestion(suggestions, input, "りんご", "果実香とやわらかな甘みを足せる。", "酵母発酵では糖が消費され、アルコールやガスが出る可能性がある。");
  }

  if (input.preference === "塩辛め" || input.purpose === "保存食") {
    addSuggestion(suggestions, input, "塩", "塩分設計を明確にし、雑菌リスクを下げる方向に働く。", "塩を足すだけで安全が保証されるわけではない。");
    addSuggestion(suggestions, input, "昆布", "塩味の角を和らげながら旨味を足せる。");
  }

  if (input.preference === "発泡感") {
    addSuggestion(suggestions, input, "りんご果汁", "酵母の糖源になり、香りと発泡感を狙いやすい。", "密閉時はガス圧に注意。");
    addSuggestion(suggestions, input, "砂糖", "発泡を狙う糖源として扱いやすい。", "アルコール生成とガス圧に注意。");
  }

  if (input.preference === "まろやか") {
    addSuggestion(suggestions, input, "米麹", "甘みと酵素分解で味を丸くしやすい。");
    addSuggestion(suggestions, input, "白味噌", "短時間の調味料案として丸みと旨味を補える。", "既製味噌を加える場合も安全管理は別途必要。");
  }

  return suggestions.slice(0, 4);
}

export function designFermentationPlan(input: FermentationDesignInput): FermentationDesignOutput {
  const categories = categoriesFor(input);
  const candidates = starterOptions
    .filter((starter) => starter !== "その他")
    .map((starter) => candidateFor(starter, input, categories))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0] ?? candidateFor("その他", input, categories);
  const danger = dangerLevel(categories, best);
  const recommendedStarter: Starter | "なし（家庭向け非推奨）" =
    danger === "非常に高い" ? "なし（家庭向け非推奨）" : best.starter;
  const success = successLikelihood(best.score, danger);
  const rating = emojiRating(success, danger);
  const profile = recommendedStarter === "なし（家庭向け非推奨）" ? starterBase.その他 : overrideProfileForPurpose(recommendedStarter, input);
  const subIngredientSuggestions = suggestSubIngredientsFor(input, categories, recommendedStarter);
  const reasoning = [...best.reasons];

  if (categories.has("meat") || categories.has("fish")) {
    reasoning.unshift("肉または魚を含むため、家庭向けの発酵スターター推薦より安全警告を優先。");
  }
  if (categories.has("oilRisk")) {
    reasoning.unshift("油脂・嫌気・低酸性になりやすい条件のため、ボツリヌス菌リスクを強く警告。");
  }
  if (reasoning.length === 0) {
    reasoning.push("材料カテゴリとの明確な一致が弱いため、低リスクな短時間試作として扱う。");
  }

  return {
    proposalName: proposalName(input, recommendedStarter),
    recommendedStarter,
    recommendedTemperature: profile.temperature,
    recommendedHumidity: profile.humidity,
    recommendedDuration: profile.duration,
    expectedTaste: profile.taste,
    expectedAroma: profile.aroma,
    expectedTexture: profile.texture,
    similarity: profile.similarity,
    successLikelihood: success,
    dangerLevel: danger,
    emojiRating: rating,
    subIngredientSuggestions,
    reasoning,
    safetyNotice: SAFETY_NOTICE,
  };
}
