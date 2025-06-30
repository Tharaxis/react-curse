import { ReactNode } from "react";
import { Modifier } from "../Screen";

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

  /** The component children. */
  readonly children?: ReactNode;
}

/** Outputs text to the console. This component is used by all other components. */
export const Text = (props: TextProps): ReactNode => {
  const { children, ...rest } = props;

  // @ts-ignore
  return <text {...rest}>{children}</text>
}
