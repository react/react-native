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

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {Component, createRef, memo, useEffect, useMemo, useState} from 'react';
import {Animated, Easing, View, useAnimatedValue} from 'react-native';

// marginLeft (and the other margin props) are only on the native animated
// allowlist when the shared backend is enabled. This verifies the prop is
// supported natively out of the box under useSharedAnimatedBackend.
test('animate marginLeft layout prop', () => {
  const viewRef = createRef<HostInstance>();

  let _animatedMarginLeft;
  let _marginLeftAnimation;

  function MyApp() {
    const animatedMarginLeft = useAnimatedValue(0);
    _animatedMarginLeft = animatedMarginLeft;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: 100,
            marginLeft: animatedMarginLeft,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _marginLeftAnimation = Animated.timing(_animatedMarginLeft, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(100);

  expect(root.getRenderedOutput({props: ['marginLeft']}).toJSX()).toEqual(
    <rn-view marginLeft="50" />,
  );

  Fantom.unstable_produceFramesForDuration(100);

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _marginLeftAnimation?.stop();
  });

  expect(root.getRenderedOutput({props: ['marginLeft']}).toJSX()).toEqual(
    <rn-view marginLeft="100" />,
  );
});

test('non-layout props stay on the direct path while another view animates layout', () => {
  const movingRef = createRef<HostInstance>();

  let _translateX;
  let _translateXAnimation;
  let _siblingHeight;
  let _siblingHeightAnimation;

  function MyApp() {
    const translateX = useAnimatedValue(0);
    const siblingHeight = useAnimatedValue(10);
    _translateX = translateX;
    _siblingHeight = siblingHeight;
    return (
      <View collapsable={false}>
        <Animated.View
          ref={movingRef}
          style={{width: 100, height: 100, transform: [{translateX}]}}
        />
        <Animated.View style={{width: 100, height: siblingHeight}} />
      </View>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _translateXAnimation = Animated.timing(_translateX, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start();
    _siblingHeightAnimation = Animated.timing(_siblingHeight, {
      toValue: 110,
      duration: 200,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(100);

  // The sibling's height went through a commit; the transform did not.
  expect(root.getRenderedOutput({props: ['height']}).toJSX()).toEqual(
    <rn-view>
      <rn-view key={0} height="100" />
      <rn-view key={1} height="60" />
    </rn-view>,
  );
  expect(
    Fantom.unstable_getDirectManipulationProps(nullthrows(movingRef.current))
      .transform,
  ).toEqual([{translateX: 50}]);

  Fantom.runTask(() => {
    _translateXAnimation?.stop();
    _siblingHeightAnimation?.stop();
  });
});

test('direct-path props survive a re-render while another view animates layout', () => {
  let _opacity;
  let _opacityAnimation;
  let _siblingHeight;
  let _siblingHeightAnimation;
  let _setWidth;

  function MyApp() {
    const opacity = useAnimatedValue(0);
    const siblingHeight = useAnimatedValue(10);
    const [width, setWidth] = useState(100);
    _opacity = opacity;
    _siblingHeight = siblingHeight;
    _setWidth = setWidth;
    return (
      <View collapsable={false}>
        <Animated.View style={{width, height: 100, opacity}} />
        <Animated.View style={{width: 100, height: siblingHeight}} />
      </View>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _opacityAnimation = Animated.timing(_opacity, {
      toValue: 0.5,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    _siblingHeightAnimation = Animated.timing(_siblingHeight, {
      toValue: 110,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500);

  Fantom.runTask(() => {
    _setWidth(150);
  });

  expect(
    root.getRenderedOutput({props: ['opacity', 'width', 'height']}).toJSX(),
  ).toEqual(
    <rn-view>
      <rn-view key={0} opacity="0.25" width="150" height="100" />
      <rn-view key={1} width="100" height="60" />
    </rn-view>,
  );

  Fantom.runTask(() => {
    _opacityAnimation?.stop();
    _siblingHeightAnimation?.stop();
  });
});

test('a view keeps writing its props directly after it starts animating layout', () => {
  const viewRef = createRef<HostInstance>();

  let _opacity;
  let _opacityAnimation;
  let _height;
  let _heightAnimation;

  function MyApp() {
    const opacity = useAnimatedValue(0);
    const height = useAnimatedValue(10);
    _opacity = opacity;
    _height = height;
    return (
      <Animated.View ref={viewRef} style={{width: 100, height, opacity}} />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  Fantom.runTask(() => {
    _opacityAnimation = Animated.timing(_opacity, {
      toValue: 0.5,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500);

  expect(
    Fantom.unstable_getDirectManipulationProps(viewElement).opacity,
  ).toBeCloseTo(0.25, 0.001);

  Fantom.runTask(() => {
    _heightAnimation = Animated.timing(_height, {
      toValue: 110,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(250);

  expect(root.getRenderedOutput({props: ['height']}).toJSX()).toEqual(
    <rn-view height="35" />,
  );
  expect(
    Fantom.unstable_getDirectManipulationProps(viewElement).opacity,
  ).toBeCloseTo(0.375, 0.001);

  Fantom.runTask(() => {
    _opacityAnimation?.stop();
    _heightAnimation?.stop();
  });
});

test('animated opacity', () => {
  let _opacity;
  let _opacityAnimation;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const opacity = useAnimatedValue(1);
    _opacity = opacity;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: 100,
            opacity: opacity,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  expect(viewElement.getBoundingClientRect().x).toBe(0);

  Fantom.runTask(() => {
    _opacityAnimation = Animated.timing(_opacity, {
      toValue: 0,
      duration: 30,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(30);
  expect(Fantom.unstable_getDirectManipulationProps(viewElement).opacity).toBe(
    0,
  );

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _opacityAnimation?.stop();
  });

  expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
    <rn-view opacity="0" />,
  );
});

// ScrollView's ref is the host instance, so it resolves directly (sanity check
// that the fix doesn't regress it).
test('animated opacity on Animated.ScrollView', () => {
  let _opacity;
  let _opacityAnimation;

  function MyApp() {
    const opacity = useAnimatedValue(1);
    _opacity = opacity;
    return (
      <Animated.ScrollView style={{opacity}}>
        <View style={{width: 100, height: 100}} />
      </Animated.ScrollView>
    );
  }

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _opacityAnimation = Animated.timing(_opacity, {
      toValue: 0,
      duration: 30,
      useNativeDriver: true,
    }).start();
  });
  Fantom.unstable_produceFramesForDuration(30);
  Fantom.runTask(() => {
    _opacityAnimation?.stop();
  });

  expect(
    JSON.stringify(root.getRenderedOutput({props: ['opacity']}).toJSON()),
  ).toContain('"opacity":"0"');
});

test('animated opacity on Animated.FlatList', () => {
  let _opacity;
  let _opacityAnimation;

  function MyApp() {
    const opacity = useAnimatedValue(1);
    _opacity = opacity;
    return (
      <Animated.FlatList
        data={[] as Array<string>}
        renderItem={() => null}
        style={{opacity}}
      />
    );
  }

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _opacityAnimation = Animated.timing(_opacity, {
      toValue: 0,
      duration: 30,
      useNativeDriver: true,
    }).start();
  });
  Fantom.unstable_produceFramesForDuration(30);
  Fantom.runTask(() => {
    _opacityAnimation?.stop();
  });

  expect(
    JSON.stringify(root.getRenderedOutput({props: ['opacity']}).toJSON()),
  ).toContain('"opacity":"0"');
});

// A class composite uses the findShadowNodeByTag fallback path in #connectShadowNode.
test('animated opacity on a class composite wrapping a host', () => {
  let _opacity;
  let _opacityAnimation;

  class HostWrapper extends Component<{style?: $FlowFixMe}> {
    render(): React.Node {
      return <View style={this.props.style} />;
    }
  }
  const AnimatedHostWrapper = Animated.createAnimatedComponent(HostWrapper);

  function MyApp() {
    const opacity = useAnimatedValue(1);
    _opacity = opacity;
    return <AnimatedHostWrapper style={{width: 100, height: 100, opacity}} />;
  }

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _opacityAnimation = Animated.timing(_opacity, {
      toValue: 0,
      duration: 30,
      useNativeDriver: true,
    }).start();
  });
  Fantom.unstable_produceFramesForDuration(30);
  Fantom.runTask(() => {
    _opacityAnimation?.stop();
  });

  expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
    <rn-view opacity="0" />,
  );
});

test('animate layout props', () => {
  const viewRef = createRef<HostInstance>();

  let _animatedHeight;
  let _heightAnimation;

  function MyApp() {
    const animatedHeight = useAnimatedValue(0);
    _animatedHeight = animatedHeight;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: animatedHeight,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _heightAnimation = Animated.timing(_animatedHeight, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(100);

  // TODO: getFabricUpdateProps is not working with the cloneMutliple method
  // expect(Fantom.unstable_getFabricUpdateProps(viewElement).height).toBe(100);
  expect(root.getRenderedOutput({props: ['height']}).toJSX()).toEqual(
    <rn-view height="50" />,
  );

  Fantom.unstable_produceFramesForDuration(100);

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _heightAnimation?.stop();
  });

  expect(root.getRenderedOutput({props: ['height']}).toJSX()).toEqual(
    <rn-view height="100" />,
  );
});

test('animate layout props and rerender', () => {
  const viewRef = createRef<HostInstance>();

  let _animatedHeight;
  let _heightAnimation;
  let _setWidth;

  function MyApp() {
    const animatedHeight = useAnimatedValue(0);
    const [width, setWidth] = useState(100);
    _animatedHeight = animatedHeight;
    _setWidth = setWidth;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: width,
            height: animatedHeight,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _heightAnimation = Animated.timing(_animatedHeight, {
      toValue: 100,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500);
  expect(root.getRenderedOutput({props: ['height', 'width']}).toJSX()).toEqual(
    <rn-view height="50" width="100" />,
  );

  Fantom.runTask(() => {
    _setWidth(200);
  });

  // TODO: getFabricUpdateProps is not working with the cloneMutliple method
  // expect(Fantom.unstable_getFabricUpdateProps(viewElement).height).toBe(50);
  expect(root.getRenderedOutput({props: ['height', 'width']}).toJSX()).toEqual(
    <rn-view height="50" width="200" />,
  );

  Fantom.unstable_produceFramesForDuration(500);

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _heightAnimation?.stop();
  });

  expect(root.getRenderedOutput({props: ['height', 'width']}).toJSX()).toEqual(
    <rn-view height="100" width="200" />,
  );

  Fantom.runTask(() => {
    _setWidth(300);
  });

  expect(root.getRenderedOutput({props: ['height', 'width']}).toJSX()).toEqual(
    <rn-view height="100" width="300" />,
  );
});

test('animate non-layout props and rerender', () => {
  const viewRef = createRef<HostInstance>();

  let _animatedOpacity;
  let _opacityAnimation;
  let _setWidth;

  function MyApp() {
    const animatedOpacity = useAnimatedValue(0);
    const [width, setWidth] = useState(100);
    _animatedOpacity = animatedOpacity;
    _setWidth = setWidth;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: width,
            opacity: animatedOpacity,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  Fantom.runTask(() => {
    _opacityAnimation = Animated.timing(_animatedOpacity, {
      toValue: 0.5,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500);

  // TODO: rendered output should be <rn-view opacity="0,5" width="100" /> at this point, but synchronous updates are not captured by fantom
  expect(root.getRenderedOutput({props: ['width']}).toJSX()).toEqual(
    <rn-view width="100" />,
  );

  expect(
    Fantom.unstable_getDirectManipulationProps(viewElement).opacity,
  ).toBeCloseTo(0.25, 0.001);

  // Re-render
  Fantom.runTask(() => {
    _setWidth(150);
  });

  expect(root.getRenderedOutput({props: ['opacity', 'width']}).toJSX()).toEqual(
    <rn-view opacity="0.25" width="150" />,
  );

  Fantom.runTask(() => {
    _setWidth(200);
  });

  // TODO: getFabricUpdateProps is not working with the cloneMutliple method
  // expect(Fantom.unstable_getFabricUpdateProps(viewElement).height).toBe(50);
  expect(root.getRenderedOutput({props: ['opacity', 'width']}).toJSX()).toEqual(
    <rn-view opacity="0.25" width="200" />,
  );

  Fantom.unstable_produceFramesForDuration(500);

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _opacityAnimation?.stop();
  });

  // TODO: T246961305 rendered output should be <rn-view opacity="1" /> at this point
  expect(root.getRenderedOutput({props: ['width']}).toJSX()).toEqual(
    <rn-view width="200" />,
  );

  expect(Fantom.unstable_getDirectManipulationProps(viewElement).opacity).toBe(
    0.5,
  );

  // Re-render
  Fantom.runTask(() => {
    _setWidth(300);
  });

  expect(root.getRenderedOutput({props: ['opacity', 'width']}).toJSX()).toEqual(
    <rn-view opacity="0.5" width="300" />,
  );
});

test('animate layout props and rerender in many components', () => {
  const viewRef = createRef<HostInstance>();

  let _animatedHeight;
  let _heightAnimation;
  let _setWidth;
  const N = 100;

  function AnimatedComponent() {
    const animatedHeight = useAnimatedValue(0);

    useEffect(() => {
      Animated.timing(animatedHeight, {
        toValue: 100,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    });
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: animatedHeight,
          },
        ]}
      />
    );
  }

  function MyApp() {
    const animatedHeight = useAnimatedValue(0);
    const [width, setWidth] = useState(100);
    _animatedHeight = animatedHeight;
    _setWidth = setWidth;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: width,
            height: animatedHeight,
          },
        ]}>
        {Array.from({length: N}, (_, i) => (
          <AnimatedComponent key={i} />
        ))}
      </Animated.View>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _heightAnimation = Animated.timing(_animatedHeight, {
      toValue: 100,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500);
  expect(root.getRenderedOutput({props: ['height', 'width']}).toJSX()).toEqual(
    <rn-view height="50" width="100">
      {Array.from({length: N}, (_, i) => (
        <rn-view key={i} height="50" width="100" />
      ))}
    </rn-view>,
  );

  Fantom.runTask(() => {
    _setWidth(200);
  });

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _heightAnimation?.stop();
  });

  // TODO: getFabricUpdateProps is not working with the cloneMutliple method
  // expect(Fantom.unstable_getFabricUpdateProps(viewElement).height).toBe(50);
  expect(root.getRenderedOutput({props: ['height', 'width']}).toJSX()).toEqual(
    <rn-view height="50" width="200">
      {Array.from({length: N}, (_, i) => (
        <rn-view key={i} height="50" width="100" />
      ))}
    </rn-view>,
  );
});

test('animate width, height and opacity at once', () => {
  const viewRef = createRef<HostInstance>();

  let _animatedWidth;
  let _animatedHeight;
  let _animatedOpacity;
  let _parallelAnimation;

  function MyApp() {
    const animatedWidth = useAnimatedValue(100);
    const animatedHeight = useAnimatedValue(100);
    const animatedOpacity = useAnimatedValue(1);
    _animatedWidth = animatedWidth;
    _animatedHeight = animatedHeight;
    _animatedOpacity = animatedOpacity;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: animatedWidth,
            height: animatedHeight,
            opacity: animatedOpacity,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _parallelAnimation = Animated.parallel([
      Animated.timing(_animatedWidth, {
        toValue: 200,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(_animatedHeight, {
        toValue: 200,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(_animatedOpacity, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  });

  Fantom.unstable_produceFramesForDuration(100);

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _parallelAnimation?.stop();
  });

  expect(
    root.getRenderedOutput({props: ['width', 'height', 'opacity']}).toJSX(),
  ).toEqual(<rn-view height="200" opacity="0.5" width="200" />);
});

test('animate width with memo and rerender (js sync test)', () => {
  const viewRef = createRef<HostInstance>();

  let _widthAnimation;
  let _setState;

  function useAnimation() {
    const animatedValue = useAnimatedValue(100);

    useEffect(() => {
      const animation = Animated.timing(animatedValue, {
        toValue: 200,
        duration: 1000,
        useNativeDriver: true,
      });
      _widthAnimation = animation;
      animation.start();

      return () => {
        animation.stop();
      };
    }, [animatedValue]);

    return animatedValue;
  }

  const AnimatedComponent = memo(() => {
    const animatedValue = useAnimation();

    const animatedStyle = useMemo(() => {
      return {
        width: animatedValue,
      };
    }, [animatedValue]);

    return (
      <Animated.View
        ref={viewRef}
        style={[{backgroundColor: 'green', height: 100}, animatedStyle]}
      />
    );
  });

  function MyApp() {
    const [state, setState] = useState(0);
    _setState = setState;

    return (
      <>
        <View key={state} />
        <AnimatedComponent />
      </>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  expect(root.getRenderedOutput({props: ['width', 'height']}).toJSX()).toEqual(
    <rn-view height="100" width="100" />,
  );

  Fantom.unstable_produceFramesForDuration(1000);

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _widthAnimation?.stop();
  });

  expect(root.getRenderedOutput({props: ['width']}).toJSX()).toEqual(
    <rn-view width="200" />,
  );

  // Trigger rerender after animation completes to see if animation state gets overwritten
  Fantom.runTask(() => {
    _setState(s => 1 - s);
  });

  expect(root.getRenderedOutput({props: ['width']}).toJSX()).toEqual(
    <rn-view width="200" />,
  );
});
