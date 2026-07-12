/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {Constructor} from '../../types/private/Utilities';
import {AccessibilityProps} from '../Components/View/ViewAccessibility';
import {Insets} from '../../types/public/Insets';
import {HostInstance} from '../../types/public/ReactNativeTypes';
import {ColorValue, StyleProp} from '../StyleSheet/StyleSheet';
import {ImageStyle, ViewStyle} from '../StyleSheet/StyleSheetTypes';
import {LayoutChangeEvent, NativeSyntheticEvent} from '../Types/CoreEventTypes';
import {ImageResizeMode} from './ImageResizeMode';
import {ImageRequireSource, ImageURISource} from './ImageSource';

/**
 * @deprecated Use `ImageProgressEventIOS` instead.
 */
export interface ImageProgressEventDataIOS {
  loaded: number;
  total: number;
}

/**
 * @see https://reactnative.dev/docs/image#onprogress
 */
export type ImageProgressEventIOS =
  NativeSyntheticEvent<ImageProgressEventDataIOS>;

export interface ImagePropsIOS {
  /**
   * blurRadius: the blur radius of the blur filter added to the image
   * @platform ios
   */
  blurRadius?: number | undefined;

  /**
   * When the image is resized, the corners of the size specified by capInsets will stay a fixed size,
   * but the center content and borders of the image will be stretched.
   * This is useful for creating resizable rounded buttons, shadows, and other resizable assets.
   * More info on Apple documentation
   */
  capInsets?: Insets | undefined;

  /**
   * Invoked on download progress with {nativeEvent: {loaded, total}}
   */
  onProgress?: ((event: ImageProgressEventIOS) => void) | undefined;

  /**
   * Invoked when a partial load of the image is complete. The definition of
   * what constitutes a "partial load" is loader specific though this is meant
   * for progressive JPEG loads.
   * @platform ios
   */
  onPartialLoad?: (() => void) | undefined;
}

interface ImagePropsAndroid {
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
  resizeMethod?: 'auto' | 'resize' | 'scale' | 'none' | undefined;

  /**
   * Duration of fade in animation in ms. Defaults to 300
   *
   * @platform android
   */
  fadeDuration?: number | undefined;
}

/**
 * @see https://reactnative.dev/docs/image#source
 */
export type ImageSourcePropType =
  ImageURISource | ImageURISource[] | ImageRequireSource;

/**
 * @deprecated Use `ImageLoadEvent` instead.
 */
export interface ImageLoadEventData {
  source: {
    height: number;
    width: number;
    uri: string;
  };
}

/**
 * @see https://reactnative.dev/docs/image#onload
 */
export type ImageLoadEvent = NativeSyntheticEvent<ImageLoadEventData>;

/**
 * @deprecated Use `ImageErrorEvent` instead.
 */
export interface ImageErrorEventData {
  error: any;
}

/**
 * @see https://reactnative.dev/docs/image#onerror
 */
export type ImageErrorEvent = NativeSyntheticEvent<ImageErrorEventData>;

/**
 * @see https://reactnative.dev/docs/image#resolveassetsource
 */
export interface ImageResolvedAssetSource {
  height: number;
  width: number;
  scale: number;
  uri: string;
}

/**
 * @see https://reactnative.dev/docs/image
 */
export interface ImagePropsBase
  extends ImagePropsIOS, ImagePropsAndroid, AccessibilityProps {
  /**
   * Used to reference react managed images from native code.
   */
  id?: string | undefined;

  /**
   * onLayout function
   *
   * Invoked on mount and layout changes with
   *
   * {nativeEvent: { layout: {x, y, width, height} }}.
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  /**
   * Invoked on load error with {nativeEvent: {error}}
   */
  onError?: ((error: ImageErrorEvent) => void) | undefined;

  /**
   * Invoked when load completes successfully
   * { source: { uri, height, width } }.
   */
  onLoad?: ((event: ImageLoadEvent) => void) | undefined;

  /**
   * Invoked when load either succeeds or fails
   */
  onLoadEnd?: (() => void) | undefined;

  /**
   * Invoked on load start
   */
  onLoadStart?: (() => void) | undefined;

  progressiveRenderingEnabled?: boolean | undefined;

  borderRadius?: number | undefined;

  borderTopLeftRadius?: number | undefined;

  borderTopRightRadius?: number | undefined;

  borderBottomLeftRadius?: number | undefined;

  borderBottomRightRadius?: number | undefined;

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
   */
  resizeMode?: ImageResizeMode | undefined;

  /**
   * The image source (either a remote URL or a local file resource).
   *
   * This prop can also contain several remote URLs, specified together with their width and height and potentially with scale/other URI arguments.
   * The native side will then choose the best uri to display based on the measured size of the image container.
   * A cache property can be added to control how networked request interacts with the local cache.
   *
   * The currently supported formats are png, jpg, jpeg, bmp, gif, webp (Android only), psd (iOS only).
   */
  source?: ImageSourcePropType | undefined;

  /**
   * A string representing the resource identifier for the image. Similar to
   * src from HTML.
   *
   * See https://reactnative.dev/docs/image#src
   */
  src?: string | undefined;

  /**
   * Similar to srcset from HTML.
   *
   * See https://reactnative.dev/docs/image#srcset
   */
  srcSet?: string | undefined;

  /**
   * similarly to `source`, this property represents the resource used to render
   * the loading indicator for the image, displayed until image is ready to be
   * displayed, typically after when it got downloaded from network.
   */
  loadingIndicatorSource?: ImageURISource | undefined;

  /**
   * A unique identifier for this element to be used in UI Automation testing scripts.
   */
  testID?: string | undefined;

  /**
   * Used to reference react managed images from native code.
   */
  nativeID?: string | undefined;

  /**
   * A static image to display while downloading the final image off the network.
   */
  defaultSource?: ImageURISource | ImageRequireSource | undefined;

  /**
   * The text that's read by the screen reader when the user interacts with
   * the image.
   *
   * See https://reactnative.dev/docs/image#alt
   */
  alt?: string | undefined;

  /**
   * Height of the image component.
   *
   * See https://reactnative.dev/docs/image#height
   */
  height?: number | undefined;

  /**
   * Width of the image component.
   *
   * See https://reactnative.dev/docs/image#width
   */
  width?: number | undefined;

  /**
   * Adds the CORS related header to the request.
   * Similar to crossorigin from HTML.
   *
   * See https://reactnative.dev/docs/image#crossorigin
   */
  crossOrigin?: 'anonymous' | 'use-credentials' | undefined;

  /**
   * Changes the color of all the non-transparent pixels to the tintColor.
   *
   * See https://reactnative.dev/docs/image#tintcolor
   */
  tintColor?: ColorValue | undefined;

  /**
   * A string indicating which referrer to use when fetching the resource.
   * Similar to referrerpolicy from HTML.
   *
   * See https://reactnative.dev/docs/image#referrerpolicy
   */
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
    | undefined;
}

export interface ImageProps extends ImagePropsBase {
  /**
   *
   * Style
   */
  style?: StyleProp<ImageStyle> | undefined;
}

export interface ImageSize {
  width: number;
  height: number;
}

declare class ImageComponent extends React.Component<ImageProps> {}
declare const ImageBase: Constructor<HostInstance> & typeof ImageComponent;
export class Image extends ImageBase {
  static getSize(uri: string): Promise<ImageSize>;
  static getSize(
    uri: string,
    success: (width: number, height: number) => void,
    failure?: (error: any) => void,
  ): void;

  static getSizeWithHeaders(
    uri: string,
    headers: {[index: string]: string},
  ): Promise<ImageSize>;
  static getSizeWithHeaders(
    uri: string,
    headers: {[index: string]: string},
    success: (width: number, height: number) => void,
    failure?: (error: any) => void,
  ): void;
  static prefetch(url: string): Promise<boolean>;
  static prefetchWithMetadata(
    url: string,
    queryRootName: string,
    rootTag?: number,
  ): Promise<boolean>;
  static abortPrefetch?(requestId: number): void;
  static queryCache?(
    urls: string[],
  ): Promise<{[url: string]: 'memory' | 'disk' | 'disk/memory'}>;

  /**
   * @see https://reactnative.dev/docs/image#resolveassetsource
   */
  static resolveAssetSource(
    source: ImageSourcePropType,
  ): ImageResolvedAssetSource;
}

export interface ImageBackgroundProps extends ImagePropsBase {
  children?: React.ReactNode | undefined;
  imageStyle?: StyleProp<ImageStyle> | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  imageRef?(image: Image): void;
}

declare class ImageBackgroundComponent extends React.Component<ImageBackgroundProps> {}
declare const ImageBackgroundBase: Constructor<HostInstance> &
  typeof ImageBackgroundComponent;
export class ImageBackground extends ImageBackgroundBase {}
