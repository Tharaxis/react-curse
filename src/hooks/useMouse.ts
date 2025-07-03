import { type DependencyList, useEffect } from "react";
import { type MouseEvent } from "../Input";
import Renderer from "../Renderer";

/**
 * The callback function for mouse hook events.
 * @param type The mouse event type.
 * @param x The horizontal cursor position.
 * @param y The vertical cursor position.
 */
export type MouseCallback = (event: MouseEvent) => void;

/**
 * Provides access to mouse input events.
 * @param callback The function to call on each mouse event.
 * @param deps The optional set of dependencies used by the callback function.
 */
export function useMouse(callback: MouseCallback, deps: DependencyList = []): void {
  useEffect(() => {
    return Renderer["_input"]?.on?.("mouse", (event) => {
      callback(event);
    });
  }, deps)
}
