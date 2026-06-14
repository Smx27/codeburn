export interface ProviderModelConfig {
  model: string;
  weight: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

export const PROVIDER_NAME = 'cursor';
export const PROVIDER_ID = 3;

export const models: ProviderModelConfig[] = [
  {
    model: 'claude-sonnet-4',
    weight: 0.45,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.06,
    avgInputTokens: 3000,
    avgOutputTokens: 1500,
  },
  {
    model: 'gpt-4.1',
    weight: 0.35,
    inputCostPer1k: 0.02,
    outputCostPer1k: 0.08,
    avgInputTokens: 3500,
    avgOutputTokens: 1800,
  },
  {
    model: 'cursor-small',
    weight: 0.2,
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.001,
    avgInputTokens: 2000,
    avgOutputTokens: 800,
  },
];
