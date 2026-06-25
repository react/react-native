/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/**
 * Single source of truth for the 6 reserved primitive types used in
 * React Native component props. Each type maps to its per-language
 * representation (C++ type name, C++ includes, Java imports).
 *
 * Previously these mappings were scattered across CppHelpers.js,
 * ComponentsGeneratorUtils.js, and JavaHelpers.js.
 */

export type ReservedPrimitiveName =
  | 'ColorPrimitive'
  | 'EdgeInsetsPrimitive'
  | 'ImageRequestPrimitive'
  | 'ImageSourcePrimitive'
  | 'PointPrimitive'
  | 'DimensionPrimitive';

type CppTypeInfo = {
  readonly typeName: string,
  readonly localIncludes: ReadonlyArray<string>,
  readonly conversionIncludes: ReadonlyArray<string>,
};

type JavaImportInfo = {
  readonly interfaceImports: ReadonlyArray<string>,
  readonly delegateImports: ReadonlyArray<string>,
};

type ReservedTypeMapping = {
  readonly cpp: CppTypeInfo,
  readonly java: JavaImportInfo,
};

const RESERVED_TYPES: {readonly [ReservedPrimitiveName]: ReservedTypeMapping} =
  {
    ColorPrimitive: {
      cpp: {
        typeName: 'SharedColor',
        localIncludes: ['#include <react/renderer/graphics/Color.h>'],
        conversionIncludes: [],
      },
      java: {
        interfaceImports: [],
        delegateImports: [
          'import com.facebook.react.bridge.ColorPropConverter;',
        ],
      },
    },
    ImageSourcePrimitive: {
      cpp: {
        typeName: 'ImageSource',
        localIncludes: ['#include <react/renderer/imagemanager/primitives.h>'],
        conversionIncludes: [
          '#include <react/renderer/components/image/conversions.h>',
        ],
      },
      java: {
        interfaceImports: ['import com.facebook.react.bridge.ReadableMap;'],
        delegateImports: ['import com.facebook.react.bridge.ReadableMap;'],
      },
    },
    ImageRequestPrimitive: {
      cpp: {
        typeName: 'ImageRequest',
        localIncludes: [
          '#include <react/renderer/imagemanager/ImageRequest.h>',
        ],
        conversionIncludes: [],
      },
      java: {
        // ImageRequestPrimitive is not used in Java component props
        interfaceImports: [],
        delegateImports: [],
      },
    },
    PointPrimitive: {
      cpp: {
        typeName: 'Point',
        localIncludes: ['#include <react/renderer/graphics/Point.h>'],
        conversionIncludes: [],
      },
      java: {
        interfaceImports: ['import com.facebook.react.bridge.ReadableMap;'],
        delegateImports: ['import com.facebook.react.bridge.ReadableMap;'],
      },
    },
    EdgeInsetsPrimitive: {
      cpp: {
        typeName: 'EdgeInsets',
        localIncludes: ['#include <react/renderer/graphics/RectangleEdges.h>'],
        conversionIncludes: [],
      },
      java: {
        interfaceImports: ['import com.facebook.react.bridge.ReadableMap;'],
        delegateImports: ['import com.facebook.react.bridge.ReadableMap;'],
      },
    },
    DimensionPrimitive: {
      cpp: {
        typeName: 'YGValue',
        localIncludes: [
          '#include <yoga/Yoga.h>',
          '#include <react/renderer/core/graphicsConversions.h>',
        ],
        conversionIncludes: [
          '#include <react/renderer/components/view/conversions.h>',
        ],
      },
      java: {
        interfaceImports: ['import com.facebook.yoga.YogaValue;'],
        delegateImports: [
          'import com.facebook.react.bridge.DimensionPropConverter;',
        ],
      },
    },
  };

function getCppTypeForReservedPrimitive(name: ReservedPrimitiveName): string {
  return RESERVED_TYPES[name].cpp.typeName;
}

function getCppLocalIncludesForReservedPrimitive(
  name: ReservedPrimitiveName,
): ReadonlyArray<string> {
  return RESERVED_TYPES[name].cpp.localIncludes;
}

function getCppConversionIncludesForReservedPrimitive(
  name: ReservedPrimitiveName,
): ReadonlyArray<string> {
  return RESERVED_TYPES[name].cpp.conversionIncludes;
}

function getJavaImportsForReservedPrimitive(
  name: ReservedPrimitiveName,
  type: 'interface' | 'delegate',
): ReadonlyArray<string> {
  const info = RESERVED_TYPES[name].java;
  return type === 'interface' ? info.interfaceImports : info.delegateImports;
}

module.exports = {
  RESERVED_TYPES,
  getCppTypeForReservedPrimitive,
  getCppLocalIncludesForReservedPrimitive,
  getCppConversionIncludesForReservedPrimitive,
  getJavaImportsForReservedPrimitive,
};
