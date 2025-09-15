import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  model: z
    .string()
    .optional()
    .refine((model) => !model || model.endsWith(':free'), {
      message: 'Only free models are allowed. Model name must end with ":free"',
    })
    .default('deepseek/deepseek-chat:free')
    .describe('Model to use for the response. Only free models are allowed'),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe('Temperature for the response (0-2)'),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
