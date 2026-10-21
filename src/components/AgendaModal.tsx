import { X } from "lucide-react";
import { useEffect } from "react";
import { ASSETS } from "../config/assets";

interface AgendaModalProps {
  onClose: () => void;
}

export function AgendaModal({ onClose }: AgendaModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-layer agenda-layer" role="dialog" aria-modal="true" aria-label="Program agenda" onClick={onClose}>
      <article className="agenda-modal" onClick={(event) => event.stopPropagation()}>
        <button className="icon-close agenda-close" type="button" onClick={onClose} aria-label="Close agenda">
          <X size={18} />
        </button>
        <img src={ASSETS.agenda} alt="Program agenda" />
      </article>
    </div>
  );
}
