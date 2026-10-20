import type { MotionState } from "../../config/experience";

export function addIgniteReveal(timeline: gsap.core.Timeline, motion: MotionState) {
  timeline.to(motion, { igniteOpacity: 1, duration: 1.15, ease: "power1.out" }, 12.05);
  timeline.to(motion, { igniteSweep: 1.28, duration: 2.5, ease: "power2.inOut" }, 12.15);
  timeline.to(motion, { igniteLift: 0, duration: 1.7, ease: "power2.out" }, 12.05);
  timeline.to(motion, { glow: 1.15, duration: 1.4, ease: "sine.out" }, 12.2);
  timeline.to(motion, { fabricOpen: 0.28, duration: 2.2, ease: "sine.inOut" }, 12.4);
}
