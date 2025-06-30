import { type DependencyList, useEffect } from "react";
import Renderer from "../renderer";

/** The set of available input keys. */
export enum Keys {
  up = "up",
  left = "left",
  right = "right",
  down = "down",
  pageUp = "pageUp",
  pageDown = "pageDown",
  home = "home",
  tab = "tab",
  delete = "delete",
  end = "end",
  insert = "insert",
  escape = "escape",
  return = "return",
  backspace = "backspace",
  F1 = "F1",
  F2 = "F2",
  F3 = "F3",
  F4 = "F4",
  F5 = "F5",
  F6 = "F6",
  F7 = "F7",
  F8 = "F8",
  F9 = "F9",
  F10 = "F10",
  F11 = "F11",
  F12 = "F12",
}

/** The input keys. */
export type InputKey = `${Keys}`;

/**
 * The callback function for input hook events.
 * @param value The raw input value.
 * @param key The key corresponding to the input value, or null if none.
 */
export type InputCallback = (value: string, key: InputKey | null) => void;

/**
 * Provides access to keyboard input events.
 * @param callback The function to call on each input event.
 * @param deps The optional set of dependencies used by the callback function.
 */
export function useInput(callback: InputCallback, deps: DependencyList = []): void {
  
  useEffect(() => {
    if (process.stdin.isRaw) return;
    process.stdin.setRawMode(true);
  }, []);

  useEffect(() => {
    return Renderer.input.on((input) => {
      // Omit mouse inputs.
      if (input.startsWith("\x1b[M") || input.startsWith("\x1b[<")) return;

      if (input === "\x03") {
        // TODO: do something better than this.
        process.exit();
      }

      if (input === "\r" || input === "\r\n" || input === "\n") {
        callback(input, Keys.return);
        return;
      }

      if (input === "\x1B") {
        callback("", Keys.escape);
        return;
      }

      if (input === "\x7F") {
        callback("", Keys.backspace);
        return;
      }

      if (input === "\t") {
        callback(input, Keys.tab);
        return;
      }

      // General character output.
      if (input.length === 1) {
        callback(input, null);
        return;
      }

      switch (input) {
        case "\x1B[A":
          callback("", Keys.up);
          break;
        case "\x1B[B":
          callback("", Keys.down);
          break;
        case "\x1B[D":
          callback("", Keys.left);
          break;
        case "\x1B[C":
          callback("", Keys.right);
          break;
        case "\x1B[1~":
        case "\x1B[H": // VS Code
          callback("", Keys.home);
          break;
        case "\x1B[2~":
          callback("", Keys.insert);
          break;
        case "\x1B[3~":
          callback("", Keys.delete);
          break;
        case "\x1B[4~":
        case "\x1B[F": // VS Code
          callback("", Keys.end);
          break;
        case "\x1B[5~":
          callback("", Keys.pageUp);
          break;
        case "\x1B[6~":
          callback("", Keys.pageDown);
          break;
        case "\x1B[[A":
        case "\x1BOP": // VS Code
          callback("", Keys.F1);
          break;
        case "\x1B[[B":
        case "\x1BOQ": // VS Code
          callback("", Keys.F2);
          break;
        case "\x1B[[C":
        case "\x1BOR": // VS Code
          callback("", Keys.F3);
          break;
        case "\x1B[[D":
        case "\x1BOS": // VS Code
          callback("", Keys.F4);
          break;
        case "\x1B[[E":
        case "\x1B[15~": // VS Code
          callback("", Keys.F5);
          break;
        case "\x1B[17~": 
          callback("", Keys.F6);
          break;
        case "\x1B[18~":
          callback("", Keys.F7);
          break;
        case "\x1B[19~":
          callback("", Keys.F8);
          break;
        case "\x1B[20~":
          callback("", Keys.F9);
          break;
        case "\x1B[21~":
          callback("", Keys.F10);
          break;
        case "\x1B[23~":
          callback("", Keys.F11);
          break;
        case "\x1B[24~":
          callback("", Keys.F12);
          break;          
        default:
          // other buttons.
          callback(input, null);
          break;
      }
    });
  }, deps)
}
