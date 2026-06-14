export interface ProviderModelConfig {
  model: string;
  weight: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

export const PROVIDER_NAME = 'claude';
export const PROVIDER_ID = 1;

export const models: ProviderModelConfig[] = [
  {
    model: 'claude-opus-4',
    weight: 0.2,
    inputCostPer1k: 0.075,
    outputCostPer1k: 0.30,
    avgInputTokens: 4000,
    avgOutputTokens: 2000,
  },
  {
    model: 'claude-sonnet-4',
    weight: 0.6,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.06,
    avgInputTokens: 3000,
    avgOutputTokens: 1500,
  },
  {
    model: 'claude-haiku-3.5',
    weight: 0.2,
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.005,
    avgInputTokens: 2000,
    avgOutputTokens: 1000,
  },
];
