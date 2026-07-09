/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {NativeSyntheticEvent} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {EdgeInsets, Metrics, Rect} from './SafeAreaViewTypes';

import NativeSafeAreaProvider from '../../../src/private/components/safeareaprovider/specs/SafeAreaProviderNativeComponent';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Dimensions from '../../Utilities/Dimensions';
import * as React from 'react';

export type InsetChangedEvent = NativeSyntheticEvent<Metrics>;

export type SafeAreaProviderProps = Readonly<{
  ...ViewProps,
  children?: React.Node,
  /**
   * Seed insets and frame synchronously so the first frame does not jump.
   * Typically `initialWindowMetrics` from `./InitialWindow`.
   */
  initialMetrics?: ?Metrics,
}>;

export const SafeAreaInsetsContext: React.Context<EdgeInsets | null> =
  React.createContext<EdgeInsets | null>(null);

export const SafeAreaFrameContext: React.Context<Rect | null> =
  React.createContext<Rect | null>(null);

if (__DEV__) {
  SafeAreaInsetsContext.displayName = 'SafeAreaInsetsContext';
  SafeAreaFrameContext.displayName = 'SafeAreaFrameContext';
}

export const SafeAreaProvider: component(
  ref?: React.RefSetter<HostInstance>,
  ...props: SafeAreaProviderProps
) = React.forwardRef<SafeAreaProviderProps, HostInstance>(
  function SafeAreaProvider(props, forwardedRef) {
    const {children, initialMetrics, style, ...others} = props;

    // Inherit from a parent provider so nested providers keep working.
    const parentInsets = React.useContext(SafeAreaInsetsContext);
    const parentFrame = React.useContext(SafeAreaFrameContext);

    const [insets, setInsets] = React.useState<EdgeInsets | null>(
      initialMetrics?.insets ?? parentInsets ?? null,
    );
    const [frame, setFrame] = React.useState<Rect>(
      initialMetrics?.frame ??
        parentFrame ?? {
          x: 0,
          y: 0,
          width: Dimensions.get('window').width,
          height: Dimensions.get('window').height,
        },
    );

    const onInsetsChange = React.useCallback((event: InsetChangedEvent) => {
      const {
        nativeEvent: {frame: nextFrame, insets: nextInsets},
      } = event;

      setFrame(curFrame => {
        if (
          nextFrame != null &&
          (nextFrame.height !== curFrame.height ||
            nextFrame.width !== curFrame.width ||
            nextFrame.x !== curFrame.x ||
            nextFrame.y !== curFrame.y)
        ) {
          return nextFrame;
        }
        return curFrame;
      });

      setInsets(curInsets => {
        if (
          curInsets == null ||
          nextInsets.bottom !== curInsets.bottom ||
          nextInsets.left !== curInsets.left ||
          nextInsets.right !== curInsets.right ||
          nextInsets.top !== curInsets.top
        ) {
          return nextInsets;
        }
        return curInsets;
      });
    }, []);

    return (
      <NativeSafeAreaProvider
        ref={forwardedRef}
        style={[styles.fill, style]}
        onInsetsChange={onInsetsChange}
        {...others}>
        {insets != null ? (
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {children}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        ) : null}
      </NativeSafeAreaProvider>
    );
  },
);

export type SafeAreaListenerProps = Readonly<{
  ...ViewProps,
  children?: React.Node,
  onChange: (data: {insets: EdgeInsets, frame: Rect}) => void,
}>;

/**
 * Observe safe area changes without providing a React context. Useful for
 * imperative consumers (animations, measurements) that do not want to re-render
 * on every inset change.
 */
export function SafeAreaListener(props: SafeAreaListenerProps): React.Node {
  const {onChange, style, children, ...others} = props;
  return (
    <NativeSafeAreaProvider
      {...others}
      style={[styles.fill, style]}
      onInsetsChange={event => {
        onChange({
          insets: event.nativeEvent.insets,
          frame: event.nativeEvent.frame,
        });
      }}>
      {children}
    </NativeSafeAreaProvider>
  );
}

const NO_INSETS_ERROR =
  'No safe area value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app.';

export function useSafeAreaInsets(): EdgeInsets {
  const insets = React.useContext(SafeAreaInsetsContext);
  if (insets == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return insets;
}

export function useSafeAreaFrame(): Rect {
  const frame = React.useContext(SafeAreaFrameContext);
  if (frame == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return frame;
}

export type WithSafeAreaInsetsProps = {
  insets: EdgeInsets,
};

export function withSafeAreaInsets<Props: {...}>(
  WrappedComponent: React.ComponentType<{...Props, +insets: EdgeInsets}>,
): React.ComponentType<Props> {
  return function WithSafeAreaInsets(props: Props): React.Node {
    const insets = useSafeAreaInsets();
    return <WrappedComponent {...props} insets={insets} />;
  };
}

/**
 * @deprecated Use `useSafeAreaInsets` instead.
 */
export function useSafeArea(): EdgeInsets {
  return useSafeAreaInsets();
}

/**
 * @deprecated Use `SafeAreaInsetsContext.Consumer` instead.
 */
export const SafeAreaConsumer: React.ComponentType<
  (value: EdgeInsets | null) => React.Node,
> = SafeAreaInsetsContext.Consumer;

/**
 * @deprecated Use `SafeAreaInsetsContext` instead.
 */
export const SafeAreaContext: React.Context<EdgeInsets | null> =
  SafeAreaInsetsContext;

const styles = StyleSheet.create({
  fill: {flex: 1},
});
