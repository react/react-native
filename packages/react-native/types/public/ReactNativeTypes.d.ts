/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';

export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

/**
 * NativeMethods provides methods to access the underlying native component directly.
 * This can be useful in cases when you want to focus a view or measure its on-screen dimensions,
 * for example.
 * The methods described here are available on most of the default components provided by React Native.
 * Note, however, that they are not available on composite components that aren't directly backed by a
 * native view. This will generally include most components that you define in your own app.
 * For more information, see [Direct Manipulation](https://reactnative.dev/docs/the-new-architecture/direct-manipulation-new-architecture).
 * @see https://github.com/facebook/react-native/blob/master/Libraries/Renderer/shims/ReactNativeTypes.js#L87
 *
 * @deprecated Use HostInstance instead.
 */
export interface NativeMethods {
  /**
   * Determines the location on screen, width, and height of the given view and
   * returns the values via an async callback. If successful, the callback will
   * be called with the following arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *  - pageX
   *  - pageY
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native. If you need the measurements as soon as
   * possible, consider using the [`onLayout`
   * prop](docs/view.html#onlayout) instead.
   */
  measure(callback: MeasureOnSuccessCallback): void;

  /**
   * Determines the location of the given view in the window and returns the
   * values via an async callback. If the React root view is embedded in
   * another native view, this will give you the absolute coordinates. If
   * successful, the callback will be called with the following
   * arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native.
   */
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void;

  /**
   * Like [`measure()`](#measure), but measures the view relative an ancestor,
   * specified as `relativeToNativeComponentRef`. This means that the returned x, y
   * are relative to the origin x, y of the ancestor view.
   * _Can also be called with a relativeNativeNodeHandle but is deprecated._
   */
  measureLayout(
    relativeToNativeComponentRef: HostInstance | number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void,
  ): void;

  /**
   * This function sends props straight to native. They will not participate in
   * future diff process - this means that if you do not include them in the
   * next render, they will remain active (see [Direct
   * Manipulation](https://reactnative.dev/docs/the-new-architecture/direct-manipulation-new-architecture)).
   */
  setNativeProps(nativeProps: object): void;

  /**
   * Requests focus for the given input or view. The exact behavior triggered
   * will depend on the platform and type of view.
   */
  focus(): void;

  /**
   * Removes focus from an input or view. This is the opposite of `focus()`.
   */
  blur(): void;
}

/**
 * @deprecated Use HostInstance instead.
 */
export type NativeMethodsMixin = NativeMethods;
/**
 * @deprecated Use HostInstance instead.
 */
export type NativeMethodsMixinType = NativeMethods;

/**
 * Represents a native component, such as those returned from `requireNativeComponent`.
 *
 * @see https://github.com/facebook/react-native/blob/v0.62.0-rc.5/Libraries/Renderer/shims/ReactNativeTypes.js
 *
 * @todo This should eventually be defined as an AbstractComponent, but that
 *       should first be introduced in the React typings.
 */
export interface HostComponent<P>
  extends Pick<
    React.ComponentClass<P>,
    Exclude<keyof React.ComponentClass<P>, 'new'>
  > {
  new (props: P, context?: any): React.Component<P> & HostInstance;
}

export interface ArrayLike<T> extends Iterable<T> {
  [indexer: number]: T;
  readonly length: number;
}

export interface HTMLCollection<T> extends Iterable<T>, ArrayLike<T> {
  [index: number]: T;
  readonly length: number;
  item(index: number): null | T;
  namedItem(name: string): null | T;
  [Symbol.iterator](): Iterator<T>;
}

export interface NodeList<T> extends Iterable<T>, ArrayLike<T> {
  [index: number]: T;
  readonly length: number;
  entries(): Iterator<[number, T]>;
  forEach<ThisType>(
    callbackFn: (value: T, index: number, array: NodeList<T>) => unknown,
    thisArg?: ThisType,
  ): void;
  item(index: number): null | T;
  keys(): Iterator<number>;
  values(): Iterator<T>;
  [Symbol.iterator](): Iterator<T>;
}

export interface ReadOnlyNode {
  get childNodes(): NodeList<ReadOnlyNode>;
  compareDocumentPosition(otherNode: ReadOnlyNode): number;
  contains(otherNode: ReadOnlyNode): boolean;
  get firstChild(): null | ReadOnlyNode;
  getRootNode(): ReadOnlyNode;
  hasChildNodes(): boolean;
  get isConnected(): boolean;
  get lastChild(): null | ReadOnlyNode;
  get nextSibling(): null | ReadOnlyNode;
  get nodeName(): string;
  get nodeType(): number;
  get nodeValue(): null | string;
  get ownerDocument(): null | ReactNativeDocument;
  get parentElement(): null | ReadOnlyElement;
  get parentNode(): null | ReadOnlyNode;
  get previousSibling(): null | ReadOnlyNode;
  get textContent(): string;
}

export interface ReactNativeDocument extends ReadOnlyNode {
  get childElementCount(): number;
  get children(): HTMLCollection<ReadOnlyElement>;
  get documentElement(): ReactNativeElement;
  get firstElementChild(): null | ReadOnlyElement;
  getElementById(id: string): null | ReadOnlyElement;
  get lastElementChild(): null | ReadOnlyElement;
  get nodeName(): string;
  get nodeType(): number;
  get nodeValue(): null;
}

export interface ReadOnlyElement extends ReadOnlyNode {
  get childElementCount(): number;
  get children(): HTMLCollection<ReadOnlyElement>;
  get clientHeight(): number;
  get clientLeft(): number;
  get clientTop(): number;
  get clientWidth(): number;
  get firstElementChild(): null | ReadOnlyElement;
  getBoundingClientRect(): DOMRect;
  hasPointerCapture(pointerId: number): boolean;
  get id(): string;
  get lastElementChild(): null | ReadOnlyElement;
  get nextElementSibling(): null | ReadOnlyElement;
  get nodeName(): string;
  get nodeType(): number;
  get nodeValue(): null | string;
  set nodeValue(value: string);
  get previousElementSibling(): null | ReadOnlyElement;
  releasePointerCapture(pointerId: number): void;
  get scrollHeight(): number;
  get scrollLeft(): number;
  get scrollTop(): number;
  get scrollWidth(): number;
  setPointerCapture(pointerId: number): void;
  get tagName(): string;
  get textContent(): string;
}

export interface ReactNativeElement extends ReadOnlyElement, NativeMethods {
  blur(): void;
  focus(): void;
  get offsetHeight(): number;
  get offsetLeft(): number;
  get offsetParent(): null | ReadOnlyElement;
  get offsetTop(): number;
  get offsetWidth(): number;
  setNativeProps(nativeProps: {}): void;
}

export interface ReadOnlyCharacterData extends ReadOnlyNode {
  get data(): string;
  get length(): number;
  get nextElementSibling(): null | ReadOnlyElement;
  get nodeValue(): string;
  get previousElementSibling(): null | ReadOnlyElement;
  substringData(offset: number, count: number): string;
  get textContent(): string;
}

export interface ReadOnlyText extends ReadOnlyCharacterData {
  get nodeName(): string;
  get nodeType(): number;
}

export type HostInstance = ReactNativeElement;
