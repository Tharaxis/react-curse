import { useEffect, useState } from "react";
import process from "node:process";

/** The size. */
export interface Size {

  /** The horizontal size. */
  readonly width: number;

  /** The vertical size. */
  readonly height: number;
}

/** The set of event subscribers. */
const EventSubscribers = new Set<(size: Size) => void>();

/**
 * Gets the size from the standard output.
 * @returns The size.
 */
function getSize(): Size {
  const { columns: width, rows: height } = process.stdout;
  return { width, height };
}

process.stdout.on("resize", () => {
  const size = getSize();

  for (const callback of EventSubscribers)
    callback(size);
});

/**
 * Gets the size of the current viewport. When the size changes the component will re-render.
 * @returns The size.
 */
export function useSize(): Size {
  const [size, setSize] = useState(getSize());

  useEffect(() => {
    EventSubscribers.add(setSize);

    return () => {
      EventSubscribers.delete(setSize);
    };
  }, []);

  return size;
}
