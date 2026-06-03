"use client";

import { useState } from "react";
import Link from "next/link";
import { FermentationForm } from "@/components/FermentationForm";
import { ResultCards } from "@/components/ResultCards";
import { EmptyResultState } from "@/components/EmptyResultState";
import { evaluateFermentationPlan, sampleInputs } from "@/lib/fermentationRules";
import type { FermentationEvaluation, FermentationInput } from "@/types/fermentation";
import type { ExpertApiResponse, ExpertModeStatus } from "@/types/expert";

const emptyLabInput: FermentationInput = {
  mainIngredient: "",
  subIngredients: "",
  starter: "米麹",
  purpose: "調味料",
  preference: "旨味強め",
  difficulty: "初心者",
  temperatureC: 25,
  humidity: 60,
  duration: "7日",
  saltPercent: 8,
  sealed: false,
  cooked: false,
};

export function LabApp() {
  const [input, setInput] = useState<FermentationInput>(emptyLabInput);
  const [result, setResult] = useState<FermentationEvaluation | null>(null);
  const [expertMode, setExpertMode] = useState<ExpertModeStatus>({
    source: "rule-fallback",
    message: "入力後に評価します。",
  });
  const [isEvaluating, setIsEvaluating] = useState(false);

  async function requestEvaluation(nextInput: FermentationInput) {
    setResult(evaluateFermentationPlan(nextInput));
    setIsEvaluating(true);
    setExpertMode({
      source: "rule-fallback",
      message: "発酵専門家AIへ問い合わせています。",
    });

    try {
      const response = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextInput),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = (await response.json()) as ExpertApiResponse<FermentationEvaluation>;
      setResult(payload.result);
      setExpertMode(payload.expertMode);
    } catch (error) {
      setExpertMode({
        source: "rule-fallback",
        message: "サーバー評価に失敗したため、ローカルルールで評価しました。",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="app-header">
        <nav className="app-nav" aria-label="アプリ切り替え">
          <Link className="active" href="/">
            Virtual Fermentation Lab
          </Link>
          <Link href="/design-ai">発酵設計AI</Link>
        </nav>
        <h1 className="app-title">Virtual Fermentation Lab</h1>
        <p className="app-subtitle">
          普通の食材と発酵スターターから、発酵設計の仮説、推奨条件、味・香り・食感の予想、リスクを生成します。
        </p>
        <div className="notice">
          このツールは発酵アイデアを生成する試作ツールです。食用可否や安全性を保証するものではありません。実際に作る場合は、専門家の確認、衛生管理、pH・温度・塩分などの測定を行ってください。
        </div>
      </header>

      <div className="lab-grid">
        <FermentationForm
          input={input}
          onChange={setInput}
          onSubmit={() => void requestEvaluation(input)}
          onSampleSelect={(sample) => {
            setInput(sample);
            void requestEvaluation(sample);
          }}
        />
        {result ? (
          <div className="result-stack">
            <div className={`ai-status ${expertMode.source === "codex-app-server" ? "active" : ""}`}>
              <strong>{isEvaluating ? "問い合わせ中" : expertMode.source === "codex-app-server" ? "専門家AI" : "ローカルルール"}</strong>
              <span>{expertMode.message}</span>
              {expertMode.error ? <small>{expertMode.error}</small> : null}
            </div>
            <ResultCards result={result} />
          </div>
        ) : (
          <EmptyResultState title="評価を待機中" body="主材料、スターター、条件を入力すると発酵仮説を評価できます。サンプルから始めても大丈夫です。" />
        )}
      </div>
    </main>
  );
}
