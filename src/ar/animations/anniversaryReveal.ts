import type { MotionState } from "../../config/experience";

export function addAnniversaryReveal(timeline: gsap.core.Timeline, motion: MotionState) {
  timeline.to(motion, { anniversaryOpacity: 1, duration: 1.05, ease: "power1.out" }, 17.05);
  timeline.to(motion, { anniversarySweep: 1.28, duration: 1.9, ease: "power2.inOut" }, 17.15);
  timeline.to(motion, { anniversaryLift: 0, duration: 1.45, ease: "power2.out" }, 17.05);
}
