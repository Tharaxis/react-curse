import { createContext, useContext } from "react";

/** The offset. */
export interface Offset {

  /** The parent element's horizontal offset. */
  readonly x: number;

  /** The parent element's vertical offset. */
  readonly y: number;
}

/** The offset context. */
export const OffsetContext = createContext<Offset>({ x: 0, y: 0 });

/**
 * Gets the horizontal and vertical offset of the closest parent `<Text>` component.
 * @return The offset.
 */
export function useParentOffset(): Offset {
  return useContext(OffsetContext);
}