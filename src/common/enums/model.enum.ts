export enum AiModel {
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4 = 'gpt-4',
  O3 = 'o3',
  O1 = 'o1',
  DEEPSEEK_R1 = 'deepseek-r1',
  DEEPSEEK_CHAT = 'deepseek-chat',
  DEEPSEEK_REASONER = 'deepseek-reasoner',
}

export const DEFAULT_MODEL: AiModel = AiModel.GPT_4O_MINI;
