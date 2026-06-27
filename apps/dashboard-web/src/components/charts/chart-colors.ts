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
    claude: '#77FF47',
    codex: '#4ADE80',
    cursor: '#22C55E',
    gemini: '#86EFAC',
    warp: '#BBF7D0',
    opencode: '#34D399',
  },

  models: [
    '#77FF47',
    '#4ADE80',
    '#22C55E',
    '#86EFAC',
    '#BBF7D0',
    '#34D399',
    '#10B981',
    '#059669',
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
