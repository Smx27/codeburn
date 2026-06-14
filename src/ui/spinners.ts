import chalk from 'chalk'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const CYAN = chalk.cyan
const DIM = chalk.dim

export class Spinner {
  private frame = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private currentMessage = ''

  start(message: string): void {
    this.currentMessage = message
    process.stderr.write(`\r  ${CYAN(FRAMES[0])} ${message}`)
    this.timer = setInterval(() => {
      this.frame = (this.frame + 1) % FRAMES.length
      process.stderr.write(`\r  ${CYAN(FRAMES[this.frame])} ${this.currentMessage}`)
    }, 80)
  }

  update(message: string): void {
    this.currentMessage = message
    process.stderr.write(`\r  ${CYAN(FRAMES[this.frame])} ${message}`)
  }

  succeed(message: string): void {
    this.stop()
    process.stderr.write(`\r  ${chalk.green('✓')} ${message}\n`)
  }

  fail(message: string): void {
    this.stop()
    process.stderr.write(`\r  ${chalk.red('✗')} ${message}\n`)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    process.stderr.write('\r' + ' '.repeat(this.currentMessage.length + 4) + '\r')
  }
}

export function createSpinner(): Spinner {
  return new Spinner()
}

export function renderProgressBar(current: number, total: number, width = 30): string {
  const pct = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * width)
  const empty = width - filled
  const bar = CYAN('█'.repeat(filled)) + DIM('░'.repeat(empty))
  return `  ${bar} ${DIM(`${pct}%`)} ${DIM(`(${current}/${total})`)}`
}

export function renderBatchProgress(current: number, total: number): string {
  return `  ${CYAN('▸')} Uploading batch ${chalk.bold(current)}/${total}`
}
