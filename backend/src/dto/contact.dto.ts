import { z } from "zod";

import { contactStatuses } from "../common/constants/contacts";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters long.")
  .max(100, "Name must be at most 100 characters long.");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("A valid email address is required.").max(255));

const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .regex(
    /^\+?[0-9\s\-()]{7,30}$/,
    "Enter a valid phone number, for example 024 000 0000.",
  )
  .nullish()
  .transform((value) => (value ? value : null));

export const createContactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: z
    .string()
    .trim()
    .min(3, "A subject is required.")
    .max(150, "Subjects can be at most 150 characters."),
  message: z
    .string()
    .trim()
    .min(10, "Please add a few more details to your message.")
    .max(3000, "Messages can be at most 3000 characters."),
});

export const listContactsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(contactStatuses).optional(),
});

export const updateContactStatusSchema = z.object({
  status: z.enum(contactStatuses),
});

export type CreateContactDto = z.infer<typeof createContactSchema>;
export type ListContactsQueryDto = z.infer<typeof listContactsQuerySchema>;
export type UpdateContactStatusDto = z.infer<typeof updateContactStatusSchema>;
