export const contactStatuses = [
  "NEW",
  "READ",
  "REPLIED",
  "ARCHIVED",
] as const;

export type ContactStatus = (typeof contactStatuses)[number];
