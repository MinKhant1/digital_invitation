import { ASSETS } from "../config/assets";
import { eventConfig } from "../config/event";

interface LandingScreenProps {
  onBegin: () => void;
}

export function LandingScreen({ onBegin }: LandingScreenProps) {
  return (
    <section className="landing">
      <div className="landing-glow" aria-hidden="true" />
      <div className="landing-frame" aria-hidden="true" />
      <header className="brand-row">
        <div className="logo-plate">
          <img src={ASSETS.yomaLogo} alt="Yoma Bank" />
        </div>
        <span className="brand-cross">×</span>
        <div className="logo-plate">
          <img src={ASSETS.prudentialLogo} alt="Prudential" />
        </div>
      </header>
      <div className="landing-copy">
        <p className="eyebrow">A ceremonial invitation</p>
        <h1>
          <span>{eventConfig.title}</span>
          <span>{eventConfig.subtitle}</span>
        </h1>
        <p className="anniversary-line">{eventConfig.anniversary}</p>
        <p className="support">{eventConfig.supporting}</p>
        <button className="begin" type="button" onClick={onBegin}>
          Begin the Experience
        </button>
        <p className="hint">Point your camera toward your invitation card.</p>
      </div>
    </section>
  );
}
