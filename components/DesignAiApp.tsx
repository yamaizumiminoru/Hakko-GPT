"use client";

import Link from "next/link";
import { useState } from "react";
import { DesignForm } from "@/components/DesignForm";
import { DesignResultCards } from "@/components/DesignResultCards";
import { EmptyResultState } from "@/components/EmptyResultState";
import { designFermentationPlan, designSampleInputs } from "@/lib/fermentationDesigner";
import type { FermentationDesignInput, FermentationDesignOutput } from "@/types/design";
import type { ExpertApiResponse, ExpertModeStatus } from "@/types/expert";

const emptyDesignInput: FermentationDesignInput = {
  mainIngredient: "",
  subIngredients: "",
  purpose: "調味料",
  preference: "旨味強め",
  difficulty: "初心者",
  suggestSubIngredients: true,
};

export function DesignAiApp() {
  const [input, setInput] = useState<FermentationDesignInput>(emptyDesignInput);
  const [result, setResult] = useState<FermentationDesignOutput | null>(null);
  const [expertMode, setExpertMode] = useState<ExpertModeStatus>({
    source: "rule-fallback",
    message: "入力後に評価します。",
  });
  const [isEvaluating, setIsEvaluating] = useState(false);

  async function requestDesign(nextInput: FermentationDesignInput) {
    setResult(designFermentationPlan(nextInput));
    setIsEvaluating(true);
    setExpertMode({
      source: "rule-fallback",
      message: "発酵専門家AIへ問い合わせています。",
    });

    try {
      const response = await fetch("/api/design-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextInput),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = (await response.json()) as ExpertApiResponse<FermentationDesignOutput>;
      setResult(payload.result);
      setExpertMode(payload.expertMode);
    } catch (error) {
      setExpertMode({
        source: "rule-fallback",
        message: "サーバー提案に失敗したため、ローカルルールで提案しました。",
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
          <Link href="/">Virtual Fermentation Lab</Link>
          <Link className="active" href="/design-ai">
            発酵設計AI
          </Link>
        </nav>
        <h1 className="app-title">発酵設計AI</h1>
        <p className="app-subtitle">材料と目的からスターター候補を比較し、Codexの発酵専門家AIと安全ルールで発酵案を提案します。</p>
        <div className="notice">
          このツールは発酵アイデアを生成する試作ツールです。食用可否や安全性を保証するものではありません。実際に作る場合は、専門家の確認、衛生管理、pH・温度・塩分などの測定を行ってください。
        </div>
      </header>

      <div className="lab-grid">
        <DesignForm
          input={input}
          onChange={setInput}
          onSubmit={() => void requestDesign(input)}
          onSampleSelect={(sample) => {
            setInput(sample);
            void requestDesign(sample);
          }}
        />
        {result ? (
          <div className="result-stack">
            <div className={`ai-status ${expertMode.source === "codex-app-server" ? "active" : ""}`}>
              <strong>{isEvaluating ? "問い合わせ中" : expertMode.source === "codex-app-server" ? "専門家AI" : "ローカルルール"}</strong>
              <span>{expertMode.message}</span>
              {expertMode.error ? <small>{expertMode.error}</small> : null}
            </div>
            <DesignResultCards result={result} />
          </div>
        ) : (
          <EmptyResultState title="発酵案を待機中" body="主材料を入力して、目的と好みを選んだら発酵案を提案できます。サンプルから始めても大丈夫です。" />
        )}
      </div>
    </main>
  );
}
