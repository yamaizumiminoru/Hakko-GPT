import type { FermentationDesignOutput } from "@/types/design";

type DesignResultCardsProps = {
  result: FermentationDesignOutput;
};

function splitRating(rating: string) {
  const [emoji, ...rest] = rating.split(" ");
  return {
    emoji,
    label: rest.join(" "),
  };
}

function TextCard({ title, children, full = false }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <article className={`result-card ${full ? "full" : ""}`}>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

function ReasoningCard({ items }: { items: string[] }) {
  return (
    <article className="result-card full">
      <h3>コメント</h3>
      <ul className="result-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function SubIngredientSuggestionsCard({ result }: { result: FermentationDesignOutput }) {
  if (!result.subIngredientSuggestions.length) return null;

  return (
    <article className="result-card full">
      <h3>副材料候補</h3>
      <ul className="suggestion-list">
        {result.subIngredientSuggestions.map((item) => (
          <li key={item.name}>
            <strong>{item.name}</strong>
            <span>{item.reason}</span>
            {item.caution ? <small>{item.caution}</small> : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function DesignResultCards({ result }: DesignResultCardsProps) {
  const rating = splitRating(result.emojiRating);
  const isDanger = result.emojiRating.startsWith("🤮") || result.emojiRating.startsWith("🤢");

  return (
    <section className="result-stack" aria-label="発酵案">
      <article className={`panel rating-card ${isDanger ? "danger-card" : ""}`}>
        <div className="rating-emoji" aria-hidden="true">
          {rating.emoji}
        </div>
        <div>
          <p className="rating-label">{rating.label}</p>
          <h2 className="proposal-name">{result.proposalName}</h2>
        </div>
      </article>

      <div className="cards-grid">
        <TextCard title="おすすめスターター">{result.recommendedStarter}</TextCard>
        <TextCard title="既存食品との類似">{result.similarity}</TextCard>
        <TextCard title="成功見込み">{result.successLikelihood}</TextCard>
        <TextCard title="危険度">{result.dangerLevel}</TextCard>
        <TextCard title="推奨条件" full>
          温度：{result.recommendedTemperature}
          <br />
          湿度：{result.recommendedHumidity}
          <br />
          期間：{result.recommendedDuration}
        </TextCard>
        <SubIngredientSuggestionsCard result={result} />
        <TextCard title="予想される味">{result.expectedTaste}</TextCard>
        <TextCard title="予想される香り">{result.expectedAroma}</TextCard>
        <TextCard title="予想される食感">{result.expectedTexture}</TextCard>
        <ReasoningCard items={result.reasoning} />
        <TextCard title="安全上の注意" full>
          {result.safetyNotice}
        </TextCard>
      </div>
    </section>
  );
}
