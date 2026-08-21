/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EventSubscription} from '../../vendor/emitter/EventEmitter';
import type {PlatformConfig} from '../AnimatedPlatformConfig';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import invariant from 'invariant';

export type ValueListenerCallback = (state: {value: number}) => unknown;

export type AnimatedNodeConfig = Readonly<{
  debugID?: string,
  unstable_disableBatchingForNativeCreate?: boolean,
}>;

let _uniqueId = 1;
let _assertNativeAnimatedModule: ?() => void = () => {
  NativeAnimatedHelper.assertNativeAnimatedModule();
  // We only have to assert that the module exists once. After we've asserted
  // this, clear out the function so we know to skip it in the future.
  _assertNativeAnimatedModule = null;
};

export default class AnimatedNode {
  _listeners: Map<string, ValueListenerCallback>;

  _platformConfig: ?PlatformConfig = undefined;

  constructor(
    config?: ?Readonly<{
      ...AnimatedNodeConfig,
      ...
    }>,
  ) {
    this._listeners = new Map();
    if (__DEV__) {
      this.__debugID = config?.debugID;
    }
    this.__disableBatchingForNativeCreate =
      config?.unstable_disableBatchingForNativeCreate;
  }

  __attach(): void {}
  __detach(): void {
    if (!ReactNativeFeatureFlags.animatedKeepListenersOnDetach()) {
      this.removeAllListeners();
    }
    if (this.__isNative && this.__nativeTag != null) {
      const nativeTag = this.__nativeTag;
      // The subscription must not outlive the native tag it observes. Any
      // listeners kept around are re-subscribed by `__makeNative` if this node
      // is attached again.
      this.__updateSubscription?.remove();
      NativeAnimatedHelper.API.dropAnimatedNode(nativeTag);
      this.__nativeTag = undefined;
    }
  }
  __getValue(): any {}
  __getAnimatedValue(): any {
    return this.__getValue();
  }
  __addChild(child: AnimatedNode) {}
  __removeChild(child: AnimatedNode) {}
  __getChildren(): ReadonlyArray<AnimatedNode> {
    return [];
  }

  /* Methods and props used by native Animated impl */
  __isNative: boolean = false;
  __nativeTag: ?number = undefined;
  __disableBatchingForNativeCreate: ?boolean = undefined;

  /**
   * Whether the native node backing this one holds a number, and therefore
   * supports `startListeningToAnimatedNodeValue`. That native module method
   * only accepts tags of "value" nodes (`ValueAnimatedNode` on Android and in
   * C++, `RCTValueAnimatedNode` on iOS); passing any other tag throws on
   * Android and is a no-op elsewhere.
   *
   * Subclasses backed by a non-value native node — props, style, transform,
   * object, tracking and color — must leave this `false`.
   */
  __isNativeValueNode: boolean = false;
  __updateSubscription: ?EventSubscription = null;

  __makeNative(platformConfig: ?PlatformConfig): void {
    // Subclasses are expected to set `__isNative` to true before this.
    invariant(
      this.__isNative,
      'This node cannot be made a "native" animated node',
    );

    this._platformConfig = platformConfig;
    if (this._listeners.size > 0) {
      this.__ensureUpdateSubscriptionExists();
    }
  }

  /**
   * Adds an asynchronous listener to the value so you can observe updates from
   * animations.  This is useful because there is no way to
   * synchronously read the value because it might be driven natively.
   *
   * See https://reactnative.dev/docs/animatedvalue#addlistener
   */
  addListener(callback: (value: any) => unknown): string {
    const id = String(_uniqueId++);
    this._listeners.set(id, callback);
    if (this.__isNative) {
      this.__ensureUpdateSubscriptionExists();
    }
    return id;
  }

  /**
   * Unregister a listener. The `id` param shall match the identifier
   * previously returned by `addListener()`.
   *
   * See https://reactnative.dev/docs/animatedvalue#removelistener
   */
  removeListener(id: string): void {
    this._listeners.delete(id);
    if (this.__isNative && this._listeners.size === 0) {
      this.__updateSubscription?.remove();
    }
  }

  /**
   * Remove all registered listeners.
   *
   * See https://reactnative.dev/docs/animatedvalue#removealllisteners
   */
  removeAllListeners(): void {
    this._listeners.clear();
    if (this.__isNative) {
      this.__updateSubscription?.remove();
    }
  }

  hasListeners(): boolean {
    return this._listeners.size > 0;
  }

  /**
   * Subscribes to native updates of this node's value, so that listeners keep
   * firing for natively driven animations. No-op for nodes that are not backed
   * by a native "value" node.
   */
  __ensureUpdateSubscriptionExists(): void {
    if (!this.__isNativeValueNode || this.__updateSubscription != null) {
      return;
    }
    const nativeTag = this.__getNativeTag();
    NativeAnimatedHelper.API.startListeningToAnimatedNodeValue(nativeTag);
    const subscription: EventSubscription =
      NativeAnimatedHelper.nativeEventEmitter.addListener(
        'onAnimatedValueUpdate',
        data => {
          if (data.tag === nativeTag) {
            this.__onAnimatedValueUpdateReceived(data.value, data.offset);
          }
        },
      );

    this.__updateSubscription = {
      remove: () => {
        // Only this function assigns to `this.__updateSubscription`.
        if (this.__updateSubscription == null) {
          return;
        }
        this.__updateSubscription = null;
        subscription.remove();
        NativeAnimatedHelper.API.stopListeningToAnimatedNodeValue(nativeTag);
      },
    };
  }

  // NOTE: `offset` is omitted by backends that do not track one separately
  // (e.g. the C++ backend), in which case it is already folded into `value`.
  __onAnimatedValueUpdateReceived(value: number, offset?: ?number): void {
    this.__callListeners(value + (offset ?? 0));
  }

  __callListeners(value: number): void {
    const event = {value};
    this._listeners.forEach(listener => {
      listener(event);
    });
  }

  __getNativeTag(): number {
    let nativeTag = this.__nativeTag;
    if (nativeTag == null) {
      _assertNativeAnimatedModule?.();

      // `__isNative` is initialized as false and only ever set to true. So we
      // only need to check it once here when initializing `__nativeTag`.
      invariant(
        this.__isNative,
        'Attempt to get native tag from node not marked as "native"',
      );

      nativeTag = NativeAnimatedHelper.generateNewNodeTag();
      this.__nativeTag = nativeTag;

      const config = this.__getNativeConfig();
      if (this._platformConfig) {
        config.platformConfig = this._platformConfig;
      }
      if (this.__disableBatchingForNativeCreate) {
        config.disableBatchingForNativeCreate = true;
      }
      NativeAnimatedHelper.API.createAnimatedNode(nativeTag, config);
    }
    return nativeTag;
  }

  __getNativeConfig(): Object {
    throw new Error(
      'This JS animated node type cannot be used as native animated node',
    );
  }

  __getPlatformConfig(): ?PlatformConfig {
    return this._platformConfig;
  }

  __setPlatformConfig(platformConfig: ?PlatformConfig) {
    this._platformConfig = platformConfig;
  }

  /**
   * NOTE: This is intended to prevent `JSON.stringify` from throwing "cyclic
   * structure" errors in React DevTools. Avoid depending on this!
   */
  toJSON(): unknown {
    return this.__getValue();
  }

  __debugID: ?string = undefined;

  __getDebugID(): ?string {
    if (__DEV__) {
      return this.__debugID;
    }
    return undefined;
  }
}
