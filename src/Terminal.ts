import { type Char, type Color, type Modifier } from "./Screen";

/** A position on screen. */
interface Position {

  /** The horizontal position. */
  x: number;
  
  /** The vertical position. */
  y: number;
}

/** Provides methods for writing to the terminal output. */
export class Terminal {

  private _stdout: NodeJS.WriteStream;
  private _fullscreen: boolean;
  private _nextWritePrefix: string;
  private _resized: boolean;
  private _previousBuffer: ReadonlyArray<ReadonlyArray<Char>> | null;
  private _previousModifier: Modifier;
  private _cursorPosition: Position;
  private _maxCursorPosition: Position;

  private onResize = (): void => {
    this._resized = true;
  }

  private createModifierSequence(modifier: Modifier): string {
    if (JSON.stringify(modifier) === "{}") return "0";

    const previousModifier = this._previousModifier;

    const sequence: (number | string)[] = [];

    if (modifier.color !== previousModifier.color) sequence.push(modifier.color ? this.parseColor(modifier.color) : 39);
    if (modifier.background !== previousModifier.background) sequence.push(modifier.background ? this.parseColor(modifier.background, 10) : 49);
    if (modifier.bold !== previousModifier.bold) sequence.push(modifier.bold ? 1 : modifier.dim ? '22;2' : 22);
    if (modifier.dim !== previousModifier.dim) sequence.push(modifier.dim ? 2 : modifier.bold ? '22;1' : 22);
    if (modifier.italic !== previousModifier.italic) sequence.push(modifier.italic ? 3 : 23);
    if (modifier.underline !== previousModifier.underline) sequence.push(modifier.underline ? 4 : 24);
    if (modifier.blinking !== previousModifier.blinking) sequence.push(modifier.blinking ? 5 : 25);
    if (modifier.inverse !== previousModifier.inverse) sequence.push(modifier.inverse ? 7 : 27);
    if (modifier.strikethrough !== previousModifier.strikethrough) sequence.push(modifier.strikethrough ? 9 : 29);

    return sequence.join(';');
  }

  /**
   * Indicates whether the specified character represents an icon.
   * @returns `True` if an icon, otherwise `false`.
   */
  isIcon(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 9211 && code <= 9214) || [9829, 9889, 11096].includes(code) || (code >= 57344 && code <= 64838);
  }

  /**
   * 
   * @param buffer 
   */
  render(buffer: ReadonlyArray<ReadonlyArray<Char>>): void {
    let result = "";

    const resized = this._resized;

    if (resized) {
      result += "\x1B[H";
      this._cursorPosition = { x: 0, y: 0 };
      this._resized = false;
    }

    for (let y = 0; y < buffer.length; y++) {
      const line = buffer[y];
      const prevLine = this._previousBuffer?.[y];
      let includesEmoji = false;
      let includesIcon = false;

      const diffLine = resized ? line : line.map((i: Char, x: number) => {
        const [prevChar, prevModifier] = prevLine && prevLine[x] ? prevLine[x] : [" ", {}];
        const [char, modifier] = i;
        return (this._resized || prevChar !== char || JSON.stringify(prevModifier) !== JSON.stringify(modifier)) ? i : null;
      })
      .filter(i => i !== undefined);

      const chunks: Record<number, [string, string]> = {};
      let chunksAt = 0;
      diffLine.forEach((value, x: number) => {
        if (value === null) return (chunksAt = x + 1);

        const [char, modifier] = value;
        if (chunks[chunksAt] === undefined) chunks[chunksAt] = ["", ""];
        if (JSON.stringify(modifier) !== JSON.stringify(this._previousModifier)) {
          chunks[chunksAt][1] += `\x1B[${this.createModifierSequence(modifier)}m`;
          this._previousModifier = modifier;
        }
        chunks[chunksAt][0] += char;
        chunks[chunksAt][1] += char;
      });

      Object.entries(chunks).map(([index, value]) => {
        const [str, strWithModifiers] = value as [string, string];
        const x = parseInt(index);

        if (/\p{Emoji}/u.test(str)) includesEmoji = true;
        if (!includesIcon && str.split("").find((i) => this.isIcon(i))) includesIcon = true;

        if (x === 0 && y === this._cursorPosition.y + 1) {
          //if (this._fullscreen)
            //result += `\x1B[${y + 1};1H`; // is this faster? dunno...
          //else
          result += "\n";
        } else {
          if (!this._fullscreen && y > this._cursorPosition.y && y > this._maxCursorPosition.y) {
            const diff = y - this._maxCursorPosition.y;
            result += "\n".repeat(diff);
            this._cursorPosition = { y: this._cursorPosition.y + diff, x: 0 };
          }

          if (y !== this._cursorPosition.y && x !== this._cursorPosition.x) {
            result += `\x1B[${y + 1};${x + 1}H`;        // moves cursor to position
          } else if (y > this._cursorPosition.y) {
            const diff = y - this._cursorPosition.y;
            result += `\x1B[${diff > 1 ? diff : ""}B`;  // moves cursor down
          } else if (y < this._cursorPosition.y) {
            const diff = this._cursorPosition.y - y;
            result += `\x1B[${diff > 1 ? diff : ""}A`;  // moves cursor up
          } else if (x > this._cursorPosition.x) {
            if (includesEmoji || includesIcon) {
              result += `\x1B[G\x1B[${x > 1 ? x : ""}C`;  // moves cursor to column, moves cursor right
            } else {
              const diff = x - this._cursorPosition.x;
              result += `\x1B[${diff > 1 ? diff : ""}C`;  // moves cursor right
            }
          } else if (x < this._cursorPosition.x) {
            if (includesEmoji) {
              result += `\x1B[G\x1B[${x > 1 ? x : ""}C`;  // moves cursor left
            } else {
              const diff = this._cursorPosition.x - x;
              result += `\x1B[${diff > 1 ? diff : ""}D`;  // moves cursor left
            }
          }
        }

        result += strWithModifiers;

        this._cursorPosition = { x: x + str.length, y };
      });

      if (this._cursorPosition.x > this._maxCursorPosition.x) this._maxCursorPosition.x = this._cursorPosition.x;
      if (this._cursorPosition.y > this._maxCursorPosition.y) this._maxCursorPosition.y = this._cursorPosition.y;
    }

    this._previousBuffer = buffer;

    if (this._nextWritePrefix) {
      result = this._nextWritePrefix + result;
      this._nextWritePrefix = "";
    }

    if (result) this._stdout.write(result);
  }  

  /**
   * Appends the specified value to the data output at the beginning of the next terminal write.
   * @param value The value to append.
   */
  append(value: string): void {
    this._nextWritePrefix += value;
  }

  /**
   * Parses a hex color string.
   * @param color the hex color to parse.
   * @returns The color or `null` if could not be parsed.
   */
  parseHexColor(color: string): [r: number, g: number, b: number] | null {
    if (!color.match(/^([\da-f]{6})|([\da-f]{3})$/i)) return null;

    return (
      color.length === 4
        ? color
            .substring(1, 4)
            .split('')
            .map(i => i + i)
        : (color.substring(1, 7).match(/.{2}/g) as any)
    ).map((i: string) => parseInt(i, 16));
  }

  /**
   * Parses a color, returning its terminal code.
   * @param color The color to convert.
   * @param offset The color code offset.
   * @returns The converted number.
   */
  parseColor(color: Color | string | number, offset: number = 0): string | number {
    if (typeof color === "number") {
      if (color < 0 || color > 255)
        throw new Error("Color not found.");

      return `${38 + offset};5;${color}`;
    }

    if (color.startsWith("#")) {
      const colorElements = this.parseHexColor(color);
      if (!colorElements) return "";
      const [r, g, b] = colorElements;
      return `${38 + offset};2;${r};${g};${b}`;
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
        throw new Error("Color not found.");
    }
  }

  /**
   * Sets up the terminal.
   * @param output The output to write to.
   */
  setup(output: Array<string>): void {
    if (this._fullscreen) {
      output.push("\x1B[?1049h");
      output.push("\x1B[?7l");
      output.push("\x1B[H");
    }

    output.push("\x1B[?25l");
  }

  /**
   * Tears down the terminal.
   * @param output The output to write to.
   */
  teardown(output: Array<string>): void {
    if (this._fullscreen) {
      output.push("\x1B[?1049l");
      output.push("\x1B[?7h");
    } else {
      const y = this._maxCursorPosition.y - this._cursorPosition.y
      if (y > 0) output.push(`\x1B[${y}B`);
      const x = this._maxCursorPosition.x - this._cursorPosition.x + 1
      if (x > 0) output.push(`\x1B[${x}C`);
      output.push("\n");
    }

    output.push("\x1B[?25h");
  }  

  /** Cleans up input. */
  close(): void {
    this._stdout.off("resize", this.onResize);
  }

  /**
   * Initializes a new instance of the Terminal class.
   * @param stdout The terminal output stream.
   * @param fullscreen Indicates whether the terminal is fullscreen.
   */
  constructor(stdout: NodeJS.WriteStream, fullscreen: boolean) {
    this._stdout = stdout;
    this._fullscreen = fullscreen;
    this._nextWritePrefix = "";
    this._resized = false;
    this._previousModifier = {};
    this._previousBuffer = null;
    this._cursorPosition = { x: 0, y: 0 };
    this._maxCursorPosition = { x: 0, y: 0 };
    this._stdout.on("resize", this.onResize);
  }
}