/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import RNTesterText from '../components/RNTesterText';
import * as React from 'react';
import {useState} from 'react';
import {Image, StyleSheet, TouchableHighlight, View} from 'react-native';

const SMALL_FONT_SCALE_INLINE_VIEW_WIDTH = 155;
const SMALL_FONT_SCALE_INLINE_VIEW_HEIGHT = 32;

function Basic(): React.Node {
  return (
    <RNTesterText>
      This text contains an inline blue view{' '}
      <View style={{width: 25, height: 25, backgroundColor: 'steelblue'}} /> and
      an inline image <Image source={require('../assets/flux.png')} />. Neat,
      huh?
    </RNTesterText>
  );
}

function NestedTexts(): React.Node {
  return (
    <View>
      <RNTesterText>This is the first row</RNTesterText>
      <RNTesterText>
        <RNTesterText>
          <RNTesterText>This is a nested text </RNTesterText>
          <View style={{height: 20, width: 20, backgroundColor: 'red'}} />
          <RNTesterText> with a Red View</RNTesterText>
        </RNTesterText>
      </RNTesterText>
    </View>
  );
}

function ClippedByText(): React.Node {
  return (
    <View>
      {/*
       * Inline View
       **/}
      <RNTesterText>
        The{' '}
        <RNTesterText style={{fontWeight: 'bold'}}>inline view</RNTesterText>{' '}
        below is taller than its Text parent and should be clipped.
      </RNTesterText>
      <RNTesterText
        style={{
          overflow: 'hidden',
          width: 150,
          height: 75,
          backgroundColor: 'lightgrey',
        }}>
        This is an inline view
        {/* Render a red border around the steelblue rectangle to make it clear how the inline view is being clipped */}
        <View style={{width: 50, height: 100, backgroundColor: 'red'}}>
          <View
            style={{
              width: 48,
              height: 98,
              left: 1,
              top: 1,
              backgroundColor: 'steelblue',
            }}
          />
        </View>
      </RNTesterText>

      {/*
       * Inline Image
       **/}
      <RNTesterText style={{marginTop: 10}}>
        The{' '}
        <RNTesterText style={{fontWeight: 'bold'}}>inline image</RNTesterText>{' '}
        below is taller than its Text parent and should be clipped.
      </RNTesterText>
      <RNTesterText
        style={{
          overflow: 'hidden',
          width: 175,
          height: 100,
          backgroundColor: 'lightgrey',
        }}>
        This is an inline image
        <Image
          source={{
            uri: 'https://picsum.photos/100',
            width: 50,
            height: 100,
          }}
          style={{
            width: 50,
            height: 100,
          }}
        />
      </RNTesterText>
    </View>
  );
}

function SmallFontScale(): React.Node {
  return (
    <View>
      <RNTesterText>
        The blue inline view should keep its full 155dp width when Android
        system font size is smaller than the default.
      </RNTesterText>
      <View style={styles.smallFontScaleContainer}>
        <RNTesterText
          testID="inline-view-small-font-scale"
          style={styles.smallFontScaleLine}>
          Prefix |{' '}
          <View style={styles.smallFontScaleInlineView}>
            <View style={styles.smallFontScaleInlineViewFill}>
              <RNTesterText style={styles.smallFontScaleInlineViewText}>
                Inline view
              </RNTesterText>
            </View>
          </View>{' '}
          | Suffix
        </RNTesterText>
      </View>
      <View style={styles.smallFontScaleReference}>
        <View style={styles.smallFontScaleReferenceBar} />
        <RNTesterText style={styles.smallFontScaleReferenceText}>
          Expected inline view width: 155dp
        </RNTesterText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  smallFontScaleContainer: {
    backgroundColor: 'lightgrey',
    borderColor: 'darkgrey',
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  smallFontScaleInlineView: {
    height: SMALL_FONT_SCALE_INLINE_VIEW_HEIGHT,
    width: SMALL_FONT_SCALE_INLINE_VIEW_WIDTH,
  },
  smallFontScaleInlineViewFill: {
    alignItems: 'center',
    backgroundColor: 'steelblue',
    borderColor: 'navy',
    borderWidth: 1,
    height: SMALL_FONT_SCALE_INLINE_VIEW_HEIGHT,
    justifyContent: 'center',
    width: SMALL_FONT_SCALE_INLINE_VIEW_WIDTH,
  },
  smallFontScaleInlineViewText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  smallFontScaleLine: {
    fontSize: 16,
  },
  smallFontScaleReference: {
    marginTop: 8,
  },
  smallFontScaleReferenceBar: {
    backgroundColor: 'steelblue',
    height: 4,
    width: SMALL_FONT_SCALE_INLINE_VIEW_WIDTH,
  },
  smallFontScaleReferenceText: {
    fontSize: 12,
    marginTop: 4,
  },
});

function ChangeImageSize(): React.Node {
  const [width, setWidth] = useState(50);
  return (
    <View>
      <TouchableHighlight
        onPress={() => {
          setWidth(width === 50 ? 100 : 50);
        }}>
        <RNTesterText style={{fontSize: 15}}>
          Change Image Width (width={width})
        </RNTesterText>
      </TouchableHighlight>
      <RNTesterText>
        This is an
        <Image
          source={{
            uri: 'https://picsum.photos/50',
            width,
            height: 50,
          }}
          style={{
            width,
            height: 50,
          }}
        />
        inline image
      </RNTesterText>
    </View>
  );
}

function ChangeViewSize(): React.Node {
  const [width, setWidth] = useState(50);
  return (
    <View>
      <TouchableHighlight
        onPress={() => {
          setWidth(width === 50 ? 100 : 50);
        }}>
        <RNTesterText style={{fontSize: 15}}>
          Change View Width (width={width})
        </RNTesterText>
      </TouchableHighlight>
      <RNTesterText>
        This is an
        <View
          style={{
            width,
            height: 50,
            backgroundColor: 'steelblue',
          }}
        />
        inline view
      </RNTesterText>
    </View>
  );
}

function ChangeInnerViewSize(): React.Node {
  const [width, setWidth] = useState(50);
  return (
    <View>
      <TouchableHighlight
        onPress={() => {
          setWidth(width === 50 ? 100 : 50);
        }}>
        {/* When updating `width`, it's important that the only thing that
            changes is the width of the pink inline view. When we do this, we
            demonstrate a bug in RN Android where the pink view doesn't get
            rerendered and remains at its old size. If other things change
            (e.g. we display `width` as text somewhere) it could circumvent
            the bug and cause the pink view to be rerendered at its new size. */}
        <RNTesterText style={{fontSize: 15}}>
          Change Pink View Width
        </RNTesterText>
      </TouchableHighlight>
      <RNTesterText>
        This is an
        <View style={{width: 125, height: 75, backgroundColor: 'steelblue'}}>
          <View
            style={{
              width,
              height: 50,
              backgroundColor: 'pink',
            }}
          />
        </View>
        inline view
      </RNTesterText>
    </View>
  );
}

module.exports = {
  Basic,
  NestedTexts,
  ClippedByText,
  SmallFontScale,
  ChangeImageSize,
  ChangeViewSize,
  ChangeInnerViewSize,
};
