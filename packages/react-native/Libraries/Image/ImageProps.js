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
   * See https://reactnative.dev/docs/image#defaultsource
   */
  defaultSource?: ?ImageSource,
  /**
   * Invoked when a partial load of the image is complete.
   *
   * See https://reactnative.dev/docs/image#onpartialload
   */
  onPartialLoad?: ?() => void,
  /**
   * Invoked on download progress with `{nativeEvent: {loaded, total}}`.
   *
   * See https://reactnative.dev/docs/image#onprogress
   */
  onProgress?: ?(event: ImageProgressEventIOS) => void,
}>;

export type ImagePropsAndroid = Readonly<{
  /**
   * similarly to `source`, this property represents the resource used to render
   * the loading indicator for the image, displayed until image is ready to be
   * displayed, typically after when it got downloaded from network.
   */
  loadingIndicatorSource?: ?(number | Readonly<ImageURISource>),
  progressiveRenderingEnabled?: ?boolean,
  fadeDuration?: ?number,

  /**
   * The mechanism that should be used to resize the image when the image's dimensions
   * differ from the image view's dimensions. Defaults to `auto`.
   *
   * - `auto`: Use heuristics to pick between `resize` and `scale`.
   *
   * - `resize`: A software operation which changes the encoded image in memory before it
   * gets decoded. This should be used instead of `scale` when the image is much larger
   * than the view.
   *
   * - `scale`: The image gets drawn downscaled or upscaled. Compared to `resize`, `scale` is
   * faster (usually hardware accelerated) and produces higher quality images. This
   * should be used if the image is smaller than the view. It should also be used if the
   * image is slightly bigger than the view.
   *
   * - `none`: No sampling is performed and the image is displayed in its full resolution. This
   * should only be used in rare circumstances because it is considered unsafe as Android will
   * throw a runtime exception when trying to render images that consume too much memory.
   *
   * More details about `resize` and `scale` can be found at http://frescolib.org/docs/resizing-rotating.html.
   *
   * @platform android
   */
  resizeMethod?: ?('auto' | 'resize' | 'scale' | 'none'),

  /**
   * When the `resizeMethod` is set to `resize`, the destination dimensions are
   * multiplied by this value. The `scale` method is used to perform the
   * remainder of the resize.
   * This is used to produce higher quality images when resizing to small dimensions.
   * Defaults to 1.0.
   */
  resizeMultiplier?: ?number,
}>;

/** @build-types emit-as-interface Expo compatibility */
export type ImagePropsBase = Readonly<{
  ...Omit<ViewProps, 'style'>,
  /**
   * When true, indicates the image is an accessibility element.
   *
   * See https://reactnative.dev/docs/image#accessible
   */
  accessible?: ?boolean,

  /**
   * Internal prop to set an "Analytics Tag" that can will be set on the Image
   */
  internal_analyticTag?: ?string,

  /**
   * The text that's read by the screen reader when the user interacts with
   * the image.
   *
   * See https://reactnative.dev/docs/image#accessibilitylabel
   */
  accessibilityLabel?: ?Stringish,

  /**
   * Alias for accessibilityLabel
   * See https://reactnative.dev/docs/image#accessibilitylabel
   */
  'aria-label'?: ?Stringish,

  /**
   * Represents the nativeID of the associated label. When the assistive technology focuses on the component with this props.
   *
   * @platform android
   */
  'aria-labelledby'?: ?string,
  /**
   * The text that's read by the screen reader when the user interacts with
   * the image.
   *
   * See https://reactnative.dev/docs/image#alt
   */
  alt?: ?Stringish,

  /**
   * blurRadius: the blur radius of the blur filter added to the image
   *
   * See https://reactnative.dev/docs/image#blurradius
   */
  blurRadius?: ?number,

  /**
   * See https://reactnative.dev/docs/image#capinsets
   */
  capInsets?: ?EdgeInsetsProp,

  /**
   * Adds the CORS related header to the request.
   * Similar to crossorigin from HTML.
   *
   * See https://reactnative.dev/docs/image#crossorigin
   */
  crossOrigin?: ?('anonymous' | 'use-credentials'),

  /**
   * Height of the image component.
   *
   * See https://reactnative.dev/docs/image#height
   */
  height?: number,

  /**
   * Width of the image component.
   *
   * See https://reactnative.dev/docs/image#width
   */
  width?: number,

  /**
   * Invoked on load error with `{nativeEvent: {error}}`.
   *
   * See https://reactnative.dev/docs/image#onerror
   */
  onError?: ?(event: ImageErrorEvent) => void,

  /**
   * onLayout function
   *
   * Invoked on mount and layout changes with
   *
   * {nativeEvent: { layout: {x, y, width, height} }}.
   *
   * See https://reactnative.dev/docs/image#onlayout
   */

  onLayout?: ?(event: LayoutChangeEvent) => unknown,

  /**
   * Invoked when load completes successfully.
   *
   * See https://reactnative.dev/docs/image#onload
   */
  onLoad?: ?(event: ImageLoadEvent) => void,

  /**
   * Invoked when load either succeeds or fails.
   *
   * See https://reactnative.dev/docs/image#onloadend
   */
  onLoadEnd?: ?() => void,

  /**
   * Invoked on load start.
   *
   * See https://reactnative.dev/docs/image#onloadstart
   */
  onLoadStart?: ?() => void,

  /**
   * The image source (either a remote URL or a local file resource).
   *
   * This prop can also contain several remote URLs, specified together with their width and height and potentially with scale/other URI arguments.
   * The native side will then choose the best uri to display based on the measured size of the image container.
   * A cache property can be added to control how networked request interacts with the local cache.
   *
   * The currently supported formats are png, jpg, jpeg, bmp, gif, webp (Android only), psd (iOS only).
   *
   * See https://reactnative.dev/docs/image#source
   */
  source?: ?ImageSource,

  /**
   * A string indicating which referrer to use when fetching the resource.
   * Similar to referrerpolicy from HTML.
   *
   * See https://reactnative.dev/docs/image#referrerpolicy
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
   * 'cover': Scale the image uniformly (maintain the image's aspect ratio)
   * so that both dimensions (width and height) of the image will be equal
   * to or larger than the corresponding dimension of the view (minus padding).
   *
   * 'contain': Scale the image uniformly (maintain the image's aspect ratio)
   * so that both dimensions (width and height) of the image will be equal to
   * or less than the corresponding dimension of the view (minus padding).
   *
   * 'stretch': Scale width and height independently, This may change the
   * aspect ratio of the src.
   *
   * 'repeat': Repeat the image to cover the frame of the view.
   * The image will keep it's size and aspect ratio. (iOS only)
   *
   * 'center': Scale the image down so that it is completely visible,
   * if bigger than the area of the view.
   * The image will not be scaled up.
   *
   * 'none': Do not resize the image. The image will be displayed at its intrinsic size.
   *
   * See https://reactnative.dev/docs/image#resizemode
   */
  resizeMode?: ?ImageResizeMode,

  /**
   * A unique identifier for this element to be used in UI Automation
   * testing scripts.
   *
   * See https://reactnative.dev/docs/image#testid
   */
  testID?: ?string,

  /**
   * Changes the color of all the non-transparent pixels to the tintColor.
   *
   * See https://reactnative.dev/docs/image#tintcolor
   */
  tintColor?: ColorValue,

  /**
   * A string representing the resource identifier for the image. Similar to
   * src from HTML.
   *
   * See https://reactnative.dev/docs/image#src
   */
  src?: ?string,

  /**
   * Similar to srcset from HTML.
   *
   * See https://reactnative.dev/docs/image#srcset
   */
  srcSet?: ?string,
  children?: empty,
}>;

export type ImageProps = Readonly<{
  ...ImagePropsIOS,
  ...ImagePropsAndroid,
  ...ImagePropsBase,

  /**
   * See https://reactnative.dev/docs/image#style
   */
  style?: ?ImageStyleProp,
}>;

/** @build-types emit-as-interface Uniwind compatibility */
export type ImageBackgroundProps = Readonly<{
  ...ImageProps,
  children?: React.Node,

  /**
   * Style applied to the outer View component
   *
   * See https://reactnative.dev/docs/imagebackground#style
   */
  style?: ?ViewStyleProp,

  /**
   * Style applied to the inner Image component
   *
   * See https://reactnative.dev/docs/imagebackground#imagestyle
   */
  imageStyle?: ?ImageStyleProp,

  /**
   * Allows to set a reference to the inner Image component
   *
   * See https://reactnative.dev/docs/imagebackground#imageref
   */
  imageRef?: React.RefSetter<React.ElementRef<ImageType>>,
}>;
