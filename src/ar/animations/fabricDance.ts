import type { MotionState } from "../../config/experience";

export function addFabricDance(timeline: gsap.core.Timeline, motion: MotionState) {
  timeline.to(motion, { fabricReveal: 1, duration: 4.3, ease: "power2.inOut" }, 7);
  timeline.to(motion, { fabricOpen: 0.12, duration: 2.1, ease: "sine.inOut" }, 9.8);
}
