import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import {
  OpenRouterMessage,
  OpenRouterResponse,
  OpenRouterRequest,
  OpenRouterErrorResponse,
} from '../interfaces/openrouter.types';

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

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<OpenRouterConfig>('openrouter', {
      apiKey: this.configService.get<string>('openrouter.apiKey') || '',
      baseUrl:
        this.configService.get<string>('openrouter.baseUrl') ||
        'https://openrouter.ai/api/v1',
      defaultModel:
        this.configService.get<string>('openrouter.defaultModel') ||
        'openai/gpt-3.5-turbo',
      maxTokens: this.configService.get<number>('openrouter.maxTokens') || 4000,
      temperature:
        this.configService.get<number>('openrouter.temperature') || 0.7,
    });
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'HTTP-Referer': 'https://pilput.me', // Optional. Site URL for rankings on openrouter.ai.
      'X-Title': 'pilput', // Optional. Site title for rankings on openrouter.ai.
    };
  }

  private async handleApiError(response: Response): Promise<never> {
    let errorMessage = 'Unknown error';
    try {
      const errorData: OpenRouterErrorResponse = await response.json();
      errorMessage = errorData.error?.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(`API error: ${errorMessage}`);
  }

  createChatCompletionStream(
    messages: OpenRouterMessage[],
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

    const requestBody: OpenRouterRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    return new Observable<string>((observer) => {
      (async () => {
        try {
          const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            await this.handleApiError(response);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Failed to get response stream reader');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine === '' || trimmedLine === 'data: [DONE]') continue;

              if (trimmedLine.startsWith('data: ')) {
                try {
                  const jsonStr = trimmedLine.slice(6);
                  const chunk = JSON.parse(jsonStr);
                  const content = chunk.choices?.[0]?.delta?.content;
                  if (content) {
                    observer.next(content);
                  }
                } catch (parseError) {
                  this.logger.warn('Failed to parse streaming chunk:', parseError);
                }
              }
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
    messages: OpenRouterMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {},
  ): Promise<OpenRouterResponse> {
    const {
      model = this.config.defaultModel,
      temperature = this.config.temperature,
      maxTokens = this.config.maxTokens,
    } = options;

    const requestBody: OpenRouterRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const completion: OpenRouterResponse = await response.json();
      return completion;
    } catch (error: any) {
      this.logger.error('Error calling chat completion endpoint:', error);
      if (error.message?.includes('API error:')) {
        throw error;
      }
      throw new Error('Failed to get response from chat completion endpoint');
    }
  }
}
