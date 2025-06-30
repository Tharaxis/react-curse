import O from "node:events";
import W from "react-reconciler";
import { spawnSync as F } from "node:child_process";
import { jsx as C, Fragment as B } from "react/jsx-runtime";
import v, { useRef as M, useEffect as b, useMemo as N, useState as _ } from "react";
import E, { platform as A } from "node:process";
const T = () => {
};
class j {
  _emitter;
  _stdIn;
  /**
   * Called when input data is received by the terminal.
   * @param buffer The buffer representing the bytes of the input data.
   */
  onData = (e) => {
    const t = e.toString(), n = this.splitInputCommands(t);
    for (const i of n)
      this.emit(i);
  };
  /**
   * Splits an input string into individual command chunks.
   * @param input The input to parse.
   * @returns The set of commands parsed from the input string.
   */
  splitInputCommands(e) {
    const t = e.split(""), n = [];
    let i;
    for (; i = t.shift(); ) {
      let s = "";
      if (i !== "\x1B") {
        n.push(i);
        continue;
      }
      s += i, i = t.shift() ?? "";
      const o = i.charCodeAt(0);
      if (o < 64 || o > 95) {
        n.push(s), n.push(i);
        continue;
      }
      for (s += i; i = t.shift(); ) {
        const h = i.charCodeAt(0);
        if (h < 32 || h > 126) {
          n.push(s), n.push(i), s = "";
          break;
        }
        s += i;
      }
      s && n.push(s);
    }
    return n;
  }
  /** Emits an input event. */
  emit(e) {
    this._emitter.emit("data", e);
  }
  /**
   * Registers an input event listener.
   * @param callback The function to call when an input occurs.
   * @returns A function which when called deregisters the input event.
   */
  on(e) {
    return this._stdIn ? (this._emitter.listenerCount("data") === 0 && this._stdIn.on("data", this.onData), this._emitter.on("data", e), () => {
      this._emitter.off("data", e), this._emitter.listenerCount("data") === 0 && this._stdIn.off("data", this.onData);
    }) : T;
  }
  /** Disposes of the input. */
  [Symbol.dispose]() {
    this._emitter.removeAllListeners();
    const e = this._stdIn;
    e && e.off("data", this.onData);
  }
  /**
   * Initializes a new instance of the Input class.
   * @param stdIn The optional standard input to monitor. If not specified defaults to `process.stdin`.
   */
  constructor(e = process.stdin) {
    this._emitter = new O(), this._stdIn = e;
  }
}
class U {
  _props;
  _parent;
  _children;
  /** Gets the element properties. */
  get props() {
    return this._props;
  }
  /** Gets the element parent. */
  get parent() {
    return this._parent;
  }
  /** Gets the element children. */
  get children() {
    return this._children;
  }
  /** Clears all children. */
  terminate() {
    this._children = [];
  }
  /**
   * Appends a child.
   * @param child The child to append to the element.
   */
  appendChild(e) {
    this._children = [...this._children, e];
  }
  /**
   * Commits an update to the element properties.
   * @param nextProps The properties to update to.
   */
  commitUpdate(e) {
    this._props = e;
  }
  /**
   * Inserts a child element before another.
   * @param child The child to insert.
   * @param beforeChild The child to insert the other child before.
   */
  insertBefore(e, t) {
    const n = this._children.indexOf(t);
    n !== -1 && this._children.splice(n, 0, e);
  }
  /**
   * Removes the specified child element.
   * @param child The child to remove.
   */
  removeChild(e) {
    const t = this._children.indexOf(e);
    t !== -1 && this._children.splice(t, 1);
  }
  /**
   * Initializes a new instance of the TextElement class.
   * @param props The component properties.
   */
  constructor(e = {}) {
    this._props = e, this._parent = null, this._children = [];
  }
}
class P {
  _value;
  /** Gets the text node instance value. */
  get value() {
    return this._value;
  }
  /**
   * Initializes a new instance of the TextInstance class.
   * @param value The value.
   */
  constructor(e) {
    this._value = e;
  }
  /**
   * Commits an update to the text.
   * @param value The new text value.
   */
  commitTextUpdate(e) {
    this._value = e;
  }
  /**
   * Gets the string representation of the value.
   * @returns The string representation of the value.
   */
  toString() {
    return this._value;
  }
}
const J = (r) => W({
  supportsMutation: !0,
  appendChild(e, t) {
    e.appendChild(t);
  },
  appendChildToContainer(e, t) {
    e.appendChild(t);
  },
  appendInitialChild(e, t) {
    e.appendChild(t);
  },
  clearContainer() {
  },
  commitTextUpdate(e, t, n) {
    e.commitTextUpdate(n);
  },
  commitUpdate(e, t, n, i, s) {
    e.commitUpdate(s);
  },
  createInstance(e, t) {
    if (e === "text")
      return new U(t);
    throw new Error("must be <Text>");
  },
  createTextInstance(e) {
    return new P(e);
  },
  detachDeletedInstance() {
  },
  finalizeInitialChildren() {
    return !1;
  },
  getChildHostContext() {
    return {};
  },
  getPublicInstance(e) {
    return e;
  },
  getRootHostContext(e) {
    return e;
  },
  insertBefore(e, t, n) {
    e.insertBefore(t, n);
  },
  insertInContainerBefore(e, t, n) {
    e.insertBefore(t, n);
  },
  prepareForCommit() {
    return null;
  },
  prepareUpdate() {
    return !0;
  },
  removeChild(e, t) {
    e.removeChild(t);
  },
  removeChildFromContainer(e, t) {
    e.removeChild(t);
  },
  resetAfterCommit() {
    r();
  },
  shouldSetTextContent() {
    return !1;
  }
});
class q {
  buffer;
  cursor = { x: 0, y: 0 };
  size = { x1: 0, y1: 0, x2: 0, y2: 0 };
  constructor() {
    this.buffer = this.generateBuffer();
  }
  generateBuffer() {
    return this.size = { x1: 0, y1: 0, x2: process.stdout.columns, y2: process.stdout.rows }, [...Array(this.size.y2)].map(() => [...Array(this.size.x2)].map(() => [" ", {}]));
  }
  clearBuffer() {
    this.buffer = this.generateBuffer(), this.cursor = { x: 0, y: 0 };
  }
  render(e) {
    this.clearBuffer(), this.renderElement(e, { ...this.cursor, ...this.size });
  }
  stringAt(e, t) {
    const n = parseFloat(e);
    let i = "";
    const s = e.search(/%[+-]\d+$/);
    if (s !== -1 && (i = e.substring(s + 1)), !e.endsWith("%" + i) || isNaN(n)) throw new Error("must be percent");
    return Math.round(t / 100 * n) + parseInt(i || "0");
  }
  renderElement(e, t, n = {}) {
    if (Array.isArray(e)) return e.forEach((d) => this.renderElement(d, t, n));
    const { children: i, ...s } = e.props ?? { children: e };
    typeof s.x == "string" && (s.x = this.stringAt(s.x, s.absolute ? this.buffer[0].length : t.x2 - t.x)), typeof s.y == "string" && (s.y = this.stringAt(s.y, s.absolute ? this.buffer.length : t.y2 - t.y)), typeof s.width == "string" && (s.width = this.stringAt(s.width, s.absolute ? this.buffer[0].length : t.x2 - t.x)), typeof s.height == "string" && (s.height = this.stringAt(s.height, s.absolute ? this.buffer.length : t.y2 - t.y)), s.width !== void 0 && isNaN(s.width) && (s.width = 0), s.height !== void 0 && isNaN(s.height) && (s.height = 0);
    const o = s.x !== void 0 ? (s.absolute ? 0 : t.x) + s.x : this.cursor.x, h = s.y !== void 0 ? (s.absolute ? 0 : t.y) + s.y : this.cursor.y, u = s.x !== void 0 ? s.absolute ? s.x : Math.max(t.x, t.x + s.x) : t.x1, f = s.y !== void 0 ? s.absolute ? s.y : Math.max(t.y, t.y + s.y) : t.y1, c = s.width !== void 0 ? Math.min(s.absolute ? this.buffer[0].length : t.x2, s.width + o) : s.absolute ? this.buffer[0].length : t.x2, l = s.height !== void 0 ? Math.min(s.absolute ? this.buffer.length : t.y2, s.height + h) : s.absolute ? this.buffer.length : t.y2, a = { x: o, y: h, x1: u, y1: f, x2: c, y2: l };
    this.cursor.x = a.x, this.cursor.y = a.y;
    const x = Object.fromEntries(
      ["color", "background", "bold", "dim", "italic", "underline", "blinking", "inverse", "strikethrough"].map((d) => [d, s[d] ?? n[d]]).filter((d) => d[1])
    );
    if ((s.background || s.clear) && (s.width || s.height) && this.fill(a, s.absolute ? a : t, x), Array.isArray(i) || i?.props)
      this.renderElement(e.children, a, x);
    else if (i) {
      const d = i.toString();
      if (d.includes(`
`)) {
        const w = i.toString().split(`
`);
        w.forEach((g, m) => {
          this.renderElement(g, a, x), m < w.length - 1 && this.carret(t);
        });
      } else
        this.cursor.x = this.put(d, a, x);
    }
    s.block && this.carret(t), (s.width || s.height) && (this.cursor.x = s.block ? t.x : a.x2, this.cursor.y = s.block ? a.y2 : t.y);
  }
  fill(e, t, n) {
    for (let i = e.y; i < e.y2; i++)
      if (!(i < Math.max(0, t.y1) || i >= Math.min(t.y2, this.buffer.length)))
        for (let s = e.x; s < e.x2; s++)
          s < Math.max(0, t.x1) || s >= Math.min(t.x2, this.buffer[i].length) || (this.buffer[i][s] = [" ", n]);
  }
  put(e, t, n) {
    const { x: i, y: s } = t;
    let o;
    for (o = 0; o < e.length && !(s < Math.max(0, t.y1) || s >= Math.min(this.buffer.length, t.y2)); o++)
      i + o < Math.max(0, t.x1) || i + o >= Math.min(this.buffer[s].length, t.x2) || (this.buffer[s][i + o] = [e[o], n]);
    return i + o;
  }
  carret(e) {
    this.cursor.x = e.x ?? 0, this.cursor.y++;
  }
}
const p = "\x1B";
class H {
  fullscreen = !0;
  print = !1;
  isResized = !1;
  isMouseEnabled = !1;
  prevBuffer;
  prevModifier = {};
  nextWritePrefix = "";
  cursor = { x: 0, y: 0 };
  maxCursor = { x: 0, y: 0 };
  result;
  init(e, t) {
    this.fullscreen = e, this.print = t, process.stdout.on("resize", () => {
      this.isResized = !0;
    }), process.on("exit", this.onExit), e && (this.append(`${p}[?1049h`), this.append(`${p}c`)), this.append(`${p}[?25l`);
  }
  reinit() {
    this.prevModifier = {}, this.prevBuffer = void 0, this.append(`${p}[?1049h${p}c${p}[?25l`);
  }
  onExit = (e) => {
    e === 0 && (process.stdout.write(this.terminate()), process.exit(0));
  };
  terminate() {
    process.off("exit", this.onExit);
    const e = [];
    if (this.fullscreen)
      e.push(`${p}[?1049l`);
    else {
      const t = this.maxCursor.y - this.cursor.y;
      t > 0 && e.push(`${p}[${t}B`);
      const n = this.maxCursor.x - this.cursor.x + 1;
      n > 0 && e.push(`${p}[${n}C`), e.push(`
`);
    }
    return e.push(`${p}[?25h`), this.isMouseEnabled && e.push(`${p}[?1000l`), e.join("");
  }
  append(e) {
    this.nextWritePrefix += e;
  }
  setResult(e) {
    this.result = e;
  }
  enableMouse() {
    this.append(`${p}[?1000h${p}[?1006h${p}[?1015h`), this.isMouseEnabled = !0;
  }
  // termGetCursor() {
  //   process.stdin.setRawMode(true)
  //   process.stdout.write('\x1b[6n')
  //   return new Promise(resolve => {
  //     process.stdin.on('data', data => {
  //       const [x, y] = data
  //         .toString()
  //         .slice(2, -1)
  //         .split(';')
  //         .reverse()
  //         .map(i => parseInt(i) - 1)
  //       resolve({ x, y })
  //       // process.stdin.unref()
  //       // process.stdin.setRawMode(false)
  //     })
  //   })
  // }
  parseHexColor(e) {
    if (e.match(/^([\da-f]{6})|([\da-f]{3})$/i))
      return (e.length === 4 ? e.substring(1, 4).split("").map((t) => t + t) : e.substring(1, 7).match(/.{2}/g)).map((t) => parseInt(t, 16));
  }
  parseColor(e, t = 0) {
    if (typeof e == "number") {
      if (e < 0 || e > 255) throw new Error("color not found");
      return `${38 + t};5;${e}`;
    }
    if (e.startsWith("#")) {
      const [n, i, s] = this.parseHexColor(e);
      return `${38 + t};2;${n};${i};${s}`;
    }
    switch (e.toLowerCase()) {
      case "black":
        return 30 + t;
      case "red":
        return 31 + t;
      case "green":
        return 32 + t;
      case "yellow":
        return 33 + t;
      case "blue":
        return 34 + t;
      case "magenta":
        return 35 + t;
      case "cyan":
        return 36 + t;
      case "white":
        return 37 + t;
      case "brightblack":
        return 90 + t;
      case "brightred":
        return 91 + t;
      case "brightgreen":
        return 92 + t;
      case "brightyellow":
        return 93 + t;
      case "brightblue":
        return 94 + t;
      case "brightmagenta":
        return 95 + t;
      case "brightcyan":
        return 96 + t;
      case "brightwhite":
        return 97 + t;
      default:
        throw new Error("color not found");
    }
  }
  createModifierSequence(e) {
    if (JSON.stringify(e) === "{}") return "0";
    const { prevModifier: t } = this, n = [];
    return e.color !== t.color && n.push(e.color ? this.parseColor(e.color) : 39), e.background !== t.background && n.push(e.background ? this.parseColor(e.background, 10) : 49), e.bold !== t.bold && n.push(e.bold ? 1 : e.dim ? "22;2" : 22), e.dim !== t.dim && n.push(e.dim ? 2 : e.bold ? "22;1" : 22), e.italic !== t.italic && n.push(e.italic ? 3 : 23), e.underline !== t.underline && n.push(e.underline ? 4 : 24), e.blinking !== t.blinking && n.push(e.blinking ? 5 : 25), e.inverse !== t.inverse && n.push(e.inverse ? 7 : 27), e.strikethrough !== t.strikethrough && n.push(e.strikethrough ? 9 : 29), n.join(";");
  }
  isIcon(e) {
    const t = e.charCodeAt(0);
    return t >= 9211 && t <= 9214 || [9829, 9889, 11096].includes(t) || t >= 57344 && t <= 64838;
  }
  render(e) {
    let t = "";
    const { isResized: n } = this;
    n && (t += `${p}[H`, this.cursor = { x: 0, y: 0 }, this.isResized = !1);
    for (let i = 0; i < e.length; i++) {
      const s = e[i], o = this.prevBuffer?.[i];
      let h = !1, u = !1;
      const f = n ? s : s.map((a, x) => {
        const [d, w] = o && o[x] ? o[x] : [" ", {}], [g, m] = a;
        return this.isResized || d !== g || JSON.stringify(w) !== JSON.stringify(m) ? a : null;
      }).filter((a) => a !== void 0), c = {};
      let l = 0;
      f.forEach((a, x) => {
        if (a === null) return l = x + 1;
        const [d, w] = a;
        c[l] === void 0 && (c[l] = ["", ""]), JSON.stringify(w) !== JSON.stringify(this.prevModifier) && (c[l][1] += `\x1B[${this.createModifierSequence(w)}m`, this.prevModifier = w), c[l][0] += d, c[l][1] += d;
      }), Object.entries(c).map(([a, x]) => {
        const [d, w] = x, g = parseInt(a);
        if (new RegExp("\\p{Emoji}", "u").test(d) && (h = !0), !u && d.split("").find((m) => this.isIcon(m)) && (u = !0), g === 0 && i === this.cursor.y + 1)
          t += `
`;
        else {
          if (!this.fullscreen && i > this.cursor.y && i > this.maxCursor.y) {
            const m = i - this.maxCursor.y;
            t += `
`.repeat(m), this.cursor = { y: this.cursor.y + m, x: 0 };
          }
          if (i !== this.cursor.y && g !== this.cursor.x)
            t += `${p}[${i + 1};${g + 1}H`;
          else if (i > this.cursor.y) {
            const m = i - this.cursor.y;
            t += `${p}[${m > 1 ? m : ""}B`;
          } else if (i < this.cursor.y) {
            const m = this.cursor.y - i;
            t += `${p}[${m > 1 ? m : ""}A`;
          } else if (g > this.cursor.x)
            if (h || u)
              t += `${p}[G${p}[${g > 1 ? g : ""}C`;
            else {
              const m = g - this.cursor.x;
              t += `${p}[${m > 1 ? m : ""}C`;
            }
          else if (g < this.cursor.x)
            if (h)
              t += `${p}[G${p}[${g > 1 ? g : ""}C`;
            else {
              const m = this.cursor.x - g;
              t += `${p}[${m > 1 ? m : ""}D`;
            }
        }
        t += w, this.cursor = { x: g + d.length, y: i };
      }), this.cursor.x > this.maxCursor.x && (this.maxCursor.x = this.cursor.x), this.cursor.y > this.maxCursor.y && (this.maxCursor.y = this.cursor.y);
    }
    if (this.prevBuffer = e, this.nextWritePrefix && (t = this.nextWritePrefix + t, this.nextWritePrefix = ""), (this.result !== void 0 || this.print) && (t += this.terminate()), t) {
      if (this.print) return y[Symbol.dispose](t);
      process.stdout.write(t);
    }
    this.result !== void 0 && y[Symbol.dispose](this.result);
  }
}
class G {
  container;
  _screen;
  _input;
  _terminal;
  reconciler;
  callback;
  throttleAt = 0;
  throttleTimeout;
  /** Gets the input associated with the renderer. */
  get input() {
    return this._input;
  }
  /** Gets the screen associated with the renderer. */
  get screen() {
    return this._screen;
  }
  /** Gets the terminal associated with the renderer. */
  get terminal() {
    return this._terminal;
  }
  /** Initializes a new instance of the Renderer class. */
  constructor() {
    this.container = new U(), this._screen = new q(), this._input = new j(), this._terminal = new H(), this.reconciler = J(this.#t);
  }
  #t = () => {
    const e = Date.now(), t = Math.max(0, 1e3 / 60 - (e - this.throttleAt));
    clearTimeout(this.throttleTimeout), this.throttleTimeout = setTimeout(() => {
      this.throttleAt = e, this.screen.render(this.container.children), this.terminal.render(this.screen.buffer);
    }, t);
  };
  render(e, t = { fullscreen: !0, print: !1 }) {
    this.terminal.init(t.fullscreen, t.print), this.reconciler.updateContainer(
      e,
      this.reconciler.createContainer(this.container, 0, null, !1, null, "", () => {
      }, null)
    );
  }
  inline(e, t = { fullscreen: !1, print: !1 }) {
    this.render(e, t);
  }
  print(e, t = { fullscreen: !1, print: !0 }) {
    return this.render(e, t), new Promise((n) => {
      this.callback = n;
    });
  }
  frame(e, t = { fullscreen: !1, print: !0 }) {
    return this.render(e, t), new Promise((n) => {
      this.callback = (i) => {
        process.stdout.write(i), n(i);
      };
    });
  }
  [Symbol.dispose](e) {
    this.container.terminate(), this.input[Symbol.dispose](), this.terminal.terminate(), this.callback?.(e);
  }
  spawnSync(e, t, n) {
    const i = F(e, t, n);
    return this.terminal.reinit(), this.terminal.render(this.screen.buffer), i;
  }
  bell() {
    process.stdout.write("\x07");
  }
  exit(e = 0) {
    typeof e == "number" && process.exit(e), this.terminal.setResult(e);
  }
}
const y = new G(), $ = (r) => {
  const { children: e, ...t } = r;
  return /* @__PURE__ */ C("text", { ...t, children: e });
};
function L(r, e, t = []) {
  const n = [...r];
  for (; n.length; ) t.push(n.splice(0, e));
  return t;
}
class D {
  // prettier-ignore
  MODES = {
    "1x1": { map: [[1]], table: [32, 136] },
    "1x2": { map: [[1], [2]], table: [32, 128, 132, 136] },
    "2x2": { map: [[1, 4], [2, 8]], table: [32, 152, 150, 140, 157, 128, 158, 155, 151, 154, 132, 153, 144, 156, 159, 136] },
    "2x4": { map: [[1, 8], [2, 16], [4, 32], [64, 128]] }
  };
  mode;
  multicolor;
  w;
  h;
  buffer;
  colors;
  constructor(e, t, n = { w: 1, h: 2 }) {
    this.mode = n, this.multicolor = n.w === 1 && n.h === 2, this.w = Math.ceil(e / this.mode.w) * this.mode.w, this.h = Math.ceil(t / this.mode.h) * this.mode.h;
    const i = this.w / this.mode.w * this.h / this.mode.h;
    this.buffer = Buffer.alloc(i), this.colors = [...Array(i * (this.multicolor ? 2 : 1))];
  }
  clear() {
    this.buffer.fill(0), this.colors.fill(0);
  }
  set(e, t, n) {
    if (e < 0 || e >= this.w || t < 0 || t >= this.h) return;
    const i = this.w / this.mode.w * Math.floor(t / this.mode.h) + Math.floor(e / this.mode.w);
    this.buffer[i] |= this.MODES[`${this.mode.w}x${this.mode.h}`].map[t % this.mode.h][e % this.mode.w], n && (this.colors[this.multicolor ? this.w * t + e : i] = n);
  }
  line(e, t, n, i, s) {
    const o = n - e, h = i - t, u = Math.abs(o), f = Math.abs(h);
    let c = 0;
    const l = o > 0 ? 1 : -1, a = h > 0 ? 1 : -1;
    if (u > f)
      for (let x = e, d = t; l < 0 ? x >= n : x <= n; x += l)
        this.set(x, d, s), c += f, c << 1 >= u && (d += a, c -= u);
    else
      for (let x = e, d = t; a < 0 ? d >= i : d <= i; d += a)
        this.set(x, d, s), c += u, c << 1 >= f && (x += l, c -= f);
  }
  render() {
    return [...this.buffer].map((e, t) => {
      const n = this.MODES[`${this.mode.w}x${this.mode.h}`].table;
      let i = String.fromCharCode(n ? (e && 9472) + n[e] : 10240 + e), s = [];
      if (i !== " ")
        if (this.multicolor) {
          const o = Math.floor(t / this.w) * this.mode.h, h = t % this.w * this.mode.w, u = this.colors[this.w * o + h], f = this.colors[this.w * (o + 1) + h];
          i === "█" && u !== f ? (i = "▀", s = [u, f]) : s = [u || f];
        } else
          s = [this.colors[t]];
      return [i, s];
    });
  }
}
const Q = (r) => /* @__PURE__ */ C(B, {}), V = (r) => /* @__PURE__ */ C(B, {}), ht = ({ mode: r = { w: 1, h: 2 }, width: e, height: t, children: n, ...i }) => {
  const s = M(new D(e, t, r));
  b(() => {
    s.current = new D(e, t, r);
  }, [e, t, r]);
  const o = N(() => (s.current.clear(), v.Children.forEach(n, (h) => {
    if (h.type === Q) {
      const { x: u, y: f, color: c } = h.props;
      s.current.set(u, f, c);
    } else if (h.type === V) {
      const { x: u, y: f, dx: c, dy: l, color: a } = h.props;
      s.current.line(u, f, c, l, a);
    }
  }), s.current.render()), [n]);
  return /* @__PURE__ */ C($, { ...i, children: L(o, s.current.w / s.current.mode.w).map((h, u) => /* @__PURE__ */ C($, { x: 0, y: u, children: h.map(
    ([f, [c, l]], a) => f !== " " && /* @__PURE__ */ C(
      $,
      {
        x: a,
        y: 0,
        color: c || void 0,
        background: l || void 0,
        children: f
      },
      a
    )
  ) }, u)) });
}, z = (r, e, t, n, i) => {
  const s = r + (e - r) / 100 * 100 / (n - t) * (i - t);
  return Math.max(Math.min(r, e), Math.min(Math.max(r, e), s));
}, X = (r, e, t, n, i) => {
  if (!r.startsWith("#") || !e.startsWith("#")) return e;
  const s = y.terminal.parseHexColor(r);
  return "#" + Buffer.from(
    y.terminal.parseHexColor(e).map((o, h) => Math.round(z(s[h], o, t, n, i)))
  ).toString("hex");
}, at = ({ delay: r, children: e }) => Y(r, e), Y = (r, e, t = "key") => {
  const n = M(0), i = M(), [s, o] = _([]);
  return b(() => {
    const h = e.map((a) => a[t]), u = s.find((a) => !h.includes(a));
    if (u) {
      o(s.filter((a) => a !== u));
      return;
    }
    const f = h.find((a) => !s.includes(a));
    if (!f) return;
    const c = Date.now(), l = Math.max(0, r - (c - n.current));
    clearTimeout(i.current), i.current = setTimeout(() => {
      n.current = Date.now(), o([...s, f]);
    }, l);
  }, [e.map((h) => h[t]).join(`
`), s]), e.filter((h) => s.includes(h[t]));
}, ct = (r = 1 / 0, e = 60) => {
  if (r <= 0 || e <= 0) return { ms: 0, interpolate: (o) => o, interpolateColor: (o) => o };
  const t = M(Date.now()), n = M(), [i, s] = _(0);
  return b(() => {
    const o = 1e3 / Math.min(60, e);
    return n.current = setInterval(() => {
      const h = Date.now() - t.current;
      h >= r && clearInterval(n.current), s(Math.min(h, r));
    }, o), () => {
      clearInterval(n.current);
    };
  }, []), {
    ms: i,
    interpolate: (o, h, u = 0, f = r, c = i) => z(o, h, u, f, c),
    interpolateColor: (o, h, u = 0, f = r, c = i) => X(o, h, u, f, c)
  };
};
function S(r) {
  if (Array.isArray(r)) return r.map((t) => S(t)).join("");
  const { children: e } = r.props ?? { children: r };
  return Array.isArray(e) || e.props ? S(e) : e.toString();
}
function I(r) {
  const e = S(r).split(`
`), t = e.reduce((i, s) => Math.max(i, s.length), 0), n = e.length;
  return { width: t, height: n };
}
function ut(r) {
  const [e, t] = _(I(r));
  return b(() => {
    t(I(r));
  }, [r]), e;
}
const lt = () => [() => {
  switch (A) {
    case "darwin":
      return F("pbpaste", [], { encoding: "utf8" }).stdout;
  }
  return "";
}, (t) => {
  switch (typeof t != "string" && (t = t.toString()), A) {
    case "darwin":
      F("pbcopy", [], { input: t });
      break;
    default:
      t = "";
  }
  return t;
}];
var Z = /* @__PURE__ */ ((r) => (r.up = "up", r.left = "left", r.right = "right", r.down = "down", r.pageUp = "pageUp", r.pageDown = "pageDown", r.home = "home", r.tab = "tab", r.delete = "delete", r.end = "end", r.insert = "insert", r.escape = "escape", r.return = "return", r.backspace = "backspace", r.F1 = "F1", r.F2 = "F2", r.F3 = "F3", r.F4 = "F4", r.F5 = "F5", r.F6 = "F6", r.F7 = "F7", r.F8 = "F8", r.F9 = "F9", r.F10 = "F10", r.F11 = "F11", r.F12 = "F12", r))(Z || {});
function ft(r, e = []) {
  b(() => {
    process.stdin.isRaw || process.stdin.setRawMode(!0);
  }, []), b(() => y.input.on((t) => {
    if (!(t.startsWith("\x1B[M") || t.startsWith("\x1B[<"))) {
      if (t === "" && process.exit(), t === "\r" || t === `\r
` || t === `
`) {
        r(
          t,
          "return"
          /* return */
        );
        return;
      }
      if (t === "\x1B") {
        r(
          "",
          "escape"
          /* escape */
        );
        return;
      }
      if (t === "") {
        r(
          "",
          "backspace"
          /* backspace */
        );
        return;
      }
      if (t === "	") {
        r(
          t,
          "tab"
          /* tab */
        );
        return;
      }
      if (t.length === 1) {
        r(t, null);
        return;
      }
      switch (t) {
        case "\x1B[A":
          r(
            "",
            "up"
            /* up */
          );
          break;
        case "\x1B[B":
          r(
            "",
            "down"
            /* down */
          );
          break;
        case "\x1B[D":
          r(
            "",
            "left"
            /* left */
          );
          break;
        case "\x1B[C":
          r(
            "",
            "right"
            /* right */
          );
          break;
        case "\x1B[1~":
        case "\x1B[H":
          r(
            "",
            "home"
            /* home */
          );
          break;
        case "\x1B[2~":
          r(
            "",
            "insert"
            /* insert */
          );
          break;
        case "\x1B[3~":
          r(
            "",
            "delete"
            /* delete */
          );
          break;
        case "\x1B[4~":
        case "\x1B[F":
          r(
            "",
            "end"
            /* end */
          );
          break;
        case "\x1B[5~":
          r(
            "",
            "pageUp"
            /* pageUp */
          );
          break;
        case "\x1B[6~":
          r(
            "",
            "pageDown"
            /* pageDown */
          );
          break;
        case "\x1B[[A":
        case "\x1BOP":
          r(
            "",
            "F1"
            /* F1 */
          );
          break;
        case "\x1B[[B":
        case "\x1BOQ":
          r(
            "",
            "F2"
            /* F2 */
          );
          break;
        case "\x1B[[C":
        case "\x1BOR":
          r(
            "",
            "F3"
            /* F3 */
          );
          break;
        case "\x1B[[D":
        case "\x1BOS":
          r(
            "",
            "F4"
            /* F4 */
          );
          break;
        case "\x1B[[E":
        case "\x1B[15~":
          r(
            "",
            "F5"
            /* F5 */
          );
          break;
        case "\x1B[17~":
          r(
            "",
            "F6"
            /* F6 */
          );
          break;
        case "\x1B[18~":
          r(
            "",
            "F7"
            /* F7 */
          );
          break;
        case "\x1B[19~":
          r(
            "",
            "F8"
            /* F8 */
          );
          break;
        case "\x1B[20~":
          r(
            "",
            "F9"
            /* F9 */
          );
          break;
        case "\x1B[21~":
          r(
            "",
            "F10"
            /* F10 */
          );
          break;
        case "\x1B[23~":
          r(
            "",
            "F11"
            /* F11 */
          );
          break;
        case "\x1B[24~":
          r(
            "",
            "F12"
            /* F12 */
          );
          break;
        default:
          r(t, null);
          break;
      }
    }
  }), e);
}
var K = /* @__PURE__ */ ((r) => (r.leftMouseDown = "leftMouseDown", r.leftMouseUp = "leftMouseUp", r.rightMouseDown = "rightMouseDown", r.rightMouseUp = "rightMouseUp", r.middleMouseDown = "middleMouseDown", r.middleMouseUp = "middleMouseUp", r.wheelDown = "wheelDown", r.wheelUp = "wheelUp", r))(K || {});
function dt(r, e = []) {
  b(() => {
    process.stdin.isRaw || process.stdin.setRawMode(!0), y.terminal.enableMouse();
  }, []), b(() => y.input.on((t) => {
    if (t.startsWith("\x1B[M")) {
      const n = t.charCodeAt(3), i = 64 & n ? 1 & n ? "wheelUp" : "wheelDown" : (3 & n) === 3 ? "leftMouseUp" : "leftMouseDown", s = t.charCodeAt(4) - 33, o = t.charCodeAt(5) - 33;
      r(i, s, o);
      return;
    }
    if (t.startsWith("\x1B[<")) {
      const n = t.substring(3, t.length - 1).split(";"), i = t[t.length - 1];
      if (n.length !== 3 || !["m", "M"].includes(i))
        return;
      const [s, o, h] = n, u = parseInt(o, 10), f = parseInt(h, 10), c = i === "M";
      let l;
      switch (s) {
        case "0":
          c ? l = "leftMouseDown" : l = "leftMouseUp";
          break;
        case "1":
          c ? l = "middleMouseDown" : l = "middleMouseUp";
          break;
        case "2":
          c ? l = "rightMouseDown" : l = "rightMouseUp";
          break;
        case "64":
          l = "wheelUp";
          break;
        case "65":
          l = "wheelDown";
          break;
        default:
          return;
      }
      r(l, u, f);
    }
  }), e);
}
const k = /* @__PURE__ */ new Set();
function R() {
  const { columns: r, rows: e } = E.stdout;
  return { width: r, height: e };
}
E.stdout.on("resize", () => {
  const r = R();
  k.forEach((e, t) => t(r));
});
function tt() {
  const [r, e] = _(R());
  return b(() => (k.add(e), () => {
    k.delete(e);
  }), []), r;
}
const pt = (r, e = void 0) => {
  const t = e ?? tt().width;
  return r.split(`
`).map((n) => n.length <= t ? n : n.split(" ").reduce(
    (i, s) => (i[i.length - 1].length + s.length > t && i.push(""), i[i.length - 1] += `${s} `, i),
    [""]
  ).map((i) => i.trimEnd()).join(`
`)).join(`
`);
};
export {
  ht as Canvas,
  j as Input,
  Z as Keys,
  V as Line,
  K as MouseEventTypes,
  Q as Point,
  $ as Text,
  at as Trail,
  y as default,
  ct as useAnimation,
  ut as useChildrenSize,
  lt as useClipboard,
  ft as useInput,
  dt as useMouse,
  tt as useSize,
  Y as useTrail,
  pt as useWordWrap
};
