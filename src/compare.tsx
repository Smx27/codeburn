import React, { useState, useEffect, useRef } from 'react'
import { render, Box, Text, useInput, useApp, useStdout } from 'ink'

import type { ModelStats, ComparisonRow, CategoryComparison, WorkingStyleRow } from './compare-stats.js'
import { aggregateModelStats, computeComparison, computeCategoryComparison, computeWorkingStyle, scanSelfCorrections } from './compare-stats.js'
import { formatCost } from './format.js'
import { parseAllSessions } from './parser.js'
import { getAllProviders } from './providers/index.js'
import type { ProjectSummary, DateRange } from './types.js'
import { patchStdoutForWindows } from './ink-win.js'

const PRIMARY = '#6366F1'
const BAR_A = '#6366F1'
const BAR_B = '#10B981'
const SUCCESS = '#10B981'
const DANGER = '#EF4444'
const GOLD = '#FBBF24'
const DIM = '#475569'
const LOW_DATA_THRESHOLD = 20
const LABEL_WIDTH = 20
const VALUE_WIDTH = 14
const MODEL_NAME_COL = 24
const BAR_MAX_WIDTH = 20
const MIN_WIDE = 90
const MS_PER_DAY = 24 * 60 * 60 * 1000
const FULL_BLOCK = '\u2588'

function formatValue(value: number | null, fmt: ComparisonRow['formatFn']): string {
  if (value === null) return '-'
  switch (fmt) {
    case 'cost': return formatCost(value)
    case 'number': return Math.round(value).toLocaleString()
    case 'percent': return `${value.toFixed(1)}%`
    case 'decimal': return value.toFixed(2)
  }
}

function shortName(model: string): string {
  return model.replace(/^claude-/, '').replace(/-\d{8}$/, '')
}

function daysOfData(first: string, last: string): number {
  if (!first || !last) return 0
  const ms = new Date(last).getTime() - new Date(first).getTime()
  return Math.max(1, Math.ceil(ms / MS_PER_DAY))
}

function fit(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) : s.padEnd(n)
}

function barWidth(rate: number): number {
  return Math.round((rate / 100) * BAR_MAX_WIDTH)
}

function SparkBar({ value, max, width, color }: { value: number; max: number; width: number; color: string }) {
  if (max === 0) return <Text color={DIM}>{'░'.repeat(width)}</Text>
  const filled = Math.round((value / max) * width)
  return (
    <Text>
      <Text color={color}>{'█'.repeat(Math.min(filled, width))}</Text>
      <Text color="#1E293B">{'░'.repeat(Math.max(width - filled, 0))}</Text>
    </Text>
  )
}

function SideBar({ valueA, valueB, max, width }: { valueA: number; valueB: number; max: number; width: number }) {
  if (max === 0) return <Text color={DIM}>{'░'.repeat(width)}</Text>
  const mid = Math.floor(width / 2)
  const filledA = Math.round((valueA / max) * mid)
  const filledB = Math.round((valueB / max) * mid)
  return (
    <Text>
      <Text color={BAR_A}>{'█'.repeat(Math.min(filledA, mid))}</Text>
      <Text color="#1E293B">{'░'.repeat(Math.max(mid - filledA, 0))}</Text>
      <Text color={DIM}>│</Text>
      <Text color="#1E293B">{'░'.repeat(Math.max(mid - filledB, 0))}</Text>
      <Text color={BAR_B}>{'█'.repeat(Math.min(filledB, mid))}</Text>
    </Text>
  )
}

function WinnerBadge({ winner }: { winner: 'a' | 'b' | 'tie' | 'none' }) {
  if (winner === 'a') return <Text color={BAR_A}> ◀</Text>
  if (winner === 'b') return <Text color={BAR_B}>▶ </Text>
  return null
}

function ScoreRing({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const pct = maxScore > 0 ? score / maxScore : 0
  const idx = pct < 0.33 ? 0 : pct < 0.66 ? 1 : 2
  const chars = ['◔', '◕', '●']
  return <Text color={color}>{chars[idx]}</Text>
}

type ModelSelectorProps = {
  models: ModelStats[]
  onSelect: (a: ModelStats, b: ModelStats) => void
  onBack: () => void
}

function ModelSelector({ models, onSelect, onBack }: ModelSelectorProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const termWidth = stdout?.columns || 80
  const dashWidth = Math.min(160, termWidth)
  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  useInput((input, key) => {
    if (input === 'q') { exit(); return }
    if (key.escape) { onBack(); return }

    if (key.upArrow) {
      setCursor(c => (c - 1 + models.length) % models.length)
      return
    }
    if (key.downArrow) {
      setCursor(c => (c + 1) % models.length)
      return
    }

    if (input === ' ') {
      setSelected(prev => {
        const next = new Set(prev)
        if (next.has(cursor)) {
          next.delete(cursor)
        } else if (next.size < 2) {
          next.add(cursor)
        }
        return next
      })
      return
    }

    if (key.return && selected.size === 2) {
      const indices = [...selected].sort((a, b) => a - b)
      onSelect(models[indices[0]!]!, models[indices[1]!]!)
    }
  })

  const maxCost = Math.max(...models.map(m => m.cost), 0.001)

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box flexDirection="column" borderStyle="round" borderColor={PRIMARY} paddingX={1}>
        <Text bold color={PRIMARY}>◆ Model Comparison</Text>
        <Text> </Text>
        <Text color={DIM}>Select two models to compare:</Text>
        <Text> </Text>
        {models.map((m, i) => {
          const isCursor = i === cursor
          const isSelected = selected.has(i)
          const lowData = m.calls < LOW_DATA_THRESHOLD
          const prefix = isCursor ? '▸ ' : '  '
          const oneShotRate = m.editTurns > 0 ? (m.oneShotTurns / m.editTurns) * 100 : 0
          return (
            <Box key={m.model} flexDirection="column">
              <Text>
                <Text color={isCursor ? PRIMARY : undefined}>{prefix}</Text>
                <Text bold={isSelected} color={isSelected ? (selected.size === 1 ? BAR_A : BAR_B) : undefined}>
                  {fit(shortName(m.model), MODEL_NAME_COL)}
                </Text>
                <Text color={GOLD}>{formatCost(m.cost).padStart(10)}</Text>
                <Text> </Text>
                <Text>{m.calls.toLocaleString().padStart(6)} calls</Text>
                {isSelected && <Text color={selected.size === 1 ? BAR_A : BAR_B}>  [picked]</Text>}
                {lowData && <Text color={DIM}>  ⚠ low data</Text>}
              </Text>
              <Text>
                <Text>{''.padEnd(MODEL_NAME_COL + 2)}</Text>
                <SparkBar value={m.cost} max={maxCost} width={Math.min(20, Math.floor(dashWidth / 6))} color={isSelected ? (selected.size === 1 ? BAR_A : BAR_B) : DIM} />
                <Text> </Text>
                <ScoreRing score={oneShotRate} maxScore={100} color={oneShotRate > 70 ? SUCCESS : oneShotRate > 40 ? GOLD : DANGER} />
                <Text color={DIM}> {oneShotRate.toFixed(0)}%</Text>
              </Text>
            </Box>
          )
        })}
      </Box>
      <Text> </Text>
      <Text>
        <Text color={PRIMARY} bold>[space]</Text><Text dimColor> select  </Text>
        <Text color={PRIMARY} bold>[enter]</Text><Text dimColor> compare  </Text>
        <Text color={PRIMARY} bold>{'<>'}</Text><Text dimColor> switch period  </Text>
        <Text color={PRIMARY} bold>[esc]</Text><Text dimColor> back  </Text>
        <Text color={PRIMARY} bold>[q]</Text><Text dimColor> quit</Text>
      </Text>
    </Box>
  )
}

type ComparisonResultsProps = {
  modelA: ModelStats
  modelB: ModelStats
  rows: ComparisonRow[]
  categories: CategoryComparison[]
  workingStyle: WorkingStyleRow[]
  onBack: () => void
}

function MetricPanel({ title, rows, nameA, nameB, pw }: { title: string; rows: ComparisonRow[]; nameA: string; nameB: string; pw: number }) {
  const maxVal = Math.max(...rows.map(r => Math.max(r.valueA ?? 0, r.valueB ?? 0)), 1)
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={PRIMARY} paddingX={1} width={pw}>
      <Text bold color={PRIMARY}>▸ {title}</Text>
      <Text>
        <Text>{''.padEnd(LABEL_WIDTH)}</Text>
        <Text bold color={BAR_A}>{nameA.padStart(VALUE_WIDTH)}</Text>
        <Text bold color={BAR_B}>{'  ' + nameB.padStart(VALUE_WIDTH)}</Text>
      </Text>
      {rows.map(row => {
        const fmtA = formatValue(row.valueA, row.formatFn)
        const fmtB = formatValue(row.valueB, row.formatFn)
        const bw = Math.max(4, Math.min(BAR_MAX_WIDTH, Math.floor((pw - LABEL_WIDTH - VALUE_WIDTH * 2 - 6) / 2)))
        return (
          <Box key={row.label} flexDirection="column">
            <Text>
              <Text color={DIM}>{row.label.padEnd(LABEL_WIDTH)}</Text>
              <Text color={row.winner === 'a' ? BAR_A : DIM}>{fmtA.padStart(VALUE_WIDTH)}</Text>
              <Text color={row.winner === 'b' ? BAR_B : DIM}>{'  ' + fmtB.padStart(VALUE_WIDTH)}</Text>
              <WinnerBadge winner={row.winner} />
            </Text>
            <Text>
              <Text>{''.padEnd(LABEL_WIDTH)}</Text>
              <SideBar valueA={row.valueA ?? 0} valueB={row.valueB ?? 0} max={maxVal} width={bw * 2 + 1} />
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}

function ContextPanel({ title, rows, nameA, nameB, pw, lowDataWarning }: { title: string; rows: { label: string; valueA: string; valueB: string }[]; nameA: string; nameB: string; pw: number; lowDataWarning?: string }) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={PRIMARY} paddingX={1} width={pw}>
      <Text bold color={PRIMARY}>▸ {title}</Text>
      <Text>
        <Text>{''.padEnd(LABEL_WIDTH)}</Text>
        <Text bold color={BAR_A}>{nameA.padStart(VALUE_WIDTH)}</Text>
        <Text bold color={BAR_B}>{'  ' + nameB.padStart(VALUE_WIDTH)}</Text>
      </Text>
      {rows.map(row => (
        <Text key={row.label}>
          <Text color={DIM}>{row.label.padEnd(LABEL_WIDTH)}</Text>
          <Text color={BAR_A}>{row.valueA.padStart(VALUE_WIDTH)}</Text>
          <Text color={BAR_B}>{'  ' + row.valueB.padStart(VALUE_WIDTH)}</Text>
        </Text>
      ))}
      {lowDataWarning && <Text color={GOLD}>{lowDataWarning}</Text>}
    </Box>
  )
}

function ComparisonResults({ modelA, modelB, rows, categories, workingStyle, onBack }: ComparisonResultsProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const termWidth = stdout?.columns || 80
  const dashWidth = Math.min(160, termWidth)
  const wide = dashWidth >= MIN_WIDE
  const halfWidth = wide ? Math.floor(dashWidth / 2) : dashWidth

  const nameA = shortName(modelA.model)
  const nameB = shortName(modelB.model)
  const lowDataA = modelA.calls < LOW_DATA_THRESHOLD
  const lowDataB = modelB.calls < LOW_DATA_THRESHOLD

  useInput((input, key) => {
    if (input === 'q') { exit(); return }
    if (key.escape) { onBack(); return }
  })

  const sectionOrder: string[] = []
  const sectionRows = new Map<string, ComparisonRow[]>()
  for (const row of rows) {
    if (!sectionRows.has(row.section)) {
      sectionOrder.push(row.section)
      sectionRows.set(row.section, [])
    }
    sectionRows.get(row.section)!.push(row)
  }

  const fmtTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  const oneShotA = modelA.editTurns > 0 ? (modelA.oneShotTurns / modelA.editTurns) * 100 : 0
  const oneShotB = modelB.editTurns > 0 ? (modelB.oneShotTurns / modelB.editTurns) * 100 : 0
  const costPerCallA = modelA.calls > 0 ? modelA.cost / modelA.calls : 0
  const costPerCallB = modelB.calls > 0 ? modelB.cost / modelB.calls : 0
  const totalA = modelA.inputTokens + modelA.cacheReadTokens + modelA.cacheWriteTokens
  const totalB = modelB.inputTokens + modelB.cacheReadTokens + modelB.cacheWriteTokens
  const cacheA = totalA > 0 ? (modelA.cacheReadTokens / totalA) * 100 : 0
  const cacheB = totalB > 0 ? (modelB.cacheReadTokens / totalB) * 100 : 0

  const lowDataWarning = (lowDataA || lowDataB)
    ? `⚠ ${[lowDataA && nameA, lowDataB && nameB].filter(Boolean).join(' and ')} ha${lowDataA && lowDataB ? 've' : 's'} fewer than ${LOW_DATA_THRESHOLD} calls`
    : undefined

  const pw = wide ? halfWidth : dashWidth

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box flexDirection="column" borderStyle="round" borderColor={PRIMARY} paddingX={1} width={dashWidth}>
        <Text>
          <Text bold color={BAR_A}>◆ {nameA}</Text>
          <Text dimColor>  vs  </Text>
          <Text bold color={BAR_B}>{nameB} ◆</Text>
        </Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor={PRIMARY} paddingX={1} width={dashWidth}>
        <Text bold color={PRIMARY}>▸ Quick Stats</Text>
        <Text> </Text>
        <Text>
          <Text color={DIM}>{'One-shot'.padEnd(LABEL_WIDTH)}</Text>
          <Text color={BAR_A}>{oneShotA.toFixed(1).padStart(VALUE_WIDTH)}</Text>
          <Text color={BAR_B}>{'  ' + oneShotB.toFixed(1).padStart(VALUE_WIDTH)}</Text>
          <WinnerBadge winner={oneShotA > oneShotB ? 'a' : oneShotB > oneShotA ? 'b' : 'tie'} />
        </Text>
        <Text>
          <Text color={DIM}>{'Cost/call'.padEnd(LABEL_WIDTH)}</Text>
          <Text color={costPerCallA <= costPerCallB ? SUCCESS : DANGER}>{formatCost(costPerCallA).padStart(VALUE_WIDTH)}</Text>
          <Text color={costPerCallB <= costPerCallA ? SUCCESS : DANGER}>{'  ' + formatCost(costPerCallB).padStart(VALUE_WIDTH)}</Text>
          <WinnerBadge winner={costPerCallA <= costPerCallB ? 'a' : costPerCallB <= costPerCallA ? 'b' : 'tie'} />
        </Text>
        <Text>
          <Text color={DIM}>{'Cache hit'.padEnd(LABEL_WIDTH)}</Text>
          <Text color={cacheA >= cacheB ? SUCCESS : DANGER}>{cacheA.toFixed(1).padStart(VALUE_WIDTH)}</Text>
          <Text color={cacheB >= cacheA ? SUCCESS : DANGER}>{'  ' + cacheB.toFixed(1).padStart(VALUE_WIDTH)}</Text>
          <WinnerBadge winner={cacheA >= cacheB ? 'a' : cacheB >= cacheA ? 'b' : 'tie'} />
        </Text>
        <Text> </Text>
        <Text>
          <Text>{''.padEnd(LABEL_WIDTH)}</Text>
          <SparkBar value={oneShotA} max={100} width={VALUE_WIDTH} color={BAR_A} />
          <Text> </Text>
          <SparkBar value={oneShotB} max={100} width={VALUE_WIDTH} color={BAR_B} />
        </Text>
        <Text>
          <Text>{''.padEnd(LABEL_WIDTH)}</Text>
          <SparkBar value={costPerCallA} max={Math.max(costPerCallA, costPerCallB, 0.001)} width={VALUE_WIDTH} color={costPerCallA <= costPerCallB ? SUCCESS : DANGER} />
          <Text> </Text>
          <SparkBar value={costPerCallB} max={Math.max(costPerCallA, costPerCallB, 0.001)} width={VALUE_WIDTH} color={costPerCallB <= costPerCallA ? SUCCESS : DANGER} />
        </Text>
        <Text>
          <Text>{''.padEnd(LABEL_WIDTH)}</Text>
          <SparkBar value={cacheA} max={100} width={VALUE_WIDTH} color={cacheA >= cacheB ? SUCCESS : DANGER} />
          <Text> </Text>
          <SparkBar value={cacheB} max={100} width={VALUE_WIDTH} color={cacheB >= cacheA ? SUCCESS : DANGER} />
        </Text>
      </Box>

      <Box width={dashWidth}>
        <MetricPanel title={sectionOrder[0] ?? 'Performance'} rows={sectionRows.get(sectionOrder[0] ?? '') ?? []} nameA={nameA} nameB={nameB} pw={pw} />
        <MetricPanel title={sectionOrder[1] ?? 'Efficiency'} rows={sectionRows.get(sectionOrder[1] ?? '') ?? []} nameA={nameA} nameB={nameB} pw={pw} />
      </Box>

      {categories.length > 0 && (
        <Box flexDirection="column" borderStyle="round" borderColor={PRIMARY} paddingX={1} width={dashWidth}>
          <Text bold color={PRIMARY}>▸ Category Head-to-Head</Text>
          <Text color={DIM}>one-shot rate per category</Text>
          <Text>
            <Text>{'  '}</Text>
            <Text color={BAR_A}>{FULL_BLOCK + FULL_BLOCK}</Text>
            <Text> {nameA}    </Text>
            <Text color={BAR_B}>{FULL_BLOCK + FULL_BLOCK}</Text>
            <Text> {nameB}</Text>
          </Text>
          {categories.map(cat => {
            const bwA = cat.oneShotRateA !== null ? barWidth(cat.oneShotRateA) : 0
            const bwB = cat.oneShotRateB !== null ? barWidth(cat.oneShotRateB) : 0
            const rateA = cat.oneShotRateA !== null ? `${cat.oneShotRateA.toFixed(1)}%` : '-'
            const rateB = cat.oneShotRateB !== null ? `${cat.oneShotRateB.toFixed(1)}%` : '-'
            const turnsA = cat.editTurnsA > 0 ? `(${cat.editTurnsA})` : ''
            const turnsB = cat.editTurnsB > 0 ? `(${cat.editTurnsB})` : ''

            return (
              <React.Fragment key={cat.category}>
                <Text> </Text>
                <Text color={DIM}>{'  '}{cat.category}</Text>
                <Text>
                  <Text>{'  '}</Text>
                  <Text color={BAR_A}>{FULL_BLOCK.repeat(Math.max(bwA, 1))}</Text>
                  <Text>{' '.repeat(Math.max(0, BAR_MAX_WIDTH - bwA))} </Text>
                  <Text color={cat.winner === 'a' ? SUCCESS : undefined}>{rateA.padStart(6)}</Text>
                  <Text color={DIM}> {turnsA}</Text>
                </Text>
                <Text>
                  <Text>{'  '}</Text>
                  <Text color={BAR_B}>{FULL_BLOCK.repeat(Math.max(bwB, 1))}</Text>
                  <Text>{' '.repeat(Math.max(0, BAR_MAX_WIDTH - bwB))} </Text>
                  <Text color={cat.winner === 'b' ? SUCCESS : undefined}>{rateB.padStart(6)}</Text>
                  <Text color={DIM}> {turnsB}</Text>
                </Text>
              </React.Fragment>
            )
          })}
        </Box>
      )}

      <Box width={dashWidth}>
        {workingStyle.length > 0 && (
          <ContextPanel title="Working Style" rows={workingStyle.map(r => ({ label: r.label, valueA: formatValue(r.valueA, r.formatFn), valueB: formatValue(r.valueB, r.formatFn) }))} nameA={nameA} nameB={nameB} pw={pw} />
        )}
        <ContextPanel title="Context" rows={[
          { label: 'Total calls', valueA: modelA.calls.toLocaleString(), valueB: modelB.calls.toLocaleString() },
          { label: 'Total cost', valueA: formatCost(modelA.cost), valueB: formatCost(modelB.cost) },
          { label: 'Input tokens', valueA: fmtTokens(modelA.inputTokens), valueB: fmtTokens(modelB.inputTokens) },
          { label: 'Output tokens', valueA: fmtTokens(modelA.outputTokens), valueB: fmtTokens(modelB.outputTokens) },
          { label: 'Edit turns', valueA: modelA.editTurns.toLocaleString(), valueB: modelB.editTurns.toLocaleString() },
          { label: 'Self-corrections', valueA: modelA.selfCorrections.toLocaleString(), valueB: modelB.selfCorrections.toLocaleString() },
          { label: 'Days of data', valueA: String(daysOfData(modelA.firstSeen, modelA.lastSeen)), valueB: String(daysOfData(modelB.firstSeen, modelB.lastSeen)) },
        ]} nameA={nameA} nameB={nameB} pw={pw} lowDataWarning={lowDataWarning} />
      </Box>

      <Text>
        <Text color={PRIMARY} bold>{'<>'}</Text><Text dimColor> switch period  </Text>
        <Text color={PRIMARY} bold>[esc]</Text><Text dimColor> back  </Text>
        <Text color={PRIMARY} bold>[q]</Text><Text dimColor> quit</Text>
      </Text>
    </Box>
  )
}

type CompareViewProps = {
  projects: ProjectSummary[]
  onBack: () => void
}

export function CompareView({ projects, onBack }: CompareViewProps) {
  const { exit } = useApp()
  const [phase, setPhase] = useState<'select' | 'loading' | 'results'>('select')
  const [models, setModels] = useState<ModelStats[]>(() => aggregateModelStats(projects))
  const [pickedNames, setPickedNames] = useState<[string, string] | null>(null)
  const [selectedA, setSelectedA] = useState<ModelStats | null>(null)
  const [selectedB, setSelectedB] = useState<ModelStats | null>(null)
  const [rows, setRows] = useState<ComparisonRow[]>([])
  const [categories, setCategories] = useState<CategoryComparison[]>([])
  const [style, setStyle] = useState<WorkingStyleRow[]>([])
  const [loadTrigger, setLoadTrigger] = useState(0)
  const projectsRef = useRef(projects)
  projectsRef.current = projects

  useEffect(() => {
    const newModels = aggregateModelStats(projects)
    setModels(newModels)

    if (!pickedNames) return
    const hasA = newModels.some(m => m.model === pickedNames[0])
    const hasB = newModels.some(m => m.model === pickedNames[1])
    if (!hasA || !hasB) {
      setPickedNames(null)
      setPhase('select')
      return
    }

    if (phase === 'results') {
      const a = newModels.find(m => m.model === pickedNames[0])
      const b = newModels.find(m => m.model === pickedNames[1])
      if (!a || !b) return
      const aCopy = { ...a, selfCorrections: selectedA?.selfCorrections ?? 0 }
      const bCopy = { ...b, selfCorrections: selectedB?.selfCorrections ?? 0 }
      setSelectedA(aCopy)
      setSelectedB(bCopy)
      setRows(computeComparison(aCopy, bCopy))
      setCategories(computeCategoryComparison(projects, a.model, b.model))
      setStyle(computeWorkingStyle(projects, a.model, b.model))
      return
    }

    setLoadTrigger(t => t + 1)
  }, [projects])

  useEffect(() => {
    if (loadTrigger === 0 || !pickedNames) return
    let cancelled = false
    setPhase('loading')

    const currentModels = aggregateModelStats(projectsRef.current)
    const a = currentModels.find(m => m.model === pickedNames[0])
    const b = currentModels.find(m => m.model === pickedNames[1])
    if (!a || !b) { setPhase('select'); return }

    async function run() {
      const providers = await getAllProviders()
      const dirs: string[] = []
      for (const p of providers) {
        const sessions = await p.discoverSessions()
        for (const s of sessions) dirs.push(s.path)
      }
      const corrections = await scanSelfCorrections(dirs)
      if (cancelled) return

      const currentProjects = projectsRef.current
      const aCopy = { ...a!, selfCorrections: corrections.get(a!.model) ?? 0 }
      const bCopy = { ...b!, selfCorrections: corrections.get(b!.model) ?? 0 }
      setSelectedA(aCopy)
      setSelectedB(bCopy)
      setRows(computeComparison(aCopy, bCopy))
      setCategories(computeCategoryComparison(currentProjects, a!.model, b!.model))
      setStyle(computeWorkingStyle(currentProjects, a!.model, b!.model))
      setPhase('results')
    }

    run()
    return () => { cancelled = true }
  }, [loadTrigger])

  useInput((input, key) => {
    if (phase !== 'select') return
    if (models.length < 2) {
      if (input === 'q') { exit(); return }
      if (key.escape) { onBack(); return }
    }
  })

  if (models.length < 2) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={PRIMARY} paddingX={1}>
          <Text bold color={PRIMARY}>◆ Model Comparison</Text>
          <Text> </Text>
          <Text color={DIM}>Need at least 2 models to compare. Found {models.length}.</Text>
        </Box>
        <Text> </Text>
        <Text>
          <Text color={PRIMARY} bold>[esc]</Text><Text dimColor> back  </Text>
          <Text color={PRIMARY} bold>[q]</Text><Text dimColor> quit</Text>
        </Text>
      </Box>
    )
  }

  const handleSelect = (a: ModelStats, b: ModelStats) => {
    setPickedNames([a.model, b.model])
    setLoadTrigger(t => t + 1)
  }

  if (phase === 'loading') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box flexDirection="column" borderStyle="round" borderColor={PRIMARY} paddingX={1}>
          <Text bold color={PRIMARY}>◆ Model Comparison</Text>
          <Text> </Text>
          <Text color={DIM}>Scanning self-corrections...</Text>
        </Box>
      </Box>
    )
  }

  if (phase === 'results' && selectedA && selectedB) {
    return (
      <ComparisonResults
        modelA={selectedA}
        modelB={selectedB}
        rows={rows}
        categories={categories}
        workingStyle={style}
        onBack={() => setPhase('select')}
      />
    )
  }

  return (
    <ModelSelector
      models={models}
      onSelect={handleSelect}
      onBack={onBack}
    />
  )
}

export async function renderCompare(range: DateRange, provider: string): Promise<void> {
  const isTTY = process.stdin.isTTY && process.stdout.isTTY
  if (!isTTY) {
    process.stdout.write('Model comparison requires an interactive terminal.\n')
    return
  }

  patchStdoutForWindows()
  const projects = await parseAllSessions(range, provider)
  const { waitUntilExit } = render(
    <CompareView projects={projects} onBack={() => process.exit(0)} />
  )
  await waitUntilExit()
}
