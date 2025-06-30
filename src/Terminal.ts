import Renderer from './renderer'
import { type Char, type Color, type Modifier } from './Screen'

const ESC = '\x1B'

export class Terminal {
  fullscreen = true
  print = false
  isResized = false
  isMouseEnabled = false
  prevBuffer: Char[][] | undefined
  prevModifier: Modifier = {}
  nextWritePrefix = ''
  cursor = { x: 0, y: 0 }
  maxCursor = { x: 0, y: 0 }
  result: any

  private _stdIn: NodeJS.ReadStream;
  private _stdOut: NodeJS.WriteStream;

  /** Gets the standard input used by the terminal. */
  get stdIn(): NodeJS.ReadStream {
    return this._stdIn;
  }

  /** Gets the standard output used by the terminal. */
  get stdOut(): NodeJS.WriteStream {
    return this._stdOut;
  }

  /**
   * Initializes a new instance of the Terminal class.
   * @param stdIn The standard input. If not specified defaults to `process.stdin`.
   * @param stdOut The standard output. If not specified defaults to `process.stdout`.
   */
  constructor(stdIn: NodeJS.ReadStream = process.stdin, stdOut: NodeJS.WriteStream = process.stdout) {
    this._stdIn = stdIn;
    this._stdOut = stdOut;
  }
  
  init(fullscreen: boolean, print: boolean) {
    this.fullscreen = fullscreen
    this.print = print

    process.stdout.on('resize', () => {
      this.isResized = true
    })

    process.on('exit', this.onExit)

    if (fullscreen) {
      this.append(`${ESC}[?1049h`) // enables the alternative buffer
      this.append(`${ESC}c`) // clear screen
    }
    this.append(`${ESC}[?25l`) // make cursor invisible
  }

  reinit() {
    this.prevModifier = {}
    this.prevBuffer = undefined
    this.append(`${ESC}[?1049h${ESC}c${ESC}[?25l`) // enables the alternative buffer, clear screen, make cursor invisible
  }

  onExit = (code: number): void => {
    if (code !== 0) return;

    process.stdout.write(this[Symbol.dispose]());
    process.exit(0);
  }
  
  [Symbol.dispose](): string {
    process.off('exit', this.onExit)

    const sequence: string[] = []
    if (this.fullscreen) {
      sequence.push(`${ESC}[?1049l`) // disables the alternative buffer
    } else {
      const y = this.maxCursor.y - this.cursor.y
      if (y > 0) sequence.push(`${ESC}[${y}B`) // moves cursor down
      const x = this.maxCursor.x - this.cursor.x + 1
      if (x > 0) sequence.push(`${ESC}[${x}C`) // moves cursor right
      sequence.push(`\n`)
    }
    sequence.push(`${ESC}[?25h`) // make cursor visible
    if (this.isMouseEnabled) sequence.push(`${ESC}[?1000l`) // disable mouse
    return sequence.join('')
  }

  append(value: string): void {
    this.nextWritePrefix += value;
  }

  setResult(result: any): void {
    this.result = result;
  }
  
  parseHexColor(color: string) {
    if (!color.match(/^([\da-f]{6})|([\da-f]{3})$/i)) return

    return (
      color.length === 4
        ? color
            .substring(1, 4)
            .split('')
            .map(i => i + i)
        : (color.substring(1, 7).match(/.{2}/g) as any)
    ).map((i: string) => parseInt(i, 16))
  }

  parseColor(color: Color | string | number, offset = 0) {
    if (typeof color === 'number') {
      if (color < 0 || color > 255) throw new Error('color not found')
      return `${38 + offset};5;${color}`
    }

    if (color.startsWith('#')) {
      const [r, g, b] = this.parseHexColor(color)
      return `${38 + offset};2;${r};${g};${b}`
    }

    switch (color.toLowerCase()) {
      case "black": return 30 + offset;
      case "red": return 31 + offset;
      case "green": return 32 + offset;
      case "yellow": return 33 + offset;
      case "blue": return 34 + offset;
      case "magenta": return 35 + offset;
      case "cyan": return 36 + offset;
      case "white": return 37 + offset;
      case "brightblack": return 90 + offset;
      case "brightred": return 91 + offset;
      case "brightgreen": return 92 + offset;
      case "brightyellow": return 93 + offset;
      case "brightblue": return 94 + offset;
      case "brightmagenta": return 95 + offset;
      case "brightcyan": return 96 + offset;
      case "brightwhite": return 97 + offset;
      default:
        throw new Error("color not found");
    }
  }

  createModifierSequence(modifier: Modifier) {
    if (JSON.stringify(modifier) === '{}') return '0'

    const { prevModifier } = this

    const sequence: (number | string)[] = []

    if (modifier.color !== prevModifier.color) sequence.push(modifier.color ? this.parseColor(modifier.color) : 39)
    if (modifier.background !== prevModifier.background)
      sequence.push(modifier.background ? this.parseColor(modifier.background, 10) : 49)
    if (modifier.bold !== prevModifier.bold) sequence.push(modifier.bold ? 1 : modifier.dim ? '22;2' : 22)
    if (modifier.dim !== prevModifier.dim) sequence.push(modifier.dim ? 2 : modifier.bold ? '22;1' : 22)
    if (modifier.italic !== prevModifier.italic) sequence.push(modifier.italic ? 3 : 23)
    if (modifier.underline !== prevModifier.underline) sequence.push(modifier.underline ? 4 : 24)
    if (modifier.blinking !== prevModifier.blinking) sequence.push(modifier.blinking ? 5 : 25)
    if (modifier.inverse !== prevModifier.inverse) sequence.push(modifier.inverse ? 7 : 27)
    if (modifier.strikethrough !== prevModifier.strikethrough) sequence.push(modifier.strikethrough ? 9 : 29)

    return sequence.join(';')
  }

  /**
   * Indicates whether the specified character represents an icon.
   * @returns `True` if an icon, otherwise `false`.
   */
  isIcon(char: string): boolean {
    const code = char.charCodeAt(0)
    return (code >= 9211 && code <= 9214) || [9829, 9889, 11096].includes(code) || (code >= 57344 && code <= 64838);
  }

  render(buffer: Char[][]) {
    let result = ''

    const { isResized } = this
    if (isResized) {
      result += `${ESC}[H` // moves cursor to home position
      this.cursor = { x: 0, y: 0 }
      this.isResized = false
    }

    for (let y = 0; y < buffer.length; y++) {
      const line = buffer[y]
      const prevLine = this.prevBuffer?.[y]
      let includesEmoji = false
      let includesIcon = false

      const diffLine = isResized
        ? line
        : line
            .map((i: Char, x: number) => {
              const [prevChar, prevModifier] = prevLine && prevLine[x] ? prevLine[x] : [' ', {}]
              const [char, modifier] = i
              return this.isResized || prevChar !== char || JSON.stringify(prevModifier) !== JSON.stringify(modifier)
                ? i
                : null
            })
            .filter(i => i !== undefined)

      const chunks: Record<number, [string, string]> = {}
      let chunksAt = 0
      diffLine.forEach((value, x: number) => {
        if (value === null) return (chunksAt = x + 1)

        const [char, modifier] = value
        if (chunks[chunksAt] === undefined) chunks[chunksAt] = ['', '']
        if (JSON.stringify(modifier) !== JSON.stringify(this.prevModifier)) {
          chunks[chunksAt][1] += `\x1b[${this.createModifierSequence(modifier)}m`
          this.prevModifier = modifier
        }
        chunks[chunksAt][0] += char
        chunks[chunksAt][1] += char
      })

      Object.entries(chunks).map(([index, value]) => {
        const [str, strWithModifiers] = value as [string, string]
        const x = parseInt(index)
        if (/\p{Emoji}/u.test(str)) includesEmoji = true
        if (!includesIcon && str.split('').find((i: string) => this.isIcon(i))) includesIcon = true

        if (x === 0 && y === this.cursor.y + 1) {
          result += '\n'
        } else {
          if (!this.fullscreen && y > this.cursor.y && y > this.maxCursor.y) {
            const diff = y - this.maxCursor.y
            result += '\n'.repeat(diff)
            this.cursor = { y: this.cursor.y + diff, x: 0 }
          }

          if (y !== this.cursor.y && x !== this.cursor.x) {
            result += `${ESC}[${y + 1};${x + 1}H` // moves cursor to position
          } else if (y > this.cursor.y) {
            const diff = y - this.cursor.y
            result += `${ESC}[${diff > 1 ? diff : ''}B` // moves cursor down
          } else if (y < this.cursor.y) {
            const diff = this.cursor.y - y
            result += `${ESC}[${diff > 1 ? diff : ''}A` // moves cursor up
          } else if (x > this.cursor.x) {
            if (includesEmoji || includesIcon) {
              result += `${ESC}[G${ESC}[${x > 1 ? x : ''}C` // moves cursor to column, moves cursor right
            } else {
              const diff = x - this.cursor.x
              result += `${ESC}[${diff > 1 ? diff : ''}C` // moves cursor right
            }
          } else if (x < this.cursor.x) {
            if (includesEmoji) {
              result += `${ESC}[G${ESC}[${x > 1 ? x : ''}C` // moves cursor left
            } else {
              const diff = this.cursor.x - x
              result += `${ESC}[${diff > 1 ? diff : ''}D` // moves cursor left
            }
          }
        }
        result += strWithModifiers

        this.cursor = { x: x + str.length, y }
      })
      // if (this.cursor.x > buffer[y].length - 1) {
      //   this.cursor = { x: 0, y: 0 }
      //   result += `${ESC}[H` // moves cursor to home position
      // }
      if (this.cursor.x > this.maxCursor.x) this.maxCursor.x = this.cursor.x
      if (this.cursor.y > this.maxCursor.y) this.maxCursor.y = this.cursor.y
    }
    this.prevBuffer = buffer

    if (this.nextWritePrefix) {
      result = this.nextWritePrefix + result
      this.nextWritePrefix = ''
    }

    if (this.result !== undefined || this.print) {
      result += this[Symbol.dispose]();
    }

    if (result) {
      if (this.print) return Renderer[Symbol.dispose](result)

      process.stdout.write(result)
    }

    if (this.result !== undefined) {
      Renderer[Symbol.dispose](this.result)
    }
  }
}
