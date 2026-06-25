/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type AnimatedNode from '../nodes/AnimatedNode';
import type AnimatedValue from '../nodes/AnimatedValue';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import AnimatedProps from '../nodes/AnimatedProps';

export type EndResult = {
  finished: boolean,
  value?: number,
  offset?: number,
  ...
};
export type EndCallback = (result: EndResult) => void;

export type AnimationConfig = Readonly<{
  isInteraction?: boolean,
  useNativeDriver: boolean,
  platformConfig?: PlatformConfig,
  onComplete?: ?EndCallback,
  iterations?: number,
  isLooping?: boolean,
  debugID?: ?string,
  ...
}>;

let startNativeAnimationNextId = 1;

// Important note: start() and stop() will only be called at most once.
// Once an animation has been stopped or finished its course, it will
// not be reused.
export default class Animation {
  _nativeID: ?number;
  _onEnd: ?EndCallback;
  _useNativeDriver: boolean;

  __active: boolean;
  __isInteraction: boolean;
  __isLooping: ?boolean;
  __iterations: number;
  __debugID: ?string;

  constructor(config: AnimationConfig) {
    this._useNativeDriver = NativeAnimatedHelper.shouldUseNativeDriver(config);

    this.__active = false;
    this.__isInteraction = config.isInteraction ?? !this._useNativeDriver;
    this.__isLooping = config.isLooping;
    this.__iterations = config.iterations ?? 1;
    if (__DEV__) {
      this.__debugID = config.debugID;
    }
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
    animatedValue: AnimatedValue,
  ): void {
    // TODO: T274006331 - Remove js-only animation once shared backend is fully rolled out
    if (!this._useNativeDriver && animatedValue.__isNative === true) {
      throw new Error(
        'Attempting to run JS driven animation on animated node ' +
          'that has been moved to "native" earlier by starting an ' +
          'animation with `useNativeDriver: true`',
      );
    }

    this._onEnd = onEnd;
    this.__active = true;
  }

  stop(): void {
    if (this._nativeID != null) {
      const nativeID = this._nativeID;
      const identifier = `${nativeID}:stopAnimation`;
      try {
        // This is only required when singleOpBatching is used, as otherwise
        // we flush calls immediately when there's no pending queue.
        NativeAnimatedHelper.API.setWaitingForIdentifier(identifier);
        NativeAnimatedHelper.API.stopAnimation(nativeID);
      } finally {
        NativeAnimatedHelper.API.unsetWaitingForIdentifier(identifier);
      }
    }
    this.__active = false;
  }

  __getNativeAnimationConfig(): Readonly<{
    platformConfig: ?PlatformConfig,
    ...
  }> {
    // Subclasses that have corresponding animation implementation done in native
    // should override this method
    throw new Error('This animation type cannot be offloaded to native');
  }

  __findAnimatedPropsNodes(node: AnimatedNode): Array<AnimatedProps> {
    const result = [];

    if (node instanceof AnimatedProps) {
      result.push(node);
      return result;
    }

    for (const child of node.__getChildren()) {
      result.push(...this.__findAnimatedPropsNodes(child));
    }

    return result;
  }

  __startAnimationIfNative(animatedValue: AnimatedValue): boolean {
    if (!this._useNativeDriver) {
      return false;
    }

    const startNativeAnimationWaitId = `${startNativeAnimationNextId}:startAnimation`;
    startNativeAnimationNextId += 1;
    NativeAnimatedHelper.API.setWaitingForIdentifier(
      startNativeAnimationWaitId,
    );
    try {
      const config = this.__getNativeAnimationConfig();
      animatedValue.__makeNative(config.platformConfig);
      this._nativeID = NativeAnimatedHelper.generateNewAnimationId();
      NativeAnimatedHelper.API.startAnimatingNode(
        this._nativeID,
        animatedValue.__getNativeTag(),
        config,
        result => {
          // When using natively driven animations, once the animation completes,
          // we need to ensure that the JS side nodes are synced with the updated
          // values.
          const {value, offset} = result;
          const syncBeforeCallback =
            ReactNativeFeatureFlags.animatedShouldSyncValueBeforeStartCallback();
          if (syncBeforeCallback && value != null) {
            animatedValue.__onAnimatedValueUpdateReceived(value, offset);
          }

          this.__notifyAnimationEnd(result);

          if (value != null) {
            if (!syncBeforeCallback) {
              animatedValue.__onAnimatedValueUpdateReceived(value, offset);
            }

            const isJsSyncRemoved =
              ReactNativeFeatureFlags.cxxNativeAnimatedEnabled();
            if (!isJsSyncRemoved) {
              if (this.__isLooping === true) {
                return;
              }
            }

            // Trigger an update on the AnimatedProps nodes to call any
            // registered callbacks now that the JS-side node is in sync.
            this.__findAnimatedPropsNodes(animatedValue).forEach(node =>
              node.update(),
            );
          }
        },
      );

      return true;
    } catch (e: unknown) {
      throw e;
    } finally {
      NativeAnimatedHelper.API.unsetWaitingForIdentifier(
        startNativeAnimationWaitId,
      );
    }
  }

  /**
   * Notify the completion callback that the animation has ended. The completion
   * callback will never be called more than once.
   */
  __notifyAnimationEnd(result: EndResult): void {
    const callback = this._onEnd;
    if (callback != null) {
      this._onEnd = null;
      callback(result);
    }
  }

  __getDebugID(): ?string {
    if (__DEV__) {
      return this.__debugID;
    }
    return undefined;
  }
}
