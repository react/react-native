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

import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {EdgeInsetsProp} from '../StyleSheet/EdgeInsetsPropType';
import type {
  ColorValue,
  ImageStyleProp,
  ViewStyleProp,
} from '../StyleSheet/StyleSheet';
import type {
  LayoutChangeEvent,
  NativeSyntheticEvent,
} from '../Types/CoreEventTypes';
import type {ImageResizeMode} from './ImageResizeMode';
import type {ImageSource, ImageURISource} from './ImageSource';
import type {ImageType} from './ImageTypes.flow';

import * as React from 'react';

export type ImageSourcePropType = ImageSource;

type ImageProgressEventDataIOS = {
  loaded: number,
  total: number,
};

/**
 * @see ImagePropsIOS.onProgress
 */
export type ImageProgressEventIOS = NativeSyntheticEvent<
  Readonly<ImageProgressEventDataIOS>,
>;

type ImageErrorEventData = {
  error: string,
};

export type ImageErrorEvent = NativeSyntheticEvent<
  Readonly<ImageErrorEventData>,
>;

type ImageLoadEventData = {
  source: {
    height: number,
    width: number,
    uri: string,
  },
};

export type ImageLoadEvent = NativeSyntheticEvent<Readonly<ImageLoadEventData>>;

export type ImagePropsIOS = Readonly<{
  /**
   * A static image to display while loading the image source.
   *
   * @platform ios
   */
  defaultSource?: ?ImageSource,

  /**
   * Invoked when a partial load of the image is complete. Definition of what
   * constitutes a "partial load" is loader specific though this is meant for
   * progressive JPEG loads.
   *
   * @platform ios
   */
  onPartialLoad?: ?() => void,

  /**
   * Invoked on download progress.
   *
   * @platform ios
   */
  onProgress?: ?(event: ImageProgressEventIOS) => void,
}>;

export type ImagePropsAndroid = Readonly<{
  /**
   * Resource used to render a loading indicator for the image, displayed
   * until the image is ready to be displayed.
   *
   * @platform android
   */
  loadingIndicatorSource?: ?(number | Readonly<ImageURISource>),

  /**
   * When `true`, enables progressive JPEG streaming.
   *
   * @default `false`
   * @platform android
   */
  progressiveRenderingEnabled?: ?boolean,

  /**
   * Duration of the fade-in animation in milliseconds.
   *
   * @default `300`
   * @platform android
   */
  fadeDuration?: ?number,

  /**
   * The mechanism that should be used to resize the image when the image's
   * dimensions differ from the image view's dimensions.
   *
   * - `auto`: Use heuristics to pick between `resize` and `scale`.
   *
   * - `resize`: A software operation which changes the encoded image in memory
   *   before it gets decoded. This should be used instead of `scale` when the
   *   image is much larger than the view.
   *
   * - `scale`: The image gets drawn downscaled or upscaled. Compared to
   *   `resize`, `scale` is faster (usually hardware accelerated) and produces
   *   higher quality images. This should be used if the image is smaller than
   *   the view. It should also be used if the image is slightly bigger than
   *   the view.
   *
   * - `none`: No sampling is performed and the image is displayed in its full
   *   resolution. This should only be used in rare circumstances because it is
   *   considered unsafe as Android throws a runtime exception when trying to
   *   render images that consume too much memory.
   *
   * @default `'auto'`
   * @platform android
   */
  resizeMethod?: ?('auto' | 'resize' | 'scale' | 'none'),

  /**
   * When `resizeMethod` is set to `resize`, the destination dimensions are
   * multiplied by this value. The `scale` method is used to perform the
   * remainder of the resize. This is used to produce higher quality images
   * when resizing to small dimensions.
   *
   * @default `1.0`
   * @platform android
   */
  resizeMultiplier?: ?number,
}>;

/** @build-types emit-as-interface Expo compatibility */
export type ImagePropsBase = Readonly<{
  ...Omit<ViewProps, 'style'>,

  /**
   * When `true`, indicates the image is an accessibility element.
   */
  accessible?: ?boolean,

  /**
   * Internal prop to set an "Analytics Tag" that can will be set on the Image.
   */
  internal_analyticTag?: ?string,

  /**
   * The text that's read by the screen reader when the user interacts with
   * the image.
   */
  accessibilityLabel?: ?Stringish,

  /**
   * Alias for `accessibilityLabel`.
   */
  'aria-label'?: ?Stringish,

  /**
   * Represents the `nativeID` of the associated label. When the assistive
   * technology focuses on the component with this prop.
   *
   * @platform android
   */
  'aria-labelledby'?: ?string,

  /**
   * Alternative text description of the image, read by the screen reader
   * when the user interacts with it. Automatically marks the element as
   * accessible.
   */
  alt?: ?Stringish,

  /**
   * The blur radius of the blur filter added to the image. On iOS, needs to
   * be more than 5.
   */
  blurRadius?: ?number,

  /**
   * When the image is resized, the corners of the size specified by
   * `capInsets` stay a fixed size, but the center content and borders of
   * the image are stretched. This is useful for creating resizable rounded
   * buttons, shadows, and other resizable assets.
   *
   * @platform ios
   */
  capInsets?: ?EdgeInsetsProp,

  /**
   * CORS mode for fetching the image resource. When unset, the image
   * request is made without the CORS header.
   *
   * @default `'anonymous'`
   */
  crossOrigin?: ?('anonymous' | 'use-credentials'),

  /**
   * Height of the image component.
   */
  height?: number,

  /**
   * Width of the image component.
   */
  width?: number,

  /**
   * Invoked on load error.
   */
  onError?: ?(event: ImageErrorEvent) => void,

  /**
   * Invoked on mount and on layout changes.
   */
  onLayout?: ?(event: LayoutChangeEvent) => unknown,

  /**
   * Invoked when load completes successfully.
   */
  onLoad?: ?(event: ImageLoadEvent) => void,

  /**
   * Invoked when load either succeeds or fails.
   */
  onLoadEnd?: ?() => void,

  /**
   * Invoked on load start.
   */
  onLoadStart?: ?() => void,

  /**
   * The image source (either a remote URL or a local file resource).
   *
   * This prop can also contain several remote URLs, specified together with
   * their width and height and potentially with scale/other URI arguments.
   * The native side then chooses the best URI to display based on the
   * measured size of the image container. A `cache` property can be added to
   * control how networked request interacts with the local cache.
   *
   * The currently supported formats are `png`, `jpg`, `jpeg`, `bmp`, `gif`,
   * `webp` (Android only), and `psd` (iOS only).
   */
  source?: ?ImageSource,

  /**
   * Which referrer to use when fetching the image resource.
   *
   * @default `'strict-origin-when-cross-origin'`
   */
  referrerPolicy?: ?(
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
  ),

  /**
   * Determines how to resize the image when the frame doesn't match the raw
   * image dimensions.
   *
   * - `cover`: Scale the image uniformly (maintain the image's aspect ratio)
   *   so that both dimensions (width and height) of the image are equal to
   *   or larger than the corresponding dimension of the view (minus padding).
   *
   * - `contain`: Scale the image uniformly (maintain the image's aspect
   *   ratio) so that both dimensions (width and height) of the image are
   *   equal to or less than the corresponding dimension of the view (minus
   *   padding).
   *
   * - `stretch`: Scale width and height independently. This may change the
   *   aspect ratio of the source.
   *
   * - `repeat`: Repeat the image to cover the frame of the view. The image
   *   keeps its size and aspect ratio (iOS only).
   *
   * - `center`: Scale the image down so that it is completely visible, if
   *   bigger than the area of the view. The image is not scaled up.
   *
   * - `none`: Do not resize the image. The image is displayed at its
   *   intrinsic size.
   *
   * @default `'cover'`
   */
  resizeMode?: ?ImageResizeMode,

  testID?: ?string,

  /**
   * Changes the color of all non-transparent pixels to the `tintColor`.
   */
  tintColor?: ColorValue,

  /**
   * A remote URL string for the image resource. Takes precedence over
   * `source`.
   */
  src?: ?string,

  /**
   * Comma-separated list of candidate image sources with pixel density
   * descriptors.
   */
  srcSet?: ?string,

  children?: empty,
}>;

export type ImageProps = Readonly<{
  ...ImagePropsIOS,
  ...ImagePropsAndroid,
  ...ImagePropsBase,

  /**
   * Style applied to the `Image` component.
   */
  style?: ?ImageStyleProp,
}>;

/** @build-types emit-as-interface Uniwind compatibility */
export type ImageBackgroundProps = Readonly<{
  ...ImageProps,
  children?: React.Node,

  /**
   * Style applied to the outer `View` wrapper. Accepts `ViewStyle` props
   * rather than `ImageStyle` props.
   */
  style?: ?ViewStyleProp,

  /**
   * Style applied to the inner `Image` component.
   */
  imageStyle?: ?ImageStyleProp,

  /**
   * A ref setter assigned the element node of the inner `Image` component
   * when mounted.
   */
  imageRef?: React.RefSetter<React.ElementRef<ImageType>>,
}>;
