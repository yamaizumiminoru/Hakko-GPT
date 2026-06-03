import type { FermentationEvaluation } from "@/types/fermentation";

type ResultCardsProps = {
  result: FermentationEvaluation;
};

function splitRating(rating: string) {
  const [emoji, ...rest] = rating.split(" ");
  return {
    emoji,
    label: rest.join(" "),
  };
}

function ListCard({ title, items, danger = false }: { title: string; items: string[]; danger?: boolean }) {
  return (
    <article className={`result-card full ${danger ? "danger-card" : ""}`}>
      <h3>{title}</h3>
      <ul className="result-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function TextCard({ title, children, full = false }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <article className={`result-card ${full ? "full" : ""}`}>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

export function ResultCards({ result }: ResultCardsProps) {
  const rating = splitRating(result.emojiRating);

  return (
    <section className="result-stack" aria-label="評価結果">
      <article className="panel rating-card">
        <div className="rating-emoji" aria-hidden="true">
          {rating.emoji}
        </div>
        <div>
          <p className="rating-label">{rating.label}</p>
          <h2 className="proposal-name">{result.proposalName}</h2>
        </div>
      </article>

      <div className="cards-grid">
        <TextCard title="既存食品との類似">{result.similarity}</TextCard>
        <TextCard title="おすすめスターター">{result.recommendedStarter}</TextCard>
        <TextCard title="推奨条件" full>
          温度：{result.recommendedConditions.temperature}
          <br />
          湿度：{result.recommendedConditions.humidity}
          <br />
          期間：{result.recommendedConditions.duration}
          <br />
          塩分：{result.recommendedConditions.salt}
          <br />
          酸素条件：{result.recommendedConditions.oxygen}
        </TextCard>
        <TextCard title="予想される味">{result.expectedTaste}</TextCard>
        <TextCard title="予想される香り">{result.expectedAroma}</TextCard>
        <TextCard title="予想される食感">{result.expectedTexture}</TextCard>
        <TextCard title="主な発酵メカニズム">{result.mechanism}</TextCard>
        <ListCard title="主なリスク" items={result.risks} danger={result.emojiRating.startsWith("🤮") || result.emojiRating.startsWith("🤢")} />
        <ListCard title="改善案" items={result.improvements} />
        <TextCard title="安全上の注意" full>
          {result.safetyNotice}
        </TextCard>
      </div>
    </section>
  );
}
