import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface StreamChunkHandler {
  onStart?: (meta?: { messageId?: string }) => Promise<void> | void;
  onDelta: (delta: string) => Promise<void> | void;
  onComplete: (fullText: string) => Promise<void> | void;
  onError?: (error: unknown) => Promise<void> | void;
}

export interface ChatMessageForAI {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class OpenAiService {
  private readonly openaiClient?: OpenAI;
  private readonly deepseekClient?: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    }
    const deepseekKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (deepseekKey) {
      this.deepseekClient = new OpenAI({
        apiKey: deepseekKey,
        baseURL: 'https://api.deepseek.com',
      } as any);
    }
  }

  async streamChatCompletion(params: {
    model: string;
    messages: ChatMessageForAI[];
    temperature?: number;
    handler: StreamChunkHandler;
    provider?: 'openai' | 'deepseek';
  }): Promise<void> {
    const { model, messages, temperature, handler, provider } = params;

    try {
      handler.onStart?.();
      const client = this.resolveClient(model, provider);
      const stream = await client.chat.completions.create({
        model,
        messages,
        temperature: temperature ?? undefined,
        stream: true,
      } as any);

      let fullText = '';
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream as any) {
        const delta = chunk?.choices?.[0]?.delta?.content ?? '';
        if (!delta) continue;
        fullText += delta;
        await handler.onDelta(delta);
      }
      await handler.onComplete(fullText);
    } catch (error: any) {
      const status =
        error?.status || error?.response?.status || error?.statusCode;
      const wantsDeepseek =
        provider === 'deepseek' ||
        (model && model.toLowerCase().includes('deepseek'));
      const mapped = {
        status,
        provider: wantsDeepseek ? 'deepseek' : 'openai',
        code: undefined as string | undefined,
        message: error?.message || 'AI provider error',
      };
      if (status === 401) mapped.code = 'PROVIDER_UNAUTHORIZED';
      if (status === 402) mapped.code = 'PROVIDER_INSUFFICIENT_CREDIT';
      if (handler.onError) await handler.onError(mapped);
      else throw error;
    }
  }

  // generateTitleFromPrompt(prompt: string): string {
  //   const cleaned = prompt.trim().replace(/\s+/g, ' ');
  //   const words = cleaned.split(' ').slice(0, 8);
  //   const title = words.join(' ');
  //   return title.length > 0 ? this.capitalizeFirst(title) : 'New Chat';
  // }

  async generateTitleFromPrompt(prompt: string) {
    const client = this.resolveClient('gpt-4o-mini', 'openai');
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates very short chat titles. Titles must be concise, maximum 5 words.',
        },
        {
          role: 'user',
          content: `Generate a short title for this chat message:\n\n"${prompt}"`,
        },
      ],
      max_tokens: 15,
      temperature: 0.2,
    });
    const title = response.choices[0].message.content?.trim() ?? 'New Chat';
    return title.replace(/^"|"$/g, ''); // Remove double quotes if they exist
  }

  private capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  async listModels(params?: {
    search?: string;
  }): Promise<Array<{ id: string; created?: number; ownedBy?: string }>> {
    const client = this.resolveClient('gpt-4o-mini', 'openai');
    const response = await client.models.list();
    let models = response.data.map((m: any) => ({
      id: m.id,
      created: m.created,
      ownedBy: m.owned_by,
    }));

    if (params?.search) {
      const q = params.search.toLowerCase();
      models = models.filter((m) => m.id.toLowerCase().includes(q));
    }

    // Optional: prioritize commonly used chat models
    const priorityPrefixes = ['gpt-4o', 'gpt-4', 'gpt-3.5', 'o', 'o3', 'o1'];
    models.sort((a, b) => {
      const pa = priorityPrefixes.findIndex((p) => a.id.startsWith(p));
      const pb = priorityPrefixes.findIndex((p) => b.id.startsWith(p));
      const aRank = pa === -1 ? Infinity : pa;
      const bRank = pb === -1 ? Infinity : pb;
      if (aRank !== bRank) return aRank - bRank;
      return a.id.localeCompare(b.id);
    });

    return models;
  }
  private resolveClient(
    model?: string,
    provider?: 'openai' | 'deepseek',
  ): OpenAI {
    const wantsDeepseek =
      provider === 'deepseek' ||
      (model && model.toLowerCase().includes('deepseek'));
    if (wantsDeepseek) {
      if (!this.deepseekClient) throw new Error('DeepSeek not configured');
      return this.deepseekClient;
    }
    if (!this.openaiClient) throw new Error('OpenAI not configured');
    return this.openaiClient;
  }
}
