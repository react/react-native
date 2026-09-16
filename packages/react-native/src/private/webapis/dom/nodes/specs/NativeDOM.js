/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RootTag} from '../../../../../../Libraries/ReactNative/RootTag';
import type {Node as ShadowNode} from '../../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {TurboModule} from '../../../../../../Libraries/TurboModule/RCTExport';
import type {InstanceHandle} from '../internals/NodeInternals';

import * as TurboModuleRegistry from '../../../../../../Libraries/TurboModule/TurboModuleRegistry';

export opaque type NativeElementReference = ShadowNode;
export opaque type NativeTextReference = ShadowNode;

export type NativeNodeReference =
  NativeElementReference | NativeTextReference | RootTag;

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

export interface Spec extends TurboModule {
  /*
   * Methods from the `Node` interface (for `ReadOnlyNode`).
   */

  readonly compareDocumentPosition: (
    nativeNodeReference: unknown /* NativeNodeReference */,
    otherNativeNodeReference: unknown /* NativeNodeReference */,
  ) => number;

  readonly getChildNodes: (
    nativeNodeReference: unknown /* NativeNodeReference */,
  ) => ReadonlyArray<unknown>; /* $ReadOnlyArray<InstanceHandle> */

  readonly getElementById?: (
    nativeNodeReference: unknown /* NativeNodeReference */,
    id: string,
  ) => unknown; /* ?InstanceHandle */

  readonly getParentNode: (
    nativeNodeReference: unknown /* NativeNodeReference */,
  ) => unknown; /* ?InstanceHandle */

  readonly isConnected: (
    nativeNodeReference: unknown /* NativeNodeReference */,
  ) => boolean;

  /*
   * Methods from the `Element` interface (for `ReactNativeElement`).
   */

  readonly getBorderWidth: (
    nativeElementReference: unknown /* NativeElementReference */,
  ) => ReadonlyArray<number>; /* [topWidth: number, rightWidth: number, bottomWidth: number, leftWidth: number] */

  readonly getBoundingClientRect: (
    nativeElementReference: unknown /* NativeElementReference */,
    includeTransform: boolean,
  ) => ReadonlyArray<number>; /* [x: number, y: number, width: number, height: number] */

  readonly getInnerSize: (
    nativeElementReference: unknown /* NativeElementReference */,
  ) => ReadonlyArray<number>; /* [width: number, height: number] */

  readonly getScrollPosition: (
    nativeElementReference: unknown /* NativeElementReference */,
  ) => ReadonlyArray<number>; /* [scrollLeft: number, scrollTop: number] */

  readonly getScrollSize: (
    nativeElementReference: unknown /* NativeElementReference */,
  ) => ReadonlyArray<number>; /* [scrollWidth: number, scrollHeight: number] */

  readonly getTagName: (
    nativeElementReference: unknown /* NativeElementReference */,
  ) => string;

  readonly getTextContent: (
    nativeElementReference: unknown /* NativeElementReference */,
  ) => string;

  readonly hasPointerCapture: (
    nativeElementReference: unknown /* NativeElementReference */,
    pointerId: number,
  ) => boolean;

  readonly releasePointerCapture: (
    nativeElementReference: unknown /* NativeElementReference */,
    pointerId: number,
  ) => void;

  readonly setPointerCapture: (
    nativeElementReference: unknown /* NativeElementReference */,
    pointerId: number,
  ) => void;

  /*
   * Methods from the `HTMLElement` interface (for `ReactNativeElement`).
   */

  readonly getOffset: (
    nativeElementReference: unknown /* NativeElementReference */,
  ) => ReadonlyArray<unknown>; /* [offsetParent: ?InstanceHandle, top: number, left: number] */

  /*
   * Special methods to handle the root node.
   */

  readonly linkRootNode?: (
    rootTag: number /* RootTag */,
    instanceHandle: unknown /* InstanceHandle */,
  ) => unknown; /* ?NativeElementReference */

  /**
   * Legacy layout APIs (for `ReactNativeElement`).
   */

  readonly measure: (
    nativeElementReference: unknown,
    callback: MeasureOnSuccessCallback,
  ) => void;

  readonly measureInWindow: (
    nativeElementReference: unknown,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void;

  readonly measureLayout: (
    nativeElementReference: unknown,
    relativeNode: unknown,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void;

  /**
   * Legacy direct manipulation APIs (for `ReactNativeElement`).
   */

  readonly setNativeProps: (
    nativeElementReference: unknown,
    updatePayload: unknown,
  ) => void;
}

// This is the actual interface of this module, but the native module codegen
// isn't expressive enough yet.
export interface RefinedSpec {
  /*
   * Methods from the `Node` interface (for `ReadOnlyNode`).
   */

  /**
   * This is a React Native implementation of `Node.prototype.compareDocumentPosition`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition).
   *
   * It uses the version of the shadow nodes that are present in the current
   * revision of the shadow tree (if any). If any of the nodes is not present,
   * it just indicates they are disconnected.
   */
  readonly compareDocumentPosition: (
    nativeNodeReference: NativeNodeReference,
    otherNativeNodeReference: NativeNodeReference,
  ) => number;

  /**
   * This is a React Native implementation of `Node.prototype.childNodes`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes).
   *
   * If a version of the given shadow node is present in the current revision
   * of an active shadow tree, it returns an array of instance handles of its
   * children. Otherwise, it returns an empty array.
   */
  readonly getChildNodes: (
    nativeNodeReference: NativeNodeReference,
  ) => ReadonlyArray<InstanceHandle>;

  /**
   * This is a React Native implementation of `Document.prototype.getElementById`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById).
   *
   * If the document is active and contains an element with the given ID, it
   * returns the instance handle of that element. Otherwise, it returns `null`.
   */
  readonly getElementById: (rootTag: RootTag, id: string) => ?InstanceHandle;

  /**
   * This is a React Native implementation of `Node.prototype.parentNode`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/parentNode).
   *
   * If a version of the given shadow node is present in the current revision of
   * an active shadow tree, it returns the instance handle of its parent.
   * Otherwise, it returns `null`.
   */
  readonly getParentNode: (
    nativeNodeReference: NativeNodeReference,
  ) => ?InstanceHandle;

  /**
   * This is a React Native implementation of `Node.prototype.isConnected`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected).
   *
   * Indicates whether a version of the given shadow node is present in the
   * current revision of an active shadow tree.
   */
  readonly isConnected: (nativeNodeReference: NativeNodeReference) => boolean;

  /*
   * Methods from the `Element` interface (for `ReactNativeElement`).
   */

  /**
   * This is a method to access the border size of a shadow node, to implement
   * these methods:
   *   - `Element.prototype.clientLeft`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientLeft.
   *   - `Element.prototype.clientTop`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientTop.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present, it is not
   * displayed (because any of its ancestors or itself have 'display: none'), or
   * it has an inline display, it returns `undefined`. Otherwise, it returns its
   * border size.
   */
  readonly getBorderWidth: (
    nativeElementReference: NativeElementReference,
  ) => Readonly<
    [
      /* topWidth: */ number,
      /* rightWidth: */ number,
      /* bottomWidth: */ number,
      /* leftWidth: */ number,
    ],
  >;

  /**
   * This is a React Native implementation of `Element.prototype.getBoundingClientRect`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
   *
   * This is similar to `measureInWindow`, except it's explicitly synchronous
   * (returns the result instead of passing it to a callback).
   *
   * It allows indicating whether to include transforms so it can also be used
   * to implement methods like [`offsetWidth`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetWidth)
   * and [`offsetHeight`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight).
   */
  readonly getBoundingClientRect: (
    nativeElementReference: NativeElementReference,
    includeTransform: boolean,
  ) => Readonly<
    [
      /* x: */ number,
      /* y: */ number,
      /* width: */ number,
      /* height: */ number,
    ],
  >;

  /**
   * This is a method to access the inner size of a shadow node, to implement
   * these methods:
   *   - `Element.prototype.clientWidth`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth.
   *   - `Element.prototype.clientHeight`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present, it is not
   * displayed (because any of its ancestors or itself have 'display: none'), or
   * it has an inline display, it returns `undefined`. Otherwise, it returns its
   * inner size.
   */
  readonly getInnerSize: (
    nativeElementReference: NativeElementReference,
  ) => Readonly<[/* width: */ number, /* height: */ number]>;

  /**
   * This is a method to access scroll information for a shadow node, to
   * implement these methods:
   *   - `Element.prototype.scrollLeft`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft.
   *   - `Element.prototype.scrollTop`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present or is not displayed
   * (because any of its ancestors or itself have 'display: none'), it returns
   * `undefined`. Otherwise, it returns the scroll position.
   */
  readonly getScrollPosition: (
    nativeElementReference: NativeElementReference,
  ) => Readonly<[/* scrollLeft: */ number, /* scrollTop: */ number]>;

  /**
   *
   * This is a method to access the scroll information of a shadow node, to
   * implement these methods:
   *   - `Element.prototype.scrollWidth`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth.
   *   - `Element.prototype.scrollHeight`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present or is not displayed
   * (because any of its ancestors or itself have 'display: none'), it returns
   * `undefined`. Otherwise, it returns the scroll size.
   */
  readonly getScrollSize: (
    nativeElementReference: NativeElementReference,
  ) => Readonly<[/* scrollWidth: */ number, /* scrollHeight: */ number]>;

  /**
   * This is a method to access the normalized tag name of a shadow node, to
   * implement `Element.prototype.tagName` (see https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName).
   */
  readonly getTagName: (
    nativeElementReference: NativeElementReference,
  ) => string;

  /**
   * This is a React Native implementation of `Element.prototype.textContent`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Element/textContent).
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree.
   * If the version is present, is traverses all its children in DFS and
   * concatenates all the text contents. Otherwise, it returns an empty string.
   *
   * This is also used to access the text content of text nodes, which does not
   * need any traversal.
   */
  readonly getTextContent: (nativeNodeReference: NativeNodeReference) => string;

  readonly hasPointerCapture: (
    nativeElementReference: NativeElementReference,
    pointerId: number,
  ) => boolean;

  readonly releasePointerCapture: (
    nativeElementReference: NativeElementReference,
    pointerId: number,
  ) => void;

  readonly setPointerCapture: (
    nativeElementReference: NativeElementReference,
    pointerId: number,
  ) => void;

  /**
   * This is a method to access the offset information for a shadow node, to
   * implement these methods:
   *   - `HTMLElement.prototype.offsetParent`: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent.
   *   - `HTMLElement.prototype.offsetTop`: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop.
   *   - `HTMLElement.prototype.offsetLeft`: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetLeft.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present or is not
   * displayed (because any of its ancestors or itself have 'display: none'),
   * it returns `undefined`. Otherwise, it returns its parent (as all nodes in
   * React Native are currently "positioned") and its offset relative to its
   * parent.
   */
  readonly getOffset: (
    nativeElementReference: NativeElementReference,
  ) => Readonly<
    [
      /* offsetParent: */ ?InstanceHandle,
      /* top: */ number,
      /* left: */ number,
    ],
  >;

  /*
   * Special methods to handle the root node.
   */

  /**
   * In React Native, surfaces that represent trees (similar to a `Document` on
   * Web) are created in native first, and then populated from JavaScript.
   *
   * Because React does not create this special node, we need a way to link
   * the JavaScript instance with that node, which is what this method allows.
   *
   * It also allows the implementation of `Node.prototype.ownerDocument` and
   * `Node.prototype.getRootNode`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/ownerDocument and
   * https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode).
   *
   * Returns a shadow node representing the root node if it is still mounted.
   */
  readonly linkRootNode: (
    rootTag: RootTag,
    instanceHandle: InstanceHandle,
  ) => ?NativeElementReference;

  /**
   * Legacy layout APIs
   */

  readonly measure: (
    nativeElementReference: NativeElementReference,
    callback: MeasureOnSuccessCallback,
  ) => void;

  readonly measureInWindow: (
    nativeElementReference: NativeElementReference,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void;

  readonly measureLayout: (
    nativeElementReference: NativeElementReference,
    relativeNode: NativeElementReference,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void;

  /**
   * Legacy direct manipulation APIs
   */
  readonly setNativeProps: (
    nativeElementReference: NativeElementReference,
    updatePayload: {...},
  ) => void;
}

// We used to implement all methods in RefineSpec, manually refining the types
// for all methods. However, this is slower as every call to the native module
// requires an additional call only to handle types. Instead, we do an unsafe
// casting here. Keep in mind that:
// 1. We use `get` and not `getEnforcing` because we don't want to fail when
//    the module is evaluated, only when used. This is necessary because we
//    don't use inline requires within the `react-native` package and some code
//    might end up loading this but not using it.
// 2. We lose automatic backwards compatibility checks because of this.
// $FlowExpectedError[incompatible-type]
export default TurboModuleRegistry.get<Spec>('NativeDOMCxx') as RefinedSpec;
