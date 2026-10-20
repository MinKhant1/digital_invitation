export const ASSETS = {
  model: "/assets/models/stage.glb",
  cardImage: "/assets/tracking/invitation-card.jpg",
  imageTarget: "/assets/tracking/8thwall/invitation-card.json",
  yomaLogo: "/assets/branding/yoma-logo.png",
  prudentialLogo: "/assets/branding/prudential-logo.png",
  background: "/assets/branding/background.png",
  ignite: "/assets/branding/ignite.png",
  agenda: "/assets/branding/agenda.png",
  guest: "/assets/branding/guest.png",
  font: "/fonts/cinzel.json",
} as const;

/** Printed card artwork is 1004×591. The scene treats the full card width as 1. */
export const CARD_WIDTH = 1;
export const CARD_HEIGHT = 591 / 1004;
