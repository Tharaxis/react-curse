import { useCallback, useState } from "react";
import { Text, TextProps } from "./Text";
import { useChildrenSize } from "../hooks/useChildrenSize";
import { Offset } from "../hooks/useParentOffset";
import { useMouse } from "../hooks/useMouse";

/** The Button component properties. */
export interface ButtonProps extends TextProps {

  /** Called when the button is clicked. */
  readonly onClick?: () => void;
}

/** A component which represents a clickable button. */
export const Button = (props: ButtonProps) => {
  const { children, onClick, onLayout, ...rest } = props;

  const [position, setPosition] = useState<Offset>({ x: 0, y: 0 });
  const { width, height } = useChildrenSize(children);

  useMouse((ev): void => {
    if (ev.type !== "mouseDown") return;

    const { button, x, y } = ev;
        
    if (button !== "left") return;
    if (x <= position.x) return;
    if (y <= position.y) return;
    if (x > position.x + width) return;
    if (y > position.y + height) return;

    onClick?.();
  }, [position, width, height, onClick]);

  const updateLayout = useCallback((offset: Offset): void => {
    setPosition(offset);
    onLayout?.(offset);
  }, [onLayout]);

  return (
    <Text {...rest} onLayout={updateLayout}>
      {children}
    </Text>
  );
};
