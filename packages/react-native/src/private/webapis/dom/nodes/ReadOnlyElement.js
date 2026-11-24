/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type HTMLCollection from '../oldstylecollections/HTMLCollection';

import DOMRect from '../../geometry/DOMRect';
import {createHTMLCollection} from '../oldstylecollections/HTMLCollection';
import {
  getCurrentProps,
  getNativeElementReference,
} from './internals/NodeInternals';
import {getElementSibling} from './internals/Traversal';
import ReadOnlyNode, {getChildNodes} from './ReadOnlyNode';
import NativeDOM from './specs/NativeDOM';

export default class ReadOnlyElement extends ReadOnlyNode {
  // $FlowFixMe[unsafe-getters-setters]
  get childElementCount(): number {
    return getChildElements(this).length;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get children(): HTMLCollection<ReadOnlyElement> {
    return createHTMLCollection(getChildElements(this));
  }

  // $FlowFixMe[unsafe-getters-setters]
  get clientHeight(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const innerSize = NativeDOM.getInnerSize(node);
      return innerSize[1];
    }

    return 0;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get clientLeft(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const borderSize = NativeDOM.getBorderWidth(node);
      return borderSize[3];
    }

    return 0;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get clientTop(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const borderSize = NativeDOM.getBorderWidth(node);
      return borderSize[0];
    }

    return 0;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get clientWidth(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const innerSize = NativeDOM.getInnerSize(node);
      return innerSize[0];
    }

    return 0;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get firstElementChild(): ReadOnlyElement | null {
    const childElements = getChildElements(this);

    if (childElements.length === 0) {
      return null;
    }

    return childElements[0];
  }

  // $FlowFixMe[unsafe-getters-setters]
  get id(): string {
    const props = getCurrentProps(this);
    const id = props.id ?? props.nativeID;
    return typeof id === 'string' ? id : '';
  }

  // $FlowFixMe[unsafe-getters-setters]
  get lastElementChild(): ReadOnlyElement | null {
    const childElements = getChildElements(this);

    if (childElements.length === 0) {
      return null;
    }

    return childElements[childElements.length - 1];
  }

  // $FlowFixMe[unsafe-getters-setters]
  get nextElementSibling(): ReadOnlyElement | null {
    return getElementSibling(this, 'next');
  }

  // $FlowFixMe[unsafe-getters-setters]
  get nodeName(): string {
    return this.tagName;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get nodeType(): number {
    return ReadOnlyNode.ELEMENT_NODE;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get nodeValue(): string | null {
    return null;
  }

  // $FlowFixMe[unsafe-getters-setters]
  set nodeValue(value: string): void {}

  // $FlowFixMe[unsafe-getters-setters]
  get previousElementSibling(): ReadOnlyElement | null {
    return getElementSibling(this, 'previous');
  }

  // $FlowFixMe[unsafe-getters-setters]
  get scrollHeight(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const scrollSize = NativeDOM.getScrollSize(node);
      return scrollSize[1];
    }

    return 0;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get scrollLeft(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const scrollPosition = NativeDOM.getScrollPosition(node);
      return scrollPosition[0];
    }

    return 0;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get scrollTop(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const scrollPosition = NativeDOM.getScrollPosition(node);
      return scrollPosition[1];
    }

    return 0;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get scrollWidth(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const scrollSize = NativeDOM.getScrollSize(node);
      return scrollSize[0];
    }

    return 0;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get tagName(): string {
    const node = getNativeElementReference(this);

    if (node != null) {
      return NativeDOM.getTagName(node);
    }

    return '';
  }

  // $FlowFixMe[unsafe-getters-setters]
  get textContent(): string {
    const node = getNativeElementReference(this);

    if (node != null) {
      return NativeDOM.getTextContent(node);
    }

    return '';
  }

  getBoundingClientRect(): DOMRect {
    return getBoundingClientRect(this, {includeTransform: true});
  }

  /**
   * Pointer Capture APIs
   */
  hasPointerCapture(pointerId: number): boolean {
    const node = getNativeElementReference(this);
    if (node != null) {
      return NativeDOM.hasPointerCapture(node, pointerId);
    }
    return false;
  }

  setPointerCapture(pointerId: number): void {
    const node = getNativeElementReference(this);
    if (node != null) {
      NativeDOM.setPointerCapture(node, pointerId);
    }
  }

  releasePointerCapture(pointerId: number): void {
    const node = getNativeElementReference(this);
    if (node != null) {
      NativeDOM.releasePointerCapture(node, pointerId);
    }
  }
}

function getChildElements(node: ReadOnlyNode): ReadonlyArray<ReadOnlyElement> {
  // $FlowFixMe[incompatible-type]
  return getChildNodes(
    node,
    (childNode: ReadOnlyNode) =>
      childNode.nodeType === ReadOnlyNode.ELEMENT_NODE,
  );
}

/**
 * The public API for `getBoundingClientRect` always includes transform,
 * so we use this internal version to get the data without transform to
 * implement methods like `offsetWidth` and `offsetHeight`.
 */
export function getBoundingClientRect(
  element: ReadOnlyElement,
  {includeTransform}: {includeTransform: boolean},
): DOMRect {
  const node = getNativeElementReference(element);

  if (node != null) {
    const rect = NativeDOM.getBoundingClientRect(node, includeTransform);
    return new DOMRect(rect[0], rect[1], rect[2], rect[3]);
  }

  // Empty rect if any of the above failed
  return new DOMRect(0, 0, 0, 0);
}

export const ReadOnlyElement_public: typeof ReadOnlyElement =
  // $FlowExpectedError[incompatible-type]
  function Element() {
    throw new TypeError("Failed to construct 'Element': Illegal constructor");
  };

ReadOnlyElement_public.prototype = ReadOnlyElement.prototype;
