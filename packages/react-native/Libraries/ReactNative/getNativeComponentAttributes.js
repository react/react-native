/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import processBoxShadow from '../StyleSheet/processBoxShadow';

const ReactNativeStyleAttributes =
  require('../Components/View/ReactNativeStyleAttributes').default;
const resolveAssetSource = require('../Image/resolveAssetSource').default;
const processBackgroundImage =
  require('../StyleSheet/processBackgroundImage').default;
const processBackgroundPosition =
  require('../StyleSheet/processBackgroundPosition').default;
const processBackgroundRepeat =
  require('../StyleSheet/processBackgroundRepeat').default;
const processBackgroundSize =
  require('../StyleSheet/processBackgroundSize').default;
const processColor = require('../StyleSheet/processColor').default;
const processColorArray = require('../StyleSheet/processColorArray').default;
const processFilter = require('../StyleSheet/processFilter').default;
const insetsDiffer = require('../Utilities/differ/insetsDiffer').default;
const matricesDiffer = require('../Utilities/differ/matricesDiffer').default;
const pointsDiffer = require('../Utilities/differ/pointsDiffer').default;
const sizesDiffer = require('../Utilities/differ/sizesDiffer').default;
const UIManager = require('./UIManager').default;
const nullthrows = require('nullthrows');

function getNativeComponentAttributes(uiViewClassName: string): any {
  const viewConfig = UIManager.getViewManagerConfig(uiViewClassName);

  if (viewConfig == null) {
    return null;
  }

  // TODO: This seems like a whole lot of runtime initialization for every
  // native component that can be either avoided or simplified.
  let {baseModuleName, bubblingEventTypes, directEventTypes} = viewConfig;
  let nativeProps = viewConfig.NativeProps;

  bubblingEventTypes = bubblingEventTypes ?? {};
  directEventTypes = directEventTypes ?? {};

  while (baseModuleName) {
    const baseModule = UIManager.getViewManagerConfig(baseModuleName);
    if (!baseModule) {
      baseModuleName = null;
    } else {
      bubblingEventTypes = {
        ...baseModule.bubblingEventTypes,
        ...bubblingEventTypes,
      };
      directEventTypes = {
        ...baseModule.directEventTypes,
        ...directEventTypes,
      };
      nativeProps = {
        ...baseModule.NativeProps,
        ...nativeProps,
      };
      baseModuleName = baseModule.baseModuleName;
    }
  }

  const validAttributes: {[string]: unknown} = {};

  for (const key in nativeProps) {
    const typeName = nativeProps[key];
    const diff = getDifferForType(typeName);
    const process = getProcessorForType(typeName);

    // If diff or process == null, omit the corresponding property from the Attribute
    // Why:
    //  1. Consistency with AttributeType flow type
    //  2. Consistency with Static View Configs, which omit the null properties
    validAttributes[key] =
      diff == null
        ? process == null
          ? true
          : {process}
        : process == null
          ? {diff}
          : {diff, process};
  }

  // Unfortunately, the current setup declares style properties as top-level
  // props. This makes it so we allow style properties in the `style` prop.
  // TODO: Move style properties into a `style` prop and disallow them as
  // top-level props on the native side.
  validAttributes.style = ReactNativeStyleAttributes;

  // $FlowFixMe[unsafe-object-assign]
  Object.assign(viewConfig, {
    uiViewClassName,
    validAttributes,
    bubblingEventTypes,
    directEventTypes,
  });

  attachDefaultEventTypes(viewConfig);

  return viewConfig;
}

function attachDefaultEventTypes(viewConfig: any) {
  // This is supported on UIManager platforms (ex: Android),
  // as lazy view managers are not implemented for all platforms.
  // See [UIManager] for details on constants and implementations.
  const constants = UIManager.getConstants();
  if (constants.ViewManagerNames || constants.LazyViewManagersEnabled) {
    // Lazy view managers enabled.
    viewConfig = merge(
      viewConfig,
      nullthrows(UIManager.getDefaultEventTypes)(),
    );
  } else {
    viewConfig.bubblingEventTypes = merge(
      viewConfig.bubblingEventTypes,
      constants.genericBubblingEventTypes,
    );
    viewConfig.directEventTypes = merge(
      viewConfig.directEventTypes,
      constants.genericDirectEventTypes,
    );
  }
}

// TODO: Figure out how to avoid all this runtime initialization cost.
function merge(destination: ?Object, source: ?Object): ?Object {
  if (!source) {
    return destination;
  }
  if (!destination) {
    return source;
  }

  for (const key in source) {
    if (!source.hasOwnProperty(key)) {
      continue;
    }

    let sourceValue = source[key];
    if (destination.hasOwnProperty(key)) {
      const destinationValue = destination[key];
      if (
        typeof sourceValue === 'object' &&
        typeof destinationValue === 'object'
      ) {
        sourceValue = merge(destinationValue, sourceValue);
      }
    }
    destination[key] = sourceValue;
  }
  return destination;
}

function getDifferForType(
  typeName: string,
): ?(prevProp: any, nextProp: any) => boolean {
  switch (typeName) {
    // iOS Types
    case 'CATransform3D':
      return matricesDiffer;
    case 'CGPoint':
      return pointsDiffer;
    case 'CGSize':
      return sizesDiffer;
    case 'UIEdgeInsets':
      return insetsDiffer;
    // Android Types
    case 'Point':
      return pointsDiffer;
    case 'EdgeInsets':
      return insetsDiffer;
  }
  return null;
}

function getProcessorForType(typeName: string): ?(nextProp: any) => any {
  switch (typeName) {
    // iOS Types
    case 'CGColor':
    case 'UIColor':
      return processColor;
    case 'CGColorArray':
    case 'UIColorArray':
      return processColorArray;
    case 'CGImage':
    case 'UIImage':
    case 'RCTImageSource':
      return resolveAssetSource;
    case 'BoxShadowArray':
      return processBoxShadow;
    case 'FilterArray':
      return processFilter;
    // Android Types
    case 'Color':
      return processColor;
    case 'ColorArray':
      return processColorArray;
    case 'Filter':
      return processFilter;
    case 'BackgroundImage':
      return processBackgroundImage;
    case 'BackgroundPosition':
      return processBackgroundPosition;
    case 'BackgroundRepeat':
      return processBackgroundRepeat;
    case 'BackgroundSize':
      return processBackgroundSize;
    case 'ImageSource':
      return resolveAssetSource;
    case 'BoxShadow':
      return processBoxShadow;
  }
  return null;
}

export default getNativeComponentAttributes;
