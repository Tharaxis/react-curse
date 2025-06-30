import React, { ReactNode, useEffect, useMemo, useRef } from "react";
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

/** The set of available pixel modes. */
type PixelMode = keyof PixelModeTable;

/** The `Point` component properties. */
interface PointProps {

  /** The horizontal coordinate. */
  readonly x: number;

  /** The vertical coordinate. */
  readonly y: number;

  /** The color. */
  readonly color?: Color;
}

/** A single point. */
export const Point = (_props: PointProps) => <></>;

/** The `Line` component properties. */
interface LineProps {
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
  readonly color?: Color;
}

/** A line. */
export const Line = (_props: LineProps) => <></>;

interface CanvasProps {
  mode?: { w: number; h: number }
  width: number
  height: number
  children: any[]
}

class CanvasRenderer {
  mode: { w: number; h: number }
  multicolor: boolean
  w: number
  h: number
  buffer: Buffer
  colors: Color[]

  constructor(width: number, height: number, mode = { w: 1, h: 2 }) {
    this.mode = mode
    this.multicolor = mode.w === 1 && mode.h === 2
    this.w = Math.ceil(width / this.mode.w) * this.mode.w
    this.h = Math.ceil(height / this.mode.h) * this.mode.h

    const size = ((this.w / this.mode.w) * this.h) / this.mode.h
    this.buffer = Buffer.alloc(size)
    this.colors = [...Array(size * (this.multicolor ? 2 : 1))]
  }
  clear() {
    this.buffer.fill(0)
    this.colors.fill(0)
  }
  set(x: number, y: number, color: Color) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return
    const index = (this.w / this.mode.w) * Math.floor(y / this.mode.h) + Math.floor(x / this.mode.w)
    this.buffer[index] |= PixelModes[`${this.mode.w}x${this.mode.h}` as PixelMode].map[y % this.mode.h][x % this.mode.w]

    if (color) this.colors[this.multicolor ? this.w * y + x : index] = color
  }
  line(x0: number, y0: number, x1: number, y1: number, color: Color) {
    const dx = x1 - x0
    const dy = y1 - y0
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    let eps = 0
    const sx = dx > 0 ? 1 : -1
    const sy = dy > 0 ? 1 : -1
    if (adx > ady) {
      for (let x = x0, y = y0; sx < 0 ? x >= x1 : x <= x1; x += sx) {
        this.set(x, y, color)
        eps += ady
        if (eps << 1 >= adx) {
          y += sy
          eps -= adx
        }
      }
    } else {
      for (let x = x0, y = y0; sy < 0 ? y >= y1 : y <= y1; y += sy) {
        this.set(x, y, color)
        eps += adx
        if (eps << 1 >= ady) {
          x += sx
          eps -= ady
        }
      }
    }
  }
  render() {
    return [...this.buffer].map((i, index) => {
      const table = PixelModes[`${this.mode.w}x${this.mode.h}` as PixelMode].table
      let res = String.fromCharCode(table ? (i && 0x2500) + table[i] : 0x2800 + i)

      let colors: Color[] = []
      if (res !== ' ') {
        if (this.multicolor) {
          const y = Math.floor(index / this.w) * this.mode.h
          const x = (index % this.w) * this.mode.w
          const color1 = this.colors[this.w * y + x]
          const color2 = this.colors[this.w * (y + 1) + x]
          if (res === '\u2588' && color1 !== color2) {
            res = '\u2580'
            colors = [color1, color2]
          } else {
            colors = [color1 || color2]
          }
        } else {
          colors = [this.colors[index]]
        }
      }

      return [res, colors]
    })
  }
}

export const Canvas = ({ mode = { w: 1, h: 2 }, width, height, children, ...props }: CanvasProps): ReactNode => {
  const canvas = useRef(new CanvasRenderer(width, height, mode))

  useEffect(() => {
    canvas.current = new CanvasRenderer(width, height, mode)
  }, [width, height, mode])

  const text = useMemo(() => {
    canvas.current.clear()

    React.Children.forEach(children, i => {
      if (i.type === Point) {
        const { x, y, color } = i.props
        canvas.current.set(x, y, color)
      } else if (i.type === Line) {
        const { x, y, dx, dy, color } = i.props
        canvas.current.line(x, y, dx, dy, color)
      }
    })

    return canvas.current.render()
  }, [children])

  return (
    <Text {...props}>
      {chunk(text, canvas.current.w / canvas.current.mode.w).map((line, y) => (
        <Text key={y} x={0} y={y}>
          {line.map(
            ([char, [color, background]], x: number) =>
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
