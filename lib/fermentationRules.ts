import type {
  EmojiRating,
  FermentationEvaluation,
  FermentationInput,
  RecommendedConditions,
  Starter,
} from "@/types/fermentation";

const KOJI_STARTERS: Starter[] = ["米麹", "麦麹", "豆麹"];

const SAFETY_NOTICE =
  "この評価は発酵設計の仮説生成であり、食用可否や安全性を保証しません。実作では衛生管理、pH、温度、塩分、水分活性を測定し、不安がある場合は廃棄または専門家に確認してください。";

const ingredientGroups = {
  meat: ["肉", "牛", "豚", "鶏", "ラム", "ベーコン", "ハム", "ソーセージ"],
  fish: ["魚", "鮭", "鯖", "サバ", "鰯", "イワシ", "牡蠣", "貝", "刺身", "海老", "エビ", "イカ", "タコ"],
  dairy: ["牛乳", "乳", "ヨーグルト", "チーズ", "生クリーム", "バター"],
  beans: ["豆", "大豆", "ひよこ豆", "レンズ豆", "小豆", "黒豆"],
  grains: ["米", "麦", "小麦", "オーツ", "粟", "雑穀"],
  vegetables: ["野菜", "白菜", "大根", "きゅうり", "人参", "にんじん", "キャベツ", "なす", "芋", "じゃがいも", "さつまいも"],
  fruits: ["果物", "バナナ", "りんご", "柚子", "ゆず", "ぶどう", "みかん", "桃", "梨"],
  sugary: ["砂糖", "はちみつ", "蜂蜜", "シロップ", "果汁", "甘酒", "バナナ", "りんご"],
  oilRisk: ["にんにくオイル", "ガーリックオイル", "にんにく 油", "ニンニク 油", "オイル漬け"],
  mold: ["カビ", "黴", "白カビ", "青カビ", "黒カビ"],
  wild: ["野生発酵", "天然発酵", "自然発酵", "スターターなし"],
};

export const sampleInputs: FermentationInput[] = [
  {
    mainIngredient: "ひよこ豆",
    subIngredients: "柚子",
    starter: "米麹",
    purpose: "調味料",
    preference: "旨味強め",
    difficulty: "初心者",
    temperatureC: 24,
    humidity: 60,
    duration: "10日",
    saltPercent: 8,
    sealed: false,
    cooked: true,
  },
  {
    mainIngredient: "バナナ",
    subIngredients: "",
    starter: "納豆菌",
    purpose: "実験",
    preference: "香り強め",
    difficulty: "中級者",
    temperatureC: 40,
    humidity: 70,
    duration: "24時間",
    saltPercent: 0,
    sealed: false,
    cooked: false,
  },
  {
    mainIngredient: "大豆",
    subIngredients: "",
    starter: "納豆菌",
    purpose: "おかず",
    preference: "旨味強め",
    difficulty: "初心者",
    temperatureC: 40,
    humidity: 75,
    duration: "24時間",
    saltPercent: 0,
    sealed: false,
    cooked: true,
  },
  {
    mainIngredient: "米",
    subIngredients: "",
    starter: "米麹",
    purpose: "甘味",
    preference: "甘め",
    difficulty: "初心者",
    temperatureC: 58,
    humidity: 60,
    duration: "8時間",
    saltPercent: 0,
    sealed: false,
    cooked: true,
  },
  {
    mainIngredient: "魚",
    subIngredients: "",
    starter: "乳酸菌",
    purpose: "保存食",
    preference: "酸っぱめ",
    difficulty: "中級者",
    temperatureC: 25,
    humidity: 80,
    duration: "7日",
    saltPercent: 2,
    sealed: true,
    cooked: false,
  },
];

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => {
    if (term === "イカ") return text.replaceAll("スイカ", "").includes(term);
    return text.includes(term);
  });
}

function isKojiStarter(starter: Starter): starter is "米麹" | "麦麹" | "豆麹" {
  return KOJI_STARTERS.includes(starter);
}

function allText(input: FermentationInput): string {
  return `${input.mainIngredient} ${input.subIngredients} ${input.purpose} ${input.preference}`;
}

function parseDurationHours(duration: string): number {
  const normalized = duration.replace(/\s/g, "");
  const firstNumber = normalized.match(/\d+(?:\.\d+)?/);
  const value = firstNumber ? Number(firstNumber[0]) : 0;

  if (!value) return 0;
  if (normalized.includes("年")) return value * 365 * 24;
  if (normalized.includes("ヶ月") || normalized.includes("か月") || normalized.includes("月")) return value * 30 * 24;
  if (normalized.includes("週間") || normalized.includes("週")) return value * 7 * 24;
  if (normalized.includes("日")) return value * 24;
  if (normalized.includes("時間") || normalized.includes("h")) return value;
  return value;
}

function isRoomTemperatureLong(input: FermentationInput): boolean {
  const hours = parseDurationHours(input.duration);
  return input.temperatureC >= 15 && input.temperatureC <= 35 && hours >= 72;
}

function isHighWater(text: string): boolean {
  return (
    includesAny(text, ingredientGroups.vegetables) ||
    includesAny(text, ingredientGroups.fruits) ||
    includesAny(text, ingredientGroups.dairy) ||
    includesAny(text, ingredientGroups.meat) ||
    includesAny(text, ingredientGroups.fish)
  );
}

function ratingFromScore(score: number, forceDanger: boolean): EmojiRating {
  if (forceDanger) return "🤮 安全リスクが高く非推奨";
  if (score >= 75) return "😋 有望";
  if (score >= 50) return "😐 条件次第";
  return "🤢 風味・失敗リスク高め";
}

function listToSentence(items: string[]): string {
  return items.join("。") + "。";
}

function hasPurpose(input: FermentationInput, term: string): boolean {
  return input.purpose.includes(term) || input.preference.includes(term);
}

function getRecommendedConditions(input: FermentationInput): RecommendedConditions {
  if (isKojiStarter(input.starter)) {
    if (hasPurpose(input, "甘") || (input.mainIngredient.includes("米") && input.temperatureC >= 50)) {
      return {
        temperature: "55〜60℃",
        humidity: "通常の容器内水分で管理",
        duration: "6〜12時間",
        salt: "甘酒系は無塩。ただし短時間で温度管理する",
        oxygen: "密閉しすぎず、清潔な容器で保温",
      };
    }

    if (hasPurpose(input, "保存") || hasPurpose(input, "旨味")) {
      return {
        temperature: "15〜25℃",
        humidity: "乾燥を避ける",
        duration: "3か月〜1年",
        salt: "味噌系は10〜13%程度を目安",
        oxygen: "熟成中は過度な密閉を避ける",
      };
    }

    return {
      temperature: "20〜25℃",
      humidity: "乾燥を避ける",
      duration: "1〜2週間",
      salt: "塩麹・調味料系は8〜12%程度を目安",
      oxygen: "ガスが逃げる余地を残す",
    };
  }

  const conditionsByStarter: Record<Exclude<Starter, "米麹" | "麦麹" | "豆麹">, RecommendedConditions> = {
    酵母: {
      temperature: "20〜30℃",
      humidity: "液体または生地の水分を保つ",
      duration: "数時間〜数日",
      salt: "塩分は低〜中程度。糖源を確保",
      oxygen: "初期は酸素があると増殖しやすい。密閉時はガス抜き必須",
    },
    乳酸菌: {
      temperature: "20〜40℃",
      humidity: "材料が乾かない状態",
      duration: "半日〜数日",
      salt: "野菜漬けは2〜5%程度を検討",
      oxygen: "漬け込みでは空気を減らすが、清潔管理と酸生成の確認が重要",
    },
    酢酸菌: {
      temperature: "25〜30℃",
      humidity: "液面の乾燥を避ける",
      duration: "数日〜数週間",
      salt: "通常は無塩。アルコール基質が必要",
      oxygen: "好気性のため通気が必要",
    },
    納豆菌: {
      temperature: "38〜42℃",
      humidity: "乾燥しない高めの湿度",
      duration: "18〜24時間",
      salt: "発酵時は基本的に無塩",
      oxygen: "好気性。密閉せず通気を確保",
    },
    テンペ菌: {
      temperature: "30〜32℃",
      humidity: "高め",
      duration: "24〜48時間",
      salt: "発酵前に軽く酸性化し、塩分は控えめ",
      oxygen: "菌糸形成のため通気が必要",
    },
    ぬか床: {
      temperature: "15〜25℃",
      humidity: "ぬか床のしっとり感を維持",
      duration: "数時間〜数日",
      salt: "ぬか床側の塩分を保つ",
      oxygen: "毎日の攪拌と管理が必要",
    },
    その他: {
      temperature: "スターターの特性が明確になるまで低リスク条件に限定",
      humidity: "過湿と乾燥を避ける",
      duration: "短時間の観察に留める",
      salt: "安全設計がない低塩分長期発酵は避ける",
      oxygen: "使用する微生物の酸素要求性を確認",
    },
  };

  return conditionsByStarter[input.starter];
}

function buildProposalName(input: FermentationInput, forceDanger: boolean): string {
  const sub = input.subIngredients.trim().split(/[、,\s]+/).filter(Boolean)[0] ?? "";
  const main = input.mainIngredient.trim() || "未指定素材";
  const prefix = sub ? `${sub}${main}` : main;

  if (forceDanger) return `${prefix}${input.starter}発酵案（非推奨）`;
  if (isKojiStarter(input.starter) && hasPurpose(input, "甘")) return `${prefix}甘酒`;
  if (isKojiStarter(input.starter) && (hasPurpose(input, "調味料") || hasPurpose(input, "旨味"))) return `${prefix}麹ペースト`;
  if (input.starter === "納豆菌") return `${prefix}納豆`;
  if (input.starter === "テンペ菌") return `${prefix}テンペ`;
  if (input.starter === "乳酸菌") return `${prefix}乳酸発酵`;
  if (input.starter === "酢酸菌") return `${prefix}ビネガー発酵`;
  if (input.starter === "酵母") return `${prefix}酵母発酵`;
  if (input.starter === "ぬか床") return `${prefix}ぬか漬け`;
  return `${prefix}発酵プロトタイプ`;
}

function starterSimilarity(input: FermentationInput): string {
  if (isKojiStarter(input.starter)) {
    if (hasPurpose(input, "甘")) return "甘酒、麹シロップ";
    if (hasPurpose(input, "保存") || hasPurpose(input, "旨味")) return "味噌、醤油麹、熟成豆味噌";
    return "塩麹、味噌、醤油麹";
  }

  const similarity: Record<Exclude<Starter, "米麹" | "麦麹" | "豆麹">, string> = {
    酵母: "パン種、果実酒、微炭酸飲料",
    乳酸菌: "漬物、キムチ、ヨーグルト",
    酢酸菌: "酢、コンブチャ、ビネガー",
    納豆菌: "納豆",
    テンペ菌: "テンペ",
    ぬか床: "ぬか漬け",
    その他: "既存食品との対応はスターター特定後に判断",
  };

  return similarity[input.starter];
}

function recommendedStarter(input: FermentationInput, text: string): string {
  if (includesAny(text, ingredientGroups.fish) || includesAny(text, ingredientGroups.meat)) {
    return "家庭向けMVPでは非推奨。専門的な衛生設計と検査が必要です。";
  }
  if (input.starter === "納豆菌" && includesAny(text, ingredientGroups.fruits)) {
    return "納豆菌より、目的に応じて酵母または乳酸菌の短時間発酵を検討。";
  }
  if (input.starter === "酢酸菌" && !text.includes("酒") && !text.includes("アルコール")) {
    return "酢酸菌を使うならアルコール基質を明確にする。ない場合は乳酸菌や酵母が現実的です。";
  }
  return input.starter;
}

function buildSensory(input: FermentationInput): Pick<
  FermentationEvaluation,
  "expectedTaste" | "expectedAroma" | "expectedTexture" | "mechanism"
> {
  if (isKojiStarter(input.starter)) {
    const sweet = hasPurpose(input, "甘") || input.temperatureC >= 50;
    return {
      expectedTaste: sweet ? "でんぷんの糖化による自然な甘み。副材料があれば軽い酸味や香味が重なる。" : "甘み、塩味、旨味が中心。豆や穀物では味噌に近い厚みが出やすい。",
      expectedAroma: sweet ? "米麹由来の穏やかな甘い香り。" : "麹の栗様・穀物様の香りに、熟成が進むと味噌様の香ばしさ。",
      expectedTexture: sweet ? "粥状からなめらかなペースト状。" : "ペースト化するとまとまりやすく、熟成でややねっとりする。",
      mechanism: "麹酵素による糖化、タンパク質分解、旨味成分の生成。",
    };
  }

  if (input.starter === "酵母") {
    return {
      expectedTaste: "糖が減り、軽いアルコール感、炭酸感、酸味が出る可能性。",
      expectedAroma: "果実様、パン様、発酵酒様の香り。",
      expectedTexture: "液体では発泡、生地では膨らみや気泡。",
      mechanism: "酵母による糖代謝、アルコール・二酸化炭素生成。",
    };
  }

  if (input.starter === "乳酸菌") {
    return {
      expectedTaste: "酸味と軽い旨味。塩分があると漬物らしい輪郭。",
      expectedAroma: "乳酸発酵由来の爽やかな酸臭と素材香。",
      expectedTexture: "野菜はしんなり、乳系は凝固やとろみが出る可能性。",
      mechanism: "乳酸菌による酸生成、pH低下、軽い風味変化。",
    };
  }

  if (input.starter === "酢酸菌") {
    return {
      expectedTaste: "酢酸による鋭い酸味。基質由来の甘みや苦みが残る。",
      expectedAroma: "酢、コンブチャに近い揮発酸の香り。",
      expectedTexture: "液体主体。表面に膜状のバイオフィルムが出ることがある。",
      mechanism: "酢酸菌によるアルコールの酸化、酢酸生成。",
    };
  }

  if (input.starter === "納豆菌") {
    return {
      expectedTaste: "豆類では強い旨味と発酵由来の苦味。果物では不調和な甘苦さが出やすい。",
      expectedAroma: "アンモニア様、納豆様の強い香り。",
      expectedTexture: "豆類では粘質物が増え、糸引きが出る。",
      mechanism: "納豆菌によるタンパク質分解、粘質物生成、アルカリ化。",
    };
  }

  if (input.starter === "テンペ菌") {
    return {
      expectedTaste: "豆や穀物のナッツ様の旨味。酸味は控えめ。",
      expectedAroma: "きのこ様、ナッツ様の穏やかな香り。",
      expectedTexture: "菌糸で固まり、切れるケーキ状になる。",
      mechanism: "テンペ菌の菌糸形成、酵素による分解、豆類の一体化。",
    };
  }

  if (input.starter === "ぬか床") {
    return {
      expectedTaste: "塩味、酸味、ぬか由来の旨味。",
      expectedAroma: "ぬか床らしい乳酸発酵香と米ぬか香。",
      expectedTexture: "野菜はしんなりしつつ歯切れが残る。",
      mechanism: "ぬか床中の乳酸菌・酵母による酸生成と香味生成。",
    };
  }

  return {
    expectedTaste: "スターターが未特定のため予想精度は低い。",
    expectedAroma: "未知の微生物相に依存し、異臭リスクが高い。",
    expectedTexture: "素材の水分と微生物の増殖状態に依存。",
    mechanism: "スターター未特定のため、主要メカニズムは判断保留。",
  };
}

export function evaluateFermentationPlan(input: FermentationInput): FermentationEvaluation {
  const text = allText(input);
  const durationHours = parseDurationHours(input.duration);
  const risks: string[] = [];
  const improvements: string[] = [];
  let score = 58;
  let forceDanger = false;

  if (includesAny(text, ingredientGroups.meat) || includesAny(text, ingredientGroups.fish)) {
    forceDanger = true;
    score -= 45;
    risks.push("肉または魚を含むため、家庭的な常温発酵では病原菌・腐敗リスクが高い。");
    improvements.push("このMVPでは肉・魚の発酵案は非推奨。専門設備、低温管理、pH・塩分・水分活性の検査を前提にする。");
  }

  if (includesAny(text, ingredientGroups.dairy) && isRoomTemperatureLong(input)) {
    forceDanger = true;
    score -= 35;
    risks.push("乳製品の常温長期発酵は、pH低下が確認できない場合に安全リスクが高い。");
    improvements.push("乳酸菌スターター、短時間、温度管理、pH測定を必須条件にする。");
  }

  if (input.saltPercent < 3 && isHighWater(text) && isRoomTemperatureLong(input)) {
    score -= 35;
    risks.push("低塩分・高水分・常温長期の組み合わせで腐敗リスクが高い。");
    improvements.push("塩分を上げる、期間を短くする、低温管理にする、酸生成をpHで確認する。");
  }

  if (input.starter === "酵母" && input.sealed && durationHours >= 24) {
    score -= 35;
    risks.push("密閉状態で酵母発酵を長く行うとガス圧が上がり、容器破裂リスクがある。");
    improvements.push("耐圧容器を使わず、エアロックや定期的なガス抜きを設計する。");
  }

  if (includesAny(text, ingredientGroups.oilRisk) || (text.includes("にんにく") && text.includes("油"))) {
    forceDanger = true;
    score -= 45;
    risks.push("にんにくオイルのような嫌気・低酸性・油脂環境はボツリヌス菌リスクがある。");
    improvements.push("油脂環境での常温発酵を避け、酸性化と冷蔵を前提にしても家庭実験では慎重に扱う。");
  }

  if ((hasPurpose(input, "保存") || text.includes("長期保存")) && isRoomTemperatureLong(input) && input.saltPercent < 8) {
    score -= 25;
    risks.push("pH不明のまま常温長期保存を狙う設計は危険側に倒れやすい。");
    improvements.push("pHメーターで酸性化を確認し、保存目的なら塩分・温度・期間を保守的に設計する。");
  }

  if (includesAny(text, ingredientGroups.mold) && input.starter === "その他") {
    forceDanger = true;
    score -= 40;
    risks.push("カビを意図的に使うがスターターが明確でないため、毒素産生や汚染の判断ができない。");
    improvements.push("同定済みの食品用スターターだけを使い、野良カビは食用前提にしない。");
  }

  if (includesAny(text, ingredientGroups.wild) && input.starter === "その他") {
    score -= 35;
    risks.push("野生発酵を安全保証のように扱うことはできない。微生物相が不明で再現性も低い。");
    improvements.push("安全性が目的なら既知スターターを使い、pH・塩分・温度の測定値を記録する。");
  }

  if (isKojiStarter(input.starter)) {
    if (includesAny(text, [...ingredientGroups.beans, ...ingredientGroups.grains, ...ingredientGroups.vegetables])) score += 22;
    if (input.temperatureC >= 55 && input.temperatureC <= 60 && hasPurpose(input, "甘") && durationHours <= 14) score += 22;
    if (input.saltPercent >= 6 && input.saltPercent <= 13 && durationHours >= 24) score += 12;
    if (input.saltPercent < 3 && durationHours >= 48 && input.temperatureC >= 20 && input.temperatureC <= 35) {
      score -= 25;
      risks.push("麹系で低塩分・常温・長めの設計は雑菌増殖リスクが上がる。");
      improvements.push("甘酒系は55〜60℃の短時間、調味料系は塩分を十分に設計する。");
    }
  }

  if (input.starter === "酵母") {
    if (includesAny(text, [...ingredientGroups.sugary, ...ingredientGroups.fruits, ...ingredientGroups.grains])) score += 22;
    if (!includesAny(text, ingredientGroups.sugary) && !hasPurpose(input, "甘")) {
      score -= 10;
      risks.push("酵母の基質になる糖が少ない可能性がある。");
    }
  }

  if (input.starter === "乳酸菌") {
    if (includesAny(text, [...ingredientGroups.vegetables, ...ingredientGroups.dairy, ...ingredientGroups.sugary])) score += 20;
    if (durationHours >= 12 && input.temperatureC >= 20 && input.temperatureC <= 40) score += 8;
    risks.push("pH低下が不十分な場合は腐敗・安全リスクが残る。");
    improvements.push("酸味だけで判断せず、pH測定で酸生成を確認する。");
  }

  if (input.starter === "酢酸菌") {
    if (text.includes("酒") || text.includes("アルコール")) score += 24;
    if (input.sealed) {
      score -= 25;
      risks.push("酢酸菌は酸素を必要とするため、密閉では進みにくく別のリスクが出る。");
      improvements.push("清潔な通気条件を確保し、アルコール基質を明確にする。");
    }
  }

  if (input.starter === "納豆菌") {
    if (includesAny(text, ingredientGroups.beans) && input.cooked && input.temperatureC >= 38 && input.temperatureC <= 42 && durationHours >= 18 && durationHours <= 30 && !input.sealed) {
      score += 35;
    }
    if (!input.cooked && includesAny(text, ingredientGroups.beans)) {
      score -= 20;
      risks.push("豆類が未加熱だと納豆菌が入りにくく、衛生面でも不利。");
      improvements.push("豆類は十分に加熱し、清潔な状態で納豆菌を接種する。");
    }
    if (input.sealed) {
      score -= 25;
      risks.push("納豆菌は好気性のため、密閉すると狙った発酵が成立しにくい。");
      improvements.push("乾燥を防ぎつつ通気できる容器設計にする。");
    }
    if (includesAny(text, ingredientGroups.fruits) || includesAny(text, ingredientGroups.sugary)) {
      score -= 35;
      risks.push("納豆菌と果物・糖分過多素材は風味の相性が悪く、異臭・苦味が出やすい。");
      improvements.push("果物は酵母や乳酸菌の短時間発酵へ変更し、納豆菌は加熱済み豆類に使う。");
    }
  }

  if (input.starter === "テンペ菌") {
    if (includesAny(text, [...ingredientGroups.beans, ...ingredientGroups.grains]) && input.cooked && input.temperatureC >= 28 && input.temperatureC <= 34) score += 28;
    if (input.sealed) {
      score -= 28;
      risks.push("テンペ菌は好気性で、菌糸形成には通気が必要。");
      improvements.push("穴あき袋や薄い層など、清潔で通気のある形にする。");
    }
  }

  if (input.starter === "ぬか床") {
    if (includesAny(text, ingredientGroups.vegetables)) score += 22;
    if (!includesAny(text, ingredientGroups.vegetables)) {
      score -= 15;
      risks.push("ぬか床は野菜以外では狙った風味になりにくい。");
    }
    improvements.push("ぬか床は日々の攪拌、塩分調整、異臭やカビの観察を続ける。");
  }

  if (input.starter === "その他") {
    score -= 18;
    risks.push("スターターが不明確なため、発酵メカニズムと安全設計の不確実性が高い。");
    improvements.push("食品用として由来が明確なスターターを選び直す。");
  }

  if (input.difficulty === "初心者" && (durationHours >= 168 || input.starter === "その他")) {
    score -= 8;
    improvements.push("初心者向けには短時間で観察しやすい条件から始める。");
  }

  const uniqueRisks = [...new Set(risks)];
  const uniqueImprovements = [...new Set(improvements)];
  const sensory = buildSensory(input);

  return {
    emojiRating: ratingFromScore(score, forceDanger),
    proposalName: buildProposalName(input, forceDanger),
    similarity: starterSimilarity(input),
    recommendedStarter: recommendedStarter(input, text),
    recommendedConditions: getRecommendedConditions(input),
    expectedTaste: sensory.expectedTaste,
    expectedAroma: sensory.expectedAroma,
    expectedTexture: sensory.expectedTexture,
    mechanism: sensory.mechanism,
    risks: uniqueRisks.length ? uniqueRisks : ["現時点で重大なNG条件は検出されていないが、測定なしに安全とは判断できない。"],
    improvements: uniqueImprovements.length ? uniqueImprovements : ["小量で試作し、温度・時間・塩分・pHを記録して次回条件を調整する。"],
    safetyNotice: `${SAFETY_NOTICE} ${uniqueRisks.length ? listToSentence(uniqueRisks) : ""}`.trim(),
  };
}
