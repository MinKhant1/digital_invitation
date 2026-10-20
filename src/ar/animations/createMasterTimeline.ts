import gsap from "gsap";
import { CINEMATIC_DURATION, type MotionState } from "../../config/experience";
import { addAnniversaryReveal } from "./anniversaryReveal";
import { addAwakening } from "./awakening";
import { addFabricDance } from "./fabricDance";
import { addIgniteReveal } from "./igniteReveal";
import { addInvitationReveal } from "./invitationReveal";
import { addModelReveal } from "./modelReveal";

export function createMasterTimeline(motion: MotionState, onComplete: () => void) {
  const timeline = gsap.timeline({
    paused: true,
    defaults: { overwrite: false },
    onComplete,
  });
  addAwakening(timeline, motion);
  addModelReveal(timeline, motion);
  addFabricDance(timeline, motion);
  addIgniteReveal(timeline, motion);
  addAnniversaryReveal(timeline, motion);
  addInvitationReveal(timeline, motion);
  timeline.addLabel("awakening", 0);
  timeline.addLabel("model", 3);
  timeline.addLabel("fabric", 7);
  timeline.addLabel("ignite", 12);
  timeline.addLabel("anniversary", 17);
  timeline.addLabel("invitation", 20);
  timeline.addLabel("end", CINEMATIC_DURATION);
  timeline.pause(0);
  return timeline;
}
