import { and, count, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "../config/db";
import { contacts } from "../db/tables/contacts";
import type { ContactStatus } from "../common/constants/contacts";
import type { PaginatedResponse } from "../common/types/pagination.types";
import { buildPagination, getPagination } from "../common/utils/pagination";
import type {
  CreateContactDto,
  ListContactsQueryDto,
} from "../dto/contact.dto";
import { NotFoundError } from "../errors/app-error";

type ContactRecord = typeof contacts.$inferSelect;

export class ContactService {
  async create(dto: CreateContactDto): Promise<ContactRecord> {
    const [contact] = await db
      .insert(contacts)
      .values({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        subject: dto.subject,
        message: dto.message,
      })
      .returning();

    if (!contact) {
      throw new Error("Failed to save the contact message.");
    }

    return contact;
  }

  async findAll(
    query: ListContactsQueryDto,
  ): Promise<PaginatedResponse<ContactRecord>> {
    const pagination = getPagination(query.page, query.limit);
    const filters: SQL[] = [];

    if (query.status) {
      filters.push(eq(contacts.status, query.status));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(contacts)
      .where(where);
    const total = totalResult?.total ?? 0;

    const rows = await db
      .select()
      .from(contacts)
      .where(where)
      .orderBy(desc(contacts.createdAt), desc(contacts.id))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return {
      items: rows,
      pagination: buildPagination(total, pagination.page, pagination.limit),
    };
  }

  async updateStatus(
    id: string,
    status: ContactStatus,
  ): Promise<ContactRecord> {
    const [contact] = await db
      .update(contacts)
      .set({ status, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();

    if (!contact) {
      throw new NotFoundError("Contact message not found.");
    }

    return contact;
  }

  async delete(id: string): Promise<void> {
    const [contact] = await db
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning({ id: contacts.id });

    if (!contact) {
      throw new NotFoundError("Contact message not found.");
    }
  }
}

export const contactService = new ContactService();
