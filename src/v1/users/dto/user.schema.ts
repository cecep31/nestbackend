import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().min(5, "Email must be at least 5 characters long").max(200),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  image: z.string().url().optional(),
  first_name: z.string().min(3).max(50).optional(),
  last_name: z.string().min(3).max(50).optional(),
});

export const updateUserSchema = createUserSchema.partial();

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
