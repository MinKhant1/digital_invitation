import { ASSETS } from "../config/assets";
import { eventConfig } from "../config/event";

interface LandingScreenProps {
  onBegin: () => void;
}

export function LandingScreen({ onBegin }: LandingScreenProps) {
  return (
    <section className="landing">
      <img className="landing-bg" src={ASSETS.background} alt="" />
      <div className="landing-stage">
        <div className="landing-copy">
          <header className="brand-row">
            <img className="brand-logo" src={ASSETS.yomaLogo} alt="Yoma Bank" />
            <span className="brand-rule" aria-hidden="true" />
            <img className="brand-logo" src={ASSETS.prudentialLogo} alt="Prudential" />
          </header>
          <h1 className="ignite-lockup">
            <img src={ASSETS.ignite} alt="Ignite the Next Decade" />
          </h1>
          <p className="support">{eventConfig.supporting}</p>
        </div>
        <button className="landing-press" type="button" onClick={onBegin}>
          Press here
        </button>
      </div>
    </section>
  );
}
