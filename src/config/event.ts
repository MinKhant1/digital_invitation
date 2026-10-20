export const eventConfig = {
  title: "IGNITE",
  subtitle: "THE NEXT DECADE",
  anniversary: "5TH ANNIVERSARY",
  invitationHeading: "YOU ARE INVITED TO...",
  organization1: "YOMA BANK",
  organization2: "PRUDENTIAL",
  eventName: "5TH ANNIVERSARY CELEBRATION",
  themeLine: "IGNITE THE NEXT DECADE",
  supporting: "5th Anniversary celebrates the strong foundation built over the past five years.",
  date: "",
  time: "",
  venue: "",
} as const;

export const guestConfig = {
  name: "Mr. Min Khant",
  seat: "38",
} as const;

export function invitationLines() {
  const partnership = `${eventConfig.organization1} × ${eventConfig.organization2}`;
  const lines = [
    eventConfig.invitationHeading,
    partnership,
    eventConfig.eventName,
    eventConfig.themeLine,
  ];
  if (eventConfig.date) lines.push(eventConfig.date);
  if (eventConfig.time) lines.push(eventConfig.time);
  if (eventConfig.venue) lines.push(eventConfig.venue);
  return lines;
}
