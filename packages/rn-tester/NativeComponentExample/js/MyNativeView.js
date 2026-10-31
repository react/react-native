/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {MyLegacyViewType} from './MyLegacyViewNativeComponent';
import type {MyNativeViewType} from './MyNativeViewNativeComponent';
import type {ColorValue} from 'react-native';

import RNTMyLegacyNativeView from './MyLegacyViewNativeComponent';
import {
  callNativeMethodToAddOverlays,
  callNativeMethodToChangeBackgroundColor,
  callNativeMethodToRemoveOverlays,
} from './MyLegacyViewNativeComponent';
import RNTMyNativeView, {
  Commands as RNTMyNativeViewCommands,
} from './MyNativeViewNativeComponent';
import * as React from 'react';
import {useRef, useState} from 'react';
import {Button, Platform, Text, UIManager, View} from 'react-native';

const colors = [
  '#0000FF',
  '#FF0000',
  '#00FF00',
  '#003300',
  '#330000',
  '#000033',
];

const legacyColors: ReadonlyArray<ColorValue> = [
  'rgb(255, 255, 255)',
  'hsl(240, 100%, 50%)',
  'steelblue',
];

const cornerRadiuses = [0, 20, 40, 60, 80, 100, 120];

class HSBA {
  hue: number;
  saturation: number;
  brightness: number;
  alpha: number;

  constructor(
    hue: number = 0.0,
    saturation: number = 0.0,
    brightness: number = 0.0,
    alpha: number = 0.0,
  ) {
    this.hue = hue;
    this.saturation = saturation;
    this.brightness = brightness;
    this.alpha = alpha;
  }

  toString(): string {
    return `h: ${this.hue}, s: ${this.saturation}, b: ${this.brightness}, a: ${this.alpha}`;
  }
}

function beautify(number: number): string {
  if (number % 1 === 0) {
    return number.toFixed();
  }
  return number.toFixed(2);
}

type MeasureStruct = {
  x: number,
  y: number,
  width: number,
  height: number,
};

const MeasureStructZero: MeasureStruct = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

function getTextFor(measureStruct: MeasureStruct): string {
  return `x: ${beautify(measureStruct.x)}, y: ${beautify(
    measureStruct.y,
  )}, width: ${beautify(measureStruct.width)}, height: ${beautify(
    measureStruct.height,
  )}`;
}
const opacityDecrementCounter = 0.2;

function computeNextOpacity(opacity: number): number {
  if (parseFloat(opacity.toFixed(1)) > 0.0) {
    return opacity - opacityDecrementCounter;
  }
  return 1.0;
}

// This is an example component that migrates to use the new architecture.
export default function MyNativeView(props: {}): React.Node {
  const containerRef = useRef<React.ElementRef<typeof View> | null>(null);
  const ref = useRef<React.ElementRef<MyNativeViewType> | null>(null);
  const legacyRef = useRef<React.ElementRef<MyLegacyViewType> | null>(null);
  const [currentBGColor, setCurrentBGColor] = useState<number>(0);
  const [legacyColorIndex, setLegacyColorIndex] = useState<?number>(null);
  const [opacity, setOpacity] = useState(1.0);
  const [arrayValues, setArrayValues] = useState([1, 2, 3]);
  const [hsba, setHsba] = useState<HSBA>(new HSBA());
  const [cornerRadiusIndex, setCornerRadiusIndex] = useState<number>(0);
  const [legacyMeasure, setLegacyMeasure] =
    useState<MeasureStruct>(MeasureStructZero);
  const [legacyMeasureInWindow, setLegacyMeasureInWindow] =
    useState<MeasureStruct>(MeasureStructZero);
  const [legacyMeasureLayout, setLegacyMeasureLayout] =
    useState<MeasureStruct>(MeasureStructZero);
  const [legacyStyleEventCount, setLegacyStyleEventCount] = useState<number>(0);

  return (
    <View ref={containerRef} style={{flex: 1}}>
      <Text style={{color: 'red'}}>Fabric View</Text>
      <RNTMyNativeView
        ref={ref}
        style={{flex: 1}}
        opacity={opacity}
        values={arrayValues}
        onIntArrayChanged={event => {
          console.log(event.nativeEvent.values);
          console.log(event.nativeEvent.boolValues);
          console.log(event.nativeEvent.floats);
          console.log(event.nativeEvent.doubles);
          console.log(event.nativeEvent.yesNos);
          console.log(event.nativeEvent.strings);
          console.log(event.nativeEvent.latLons);
          console.log(event.nativeEvent.multiArrays);
        }}
        onLegacyStyleEvent={event => {
          setLegacyStyleEventCount(prevCount => prevCount + 1);
          console.log(event.nativeEvent.string);
        }}
      />
      <Text style={{color: 'red'}}>Legacy View</Text>
      <RNTMyLegacyNativeView
        ref={legacyRef}
        style={{flex: 1}}
        opacity={opacity}
        color={
          legacyColorIndex == null ? undefined : legacyColors[legacyColorIndex]
        }
        onColorChanged={event => {
          const normalizedHue =
            Platform.OS === 'android'
              ? event.nativeEvent.backgroundColor.hue
              : event.nativeEvent.backgroundColor.hue * 360;
          const normalizedAlpha =
            Platform.OS === 'android'
              ? event.nativeEvent.backgroundColor.alpha
              : event.nativeEvent.backgroundColor.alpha * 255;
          setHsba(
            new HSBA(
              normalizedHue,
              event.nativeEvent.backgroundColor.saturation,
              event.nativeEvent.backgroundColor.brightness,
              normalizedAlpha,
            ),
          );
        }}
      />
      <Text style={{color: 'green', textAlign: 'center'}}>
        HSBA: {hsba.toString()}
      </Text>
      <Text style={{color: 'green', textAlign: 'center'}}>
        Constants From Interop Layer:{' '}
        {UIManager.getViewManagerConfig('RNTMyLegacyNativeView').Constants.PI}
      </Text>
      <Text style={{color: 'green', textAlign: 'center'}}>
        Opacity: {opacity.toFixed(1)}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
        <Button
          title="Change Background"
          onPress={() => {
            let nextBGColor =
              currentBGColor + 1 >= colors.length ? 0 : currentBGColor + 1;
            let newColor = colors[nextBGColor];
            RNTMyNativeViewCommands.callNativeMethodToChangeBackgroundColor(
              // $FlowFixMe[incompatible-type]
              ref.current,
              newColor,
            );

            callNativeMethodToChangeBackgroundColor(
              legacyRef.current,
              newColor,
            );
            setCurrentBGColor(nextBGColor);
          }}
        />
        <Button
          title="Set Color Prop"
          onPress={() => {
            setLegacyColorIndex(
              legacyColorIndex == null ||
                legacyColorIndex + 1 >= legacyColors.length
                ? 0
                : legacyColorIndex + 1,
            );
          }}
        />
        <Button
          title="Set Opacity"
          onPress={() => {
            setOpacity(computeNextOpacity(opacity));
            setArrayValues([
              Math.floor(Math.random() * 100),
              Math.floor(Math.random() * 100),
              Math.floor(Math.random() * 100),
            ]);
          }}
        />
        <Button
          title="Add Overlays"
          onPress={() => {
            let randomColorId = Math.floor(Math.random() * 5);
            let overlayColors = [
              colors[randomColorId],
              colors[(randomColorId + 1) % 5],
            ];
            RNTMyNativeViewCommands.callNativeMethodToAddOverlays(
              // $FlowFixMe[incompatible-type]
              ref.current,
              overlayColors,
            );
            callNativeMethodToAddOverlays(legacyRef.current, overlayColors);
          }}
        />
        <Button
          title="Remove Overlays"
          onPress={() => {
            RNTMyNativeViewCommands.callNativeMethodToRemoveOverlays(
              // $FlowFixMe[incompatible-type]
              ref.current,
            );
            callNativeMethodToRemoveOverlays(legacyRef.current);
          }}
        />
        <Button
          title="Console.log Measure"
          onPress={() => {
            ref.current?.measure((x, y, width, height) => {
              console.log(x, y, width, height);
            });

            legacyRef.current?.measure((x, y, width, height) => {
              setLegacyMeasure({x, y, width, height});
            });
            legacyRef.current?.measureInWindow((x, y, width, height) => {
              setLegacyMeasureInWindow({x, y, width, height});
            });

            if (containerRef.current) {
              legacyRef.current?.measureLayout(
                // $FlowFixMe[incompatible-call]
                containerRef.current,
                (x, y, width, height) => {
                  setLegacyMeasureLayout({x, y, width, height});
                },
              );
            }
          }}
        />
        <Button
          title="Test setNativeProps"
          onPress={() => {
            const newCRIndex =
              cornerRadiusIndex + 1 >= cornerRadiuses.length
                ? 0
                : cornerRadiusIndex + 1;
            setCornerRadiusIndex(newCRIndex);
            legacyRef.current?.setNativeProps({
              cornerRadius: cornerRadiuses[newCRIndex],
            });
          }}
        />
      </View>
      <Text style={{color: 'green', textAlign: 'center'}}>
        &gt; Interop Layer Measurements &lt;
      </Text>
      <Text style={{color: 'green', textAlign: 'center'}}>
        measure {getTextFor(legacyMeasure)}
      </Text>
      <Text style={{color: 'green', textAlign: 'center'}}>
        InWindow {getTextFor(legacyMeasureInWindow)}
      </Text>
      <Text style={{color: 'green', textAlign: 'center'}}>
        InLayout {getTextFor(legacyMeasureLayout)}
      </Text>
      <Button
        title="Fire Legacy Style Event"
        onPress={() => {
          RNTMyNativeViewCommands.fireLagacyStyleEvent(
            // $FlowFixMe[incompatible-type]
            ref.current,
          );
        }}
      />
      <Text style={{color: 'green', textAlign: 'center'}}>
        Legacy Style Event Fired {legacyStyleEventCount} times
      </Text>
    </View>
  );
}
