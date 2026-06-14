export interface ProviderModelConfig {
  model: string;
  weight: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

export const PROVIDER_NAME = 'codex';
export const PROVIDER_ID = 2;

export const models: ProviderModelConfig[] = [
  {
    model: 'gpt-5',
    weight: 0.15,
    inputCostPer1k: 0.05,
    outputCostPer1k: 0.15,
    avgInputTokens: 4000,
    avgOutputTokens: 2000,
  },
  {
    model: 'gpt-4.1',
    weight: 0.55,
    inputCostPer1k: 0.02,
    outputCostPer1k: 0.08,
    avgInputTokens: 3500,
    avgOutputTokens: 1800,
  },
  {
    model: 'gpt-4.1-mini',
    weight: 0.3,
    inputCostPer1k: 0.004,
    outputCostPer1k: 0.016,
    avgInputTokens: 2500,
    avgOutputTokens: 1200,
  },
];
