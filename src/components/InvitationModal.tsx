import { X } from "lucide-react";
import { ASSETS } from "../config/assets";
import { eventConfig, invitationLines } from "../config/event";

interface InvitationModalProps {
  onClose: () => void;
}

export function InvitationModal({ onClose }: InvitationModalProps) {
  const lines = invitationLines();
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="invitation-title">
      <article className="invitation-card">
        <button className="icon-close" type="button" onClick={onClose} aria-label="Close invitation">
          <X size={18} />
        </button>
        <div className="invitation-logos">
          <img src={ASSETS.yomaLogo} alt="Yoma Bank" />
          <img src={ASSETS.prudentialLogo} alt="Prudential" />
        </div>
        <p id="invitation-title" className="invitation-kicker">
          {lines[0]}
        </p>
        <h2>
          {eventConfig.organization1}
          <span> × </span>
          {eventConfig.organization2}
        </h2>
        <p className="invitation-event">{eventConfig.eventName}</p>
        <p className="invitation-theme">{eventConfig.themeLine}</p>
        {(eventConfig.date || eventConfig.time || eventConfig.venue) && (
          <ul className="invitation-details">
            {eventConfig.date && <li>{eventConfig.date}</li>}
            {eventConfig.time && <li>{eventConfig.time}</li>}
            {eventConfig.venue && <li>{eventConfig.venue}</li>}
          </ul>
        )}
      </article>
    </div>
  );
}
