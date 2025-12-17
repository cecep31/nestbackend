import { z } from 'zod';

export const UpdateHoldingSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  platform: z.string().min(1, 'Platform is required').optional(),
  holding_type_id: z
    .number()
    .int()
    .positive('Holding type ID must be a positive integer')
    .optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  invested_amount: z.number().positive('Invested amount must be positive').optional(),
  current_value: z.number().min(0, 'Current value cannot be negative').optional(),
  units: z.number().nullable().optional(),
  avg_buy_price: z.number().nullable().optional(),
  current_price: z.number().nullable().optional(),
  last_updated: z.date().optional(),
  notes: z.string().optional(),
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12').optional(),
  year: z
    .number()
    .int()
    .min(1900)
    .max(2100, 'Year must be between 1900 and 2100')
    .optional(),
});

export type UpdateHoldingDto = z.infer<typeof UpdateHoldingSchema>;