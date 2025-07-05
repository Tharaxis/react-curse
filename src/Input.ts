import EventEmitter from "node:events";
import { DependencyList, useEffect } from "react";
import Renderer from "./Renderer";

/** The set of available input keys. */
export enum Key {
  Up = "up",
  Left = "left",
  Right = "right",
  Down = "down",
  PageUp = "pageUp",
  PageDown = "pageDown",
  Home = "home",
  Tab = "tab",
  Delete = "delete",
  End = "end",
  Insert = "insert",
  Escape = "escape",
  Return = "return",
  Backspace = "backspace",
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

/** The set of special keys. */
const SpecialKeys: Readonly<Record<string, Key>> = {
  "\x1b[11~": Key.F1, "\x1b[12~": Key.F2, "\x1b[13~": Key.F3, "\x1b[14~": Key.F4,
  "\x1b[15~": Key.F5, "\x1b[17~": Key.F6, "\x1b[18~": Key.F7, "\x1b[19~": Key.F8,
  "\x1b[20~": Key.F9, "\x1b[21~": Key.F10, "\x1b[23~": Key.F11, "\x1b[24~": Key.F12,
  "\x1bOP": Key.F1, "\x1bOQ": Key.F2, "\x1bOR": Key.F3, "\x1bOS": Key.F4,
  "\x1b[A": Key.Up, "\x1b[B": Key.Down, 
  "\x1b[C": Key.Right, "\x1b[D": Key.Left,
  "\x1b[H": Key.Home, "\x1b[F": Key.End,
  "\x1b[1~": Key.Home, "\x1b[4~": Key.End,
  "\x1b[5~": Key.PageUp, "\x1b[6~": Key.PageDown,
  "\x1b[2~": Key.Insert, "\x1b[3~": Key.Delete,
  "\x7f": Key.Backspace, "\x08": Key.Backspace,
  "\t": Key.Tab, "\r": Key.Return, "\n":Key.Return,
  "\x1b": Key.Escape
};

/** The set of control keys. */
const ControlKeys: Readonly<Record<string, string>> = {
  "\x01": "a", "\x02": "b", "\x03": "c", "\x04": "d", "\x05": "e",
  "\x06": "f", "\x07": "g", "\x08": "h", "\x09": "i", "\x0a": "j",
  "\x0b": "k", "\x0c": "l", "\x0d": "m", "\x0e": "n", "\x0f": "o",
  "\x10": "p", "\x11": "q", "\x12": "r", "\x13": "s", "\x14": "t",
  "\x15": "u", "\x16": "v", "\x17": "w", "\x18": "x", "\x19": "y",
  "\x1a": "z"
};

/** Indicates the mouse input mode. */
export type MouseMode = "sgr" | "standard";

/** The modifier keys. */
export interface InputModifiers {

  /** Indicates whether the `CTRL` key is pressed. */
  readonly ctrl: boolean;

  /** Indicates whether the `ALT` key is pressed. */
  readonly alt: boolean;
}

/** Raw mouse data. */
export interface MouseRawData {

  /** The mouse code. */
  readonly code: number;

  /** The mouse mode. */
  readonly mode: MouseMode;
}

/** A mouse button event. */
export interface MouseButtonEvent {
  
  /** The event type. Always `"mouseDown"` or `"mouseUp"`. */
  readonly type: "mouseDown" | "mouseUp";

  /** The button associated with the event. */
  readonly button: "unknown" | "left" | "middle" | "right";

  /** The horizontal cursor position. */
  readonly x: number;

  /** The vertical cursor position. */
  readonly y: number;

  /** The modifier keys. */
  readonly modifiers: InputModifiers;

  /** The raw event data. */
  readonly raw: MouseRawData;
}

/** A mouse move event. */
export interface MouseMoveEvent {

  /** The event type. Always `"mouseMove"`. */
  readonly type: "mouseMove";

  /** The horizontal cursor position. */
  readonly x: number;

  /** The vertical cursor position. */
  readonly y: number;

  /** The modifier keys. */
  readonly modifiers: InputModifiers;

  /** The raw event data. */
  readonly raw: MouseRawData;  
}

/** A mouse wheel event. */
export interface MouseWheelEvent {
  
  /** The event type. Always `"mouseWheel"`. */
  readonly type: "mouseWheel";

  /** The direction the wheel was scrolled. */
  readonly direction: "up" | "down";

  /** The horizontal cursor position. */
  readonly x: number;

  /** The vertical cursor position. */
  readonly y: number;

  /** The modifier keys. */
  readonly modifiers: InputModifiers;

  /** The raw event data. */
  readonly raw: MouseRawData;  
}

/** A key input event. */
export interface KeyEvent {
  
  /** The event type. Always `"key"`. */
  readonly type: "key";

  /** The key which was pressed. */
  readonly key: Key | string;

  /** The key sequence which was pressed. */
  readonly sequence: string;

  /** The modifier keys. */
  readonly modifiers: InputModifiers;
}

/** A mouse event. */
export type MouseEvent = MouseButtonEvent | MouseMoveEvent | MouseWheelEvent;

/** An input event. */
export type InputEvent = MouseEvent | KeyEvent;

/**
 * The callback for input events.
 * @param event The event.
 */
export type InputEventCallback<T extends InputEvent> = (event: T) => void;

/** A function which when called deregisters an input event. */
export type InputEventDeregistrationFunction = () => void;

interface InputSequence {
  readonly event: InputEvent;
  readonly bytesConsumed: number;
}

/** Manages reading and parsing of the terminal input. */
export class Input {
  
  private _emitter: EventEmitter;
  private _stdin: NodeJS.ReadStream;
  private _buffer: Buffer;

  private processBuffer(): void {
    let processed = 0;
        
    while (processed < this._buffer.length) {
      const remaining = this._buffer.subarray(processed);
      const result = this.parseSequence(remaining);
      
      if (!result) break;
      
      const { event, bytesConsumed } = result;
      processed += bytesConsumed;
      
      if (event.type === "key") {
        this.emit("key", event);
      } else {
        this.emit("mouse", event);
      }
    }
    
    this._buffer = this._buffer.subarray(processed);
  }

  private createMouseWheelEvent(code: number, col: number, row: number, mode: MouseMode): MouseWheelEvent {
    const baseCode = code & 3;
    const direction = baseCode === 0 ? "up" : "down";

    return {
      type: "mouseWheel",
      direction,
      x: col,
      y: row,
      modifiers: this.parseMouseModifierCode(code),
      raw: { code, mode },
    };
  }

  private createMouseMoveEvent(code: number, col: number, row: number, mode: MouseMode): MouseMoveEvent {
    return {
      type: "mouseMove",
      x: col,
      y: row,
      modifiers: this.parseMouseModifierCode(code),
      raw: { code, mode },
    };
  }

  private createMouseButtonEvent(code: number, col: number, row: number, action: "press" | "release", mode: MouseMode): MouseButtonEvent {
    let button: "unknown" | "left" | "middle" | "right" = "unknown";
    
    const baseButton = code & 3;
    switch (baseButton) {
      case 0:
        button = "left";
        break;
      case 1:
        button = "middle";
        break;
      case 2:
        button = "right";
        break;
    }
    
    return {
      type: (action === "press") ? "mouseDown" : "mouseUp",
      button,
      x: col,
      y: row,
      modifiers: this.parseMouseModifierCode(code),
      raw: { code, mode },
    };
  }

  private createMouseEvent(code: number, col: number, row: number, action: "press" | "release", mode: MouseMode): MouseButtonEvent | MouseWheelEvent | MouseMoveEvent {
    if (code & 64)
      return this.createMouseWheelEvent(code, col, row, mode);
    
    if (code & 32)
      return this.createMouseMoveEvent(code, col, row, mode);
      
    return this.createMouseButtonEvent(code, col, row, action, mode);
  } 

  private parseMouseSequence(data: string, buffer: Buffer): InputSequence | null {
    // SGR mouse mode: \x1b[<button;col;row[mM]
    const sgrMatch = data.match(/^\x1b\[<(\d+);(\d+);(\d+)([mM])/);
    if (sgrMatch) {
      const button = parseInt(sgrMatch[1]);
      const col = parseInt(sgrMatch[2]);
      const row = parseInt(sgrMatch[3]);
      const action = sgrMatch[4] === 'm' ? "press" : "release";
      
      return {
        event: this.createMouseEvent(button, col, row, action, "sgr"),
        bytesConsumed: sgrMatch[0].length,
      };
    }
    
    // Standard mouse mode: \x1b[Mbxy (where b, x, y are chars)
    if (data.startsWith("\x1b[M") && buffer.length >= 6) {
      const button = buffer[3] - 32;
      const col = buffer[4] - 32;
      const row = buffer[5] - 32;
      
      return {
        event: this.createMouseEvent(button, col, row, "press", "standard"),
        bytesConsumed: 6,
      };
    }
    
    return null;
  }

  private createKeyEvent(key: Key | string, sequence: string, modifiers: Partial<InputModifiers> = {}): KeyEvent {
    return {
      type: "key",
      key,
      sequence,
      modifiers: {
        ctrl: modifiers.ctrl || false,
        alt: modifiers.alt || false,
      },
    };
  }

  private parseMouseModifierCode(code: number): InputModifiers {
    return {
      alt: !!(code & 8),
      ctrl: !!(code & 16),
    };
  }

  private parseKeyboardModifierCode(code: number): InputModifiers {
    return {
      alt: !!(code & 2),
      ctrl: !!(code & 4),
    };
  }

  private parseKeySequence(data: string): InputSequence | null {
    // Check for multi-byte sequences first
    for (let len = Math.min(data.length, 8); len >= 2; len--) {
      const substr = data.substring(0, len);
      if (SpecialKeys[substr]) {
        return {
          event: this.createKeyEvent(SpecialKeys[substr], substr),
          bytesConsumed: Buffer.byteLength(substr)
        };
      }
    }
    
    // Check for modified arrow keys and other sequences
    const modifiedMatch = data.match(/^\x1b\[1;(\d+)([ABCD])/);
    if (modifiedMatch) {
      const modCode = parseInt(modifiedMatch[1]);
      const keyMap = { A: Key.Up, B: Key.Down, C: Key.Right, D: Key.Left };
      const key = keyMap[modifiedMatch[2] as keyof typeof keyMap];
      const modifiers = this.parseKeyboardModifierCode(modCode);
      
      return {
        event: this.createKeyEvent(key, modifiedMatch[0], modifiers),
        bytesConsumed: modifiedMatch[0].length
      };
    }
    
    // Check for single character
    const firstChar = data[0];

    // Alt + character (ESC followed by character)
    if (firstChar === "\x1b" && data.length > 1 && data[1] !== "[") {
      const nextChar = data[1];
      const key = nextChar.match(/[a-zA-Z0-9]/) ? nextChar : nextChar.charCodeAt(0).toString();
      
      return {
        event: this.createKeyEvent(key, data.substring(0, 2), { alt: true }),
        bytesConsumed: 2
      };
    }

    // Special keys.
    if (SpecialKeys[firstChar]) {
      return {
        event: this.createKeyEvent(SpecialKeys[firstChar], firstChar),
        bytesConsumed: 1,
      };
    }

    // Control characters
    if (ControlKeys[firstChar] && !SpecialKeys[firstChar]) {
      return {
        event: this.createKeyEvent(ControlKeys[firstChar], firstChar, { ctrl: true }),
        bytesConsumed: 1,
      };
    }
    
    // Regular character
    if (firstChar >= " ") {
      return {
        event: this.createKeyEvent(firstChar, firstChar),
        bytesConsumed: 1
      };
    }
    
    // Unknown sequence - consume one byte
    return {
      event: this.createKeyEvent("Unknown", firstChar),
      bytesConsumed: 1
    };
  }

  private parseSequence(buffer: Buffer): InputSequence | null {
    if (buffer.length === 0) return null;
    
    const str = buffer.toString("utf8", 0, Math.min(buffer.length, 20));
    
    // Try to parse mouse sequences first
    const mouseResult = this.parseMouseSequence(str, buffer);
    if (mouseResult) return mouseResult;
    
    // Parse keyboard sequences
    return this.parseKeySequence(str);
  }

  private onData = (data: Buffer): void => {
    this._buffer = Buffer.concat([this._buffer, data]);
    this.processBuffer();
  }

  /**
   * Emits a keyboard event.
   * @param type The event type. Always `"key"`.
   * @param event The keyboard event.
   */
  protected emit(type: "key", event: KeyEvent): void;
  
  /**
   * Emits a mouse event.
   * @param type The event type. Always `"mouse"`.
   * @param event The mouse event.
   */
  protected emit(type: "mouse", event: MouseEvent): void;

  /**
   * Emits an input event.
   * @param type The event type.
   * @param event the event.
   */
  protected emit(type: "key" | "mouse", event: InputEvent): void {
    this._emitter.emit(type, event);
  }

  /**
   * Registers a keyboard event listener.
   * @param type The event type to listen to. Always `"key"`.
   * @param callback The function to call when a keyboard input occurs.
   * @returns A function which when called deregisters the input event.
   */
  on(type: "key", callback: InputEventCallback<KeyEvent>): InputEventDeregistrationFunction;

  /**
   * Registers a mouse event listener.
   * @param type The event type to listen to. Always `"mouse"`.
   * @param callback The function to call when a mouse input occurs.
   * @returns A function which when called deregisters the input event.
   */
  on(type: "mouse", callback: InputEventCallback<MouseEvent>): InputEventDeregistrationFunction;

  /**
   * Registers an input event listener.
   * @param type The event type to listen to.
   * @param callback The function to call when an input occurs.
   * @returns A function which when called deregisters the input event.
   */
  on(type: "key" | "mouse", callback: InputEventCallback<KeyEvent> | InputEventCallback<MouseEvent>): InputEventDeregistrationFunction {
    this._emitter.on(type, callback);

    return (): void => {
      this._emitter.off(type, callback);
    };
  }

  /**
   * Sets up input.
   * @param output The output to write to.
   */
  setup(output: Array<string>): void {
    output.push("\x1B[?1000h"); // Basic mouse reporting
    output.push("\x1B[?1002h"); // Button motion reporting
    output.push("\x1B[?1006h"); // SGR mouse mode
    output.push("\x1B[?1015h"); // URXVT mouse mode
  }

  /**
   * Tears down input.
   * @param output The output to write to.
   */
  teardown(output: Array<string>): void {
    output.push("\x1B[?1000l");
    output.push("\x1B[?1002l");
    output.push("\x1B[?1006l");
    output.push("\x1B[?1015l");
  }

  /** Cleans up input. */
  close(): void {
    this._emitter.removeAllListeners();
    this._stdin.off("data", this.onData);
  }

  /**
   * Initializes a new instance of the Input class.
   * @param stdin The input stream.
   */
  constructor(stdin: NodeJS.ReadStream) {
    this._emitter = new EventEmitter();
    this._stdin = stdin;
    this._buffer = Buffer.alloc(0);

    if (!stdin.isTTY)
      throw new Error("Standard input is not a TTY.");

    stdin.setRawMode(true);
    this._stdin.on("data", this.onData);
  }
}

/**
 * Provides access to keyboard input events.
 * @param callback The function to call on each input event.
 * @param deps The optional set of dependencies used by the callback function.
 */
export function useInput(callback: InputEventCallback<KeyEvent>, deps: DependencyList = []): void {
  useEffect(() => {
    return Renderer["_input"]?.on?.("key", (event) => {
      const { key, modifiers } = event;

      if (modifiers.ctrl && key === "c")
        process.exit();

      callback(event);
    });
  }, deps)
}

/**
 * Provides access to mouse input events.
 * @param callback The function to call on each mouse event.
 * @param deps The optional set of dependencies used by the callback function.
 */
export function useMouse(callback: InputEventCallback<MouseEvent>, deps: DependencyList = []): void {
  useEffect(() => {
    return Renderer["_input"]?.on?.("mouse", (event) => {
      callback(event);
    });
  }, deps)
}
