/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../src/private/types/HostComponent';
import type {HostInstance} from '../../src/private/types/HostInstance';
import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {PartialViewConfig} from '../Renderer/shims/ReactNativeTypes';
import type {
  ColorValue,
  DangerouslyImpreciseStyle,
  ImageStyleProp,
} from '../StyleSheet/StyleSheet';
import type {ResolvedAssetSource} from './AssetSourceResolver';
import type {ImageProps} from './ImageProps';
import type {ImageSource} from './ImageSource';

import {colorAttribute} from '../Components/View/ReactNativeStyleAttributes';
import * as NativeComponentRegistry from '../NativeComponent/NativeComponentRegistry';
import {ConditionallyIgnoredEventHandlers} from '../NativeComponent/ViewConfigIgnore';
import codegenNativeCommands from '../Utilities/codegenNativeCommands';
import Platform from '../Utilities/Platform';

type ImageHostComponentProps = Readonly<{
  ...ImageProps,
  ...ViewProps,

  style?: ImageStyleProp | DangerouslyImpreciseStyle,

  // iOS native props
  tintColor?: ColorValue,

  // Android native props
  shouldNotifyLoadEvents?: boolean,
  src?: ?ResolvedAssetSource | ?ReadonlyArray<?Readonly<{uri?: ?string, ...}>>,
  headers?: ?{[string]: string},
  defaultSource?: ?ImageSource | ?string,
  loadingIndicatorSrc?: ?string,
}>;

interface NativeCommands {
  readonly setIsVisible_EXPERIMENTAL: (
    viewRef: HostInstance,
    isVisible: boolean,
    time: number,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setIsVisible_EXPERIMENTAL'],
});

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig =
  Platform.OS === 'android'
    ? {
        uiViewClassName: 'RCTImageView',
        bubblingEventTypes: {},
        directEventTypes: {
          topLoadStart: {
            registrationName: 'onLoadStart',
          },
          topProgress: {
            registrationName: 'onProgress',
          },
          topError: {
            registrationName: 'onError',
          },
          topLoad: {
            registrationName: 'onLoad',
          },
          topLoadEnd: {
            registrationName: 'onLoadEnd',
          },
        },
        validAttributes: {
          blurRadius: true,
          defaultSource: true,
          internal_analyticTag: true,
          resizeMethod: true,
          resizeMode: true,
          resizeMultiplier: true,
          tintColor: colorAttribute,
          borderBottomLeftRadius: true,
          borderTopLeftRadius: true,
          src: true,
          // NOTE: New Architecture expects this to be called `source`,
          // regardless of the platform, therefore propagate it as well.
          // For the backwards compatibility reasons, we keep both `src`
          // and `source`, which will be identical at this stage.
          source: true,
          borderRadius: true,
          headers: true,
          shouldNotifyLoadEvents: true,
          overlayColor: colorAttribute,
          borderColor: colorAttribute,
          accessible: true,
          progressiveRenderingEnabled: true,
          fadeDuration: true,
          borderBottomRightRadius: true,
          borderTopRightRadius: true,
          loadingIndicatorSrc: true,
        },
      }
    : {
        uiViewClassName: 'RCTImageView',
        bubblingEventTypes: {},
        directEventTypes: {
          topLoadStart: {
            registrationName: 'onLoadStart',
          },
          topProgress: {
            registrationName: 'onProgress',
          },
          topError: {
            registrationName: 'onError',
          },
          topPartialLoad: {
            registrationName: 'onPartialLoad',
          },
          topLoad: {
            registrationName: 'onLoad',
          },
          topLoadEnd: {
            registrationName: 'onLoadEnd',
          },
        },
        validAttributes: {
          blurRadius: true,
          capInsets: {
            diff: require('../Utilities/differ/insetsDiffer').default,
          },
          defaultSource: {
            process: require('./resolveAssetSource').default,
          },
          internal_analyticTag: true,
          resizeMode: true,
          source: true,
          tintColor: colorAttribute,
          ...ConditionallyIgnoredEventHandlers({
            onLoadStart: true,
            onLoad: true,
            onLoadEnd: true,
            onProgress: true,
            onError: true,
            onPartialLoad: true,
          }),
        },
      };

const ImageViewNativeComponent: HostComponent<ImageHostComponentProps> =
  NativeComponentRegistry.get<ImageHostComponentProps>(
    'RCTImageView',
    () => __INTERNAL_VIEW_CONFIG,
  );

export default ImageViewNativeComponent;
