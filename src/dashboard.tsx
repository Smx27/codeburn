import { homedir } from 'os'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { render, Box, Text, useInput, useApp, useWindowSize } from 'ink'
import { CATEGORY_LABELS, type DateRange, type ProjectSummary, type TaskCategory } from './types.js'
import { formatCost, formatTokens } from './format.js'
import { aggregateModelEfficiency } from './model-efficiency.js'
import { parseAllSessions, filterProjectsByName } from './parser.js'
import { loadPricing } from './models.js'
import { getAllProviders } from './providers/index.js'
import { scanAndDetect, type WasteFinding, type WasteAction, type OptimizeResult } from './optimize.js'
import { estimateContextBudget, type ContextBudget } from './context-budget.js'
import { dateKey } from './day-aggregator.js'
import { CompareView } from './compare.js'
import { getPlanUsages, type PlanUsage } from './plan-usage.js'
import { planDisplayName } from './plans.js'
import { formatDayRangeLabel, getDateRange, parseDayFlag, PERIODS, PERIOD_LABELS, shiftDay, type Period } from './cli-date.js'
import { patchStdoutForWindows } from './ink-win.js'

type View = 'dashboard' | 'optimize' | 'compare'

const MIN_WIDE = 90
const PRIMARY = '#6366F1'
const ACCENT = '#06B6D4'
const GOLD = '#FBBF24'
const DIM = '#475569'
const SUCCESS = '#10B981'
const DANGER = '#EF4444'
const ORANGE = PRIMARY
const GREEN = SUCCESS
const PLAN_BAR_WIDTH = 10
const HEAVY_PERIODS = new Set<Period>(['30days', 'month', 'all'])

const LANG_DISPLAY_NAMES: Record<string, string> = {
  javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python',
  rust: 'Rust', go: 'Go', java: 'Java', cpp: 'C++', c: 'C', csharp: 'C#',
  ruby: 'Ruby', php: 'PHP', swift: 'Swift', kotlin: 'Kotlin',
  html: 'HTML', css: 'CSS', scss: 'SCSS', json: 'JSON', yaml: 'YAML',
  sql: 'SQL', shell: 'Shell', shellscript: 'Shell Script', bash: 'Bash',
  typescriptreact: 'TSX', javascriptreact: 'JSX',
  markdown: 'Markdown', dockerfile: 'Dockerfile', toml: 'TOML',
}

const PANEL_COLORS = {
  overview: '#6366F1',
  daily: '#0EA5E9',
  project: '#10B981',
  model: '#8B5CF6',
  activity: '#F59E0B',
  tools: '#06B6D4',
  mcp: '#EC4899',
  bash: '#F97316',
  skills: '#6366F1',
}

const PROVIDER_COLORS: Record<string, string> = {
  claude: '#6366F1',
  codex: '#10B981',
  cursor: '#06B6D4',
  'ibm-bob': '#3B82F6',
  opencode: '#8B5CF6',
  pi: '#EC4899',
  kimi: '#F59E0B',
  all: '#6366F1',
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  coding: '#0EA5E9',
  debugging: '#EF4444',
  feature: '#10B981',
  refactoring: '#F59E0B',
  testing: '#8B5CF6',
  exploration: '#06B6D4',
  planning: '#6366F1',
  delegation: '#F59E0B',
  git: '#94A3B8',
  'build/deploy': '#10B981',
  conversation: '#64748B',
  brainstorming: '#EC4899',
  general: '#475569',
}

const IMPACT_PANEL_COLORS: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: DIM }

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a)
}

function gradientColor(pct: number): string {
  if (pct <= 0.33) {
    const t = pct / 0.33
    return toHex(lerp(99, 6, t), lerp(102, 182, t), lerp(241, 212, t))
  }
  if (pct <= 0.66) {
    const t = (pct - 0.33) / 0.33
    return toHex(lerp(6, 16, t), lerp(182, 185, t), lerp(212, 129, t))
  }
  const t = (pct - 0.66) / 0.34
  return toHex(lerp(16, 6, t), lerp(185, 182, t), lerp(129, 212, t))
}

function getPeriodRange(period: Period): { start: Date; end: Date } {
  return getDateRange(period).range
}

function getDayRange(day: string): DateRange {
  return parseDayFlag(day)!.range
}

function isHeavyPeriod(period: Period): boolean {
  return HEAVY_PERIODS.has(period)
}

function nextTick(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve))
}

type Layout = { dashWidth: number; wide: boolean; halfWidth: number; barWidth: number }

function getLayout(columns?: number): Layout {
  const termWidth = columns || parseInt(process.env['COLUMNS'] ?? '') || 80
  const dashWidth = Math.min(160, termWidth)
  const wide = dashWidth >= MIN_WIDE
  const halfWidth = wide ? Math.floor(dashWidth / 2) : dashWidth
  const inner = halfWidth - 4
  const barWidth = Math.max(6, Math.min(10, inner - 30))
  return { dashWidth, wide, halfWidth, barWidth }
}

const PANEL_CHROME = 4

const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
const DOT_FILLED = '●'
const DOT_EMPTY = '○'
const RING_CHARS = ['◔', '◕', '●']

function HBar({ value, max, width, color }: { value: number; max: number; width: number; color?: string }) {
  if (max === 0) return <Text color={DIM}>{'░'.repeat(width)}</Text>
  const filled = Math.round((value / max) * width)
  const barColor = color ?? ACCENT
  return (
    <Text>
      <Text color={barColor}>{'█'.repeat(Math.min(filled, width))}</Text>
      <Text color="#1E293B">{'░'.repeat(Math.max(width - filled, 0))}</Text>
    </Text>
  )
}

function SparkLine({ values, width, color }: { values: number[]; width: number; color: string }) {
  if (values.length === 0) return <Text color={DIM}>{'·'.repeat(width)}</Text>
  const max = Math.max(...values, 0.001)
  const padded = values.length >= width ? values.slice(-width) : values
  const step = padded.length > 1 ? Math.floor(padded.length / width) : 1
  const sampled: number[] = []
  for (let i = 0; i < width && i * step < padded.length; i++) {
    sampled.push(padded[i * step] ?? 0)
  }
  const sMax = Math.max(...sampled, 0.001)
  return (
    <Text>
      {sampled.map((v, i) => {
        const idx = Math.min(Math.round((v / sMax) * (SPARK_CHARS.length - 1)), SPARK_CHARS.length - 1)
        return <Text key={i} color={v > 0 ? color : DIM}>{SPARK_CHARS[idx]}</Text>
      })}
    </Text>
  )
}

function VerticalBar({ values, labels, colors, maxWidth }: { values: number[]; labels: string[]; colors: string[]; maxWidth: number }) {
  if (values.length === 0) return <Text dimColor>No data</Text>
  const max = Math.max(...values, 0.001)
  const maxH = 6
  const nw = Math.max(6, maxWidth - 3)
  const rows: React.ReactNode[] = []
  for (let row = maxH - 1; row >= 0; row--) {
    const cells: React.ReactNode[] = []
    const threshold = ((row + 1) / maxH) * max
    for (let i = 0; i < values.length; i++) {
      const barH = Math.round((values[i] / max) * maxH)
      const filled = maxH - row <= barH
      cells.push(<Text key={i} color={filled ? (colors[i] ?? ACCENT) : DIM}>{filled ? '█' : ' '}</Text>)
      cells.push(<Text key={`${i}-g`}> </Text>)
    }
    rows.push(<Text key={row}>{cells}</Text>)
  }
  const labelRow: React.ReactNode[] = []
  for (let i = 0; i < values.length; i++) {
    labelRow.push(<Text key={i} color={colors[i] ?? DIM}>{fit(labels[i], 3)}</Text>)
    labelRow.push(<Text key={`${i}-g`}> </Text>)
  }
  rows.push(<Text key="labels">{labelRow}</Text>)
  return <>{rows}</>
}

function DotFill({ value, max, width, color }: { value: number; max: number; width: number; color: string }) {
  if (max === 0) return <Text color={DIM}>{DOT_EMPTY.repeat(width)}</Text>
  const filled = Math.round((value / max) * width)
  return (
    <Text>
      <Text color={color}>{DOT_FILLED.repeat(Math.min(filled, width))}</Text>
      <Text color="#1E293B">{DOT_EMPTY.repeat(Math.max(width - filled, 0))}</Text>
    </Text>
  )
}

function RingSegment({ percent, color }: { percent: number; color: string }) {
  const capped = Math.max(0, Math.min(100, percent))
  const idx = capped < 33 ? 0 : capped < 66 ? 1 : 2
  return <Text color={color}>{RING_CHARS[idx]}</Text>
}

function ProgressBar({ value, max, width, color }: { value: number; max: number; width: number; color: string }) {
  if (max === 0) return <Text color={DIM}>{'─'.repeat(width)}</Text>
  const filled = Math.round((value / max) * width)
  return (
    <Text>
      <Text color={color}>{'━'.repeat(Math.min(filled, width))}</Text>
      <Text color="#1E293B">{'─'.repeat(Math.max(width - filled, 0))}</Text>
    </Text>
  )
}

function Panel({ title, color, children, width }: { title: string; color: string; children: React.ReactNode; width: number }) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={color} paddingX={1} width={width} overflowX="hidden">
      <Text bold color={color}>▸ {title}</Text>
      {children}
    </Box>
  )
}

function fit(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s.padEnd(n)
}

function renderPlanBar(percentUsed: number, width: number): string {
  if (percentUsed <= 100) {
    const capped = Math.max(0, percentUsed)
    const filled = Math.round((capped / 100) * width)
    return `${'▓'.repeat(filled)}${'░'.repeat(Math.max(0, width - filled))}`
  }
  const factor = percentUsed / 100
  const chevrons = Math.min(4, Math.max(1, Math.floor(Math.log10(factor)) + 1))
  return `${'▓'.repeat(width)}${'▶'.repeat(chevrons)}`
}

function planLabel(planUsage: PlanUsage): string {
  const name = planDisplayName(planUsage.plan.id)
  return planUsage.plan.id === 'custom' ? `${name} (${planUsage.plan.provider})` : name
}

function planColor(planUsage: PlanUsage): string {
  return planUsage.status === 'over'
    ? '#EF4444'
    : planUsage.status === 'near'
      ? '#F59E0B'
      : '#10B981'
}

function planStatusText(planUsage: PlanUsage): string {
  if (planUsage.status === 'under') {
    return `Well within plan. Projected month: ${formatCost(planUsage.projectedMonthUsd)} (reset in ${planUsage.daysUntilReset} days).`
  }
  if (planUsage.status === 'near') {
    return `Approaching plan limit. Projected month: ${formatCost(planUsage.projectedMonthUsd)} (reset in ${planUsage.daysUntilReset} days).`
  }
  return `${(planUsage.spentApiEquivalentUsd / Math.max(planUsage.budgetUsd, 1)).toFixed(1)}x your subscription value. Projected month: ${formatCost(planUsage.projectedMonthUsd)} (reset in ${planUsage.daysUntilReset} days).`
}

function Overview({ projects, label, width, planUsages }: { projects: ProjectSummary[]; label: string; width: number; planUsages?: PlanUsage[] }) {
  const totalCost = projects.reduce((s, p) => s + p.totalCostUSD, 0)
  const totalSavings = projects.reduce((s, p) => s + p.totalSavingsUSD, 0)
  const totalCalls = projects.reduce((s, p) => s + p.totalApiCalls, 0)
  const totalSessions = projects.reduce((s, p) => s + p.sessions.length, 0)
  const allSessions = projects.flatMap(p => p.sessions)
  const totalInput = allSessions.reduce((s, sess) => s + sess.totalInputTokens, 0)
  const totalOutput = allSessions.reduce((s, sess) => s + sess.totalOutputTokens, 0)
  const totalCacheRead = allSessions.reduce((s, sess) => s + sess.totalCacheReadTokens, 0)
  const totalCacheWrite = allSessions.reduce((s, sess) => s + sess.totalCacheWriteTokens, 0)
  const allInputTokens = totalInput + totalCacheRead + totalCacheWrite
  const cacheHit = allInputTokens > 0
    ? (totalCacheRead / allInputTokens) * 100 : 0
  const activePlanUsages = planUsages ?? []

  return (
    <Box flexDirection="column" borderStyle="double" borderColor={PANEL_COLORS.overview} paddingX={1} width={width}>
      <Text wrap="truncate-end">
        <Text bold color={PRIMARY}>Niriksh</Text>
        <Text dimColor>  {label}</Text>
      </Text>
      <Text dimColor>{'─'.repeat(width - 4)}</Text>
      <Text wrap="truncate-end">
        <Text bold color={GOLD}>{formatCost(totalCost)}</Text>
        <Text dimColor> cost   </Text>
        <Text bold>{totalCalls.toLocaleString()}</Text>
        <Text dimColor> calls   </Text>
        <Text bold>{String(totalSessions)}</Text>
        <Text dimColor> sessions   </Text>
        <Text bold color={ACCENT}>{cacheHit.toFixed(1)}%</Text>
        <Text dimColor> cache hit</Text>
      </Text>
      <Text dimColor wrap="truncate-end">
        {formatTokens(totalInput)} in   {formatTokens(totalOutput)} out   {formatTokens(totalCacheRead)} cached   {formatTokens(totalCacheWrite)} written
      </Text>
      {totalSavings > 0 && (
        <Text wrap="truncate-end">
          <Text color={SUCCESS}>{formatCost(totalSavings)}</Text>
          <Text dimColor> saved by local models</Text>
        </Text>
      )}
      {activePlanUsages.length > 0 && (
        <>
          {activePlanUsages.map(planUsage => {
            const color = planColor(planUsage)
            return (
              <React.Fragment key={planUsage.plan.provider}>
                <Text wrap="truncate-end">
                  <Text color={color}>{planLabel(planUsage)}: {formatCost(planUsage.spentApiEquivalentUsd)} API-equivalent vs {formatCost(planUsage.budgetUsd)} plan</Text>
                  <Text>  </Text>
                  <Text color={color}>{renderPlanBar(planUsage.percentUsed, PLAN_BAR_WIDTH)}</Text>
                  <Text> </Text>
                  <Text bold color={color}>{planUsage.percentUsed.toFixed(1)}%</Text>
                </Text>
                <Text dimColor wrap="truncate-end">{planStatusText(planUsage)}</Text>
              </React.Fragment>
            )
          })}
        </>
      )}
    </Box>
  )
}

function DailyActivity({ projects, days = 14, pw, bw }: { projects: ProjectSummary[]; days?: number; pw: number; bw: number }) {
  const dailyCosts: Record<string, number> = {}
  const dailyCalls: Record<string, number> = {}
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        if (!turn.timestamp) continue
        const day = dateKey(turn.timestamp)
        dailyCosts[day] = (dailyCosts[day] ?? 0) + turn.assistantCalls.reduce((s, c) => s + c.costUSD, 0)
        dailyCalls[day] = (dailyCalls[day] ?? 0) + turn.assistantCalls.length
      }
    }
  }
  const sortedDays = days !== undefined ? Object.keys(dailyCosts).sort().slice(-days) : Object.keys(dailyCosts).sort()
  const costValues = sortedDays.map(d => dailyCosts[d] ?? 0)
  const callValues = sortedDays.map(d => dailyCalls[d] ?? 0)
  const maxCost = Math.max(...costValues, 0.001)
  const maxCalls = Math.max(...callValues, 0.001)

  return (
    <Panel title="Daily Activity" color={PANEL_COLORS.daily} width={pw}>
      <Text dimColor wrap="truncate-end">{'cost'.padStart(8)}{'calls'.padStart(8)}</Text>
      <Text wrap="truncate-end">
        <SparkLine values={costValues} width={bw} color={PANEL_COLORS.daily} />
        <Text color={GOLD}>{formatCost(maxCost).padStart(8)}</Text>
        <Text color={ACCENT}>{String(Math.round(maxCalls)).padStart(8)}</Text>
      </Text>
      <Text dimColor wrap="truncate-end">{''.padEnd(bw + 8 + 8)}{'max'.padStart(8)}</Text>
      {sortedDays.map(day => (
        <Text key={day} wrap="truncate-end">
          <Text dimColor>{day.slice(5)} </Text>
          <Text color={dailyCosts[day] === maxCost ? GOLD : DIM}>{formatCost(dailyCosts[day] ?? 0).padStart(8)}</Text>
          <Text>{String(dailyCalls[day] ?? 0).padStart(8)}</Text>
        </Text>
      ))}
    </Panel>
  )
}

const _home = homedir()
const _homePrefix = _home.endsWith('/') ? _home : _home + '/'

export function shortProject(absPath: string): string {
  const normalized = absPath.replace(/\\/g, '/')
  let path: string
  if (normalized === _home) path = ''
  else if (normalized.startsWith(_homePrefix)) path = normalized.slice(_homePrefix.length)
  else path = normalized
  path = path.replace(/^\/+/, '')
  path = path.replace(/^private\/tmp\/[^/]+\/[^/]+\//, '').replace(/^private\/tmp\//, '').replace(/^tmp\//, '')
  if (!path) return 'home'
  const parts = path.split('/').filter(Boolean)
  if (parts.length <= 3) return parts.join('/')
  return parts.slice(-3).join('/')
}

const PROJECT_COL_AVG = 7
const PROJECT_COL_BASE_WIDTH = 30
const PROJECT_COL_WITH_OVERHEAD_WIDTH = 40

function ProjectBreakdown({ projects, pw, bw, budgets, rows = 14 }: { projects: ProjectSummary[]; pw: number; bw: number; budgets?: Map<string, ContextBudget>; rows?: number }) {
  const maxCost = Math.max(...projects.map(p => p.totalCostUSD))
  const hasBudgets = budgets && budgets.size > 0
  const nw = Math.max(8, pw - bw - (hasBudgets ? PROJECT_COL_WITH_OVERHEAD_WIDTH : PROJECT_COL_BASE_WIDTH))
  const dotColors = [PANEL_COLORS.project, ACCENT, PRIMARY, PANEL_COLORS.model, PANEL_COLORS.activity]
  return (
    <Panel title="By Project" color={PANEL_COLORS.project} width={pw}>
      <Text dimColor wrap="truncate-end">
        {''.padEnd(bw + 1 + nw)}{'cost'.padStart(8)}{'avg/s'.padStart(PROJECT_COL_AVG)}{'sess'.padStart(6)}{hasBudgets ? 'overhead'.padStart(10) : ''}
      </Text>
      {projects.slice(0, rows).map((project, i) => {
        const budget = budgets?.get(project.project)
        const avgCost = project.sessions.length > 0
          ? formatCost(project.totalCostUSD / project.sessions.length)
          : '-'
        return (
          <Text key={`${project.project}-${i}`} wrap="truncate-end">
            <DotFill value={project.totalCostUSD} max={maxCost} width={bw} color={dotColors[i % dotColors.length]} />
            <Text dimColor> {fit(shortProject(project.projectPath), nw)}</Text>
            <Text color={GOLD}>{formatCost(project.totalCostUSD).padStart(8)}</Text>
            <Text color={GOLD}>{avgCost.padStart(PROJECT_COL_AVG)}</Text>
            <Text>{String(project.sessions.length).padStart(6)}</Text>
            {hasBudgets && <Text color={ACCENT}>{(budget ? formatTokens(budget.total) : '-').padStart(10)}</Text>}
          </Text>
        )
      })}
    </Panel>
  )
}

const MODEL_COL_COST = 8
const MODEL_COL_CACHE = 7
const MODEL_COL_CALLS = 7
const MODEL_COL_ONESHOT = 7
const MODEL_NAME_WIDTH = 14
const MIN_EDIT_TURNS_FOR_RATE = 5

function ModelBreakdown({ projects, pw, bw }: { projects: ProjectSummary[]; pw: number; bw: number }) {
  const modelTotals: Record<string, { calls: number; costUSD: number; freshInput: number; cacheRead: number; cacheWrite: number }> = {}
  const modelEfficiency = aggregateModelEfficiency(projects)
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [model, data] of Object.entries(session.modelBreakdown)) {
        if (!modelTotals[model]) modelTotals[model] = { calls: 0, costUSD: 0, freshInput: 0, cacheRead: 0, cacheWrite: 0 }
        modelTotals[model].calls += data.calls
        modelTotals[model].costUSD += data.costUSD
        modelTotals[model].freshInput += data.tokens.inputTokens
        modelTotals[model].cacheRead += data.tokens.cacheReadInputTokens
        modelTotals[model].cacheWrite += data.tokens.cacheCreationInputTokens
      }
    }
  }
  const sorted = Object.entries(modelTotals).sort(([, a], [, b]) => b.costUSD - a.costUSD)
  const maxCost = sorted[0]?.[1]?.costUSD ?? 0
  const modelColors = [PANEL_COLORS.model, ACCENT, SUCCESS, PANEL_COLORS.daily, PRIMARY]
  return (
    <Panel title="By Model" color={PANEL_COLORS.model} width={pw}>
      <Text dimColor wrap="truncate-end">{''.padEnd(bw + 1 + MODEL_NAME_WIDTH)}{'cost'.padStart(MODEL_COL_COST)}{'cache'.padStart(MODEL_COL_CACHE)}{'calls'.padStart(MODEL_COL_CALLS)}{'1-shot'.padStart(MODEL_COL_ONESHOT)}</Text>
      {sorted.map(([model, data], i) => {
        const totalInput = data.freshInput + data.cacheRead + data.cacheWrite
        const cacheHit = totalInput > 0 ? (data.cacheRead / totalInput) * 100 : 0
        const cacheLabel = totalInput > 0 ? `${cacheHit.toFixed(1)}%` : '-'
        const efficiency = modelEfficiency.get(model)
        const oneShotLabel = efficiency && efficiency.editTurns >= MIN_EDIT_TURNS_FOR_RATE && efficiency.oneShotRate !== null
          ? `${efficiency.oneShotRate.toFixed(1)}%`
          : '-'
        return (
          <Text key={`${model}-${i}`} wrap="truncate-end">
            <DotFill value={data.costUSD} max={maxCost} width={bw} color={modelColors[i % modelColors.length]} />
            <Text> {fit(model, MODEL_NAME_WIDTH)}</Text>
            <Text color={GOLD}>{formatCost(data.costUSD).padStart(MODEL_COL_COST)}</Text>
            <Text>{cacheLabel.padStart(MODEL_COL_CACHE)}</Text>
            <Text>{String(data.calls).padStart(MODEL_COL_CALLS)}</Text>
            <Text>{oneShotLabel.padStart(MODEL_COL_ONESHOT)}</Text>
          </Text>
        )
      })}
    </Panel>
  )
}

const SKILL_SUB_ROWS_LIMIT = 5

function ActivityBreakdown({ projects, pw, bw }: { projects: ProjectSummary[]; pw: number; bw: number }) {
  const categoryTotals: Record<string, { turns: number; costUSD: number; editTurns: number; oneShotTurns: number }> = {}
  const skillTotals: Record<string, { turns: number; costUSD: number; editTurns: number; oneShotTurns: number }> = {}
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [cat, data] of Object.entries(session.categoryBreakdown)) {
        if (!categoryTotals[cat]) categoryTotals[cat] = { turns: 0, costUSD: 0, editTurns: 0, oneShotTurns: 0 }
        categoryTotals[cat].turns += data.turns
        categoryTotals[cat].costUSD += data.costUSD
        categoryTotals[cat].editTurns += data.editTurns
        categoryTotals[cat].oneShotTurns += data.oneShotTurns
      }
      for (const [skill, data] of Object.entries(session.skillBreakdown ?? {})) {
        if (!skillTotals[skill]) skillTotals[skill] = { turns: 0, costUSD: 0, editTurns: 0, oneShotTurns: 0 }
        skillTotals[skill].turns += data.turns
        skillTotals[skill].costUSD += data.costUSD
        skillTotals[skill].editTurns += data.editTurns
        skillTotals[skill].oneShotTurns += data.oneShotTurns
      }
    }
  }
  const sorted = Object.entries(categoryTotals).sort(([, a], [, b]) => b.costUSD - a.costUSD)
  const sortedSkills = Object.entries(skillTotals).sort(([, a], [, b]) => b.costUSD - a.costUSD).slice(0, SKILL_SUB_ROWS_LIMIT)
  const maxCost = sorted[0]?.[1]?.costUSD ?? 0
  return (
    <Panel title="By Activity" color={PANEL_COLORS.activity} width={pw}>
      <Text dimColor wrap="truncate-end">{''.padEnd(bw + 14)}{'cost'.padStart(8)}{'turns'.padStart(6)}{'1-shot'.padStart(7)}</Text>
      {sorted.flatMap(([cat, data]) => {
        const oneShotPct = data.editTurns > 0 ? Math.round((data.oneShotTurns / data.editTurns) * 100) + '%' : '-'
        const rows = [
          <Text key={cat} wrap="truncate-end">
            <HBar value={data.costUSD} max={maxCost} width={bw} color={CATEGORY_COLORS[cat as TaskCategory] ?? '#475569'} />
            <Text color={CATEGORY_COLORS[cat as TaskCategory] ?? '#475569'}> {fit(CATEGORY_LABELS[cat as TaskCategory] ?? cat, 13)}</Text>
            <Text color={GOLD}>{formatCost(data.costUSD).padStart(8)}</Text>
            <Text>{String(data.turns).padStart(6)}</Text>
            <Text color={data.editTurns === 0 ? DIM : oneShotPct === '100%' ? SUCCESS : ACCENT}>{String(oneShotPct).padStart(7)}</Text>
          </Text>,
        ]
        if (cat === 'general' && sortedSkills.length > 0) {
          for (const [skill, sd] of sortedSkills) {
            const subPct = sd.editTurns > 0 ? Math.round((sd.oneShotTurns / sd.editTurns) * 100) + '%' : '-'
            rows.push(
              <Text key={`${cat}:${skill}`} wrap="truncate-end" dimColor>
                <ProgressBar value={sd.costUSD} max={maxCost} width={bw} color={CATEGORY_COLORS[cat as TaskCategory] ?? '#475569'} />
                <Text> {fit(`  /${skill}`, 13)}</Text>
                <Text>{formatCost(sd.costUSD).padStart(8)}</Text>
                <Text>{String(sd.turns).padStart(6)}</Text>
                <Text>{String(subPct).padStart(7)}</Text>
              </Text>,
            )
          }
        }
        return rows
      })}
    </Panel>
  )
}

function ToolBreakdown({ projects, pw, bw, title, filterPrefix }: { projects: ProjectSummary[]; pw: number; bw: number; title?: string; filterPrefix?: string }) {
  const toolTotals: Record<string, number> = {}
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [tool, data] of Object.entries(session.toolBreakdown)) {
        if (filterPrefix) { if (!tool.startsWith(filterPrefix)) continue } else { if (tool.startsWith('lang:')) continue }
        toolTotals[tool] = (toolTotals[tool] ?? 0) + data.calls
      }
    }
  }
  const sorted = Object.entries(toolTotals).sort(([, a], [, b]) => b - a)
  const maxCalls = sorted[0]?.[1] ?? 0
  const nw = Math.max(6, pw - bw - 15)
  return (
    <Panel title={title ?? 'Core Tools'} color={PANEL_COLORS.tools} width={pw}>
      <Text dimColor wrap="truncate-end">{''.padEnd(bw + 1 + nw)}{'calls'.padStart(7)}</Text>
      {sorted.slice(0, 10).map(([tool, calls]) => {
        const raw = filterPrefix ? tool.slice(filterPrefix.length) : tool
        const display = filterPrefix ? (LANG_DISPLAY_NAMES[raw] ?? raw) : raw
        return (
          <Text key={tool} wrap="truncate-end">
            <ProgressBar value={calls} max={maxCalls} width={bw} color={PANEL_COLORS.tools} />
            <Text> {fit(display, nw)}</Text>
            <Text>{String(calls).padStart(7)}</Text>
          </Text>
        )
      })}
    </Panel>
  )
}


function McpBreakdown({ projects, pw, bw }: { projects: ProjectSummary[]; pw: number; bw: number }) {
  const mcpTotals: Record<string, number> = {}
  for (const project of projects) { for (const session of project.sessions) { for (const [server, data] of Object.entries(session.mcpBreakdown)) { mcpTotals[server] = (mcpTotals[server] ?? 0) + data.calls } } }
  const sorted = Object.entries(mcpTotals).sort(([, a], [, b]) => b - a)
  if (sorted.length === 0) return <Panel title="MCP Servers" color={PANEL_COLORS.mcp} width={pw}><Text dimColor>No MCP usage</Text></Panel>
  const maxCalls = sorted[0]?.[1] ?? 0
  const nw = Math.max(6, pw - bw - 15)
  return (
    <Panel title="MCP Servers" color={PANEL_COLORS.mcp} width={pw}>
      <Text dimColor wrap="truncate-end">{''.padEnd(bw + 1 + nw)}{'calls'.padStart(6)}</Text>
      {sorted.slice(0, 8).map(([server, calls]) => (
        <Text key={server} wrap="truncate-end"><ProgressBar value={calls} max={maxCalls} width={bw} color={PANEL_COLORS.mcp} /><Text> {fit(server, nw)}</Text><Text>{String(calls).padStart(6)}</Text></Text>
      ))}
    </Panel>
  )
}

function BashBreakdown({ projects, pw, bw }: { projects: ProjectSummary[]; pw: number; bw: number }) {
  const bashTotals: Record<string, number> = {}
  for (const project of projects) { for (const session of project.sessions) { for (const [cmd, data] of Object.entries(session.bashBreakdown)) { bashTotals[cmd] = (bashTotals[cmd] ?? 0) + data.calls } } }
  const sorted = Object.entries(bashTotals).sort(([, a], [, b]) => b - a)
  if (sorted.length === 0) return <Panel title="Shell Commands" color={PANEL_COLORS.bash} width={pw}><Text dimColor>No shell commands</Text></Panel>
  const maxCalls = sorted[0]?.[1] ?? 0
  const nw = Math.max(6, pw - bw - 15)
  return (
    <Panel title="Shell Commands" color={PANEL_COLORS.bash} width={pw}>
      <Text dimColor wrap="truncate-end">{''.padEnd(bw + 1 + nw)}{'calls'.padStart(7)}</Text>
      {sorted.slice(0, 10).map(([cmd, calls]) => (
        <Text key={cmd} wrap="truncate-end"><ProgressBar value={calls} max={maxCalls} width={bw} color={PANEL_COLORS.bash} /><Text> {fit(cmd, nw)}</Text><Text>{String(calls).padStart(7)}</Text></Text>
      ))}
    </Panel>
  )
}

function SkillsAndAgents({ projects, pw, bw }: { projects: ProjectSummary[]; pw: number; bw: number }) {
  const merged: Record<string, { uses: number; cost: number }> = {}
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [skill, d] of Object.entries(session.skillBreakdown)) { const e = merged[skill] ?? { uses: 0, cost: 0 }; e.uses += d.turns; e.cost += d.costUSD; merged[skill] = e }
      for (const [agent, d] of Object.entries(session.subagentBreakdown)) { const e = merged[agent] ?? { uses: 0, cost: 0 }; e.uses += d.calls; e.cost += d.costUSD; merged[agent] = e }
    }
  }
  const sorted = Object.entries(merged).sort(([, a], [, b]) => b.cost - a.cost)
  if (sorted.length === 0) return <Panel title="Skills & Agents" color={PANEL_COLORS.skills} width={pw}><Text dimColor>No skill/agent usage</Text></Panel>
  const maxCost = sorted[0]?.[1]?.cost ?? 0
  const nw = Math.max(6, pw - bw - 22)
  return (
    <Panel title="Skills & Agents" color={PANEL_COLORS.skills} width={pw}>
      <Text dimColor wrap="truncate-end">{''.padEnd(bw + 1 + nw)}{'uses'.padStart(6)}{'cost'.padStart(8)}</Text>
      {sorted.slice(0, 10).map(([name, d]) => (
        <Text key={name} wrap="truncate-end"><ProgressBar value={d.cost} max={maxCost} width={bw} color={PANEL_COLORS.skills} /><Text> {fit(name, nw)}</Text><Text>{String(d.uses).padStart(6)}</Text><Text color={GOLD}>{formatCost(d.cost).padStart(8)}</Text></Text>
      ))}
    </Panel>
  )
}

// Claude Code only: real subagent-transcript spend by agentType
// (workflow-subagent / Explore / general-purpose / …). Returns null when there
// are no agent transcripts, so it never shows for other providers.
function ClaudeAgentTypes({ projects, pw, bw }: { projects: ProjectSummary[]; pw: number; bw: number }) {
  const merged: Record<string, { uses: number; cost: number }> = {}
  for (const project of projects) {
    for (const session of project.sessions) {
      if (!session.agentType) continue
      const e = merged[session.agentType] ?? { uses: 0, cost: 0 }
      e.uses += session.apiCalls; e.cost += session.totalCostUSD; merged[session.agentType] = e
    }
  }
  const sorted = Object.entries(merged).sort(([, a], [, b]) => b.cost - a.cost)
  if (sorted.length === 0) return null
  const maxCost = sorted[0]?.[1]?.cost ?? 0
  const nw = Math.max(6, pw - bw - 22)
  return (
    <Panel title="Claude Agent Types" color={PANEL_COLORS.skills} width={pw}>
      <Text dimColor wrap="truncate-end">{''.padEnd(bw + 1 + nw)}{'calls'.padStart(6)}{'cost'.padStart(8)}</Text>
      {sorted.slice(0, 10).map(([name, d]) => (
        <Text key={name} wrap="truncate-end"><ProgressBar value={d.cost} max={maxCost} width={bw} color={PANEL_COLORS.skills} /><Text> {fit(name, nw)}</Text><Text>{String(d.uses).padStart(6)}</Text><Text color={GOLD}>{formatCost(d.cost).padStart(8)}</Text></Text>
      ))}
    </Panel>
  )
}

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  all: 'All',
  claude: 'Claude',
  codex: 'Codex',
  cursor: 'Cursor',
  'ibm-bob': 'IBM Bob',
  opencode: 'OpenCode',
  pi: 'Pi',
  kimi: 'Kimi',
}
function getProviderDisplayName(name: string): string { return PROVIDER_DISPLAY_NAMES[name] ?? name }

function PeriodTabs({ active, providerName, showProvider }: { active: Period; providerName?: string; showProvider?: boolean }) {
  return (
    <Box justifyContent="space-between" paddingX={1}>
      <Box gap={1}>
        {PERIODS.map(p => (
          <Text key={p} bold={active === p} color={active === p ? PRIMARY : DIM}>
            {active === p ? `[ ${PERIOD_LABELS[p]} ]` : `  ${PERIOD_LABELS[p]}  `}
          </Text>
        ))}
      </Box>
      {showProvider && providerName && (
        <Box><Text color={DIM}>|  </Text><Text color={PRIMARY} bold>[p]</Text><Text bold color={PROVIDER_COLORS[providerName] ?? PRIMARY}> {getProviderDisplayName(providerName)}</Text></Box>
      )}
    </Box>
  )
}

/// Header for an action's intended destination. Helps users distinguish a
/// permanent CLAUDE.md rule from a one-time session opener so they don't
/// accidentally bake a single-run constraint into their project's permanent
/// instructions. Issue #277.
function actionDestinationHeader(action: WasteAction): string {
  switch (action.type) {
    case 'file-content':
      return `── Suggested ${action.path} addition `.padEnd(64, '─')
    case 'command':
      return '── Run this command '.padEnd(64, '─')
    case 'paste': {
      switch (action.destination) {
        case 'claude-md':
          return '── Suggested CLAUDE.md addition (permanent rule) '.padEnd(64, '─')
        case 'session-opener':
          return '── One-time session opener (do not add to CLAUDE.md) '.padEnd(64, '─')
        case 'prompt':
          return '── Ask Claude in the current session '.padEnd(64, '─')
        case 'shell-config':
          return '── Add to your shell config '.padEnd(64, '─')
        default:
          return '── Suggested action '.padEnd(64, '─')
      }
    }
  }
}

function FindingAction({ action }: { action: WasteAction }) {
  const lines = action.type === 'file-content' ? action.content.split('\n') : action.type === 'command' ? action.text.split('\n') : [action.text]
  const header = actionDestinationHeader(action)
  return (
    <>
      <Text color={ORANGE}>{header}</Text>
      <Text dimColor>{action.label}</Text>
      {lines.map((line, i) => <Text key={i} color={ACCENT}>  {line}</Text>)}
    </>
  )
}

function FindingPanel({ index, finding, costRate, width }: { index: number; finding: WasteFinding; costRate: number; width: number }) {
  const costSaved = finding.tokensSaved * costRate
  const color = IMPACT_PANEL_COLORS[finding.impact] ?? DIM
  const label = finding.impact.charAt(0).toUpperCase() + finding.impact.slice(1)
  const trendBadge = finding.trend === 'improving' ? ' improving \u2193' : ''
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={color} paddingX={1} width={width}>
      <Text wrap="truncate-end">
        <Text bold>{index}. {finding.title}</Text>
        <Text>  </Text>
        <Text color={color}>{label}</Text>
        {trendBadge && <Text color={SUCCESS}>{trendBadge}</Text>}
      </Text>
      <Text dimColor wrap="wrap">{finding.explanation}</Text>
      <Text color={GOLD}>Savings: ~{formatTokens(finding.tokensSaved)} tokens (~{formatCost(costSaved)})</Text>
      <Text> </Text>
      <FindingAction action={finding.fix} />
    </Box>
  )
}

const GRADE_COLORS: Record<string, string> = { A: SUCCESS, B: SUCCESS, C: GOLD, D: '#F59E0B', F: DANGER }

// Each finding panel takes ~6-8 lines. Show 3 at a time so the window fits a
// 30-line terminal alongside the optimize header + status bar; users page
// with j/k. Without this cap, 4 new detectors + 7 originals scrolled findings
// off the alt-buffer top and the user couldn't see the StatusBar at all.
const FINDINGS_WINDOW_SIZE = 3

function OptimizeView({ findings, costRate, projects, label, width, healthScore, healthGrade, cursor }: { findings: WasteFinding[]; costRate: number; projects: ProjectSummary[]; label: string; width: number; healthScore: number; healthGrade: string; cursor: number }) {
  const periodCost = projects.reduce((s, p) => s + p.totalCostUSD, 0)
  const totalTokens = findings.reduce((s, f) => s + f.tokensSaved, 0)
  const totalCost = totalTokens * costRate
  const pctRaw = periodCost > 0 ? (totalCost / periodCost) * 100 : 0
  const pct = pctRaw >= 1 ? pctRaw.toFixed(0) : pctRaw.toFixed(1)
  const gradeColor = GRADE_COLORS[healthGrade] ?? DIM
  const total = findings.length
  const start = total === 0 ? 0 : Math.min(cursor, Math.max(0, total - FINDINGS_WINDOW_SIZE))
  const end = Math.min(start + FINDINGS_WINDOW_SIZE, total)
  const visible = findings.slice(start, end)
  return (
    <Box flexDirection="column" width={width}>
      <Box flexDirection="column" borderStyle="double" borderColor={PRIMARY} paddingX={1} width={width}>
        <Text wrap="truncate-end">
          <Text bold color={PRIMARY}>Niriksh Optimize</Text>
          <Text dimColor>  {label}   Setup: </Text>
          <Text bold color={gradeColor}>{healthGrade}</Text>
          <Text dimColor> ({healthScore}/100)</Text>
        </Text>
        <Text color={SUCCESS} wrap="truncate-end">Savings: ~{formatTokens(totalTokens)} tokens (~{formatCost(totalCost)}, ~{pct}% of spend)</Text>
        {total > FINDINGS_WINDOW_SIZE && (
          <Text dimColor>Showing {start + 1}–{end} of {total} · j/k to scroll</Text>
        )}
      </Box>
      {visible.map((f, i) => <FindingPanel key={start + i} index={start + i + 1} finding={f} costRate={costRate} width={width} />)}
      <Box paddingX={1} width={width}><Text dimColor>Token estimates are approximate.</Text></Box>
    </Box>
  )
}

function StatusBar({ width, showProvider, view, findingCount, optimizeAvailable, compareAvailable, customRange, dayMode }: { width: number; showProvider?: boolean; view?: View; findingCount?: number; optimizeAvailable?: boolean; compareAvailable?: boolean; customRange?: boolean; dayMode?: boolean }) {
  const isOptimize = view === 'optimize'
  return (
    <Box borderStyle="round" borderColor={DIM} width={width} justifyContent="center" paddingX={1}>
      <Text>
        {isOptimize
          ? <><Text color={PRIMARY} bold>b</Text><Text dimColor> back   </Text><Text color={PRIMARY} bold>j</Text><Text dimColor>/</Text><Text color={PRIMARY} bold>k</Text><Text dimColor> scroll   </Text></>
          : dayMode
            ? <><Text color={PRIMARY} bold>{'<'}</Text><Text color={PRIMARY}>{'>'}</Text><Text dimColor> day   </Text></>
            : !customRange
              ? <><Text color={PRIMARY} bold>{'<'}</Text><Text color={PRIMARY}>{'>'}</Text><Text dimColor> switch   </Text></>
              : null}
        <Text color={PRIMARY} bold>q</Text><Text dimColor> quit</Text>
        {!customRange && !isOptimize && (
          <>
            <Text dimColor>   </Text><Text color={PRIMARY} bold>1</Text><Text dimColor> today   </Text>
            <Text color={PRIMARY} bold>2</Text><Text dimColor> week   </Text>
            <Text color={PRIMARY} bold>3</Text><Text dimColor> 30 days   </Text>
            <Text color={PRIMARY} bold>4</Text><Text dimColor> month   </Text>
            <Text color={PRIMARY} bold>5</Text><Text dimColor> 6 months</Text>
          </>
        )}
        {!customRange && !isOptimize && (
          <>
            <Text dimColor>   </Text><Text color={PRIMARY} bold>d</Text><Text dimColor>{dayMode ? ' exit day' : ' yesterday'}</Text>
          </>
        )}
        {!isOptimize && optimizeAvailable && (
          <><Text dimColor>   </Text><Text color={PRIMARY} bold>o</Text><Text dimColor> optimize</Text>{findingCount != null && findingCount > 0 ? <Text color={DANGER}> ({findingCount})</Text> : null}</>
        )}
        {!isOptimize && compareAvailable && (
          <><Text dimColor>   </Text><Text color={PRIMARY} bold>c</Text><Text dimColor> compare</Text></>
        )}
        {showProvider && (<><Text dimColor>   </Text><Text color={PRIMARY} bold>p</Text><Text dimColor> provider</Text></>)}
      </Text>
    </Box>
  )
}

function Row({ wide, width, children }: { wide: boolean; width: number; children: React.ReactNode }) {
  if (wide) return <Box width={width}>{children}</Box>
  return <>{children}</>
}

function DashboardContent({ projects, period, columns, activeProvider, budgets, planUsages, label, dayMode }: { projects: ProjectSummary[]; period: Period; columns?: number; activeProvider?: string; budgets?: Map<string, ContextBudget>; planUsages?: PlanUsage[]; label?: string; dayMode?: boolean }) {
  const { dashWidth, wide, halfWidth, barWidth } = getLayout(columns)
  const isCursor = activeProvider === 'cursor'
  const activeLabel = label ?? PERIOD_LABELS[period]
    if (projects.length === 0) return <Panel title="Niriksh" color={PRIMARY} width={dashWidth}><Text dimColor>No usage data found for {activeLabel}.</Text></Panel>
  const pw = wide ? halfWidth : dashWidth
  const days = dayMode ? 1 : period === 'all' ? undefined : (period === 'month' || period === '30days' ? 31 : 14)
  return (
    <Box flexDirection="column" width={dashWidth}>
      <Overview projects={projects} label={activeLabel} width={dashWidth} planUsages={planUsages} />
      <Row wide={wide} width={dashWidth}><DailyActivity projects={projects} days={days} pw={pw} bw={barWidth} /><ProjectBreakdown projects={projects} pw={pw} bw={barWidth} budgets={budgets} rows={dayMode ? 8 : period === 'all' ? 14 : period === 'month' || period === '30days' ? 14 : 8} /></Row>
      <Row wide={wide} width={dashWidth}><ActivityBreakdown projects={projects} pw={pw} bw={barWidth} /><ModelBreakdown projects={projects} pw={pw} bw={barWidth} /></Row>
      {isCursor ? (
        <ToolBreakdown projects={projects} pw={dashWidth} bw={barWidth} title="Languages" filterPrefix="lang:" />
      ) : (
        <><Row wide={wide} width={dashWidth}><ToolBreakdown projects={projects} pw={pw} bw={barWidth} /><BashBreakdown projects={projects} pw={pw} bw={barWidth} /></Row><Row wide={wide} width={dashWidth}><SkillsAndAgents projects={projects} pw={pw} bw={barWidth} /><McpBreakdown projects={projects} pw={pw} bw={barWidth} /></Row><Row wide={wide} width={dashWidth}><ClaudeAgentTypes projects={projects} pw={pw} bw={barWidth} /></Row></>
      )}
    </Box>
  )
}

function InteractiveDashboard({ initialProjects, initialPeriod, initialProvider, initialPlanUsages, refreshSeconds, projectFilter, excludeFilter, customRange, customRangeLabel, initialDay }: {
  initialProjects: ProjectSummary[]
  initialPeriod: Period
  initialProvider: string
  initialPlanUsages?: PlanUsage[]
  refreshSeconds?: number
  projectFilter?: string[]
  excludeFilter?: string[]
  customRange?: DateRange | null
  customRangeLabel?: string
  initialDay?: string
}) {
  const { exit } = useApp()
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [projects, setProjects] = useState<ProjectSummary[]>(initialProjects)
  const [loading, setLoading] = useState(false)
  const [activeProvider, setActiveProvider] = useState(initialProvider)
  const [detectedProviders, setDetectedProviders] = useState<string[]>([])
  const [view, setView] = useState<View>('dashboard')
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null)
  const [optimizeLoading, setOptimizeLoading] = useState(false)
  const [projectBudgets, setProjectBudgets] = useState<Map<string, ContextBudget>>(new Map())
  const [planUsages, setPlanUsages] = useState<PlanUsage[]>(initialPlanUsages ?? [])
  const [dayDate, setDayDate] = useState<string | null>(initialDay ?? null)
  // Cursor for the OptimizeView's findings window. Reset whenever the user
  // leaves the optimize view OR the underlying findings change so a long
  // findings list never strands the user past the new array length.
  const [findingsCursor, setFindingsCursor] = useState(0)
  const isDayMode = dayDate != null
  const isCustomRange = customRange != null && !isDayMode
  const { columns } = useWindowSize()
  const { dashWidth } = getLayout(columns)
  const multipleProviders = detectedProviders.length > 1
  const optimizeAvailable = !isCustomRange && (activeProvider === 'all' || activeProvider === 'claude')
  const modelCount = new Set(
    projects.flatMap(p => p.sessions.flatMap(s => Object.keys(s.modelBreakdown)))
  ).size
  const compareAvailable = modelCount >= 2
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reloadGenerationRef = useRef(0)
  const reloadInFlightRef = useRef(false)
  const currentReloadRef = useRef<{ period: Period; provider: string; day: string | null } | null>(null)
  const pendingReloadRef = useRef<{ period: Period; provider: string; day: string | null } | null>(null)
  const findingCount = optimizeResult?.findings.length ?? 0

  useEffect(() => {
    let cancelled = false
    async function detect() {
      const found: string[] = []
      for (const p of await getAllProviders()) { const s = await p.discoverSessions(); if (s.length > 0) found.push(p.name) }
      if (!cancelled) setDetectedProviders(found)
    }
    detect()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadBudgets() {
      const budgets = new Map<string, ContextBudget>()
      for (const project of projects.slice(0, 8)) {
        if (cancelled) return
        if (!project.projectPath.startsWith('/')) continue
        budgets.set(project.project, await estimateContextBudget(project.projectPath))
      }
      if (!cancelled) setProjectBudgets(budgets)
    }
    loadBudgets()
    return () => { cancelled = true }
  }, [projects])

  const reloadData = useCallback(async (p: Period, prov: string, day: string | null = null) => {
    if (reloadInFlightRef.current) {
      const current = currentReloadRef.current
      if (current?.period === p && current.provider === prov && current.day === day) {
        pendingReloadRef.current = null
        return
      }
      reloadGenerationRef.current++
      pendingReloadRef.current = { period: p, provider: prov, day }
      return
    }
    reloadInFlightRef.current = true
    currentReloadRef.current = { period: p, provider: prov, day }
    const generation = ++reloadGenerationRef.current
    setLoading(true)
    setOptimizeLoading(false)
    setOptimizeResult(null)
    try {
      if (!day && isHeavyPeriod(p)) {
        setProjects([])
        setProjectBudgets(new Map())
        await nextTick()
        if (reloadGenerationRef.current !== generation) return
      }
      const range = day ? getDayRange(day) : getPeriodRange(p)
      const data = await parseAllSessions(range, prov)
      if (reloadGenerationRef.current !== generation) return

      const filteredProjects = filterProjectsByName(data, projectFilter, excludeFilter)
      if (reloadGenerationRef.current !== generation) return

      setProjects(filteredProjects)
      const usage = await getPlanUsages()
      if (reloadGenerationRef.current !== generation) return
      setPlanUsages(usage)
    } catch (error) {
      console.error(error)
    } finally {
      if (reloadGenerationRef.current === generation) {
        setLoading(false)
      }
      reloadInFlightRef.current = false
      currentReloadRef.current = null
      const pending = pendingReloadRef.current
      pendingReloadRef.current = null
      if (pending) {
        void reloadData(pending.period, pending.provider, pending.day)
      }
    }
  }, [projectFilter, excludeFilter])

  const currentRange = useCallback(() => {
    return dayDate ? getDayRange(dayDate) : getPeriodRange(period)
  }, [dayDate, period])

  const loadOptimizeResult = useCallback(async () => {
    if (!optimizeAvailable || projects.length === 0 || optimizeLoading) return
    setView('optimize')
    setFindingsCursor(0)
    if (optimizeResult) return

    const generation = reloadGenerationRef.current
    setOptimizeLoading(true)
    try {
      const result = await scanAndDetect(projects, currentRange())
      if (reloadGenerationRef.current === generation) setOptimizeResult(result)
    } catch (error) {
      console.error(error)
    } finally {
      if (reloadGenerationRef.current === generation) setOptimizeLoading(false)
    }
  }, [optimizeAvailable, projects, currentRange, optimizeLoading, optimizeResult])

  useEffect(() => {
    if (!refreshSeconds || refreshSeconds <= 0) return
    if (!dayDate && isHeavyPeriod(period)) return
    const id = setInterval(() => { reloadData(period, activeProvider, dayDate) }, refreshSeconds * 1000)
    return () => clearInterval(id)
  }, [refreshSeconds, period, activeProvider, dayDate, reloadData])

  const switchPeriod = useCallback((np: Period) => {
    if (np === period && !dayDate) return
    // Clear projects + flip loading synchronously so the dashboard never
    // renders the new period label over the old period's numbers between
    // setPeriod() and the reloadData() promise resolving. Without this,
    // there's a frame-to-hundreds-of-ms window where users saw wrong
    // figures captioned with the new period.
    setPeriod(np)
    setDayDate(null)
    setProjects([])
    setLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { reloadData(np, activeProvider, null) }, 600)
  }, [period, activeProvider, dayDate, reloadData])

  const switchPeriodImmediate = useCallback(async (np: Period) => {
    if (np === period && !dayDate) return
    setPeriod(np)
    setDayDate(null)
    setProjects([])
    setLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    await reloadData(np, activeProvider, null)
  }, [period, activeProvider, dayDate, reloadData])

  const switchDay = useCallback(async (nextDay: string) => {
    const today = parseDayFlag('today')!.day
    const clampedDay = nextDay > today ? today : nextDay
    if (clampedDay === dayDate) return
    setDayDate(clampedDay)
    setProjects([])
    setLoading(true)
    setView('dashboard')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    await reloadData(period, activeProvider, clampedDay)
  }, [period, activeProvider, dayDate, reloadData])

  const enterYesterday = useCallback(async () => {
    const yesterday = parseDayFlag('yesterday')!.day
    await switchDay(yesterday)
  }, [switchDay])

  useInput((input, key) => {
    if (input === 'q') { exit(); return }
    if (input === 'o' && view === 'dashboard' && optimizeAvailable) { void loadOptimizeResult(); return }
    if ((input === 'b' || key.escape) && view === 'optimize') { setView('dashboard'); setFindingsCursor(0); return }
    if (view === 'optimize') {
      const total = optimizeResult?.findings.length ?? 0
      const maxStart = Math.max(0, total - FINDINGS_WINDOW_SIZE)
      if (input === 'j' || key.downArrow) { setFindingsCursor(c => Math.min(c + 1, maxStart)); return }
      if (input === 'k' || key.upArrow) { setFindingsCursor(c => Math.max(c - 1, 0)); return }
      return
    }
    if (input === 'c' && compareAvailable && view === 'dashboard') { setView('compare'); return }
    if ((input === 'b' || key.escape) && view === 'compare') { setView('dashboard'); return }
    if (input === 'p' && multipleProviders && view !== 'compare') {
      const opts = ['all', ...detectedProviders]; const next = opts[(opts.indexOf(activeProvider) + 1) % opts.length]
      setActiveProvider(next); setView('dashboard')
      if (debounceRef.current) clearTimeout(debounceRef.current)
      reloadData(period, next, dayDate); return
    }
    // Period switches reload the underlying data. Disable them while the
    // compare view is mounted; the compare view re-aggregates from
    // `projects` and would visibly change underneath the user without any
    // affordance back to the dashboard. Press `b` or Esc to return first.
    if (view === 'compare') return
    if (!customRange && input === 'd') {
      if (dayDate) {
        setDayDate(null)
        setProjects([])
        setLoading(true)
        void reloadData(period, activeProvider, null)
      } else {
        void enterYesterday()
      }
      return
    }
    // Also disable while a custom --from/--to range is in effect. Switching
    // period would silently abandon the user's explicit range and reload
    // standard period data; the period tab strip is hidden in this mode so
    // users have no expectation that 1-5 should do anything.
    if (isCustomRange) return
    if (dayDate) {
      if (key.leftArrow) { void switchDay(shiftDay(dayDate, -1)); return }
      if (key.rightArrow || key.tab) { void switchDay(shiftDay(dayDate, 1)); return }
      if (key.escape || input === 'b') {
        setDayDate(null)
        setProjects([])
        setLoading(true)
        void reloadData(period, activeProvider, null)
        return
      }
    }
    const idx = PERIODS.indexOf(period)
    if (key.leftArrow) switchPeriod(PERIODS[(idx - 1 + PERIODS.length) % PERIODS.length]!)
    else if (key.rightArrow || key.tab) switchPeriod(PERIODS[(idx + 1) % PERIODS.length]!)
    else if (input === '1') switchPeriodImmediate('today')
    else if (input === '2') switchPeriodImmediate('week')
    else if (input === '3') switchPeriodImmediate('30days')
    else if (input === '4') switchPeriodImmediate('month')
    else if (input === '5') switchPeriodImmediate('all')
  })

  const headerLabel = dayDate ? formatDayRangeLabel(dayDate) : customRangeLabel ?? PERIOD_LABELS[period]

  if (loading || optimizeLoading) {
    return (
      <Box flexDirection="column" width={dashWidth}>
        {!isCustomRange && !isDayMode && <PeriodTabs active={period} providerName={activeProvider} showProvider={view !== 'compare' && multipleProviders} />}
        {isDayMode && <DayBanner label={headerLabel} width={dashWidth} />}
        {isCustomRange && <CustomRangeBanner label={headerLabel} width={dashWidth} />}
        {view === 'compare'
          ? <Box flexDirection="column" paddingX={2} paddingY={1}>
            <Box flexDirection="column" borderStyle="round" borderColor={PRIMARY} paddingX={1}>
              <Text bold color={PRIMARY}>Model Comparison</Text>
              <Text> </Text>
              <Text dimColor>Loading {headerLabel} model data...</Text>
            </Box>
          </Box>
          : view === 'optimize'
            ? <Panel title="Niriksh Optimize" color={PRIMARY} width={dashWidth}><Text dimColor>Scanning {headerLabel}...</Text></Panel>
            : <Panel title="Niriksh" color={PRIMARY} width={dashWidth}><Text dimColor>Loading {headerLabel}...</Text></Panel>}
        {view !== 'compare' && <StatusBar width={dashWidth} showProvider={multipleProviders} view={view} findingCount={0} optimizeAvailable={false} compareAvailable={false} customRange={isCustomRange} dayMode={isDayMode} />}
      </Box>
    )
  }

  return (
    <Box flexDirection="column" width={dashWidth}>
      {!isCustomRange && !isDayMode && <PeriodTabs active={period} providerName={activeProvider} showProvider={multipleProviders && view !== 'compare'} />}
      {isDayMode && <DayBanner label={headerLabel} width={dashWidth} />}
      {isCustomRange && <CustomRangeBanner label={headerLabel} width={dashWidth} />}
      {view === 'compare'
        ? <CompareView projects={projects} onBack={() => setView('dashboard')} />
        : view === 'optimize' && optimizeResult
          ? <OptimizeView findings={optimizeResult.findings} costRate={optimizeResult.costRate} projects={projects} label={headerLabel} width={dashWidth} healthScore={optimizeResult.healthScore} healthGrade={optimizeResult.healthGrade} cursor={findingsCursor} />
          : <DashboardContent projects={projects} period={period} columns={columns} activeProvider={activeProvider} budgets={projectBudgets} planUsages={planUsages} label={headerLabel} dayMode={isDayMode} />}
      {view !== 'compare' && <StatusBar width={dashWidth} showProvider={multipleProviders} view={view} findingCount={findingCount} optimizeAvailable={optimizeAvailable} compareAvailable={compareAvailable} customRange={isCustomRange} dayMode={isDayMode} />}
    </Box>
  )
}

function DayBanner({ label, width }: { label: string; width: number }) {
  return (
    <Box width={width} paddingX={1} marginBottom={1}>
      <Text color={PRIMARY} bold>{label}</Text>
    </Box>
  )
}

function CustomRangeBanner({ label, width }: { label: string; width: number }) {
  return (
    <Box width={width} paddingX={1} marginBottom={1}>
      <Text dimColor>Custom range: </Text>
      <Text color={PRIMARY} bold>{label}</Text>
    </Box>
  )
}

function StaticDashboard({ projects, period, activeProvider, planUsages, label, dayMode }: { projects: ProjectSummary[]; period: Period; activeProvider?: string; planUsages?: PlanUsage[]; label?: string; dayMode?: boolean }) {
  const { columns } = useWindowSize()
  const { dashWidth } = getLayout(columns)
  return (
    <Box flexDirection="column" width={dashWidth}>
      {dayMode ? <DayBanner label={label ?? PERIOD_LABELS[period]} width={dashWidth} /> : <PeriodTabs active={period} />}
      <DashboardContent projects={projects} period={period} columns={columns} activeProvider={activeProvider} planUsages={planUsages} label={label} dayMode={dayMode} />
    </Box>
  )
}

export async function renderDashboard(period: Period = 'week', provider: string = 'all', refreshSeconds?: number, projectFilter?: string[], excludeFilter?: string[], customRange?: DateRange | null, customRangeLabel?: string, initialDay?: string): Promise<void> {
  await loadPricing()
  const dayRange = initialDay ? getDayRange(initialDay) : null
  const range = dayRange ?? customRange ?? getPeriodRange(period)
  const filteredProjects = filterProjectsByName(await parseAllSessions(range, provider), projectFilter, excludeFilter)
  const planUsages = await getPlanUsages()
  const isTTY = process.stdin.isTTY && process.stdout.isTTY
  const label = initialDay ? formatDayRangeLabel(initialDay) : customRangeLabel
  patchStdoutForWindows()
  if (isTTY) {
    const { waitUntilExit } = render(
      <InteractiveDashboard initialProjects={filteredProjects} initialPeriod={period} initialProvider={provider} initialPlanUsages={planUsages} refreshSeconds={refreshSeconds} projectFilter={projectFilter} excludeFilter={excludeFilter} customRange={customRange} customRangeLabel={customRangeLabel} initialDay={initialDay} />
    )
    await waitUntilExit()
  } else {
    const { unmount } = render(<StaticDashboard projects={filteredProjects} period={period} activeProvider={provider} planUsages={planUsages} label={label} dayMode={initialDay != null} />, { patchConsole: false })
    unmount()
  }
}
