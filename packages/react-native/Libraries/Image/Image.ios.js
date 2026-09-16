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
import type {AbstractImageIOS, ImageIOS} from './ImageTypes.flow';
import type {ImageSize} from './NativeImageLoaderAndroid';

import {createRootTag} from '../ReactNative/RootTag';
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
import NativeImageLoaderIOS from './NativeImageLoaderIOS';
import resolveAssetSource from './resolveAssetSource';
import * as React from 'react';
import {use} from 'react';

export type ImageInstance = HostInstance;

function getSize(
  uri: string,
  success?: (width: number, height: number) => void,
  failure?: (error: unknown) => void,
): void | Promise<ImageSize> {
  const promise = NativeImageLoaderIOS.getSize(uri).then(([width, height]) => ({
    width,
    height,
  }));
  if (typeof success !== 'function') {
    return promise;
  }
  promise
    .then(sizes => success(sizes.width, sizes.height))
    .catch(
      failure ||
        function () {
          console.warn('Failed to get size for image: ' + uri);
        },
    );
}

function getSizeWithHeaders(
  uri: string,
  headers: {[string]: string, ...},
  success?: (width: number, height: number) => void,
  failure?: (error: unknown) => void,
): void | Promise<ImageSize> {
  const promise = NativeImageLoaderIOS.getSizeWithHeaders(uri, headers);
  if (typeof success !== 'function') {
    return promise;
  }
  promise
    .then(sizes => success(sizes.width, sizes.height))
    .catch(
      failure ||
        function () {
          console.warn('Failed to get size for image: ' + uri);
        },
    );
}

function prefetchWithMetadata(
  url: string,
  queryRootName: string,
  rootTag?: ?RootTag,
): Promise<boolean> {
  if (NativeImageLoaderIOS.prefetchImageWithMetadata) {
    // number params like rootTag cannot be nullable before TurboModules is available
    return NativeImageLoaderIOS.prefetchImageWithMetadata(
      url,
      queryRootName,
      // NOTE: RootTag type
      rootTag != null ? rootTag : createRootTag(0),
    );
  } else {
    return NativeImageLoaderIOS.prefetchImage(url);
  }
}

function prefetch(url: string): Promise<boolean> {
  return NativeImageLoaderIOS.prefetchImage(url);
}

async function queryCache(
  urls: Array<string>,
): Promise<{[string]: 'memory' | 'disk' | 'disk/memory', ...}> {
  return NativeImageLoaderIOS.queryCache(urls);
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
let BaseImage: AbstractImageIOS = ({
  ref: forwardedRef,
  'aria-labelledby': ariaLabelledBy,
  'aria-busy': ariaBusy,
  'aria-checked': ariaChecked,
  'aria-disabled': ariaDisabled,
  'aria-expanded': ariaExpanded,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  'aria-selected': ariaSelected,
  accessibilityState,
  alt,
  children,
  crossOrigin,
  height,
  referrerPolicy,
  resizeMode,
  source,
  src,
  srcSet,
  style,
  tintColor,
  width,
  ...restProps
}: {
  ref?: React.RefSetter<ImageInstance>,
  ...ImageProps,
}) => {
  const nativeProps = restProps as {
    ...React.PropsOf<ImageViewNativeComponent>,
  };

  const resolvedSource =
    getImageSourcesFromImageProps({
      crossOrigin,
      height,
      referrerPolicy,
      source,
      src,
      srcSet,
      width,
    }) || EMPTY_IMAGE_SOURCE;

  let resolvedStyle: ImageStyleProp;
  let sources;
  if (Array.isArray(resolvedSource)) {
    resolvedStyle = [styles.base, style];
    sources = resolvedSource;
  } else {
    const {uri} = resolvedSource;
    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
    resolvedStyle = [
      {
        width: resolvedSource.width ?? width,
        height: resolvedSource.height ?? height,
      },
      styles.base,
      style,
    ];
    sources = [resolvedSource];
  }

  if (children != null) {
    throw new Error(
      'The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.',
    );
  }

  nativeProps.style = resolvedStyle;
  nativeProps.source = sources;

  const flattenedStyle = flattenStyle<ImageStyleProp>(resolvedStyle);
  const objectFit = convertObjectFitToResizeMode(flattenedStyle?.objectFit);
  nativeProps.resizeMode =
    objectFit || resizeMode || flattenedStyle?.resizeMode || 'cover';
  nativeProps.tintColor = tintColor ?? flattenedStyle?.tintColor;

  // Maintain pre-existing order, accessibilityLabel takes priority over alt
  if (ariaLabel != null) {
    nativeProps.accessibilityLabel = ariaLabel;
  } else if (alt != null && nativeProps.accessibilityLabel == null) {
    nativeProps.accessibilityLabel = alt;
  }

  if (ariaLabelledBy != null) {
    nativeProps.accessibilityLabelledBy = ariaLabelledBy;
  }

  if (ariaHidden === true) {
    // In order for `aria-hidden` to work on iOS we must set `accessible` to
    // false (`accessibilityElementsHidden` is not enough).
    nativeProps.accessible = false;
  } else if (alt != null) {
    nativeProps.accessible = true;
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

  const actualRef = useWrapRefWithImageAttachedCallbacks(forwardedRef);

  const analyticTag = use(ImageAnalyticsTagContext);
  if (analyticTag != null) {
    nativeProps.internal_analyticTag = analyticTag;
  }

  return <ImageViewNativeComponent {...nativeProps} ref={actualRef} />;
};

const imageComponentDecorator = unstable_getImageComponentDecorator();
if (imageComponentDecorator != null) {
  BaseImage = imageComponentDecorator(BaseImage);
}

// $FlowExpectedError[incompatible-type] Eventually we need to move these functions from statics of the component to exports in the module.
const Image: ImageIOS = BaseImage;

Image.displayName = 'Image';

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it.
 *
 * See https://reactnative.dev/docs/image#getsize
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.getSize = getSize;

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request.
 *
 * See https://reactnative.dev/docs/image#getsizewithheaders
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.getSizeWithHeaders = getSizeWithHeaders;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache.
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
 * Performs cache interrogation.
 *
 *  See https://reactnative.dev/docs/image#querycache
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
