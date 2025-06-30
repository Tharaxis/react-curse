import EventEmitter from "node:events";
import { Terminal } from "./Terminal";

/**
 * The callback for input events.
 * @param input The input string.
 */
export type InputEventCallback = (input: string) => void;

/** A function which when called deregisters an input event. */
export type InputEventDeregistrationFunction = () => void;

/** Manages reading and parsing of the terminal input. */
export class Input {
  
  private _emitter: EventEmitter;
  private _terminal: Terminal;
  private _isMouseEnabled: boolean;

  /** Gets or sets mouse cursor support within the terminal. */
  get isMouseEnabled(): boolean {
    return this._isMouseEnabled;
  }
  set isMouseEnabled(value: boolean) {
    if (this._isMouseEnabled === value) return;

    if (value) this._terminal.append("\x1B[?1000h\x1B[?1006h\x1B[?1015h");
    else this._terminal.append("\x1B[?1000l");

    this._isMouseEnabled = value;
  }

  /**
   * Called when input data is received by the terminal.
   * @param buffer The buffer representing the bytes of the input data.
   */
  private onData = (buffer: Buffer): void => {
    const raw = buffer.toString();
    const chunks = this.splitInputCommands(raw);

    for (const chunk of chunks)
      this.emit(chunk);
  }

  /**
   * Splits an input string into individual command chunks.
   * @param input The input to parse.
   * @returns The set of commands parsed from the input string.
   */
  private splitInputCommands(input: string): ReadonlyArray<string> {
    const characters = input.split("");

    const result: Array<string> = [];
    let character: string | undefined;

    while (character = characters.shift()) {
      let current = "";

      if (character !== "\x1B") {
        result.push(character);
        continue;
      }

      current += character;

      character = characters.shift() ?? "";
      const characterCode = character.charCodeAt(0);

      if (characterCode < 0x40 || characterCode > 0x5F) {
        result.push(current);
        result.push(character);
        continue;
      }
      
      current += character;

      while (character = characters.shift()) {
        const characterCode = character.charCodeAt(0);

        if (characterCode < 0x20 || characterCode > 0x7E) {
          result.push(current);
          result.push(character);
          current = "";
          break;
        }

        current += character;
      }

      if (current)
        result.push(current);
    }

    return result;
  }

  /** Emits an input event. */
  protected emit(input: string): void {
    this._emitter.emit("data", input);
  }

  /**
   * Registers an input event listener.
   * @param callback The function to call when an input occurs.
   * @returns A function which when called deregisters the input event.
   */
  public on(callback: InputEventCallback): InputEventDeregistrationFunction {
    if (this._emitter.listenerCount("data") === 0)
      this._terminal.stdIn.on("data", this.onData);

    this._emitter.on("data", callback);

    return (): void => {
      this._emitter.off("data", callback);

      if (this._emitter.listenerCount("data") === 0)
        this._terminal.stdIn.off("data", this.onData);
    }
  }

  /** Disposes of the input. */
  public [Symbol.dispose](): void {
    this.isMouseEnabled = false;
    this._emitter.removeAllListeners();
    this._terminal.stdIn.off("data", this.onData);
  }

  /**
   * Initializes a new instance of the Input class.
   * @param stdIn The optional standard input to monitor. If not specified defaults to `process.stdin`.
   * @param stdOut The optional standard output to write to. If not specified defaults to `process.stdout`.
   */
  constructor(terminal: Terminal) {
    this._emitter = new EventEmitter();
    this._terminal = terminal;
    this._isMouseEnabled = false;
  }
}
