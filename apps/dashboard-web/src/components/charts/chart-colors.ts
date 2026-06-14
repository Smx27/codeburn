export const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  success: 'hsl(var(--chart-2))',
  warning: 'hsl(var(--chart-3))',
  danger: 'hsl(var(--chart-4))',
  info: 'hsl(var(--chart-5))',
  purple: 'hsl(var(--chart-6))',
  orange: 'hsl(var(--chart-7))',

  series: [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-6))',
    'hsl(var(--chart-7))',
  ],

  providers: {
    claude: '#8B5CF6',
    codex: '#3B82F6',
    cursor: '#10B981',
    gemini: '#F59E0B',
    warp: '#06B6D4',
    opencode: '#EF4444',
  },

  models: [
    '#8B5CF6',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#06B6D4',
    '#EF4444',
    '#EC4899',
    '#84CC16',
  ],

  status: {
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    info: 'hsl(var(--info))',
    destructive: 'hsl(var(--destructive))',
  },

  heatmap: {
    0: 'hsl(var(--muted))',
    1: 'hsl(var(--chart-1) / 0.2)',
    2: 'hsl(var(--chart-1) / 0.4)',
    3: 'hsl(var(--chart-1) / 0.7)',
    4: 'hsl(var(--chart-1))',
  },
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;
