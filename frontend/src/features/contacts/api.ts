import { apiRequest } from "@/lib/api";
import type { PaginationMeta } from "@/lib/api";

import type {
  Contact,
  ContactFilters,
  ContactStatus,
  CreateContactInput,
} from "./types";

export interface ContactListResult {
  items: Contact[];
  pagination?: PaginationMeta;
}

export async function createContact(
  input: CreateContactInput,
): Promise<Contact> {
  const response = await apiRequest<Contact>("/contacts", {
    method: "POST",
    body: input,
    auth: false,
  });

  return response.data;
}

export async function listContacts(
  filters: ContactFilters,
): Promise<ContactListResult> {
  const response = await apiRequest<Contact[]>("/contacts", {
    query: {
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
    },
  });

  return { items: response.data, pagination: response.pagination };
}

export async function updateContactStatus(
  id: string,
  status: ContactStatus,
): Promise<Contact> {
  const response = await apiRequest<Contact>(`/contacts/${id}/status`, {
    method: "PATCH",
    body: { status },
  });

  return response.data;
}

export async function deleteContact(id: string): Promise<void> {
  await apiRequest<undefined>(`/contacts/${id}`, { method: "DELETE" });
}
