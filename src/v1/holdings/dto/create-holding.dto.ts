import { z } from 'zod';

export const CreateHoldingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  platform: z.string().min(1, 'Platform is required'),
  holding_type_id: z.number().int().positive('Holding type ID must be a positive integer'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  invested_amount: z.number().positive('Invested amount must be positive'),
  current_value: z.number().min(0, 'Current value cannot be negative'),
  units: z.number().positive('Units must be positive').optional(),
  avg_buy_price: z.number().positive('Average buy price must be positive').optional(),
  current_price: z.number().positive('Current price must be positive').optional(),
  last_updated: z.date().optional(),
  notes: z.string().optional(),
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(1900).max(2100, 'Year must be between 1900 and 2100'),
});

export type CreateHoldingDto = z.infer<typeof CreateHoldingSchema>;