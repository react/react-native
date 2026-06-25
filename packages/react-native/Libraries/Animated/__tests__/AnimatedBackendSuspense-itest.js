/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags useSharedAnimatedBackend:true updateRuntimeShadowNodeReferencesOnCommitThread:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import {Suspense, startTransition, use} from 'react';
import {Animated, Easing, View, useAnimatedValue} from 'react-native';
import {allowStyleProp} from 'react-native/Libraries/Animated/NativeAnimatedAllowlist';

// --- Shared test utilities ---

function Fallback({nativeID}: {nativeID?: string}) {
  return <View nativeID={nativeID ?? 'suspense-fallback'} />;
}

/**
 * Creates an async data cache backed by manually-resolved promises.
 * Call `cache.resolveNext()` to resolve the pending fetch.
 */
function createDataCache(): {
  SuspendingChild: React.ComponentType<{dataKey: string}>,
  useData: (key: string) => string,
  resolveNext: () => void,
} {
  let resolvePromise: (() => void) | null = null;
  const cache = new Map<string, string>();

  async function getData(key: string): Promise<string> {
    await new Promise(resolve => {
      resolvePromise = resolve;
    });
    return `data-${key}`;
  }

  async function fetchData(key: string): Promise<string> {
    const data = await getData(key);
    cache.set(key, data);
    return data;
  }

  function useData(key: string): string {
    let data = cache.get(key);
    if (data == null) {
      data = use(fetchData(key));
    }
    return data;
  }

  function SuspendingChild(props: {dataKey: string}) {
    return <View nativeID={useData(props.dataKey)} />;
  }

  function resolveNext() {
    expect(resolvePromise).not.toBeNull();
    Fantom.runTask(() => {
      resolvePromise?.();
      resolvePromise = null;
    });
  }

  return {SuspendingChild, useData, resolveNext};
}

// A promise that never resolves - used to freeze components (react-freeze pattern)
// $FlowFixMe[incompatible-exact] - Promise types are inexact
const freezePromise: Promise<void> & {status?: string} = new Promise(() => {});
freezePromise.status = 'pending';

function Freeze(props: {freeze: boolean, children: React.Node}) {
  if (props.freeze) {
    throw freezePromise;
  }
  return props.children;
}

function AnimatedChild({
  onAnimatedWidth,
}: {
  onAnimatedWidth?: (width: Animated.Value) => void,
}) {
  const animatedWidth = useAnimatedValue(0);
  onAnimatedWidth?.(animatedWidth);

  return (
    <Animated.View
      style={{
        width: animatedWidth,
        height: 100,
      }}
      nativeID="animated-child"
    />
  );
}

// --- Tests ---

beforeEach(() => {
  allowStyleProp('width');
});

test('animation state is maintained after Suspense', () => {
  let _animatedWidth;
  let _widthAnimation;
  const {SuspendingChild, resolveNext} = createDataCache();

  function MyApp(props: {dataKey: string}) {
    const animatedWidth = useAnimatedValue(0);
    _animatedWidth = animatedWidth;
    return (
      <Animated.View
        style={[
          {
            width: animatedWidth,
            height: 100,
          },
        ]}>
        <Suspense fallback={<Fallback />}>
          <SuspendingChild dataKey={props.dataKey} />
        </Suspense>
      </Animated.View>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp dataKey="first" />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(
    <rn-view width="0">
      <rn-view nativeID="suspense-fallback" />
    </rn-view>,
  );

  resolveNext();

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(
    <rn-view width="0">
      <rn-view nativeID="data-first" />
    </rn-view>,
  );

  Fantom.runTask(() => {
    _widthAnimation = Animated.timing(_animatedWidth, {
      toValue: 100,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500);

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(
    <rn-view width="50">
      <rn-view nativeID="data-first" />
    </rn-view>,
  );

  // Trigger suspense via transition - stale UI should remain visible
  Fantom.runTask(() => {
    startTransition(() => {
      root.render(<MyApp dataKey="second" />);
    });
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(
    <rn-view width="50">
      <rn-view nativeID="data-first" />
    </rn-view>,
  );

  // Animation continues while suspended
  Fantom.unstable_produceFramesForDuration(250);

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(
    <rn-view width="75">
      <rn-view nativeID="data-first" />
    </rn-view>,
  );

  resolveNext();

  // Animation state is maintained after suspense resolves
  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(
    <rn-view width="75">
      <rn-view nativeID="data-second" />
    </rn-view>,
  );

  Fantom.unstable_produceFramesForDuration(250);

  Fantom.runTask(() => {
    _widthAnimation?.stop();
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(
    <rn-view width="100">
      <rn-view nativeID="data-second" />
    </rn-view>,
  );
});

test('animation continues on animated component during suspenseful transition', () => {
  let _animatedWidth;
  let _widthAnimation;
  const {useData, resolveNext} = createDataCache();

  function AnimatedSuspendingChild(props: {dataKey: string}) {
    const animatedWidth = useAnimatedValue(0);
    _animatedWidth = animatedWidth;
    const data = useData(props.dataKey);

    return (
      <Animated.View
        style={{
          width: animatedWidth,
          height: 100,
        }}
        nativeID={data}
      />
    );
  }

  function MyApp(props: {dataKey: string}) {
    return (
      <Suspense fallback={<Fallback />}>
        <AnimatedSuspendingChild dataKey={props.dataKey} />
      </Suspense>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp dataKey="first" />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="suspense-fallback" />);

  resolveNext();

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="data-first" width="0" />);

  Fantom.runTask(() => {
    _widthAnimation = Animated.timing(_animatedWidth, {
      toValue: 100,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500);

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="data-first" width="50" />);

  // Trigger suspense via transition - stale UI should remain visible
  Fantom.runTask(() => {
    startTransition(() => {
      root.render(<MyApp dataKey="second" />);
    });
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="data-first" width="50" />);

  Fantom.unstable_produceFramesForDuration(250);

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="data-first" width="75" />);

  resolveNext();

  // Animation state is maintained after suspense resolves
  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="data-second" width="75" />);

  Fantom.unstable_produceFramesForDuration(250);

  Fantom.runTask(() => {
    _widthAnimation?.stop();
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="data-second" width="100" />);
});

test('animation continues after component is frozen and unfrozen', () => {
  // This test simulates the react-freeze pattern: a Suspense boundary that throws
  // a never-resolving promise to "freeze" a component (hiding it but keeping it mounted),
  // then stops throwing to "unfreeze" it. The animation should continue seamlessly.

  let _animatedWidth;
  let _widthAnimation;

  function MyApp(props: {frozen: boolean}) {
    return (
      <Suspense fallback={<Fallback nativeID="frozen-fallback" />}>
        <Freeze freeze={props.frozen}>
          <AnimatedChild
            onAnimatedWidth={w => {
              _animatedWidth = w;
            }}
          />
        </Freeze>
      </Suspense>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp frozen={false} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="0" />);

  Fantom.runTask(() => {
    _widthAnimation = Animated.timing(_animatedWidth, {
      toValue: 100,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(250);

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="25" />);

  // Freeze the component - fallback should be shown
  Fantom.runTask(() => {
    root.render(<MyApp frozen={true} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="frozen-fallback" />);

  // Animation continues while frozen
  Fantom.unstable_produceFramesForDuration(250);

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="frozen-fallback" />);

  // Unfreeze - animation state is preserved
  Fantom.runTask(() => {
    root.render(<MyApp frozen={false} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="50" />);

  Fantom.unstable_produceFramesForDuration(500);

  Fantom.runTask(() => {
    _widthAnimation?.stop();
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="100" />);
});

test('animation continues after multiple freeze/unfreeze cycles', () => {
  let _animatedWidth;
  let _widthAnimation;

  function MyApp(props: {frozen: boolean}) {
    return (
      <Suspense fallback={<Fallback nativeID="frozen-fallback" />}>
        <Freeze freeze={props.frozen}>
          <AnimatedChild
            onAnimatedWidth={w => {
              _animatedWidth = w;
            }}
          />
        </Freeze>
      </Suspense>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp frozen={false} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="0" />);

  Fantom.runTask(() => {
    _widthAnimation = Animated.timing(_animatedWidth, {
      toValue: 100,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(200);

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="10" />);

  // First freeze
  Fantom.runTask(() => {
    root.render(<MyApp frozen={true} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="frozen-fallback" />);

  Fantom.unstable_produceFramesForDuration(200);

  // First unfreeze
  Fantom.runTask(() => {
    root.render(<MyApp frozen={false} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="20" />);

  Fantom.unstable_produceFramesForDuration(200);

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="30" />);

  // Second freeze
  Fantom.runTask(() => {
    root.render(<MyApp frozen={true} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="frozen-fallback" />);

  Fantom.unstable_produceFramesForDuration(400);

  // Second unfreeze
  Fantom.runTask(() => {
    root.render(<MyApp frozen={false} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="50" />);

  // Third freeze (quick freeze/unfreeze)
  Fantom.runTask(() => {
    root.render(<MyApp frozen={true} />);
  });

  Fantom.unstable_produceFramesForDuration(100);

  Fantom.runTask(() => {
    root.render(<MyApp frozen={false} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="55" />);

  Fantom.unstable_produceFramesForDuration(900);

  Fantom.runTask(() => {
    _widthAnimation?.stop();
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="100" />);
});

test('animation state is maintained when unfrozen after animation completes', () => {
  let _animatedWidth;
  let _widthAnimation;

  function MyApp(props: {frozen: boolean}) {
    return (
      <Suspense fallback={<Fallback nativeID="frozen-fallback" />}>
        <Freeze freeze={props.frozen}>
          <AnimatedChild
            onAnimatedWidth={w => {
              _animatedWidth = w;
            }}
          />
        </Freeze>
      </Suspense>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp frozen={false} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="0" />);

  Fantom.runTask(() => {
    _widthAnimation = Animated.timing(_animatedWidth, {
      toValue: 100,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(200);

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="20" />);

  // Freeze the component
  Fantom.runTask(() => {
    root.render(<MyApp frozen={true} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="frozen-fallback" />);

  // Animation completes while frozen
  Fantom.unstable_produceFramesForDuration(1000);

  Fantom.runTask(() => {
    _widthAnimation?.stop();
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="frozen-fallback" />);

  // Unfreeze - final animation state is shown
  Fantom.runTask(() => {
    root.render(<MyApp frozen={false} />);
  });

  expect(
    root.getRenderedOutput({props: ['width', 'nativeID']}).toJSX(),
  ).toEqual(<rn-view nativeID="animated-child" width="100" />);
});
