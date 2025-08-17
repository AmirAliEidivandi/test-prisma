import { AiModel } from '@enums/model.enum';

// Pricing is defined per model. You can override via env if needed.
// Unit: credits per interaction piece. For simplicity we charge:
// - user_message_cost: cost for storing/sending a user message
// - assistant_token_cost_per_1k: cost per 1000 output tokens (approx)
// Adjust freely as your business logic evolves

export type ModelPricing = {
  user_token_cost_per_1k: number; // cost per 1000 user tokens
  assistant_token_cost_per_1k: number; // cost per 1000 tokens generated
};

export const DEFAULT_LIMITS = {
  anonymous_total_interactions: 10,
};

export const DEFAULTS = {
  assistant_prehod_tokens: Number(
    process.env.PRICING_ASSISTANT_PREHOLD_TOKENS ?? 500,
  ),
};

export const PRICING: Record<AiModel, ModelPricing> = {
  [AiModel.GPT_4O]: {
    user_token_cost_per_1k: Number(process.env.PRICE_GPT4O_USER_PER_1K ?? 2),
    assistant_token_cost_per_1k: Number(
      process.env.PRICE_GPT4O_ASSISTANT_PER_1K ?? 5,
    ),
  },
  [AiModel.GPT_4O_MINI]: {
    user_token_cost_per_1k: Number(
      process.env.PRICE_GPT4O_MINI_USER_PER_1K ?? 1,
    ),
    assistant_token_cost_per_1k: Number(
      process.env.PRICE_GPT4O_MINI_ASSISTANT_PER_1K ?? 2,
    ),
  },
  [AiModel.GPT_4]: {
    user_token_cost_per_1k: Number(process.env.PRICE_GPT4_USER_PER_1K ?? 3),
    assistant_token_cost_per_1k: Number(
      process.env.PRICE_GPT4_ASSISTANT_PER_1K ?? 6,
    ),
  },
  [AiModel.O3]: {
    user_token_cost_per_1k: Number(process.env.PRICE_O3_USER_PER_1K ?? 2),
    assistant_token_cost_per_1k: Number(
      process.env.PRICE_O3_ASSISTANT_PER_1K ?? 4,
    ),
  },
  [AiModel.O1]: {
    user_token_cost_per_1k: Number(process.env.PRICE_O1_USER_PER_1K ?? 1),
    assistant_token_cost_per_1k: Number(
      process.env.PRICE_O1_ASSISTANT_PER_1K ?? 3,
    ),
  },
};

export function getPricing(model: string): ModelPricing | null {
  const key = Object.values(AiModel).find((m) => m === model);
  if (!key) return null;
  return PRICING[key as AiModel];
}

export function estimateAssistantCostUnits(
  model: string,
  tokens: number,
): number {
  const pricing = getPricing(model);
  if (!pricing) return 0;
  const units =
    Math.ceil(Math.max(1, tokens) / 1000) * pricing.assistant_token_cost_per_1k;
  return units;
}
