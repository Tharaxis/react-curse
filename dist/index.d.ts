import { DependencyList } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { SpawnSyncOptions } from 'node:child_process';
import { SpawnSyncReturns } from 'node:child_process';

declare interface Bounds {
    x: number;
    y: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export declare const Canvas: ({ mode, width, height, children, ...props }: CanvasProps) => ReactNode;

declare interface CanvasProps {
    mode?: {
        w: number;
        h: number;
    };
    width: number;
    height: number;
    children: any[];
}

declare type Char = [string, Modifier];

declare type Color = number | string | 'Black' | 'Red' | 'Green' | 'Yellow' | 'Blue' | 'Magenta' | 'Cyan' | 'White' | 'BrightBlack' | 'BrightRed' | 'BrightGreen' | 'BrightYellow' | 'BrightBlue' | 'BrightMagenta' | 'BrightCyan' | 'BrightWhite';

declare const _default: Renderer;
export default _default;

/** Manages reading and parsing of the terminal input. */
export declare class Input {
    private _emitter;
    private _stdIn;
    /**
     * Called when input data is received by the terminal.
     * @param buffer The buffer representing the bytes of the input data.
     */
    private onData;
    /**
     * Splits an input string into individual command chunks.
     * @param input The input to parse.
     * @returns The set of commands parsed from the input string.
     */
    private splitInputCommands;
    /** Emits an input event. */
    protected emit(input: string): void;
    /**
     * Registers an input event listener.
     * @param callback The function to call when an input occurs.
     * @returns A function which when called deregisters the input event.
     */
    on(callback: InputEventCallback): InputEventDeregistrationFunction;
    /** Disposes of the input. */
    [Symbol.dispose](): void;
    /**
     * Initializes a new instance of the Input class.
     * @param stdIn The optional standard input to monitor. If not specified defaults to `process.stdin`.
     */
    constructor(stdIn?: NodeJS.ReadStream);
}

/**
 * The callback function for input hook events.
 * @param value The raw input value.
 * @param key The key corresponding to the input value, or null if none.
 */
export declare type InputCallback = (value: string, key: InputKey | null) => void;

/**
 * The callback for input events.
 * @param input The input string.
 */
export declare type InputEventCallback = (input: string) => void;

/** A function which when called deregisters an input event. */
export declare type InputEventDeregistrationFunction = () => void;

/** The input keys. */
export declare type InputKey = `${Keys}`;

/** The set of available input keys. */
export declare enum Keys {
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
    F12 = "F12"
}

export declare const Line: (_props: Line_2) => JSX_2.Element;

declare interface Line_2 {
    x: number;
    y: number;
    dx: number;
    dy: number;
    color?: Color;
}

declare const Line: (_props: Line_2) => JSX_2.Element;

/** The set of modifiers which can be assigned to a line of text being output. */
declare interface Modifier {
    /** The background color. */
    readonly background?: Color;
    /** The foreground text color. */
    readonly color?: Color;
    readonly clear?: boolean;
    /** Indicates whether to render the text as __bold__. */
    readonly bold?: boolean;
    /** Indicates whether the chosen colors should be dimmed. */
    readonly dim?: boolean;
    /** Indicates whether to render the text as _italic_. */
    readonly italic?: boolean;
    /** Indicates whether to render the text as underlined. */
    readonly underline?: boolean;
    /** Indicates whether to render the text as blinking. */
    readonly blinking?: boolean;
    /** Indicates whether to render the text colors as inverted. */
    readonly inverse?: boolean;
    /** Indicates whether to render the text as ~strikethrough~. */
    readonly strikethrough?: boolean;
}

/**
 * The callback function for mouse hook events.
 * @param type The mouse event type.
 * @param x The horizontal cursor position.
 * @param y The vertical cursor position.
 */
export declare type MouseCallback = (type: MouseEventType, x: number, y: number) => void;

/** The mouse event type. */
export declare type MouseEventType = `${MouseEventTypes}`;

/** The set of mouse event types. */
export declare enum MouseEventTypes {
    leftMouseDown = "leftMouseDown",
    leftMouseUp = "leftMouseUp",
    rightMouseDown = "rightMouseDown",
    rightMouseUp = "rightMouseUp",
    middleMouseDown = "middleMouseDown",
    middleMouseUp = "middleMouseUp",
    wheelDown = "wheelDown",
    wheelUp = "wheelUp"
}

export declare const Point: (_props: Point_2) => JSX_2.Element;

declare interface Point_2 {
    x: number;
    y: number;
    color?: Color;
}

declare const Point: (_props: Point_2) => JSX_2.Element;

declare class Renderer {
    #private;
    private container;
    private _screen;
    private _input;
    private _terminal;
    private reconciler;
    private callback?;
    private throttleAt;
    private throttleTimeout?;
    /** Gets the input associated with the renderer. */
    get input(): Input;
    /** Gets the screen associated with the renderer. */
    get screen(): Screen_2;
    /** Gets the terminal associated with the renderer. */
    get terminal(): Term;
    /** Initializes a new instance of the Renderer class. */
    constructor();
    render(reactElement: ReactElement, options?: {
        fullscreen: boolean;
        print: boolean;
    }): void;
    inline(reactElement: ReactElement, options?: {
        fullscreen: boolean;
        print: boolean;
    }): void;
    print(reactElement: ReactElement, options?: {
        fullscreen: boolean;
        print: boolean;
    }): Promise<unknown>;
    frame(reactElement: ReactElement, options?: {
        fullscreen: boolean;
        print: boolean;
    }): Promise<unknown>;
    [Symbol.dispose](value?: string): void;
    spawnSync(command: string, args: ReadonlyArray<string>, options: SpawnSyncOptions): SpawnSyncReturns<string | Buffer>;
    bell(): void;
    exit(code?: number | any): void;
}

declare class Screen_2 {
    buffer: Char[][];
    cursor: {
        x: number;
        y: number;
    };
    size: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
    constructor();
    generateBuffer(): Char[][];
    clearBuffer(): void;
    render(elements: ReadonlyArray<TextElement>): void;
    stringAt(value: string, limit: number): number;
    renderElement(element: ReactElement | ReactElement[] | any, prevBounds: Bounds, prevProps?: TextProps): void;
    fill(bounds: Bounds, prevBounds: Bounds, modifiers: TextProps): void;
    put(text: string, bounds: Bounds, modifiers: TextProps): number;
    carret(bounds: Bounds): void;
}

/** The size. */
export declare interface Size {
    /** The horizontal size. */
    readonly width: number;
    /** The vertical size. */
    readonly height: number;
}

declare class Term {
    fullscreen: boolean;
    print: boolean;
    isResized: boolean;
    isMouseEnabled: boolean;
    prevBuffer: Char[][] | undefined;
    prevModifier: Modifier;
    nextWritePrefix: string;
    cursor: {
        x: number;
        y: number;
    };
    maxCursor: {
        x: number;
        y: number;
    };
    result: any;
    init(fullscreen: boolean, print: boolean): void;
    reinit(): void;
    onExit: (code: number) => void;
    terminate(): string;
    append(value: string): void;
    setResult(result: any): void;
    enableMouse(): void;
    parseHexColor(color: string): any;
    parseColor(color: Color | string | number, offset?: number): string | number;
    createModifierSequence(modifier: Modifier): string;
    isIcon(char: string): boolean;
    render(buffer: Char[][]): void;
}

/** Outputs text to the console. This component is used by all other components. */
declare const Text_2: (props: TextProps) => ReactNode;
export { Text_2 as Text }

/** The text element. */
declare class TextElement {
    private _props;
    private _parent;
    private _children;
    /** Gets the element properties. */
    get props(): TextProps;
    /** Gets the element parent. */
    get parent(): TextElement | null;
    /** Gets the element children. */
    get children(): ReadonlyArray<TextElement>;
    /** Clears all children. */
    terminate(): void;
    /**
     * Appends a child.
     * @param child The child to append to the element.
     */
    appendChild(child: TextElement): void;
    /**
     * Commits an update to the element properties.
     * @param nextProps The properties to update to.
     */
    commitUpdate(nextProps: TextProps): void;
    /**
     * Inserts a child element before another.
     * @param child The child to insert.
     * @param beforeChild The child to insert the other child before.
     */
    insertBefore(child: TextElement, beforeChild: TextElement): void;
    /**
     * Removes the specified child element.
     * @param child The child to remove.
     */
    removeChild(child: TextElement): void;
    /**
     * Initializes a new instance of the TextElement class.
     * @param props The component properties.
     */
    constructor(props?: TextProps);
}

/** The `Text` component properties. */
export declare interface TextProps extends Modifier {
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

export declare const Trail: ({ delay, children }: {
    delay: number;
    children: any;
}) => JSX.Element;

export declare const useAnimation: (time?: number, fps?: number) => useAnimation_2;

declare interface useAnimation_2 {
    ms: number;
    interpolate: (toLow: number, toHigh: number, fromLow?: number, fromHigh?: number, value?: number) => number;
    interpolateColor: (toLow: string, toHigh: string, fromLow?: number, fromHigh?: number, value?: number) => string;
}

/**
 * Gets the size of the specified children.
 * @param children The children to get the size for.
 * @returns The size of teh children.
 */
export declare function useChildrenSize(children: ReactNode): Size;

export declare const useClipboard: () => [() => string, (input: string) => string];

/**
 * Provides access to keyboard input events.
 * @param callback The function to call on each input event.
 * @param deps The optional set of dependencies used by the callback function.
 */
export declare function useInput(callback: InputCallback, deps?: DependencyList): void;

/**
 * Provides access to mouse input events.
 * @param callback The function to call on each mouse event.
 * @param deps The optional set of dependencies used by the callback function.
 */
export declare function useMouse(callback: MouseCallback, deps?: DependencyList): void;

/**
 * Gets the size of the current viewport. When the size changes the component will re-render.
 * @returns The size.
 */
export declare function useSize(): Size;

export declare const useTrail: (delay: number, children: any[], key?: string) => any;

export declare const useWordWrap: (text: string, _width?: number | undefined) => string;

export { }
