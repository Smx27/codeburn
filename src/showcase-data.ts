import crypto from 'crypto'
import type { ProjectSummary, SessionSummary, TokenUsage, TaskCategory, ClassifiedTurn } from './types.js'

const PROJECTS = [
  { name: 'api-gateway', prompts: ['Add rate limiting middleware', 'Fix CORS headers for OPTIONS requests', 'Implement request validation with Zod', 'Optimize database connection pooling', 'Add graceful shutdown handling', 'Implement request ID propagation', 'Fix memory leak in WebSocket handler', 'Add circuit breaker for external APIs'] },
  { name: 'dashboard-v2', prompts: ['Add dark mode toggle with system preference', 'Fix chart rendering on mobile viewports', 'Implement real-time data streaming', 'Add keyboard navigation for data table', 'Optimize lazy loading for widgets', 'Fix tooltip positioning near edges', 'Implement drag-and-drop layout', 'Add export to PDF for reports'] },
  { name: 'auth-service', prompts: ['Fix JWT token refresh race condition', 'Implement OAuth2 with Google and GitHub', 'Add RBAC middleware', 'Fix session invalidation on password change', 'Implement API key rotation', 'Add brute-force protection', 'Fix CORS with credentials', 'Implement audit logging'] },
  { name: 'data-pipeline', prompts: ['Add dead letter queue for failed records', 'Optimize batch processing throughput', 'Implement schema validation', 'Fix data deduplication logic', 'Add monitoring and alerting', 'Implement backpressure handling', 'Fix timezone conversion issues', 'Add data lineage tracking'] },
  { name: 'payment-service', prompts: ['Implement Stripe webhook verification', 'Add idempotency keys for payments', 'Fix currency conversion rounding', 'Implement partial refund processing', 'Add PCI compliance logging', 'Fix concurrent payment race conditions', 'Implement payment retry logic', 'Add multi-currency support'] },
  { name: 'mobile-app', prompts: ['Fix push notification token refresh', 'Implement offline-first sync', 'Add biometric authentication', 'Fix deep linking for Android', 'Implement image compression', 'Fix memory leak in image gallery', 'Add haptic feedback', 'Implement background task scheduling'] },
  { name: 'ml-pipeline', prompts: ['Implement model versioning with MLflow', 'Add A/B testing framework', 'Fix feature store synchronization', 'Implement automated retraining', 'Add drift detection', 'Fix batch prediction memory usage', 'Implement shadow mode deployment', 'Add explainability reports'] },
  { name: 'notification-hub', prompts: ['Implement multi-channel delivery', 'Add template management', 'Fix rate limiting for providers', 'Implement preference center', 'Add delivery tracking analytics', 'Fix timezone-aware scheduling', 'Implement retry with backoff', 'Add A/B testing for content'] },
]

const MODELS = [
  { name: 'claude-sonnet-4', inputCost: 3 / 1_000_000, outputCost: 15 / 1_000_000, weight: 45 },
  { name: 'gpt-4.1', inputCost: 2 / 1_000_000, outputCost: 8 / 1_000_000, weight: 20 },
  { name: 'claude-opus-4', inputCost: 15 / 1_000_000, outputCost: 75 / 1_000_000, weight: 15 },
  { name: 'gemini-2.5-pro', inputCost: 1.25 / 1_000_000, outputCost: 10 / 1_000_000, weight: 10 },
  { name: 'claude-haiku-3.5', inputCost: 0.8 / 1_000_000, outputCost: 4 / 1_000_000, weight: 10 },
]

const TOOLS = ['Bash', 'Read', 'Edit', 'Write', 'Glob', 'Grep', 'Agent', 'Task', 'WebFetch', 'TodoRead', 'TodoWrite']
const BASH_CMDS = ['npm test', 'npm run build', 'git status', 'git diff', 'git add -A && git commit', 'npx tsc --noEmit', 'docker compose up -d', 'curl -s localhost:3000/health']
const SKILLS = ['graphify', 'gsd-plan-phase', 'gsd-execute-phase', 'gsd-review', 'gsd-code-review', 'gsd-spike']
const AGENT_TYPES = ['explore', 'general']
const MCP_SERVERS = [
  { name: 'atlassian', weight: 35 },
  { name: 'figma', weight: 25 },
  { name: 'github', weight: 20 },
  { name: 'slack', weight: 10 },
  { name: 'postgres', weight: 5 },
  { name: 'filesystem', weight: 5 },
]
const CATEGORIES: TaskCategory[] = ['coding', 'debugging', 'feature', 'refactoring', 'testing', 'exploration', 'planning', 'delegation', 'git', 'build/deploy', 'general']

function uuid(): string { return crypto.randomUUID() }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)] }

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) { r -= item.weight; if (r <= 0) return item }
  return items[0]
}

function randomDate(monthsBack: number): Date {
  const now = Date.now()
  const d = new Date(now - Math.random() * monthsBack * 30 * 24 * 60 * 60 * 1000)
  if (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + (Math.random() > 0.5 ? 1 : 2))
  d.setHours(9 + rand(0, 8), rand(0, 59))
  return d
}

function makeTokenUsage(model: string, turnIdx: number): TokenUsage {
  const inputBase = model.includes('opus') ? rand(50000, 110000) : model.includes('haiku') ? rand(18000, 40000) : rand(30000, 85000)
  const outputBase = rand(10000, 40000)
  const cacheRate = Math.min(0.6, 0.15 + turnIdx * 0.03)
  return {
    inputTokens: inputBase,
    outputTokens: outputBase,
    cacheCreationInputTokens: Math.floor(inputBase * (1 - cacheRate) * 0.2),
    cacheReadInputTokens: Math.floor(inputBase * cacheRate),
    cachedInputTokens: 0,
    reasoningTokens: 0,
    webSearchRequests: 0,
  }
}

function makeTurns(count: number, startDate: Date): ClassifiedTurn[] {
  const turns: ClassifiedTurn[] = []
  for (let i = 0; i < count; i++) {
    const ts = new Date(startDate.getTime() + i * rand(30_000, 300_000))
    const model = weightedPick(MODELS)
    const usage = makeTokenUsage(model.name, i)
    const cost = usage.inputTokens * model.inputCost + usage.outputTokens * model.outputCost +
      usage.cacheReadInputTokens * model.inputCost * 0.1 + usage.cacheCreationInputTokens * model.outputCost * 0.5

    const toolCount = rand(1, 5)
    const toolsUsed: string[] = []
    for (let t = 0; t < toolCount; t++) { toolsUsed.push(pick(TOOLS)) }

    const cat = pick(CATEGORIES)
    const hasEdits = toolsUsed.some(t => t === 'Edit' || t === 'Write')

    turns.push({
      userMessage: pick(PROJECTS[0].prompts),
      assistantCalls: [{
        provider: 'claude',
        model: model.name,
        usage,
        costUSD: cost,
        tools: toolsUsed,
        mcpTools: [],
        skills: Math.random() < 0.15 ? [pick(SKILLS)] : [],
        subagentTypes: toolsUsed.includes('Agent') ? [pick(AGENT_TYPES)] : [],
        hasAgentSpawn: toolsUsed.includes('Agent'),
        hasPlanMode: false,
        speed: 'standard' as const,
        timestamp: ts.toISOString(),
        bashCommands: toolsUsed.includes('Bash') ? [pick(BASH_CMDS)] : [],
        deduplicationKey: uuid(),
      }],
      timestamp: ts.toISOString(),
      sessionId: uuid(),
      category: cat,
      retries: 0,
      hasEdits,
    })
  }
  return turns
}

function buildSession(projectName: string, monthOffset: number): SessionSummary {
  const sessionId = uuid()
  const startDate = randomDate(monthOffset)
  const turnCount = rand(30, 80)
  const turns = makeTurns(turnCount, startDate)

  let totalCost = 0, totalInput = 0, totalOutput = 0, totalCacheRead = 0, totalCacheWrite = 0, totalSavings = 0
  const modelBreakdown: SessionSummary['modelBreakdown'] = {}
  const toolBreakdown: SessionSummary['toolBreakdown'] = {}
  const categoryBreakdown: SessionSummary['categoryBreakdown'] = {} as any
  const skillBreakdown: SessionSummary['skillBreakdown'] = {}
  const subagentBreakdown: SessionSummary['subagentBreakdown'] = {}
  const mcpBreakdown: SessionSummary['mcpBreakdown'] = {}
  const bashBreakdown: SessionSummary['bashBreakdown'] = {}

  for (const cat of CATEGORIES) {
    categoryBreakdown[cat] = { turns: 0, costUSD: 0, savingsUSD: 0, retries: 0, editTurns: 0, oneShotTurns: 0 }
  }

  for (const turn of turns) {
    for (const call of turn.assistantCalls) {
      totalCost += call.costUSD
      totalInput += call.usage.inputTokens
      totalOutput += call.usage.outputTokens
      totalCacheRead += call.usage.cacheReadInputTokens
      totalCacheWrite += call.usage.cacheCreationInputTokens

      if (!modelBreakdown[call.model]) modelBreakdown[call.model] = { calls: 0, costUSD: 0, tokens: { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, cachedInputTokens: 0, reasoningTokens: 0, webSearchRequests: 0 }, savingsUSD: 0 }
      modelBreakdown[call.model].calls++
      modelBreakdown[call.model].costUSD += call.costUSD
      modelBreakdown[call.model].tokens.inputTokens += call.usage.inputTokens
      modelBreakdown[call.model].tokens.outputTokens += call.usage.outputTokens

      for (const tool of call.tools) {
        toolBreakdown[tool] = { calls: (toolBreakdown[tool]?.calls ?? 0) + 1 }
      }
      for (const skill of call.skills) {
        if (!skillBreakdown[skill]) skillBreakdown[skill] = { turns: 0, costUSD: 0, savingsUSD: 0, editTurns: 0, oneShotTurns: 0 }
        skillBreakdown[skill].turns++
        skillBreakdown[skill].costUSD += call.costUSD
      }
      for (const agent of call.subagentTypes) {
        if (!subagentBreakdown[agent]) subagentBreakdown[agent] = { calls: 0, costUSD: 0, savingsUSD: 0 }
        subagentBreakdown[agent].calls++
        subagentBreakdown[agent].costUSD += call.costUSD
      }
      for (const cmd of call.bashCommands) {
        bashBreakdown[cmd] = { calls: (bashBreakdown[cmd]?.calls ?? 0) + 1 }
      }
    }

    const cat = turn.category
    categoryBreakdown[cat].turns++
    categoryBreakdown[cat].costUSD += turn.assistantCalls.reduce((s, c) => s + c.costUSD, 0)
    if (turn.hasEdits) {
      categoryBreakdown[cat].editTurns++
      if (turn.assistantCalls.length <= 2) categoryBreakdown[cat].oneShotTurns++
    }
  }

  // Populate MCP server usage — each session uses 2-4 MCP servers
  const activeMcpServers = rand(2, 4)
  const shuffledMcp = [...MCP_SERVERS].sort(() => Math.random() - 0.5).slice(0, activeMcpServers)
  for (const srv of shuffledMcp) {
    const calls = rand(5, Math.floor(turnCount * 1.5))
    mcpBreakdown[srv.name] = { calls }
  }

  return {
    sessionId,
    project: projectName,
    firstTimestamp: turns[0]?.timestamp ?? startDate.toISOString(),
    lastTimestamp: turns[turns.length - 1]?.timestamp ?? startDate.toISOString(),
    totalCostUSD: totalCost,
    totalSavingsUSD: totalSavings,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalCacheReadTokens: totalCacheRead,
    totalCacheWriteTokens: totalCacheWrite,
    apiCalls: turns.reduce((s, t) => s + t.assistantCalls.length, 0),
    turns,
    modelBreakdown,
    toolBreakdown,
    mcpBreakdown,
    bashBreakdown,
    categoryBreakdown,
    skillBreakdown,
    subagentBreakdown,
  }
}

export function generateShowcaseData(): ProjectSummary[] {
  const projects: ProjectSummary[] = []
  let idx = 0
  for (const proj of PROJECTS) {
    const sessionCount = Math.max(100, Math.floor(220 / (idx + 1)))
    const sessions: SessionSummary[] = []
    for (let s = 0; s < sessionCount; s++) {
      sessions.push(buildSession(proj.name, rand(0, 6)))
    }
    const totalCost = sessions.reduce((s, ss) => s + ss.totalCostUSD, 0)
    projects.push({
      project: proj.name,
      projectPath: `${proj.name}`,
      sessions,
      totalCostUSD: totalCost,
      totalSavingsUSD: 0,
      totalApiCalls: sessions.reduce((s, ss) => s + ss.apiCalls, 0),
      totalProxiedCostUSD: 0,
    })
    idx++
  }
  return projects.sort((a, b) => b.totalCostUSD - a.totalCostUSD)
}
