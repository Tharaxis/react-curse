import ReactReconciler from "react-reconciler";
import { type TextProps } from "./components/Text";

/** The text element. */
export class TextElement {
  
  private _props: TextProps;
  private _parent: TextElement | null;
  private _children: Array<TextElement>;

  /** Gets the element properties. */
  get props(): TextProps {
    return this._props;
  }

  /** Gets the element parent. */
  get parent(): TextElement | null {
    return this._parent;
  }

  /** Gets the element children. */
  get children(): ReadonlyArray<TextElement> {
    return this._children;
  }

  /** Clears all children. */
  clear(): void {
    this._children = [];
  }

  /**
   * Appends a child.
   * @param child The child to append to the element.
   */
  appendChild(child: TextElement): void {
    this._children = [...this._children, child];
  }

  /**
   * Commits an update to the element properties.
   * @param nextProps The properties to update to.
   */
  commitUpdate(nextProps: TextProps): void {
    this._props = nextProps;
  }

  /**
   * Inserts a child element before another.
   * @param child The child to insert.
   * @param beforeChild The child to insert the other child before.
   */
  insertBefore(child: TextElement, beforeChild: TextElement): void {
    const index = this._children.indexOf(beforeChild)
    if (index !== -1) this._children.splice(index, 0, child)
  }

  /**
   * Removes the specified child element.
   * @param child The child to remove.
   */
  removeChild(child: TextElement): void {
    const index = this._children.indexOf(child)
    if (index !== -1) this._children.splice(index, 1)
  }

  /**
   * Initializes a new instance of the TextElement class.
   * @param props The component properties.
   */
  constructor(props: TextProps = {}) {
    this._props = props;
    this._parent = null;
    this._children = [];
  }
}

/** An instance of a text node. */
export class TextInstance {
  
  private _value: string;

  /** Gets the text node instance value. */
  get value(): string {
    return this._value;
  }

  /**
   * Commits an update to the text.
   * @param value The new text value.
   */
  commitTextUpdate(value: string): void {
    this._value = value;
  }

  /**
   * Gets the string representation of the value.
   * @returns The string representation of the value.
   */
  toString(): string {
    return this._value;
  }

  /**
   * Initializes a new instance of the TextInstance class.
   * @param value The value.
   */
  constructor(value: string) {
    this._value = value;
  }
}

/** The reconciler configuration. */
export const Reconciler = (resetAfterCommit: () => void) => {
  return ReactReconciler({
    supportsMutation: true,
    appendChild(parentInstance: any, child: any) { parentInstance.appendChild(child) },
    appendChildToContainer(container: any, child: any) { container.appendChild(child) },
    appendInitialChild(parentInstance: any, child: any) { parentInstance.appendChild(child) },
    clearContainer() {},
    commitTextUpdate(textInstance: any, _oldText: any, newText: any) { textInstance.commitTextUpdate(newText) },
    commitUpdate(instance: any, _updatePayload: any, _type: any, _prevProps: any, nextProps: any) { instance.commitUpdate(nextProps) },
    createInstance(type: any, props: any) { if (type === 'text') { return new TextElement(props) } else { throw new Error('must be <Text>') } },
    createTextInstance(text: string) { return new TextInstance(text) },
    detachDeletedInstance() {},
    finalizeInitialChildren() { return false },
    getChildHostContext() { return {} },
    getPublicInstance(instance: any) { return instance },
    getRootHostContext(rootContainer: any) { return rootContainer },
    insertBefore(parentInstance: any, child: any, beforeChild: any) { parentInstance.insertBefore(child, beforeChild) },
    insertInContainerBefore(container: any, child: any, beforeChild: any) { container.insertBefore(child, beforeChild) },
    prepareForCommit() { return null },
    prepareUpdate() { return true },
    removeChild(parentInstance: any, child: any) { parentInstance.removeChild(child) },
    removeChildFromContainer(container: any, child: any) { container.removeChild(child) },
    resetAfterCommit() { resetAfterCommit() },
    shouldSetTextContent() { return false },
  } as any);
}
