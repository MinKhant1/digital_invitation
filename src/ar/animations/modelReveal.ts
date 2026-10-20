import type { MotionState } from "../../config/experience";

export function addModelReveal(timeline: gsap.core.Timeline, motion: MotionState) {
  timeline.to(motion, { lightSweep: 1, duration: 3.4, ease: "power1.inOut" }, 3.05);
  timeline.to(motion, { modelLift: 0.02, duration: 3.2, ease: "power2.out" }, 3.2);
  timeline.to(motion, { beamOpacity: 0.22, duration: 1.4, ease: "sine.out" }, 6.2);
  timeline.to(motion, { traceOpacity: 0.35, duration: 1.2, ease: "sine.out" }, 5.5);
}
