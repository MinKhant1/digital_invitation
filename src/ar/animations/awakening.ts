import type { MotionState } from "../../config/experience";

export function addAwakening(timeline: gsap.core.Timeline, motion: MotionState) {
  timeline.to(motion, { coreScale: 1, duration: 1.15, ease: "power2.out" }, 0.12);
  timeline.to(motion, { ringSpread: 1, duration: 2.5, ease: "power2.out" }, 0.18);
  timeline.to(motion, { ringOpacity: 1, duration: 0.55, ease: "power1.out" }, 0.12);
  timeline.to(motion, { ringOpacity: 0.28, duration: 1.3, ease: "sine.out" }, 2.15);
  timeline.to(motion, { traceOpacity: 1, duration: 1.5, ease: "power1.out" }, 0.35);
  timeline.to(motion, { platformOpacity: 1, duration: 1.35, ease: "power2.out" }, 0.45);
  timeline.to(motion, { particleOpacity: 1, duration: 1.7, ease: "power1.out" }, 0.25);
  timeline.to(motion, { glow: 1, duration: 2.2, ease: "sine.inOut" }, 0.2);
  timeline.to(motion, { beamOpacity: 1, duration: 0.35, ease: "power1.out" }, 1.25);
  const beams = ["beamA", "beamB", "beamC", "beamD", "beamE"] as const;
  beams.forEach((key, index) => {
    timeline.to(motion, { [key]: 1, duration: 0.72, ease: "power2.out" }, 1.4 + index * 0.28);
  });
}
