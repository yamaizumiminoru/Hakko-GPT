# Virtual Fermentation Lab

発酵設計AIのMVPです。普通の食材と発酵スターターを入力すると、ローカルのルールベース判定で発酵アイデア、推奨条件、予想される味・香り・食感、安全上の注意、総合判定を表示します。

## 重要な注意

このアプリは食用可否や安全性を保証しません。出力は発酵設計の仮説生成であり、実際に食べることを推奨・保証するものではありません。実作する場合は、専門家の確認、衛生管理、pH・温度・塩分・水分活性などの測定を行ってください。

## セットアップ

```bash
npm install
npm run dev
```

PowerShell の実行ポリシーで `npm` が止まる環境では、Windows では次のように実行できます。

```bash
npm.cmd install
npm.cmd run dev
```

開発サーバー起動後、表示されたローカルURLをブラウザで開いてください。

## Codex App Server による発酵専門家AIモード

Lab と 発酵設計AI はどちらもサーバー側API Routeを経由して評価します。サーバー側では `codex app-server` を子プロセスとして起動し、公式のstdio JSON-RPCで `initialize`、`thread/start`、`turn/start` を実行します。

通常は追加設定なしで `codex app-server` を探します。別のコマンドや引数で起動する場合は、次の環境変数を設定してください。

```bash
set CODEX_APP_SERVER_COMMAND=codex
set CODEX_APP_SERVER_ARGS=app-server
set CODEX_APP_SERVER_MODEL=gpt-5.4
```

Windows で `codex` がPATHに入っていない場合でも、アプリは通常 `%LOCALAPPDATA%\OpenAI\Codex\bin\codex.exe` を自動検出します。手動で確認する場合は次を実行してください。

```powershell
& "$env:LOCALAPPDATA\OpenAI\Codex\bin\codex.exe" app-server --help
```

Codex App Server が起動できない場合や認証されていない場合は、ローカルのルールベース結果に自動フォールバックします。安全判定は常にルール側を優先し、AI出力が危険度を弱めることはできないようにしています。アプリ側のクライアントは発酵提案のテキスト生成だけに使い、Codexからコマンド実行やファイル操作の承認要求が来た場合は拒否します。

## 検証

```bash
npm run typecheck
npm run test
```

Windows PowerShell で `npm.ps1` が止まる場合:

```bash
npm.cmd run typecheck
npm.cmd run test
```

## 実装構成

- `app/`: Next.js のページとグローバルCSS
- `components/`: 入力フォーム、結果カード、アプリ本体
- `lib/fermentationRules.ts`: ルールベース判定と代表例
- `lib/fermentationDesigner.ts`: 材料と目的からスターターを推薦する発酵設計AI
- `types/fermentation.ts`: 入出力の型定義
- `types/design.ts`: 発酵設計AIの型定義
- `tests/`: `evaluateFermentationPlan` と `designFermentationPlan` のユニットテスト

## 画面

- `/`: 入力されたスターターと条件を評価する Virtual Fermentation Lab
- `/design-ai`: 材料、目的、好み、難易度からスターターと発酵案を提案する発酵設計AI。目的と好みはルールが確実に効くように固定選択肢から選びます。

## 今後の拡張案

- pH、塩分、水分活性の測定値を入力に追加
- 食材カテゴリ辞書を拡張し、肉・魚・乳・油脂・野生発酵のNG判定を強化
- 結果の根拠スコアやルールヒット理由をデバッグ表示
- 複数スターター候補をランキング表示し、各候補の詳細評価へ進める
- 外部AI APIを追加し、ルール判定を安全ガードレールとして併用
- レシピではなく実験計画書として、観察ログや廃棄判断チェックリストを保存
