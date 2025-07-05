import { ReactNode, useEffect, useId, useState } from "react";
import Screen, { Modifier } from "../Screen";
import { Offset, OffsetContext } from "../hooks/useParentOffset";

/** The `Text` component properties. */
export interface TextProps extends Modifier {

  /** Specifies whether the text is absolutely positioned. */
  readonly absolute?: boolean;

  /** The horizontal position of the text, relative to its parent. */
  readonly x?: number | string;

  /** The vertical position of the text, relative to its parent. */
  readonly y?: number | string;

  /** The width of the text. */
  readonly width?: number | string;

  /** The height of the text. */
  readonly height?: number | string;

  /** Indicates whether the text should generate a newline. */
  readonly block?: boolean;

  /** Called when the element layout changes. */
  readonly onLayout?: (offset: Offset) => void;

  /** The component children. */
  readonly children?: ReactNode;
}

/** Outputs text to the console. This component is used by all other components. */
export const Text = (props: TextProps): ReactNode => {
  const { children, onLayout, ...rest } = props;

  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  const id = useId();

  useEffect(() => {
    return Screen.on("layoutChanged", () => {
      const bounds = Screen["_bounds"][id];
      
      setOffset((current) => {
        if (current.x === bounds.x && current.y === bounds.y) return current;
        return { x: bounds.x, y: bounds.y };
      });
    });
  }, [id]);

  useEffect(() => {
    onLayout?.(offset);
  }, [offset]);

  // @ts-ignore
  return <text {...rest} id={id}><OffsetContext.Provider value={offset}>{children}</OffsetContext.Provider></text>
}
