import React, { isValidElement, ReactNode, useEffect, useMemo, useRef } from "react";
import { Color } from "../Screen";
import { Text } from "./Text";
import { chunk }  from "../utils/chunk";

/** The entry into the pixel mode table. */
interface PixelModeEntry {
  readonly map: ReadonlyArray<ReadonlyArray<number>>;
  readonly table?: ReadonlyArray<number>;
}

interface PixelModeTable {
  readonly "1x1": PixelModeEntry;
  readonly "1x2": PixelModeEntry;
  readonly "2x2": PixelModeEntry;
  readonly "2x4": PixelModeEntry;
}

/** Data required for specified pixel modes. */
const PixelModes: PixelModeTable = {
  "1x1": { map: [[0x1]], table: [0x20, 0x88] },
  "1x2": { map: [[0x1], [0x2]], table: [0x20, 0x80, 0x84, 0x88] },
  "2x2": { map: [[0x1, 0x4], [0x2, 0x8]], table: [0x20, 0x98, 0x96, 0x8c, 0x9d, 0x80, 0x9e, 0x9b, 0x97, 0x9a, 0x84, 0x99, 0x90, 0x9c, 0x9f, 0x88] },
  "2x4": { map: [[0x1, 0x8], [0x2, 0x10], [0x4, 0x20], [0x40, 0x80]] }
};

interface PixelModeSettings {
  readonly w: number;
  readonly h: number;
}

/** The set of available pixel modes. */
export type PixelMode = keyof PixelModeTable;

class CanvasRenderer {
  private _mode: PixelModeSettings;
  private _multicolor: boolean;
  private _w: number;
  private _h: number;
  private _buffer: Buffer;
  private _colors: Color[]

  /** Gets the current mode settings. */
  get mode(): PixelModeSettings {
    return this._mode;
  }

  /** Gets the rendering width. */
  get width(): number {
    return this._w;
  }
  
  /** Gets the rendering height. */
  get height(): number {
    return this._h;
  }

  /** Clears the canvas. */
  clear(): void {
    this._buffer.fill(0);
    this._colors.fill(0);
  }

  /**
   * Sets a point on the canvas to the specified color.
   * @param x The horizontal position.
   * @param y The vertical position.
   * @param color The color.
   */
  set(x: number, y: number, color?: Color): void {
    if (x < 0 || x >= this._w || y < 0 || y >= this._h) return;
    const index = (this._w / this.mode.w) * Math.floor(y / this.mode.h) + Math.floor(x / this.mode.w);
    this._buffer[index] |= PixelModes[`${this.mode.w}x${this.mode.h}` as PixelMode].map[y % this.mode.h][x % this.mode.w];

    if (color) this._colors[this._multicolor ? this._w * y + x : index] = color;
  }
  
  /**
   * Sets the point corresponding to a line at the specified coordinates.
   * @param x0 The starting horizontal position.
   * @param y0 The starting vertical position.
   * @param x1 The ending horizontal position.
   * @param y1 The ending vertical position.
   * @param color The color.
   */
  line(x0: number, y0: number, x1: number, y1: number, color?: Color): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    let eps = 0;
    const sx = dx > 0 ? 1 : -1;
    const sy = dy > 0 ? 1 : -1;
    if (adx > ady) {
      for (let x = x0, y = y0; sx < 0 ? x >= x1 : x <= x1; x += sx) {
        this.set(x, y, color);
        eps += ady;
        if (eps << 1 >= adx) {
          y += sy;
          eps -= adx;
        }
      }
    } else {
      for (let x = x0, y = y0; sy < 0 ? y >= y1 : y <= y1; y += sy) {
        this.set(x, y, color);
        eps += adx;
        if (eps << 1 >= ady) {
          x += sx;
          eps -= ady;
        }
      }
    }
  }

  /**
   * Renders the canvas.
   * @returns The string data representing the output.
   */
  render(): ReadonlyArray<ReadonlyArray<string | ReadonlyArray<Color>>> {
    return [...this._buffer].map((i, index) => {
      const table = PixelModes[`${this._mode.w}x${this._mode.h}` as PixelMode].table;
      let res = String.fromCharCode(table ? (i && 0x2500) + table[i] : 0x2800 + i);

      let colors: Color[] = [];
      if (res !== " ") {
        if (this._multicolor) {
          const y = Math.floor(index / this._w) * this._mode.h;
          const x = (index % this._w) * this._mode.w;
          const color1 = this._colors[this._w * y + x];
          const color2 = this._colors[this._w * (y + 1) + x];
          if (res === "\u2588" && color1 !== color2) {
            res = "\u2580";
            colors = [color1, color2];
          } else {
            colors = [color1 || color2];
          }
        } else {
          colors = [this._colors[index]];
        }
      }

      return [res, colors];
    })
  }

  /**
   * Initializes a new instance of the CanvasRenderer class.
   * @param width The width.
   * @param height the height.
   * @param mode The mode.
   */
  constructor(width: number, height: number, mode: PixelModeSettings) {
    this._mode = mode;
    this._multicolor = mode.w === 1 && mode.h === 2;
    this._w = Math.ceil(width / this._mode.w) * this._mode.w;
    this._h = Math.ceil(height / this._mode.h) * this._mode.h;

    const size = ((this._w / this._mode.w) * this._h) / this._mode.h;
    this._buffer = Buffer.alloc(size);
    this._colors = [...Array(size * (this._multicolor ? 2 : 1))];
  }
}

/** The `Canvas` component properties. */
export interface CanvasProps {

  /** The drawing mode. If not specified defaults to `"1x2"`. */
  readonly mode?: PixelMode;

  /** The canvas width. */
  readonly width: number

  /** The canvas height. */
  readonly height: number

  /** The child nodes. */
  readonly children?: ReactNode;
}

function getPixelModeSettings(mode: PixelMode): PixelModeSettings { 
  switch (mode) {
    case "1x1": return { w: 1, h: 1 };
    case "1x2": return { w: 1, h: 2 };
    case "2x2": return { w: 2, h: 2 };
    case "2x4": return { w: 2, h: 4 };
  }
}

/** Provides the ability to draw psuedo-graphics mode points and lines. */
export const Canvas = (props: CanvasProps): ReactNode => {
  const { mode = "1x2", width, height, children, ...rest } = props;

  const canvas = useRef(new CanvasRenderer(width, height, getPixelModeSettings(mode)));

  useEffect(() => {
    canvas.current = new CanvasRenderer(width, height, getPixelModeSettings(mode));
  }, [width, height, mode]);

  const text = useMemo(() => {
    canvas.current.clear();

    React.Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;

      if (child.type === Canvas.Point) {
        const { x, y, color } = child.props as PointProps;
        canvas.current.set(x, y, color);
      } else if (child.type === Canvas.Line) {
        const { x, y, dx, dy, color } = child.props as LineProps;
        canvas.current.line(x, y, dx, dy, color);
      }
    });

    return canvas.current.render();
  }, [children]);

  return (
    <Text {...rest}>
      {chunk(text, canvas.current.width / canvas.current.mode.w).map((line, y) => (
        <Text key={y} x={0} y={y}>
          {line.map(
            ([char, [color, background]], x) =>
              char !== ' ' && (
                <Text
                  key={x}
                  x={x}
                  y={0}
                  color={color ? color : undefined}
                  background={background ? background : undefined}
                >
                  {char}
                </Text>
              )
          )}
        </Text>
      ))}
    </Text>
  )
}

/** The `Point` component properties. */
export interface PointProps {

  /** The horizontal position. */
  readonly x: number;

  /** The vertical position. */
  readonly y: number;

  /** The point color. */
  readonly color?: Color;
}

/** Draws a single point on the parent canvas. */
Canvas.Point = (_props: PointProps) => <></>;

/** The `Line` component properties. */
export interface LineProps {

  /** The line horizontal starting position. */
  readonly x: number;

  /** The line vertical starting position. */
  readonly y: number;

  /** The line horizontal ending position. */
  readonly dx: number;

  /** The line vertical ending position. */
  readonly dy: number;

  /** The line color. */
  readonly color?: Color;
}

/** Draws a line on the parent canvas. */
Canvas.Line = (_props: LineProps) => <></>;