import { type ReactElement } from "react";
import { type TextProps } from "./components/Text";
import { type TextElement } from "./Reconciler";

export type Color =
  | number
  | string
  | 'Black'
  | 'Red'
  | 'Green'
  | 'Yellow'
  | 'Blue'
  | 'Magenta'
  | 'Cyan'
  | 'White'
  | 'BrightBlack'
  | 'BrightRed'
  | 'BrightGreen'
  | 'BrightYellow'
  | 'BrightBlue'
  | 'BrightMagenta'
  | 'BrightCyan'
  | 'BrightWhite'

/** The set of modifiers which can be assigned to a line of text being output. */
export interface Modifier {

  /** The background color. */
  readonly background?: Color;

  /** The foreground text color. */
  readonly color?: Color;

  
  readonly clear?: boolean;

  /** Indicates whether to render the text as __bold__. */
  readonly bold?: boolean;

  /** Indicates whether the chosen colors should be dimmed. */
  readonly dim?: boolean;

  /** Indicates whether to render the text as _italic_. */
  readonly italic?: boolean;

  /** Indicates whether to render the text as underlined. */
  readonly underline?: boolean;

  /** Indicates whether to render the text as blinking. */
  readonly blinking?: boolean;
  
  /** Indicates whether to render the text colors as inverted. */
  readonly inverse?: boolean;

  /** Indicates whether to render the text as ~strikethrough~. */
  readonly strikethrough?: boolean;
}

export type Char = [string, Modifier];

/** A function which when called deregisters a screen event. */
export type ScreenEventDeregistrationFunction = () => void;

type ModifierPropertyKeys = "color" | "background" | "bold" | "dim" | "italic" | "underline" | "blinking" | "inverse" | "strikethrough";

interface Bounds {
  x: number
  y: number
  x1: number
  y1: number
  x2: number
  y2: number
}

/** A position on screen. */
interface Position {

  /** The horizontal position. */
  x: number;
  
  /** The vertical position. */
  y: number;
}

class Screen {
  private _buffer: Array<Array<Char>>;
  private _cursor: Position;
  private _size: Omit<Bounds, "x" | "y">;
  private _bounds: Record<string, Bounds>;
  private _layoutSubscribers: Set<() => void>;

  /** Gets the buffer. */
  get buffer(): ReadonlyArray<ReadonlyArray<Char>> {
    return this._buffer;
  }

  /** Generates the buffer. */
  private generateBuffer(): Array<Array<Char>> {
    this._size = { x1: 0, y1: 0, x2: process.stdout.columns, y2: process.stdout.rows };
    return [...Array(this._size.y2)].map(() => [...Array(this._size.x2)].map(() => [" ", {}] as Char));
  }

  /** Clears the buffer. */
  private clearBuffer(): void {
    this._buffer = this.generateBuffer();
    this._cursor = { x: 0, y: 0 };
    this._bounds = {};
  }

  /**
   * Emits an input event.
   * @param type The event type. Always `"layoutChanged"`.
   */
  protected emit(type: "layoutChanged"): void {
    let subscribers: Set<Function>;
    
    switch (type) {
      case "layoutChanged":
        subscribers = this._layoutSubscribers;
        break;
    }

    for (const callback of subscribers) {
      callback();
    }
  }

  /**
   * Registers a bounds updated event listener.
   * @param type The event type to listen to. Always `"layoutChanged"`.
   * @param callback The function to call when the bounds update.
   * @returns A function which when called deregisters the event.
   */
  on(type: "layoutChanged", callback: () => void): ScreenEventDeregistrationFunction {
    let subscribers: Set<Function>;
    
    switch (type) {
      case "layoutChanged":
        subscribers = this._layoutSubscribers;
        break;
    }

    subscribers.add(callback);
    
    return (): void => {
      subscribers.delete(callback);
    };
  }

  /** Initializes a new instance of the Screen class. */
  constructor() {
    this._buffer = this.generateBuffer();
    this._cursor = { x: 0, y: 0 };
    this._size = { x1: 0, y1: 0, x2: 0, y2: 0 };
    this._bounds = {};
    this._layoutSubscribers = new Set();
  }

  /**
   * Renders the set of elements to the buffer.
   * @param elements The elements to render.
   */
  render(elements: ReadonlyArray<TextElement>): void {
    this.clearBuffer();
    this.renderElement(elements, { ...this._cursor, ...this._size });
    this.emit("layoutChanged");
  }

  stringAt(value: string, limit: number) {
    const percent = parseFloat(value)
    let diff = ''

    const index = value.search(/%[+-]\d+$/)
    if (index !== -1) diff = value.substring(index + 1)
    if (!value.endsWith('%' + diff) || isNaN(percent)) throw new Error('must be percent')

    return Math.round((limit / 100) * percent) + parseInt(diff || '0')
  }

  renderElement(element: ReactElement | ReactElement[] | any, prevBounds: Bounds, prevProps: TextProps = {}) {
    // as we render the elements we need to collect the bounds for each element, then we trigger an event
    // to signify that the bounds have updated. This will cause updates to loop until the UI settles.

    if (Array.isArray(element)) return element.forEach(i => this.renderElement(i, prevBounds, prevProps))

    const { children, ...props } = (element.props as TextProps & { readonly id: string }) ?? { children: element }

    if (typeof props.x === 'string')
      props.x = this.stringAt(props.x, props.absolute ? this._buffer[0].length : prevBounds.x2 - prevBounds.x)
    if (typeof props.y === 'string')
      props.y = this.stringAt(props.y, props.absolute ? this._buffer.length : prevBounds.y2 - prevBounds.y)
    if (typeof props.width === 'string')
      props.width = this.stringAt(props.width, props.absolute ? this._buffer[0].length : prevBounds.x2 - prevBounds.x)
    if (typeof props.height === 'string')
      props.height = this.stringAt(props.height, props.absolute ? this._buffer.length : prevBounds.y2 - prevBounds.y)
    if (props.width !== undefined && isNaN(props.width)) props.width = 0
    if (props.height !== undefined && isNaN(props.height)) props.height = 0
    const x = props.x !== undefined ? (props.absolute ? 0 : prevBounds.x) + props.x : this._cursor.x
    const y = props.y !== undefined ? (props.absolute ? 0 : prevBounds.y) + props.y : this._cursor.y
    const x1 =
      props.x !== undefined
        ? props.absolute
          ? props.x
          : Math.max(prevBounds.x, prevBounds.x + props.x)
        : prevBounds.x1
    const y1 =
      props.y !== undefined
        ? props.absolute
          ? props.y
          : Math.max(prevBounds.y, prevBounds.y + props.y)
        : prevBounds.y1
    const x2 =
      props.width !== undefined
        ? Math.min(props.absolute ? this._buffer[0].length : prevBounds.x2, props.width + x)
        : props.absolute
          ? this._buffer[0].length
          : prevBounds.x2
    const y2 =
      props.height !== undefined
        ? Math.min(props.absolute ? this._buffer.length : prevBounds.y2, props.height + y)
        : props.absolute
          ? this._buffer.length
          : prevBounds.y2
    const bounds = { x, y, x1, y1, x2, y2 }
    this._bounds[props.id] = bounds;

    this._cursor.x = bounds.x
    this._cursor.y = bounds.y

    const modifiers = Object.fromEntries(
      ['color', 'background', 'bold', 'dim', 'italic', 'underline', 'blinking', 'inverse', 'strikethrough']
        .map(i => [i as ModifierPropertyKeys, props[i as ModifierPropertyKeys] ?? prevProps[i as ModifierPropertyKeys]])
        .filter(i => i[1]));

    if ((props.background || props.clear) && (props.width || props.height))
      this.fill(bounds, props.absolute ? bounds : prevBounds, modifiers);

    if (Array.isArray(children) || (children as any)?.props) {
      this.renderElement(element.children, bounds, modifiers)
    } else if (children) {
      const text = children.toString()
      if (text.includes("\n") || text.includes("\r")) {
        const lines = children.toString().replaceAll("\r\n", "\r").replaceAll("\n", "\r").split("\r");
        lines.forEach((line: string, index: number) => {
          this.renderElement(line, bounds, modifiers)
          if (index < lines.length - 1) this.newline(prevBounds)
        })
      } else {
        this._cursor.x = this.put(text, bounds, modifiers)
      }
    }

    if (props.block) this.newline(prevBounds)
    if (props.width || props.height) {
      this._cursor.x = props.block ? prevBounds.x : bounds.x2
      this._cursor.y = props.block ? bounds.y2 : prevBounds.y
    }
  }

  fill(bounds: Bounds, prevBounds: Bounds, modifiers: TextProps) {
    for (let y = bounds.y; y < bounds.y2; y++) {
      if (y < Math.max(0, prevBounds.y1) || y >= Math.min(prevBounds.y2, this._buffer.length)) continue
      for (let x = bounds.x; x < bounds.x2; x++) {
        if (x < Math.max(0, prevBounds.x1) || x >= Math.min(prevBounds.x2, this._buffer[y].length)) continue

        this._buffer[y][x] = [' ', modifiers]
      }
    }
  }

  put(text: string, bounds: Bounds, modifiers: TextProps) {
    const { x, y } = bounds

    let i: number
    for (i = 0; i < text.length; i++) {
      if (y < Math.max(0, bounds.y1) || y >= Math.min(this._buffer.length, bounds.y2)) break
      if (x + i < Math.max(0, bounds.x1) || x + i >= Math.min(this._buffer[y].length, bounds.x2)) continue

      this._buffer[y][x + i] = [text[i], modifiers]
    }

    return x + i
  }

  newline(bounds: Bounds) {
    this._cursor.x = bounds.x ?? 0
    this._cursor.y++
  }
}

export default new Screen();