import { type ReactElement, ReactNode, useEffect, useState } from 'react'
import { Size } from './useSize'

/**
 * Renders out a string representation of the specified element.
 * @param element The element to render.
 * @returns The string representation of the element. 
 */
function render(element: ReactNode): string {
  if (Array.isArray(element)) return element.map(i => render(i)).join("");

  const { children } = (element as ReactElement).props ?? { children: element };
  if (Array.isArray(children) || children.props) return render(children);

  return children.toString();
}

/**
 * Gets the size of the specified children.
 * @param children The children to get the size for.
 * @returns The size of teh children.
 */
function getSize(children: ReactNode): Size {
  const string = render(children).split('\n');
  const width = string.reduce((acc: number, i: string) => Math.max(acc, i.length), 0);
  const height = string.length;

  return { width, height };
}

/**
 * Gets the size of the specified children.
 * @param children The children to get the size for.
 * @returns The size of teh children.
 */
export function useChildrenSize(children: ReactNode): Size {
  const [size, setSize] = useState(getSize(children));

  useEffect(() => {
    setSize(getSize(children))
  }, [children]);

  return size;
}
