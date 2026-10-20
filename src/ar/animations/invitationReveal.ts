import { CINEMATIC_DURATION, type MotionState } from "../../config/experience";

export function addInvitationReveal(timeline: gsap.core.Timeline, motion: MotionState) {
  timeline.to(motion, { fabricOpen: 1, duration: 3.3, ease: "power2.inOut" }, 20.15);
  timeline.to(motion, { modelLift: 0.055, duration: 2.8, ease: "power2.inOut" }, 20.2);
  timeline.to(motion, { invitation: 1, duration: 3.5, ease: "power3.out" }, 20.35);
  timeline.to(motion, { glow: 0.85, duration: 2.2, ease: "sine.inOut" }, 21);
  timeline.set(motion, { invitation: 1 }, CINEMATIC_DURATION);
}
