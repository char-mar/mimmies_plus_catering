import { z } from "zod";

import { userRoles } from "../common/constants/roles";
import type { UserRole } from "../common/constants/roles";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("A valid email address is required.").max(255));

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters long.")
  .max(72, "Password must be at most 72 characters long.");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters long.")
  .max(100);

const opaqueTokenSchema = z
  .string()
  .trim()
  .min(20, "This link is not valid.")
  .max(512);

export const registerUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(72),
});

export const changePasswordSchema = z.object({
  newPassword: passwordSchema,
});

export const updateUserRoleSchema = z.object({
  role: z.enum(userRoles),
});

export const verifyEmailSchema = z.object({
  token: opaqueTokenSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: opaqueTokenSchema,
  password: passwordSchema,
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type RegisterUserDto = z.infer<typeof registerUserSchema>;
export type LoginUserDto = z.infer<typeof loginUserSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
}
