# Virtual Fermentation Lab

## ビジョン

Virtual Fermentation Lab は、発酵に関する知識をデジタル化し、最終的には発酵プロセスのデジタルツインを実現することを目指すプロジェクトです。

発酵は人類最古級のテクノロジーの一つです。

人類は数千年にわたり、味噌、醤油、納豆、チーズ、ヨーグルト、キムチ、ワイン、ビール、漬物などを作り続けてきました。しかし、その多くは微生物学や生化学が成立するはるか以前から行われていました。

つまり人類は、

「なぜそうなるのか」

を知らなくても、

「こうすると上手くいく」

という経験知を蓄積してきたのです。

本プロジェクトは、その経験知と現代の微生物学・食品科学・AI技術を接続し、

「発酵の可能性空間」

を探索できるシステムを構築することを目標としています。

最終的には、現実の発酵槽と連動するデジタルツインの実現を視野に入れています。

---

# ロードマップ

## フェーズ0：発酵計算機

### 状態

完了

### 目的

発酵に関する専門知識を計算機として実装する。

例：

* 味噌計算機
* 塩分濃度計算機
* 原料配合計算機
* 歩留まり計算機

### 特徴

* 決定論的
* ルールベース
* AI不要

専門家の知識をソフトウェア化する最初の段階。

---

## フェーズ1：発酵設計AI

### 現在の開発フェーズ

### 目的

材料や目的から発酵アイデアを提案する。

### 入力

* 主材料
* 副材料
* 発酵スターター
* 目的
* 好み
* 難易度

### 出力

* 推奨スターター
* 推奨温度
* 推奨湿度
* 推奨期間
* 予想される味
* 予想される香り
* 予想される食感
* 類似する既存食品
* リスク評価
* 総合判定（😋😐🤢🤮）

### 例

入力：

* ひよこ豆
* 柚子
* 米麹

出力：

* 柚子ひよこ豆麹ペースト
* 味噌や塩麹に近い
* 推奨条件
* 味や香りの予測
* リスク評価

### 目標

レシピ検索ではなく、

「何が作れそうか」

を提案するAIを作る。

---

## フェーズ2：バーチャル発酵ラボ

### 目的

既存の発酵食品にとらわれず、新しい発酵食品を探索する。

### 基本思想

従来：

「○○を作るにはどうすればよいか？」

本システム：

「この材料から何が作れそうか？」

### 例

入力：

* ひよこ豆
* 柚子
* 米麹

出力：

* 白味噌とフムスの中間のような発酵ペースト
* 予想風味
* 予想香り
* 予想食感
* 類似食品との比較

### 新たな機能

* 発酵可能性空間の探索
* 複数候補の生成
* 条件比較
* 発酵知識グラフ
* 文献知識との統合

### 目標

「発酵版Stable Diffusion」

とも言えるシステムを目指す。

---

## フェーズ3：発酵World Model

### 目的

発酵過程そのものを予測する。

この段階では、

「何が作れそうか」

だけではなく、

「その後どう変化するか」

を予測する。

### 入力

* 原料
* 微生物
* 温度
* 湿度
* 塩分
* 酸素条件
* 時間

### 出力

* 微生物の増減
* pH変化
* 糖の消費
* アミノ酸生成
* 酸生成
* アルコール生成
* 腐敗リスク

### 例

入力：

* 大豆
* 米麹
* 塩分12%
* 25℃

出力：

* pH推移
* 微生物叢の変化
* 味や香りの発達予測

### 技術

* 予測微生物学
* 数理モデル
* 代謝モデル
* 機械学習
* 実験データ

### 目標

発酵に特化した World Model を構築する。

---

## フェーズ4：発酵デジタルツイン

### 最終目標

現実の発酵槽と仮想発酵槽を同期させる。

### 現実側

例：

* 味噌樽
* ぬか床
* 発酵タンク
* テンペ培養装置

取得データ：

* 温度
* 湿度
* pH
* 重量
* ガス組成
* 画像
* 匂いセンサー

### 仮想側

リアルタイムで更新される発酵シミュレーション。

### 実現したいこと

* 完成予測
* 異常検知
* 条件最適化
* ロット比較
* 介入提案

例：

* 「今日は混ぜた方がよい」
* 「温度を2℃下げると狙った風味に近づく」
* 「酸味が強くなりすぎる可能性がある」

### 技術

* IoT
* 発酵World Model
* 機械学習
* リアルタイムシミュレーション
* デジタルツイン技術

---

# 長期的な研究課題

本プロジェクトでは、以下のような問いを探究していく。

* 発酵は統一的な状態空間として表現できるか？
* AIは新しい発酵食品を発見できるか？
* 味噌、納豆、ぬか床、キムチなどを共通モデルで扱えるか？
* 発酵に特化した World Model は構築可能か？
* 発酵デジタルツインは実現可能か？

本プロジェクトは、

伝統的な発酵知識
×
微生物学
×
食品科学
×
AI
×
デジタルツイン

を接続する試みである。

---

# 免責事項

本プロジェクトは研究・教育・アイデア生成を目的としたものであり、食品の安全性や食用可否を保証するものではありません。

実際に発酵食品を製造する際は、適切な衛生管理、測定、専門家による確認、および法令の遵守を行ってください。

---

# English

## Vision

Virtual Fermentation Lab is an attempt to build a digital representation of fermentation knowledge and eventually a digital twin of fermentation processes.

Fermentation is one of humanity's oldest technologies. For thousands of years, people have successfully produced foods such as miso, soy sauce, natto, cheese, yogurt, kimchi, wine, beer, and pickles without fully understanding the underlying microbiology.

Today, advances in AI, simulation, and digital twin technologies make it possible to formalize and model this knowledge.

The long-term goal of this project is not simply to provide recipes, but to create a system capable of exploring the "fermentation possibility space" and ultimately predicting the future state of real fermentation systems.

---

# Roadmap

## Phase 0: Fermentation Calculators

### Status

Completed

### Goal

Implement domain-specific calculators for fermentation products.

Examples:

* Miso calculators
* Salt concentration calculators
* Ingredient ratio calculators
* Yield estimators

### Characteristics

* Deterministic
* Rule-based
* No AI required

This phase transforms expert know-how into software tools.

---

## Phase 1: Fermentation Design AI (Current Phase)

### Goal

Generate fermentation ideas and process recommendations from user inputs.

### Input

* Main ingredient
* Secondary ingredients
* Fermentation starter
* Desired outcome
* Flavor preferences
* Skill level

### Output

* Recommended starter
* Recommended temperature
* Recommended humidity
* Recommended duration
* Flavor prediction
* Aroma prediction
* Texture prediction
* Similar existing foods
* Risk assessment
* Overall rating

### Technologies

* LLMs
* Rule-based expert knowledge
* Safety heuristics

### Example

Input:

* Chickpeas
* Yuzu
* Rice koji

Output:

* Yuzu Chickpea Koji Paste
* Similar to miso and shio-koji
* Recommended fermentation conditions
* Flavor and aroma predictions
* Risk assessment

### Objective

Move beyond calculators and create an AI-assisted fermentation ideation tool.

---

## Phase 2: Virtual Fermentation Lab

### Goal

Explore novel fermentation products beyond existing recipes.

### Core Idea

Instead of asking:

> "How do I make food X?"

the system asks:

> "What could be made from these ingredients?"

### Example

Input:

* Chickpeas
* Yuzu
* Rice koji

Output:

* White-miso-like fermented spread
* Predicted flavor profile
* Predicted aroma profile
* Predicted texture
* Similarity to known fermented foods

### New Capabilities

* Fermentation possibility space exploration
* Multiple candidate generation
* Comparison of alternative processes
* Knowledge graph integration
* Literature-assisted reasoning

### Technologies

* LLMs
* Structured fermentation knowledge
* Fermentation databases
* Retrieval systems

---

## Phase 3: Fermentation World Model

### Goal

Predict fermentation dynamics.

This phase introduces a virtual fermentation vessel.

Instead of only generating recommendations, the system attempts to model what happens during fermentation.

### Inputs

* Ingredients
* Microorganisms
* Temperature
* Humidity
* Salt concentration
* Oxygen conditions
* Time

### Outputs

* Microbial population dynamics
* pH changes
* Sugar consumption
* Amino acid generation
* Acid production
* Alcohol production
* Spoilage risk

### Example

Input:

* Soybeans
* Rice koji
* 12% salt
* 25°C

Output:

* Predicted pH trajectory
* Predicted microbial succession
* Predicted flavor development

### Technologies

* Predictive microbiology
* Mathematical models
* Metabolic models
* Machine learning
* Experimental datasets

### Vision

A domain-specific "world model" for fermentation.

---

## Phase 4: Fermentation Digital Twin

### Goal

Create a real-time digital twin of actual fermentation systems.

A physical fermentation vessel and a virtual fermentation vessel continuously synchronize.

### Physical Layer

Examples:

* Miso vats
* Nuka beds
* Fermentation tanks
* Tempeh incubators

Sensors may include:

* Temperature
* Humidity
* pH
* Weight
* Gas composition
* Images
* Aroma sensors

### Virtual Layer

A continuously updated simulation model.

### Capabilities

* Predict future fermentation states
* Estimate completion time
* Detect anomalies
* Recommend interventions
* Compare batches
* Optimize flavor outcomes

### Example

The system may suggest:

* Increase mixing frequency
* Lower temperature by 2°C
* Add salt
* Shorten fermentation duration

### Technologies

* IoT
* Fermentation world models
* Machine learning
* Real-time simulation
* Digital twin architectures

### Vision

A digital twin for fermented foods comparable to digital twin systems used in manufacturing, robotics, and industrial processes.

---

# Long-Term Research Direction

This project explores the possibility of a general fermentation intelligence.

Future questions include:

* Can fermentation processes be represented as a unified state space?
* Can AI discover novel fermented foods?
* Can microbial ecosystems be simulated across multiple fermentation domains?
* Can fermentation become a domain-specific world model?
* Can fermentation systems be represented as digital twins?

The ultimate ambition is to bridge traditional fermentation knowledge, modern microbiology, AI, and digital twin technologies.

---

# Disclaimer

This project is intended for research, education, and idea generation.

Outputs generated by the system do not guarantee food safety or edibility.

Users are responsible for proper hygiene, measurement, verification, and compliance with applicable food safety regulations.
