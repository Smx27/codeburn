import chalk from 'chalk'

const DIM = chalk.dim
const BOLD = chalk.bold
const CYAN = chalk.cyan
const GREEN = chalk.green
const YELLOW = chalk.yellow

export function renderCustomHelp(): string {
  const lines: string[] = [
    '',
    `  ${BOLD.cyan('AIInsight Agent')}`,
    `  ${DIM('AI Usage Intelligence Platform')}`,
    '',
    `  ${BOLD('Usage:')}`,
    `    aiinsight ${GREEN('<command>')} ${DIM('[options]')}`,
    '',
    `  ${BOLD('Commands:')}`,
    '',
    `    ${CYAN('report')}       Interactive usage dashboard ${DIM('(default)')}`,
    `    ${CYAN('status')}       Compact status output`,
    `    ${CYAN('today')}        Today's usage dashboard`,
    `    ${CYAN('month')}        This month's usage dashboard`,
    `    ${CYAN('export')}       Export usage data to CSV or JSON`,
    `    ${CYAN('models')}       Per-model token + cost table`,
    `    ${CYAN('compare')}      Compare two AI models side-by-side`,
    `    ${CYAN('optimize')}     Find token waste and get fixes`,
    `    ${CYAN('yield')}        Track spend vs shipped code`,
    `    ${CYAN('sync')}         Sync usage to AIInsight Cloud`,
    `    ${CYAN('doctor')}       Run diagnostics`,
    `    ${CYAN('version')}      Show version info`,
    `    ${CYAN('currency')}     Set display currency`,
    `    ${CYAN('plan')}         Configure subscription plan`,
    `    ${CYAN('model-alias')}  Map model names for pricing`,
    `    ${CYAN('model-savings')} Track local model savings`,
    `    ${CYAN('proxy-path')}   Mark proxy-backed projects`,
    `    ${CYAN('menubar')}      Install macOS menubar app`,
    `    ${CYAN('mcp')}          Run MCP server (stdio)`,
    `    ${CYAN('showcase')}     Enterprise demo dashboard (investor mode)`,
    '',
    `  ${BOLD('Options:')}`,
    '',
    `    ${YELLOW('--verbose')}      Print debug info to stderr`,
    `    ${YELLOW('--timezone')}     IANA timezone for date grouping`,
    `    ${YELLOW('-h, --help')}     Show this help`,
    `    ${YELLOW('-V, --version')}  Show version`,
    '',
    `  ${BOLD('Examples:')}`,
    '',
    `    aiinsight                    ${DIM('# open the dashboard')}`,
    `    aiinsight report -p month    ${DIM('# monthly report')}`,
    `    aiinsight status             ${DIM('# quick status')}`,
    `    aiinsight export -f json     ${DIM('# export as JSON')}`,
    `    aiinsight optimize           ${DIM('# find waste')}`,
    `    aiinsight sync --once        ${DIM('# one-time cloud sync')}`,
    `    aiinsight doctor             ${DIM('# run diagnostics')}`,
    '',
  ]
  return lines.join('\n')
}
