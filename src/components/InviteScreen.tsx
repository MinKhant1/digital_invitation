import { ASSETS } from "../config/assets";
import { guestConfig } from "../config/event";

interface InviteScreenProps {
  onNext: () => void;
}

export function InviteScreen({ onNext }: InviteScreenProps) {
  return (
    <section className="landing invite">
      <img className="landing-bg" src={ASSETS.background} alt="" />
      <div className="invite-stage">
        <div className="invite-copy">
          <header className="brand-row">
            <img className="brand-logo" src={ASSETS.yomaLogo} alt="Yoma Bank" />
            <span className="brand-rule" aria-hidden="true" />
            <img className="brand-logo" src={ASSETS.prudentialLogo} alt="Prudential" />
          </header>
          <h1 className="invite-title">You are invited</h1>
          <p className="invite-name">{guestConfig.name}</p>
          <p className="invite-seat">Seat number {guestConfig.seat}</p>
          <img className="invite-portrait" src={ASSETS.guest} alt="" />
        </div>
        <button className="invite-next" type="button" onClick={onNext}>
          <span>Next</span>
          <svg viewBox="0 0 34 18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M1.5 7.1h17.2l-5.2-5.3L16.2 0 26.8 9 16.2 18l-2.7-1.8 5.2-5.3H1.5z"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
