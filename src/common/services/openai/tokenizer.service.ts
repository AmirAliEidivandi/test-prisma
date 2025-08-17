import { Injectable } from '@nestjs/common';
import { encode } from 'gpt-tokenizer';

@Injectable()
export class TokenizerService {
  countTokens(text: string): number {
    if (!text) return 0;
    try {
      return encode(text).length;
    } catch {
      // Fallback rough estimate if tokenizer fails
      return Math.ceil(text.length / 4);
    }
  }
}
