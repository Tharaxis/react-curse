import { type DependencyList, useEffect } from "react";
import { type KeyEvent } from "../Input";
import Renderer from "../Renderer";

/**
 * The callback function for keyboard events.
 * @param event The keyboard event information.
 */
export type InputCallback = (event: KeyEvent) => void;

/**
 * Provides access to keyboard input events.
 * @param callback The function to call on each input event.
 * @param deps The optional set of dependencies used by the callback function.
 */
export function useInput(callback: InputCallback, deps: DependencyList = []): void {
  useEffect(() => {
    return Renderer["_input"]?.on?.("key", (event) => {
      const { key, modifiers } = event;

      if (modifiers.ctrl && key === "c")
        process.exit();

      callback(event);
    });
  }, deps)
}
