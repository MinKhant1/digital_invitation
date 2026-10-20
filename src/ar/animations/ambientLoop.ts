import gsap from "gsap";
import type { MotionState } from "../../config/experience";

export function createAmbientLoop(motion: MotionState) {
  return gsap
    .timeline({ repeat: -1, yoyo: true })
    .to(motion, { ambientGlow: 0.18, duration: 3.2, ease: "sine.inOut" }, 0)
    .to(motion, { ambientLift: 0.012, duration: 3.6, ease: "sine.inOut" }, 0);
}
