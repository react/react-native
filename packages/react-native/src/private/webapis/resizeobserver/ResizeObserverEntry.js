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

import type ReactNativeElement from '../dom/nodes/ReactNativeElement';
import type {NativeResizeObserverEntry} from './specs/NativeResizeObserver';

import DOMRectReadOnly from '../geometry/DOMRectReadOnly';
import {setPlatformObject} from '../webidl/PlatformObjects';
import ResizeObserverSize from './ResizeObserverSize';

/**
 * The [`ResizeObserverEntry`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry)
 * interface of the Resize Observer API represents the object passed to the
 * `ResizeObserver()` callback function, which allows access to the new
 * dimensions of the observed target element after its size has changed.
 */
export default class ResizeObserverEntry {
  // We lazily compute all the properties from the raw entry provided by the
  // native module, so we avoid unnecessary work.
  _nativeEntry: NativeResizeObserverEntry;
  // There are cases where this cannot be safely derived from the instance
  // handle in the native entry (when the target is detached), so we need to
  // keep a reference to it directly.
  _target: ReactNativeElement;
  _contentRect: ?DOMRectReadOnly;
  _borderBoxSize: ?ReadonlyArray<ResizeObserverSize>;
  _contentBoxSize: ?ReadonlyArray<ResizeObserverSize>;
  _devicePixelContentBoxSize: ?ReadonlyArray<ResizeObserverSize>;

  constructor(
    nativeEntry: NativeResizeObserverEntry,
    target: ReactNativeElement,
  ) {
    this._nativeEntry = nativeEntry;
    this._target = target;
  }

  /**
   * The `ReactNativeElement` whose size has changed.
   */
  get target(): ReactNativeElement {
    return this._target;
  }

  /**
   * Returns a `DOMRectReadOnly` object which, prior to Firefox 57, contained
   * the new size of the observed element.
   *
   * In React Native, this is the content rect of the observed target (the
   * bounds of its content box).
   */
  get contentRect(): DOMRectReadOnly {
    if (this._contentRect == null) {
      const contentRect = this._nativeEntry.contentRect;
      this._contentRect = new DOMRectReadOnly(
        contentRect[0],
        contentRect[1],
        contentRect[2],
        contentRect[3],
      );
    }
    return this._contentRect;
  }

  /**
   * An array containing the new border box size of the observed element.
   *
   * Note: React Native does not support fragments, so this array will
   * always contain a single value.
   */
  get borderBoxSize(): ReadonlyArray<ResizeObserverSize> {
    if (this._borderBoxSize == null) {
      const borderBoxSize = this._nativeEntry.borderBoxSize;
      this._borderBoxSize = Object.freeze([
        new ResizeObserverSize(borderBoxSize[0], borderBoxSize[1]),
      ]);
    }
    return this._borderBoxSize;
  }

  /**
   * An array containing the new content box size of the observed element.
   *
   * Note: React Native does not support fragments, so this array will
   * always contain a single value.
   */
  get contentBoxSize(): ReadonlyArray<ResizeObserverSize> {
    if (this._contentBoxSize == null) {
      const contentBoxSize = this._nativeEntry.contentBoxSize;
      this._contentBoxSize = Object.freeze([
        new ResizeObserverSize(contentBoxSize[0], contentBoxSize[1]),
      ]);
    }
    return this._contentBoxSize;
  }

  /**
   * An array containing the new device pixel content box size of the observed element.
   *
   * Note: React Native does not support fragments, so this array will
   * always contain a single value.
   */
  get devicePixelContentBoxSize(): ReadonlyArray<ResizeObserverSize> {
    if (this._devicePixelContentBoxSize == null) {
      const devicePixelContentBoxSize =
        this._nativeEntry.devicePixelContentBoxSize;
      this._devicePixelContentBoxSize = Object.freeze([
        new ResizeObserverSize(
          devicePixelContentBoxSize[0],
          devicePixelContentBoxSize[1],
        ),
      ]);
    }
    return this._devicePixelContentBoxSize;
  }
}

setPlatformObject(ResizeObserverEntry);

export function createResizeObserverEntry(
  entry: NativeResizeObserverEntry,
  target: ReactNativeElement,
): ResizeObserverEntry {
  return new ResizeObserverEntry(entry, target);
}

export const ResizeObserverEntry_public: typeof ResizeObserverEntry =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function ResizeObserverEntry() {
    throw new TypeError(
      "Failed to construct 'ResizeObserverEntry': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
ResizeObserverEntry_public.prototype = ResizeObserverEntry.prototype;
