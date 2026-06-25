/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../src/private/types/HostInstance';
import type {ImageBackgroundProps} from './ImageProps';

import View from '../Components/View/View';
import flattenStyle from '../StyleSheet/flattenStyle';
import StyleSheet from '../StyleSheet/StyleSheet';
import Image from './Image';
import * as React from 'react';

export type {ImageBackgroundProps} from './ImageProps';

/**
 * Very simple drop-in replacement for <Image> which supports nesting views.
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, View, ImageBackground, Text } from 'react-native';
 *
 * class DisplayAnImageBackground extends Component {
 *   render() {
 *     return (
 *       <ImageBackground
 *         style={{width: 50, height: 50}}
 *         source={{uri: 'https://reactnative.dev/img/opengraph.png'}}
 *       >
 *         <Text>React</Text>
 *       </ImageBackground>
 *     );
 *   }
 * }
 *
 * // App registration and rendering
 * AppRegistry.registerComponent('DisplayAnImageBackground', () => DisplayAnImageBackground);
 * ```
 */
class ImageBackground extends React.Component<ImageBackgroundProps> {
  setNativeProps(props: {...}) {
    // Work-around flow
    const viewRef = this._viewRef;
    if (viewRef) {
      viewRef.setNativeProps(props);
    }
  }

  _viewRef: ?React.ElementRef<typeof View> = null;

  _captureRef = (ref: null | HostInstance) => {
    this._viewRef = ref;
  };

  render(): React.Node {
    const {
      children,
      style,
      imageStyle,
      imageRef,
      importantForAccessibility,
      ...props
    } = this.props;

    // $FlowFixMe[underconstrained-implicit-instantiation]
    const flattenedStyle = flattenStyle(style);
    return (
      <View
        accessibilityIgnoresInvertColors={true}
        importantForAccessibility={importantForAccessibility}
        style={style}
        ref={this._captureRef}>
        {/* $FlowFixMe[incompatible-use] */}
        <Image
          {...props}
          importantForAccessibility={importantForAccessibility}
          style={[
            StyleSheet.absoluteFill,
            {
              // Temporary Workaround:
              // Current (imperfect yet) implementation of <Image> overwrites width and height styles
              // (which is not quite correct), and these styles conflict with explicitly set styles
              // of <ImageBackground> and with our internal layout model here.
              // So, we have to proxy/reapply these styles explicitly for actual <Image> component.
              // This workaround should be removed after implementing proper support of
              // intrinsic content size of the <Image>.
              // $FlowFixMe[prop-missing]
              width: flattenedStyle?.width,
              // $FlowFixMe[prop-missing]
              height: flattenedStyle?.height,
            },
            imageStyle,
          ]}
          ref={imageRef}
        />
        {children}
      </View>
    );
  }
}

export type ImageBackgroundInstance = ImageBackground;

export default ImageBackground;
