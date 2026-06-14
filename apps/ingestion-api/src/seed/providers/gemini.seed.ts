export interface ProviderModelConfig {
  model: string;
  weight: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

export const PROVIDER_NAME = 'gemini';
export const PROVIDER_ID = 4;

export const models: ProviderModelConfig[] = [
  {
    model: 'gemini-2.5-pro',
    weight: 0.25,
    inputCostPer1k: 0.035,
    outputCostPer1k: 0.105,
    avgInputTokens: 4000,
    avgOutputTokens: 2000,
  },
  {
    model: 'gemini-2.5-flash',
    weight: 0.5,
    inputCostPer1k: 0.002,
    outputCostPer1k: 0.008,
    avgInputTokens: 3000,
    avgOutputTokens: 1500,
  },
  {
    model: 'gemini-2.0-flash',
    weight: 0.25,
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.004,
    avgInputTokens: 2500,
    avgOutputTokens: 1200,
  },
];
