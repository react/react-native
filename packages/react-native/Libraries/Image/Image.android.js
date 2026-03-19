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
import type {ImageStyleProp} from '../StyleSheet/StyleSheet';
import type {RootTag} from '../Types/RootTagTypes';
import type {ImageProps} from './ImageProps';
import type {AbstractImageAndroid, ImageAndroid} from './ImageTypes.flow';

import flattenStyle from '../StyleSheet/flattenStyle';
import StyleSheet from '../StyleSheet/StyleSheet';
import ImageAnalyticsTagContext from './ImageAnalyticsTagContext';
import {
  unstable_getImageComponentDecorator,
  useWrapRefWithImageAttachedCallbacks,
} from './ImageInjection';
import {getImageSourcesFromImageProps} from './ImageSourceUtils';
import {convertObjectFitToResizeMode} from './ImageUtils';
import ImageViewNativeComponent from './ImageViewNativeComponent';
import NativeImageLoaderAndroid, {
  type ImageSize,
} from './NativeImageLoaderAndroid';
import resolveAssetSource from './resolveAssetSource';
import * as React from 'react';
import {use} from 'react';

let _requestId = 1;
function generateRequestId() {
  return _requestId++;
}

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 *
 * See https://reactnative.dev/docs/image#getsize
 */
function getSize(
  url: string,
  success?: (width: number, height: number) => void,
  failure?: (error: unknown) => void,
): void | Promise<ImageSize> {
  const promise = NativeImageLoaderAndroid.getSize(url);
  if (typeof success !== 'function') {
    return promise;
  }
  promise
    .then(sizes => success(sizes.width, sizes.height))
    .catch(
      failure ||
        function () {
          console.warn('Failed to get size for image: ' + url);
        },
    );
}

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request
 *
 * See https://reactnative.dev/docs/image#getsizewithheaders
 */
function getSizeWithHeaders(
  url: string,
  headers: {[string]: string, ...},
  success?: (width: number, height: number) => void,
  failure?: (error: unknown) => void,
): void | Promise<ImageSize> {
  const promise = NativeImageLoaderAndroid.getSizeWithHeaders(url, headers);
  if (typeof success !== 'function') {
    return promise;
  }
  promise
    .then(sizes => success(sizes.width, sizes.height))
    .catch(
      failure ||
        function () {
          console.warn('Failed to get size for image: ' + url);
        },
    );
}

function prefetchWithMetadata(
  url: string,
  queryRootName: string,
  rootTag?: ?RootTag,
  callback: ?(requestId: number) => void,
): Promise<boolean> {
  // TODO: T79192300 Log queryRootName and rootTag
  return prefetch(url, callback);
}

function prefetch(
  url: string,
  callback: ?(requestId: number) => void,
): Promise<boolean> {
  const requestId = generateRequestId();
  callback && callback(requestId);
  return NativeImageLoaderAndroid.prefetchImage(url, requestId);
}

function abortPrefetch(requestId: number): void {
  NativeImageLoaderAndroid.abortRequest(requestId);
}

/**
 * Perform cache interrogation.
 *
 * See https://reactnative.dev/docs/image#querycache
 */
async function queryCache(
  urls: Array<string>,
): Promise<{[string]: 'memory' | 'disk' | 'disk/memory', ...}> {
  return NativeImageLoaderAndroid.queryCache(urls);
}

const EMPTY_IMAGE_SOURCE = {
  uri: undefined,
  width: undefined,
  height: undefined,
};

/**
 * A React component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * See https://reactnative.dev/docs/image
 */
let BaseImage: AbstractImageAndroid = ({
  ref: forwardedRef,
  alt,
  accessible,
  'aria-labelledby': ariaLabelledBy,
  'aria-busy': ariaBusy,
  'aria-checked': ariaChecked,
  'aria-disabled': ariaDisabled,
  'aria-expanded': ariaExpanded,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  'aria-selected': ariaSelected,
  accessibilityLabel,
  accessibilityLabelledBy,
  accessibilityState,
  defaultSource,
  loadingIndicatorSource,
  children,
  source,
  src,
  style,
  crossOrigin,
  referrerPolicy,
  srcSet,
  onLoadStart,
  onLoad,
  onLoadEnd,
  onError,
  width,
  height,
  resizeMode,
  ...restProps
}: {
  ref?: React.RefSetter<HostInstance>,
  ...ImageProps,
}) => {
  let source_ =
    getImageSourcesFromImageProps({
      crossOrigin,
      referrerPolicy,
      src,
      srcSet,
      width,
      height,
      source,
    }) || EMPTY_IMAGE_SOURCE;
  const defaultSource_ = resolveAssetSource(defaultSource);
  const loadingIndicatorSource_ = resolveAssetSource(loadingIndicatorSource);

  if (children != null) {
    throw new Error(
      'The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.',
    );
  }

  if (defaultSource != null && loadingIndicatorSource != null) {
    throw new Error(
      'The <Image> component cannot have defaultSource and loadingIndicatorSource at the same time. Please use either defaultSource or loadingIndicatorSource.',
    );
  }

  const nativeProps = restProps as {
    ...React.PropsOf<ImageViewNativeComponent>,
  };

  if (Array.isArray(source_)) {
    const {
      headers: sourceHeaders,
      width: sourceWidth,
      height: sourceHeight,
    } = source_[0];
    if (sourceHeaders != null) {
      nativeProps.headers = sourceHeaders;
    }
    // Default to the first source's width and height if only one is provided
    nativeProps.style = [
      source_.length === 1 && {width: sourceWidth, height: sourceHeight},
      styles.base,
      style,
    ];
    nativeProps.source = source_;
  } else {
    const {uri, width: sourceWidth, height: sourceHeight} = source_;
    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
    nativeProps.style = [
      {width: sourceWidth ?? width, height: sourceHeight ?? height},
      styles.base,
      style,
    ];
    nativeProps.source = [source_];
  }

  if (onLoadStart != null) {
    nativeProps.shouldNotifyLoadEvents = true;
    nativeProps.onLoadStart = onLoadStart;
  }

  if (onLoad != null) {
    nativeProps.shouldNotifyLoadEvents = true;
    nativeProps.onLoad = onLoad;
  }

  if (onLoadEnd != null) {
    nativeProps.shouldNotifyLoadEvents = true;
    nativeProps.onLoadEnd = onLoadEnd;
  }

  if (onError != null) {
    nativeProps.shouldNotifyLoadEvents = true;
    nativeProps.onError = onError;
  }

  if (defaultSource_ != null && defaultSource_.uri != null) {
    nativeProps.defaultSource = defaultSource_.uri;
  }

  if (loadingIndicatorSource_ != null && loadingIndicatorSource_.uri != null) {
    nativeProps.loadingIndicatorSrc = loadingIndicatorSource_.uri;
  }

  if (ariaLabel != null) {
    nativeProps.accessibilityLabel = ariaLabel;
  } else if (accessibilityLabel != null) {
    nativeProps.accessibilityLabel = accessibilityLabel;
  } else if (alt != null) {
    nativeProps.accessibilityLabel = alt;
  }

  if (ariaLabelledBy != null) {
    nativeProps.accessibilityLabelledBy = ariaLabelledBy;
  } else if (accessibilityLabelledBy != null) {
    nativeProps.accessibilityLabelledBy = accessibilityLabelledBy;
  }

  if (alt != null) {
    nativeProps.accessible = true;
  } else if (accessible != null) {
    nativeProps.accessible = accessible;
  }

  if (
    accessibilityState != null ||
    ariaBusy != null ||
    ariaChecked != null ||
    ariaDisabled != null ||
    ariaExpanded != null ||
    ariaSelected != null
  ) {
    nativeProps.accessibilityState = {
      busy: ariaBusy ?? accessibilityState?.busy,
      checked: ariaChecked ?? accessibilityState?.checked,
      disabled: ariaDisabled ?? accessibilityState?.disabled,
      expanded: ariaExpanded ?? accessibilityState?.expanded,
      selected: ariaSelected ?? accessibilityState?.selected,
    };
  }

  if (ariaHidden === true) {
    nativeProps.importantForAccessibility = 'no-hide-descendants';
  }

  const flattenedStyle_ = flattenStyle<ImageStyleProp>(style);
  const objectFit_ = convertObjectFitToResizeMode(flattenedStyle_?.objectFit);
  const resizeMode_ =
    objectFit_ || resizeMode || flattenedStyle_?.resizeMode || 'cover';
  nativeProps.resizeMode = resizeMode_;

  const actualRef = useWrapRefWithImageAttachedCallbacks(forwardedRef);

  const analyticTag = use(ImageAnalyticsTagContext);
  if (analyticTag !== null) {
    nativeProps.internal_analyticTag = analyticTag;
  }

  return <ImageViewNativeComponent {...nativeProps} ref={actualRef} />;
};

let _BaseImage = BaseImage;

const imageComponentDecorator = unstable_getImageComponentDecorator();
if (imageComponentDecorator != null) {
  _BaseImage = imageComponentDecorator(_BaseImage);
}

// $FlowExpectedError[incompatible-type] Eventually we need to move these functions from statics of the component to exports in the module.
const Image: ImageAndroid = _BaseImage;

Image.displayName = 'Image';

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 *
 * See https://reactnative.dev/docs/image#getsize
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.getSize = getSize;

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request
 *
 * See https://reactnative.dev/docs/image#getsizewithheaders
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.getSizeWithHeaders = getSizeWithHeaders;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache
 *
 * See https://reactnative.dev/docs/image#prefetch
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.prefetch = prefetch;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache, and adds metadata for queryRootName and rootTag.
 *
 * See https://reactnative.dev/docs/image#prefetch
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.prefetchWithMetadata = prefetchWithMetadata;

/**
 * Abort prefetch request.
 *
 * See https://reactnative.dev/docs/image#abortprefetch
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.abortPrefetch = abortPrefetch;

/**
 * Perform cache interrogation.
 *
 * See https://reactnative.dev/docs/image#querycache
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.queryCache = queryCache;

/**
 * Resolves an asset reference into an object.
 *
 * See https://reactnative.dev/docs/image#resolveassetsource
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.resolveAssetSource = resolveAssetSource;

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

export default Image;
