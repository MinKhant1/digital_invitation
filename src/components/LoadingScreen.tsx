interface LoadingScreenProps {
  progress: number;
  label?: string;
}

export function LoadingScreen({ progress, label = "Preparing the invitation" }: LoadingScreenProps) {
  const amount = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <section className="loading-screen" role="status" aria-live="polite">
      <p className="eyebrow">Yoma Bank × Prudential</p>
      <h2>Ignite</h2>
      <p className="loading-label">{label}</p>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${amount}%` }} />
      </div>
      <p className="progress-value">{amount}%</p>
    </section>
  );
}
