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

/**
 * A React component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * See https://reactnative.dev/docs/image
 */
let BaseImage: AbstractImageIOS = ({
  ref: forwardedRef,
  ...props
}: {
  ref?: React.RefSetter<ImageInstance>,
  ...ImageProps,
}) => {
  const source = getImageSourcesFromImageProps(props) || {
    uri: undefined,
    width: undefined,
    height: undefined,
  };

  let style: ImageStyleProp;
  let sources;
  if (Array.isArray(source)) {
    style = [styles.base, props.style];
    sources = source;
  } else {
    const {uri} = source;
    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
    const width = source.width ?? props.width;
    const height = source.height ?? props.height;
    style = [{width, height}, styles.base, props.style];
    sources = [source];
  }

  const flattenedStyle = flattenStyle<ImageStyleProp>(style);
  const objectFit = convertObjectFitToResizeMode(flattenedStyle?.objectFit);
  const resizeMode =
    objectFit || props.resizeMode || flattenedStyle?.resizeMode || 'cover';
  const tintColor = props.tintColor ?? flattenedStyle?.tintColor;

  if (props.children != null) {
    throw new Error(
      'The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.',
    );
  }
  const {
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-selected': ariaSelected,
    'aria-hidden': ariaHidden,
    src,
    ...restProps
  } = props;

  const _accessibilityState = {
    busy: ariaBusy ?? props.accessibilityState?.busy,
    checked: ariaChecked ?? props.accessibilityState?.checked,
    disabled: ariaDisabled ?? props.accessibilityState?.disabled,
    expanded: ariaExpanded ?? props.accessibilityState?.expanded,
    selected: ariaSelected ?? props.accessibilityState?.selected,
  };

  // In order for `aria-hidden` to work on iOS we must set `accessible` to false (`accessibilityElementsHidden` is not enough).
  const accessible =
    ariaHidden !== true && (props.alt !== undefined ? true : props.accessible);
  const accessibilityLabel = props['aria-label'] ?? props.accessibilityLabel;

  const actualRef = useWrapRefWithImageAttachedCallbacks(forwardedRef);

  return (
    <ImageAnalyticsTagContext.Consumer>
      {analyticTag => {
        return (
          <ImageViewNativeComponent
            accessibilityState={_accessibilityState}
            {...restProps}
            accessible={accessible}
            accessibilityLabel={accessibilityLabel ?? props.alt}
            ref={actualRef}
            style={style}
            resizeMode={resizeMode}
            tintColor={tintColor}
            source={sources}
            internal_analyticTag={analyticTag}
          />
        );
      }}
    </ImageAnalyticsTagContext.Consumer>
  );
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
