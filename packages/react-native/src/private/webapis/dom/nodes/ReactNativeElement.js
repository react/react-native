/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

import type {
  InternalInstanceHandle,
  ViewConfig,
} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {
  HostInstance,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from '../../../types/HostInstance';
import type Event from '../events/Event';
import type {InstanceHandle} from './internals/NodeInternals';
import type ReactNativeDocument from './ReactNativeDocument';

import TextInputState from '../../../../../Libraries/Components/TextInput/TextInputState';
import {Commands as ViewCommands} from '../../../../../Libraries/Components/View/ViewNativeComponent';
import {create as createAttributePayload} from '../../../../../Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload';
import warnForStyleProps from '../../../../../Libraries/ReactNative/ReactFabricPublicInstance/warnForStyleProps';
import * as ReactNativeFeatureFlags from '../../../featureflags/ReactNativeFeatureFlags';
import {getEventTypePropName} from '../../../renderer/events/ReactNativeEventTypeMapping';
import {
  getBubbledPropName,
  getCapturedPropName,
} from '../events/internals/EventInternals';
import {EVENT_TARGET_GET_DECLARATIVE_LISTENER_KEY} from '../events/internals/EventTargetInternals';
import {
  getCurrentProps,
  getNativeElementReference,
  getPublicInstanceFromInstanceHandle,
  setInstanceHandle,
  setOwnerDocument,
} from './internals/NodeInternals';
import ReadOnlyElement, {getBoundingClientRect} from './ReadOnlyElement';
import NativeDOM from './specs/NativeDOM';

const noop = () => {};

// Ideally, this class would be exported as-is, but this implementation is
// significantly slower than the existing `ReactFabricHostComponent`.
// This is a very hot code path (this class is instantiated once per rendered
// host component in the tree) and we can't regress performance here.
//
// This implementation is slower because this is a subclass and we have to call
// super(), which is a very slow operation the way that Babel transforms it at
// the moment.
//
// The optimization we're doing is using an old-style function constructor,
// where we're not required to use `super()`, and we make that constructor
// extend this class so it inherits all the methods and it sets the class
// hierarchy correctly.
//
// An alternative implementation was to implement the constructor as a function
// returning a manually constructed instance using `Object.create()` but that
// was slower than this method because the engine has to create an object than
// we then discard to create a new one.

/** @build-types protected-constructor */
class ReactNativeElement extends ReadOnlyElement {
  // These need to be accessible from `ReactFabricPublicInstanceUtils`.
  __nativeTag: number;
  __internalInstanceHandle: InstanceHandle;

  __viewConfig: ViewConfig;

  // This constructor isn't really used. See the `ReactNativeElement` function
  // below.
  constructor(
    tag: number,
    viewConfig: ViewConfig,
    instanceHandle: InstanceHandle,
    ownerDocument: ReactNativeDocument,
  ) {
    super(instanceHandle, ownerDocument);

    this.__nativeTag = tag;
    this.__internalInstanceHandle = instanceHandle;
    this.__viewConfig = viewConfig;
  }

  get offsetHeight(): number {
    return Math.round(
      getBoundingClientRect(this, {includeTransform: false}).height,
    );
  }

  get offsetLeft(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const offset = NativeDOM.getOffset(node);
      return Math.round(offset[2]);
    }

    return 0;
  }

  get offsetParent(): ReadOnlyElement | null {
    const node = getNativeElementReference(this);

    if (node != null) {
      const offset = NativeDOM.getOffset(node);
      // For children of the root node we currently return offset data
      // but a `null` parent because the root node is not accessible
      // in JavaScript yet.
      if (offset[0] != null) {
        const offsetParentInstanceHandle = offset[0];
        const offsetParent = getPublicInstanceFromInstanceHandle(
          offsetParentInstanceHandle,
        );
        // $FlowExpectedError[incompatible-type] The value returned by `getOffset` is always an instance handle for `ReadOnlyElement`.
        const offsetParentElement: ReadOnlyElement | null = offsetParent;
        return offsetParentElement;
      }
    }

    return null;
  }

  get offsetTop(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const offset = NativeDOM.getOffset(node);
      return Math.round(offset[1]);
    }

    return 0;
  }

  get offsetWidth(): number {
    return Math.round(
      getBoundingClientRect(this, {includeTransform: false}).width,
    );
  }

  /**
   * React Native compatibility methods
   */

  /**
   * Removes focus from an input or view. This is the opposite of `focus()`.
   */
  blur(): void {
    if (TextInputState.isTextInput(this)) {
      TextInputState.blurTextInput(this);
    } else if (ReactNativeFeatureFlags.enableImperativeFocus()) {
      ViewCommands.blur(this);
    }
  }

  /**
   * Requests focus for the given input or view. The exact behavior triggered
   * will depend on the platform and type of view.
   */
  focus() {
    if (TextInputState.isTextInput(this)) {
      TextInputState.focusTextInput(this);
    } else if (ReactNativeFeatureFlags.enableImperativeFocus()) {
      ViewCommands.focus(this);
    }
  }

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
  measure(callback: MeasureOnSuccessCallback) {
    const node = getNativeElementReference(this);
    if (node != null) {
      NativeDOM.measure(node, callback);
    }
  }

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
  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    const node = getNativeElementReference(this);
    if (node != null) {
      NativeDOM.measureInWindow(node, callback);
    }
  }

  /**
   * Like [`measure()`](#measure), but measures the view relative an ancestor,
   * specified as `relativeToNativeComponentRef`. This means that the returned x, y
   * are relative to the origin x, y of the ancestor view.
   * _Can also be called with a relativeNativeNodeHandle but is deprecated._
   */
  measureLayout(
    relativeToNativeNode: number | HostInstance,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void /* currently unused */,
  ) {
    if (!(relativeToNativeNode instanceof ReactNativeElement)) {
      if (__DEV__) {
        console.error(
          'Warning: ref.measureLayout must be called with a ref to a native component.',
        );
      }

      return;
    }

    const toStateNode = getNativeElementReference(this);
    const fromStateNode = getNativeElementReference(relativeToNativeNode);

    if (toStateNode != null && fromStateNode != null) {
      NativeDOM.measureLayout(
        toStateNode,
        fromStateNode,
        onFail != null ? onFail : noop,
        onSuccess != null ? onSuccess : noop,
      );
    }
  }

  /**
   * This function sends props straight to native. They will not participate in
   * future diff process - this means that if you do not include them in the
   * next render, they will remain active (see [Direct
   * Manipulation](https://reactnative.dev/docs/the-new-architecture/direct-manipulation-new-architecture)).
   */
  setNativeProps(nativeProps: {...}): void {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this.__viewConfig.validAttributes);
    }

    const updatePayload = createAttributePayload(
      nativeProps,
      this.__viewConfig.validAttributes,
    );

    const node = getNativeElementReference(this);

    if (node != null && updatePayload != null) {
      NativeDOM.setNativeProps(node, updatePayload);
    }
  }

  // Provide event listeners from React props during EventTarget dispatch.
  // This is called by EventTarget.invoke() before explicit addEventListener
  // listeners, allowing prop-based handlers to be resolved at dispatch time
  // without registering them via addEventListener during commit.
  //
  // Fast path: when `event` is a `LegacySyntheticEvent` (always the case for
  // events created by `dispatchNativeEvent`), the React prop names have been
  // pre-resolved on the event during construction. Reading them directly
  // avoids the `getEventTypePropName(eventType, isCapture)` hash lookup per
  // ancestor per phase.
  // $FlowExpectedError[unsupported-syntax]
  [EVENT_TARGET_GET_DECLARATIVE_LISTENER_KEY](
    event: Event,
    isCapture: boolean,
  ): ((event: Event) => void) | null {
    const currentProps = getCurrentProps(this);
    if (currentProps == null) {
      return null;
    }
    let propName = isCapture
      ? getCapturedPropName(event)
      : getBubbledPropName(event);
    if (propName === undefined) {
      // The event wasn't created via `dispatchNativeEvent` (e.g.,
      // user-dispatched). Fall back to the mapping table.
      propName = getEventTypePropName(event.type, isCapture);
    }
    if (propName == null) {
      return null;
    }
    const handler = currentProps[propName];
    return typeof handler === 'function' ? handler : null;
  }
}

type ReactNativeElementT = ReactNativeElement;

function replaceConstructorWithoutSuper(
  ReactNativeElementClass: Class<ReactNativeElementT>,
): Class<ReactNativeElementT> {
  // Alternative constructor just implemented to provide a better performance than
  // calling super() in the original class.
  // eslint-disable-next-line no-shadow
  function ReactNativeElement(
    this: ReactNativeElementT,
    tag: number,
    viewConfig: ViewConfig,
    internalInstanceHandle: InternalInstanceHandle,
    ownerDocument: ReactNativeDocument,
  ) {
    // Inlined from `ReadOnlyNode`
    setOwnerDocument(this, ownerDocument);
    setInstanceHandle(this, internalInstanceHandle);

    this.__nativeTag = tag;
    this.__internalInstanceHandle = internalInstanceHandle;
    this.__viewConfig = viewConfig;
  }

  ReactNativeElement.prototype = ReactNativeElementClass.prototype;

  // $FlowExpectedError[incompatible-type]
  return ReactNativeElement;
}

export default replaceConstructorWithoutSuper(
  ReactNativeElement,
) as typeof ReactNativeElement;

export const ReactNativeElement_public: typeof ReactNativeElement =
  // $FlowExpectedError[incompatible-type]
  function HTMLElement() {
    throw new TypeError(
      "Failed to construct 'HTMLElement': Nodes cannot be imperatively created in React Native",
    );
  };

// $FlowExpectedError[prop-missing]
ReactNativeElement_public.prototype = ReactNativeElement.prototype;

// The public imperative EventTarget API (`addEventListener`,
// `removeEventListener`, `dispatchEvent`) is only inherited by this final class
// when `enableNativeEventTargetEventDispatching` is enabled (which makes
// `ReadOnlyNode` extend `EventTarget`). Until that public API is finalized, it
// is gated behind `enableImperativeEvents`: when that flag is off we remove
// those methods from this final class. Native/internal event dispatch does not
// rely on these public methods, so removing them is safe.
if (
  ReactNativeFeatureFlags.enableNativeEventTargetEventDispatching() &&
  !ReactNativeFeatureFlags.enableImperativeEvents()
) {
  const prototype: interface {
    addEventListener?: unknown,
    removeEventListener?: unknown,
    dispatchEvent?: unknown,
  } = ReactNativeElement.prototype;
  prototype.addEventListener = undefined;
  prototype.removeEventListener = undefined;
  prototype.dispatchEvent = undefined;
}
