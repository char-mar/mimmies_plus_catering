import type { BadgeTone } from "@/components/ui";

import type { ContactStatus } from "./types";

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: "New",
  READ: "Read",
  REPLIED: "Replied",
  ARCHIVED: "Archived",
};

export const CONTACT_STATUS_TONES: Record<ContactStatus, BadgeTone> = {
  NEW: "amber",
  READ: "blue",
  REPLIED: "green",
  ARCHIVED: "stone",
};
