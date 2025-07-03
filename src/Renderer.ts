import { type ReactElement } from "react";
import { Input } from "./Input";
import { Reconciler, TextElement } from "./Reconciler";
import { Screen } from "./Screen";
import { Terminal } from "./Terminal";

/** The rendering options. */
export interface RenderOptions {

  /** Indicates whether to render full screen. If not specified defaults to `"fullscreen"`. */
  readonly mode?: "fullscreen" | "inline";

  /** The standard input to read from. If not specified defaults to `process.stdin`. */
  readonly stdin?: NodeJS.ReadStream;

  /** The standard input to write to. If not specified defaults to `process.stdout`. */
  readonly stdout?: NodeJS.WriteStream;
}

/** Provides methods for rendering react elements to the terminal. */
class Renderer {

  private _terminal: Terminal | null;
  private _input: Input | null;
  private _screen: Screen | null;
  private _reconciler: ReturnType<typeof Reconciler> | null;
  private _root: TextElement | null;
  private _stdout: NodeJS.WritableStream | null;

  /**
   * Renders the specified element to the display.
   * @param reactElement The element to render.
   * @param options The rendering options.
   */
  render(reactElement: ReactElement, options: RenderOptions): void {
    const { mode = "fullscreen", stdin = process.stdin, stdout = process.stdout } = options ?? {};

    let fullscreen = false;

    switch (mode) {
       case "fullscreen":
        fullscreen = true;
        break;
      case "inline":
        fullscreen = false;
        break;
    }

    this._stdout = stdout;
    this._terminal = new Terminal(stdout, fullscreen);
    this._input = new Input(stdin);
    this._root = new TextElement();
    this._screen = new Screen();

    const onExit = (code: number): void => {
      if (code !== 0) return;
      this.close();

      process.off("exit", onExit);
      process.exit(0);
    };

    process.on("exit", onExit);

    const output: Array<string> = [];
    this._terminal.setup(output);
    this._input.setup(output);
    this._terminal.append(output.join(""));

    let throttleAt = 0;
    let throttleTimeout: NodeJS.Timeout;

    this._reconciler = Reconciler(() => {
      const at = Date.now();
      const nextAt = Math.max(0, 1000 / 60 - (at - throttleAt));
      clearTimeout(throttleTimeout);

      throttleTimeout = setTimeout(() => {
        throttleAt = at;
        if (!this._screen || !this._terminal) return;

        this._screen.render(this._root?.children ?? []);
        this._terminal.render(this._screen.buffer);
      }, nextAt);
    });

    this._reconciler.updateContainer(reactElement, this._reconciler.createContainer(this._root, 0, null, false, null, "", () => {}, null));
  }

  /** Stops rendering. */
  close(): void {
    this._root?.clear?.();
    this._root = null;

    // Perform teardown.
    const output: Array<string> = [];

    this._input?.teardown?.(output);
    this._input?.close?.();
    this._input = null;

    this._terminal?.teardown?.(output);
    this._terminal?.close?.();
    this._terminal = null;
   
    this._stdout?.write(output.join(""));
    
    this._reconciler = null;
    this._screen = null;
    this._root = null;
    this._stdout = null;
  }
  
  /** Initializes a new instance of the Renderer class. */
  constructor() {
    this._terminal = null;
    this._input = null;
    this._screen = null;
    this._reconciler = null;
    this._root = null;
    this._stdout = null;
  }
}

export default new Renderer();