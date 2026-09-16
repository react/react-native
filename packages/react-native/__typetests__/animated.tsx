/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';

import {
  Animated,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  SectionListData,
} from 'react-native';

interface CompProps {
  width: number;
}

class Comp extends React.Component<CompProps> {
  f1: () => boolean = () => true;

  render() {
    const {width} = this.props;
    return <View style={{width}} />;
  }
}

const ForwardComp = React.forwardRef<
  React.ComponentRef<typeof View>,
  CompProps
>(({width}, ref) => {
  function f1(): boolean {
    return true;
  }

  return <View ref={ref} style={{width}} />;
});

type X = React.PropsWithoutRef<React.ComponentProps<typeof ForwardComp>>;

function TestAnimatedAPI() {
  // Value
  const v1 = new Animated.Value(0);
  const v2 = new Animated.Value(0);

  // Ref
  const AnimatedViewRef = React.useRef<React.ComponentRef<typeof View>>(null);

  AnimatedViewRef.current &&
    AnimatedViewRef.current.measure(() => {
      return;
    });

  const AnimatedComp = Animated.createAnimatedComponent(Comp);

  const AnimatedCompRef = React.useRef<React.ComponentRef<typeof Comp>>(null);

  AnimatedCompRef.current && AnimatedCompRef.current.f1();

  const AnimatedForwardComp = Animated.createAnimatedComponent(ForwardComp);

  const AnimatedForwardCompRef =
    React.useRef<React.ComponentRef<typeof ForwardComp>>(null);
  const ForwardCompRef = React.useRef<React.ComponentRef<typeof View>>(null);

  AnimatedForwardCompRef.current &&
    AnimatedForwardCompRef.current.measure(() => {
      return;
    });

  v1.setValue(0.1);

  v1.addListener(e => {
    const n: number = e.value;
  });

  const v200 = v1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const id = v200.addListener(() => {});
  v200.removeListener(id);
  v200.removeAllListeners();
  v200.hasListeners();

  Animated.timing(v2, {
    toValue: v1.interpolate({inputRange: [0, 1], outputRange: [0, 200]}),
    useNativeDriver: false,
  });

  // ValueXY
  const position = new Animated.ValueXY({x: 0, y: 0});

  // Animation functions
  const spring1 = Animated.spring(v1, {
    toValue: 0.5,
    tension: 10,
    delay: 100,
    useNativeDriver: false,
  });

  const springXY = Animated.spring(position, {
    toValue: {
      x: 1,
      y: 2,
    },
    useNativeDriver: false,
  });

  spring1.start();
  spring1.stop();
  spring1.reset();

  Animated.parallel(
    [
      Animated.spring(v1, {toValue: 1, useNativeDriver: false}),
      Animated.spring(v2, {toValue: 1, useNativeDriver: false}),
    ],
    {
      stopTogether: true,
    },
  );

  Animated.decay(v1, {
    velocity: 2,
    useNativeDriver: false,
  });

  Animated.timing(v1, {
    toValue: 1,
    duration: 100,
    delay: 100,
    easing: v => v,
    useNativeDriver: false,
  });

  Animated.add(v1, v2);
  Animated.subtract(v1, v2);
  Animated.divide(v1, v2);
  Animated.multiply(v1, v2);
  Animated.modulo(v1, 2);

  Animated.delay(100);

  Animated.sequence([spring1, springXY]);

  Animated.stagger(100, [spring1, springXY]);

  const listener = (e?: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e) {
      console.warn(e.nativeEvent.contentOffset.y);
    }
  };

  Animated.event([{nativeEvent: {contentOffset: {y: v1}}}], {
    useNativeDriver: true,
    listener,
  });

  const AnimatedView = Animated.createAnimatedComponent(View);
  const ref = React.useRef<React.ComponentRef<typeof View>>(null);
  return (
    <View ref={ref}>
      <Animated.View
        ref={ref}
        style={[
          position.getLayout(),
          {
            opacity: v1,
          },
        ]}
      />
      <AnimatedView ref={ref} style={{top: 3}}>
        i has children
      </AnimatedView>
      <AnimatedComp ref={AnimatedCompRef} width={v1} />
      <ForwardComp ref={ForwardCompRef} width={1} />
      <AnimatedForwardComp ref={AnimatedForwardCompRef} width={10} />
      <Animated.Image
        style={{transform: position.getTranslateTransform()}}
        source={{uri: 'https://picsum.photos/200'}}
      />
      <Animated.View
        testID="expect-type-animated-view"
        style={{opacity: v1}}
        onLayout={event => {
          const x = event.nativeEvent.layout.x; // $ExpectType number
          const y = event.nativeEvent.layout.y; // $ExpectType number
          const width = event.nativeEvent.layout.width; // $ExpectType number
          const height = event.nativeEvent.layout.height; // $ExpectType number
        }}
      />
      ;
      <Animated.FlatList
        testID="expect-type-animated-flatlist"
        style={{opacity: v1}}
        data={[1] as ReadonlyArray<number>}
        renderItem={info => {
          info; // $ExpectType ListRenderItemInfo<number>
          return <View testID={info.item.toFixed(1)} />;
        }}
      />
      ;
      <Animated.SectionList
        testID="expect-type-animated-sectionlist"
        style={{opacity: v1}}
        sections={
          [{title: 'test', data: [1]}] as SectionListData<
            number,
            {title: string}
          >[]
        }
        renderItem={info => {
          /*
           * Original <SectionList> expects:
           * SectionListRenderItemInfo<any>    on TS@3.5,
           * SectionListRenderItemInfo<number> on TS@4.0.
           * Skip until original is adjusted and type can be asserted
           */
          info; // Should expect SectionListRenderItemInfo<number>
          info.section.title; // $ExpectType string
          return <View testID={info.item.toFixed(1)} />;
        }}
      />
      ;
      {/* @ts-expect-error the transform object must contain only one key-value pair */}
      <Animated.View style={{transform: [{scale: 1, translateX: 20}]}} />;
    </View>
  );
}
