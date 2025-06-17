import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import OpenAI from 'openai';
import {
  OpenAIMessage,
  OpenAIResponse,
} from '../interfaces/openai.types';

interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly config: OpenRouterConfig;
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('openrouter.apiKey') || '',
      baseUrl: this.configService.get<string>('openrouter.baseUrl') || 'https://openrouter.ai/api/v1',
      defaultModel: this.configService.get<string>('openrouter.defaultModel') || 'openai/gpt-3.5-turbo',
      maxTokens: this.configService.get<number>('openrouter.maxTokens') || 4000,
      temperature: this.configService.get<number>('openrouter.temperature') || 0.7,
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
      defaultHeaders: {
        'HTTP-Referer': 'https://pilput.me',
        'X-Title': 'pilput',
      },
    });
  }

  createChatCompletionStream(
    messages: OpenAIMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {},
  ): Observable<string> {
    const {
      model = this.config.defaultModel,
      temperature = this.config.temperature,
      maxTokens = this.config.maxTokens,
    } = options;

    return new Observable<string>((observer) => {
      (async () => {
        try {
          const stream = await this.openai.chat.completions.create({
            model,
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            temperature,
            max_tokens: maxTokens,
            stream: true,
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              observer.next(content);
            }
          }

          observer.complete();
        } catch (err) {
          this.logger.error('Error in streaming chat completion:', err);
          observer.error(err);
        }
      })();
    });
  }

  async createChatCompletion(
    messages: OpenAIMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {},
  ): Promise<OpenAIResponse> {
    const {
      model = this.config.defaultModel,
      temperature = this.config.temperature,
      maxTokens = this.config.maxTokens,
    } = options;

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        max_tokens: maxTokens,
        stream: false,
      });

      // Transform OpenAI response to match our interface
      const response: OpenAIResponse = {
        id: completion.id,
        model: completion.model,
        choices: completion.choices.map(choice => ({
          message: {
            role: choice.message.role,
            content: choice.message.content || '',
          },
          finish_reason: choice.finish_reason || '',
          index: choice.index,
        })),
        usage: {
          prompt_tokens: completion.usage?.prompt_tokens || 0,
          completion_tokens: completion.usage?.completion_tokens || 0,
          total_tokens: completion.usage?.total_tokens || 0,
        },
      };

      return response;
    } catch (error: any) {
      this.logger.error('Error calling chat completion endpoint:', error);
      if (error.message?.includes('API error:')) {
        throw error;
      }
      throw new Error('Failed to get response from OpenAI chat completion endpoint');
    }
  }
}
