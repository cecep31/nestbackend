import { z } from 'zod';

// List of free models from OpenRouter
const FREE_MODELS = [
  // DeepSeek
  'deepseek/deepseek-r1-0528-qwen3-8b:free',
  'deepseek/deepseek-r1:free',
  'deepseek/deepseek-r1-0528:free',
  'deepseek/deepseek-v3-base:free',
  'deepseek/deepseek-chat-v3-0324:free',

  // Meta Llama
  'meta-llama/llama-3-8b-instruct:free',
  'meta-llama/llama-3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'meta-llama/llama-3.1-70b-instruct:free',
  'meta-llama/llama-3.1-405b-instruct:free',
  'meta-llama/llama-3-sonar-small-32k-chat:free',
  'meta-llama/llama-3-sonar-small-32k-online:free',
  'meta-llama/llama-3-sonar-large-32k-chat:free',
  'meta-llama/llama-3-sonar-large-32k-online:free',
  'meta-llama/llama-guard-2-8b:free',
  'meta-llama/llama-3.3-8b-instruct:free',
  'meta-llama/llama-4-maverick:free',
  'meta-llama/llama-4-scout:free',
  'meta-llama/llama-3.3-70b-instruct:free',

  // Google
  'google/gemma-7b-it:free',
  'google/gemma-2b-it:free',
  'google/gemini-flash-1.5:free',
  'google/gemini-pro-1.5:free',

  // MistralAI
  'mistralai/mistral-7b-instruct:free',

  // Qwen
  'qwen/qwen3-32b:free',
  'qwen/qwen3-coder:free',

  // Moonshot AI
  'moonshotai/kimi-vl-a3b-thinking:free',

  // OpenAI
  'openai/gpt-oss-20b:free',
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
