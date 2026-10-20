import { ERROR_COPY, type ExperienceErrorCode } from "../lib/errors";

interface ErrorScreenProps {
  code: ExperienceErrorCode;
  onRetry: () => void;
  onBack: () => void;
}

export function ErrorScreen({ code, onRetry, onBack }: ErrorScreenProps) {
  const copy = ERROR_COPY[code];
  return (
    <section className="error-screen" role="alert">
      <div className="error-card">
        <p className="eyebrow">Invitation</p>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        <div className="error-actions">
          <button type="button" className="begin" onClick={onRetry}>
            Try again
          </button>
          <button type="button" className="text-button" onClick={onBack}>
            Return
          </button>
        </div>
      </div>
    </section>
  );
}
