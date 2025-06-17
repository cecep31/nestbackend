import { z } from 'zod';

// List of free models from OpenRouter
const FREE_MODELS = [
  // DeepSeek models
  'deepseek/deepseek-chat:free',
  'deepseek/deepseek-r1-0528-qwen3-8b:free',
  'deepseek/deepseek-r1-distill-llama-70b:free',
  'deepseek/deepseek-chat-v3-0324:free',
  
  // Meta Llama models
  'meta-llama/llama-3.1-8b-instruct:free',
  'meta-llama/llama-3-8b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.3-8b-instruct:free',
  
  // Add other free models as needed
];

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  model: z
    .string()
    .optional()
    .refine(
      (model) => !model || FREE_MODELS.includes(model),
      {
        message: `Only free models are allowed. Allowed models: ${FREE_MODELS.join(', ')}`,
      }
    )
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
