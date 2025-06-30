import { Input } from "./Input";
import { Reconciler, TextElement } from './Reconciler'
import { Screen } from "./Screen";
import { Terminal } from "./Terminal";
import { spawnSync, type SpawnSyncOptions, type SpawnSyncReturns } from 'node:child_process'
import { type ReactElement } from 'react'

class Renderer {
  private container: TextElement;
  private _screen: Screen;
  private _input: Input;
  private _terminal: Terminal;
  private reconciler: any;

  private callback?: (value?: string) => void
  private throttleAt = 0;
  private throttleTimeout?: NodeJS.Timeout;

  /** Gets the input associated with the renderer. */
  get input(): Input {
    return this._input;
  }

  /** Gets the screen associated with the renderer. */
  get screen(): Screen {
    return this._screen;
  }

  /** Gets the terminal associated with the renderer. */
  get terminal(): Terminal {
    return this._terminal;
  }

  /** Initializes a new instance of the Renderer class. */
  constructor() {
    this.container = new TextElement();
    this._screen = new Screen();
    this._terminal = new Terminal();
    this._input = new Input(this._terminal);
    this.reconciler = Reconciler(this.#throttle);
  }

  #throttle = () => {
    const at = Date.now()
    const nextAt = Math.max(0, 1000 / 60 - (at - this.throttleAt))
    clearTimeout(this.throttleTimeout)
    this.throttleTimeout = setTimeout(() => {
      this.throttleAt = at
      this.screen.render(this.container.children)
      this.terminal.render(this.screen.buffer)
    }, nextAt)
  }

  render(reactElement: ReactElement, options = { fullscreen: true, print: false }) {
    this.terminal.init(options.fullscreen, options.print)
    this.reconciler.updateContainer(
      reactElement,
      this.reconciler.createContainer(this.container, 0, null, false, null, '', () => {}, null)
    )
  }
  inline(reactElement: ReactElement, options = { fullscreen: false, print: false }) {
    this.render(reactElement, options)
  }
  print(reactElement: ReactElement, options = { fullscreen: false, print: true }) {
    this.render(reactElement, options)

    return new Promise(resolve => {
      this.callback = resolve
    })
  }
  frame(reactElement: ReactElement, options = { fullscreen: false, print: true }) {
    this.render(reactElement, options)

    return new Promise(resolve => {
      this.callback = (value: any) => {
        process.stdout.write(value)
        resolve(value)
      }
    })
  }

  public [Symbol.dispose](value?: string): void {
    this.container.terminate();
    this.input[Symbol.dispose]();
    this.terminal[Symbol.dispose]();
    this.callback?.(value);
  }

  spawnSync(
    command: string,
    args: ReadonlyArray<string>,
    options: SpawnSyncOptions
  ): SpawnSyncReturns<string | Buffer> {
    const res = spawnSync(command, args, options)
    this.terminal.reinit()
    this.terminal.render(this.screen.buffer)
    return res
  }
  bell() {
    process.stdout.write('\x07')
  }
  exit(code: number | any = 0) {
    if (typeof code === 'number') process.exit(code)
    this.terminal.setResult(code)
  }
}

export default new Renderer()
