type EmptyResultStateProps = {
  title: string;
  body: string;
};

export function EmptyResultState({ title, body }: EmptyResultStateProps) {
  return (
    <section className="panel empty-result" aria-label={title}>
      <div className="empty-result-icon" aria-hidden="true">
        🧪
      </div>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </section>
  );
}
