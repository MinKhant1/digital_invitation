export const ASSETS = {
  model: "/assets/models/five.glb",
  cardImage: "/assets/tracking/invitation-card.jpg",
  imageTarget: "/assets/tracking/invitation-card.mind",
  yomaLogo: "/assets/branding/yoma-logo.png",
  prudentialLogo: "/assets/branding/prudential-logo.png",
  font: "/fonts/cinzel.json",
} as const;

/** Compiled target image is 1004×591. MindAR normalizes width to 1. */
export const CARD_WIDTH = 1;
export const CARD_HEIGHT = 591 / 1004;
