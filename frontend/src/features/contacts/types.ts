export const contactStatuses = [
  "NEW",
  "READ",
  "REPLIED",
  "ARCHIVED",
] as const;

export type ContactStatus = (typeof contactStatuses)[number];

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
}

export interface ContactFilters {
  page: number;
  limit: number;
  status?: ContactStatus | "";
}
