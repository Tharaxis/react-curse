import { type DependencyList, useEffect } from "react";
import Renderer from "../renderer";

/** The set of mouse event types. */
export enum MouseEventTypes {
  leftMouseDown = "leftMouseDown",
  leftMouseUp = "leftMouseUp",
  rightMouseDown = "rightMouseDown",
  rightMouseUp = "rightMouseUp",
  middleMouseDown = "middleMouseDown",
  middleMouseUp = "middleMouseUp",
  wheelDown = "wheelDown",
  wheelUp = "wheelUp",
}

/** The mouse event type. */
export type MouseEventType = `${MouseEventTypes}`;

/**
 * The callback function for mouse hook events.
 * @param type The mouse event type.
 * @param x The horizontal cursor position.
 * @param y The vertical cursor position.
 */
export type MouseCallback = (type: MouseEventType, x: number, y: number) => void;

/**
 * Provides access to mouse input events.
 * @param callback The function to call on each mouse event.
 * @param deps The optional set of dependencies used by the callback function.
 */
export function useMouse(callback: MouseCallback, deps: DependencyList = []): void {
  useEffect(() => {
    if (!process.stdin.isRaw)
      process.stdin.setRawMode(true);

    Renderer.terminal.enableMouse();
  }, [])

  useEffect(() => {
    return Renderer.input.on((input: string) => {
      if (input.startsWith("\x1b[M")) {
        const b = input.charCodeAt(3);
        const type = (1 << 6) & b ? (1 & b ? MouseEventTypes.wheelUp : MouseEventTypes.wheelDown) : (3 & b) === 3 ? MouseEventTypes.leftMouseUp : MouseEventTypes.leftMouseDown;

        const x = input.charCodeAt(4) - 0o41;
        const y = input.charCodeAt(5) - 0o41;
        callback(type, x, y);
        return;
      } 

      if (input.startsWith("\x1b[<")) {
        const parameters = input.substring(3, input.length - 1).split(";");
        const state = input[input.length - 1];

        // not a valid mouse event.
        if (parameters.length !== 3 || !["m", "M"].includes(state))
          return;

        const [button, xStr, yStr] = parameters;
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);
        const pressed = (state === "M");

        let type: MouseEventType;

        switch (button) {
          case "0":
            if (pressed) type = MouseEventTypes.leftMouseDown;
            else type = MouseEventTypes.leftMouseUp;
            break;
          case "1":
            if (pressed) type = MouseEventTypes.middleMouseDown;
            else type = MouseEventTypes.middleMouseUp;
            break;
          case "2":
            if (pressed) type = MouseEventTypes.rightMouseDown;
            else type = MouseEventTypes.rightMouseUp;
            break;
          case "64":
            type = MouseEventTypes.wheelUp;
            break;
          case "65":
            type = MouseEventTypes.wheelDown;
            break;
          default:
            return;
        }

        callback(type, x, y);
      }
    });
  }, deps)
}
