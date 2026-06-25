/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// @licenselint-loose-mode

'use strict';

const EVENT_DEFINITION = `
  boolean_required: boolean,
  boolean_optional_key?: boolean,
  boolean_optional_value: ?boolean,
  boolean_optional_both?: ?boolean,

  string_required: string,
  string_optional_key?: string,
  string_optional_value: ?string,
  string_optional_both?: ?string,

  double_required: Double,
  double_optional_key?: Double,
  double_optional_value: ?Double,
  double_optional_both?: ?Double,

  float_required: Float,
  float_optional_key?: Float,
  float_optional_value: ?Float,
  float_optional_both?: ?Float,

  int32_required: Int32,
  int32_optional_key?: Int32,
  int32_optional_value: ?Int32,
  int32_optional_both?: ?Int32,

  union_required: ('small' | 'large'),
  union_optional_key?: ('small' | 'large'),
  union_optional_value: ?('small' | 'large'),
  union_optional_both?: ?('small' | 'large'),

  object_required: {
    boolean_required: boolean,
  },

  object_optional_key?: {
    string_optional_key?: string,
  },

  object_optional_value: ?{
    float_optional_value: ?Float,
  },

  object_optional_both?: ?{
    int32_optional_both?: ?Int32,
  },

  object_required_nested_2_layers: {
    object_optional_nested_1_layer?: ?{
      boolean_required: Int32,
      string_optional_key?: string,
      double_optional_value: ?Double,
      float_optional_value: ?Float,
      int32_optional_both?: ?Int32,
    }
  },

  object_readonly_required: $ReadOnly<{
    boolean_required: boolean,
  }>,

  object_readonly_optional_key?: $ReadOnly<{
    string_optional_key?: string,
  }>,

  object_readonly_optional_value: ?$ReadOnly<{
    float_optional_value: ?Float,
  }>,

  object_readonly_optional_both?: ?$ReadOnly<{
    int32_optional_both?: ?Int32,
  }>,

  boolean_array_required: $ReadOnlyArray<boolean>,
  boolean_array_optional_key?: boolean[],
  boolean_array_optional_value: ?$ReadOnlyArray<boolean>,
  boolean_array_optional_both?: ?boolean[],

  string_array_required: $ReadOnlyArray<string>,
  string_array_optional_key?: string[],
  string_array_optional_value: ?$ReadOnlyArray<string>,
  string_array_optional_both?: ?string[],

  double_array_required: $ReadOnlyArray<Double>,
  double_array_optional_key?: Double[],
  double_array_optional_value: ?$ReadOnlyArray<Double>,
  double_array_optional_both?: ?Double[],

  float_array_required: $ReadOnlyArray<Float>,
  float_array_optional_key?: Float[],
  float_array_optional_value: ?$ReadOnlyArray<Float>,
  float_array_optional_both?: ?Float[],

  int32_array_required: $ReadOnlyArray<Int32>,
  int32_array_optional_key?: Int32[],
  int32_array_optional_value: ?$ReadOnlyArray<Int32>,
  int32_array_optional_both?: ?Int32[],

  union_array_required: $ReadOnlyArray<('small' | 'large')>,
  union_array_optional_key?: ('small' | 'large')[],
  union_array_optional_value: ?$ReadOnlyArray<('small' | 'large')>,
  union_array_optional_both?: ?('small' | 'large')[],

  object_array_required: $ReadOnlyArray<{
    boolean_required: boolean,
  }>,

  object_array_optional_key?: {
    string_optional_key?: string,
  }[],

  object_array_optional_value: ?$ReadOnlyArray<{
    float_optional_value: ?Float,
  }>,

  object_array_optional_both?: ?{
    int32_optional_both?: ?Int32,
  }[],

  int32_array_array_required: $ReadOnlyArray<$ReadOnlyArray<Int32>>,
  int32_array_array_optional_key?: Int32[][],
  int32_array_array_optional_value: ?$ReadOnlyArray<$ReadOnlyArray<Int32>>,
  int32_array_array_optional_both?: ?Int32[][],
`;

const ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  BubblingEventHandler,
  DirectEventHandler,
  WithDefault,
} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  boolean_default_true_optional_both?: WithDefault<boolean, true>,

  // Events
  onDirectEventDefinedInlineNull: DirectEventHandler<null>,
  onBubblingEventDefinedInlineNull: BubblingEventHandler<null>,
|}>;

export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  paperComponentName: 'RCTModule',
}) as HostComponent<ModuleProps>;
`;

const ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS_NO_CAST = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  BubblingEventHandler,
  DirectEventHandler,
  WithDefault,
} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  boolean_default_true_optional_both?: WithDefault<boolean, true>,

  // Events
  onDirectEventDefinedInlineNull: DirectEventHandler<null>,
  onBubblingEventDefinedInlineNull: BubblingEventHandler<null>,
|}>;

export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  excludedPlatforms: ['android'],
  paperComponentName: 'RCTModule',
});
`;

const NO_PROPS_EVENTS_ONLY_DEPRECATED_VIEW_CONFIG_NAME_OPTION = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

export default codegenNativeComponent<ModuleProps>('Module', {
  deprecatedViewConfigName: 'DeprecateModuleName',
}) as HostComponent<ModuleProps>;
`;

const ALL_PROP_TYPES_NO_EVENTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32, Double, Float, WithDefault, UnsafeMixed} from 'CodegenTypes';
import type {ImageSource} from 'ImageSource';
import type {ColorValue, ColorArrayValue, PointValue, EdgeInsetsValue, DimensionValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  // Boolean props
  boolean_required: boolean,
  boolean_optional_key?: WithDefault<boolean, true>,
  boolean_optional_both?: WithDefault<boolean, true>,

  // Boolean props, null default
  boolean_null_optional_key?: WithDefault<boolean, null>,
  boolean_null_optional_both?: WithDefault<boolean, null>,

  // String props
  string_required: string,
  string_optional_key?: WithDefault<string, ''>,
  string_optional_both?: WithDefault<string, ''>,

  // String props, null default
  string_null_optional_key?: WithDefault<string, null>,
  string_null_optional_both?: WithDefault<string, null>,

  // Stringish props
  stringish_required: Stringish,
  stringish_optional_key?: WithDefault<Stringish, ''>,
  stringish_optional_both?: WithDefault<Stringish, ''>,

  // Stringish props, null default
  stringish_null_optional_key?: WithDefault<Stringish, null>,
  stringish_null_optional_both?: WithDefault<Stringish, null>,

  // Double props
  double_required: Double,
  double_optional_key?: WithDefault<Double, 1.1>,
  double_optional_both?: WithDefault<Double, 1.1>,

  // Float props
  float_required: Float,
  float_optional_key?: WithDefault<Float, 1.1>,
  float_optional_both?: WithDefault<Float, 1.1>,

  // Float props, null default
  float_null_optional_key?: WithDefault<Float, null>,
  float_null_optional_both?: WithDefault<Float, null>,

  // Int32 props
  int32_required: Int32,
  int32_optional_key?: WithDefault<Int32, 1>,
  int32_optional_both?: WithDefault<Int32, 1>,

  // String enum props
  enum_optional_key?: WithDefault<'small' | 'large', 'small'>,
  enum_optional_both?: WithDefault<'small' | 'large', 'small'>,

  // Int enum props
  int_enum_optional_key?: WithDefault<0 | 1, 0>,

  // Object props
  object_optional_key?: $ReadOnly<{| prop: string |}>,
  object_optional_both?: ?$ReadOnly<{| prop: string |}>,
  object_optional_value: ?$ReadOnly<{| prop: string |}>,

  // ImageSource props
  image_required: ImageSource,
  image_optional_value: ?ImageSource,
  image_optional_both?: ?ImageSource,

  // ColorValue props
  color_required: ColorValue,
  color_optional_key?: ColorValue,
  color_optional_value: ?ColorValue,
  color_optional_both?: ?ColorValue,

  // ColorArrayValue props
  color_array_required: ColorArrayValue,
  color_array_optional_key?: ColorArrayValue,
  color_array_optional_value: ?ColorArrayValue,
  color_array_optional_both?: ?ColorArrayValue,

  // ProcessedColorValue props
  processed_color_required: ProcessedColorValue,
  processed_color_optional_key?: ProcessedColorValue,
  processed_color_optional_value: ?ProcessedColorValue,
  processed_color_optional_both?: ?ProcessedColorValue,

  // PointValue props
  point_required: PointValue,
  point_optional_key?: PointValue,
  point_optional_value: ?PointValue,
  point_optional_both?: ?PointValue,

  // EdgeInsets props
  insets_required: EdgeInsetsValue,
  insets_optional_key?: EdgeInsetsValue,
  insets_optional_value: ?EdgeInsetsValue,
  insets_optional_both?: ?EdgeInsetsValue,

  // DimensionValue props
  dimension_required: DimensionValue,
  dimension_optional_key?: DimensionValue,
  dimension_optional_value: ?DimensionValue,
  dimension_optional_both?: ?DimensionValue,

  // Mixed props
  mixed_required: UnsafeMixed,
  mixed_optional_key?: UnsafeMixed,
|}>;

export default codegenNativeComponent<ModuleProps, Options>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const ARRAY_PROP_TYPES_NO_EVENTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32, Double, Float, WithDefault} from 'CodegenTypes';
import type {ImageSource} from 'ImageSource';
import type {ColorValue, PointValue, ProcessColorValue, EdgeInsetsValue, DimensionValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

type ObjectType = $ReadOnly<{| prop: string |}>;
type ArrayObjectType = $ReadOnlyArray<$ReadOnly<{| prop: string |}>>;

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  // Boolean props
  array_boolean_required: $ReadOnlyArray<boolean>,
  array_boolean_optional_key?: $ReadOnlyArray<boolean>,
  array_boolean_optional_value: ?$ReadOnlyArray<boolean>,
  array_boolean_optional_both?: ?$ReadOnlyArray<boolean>,

  // String props
  array_string_required: $ReadOnlyArray<string>,
  array_string_optional_key?: $ReadOnlyArray<string>,
  array_string_optional_value: ?$ReadOnlyArray<string>,
  array_string_optional_both?: ?$ReadOnlyArray<string>,

  // Double props
  array_double_required: $ReadOnlyArray<Double>,
  array_double_optional_key?: $ReadOnlyArray<Double>,
  array_double_optional_value: ?$ReadOnlyArray<Double>,
  array_double_optional_both?: ?$ReadOnlyArray<Double>,

  // Float props
  array_float_required: $ReadOnlyArray<Float>,
  array_float_optional_key?: $ReadOnlyArray<Float>,
  array_float_optional_value: ?$ReadOnlyArray<Float>,
  array_float_optional_both?: ?$ReadOnlyArray<Float>,

  // Int32 props
  array_int32_required: $ReadOnlyArray<Int32>,
  array_int32_optional_key?: $ReadOnlyArray<Int32>,
  array_int32_optional_value: ?$ReadOnlyArray<Int32>,
  array_int32_optional_both?: ?$ReadOnlyArray<Int32>,

  // String enum props
  array_enum_optional_key?: WithDefault<
    $ReadOnlyArray<'small' | 'large'>,
    'small',
  >,
  array_enum_optional_both?: WithDefault<
    $ReadOnlyArray<'small' | 'large'>,
    'small',
  >,

  // ImageSource props
  array_image_required: $ReadOnlyArray<ImageSource>,
  array_image_optional_key?: $ReadOnlyArray<ImageSource>,
  array_image_optional_value: ?$ReadOnlyArray<ImageSource>,
  array_image_optional_both?: ?$ReadOnlyArray<ImageSource>,

  // ColorValue props
  array_color_required: $ReadOnlyArray<ColorValue>,
  array_color_optional_key?: $ReadOnlyArray<ColorValue>,
  array_color_optional_value: ?$ReadOnlyArray<ColorValue>,
  array_color_optional_both?: ?$ReadOnlyArray<ColorValue>,

  // PointValue props
  array_point_required: $ReadOnlyArray<PointValue>,
  array_point_optional_key?: $ReadOnlyArray<PointValue>,
  array_point_optional_value: ?$ReadOnlyArray<PointValue>,
  array_point_optional_both?: ?$ReadOnlyArray<PointValue>,

  // EdgeInsetsValue props
  array_insets_required: $ReadOnlyArray<EdgeInsetsValue>,
  array_insets_optional_key?: $ReadOnlyArray<EdgeInsetsValue>,
  array_insets_optional_value: ?$ReadOnlyArray<EdgeInsetsValue>,
  array_insets_optional_both?: ?$ReadOnlyArray<EdgeInsetsValue>,

  // DimensionValue props
  array_dimension_required: $ReadOnlyArray<DimensionValue>,
  array_dimension_optional_key?: $ReadOnlyArray<DimensionValue>,
  array_dimension_optional_value: ?$ReadOnlyArray<DimensionValue>,
  array_dimension_optional_both?: ?$ReadOnlyArray<DimensionValue>,

  // Object props
  array_object_required: $ReadOnlyArray<$ReadOnly<{| prop: string |}>>,
  array_object_optional_key?: $ReadOnlyArray<$ReadOnly<{| prop: string |}>>,
  array_object_optional_value: ?ArrayObjectType,
  array_object_optional_both?: ?$ReadOnlyArray<ObjectType>,

  // UnsafeMixed props
  array_mixed_required: $ReadOnlyArray<UnsafeMixed>,
  array_mixed_optional_key?: $ReadOnlyArray<UnsafeMixed>,
  array_mixed_optional_value: ?$ReadOnlyArray<UnsafeMixed>,
  array_mixed_optional_both?: ?$ReadOnlyArray<UnsafeMixed>,

  // Nested array object types
  array_of_array_object_required: $ReadOnlyArray<
    $ReadOnly<{|
      // This needs to be the same name as the top level array above
      array_object_required: $ReadOnlyArray<$ReadOnly<{| prop: string |}>>,
    |}>
  >,
  array_of_array_object_optional_key?: $ReadOnlyArray<
    $ReadOnly<{|
      // This needs to be the same name as the top level array above
      array_object_optional_key: $ReadOnlyArray<$ReadOnly<{| prop?: string |}>>,
    |}>
  >,
  array_of_array_object_optional_value: ?$ReadOnlyArray<
    $ReadOnly<{|
      // This needs to be the same name as the top level array above
      array_object_optional_value: $ReadOnlyArray<$ReadOnly<{| prop: ?string |}>>,
    |}>
  >,
  array_of_array_object_optional_both?: ?$ReadOnlyArray<
    $ReadOnly<{|
      // This needs to be the same name as the top level array above
      array_object_optional_both: $ReadOnlyArray<$ReadOnly<{| prop?: ?string |}>>,
    |}>
  >,

  // Nested array of array of object types
  array_of_array_of_object_required: $ReadOnlyArray<
    $ReadOnlyArray<
      $ReadOnly<{|
        prop: string,
      |}>,
    >,
  >,

  // Nested array of array of object types (in file)
  array_of_array_of_object_required_in_file: $ReadOnlyArray<
    $ReadOnlyArray<ObjectType>,
  >,

  // Nested array of array of object types (with spread)
  array_of_array_of_object_required_with_spread: $ReadOnlyArray<
    $ReadOnlyArray<
      $ReadOnly<{|
        ...ObjectType
      |}>,
    >,
  >,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const OBJECT_PROP_TYPES_NO_EVENTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32, Double, Float, WithDefault} from 'CodegenTypes';
import type {ImageSource} from 'ImageSource';
import type {ColorValue, PointValue, EdgeInsetsValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  // Boolean props
  boolean_required: $ReadOnly<{|prop: boolean|}>,
  boolean_optional: $ReadOnly<{|prop?: WithDefault<boolean, false>|}>,

  // String props
  string_required: $ReadOnly<{|prop: string|}>,
  string_optional: $ReadOnly<{|prop?: WithDefault<string, ''>|}>,

  // Double props
  double_required: $ReadOnly<{|prop: Double|}>,
  double_optional: $ReadOnly<{|prop?: WithDefault<Double, 0.0>|}>,

  // Float props
  float_required: $ReadOnly<{|prop: Float|}>,
  float_optional: $ReadOnly<{|prop?: WithDefault<Float, 0.0>|}>,

  // Int32 props
  int_required: $ReadOnly<{|prop: Int32|}>,
  int_optional: $ReadOnly<{|prop?: WithDefault<Int32, 0>|}>,

  // String enum props
  enum_optional: $ReadOnly<{|
    prop?: WithDefault<$ReadOnlyArray<'small' | 'large'>, 'small'>,
  |}>,

  // ImageSource props
  image_required: $ReadOnly<{|prop: ImageSource|}>,
  image_optional_key: $ReadOnly<{|prop?: ImageSource|}>,
  image_optional_value: $ReadOnly<{|prop: ?ImageSource|}>,
  image_optional_both: $ReadOnly<{|prop?: ?ImageSource|}>,

  // ColorValue props
  color_required: $ReadOnly<{|prop: ColorValue|}>,
  color_optional_key: $ReadOnly<{|prop?: ColorValue|}>,
  color_optional_value: $ReadOnly<{|prop: ?ColorValue|}>,
  color_optional_both: $ReadOnly<{|prop?: ?ColorValue|}>,

  // ProcessedColorValue props
  processed_color_required: $ReadOnly<{|prop: ProcessedColorValue|}>,
  processed_color_optional_key: $ReadOnly<{|prop?: ProcessedColorValue|}>,
  processed_color_optional_value: $ReadOnly<{|prop: ?ProcessedColorValue|}>,
  processed_color_optional_both: $ReadOnly<{|prop?: ?ProcessedColorValue|}>,

  // PointValue props
  point_required: $ReadOnly<{|prop: PointValue|}>,
  point_optional_key: $ReadOnly<{|prop?: PointValue|}>,
  point_optional_value: $ReadOnly<{|prop: ?PointValue|}>,
  point_optional_both: $ReadOnly<{|prop?: ?PointValue|}>,

  // EdgeInsetsValue props
  insets_required: $ReadOnly<{|prop: EdgeInsetsValue|}>,
  insets_optional_key: $ReadOnly<{|prop?: EdgeInsetsValue|}>,
  insets_optional_value: $ReadOnly<{|prop: ?EdgeInsetsValue|}>,
  insets_optional_both: $ReadOnly<{|prop?: ?EdgeInsetsValue|}>,

  // DimensionValue props
  dimension_required: $ReadOnly<{|prop: DimensionValue|}>,
  dimension_optional_key: $ReadOnly<{|prop?: DimensionValue|}>,
  dimension_optional_value: $ReadOnly<{|prop: ?DimensionValue|}>,
  dimension_optional_both: $ReadOnly<{|prop?: ?DimensionValue|}>,

  // Nested object props
  object_required: $ReadOnly<{|prop: $ReadOnly<{nestedProp: string}>|}>,
  object_optional_key?: $ReadOnly<{|prop: $ReadOnly<{nestedProp: string}>|}>,
  object_optional_value: ?$ReadOnly<{|prop: $ReadOnly<{nestedProp: string}>|}>,
  object_optional_both?: ?$ReadOnly<{|prop: $ReadOnly<{nestedProp: string}>|}>,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_ALIASED_LOCALLY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

type DeepSpread = $ReadOnly<{|
  otherStringProp: string,
|}>;

export type PropsInFile = $ReadOnly<{|
  ...DeepSpread,
  isEnabled: boolean,
  label: string,
|}>;

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  ...PropsInFile,

  localType: $ReadOnly<{|
    ...PropsInFile
  |}>,

  localArr: $ReadOnlyArray<PropsInFile>
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const EVENTS_DEFINED_INLINE_WITH_ALL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {HostComponent} from 'react-native';
const codegenNativeComponent = require('codegenNativeComponent');

import type {
  Int32,
  Double,
  Float,
  BubblingEventHandler,
  DirectEventHandler,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No Props

  // Events
  onDirectEventDefinedInline:
    DirectEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,

  onDirectEventDefinedInlineOptionalKey?:
    DirectEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,

  onDirectEventDefinedInlineOptionalValue: ?
    DirectEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,

  onDirectEventDefinedInlineOptionalBoth?: ?
    DirectEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,

  onDirectEventDefinedInlineWithPaperName?: ?
    DirectEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
      'paperDirectEventDefinedInlineWithPaperName',
    >,

  onBubblingEventDefinedInline:
    BubblingEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,

  onBubblingEventDefinedInlineOptionalKey?:
    BubblingEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,

  onBubblingEventDefinedInlineOptionalValue: ?
    BubblingEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,

  onBubblingEventDefinedInlineOptionalBoth?: ?
    BubblingEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,

  onBubblingEventDefinedInlineWithPaperName?: ?
    BubblingEventHandler<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
      'paperBubblingEventDefinedInlineWithPaperName'
    >,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const EVENTS_DEFINED_AS_NULL_INLINE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {BubblingEventHandler, DirectEventHandler} from 'CodegenTypese';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // No props

  // Events defined inline
  onDirectEventDefinedInlineNull: DirectEventHandler<null>,
  onDirectEventDefinedInlineNullOptionalKey?: DirectEventHandler<null>,
  onDirectEventDefinedInlineNullOptionalValue: ?DirectEventHandler<null>,
  onDirectEventDefinedInlineNullOptionalBoth?: DirectEventHandler<null>,
  onDirectEventDefinedInlineNullWithPaperName?: ?DirectEventHandler<
    null,
    'paperDirectEventDefinedInlineNullWithPaperName',
  >,

  onBubblingEventDefinedInlineNull: BubblingEventHandler<null>,
  onBubblingEventDefinedInlineNullOptionalKey?: BubblingEventHandler<null>,
  onBubblingEventDefinedInlineNullOptionalValue: ?BubblingEventHandler<null>,
  onBubblingEventDefinedInlineNullOptionalBoth?: ?BubblingEventHandler<null>,
  onBubblingEventDefinedInlineNullWithPaperName?: ?BubblingEventHandler<
    null,
    'paperBubblingEventDefinedInlineNullWithPaperName',
  >,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_AND_EVENTS_TYPES_EXPORTED = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {
  BubblingEventHandler,
  DirectEventHandler,
} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type EventInFile = $ReadOnly<{|
  ${EVENT_DEFINITION}
|}>;

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // No props

  // Events defined inline
  onBubblingEventDefinedInline: BubblingEventHandler<EventInFile>,
  onBubblingEventDefinedInlineWithPaperName: BubblingEventHandler<EventInFile, 'paperBubblingEventDefinedInlineWithPaperName'>,
  onDirectEventDefinedInline: DirectEventHandler<EventInFile>,
  onDirectEventDefinedInlineWithPaperName: DirectEventHandler<EventInFile, 'paperDirectEventDefinedInlineWithPaperName'>,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_AS_EXTERNAL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {HostComponent} from 'react-native';

export type String = string;
export type AnotherArray = $ReadOnlyArray<String>;

export type ModuleProps = $ReadOnly<{|
  disable: String,
  array: AnotherArray,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITH_ALL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32, Double, Float} from 'CodegenTypes';
import type {RootTag} from 'RCTExport';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';


export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

type NativeType = HostComponent<ModuleProps>;

interface NativeCommands {
  +handleRootTag: (viewRef: React.ElementRef<NativeType>, rootTag: RootTag) => void;
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>, x: Int32, y: Int32) => void;
  scrollTo(
    viewRef: React.ElementRef<NativeType>,
    x: Float,
    y: Int32,
    z: Double,
    animated: boolean,
  ): void;
  +arrayArgs: (
    viewRef: React.ElementRef<NativeType>,
    booleanArray: $ReadOnlyArray<boolean>,
    stringArray: $ReadOnlyArray<string>,
    floatArray: $ReadOnlyArray<Float>,
    intArray: $ReadOnlyArray<Int32>,
    doubleArray: $ReadOnlyArray<Double>,
  ) => void;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['handleRootTag', 'hotspotUpdate', 'scrollTo', 'arrayArgs'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as NativeType;
`;

const COMMANDS_WITH_EXTERNAL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export type Boolean = boolean;
export type Int = Int32;
export type Void = void;
export type Locations = {
  x: number,
  y: number,
}

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

type NativeType = HostComponent<ModuleProps>;

export type ScrollTo = (
  viewRef: React.ElementRef<NativeType>,
  y: Int,
  animated: Boolean,
) => Void;

interface NativeCommands {
  +scrollTo: ScrollTo;
  +addOverlays: (
    viewRef: React.ElementRef<NativeType>,
    overlayColorsReadOnly: $ReadOnlyArray<string>,
    overlayColorsArray: Array<string>,
    overlayColorsArrayAnnotation: string[],
    overlayLocations: $ReadOnlyArray<Locations>,
  ) => void;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['scrollTo', 'addOverlays'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as NativeType;
`;

const COMMANDS_EVENTS_TYPES_EXPORTED = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {
  BubblingEventHandler,
  DirectEventHandler,
} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type EventInFile = $ReadOnly<{|
  ${EVENT_DEFINITION}
|}>;

export type Boolean = boolean;
export type Int = Int32;
export type Void = void;

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // No props

  // Events defined inline
  onBubblingEventDefinedInline: BubblingEventHandler<EventInFile>,
  onBubblingEventDefinedInlineWithPaperName: BubblingEventHandler<EventInFile, 'paperBubblingEventDefinedInlineWithPaperName'>,
  onDirectEventDefinedInline: DirectEventHandler<EventInFile>,
  onDirectEventDefinedInlineWithPaperName: DirectEventHandler<EventInFile, 'paperDirectEventDefinedInlineWithPaperName'>,
|}>;

type NativeType = HostComponent<ModuleProps>;

export type ScrollTo = (viewRef: React.ElementRef<NativeType>, y: Int, animated: Boolean) => Void;

interface NativeCommands {
  +scrollTo: ScrollTo;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['scrollTo']
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as NativeType;
`;

const NAMESPACED_EVENT_DEFINITION = `
  boolean_required: boolean,
  boolean_optional_key?: boolean,
  boolean_optional_value: ?boolean,
  boolean_optional_both?: ?boolean,

  string_required: string,
  string_optional_key?: string,
  string_optional_value: ?string,
  string_optional_both?: ?string,

  double_required: CodegenTypes.Double,
  double_optional_key?: CodegenTypes.Double,
  double_optional_value: ?CodegenTypes.Double,
  double_optional_both?: ?CodegenTypes.Double,

  float_required: CodegenTypes.Float,
  float_optional_key?: CodegenTypes.Float,
  float_optional_value: ?CodegenTypes.Float,
  float_optional_both?: ?CodegenTypes.Float,

  int32_required: CodegenTypes.Int32,
  int32_optional_key?: CodegenTypes.Int32,
  int32_optional_value: ?CodegenTypes.Int32,
  int32_optional_both?: ?CodegenTypes.Int32,

  union_required: ('small' | 'large'),
  union_optional_key?: ('small' | 'large'),
  union_optional_value: ?('small' | 'large'),
  union_optional_both?: ?('small' | 'large'),

  object_required: {
    boolean_required: boolean,
  },

  object_optional_key?: {
    string_optional_key?: string,
  },

  object_optional_value: ?{
    float_optional_value: ?CodegenTypes.Float,
  },

  object_optional_both?: ?{
    int32_optional_both?: ?CodegenTypes.Int32,
  },

  object_required_nested_2_layers: {
    object_optional_nested_1_layer?: ?{
      boolean_required: CodegenTypes.Int32,
      string_optional_key?: string,
      double_optional_value: ?CodegenTypes.Double,
      float_optional_value: ?CodegenTypes.Float,
      int32_optional_both?: ?CodegenTypes.Int32,
    }
  },

  object_readonly_required: $ReadOnly<{
    boolean_required: boolean,
  }>,

  object_readonly_optional_key?: $ReadOnly<{
    string_optional_key?: string,
  }>,

  object_readonly_optional_value: ?$ReadOnly<{
    float_optional_value: ?CodegenTypes.Float,
  }>,

  object_readonly_optional_both?: ?$ReadOnly<{
    int32_optional_both?: ?CodegenTypes.Int32,
  }>,

  boolean_array_required: $ReadOnlyArray<boolean>,
  boolean_array_optional_key?: boolean[],
  boolean_array_optional_value: ?$ReadOnlyArray<boolean>,
  boolean_array_optional_both?: ?boolean[],

  string_array_required: $ReadOnlyArray<string>,
  string_array_optional_key?: string[],
  string_array_optional_value: ?$ReadOnlyArray<string>,
  string_array_optional_both?: ?string[],

  double_array_required: $ReadOnlyArray<CodegenTypes.Double>,
  double_array_optional_key?: CodegenTypes.Double[],
  double_array_optional_value: ?$ReadOnlyArray<CodegenTypes.Double>,
  double_array_optional_both?: ?CodegenTypes.Double[],

  float_array_required: $ReadOnlyArray<CodegenTypes.Float>,
  float_array_optional_key?: CodegenTypes.Float[],
  float_array_optional_value: ?$ReadOnlyArray<CodegenTypes.Float>,
  float_array_optional_both?: ?CodegenTypes.Float[],

  int32_array_required: $ReadOnlyArray<CodegenTypes.Int32>,
  int32_array_optional_key?: CodegenTypes.Int32[],
  int32_array_optional_value: ?$ReadOnlyArray<CodegenTypes.Int32>,
  int32_array_optional_both?: ?CodegenTypes.Int32[],

  union_array_required: $ReadOnlyArray<('small' | 'large')>,
  union_array_optional_key?: ('small' | 'large')[],
  union_array_optional_value: ?$ReadOnlyArray<('small' | 'large')>,
  union_array_optional_both?: ?('small' | 'large')[],

  object_array_required: $ReadOnlyArray<{
    boolean_required: boolean,
  }>,

  object_array_optional_key?: {
    string_optional_key?: string,
  }[],

  object_array_optional_value: ?$ReadOnlyArray<{
    float_optional_value: ?CodegenTypes.Float,
  }>,

  object_array_optional_both?: ?{
    int32_optional_both?: ?CodegenTypes.Int32,
  }[],

  int32_array_array_required: $ReadOnlyArray<$ReadOnlyArray<CodegenTypes.Int32>>,
  int32_array_array_optional_key?: CodegenTypes.Int32[][],
  int32_array_array_optional_value: ?$ReadOnlyArray<$ReadOnlyArray<CodegenTypes.Int32>>,
  int32_array_array_optional_both?: ?CodegenTypes.Int32[][],
`;

const NAMESPACED_ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  boolean_default_true_optional_both?: CodegenTypes.WithDefault<boolean, true>,

  // Events
  onDirectEventDefinedInlineNull: CodegenTypes.DirectEventHandler<null>,
  onBubblingEventDefinedInlineNull: CodegenTypes.BubblingEventHandler<null>,
|}>;

export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  paperComponentName: 'RCTModule',
}) as HostComponent<ModuleProps>;
`;

const NAMESPACED_ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS_NO_CAST = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  boolean_default_true_optional_both?: CodegenTypes.WithDefault<boolean, true>,

  // Events
  onDirectEventDefinedInlineNull: CodegenTypes.DirectEventHandler<null>,
  onBubblingEventDefinedInlineNull: CodegenTypes.BubblingEventHandler<null>,
|}>;

export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  excludedPlatforms: ['android'],
  paperComponentName: 'RCTModule',
});
`;

const NAMESPACED_ALL_PROP_TYPES_NO_EVENTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {ImageSource} from 'ImageSource';
import type {ColorValue, ColorArrayValue, PointValue, EdgeInsetsValue, DimensionValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  // Boolean props
  boolean_required: boolean,
  boolean_optional_key?: CodegenTypes.WithDefault<boolean, true>,
  boolean_optional_both?: CodegenTypes.WithDefault<boolean, true>,

  // Boolean props, null default
  boolean_null_optional_key?: CodegenTypes.WithDefault<boolean, null>,
  boolean_null_optional_both?: CodegenTypes.WithDefault<boolean, null>,

  // String props
  string_required: string,
  string_optional_key?: CodegenTypes.WithDefault<string, ''>,
  string_optional_both?: CodegenTypes.WithDefault<string, ''>,

  // String props, null default
  string_null_optional_key?: CodegenTypes.WithDefault<string, null>,
  string_null_optional_both?: CodegenTypes.WithDefault<string, null>,

  // Stringish props
  stringish_required: Stringish,
  stringish_optional_key?: CodegenTypes.WithDefault<Stringish, ''>,
  stringish_optional_both?: CodegenTypes.WithDefault<Stringish, ''>,

  // Stringish props, null default
  stringish_null_optional_key?: CodegenTypes.WithDefault<Stringish, null>,
  stringish_null_optional_both?: CodegenTypes.WithDefault<Stringish, null>,

  // Double props
  double_required: CodegenTypes.Double,
  double_optional_key?: CodegenTypes.WithDefault<CodegenTypes.Double, 1.1>,
  double_optional_both?: CodegenTypes.WithDefault<CodegenTypes.Double, 1.1>,

  // Float props
  float_required: CodegenTypes.Float,
  float_optional_key?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.1>,
  float_optional_both?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.1>,

  // Float props, null default
  float_null_optional_key?: CodegenTypes.WithDefault<CodegenTypes.Float, null>,
  float_null_optional_both?: CodegenTypes.WithDefault<CodegenTypes.Float, null>,

  // Int32 props
  int32_required: CodegenTypes.Int32,
  int32_optional_key?: CodegenTypes.WithDefault<CodegenTypes.Int32, 1>,
  int32_optional_both?: CodegenTypes.WithDefault<CodegenTypes.Int32, 1>,

  // String enum props
  enum_optional_key?: CodegenTypes.WithDefault<'small' | 'large', 'small'>,
  enum_optional_both?: CodegenTypes.WithDefault<'small' | 'large', 'small'>,

  // Int enum props
  int_enum_optional_key?: CodegenTypes.WithDefault<0 | 1, 0>,

  // Object props
  object_optional_key?: $ReadOnly<{| prop: string |}>,
  object_optional_both?: ?$ReadOnly<{| prop: string |}>,
  object_optional_value: ?$ReadOnly<{| prop: string |}>,

  // ImageSource props
  image_required: ImageSource,
  image_optional_value: ?ImageSource,
  image_optional_both?: ?ImageSource,

  // ColorValue props
  color_required: ColorValue,
  color_optional_key?: ColorValue,
  color_optional_value: ?ColorValue,
  color_optional_both?: ?ColorValue,

  // ColorArrayValue props
  color_array_required: ColorArrayValue,
  color_array_optional_key?: ColorArrayValue,
  color_array_optional_value: ?ColorArrayValue,
  color_array_optional_both?: ?ColorArrayValue,

  // ProcessedColorValue props
  processed_color_required: ProcessedColorValue,
  processed_color_optional_key?: ProcessedColorValue,
  processed_color_optional_value: ?ProcessedColorValue,
  processed_color_optional_both?: ?ProcessedColorValue,

  // PointValue props
  point_required: PointValue,
  point_optional_key?: PointValue,
  point_optional_value: ?PointValue,
  point_optional_both?: ?PointValue,

  // EdgeInsets props
  insets_required: EdgeInsetsValue,
  insets_optional_key?: EdgeInsetsValue,
  insets_optional_value: ?EdgeInsetsValue,
  insets_optional_both?: ?EdgeInsetsValue,

  // DimensionValue props
  dimension_required: DimensionValue,
  dimension_optional_key?: DimensionValue,
  dimension_optional_value: ?DimensionValue,
  dimension_optional_both?: ?DimensionValue,

  // Mixed props
  mixed_required: CodegenTypes.UnsafeMixed,
  mixed_optional_key?: CodegenTypes.UnsafeMixed,
|}>;

export default codegenNativeComponent<ModuleProps, Options>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NAMESPACED_ARRAY_PROP_TYPES_NO_EVENTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {ImageSource} from 'ImageSource';
import type {ColorValue, PointValue, ProcessColorValue, EdgeInsetsValue, DimensionValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';

type ObjectType = $ReadOnly<{| prop: string |}>;
type ArrayObjectType = $ReadOnlyArray<$ReadOnly<{| prop: string |}>>;

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  // Boolean props
  array_boolean_required: $ReadOnlyArray<boolean>,
  array_boolean_optional_key?: $ReadOnlyArray<boolean>,
  array_boolean_optional_value: ?$ReadOnlyArray<boolean>,
  array_boolean_optional_both?: ?$ReadOnlyArray<boolean>,

  // String props
  array_string_required: $ReadOnlyArray<string>,
  array_string_optional_key?: $ReadOnlyArray<string>,
  array_string_optional_value: ?$ReadOnlyArray<string>,
  array_string_optional_both?: ?$ReadOnlyArray<string>,

  // Double props
  array_double_required: $ReadOnlyArray<CodegenTypes.Double>,
  array_double_optional_key?: $ReadOnlyArray<CodegenTypes.Double>,
  array_double_optional_value: ?$ReadOnlyArray<CodegenTypes.Double>,
  array_double_optional_both?: ?$ReadOnlyArray<CodegenTypes.Double>,

  // Float props
  array_float_required: $ReadOnlyArray<CodegenTypes.Float>,
  array_float_optional_key?: $ReadOnlyArray<CodegenTypes.Float>,
  array_float_optional_value: ?$ReadOnlyArray<CodegenTypes.Float>,
  array_float_optional_both?: ?$ReadOnlyArray<CodegenTypes.Float>,

  // Int32 props
  array_int32_required: $ReadOnlyArray<CodegenTypes.Int32>,
  array_int32_optional_key?: $ReadOnlyArray<CodegenTypes.Int32>,
  array_int32_optional_value: ?$ReadOnlyArray<CodegenTypes.Int32>,
  array_int32_optional_both?: ?$ReadOnlyArray<CodegenTypes.Int32>,

  // String enum props
  array_enum_optional_key?: CodegenTypes.WithDefault<
    $ReadOnlyArray<'small' | 'large'>,
    'small',
  >,
  array_enum_optional_both?: CodegenTypes.WithDefault<
    $ReadOnlyArray<'small' | 'large'>,
    'small',
  >,

  // ImageSource props
  array_image_required: $ReadOnlyArray<ImageSource>,
  array_image_optional_key?: $ReadOnlyArray<ImageSource>,
  array_image_optional_value: ?$ReadOnlyArray<ImageSource>,
  array_image_optional_both?: ?$ReadOnlyArray<ImageSource>,

  // ColorValue props
  array_color_required: $ReadOnlyArray<ColorValue>,
  array_color_optional_key?: $ReadOnlyArray<ColorValue>,
  array_color_optional_value: ?$ReadOnlyArray<ColorValue>,
  array_color_optional_both?: ?$ReadOnlyArray<ColorValue>,

  // PointValue props
  array_point_required: $ReadOnlyArray<PointValue>,
  array_point_optional_key?: $ReadOnlyArray<PointValue>,
  array_point_optional_value: ?$ReadOnlyArray<PointValue>,
  array_point_optional_both?: ?$ReadOnlyArray<PointValue>,

  // EdgeInsetsValue props
  array_insets_required: $ReadOnlyArray<EdgeInsetsValue>,
  array_insets_optional_key?: $ReadOnlyArray<EdgeInsetsValue>,
  array_insets_optional_value: ?$ReadOnlyArray<EdgeInsetsValue>,
  array_insets_optional_both?: ?$ReadOnlyArray<EdgeInsetsValue>,

  // DimensionValue props
  array_dimension_required: $ReadOnlyArray<DimensionValue>,
  array_dimension_optional_key?: $ReadOnlyArray<DimensionValue>,
  array_dimension_optional_value: ?$ReadOnlyArray<DimensionValue>,
  array_dimension_optional_both?: ?$ReadOnlyArray<DimensionValue>,

  // Object props
  array_object_required: $ReadOnlyArray<$ReadOnly<{| prop: string |}>>,
  array_object_optional_key?: $ReadOnlyArray<$ReadOnly<{| prop: string |}>>,
  array_object_optional_value: ?ArrayObjectType,
  array_object_optional_both?: ?$ReadOnlyArray<ObjectType>,

  // UnsafeMixed props
  array_mixed_required: $ReadOnlyArray<CodegenTypes.UnsafeMixed>,
  array_mixed_optional_key?: $ReadOnlyArray<CodegenTypes.UnsafeMixed>,
  array_mixed_optional_value: ?$ReadOnlyArray<CodegenTypes.UnsafeMixed>,
  array_mixed_optional_both?: ?$ReadOnlyArray<CodegenTypes.UnsafeMixed>,

  // Nested array object types
  array_of_array_object_required: $ReadOnlyArray<
    $ReadOnly<{|
      // This needs to be the same name as the top level array above
      array_object_required: $ReadOnlyArray<$ReadOnly<{| prop: string |}>>,
    |}>
  >,
  array_of_array_object_optional_key?: $ReadOnlyArray<
    $ReadOnly<{|
      // This needs to be the same name as the top level array above
      array_object_optional_key: $ReadOnlyArray<$ReadOnly<{| prop?: string |}>>,
    |}>
  >,
  array_of_array_object_optional_value: ?$ReadOnlyArray<
    $ReadOnly<{|
      // This needs to be the same name as the top level array above
      array_object_optional_value: $ReadOnlyArray<$ReadOnly<{| prop: ?string |}>>,
    |}>
  >,
  array_of_array_object_optional_both?: ?$ReadOnlyArray<
    $ReadOnly<{|
      // This needs to be the same name as the top level array above
      array_object_optional_both: $ReadOnlyArray<$ReadOnly<{| prop?: ?string |}>>,
    |}>
  >,

  // Nested array of array of object types
  array_of_array_of_object_required: $ReadOnlyArray<
    $ReadOnlyArray<
      $ReadOnly<{|
        prop: string,
      |}>,
    >,
  >,

  // Nested array of array of object types (in file)
  array_of_array_of_object_required_in_file: $ReadOnlyArray<
    $ReadOnlyArray<ObjectType>,
  >,

  // Nested array of array of object types (with spread)
  array_of_array_of_object_required_with_spread: $ReadOnlyArray<
    $ReadOnlyArray<
      $ReadOnly<{|
        ...ObjectType
      |}>,
    >,
  >,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NAMESPACED_OBJECT_PROP_TYPES_NO_EVENTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {ImageSource} from 'ImageSource';
import type {ColorValue, PointValue, EdgeInsetsValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  // Boolean props
  boolean_required: $ReadOnly<{|prop: boolean|}>,
  boolean_optional: $ReadOnly<{|prop?: CodegenTypes.WithDefault<boolean, false>|}>,

  // String props
  string_required: $ReadOnly<{|prop: string|}>,
  string_optional: $ReadOnly<{|prop?: CodegenTypes.WithDefault<string, ''>|}>,

  // Double props
  double_required: $ReadOnly<{|prop: CodegenTypes.Double|}>,
  double_optional: $ReadOnly<{|prop?: CodegenTypes.WithDefault<CodegenTypes.Double, 0.0>|}>,

  // Float props
  float_required: $ReadOnly<{|prop: CodegenTypes.Float|}>,
  float_optional: $ReadOnly<{|prop?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>|}>,

  // Int32 props
  int_required: $ReadOnly<{|prop: CodegenTypes.Int32|}>,
  int_optional: $ReadOnly<{|prop?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>|}>,

  // String enum props
  enum_optional: $ReadOnly<{|
    prop?: CodegenTypes.WithDefault<$ReadOnlyArray<'small' | 'large'>, 'small'>,
  |}>,

  // ImageSource props
  image_required: $ReadOnly<{|prop: ImageSource|}>,
  image_optional_key: $ReadOnly<{|prop?: ImageSource|}>,
  image_optional_value: $ReadOnly<{|prop: ?ImageSource|}>,
  image_optional_both: $ReadOnly<{|prop?: ?ImageSource|}>,

  // ColorValue props
  color_required: $ReadOnly<{|prop: ColorValue|}>,
  color_optional_key: $ReadOnly<{|prop?: ColorValue|}>,
  color_optional_value: $ReadOnly<{|prop: ?ColorValue|}>,
  color_optional_both: $ReadOnly<{|prop?: ?ColorValue|}>,

  // ProcessedColorValue props
  processed_color_required: $ReadOnly<{|prop: ProcessedColorValue|}>,
  processed_color_optional_key: $ReadOnly<{|prop?: ProcessedColorValue|}>,
  processed_color_optional_value: $ReadOnly<{|prop: ?ProcessedColorValue|}>,
  processed_color_optional_both: $ReadOnly<{|prop?: ?ProcessedColorValue|}>,

  // PointValue props
  point_required: $ReadOnly<{|prop: PointValue|}>,
  point_optional_key: $ReadOnly<{|prop?: PointValue|}>,
  point_optional_value: $ReadOnly<{|prop: ?PointValue|}>,
  point_optional_both: $ReadOnly<{|prop?: ?PointValue|}>,

  // EdgeInsetsValue props
  insets_required: $ReadOnly<{|prop: EdgeInsetsValue|}>,
  insets_optional_key: $ReadOnly<{|prop?: EdgeInsetsValue|}>,
  insets_optional_value: $ReadOnly<{|prop: ?EdgeInsetsValue|}>,
  insets_optional_both: $ReadOnly<{|prop?: ?EdgeInsetsValue|}>,

  // DimensionValue props
  dimension_required: $ReadOnly<{|prop: DimensionValue|}>,
  dimension_optional_key: $ReadOnly<{|prop?: DimensionValue|}>,
  dimension_optional_value: $ReadOnly<{|prop: ?DimensionValue|}>,
  dimension_optional_both: $ReadOnly<{|prop?: ?DimensionValue|}>,

  // Nested object props
  object_required: $ReadOnly<{|prop: $ReadOnly<{nestedProp: string}>|}>,
  object_optional_key?: $ReadOnly<{|prop: $ReadOnly<{nestedProp: string}>|}>,
  object_optional_value: ?$ReadOnly<{|prop: $ReadOnly<{nestedProp: string}>|}>,
  object_optional_both?: ?$ReadOnly<{|prop: $ReadOnly<{nestedProp: string}>|}>,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NAMESPACED_EVENTS_DEFINED_INLINE_WITH_ALL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {CodegenTypes, HostComponent} from 'react-native';
const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No Props

  // Events
  onDirectEventDefinedInline:
    CodegenTypes.DirectEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
    >,

  onDirectEventDefinedInlineOptionalKey?:
    CodegenTypes.DirectEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
    >,

  onDirectEventDefinedInlineOptionalValue: ?
    CodegenTypes.DirectEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
    >,

  onDirectEventDefinedInlineOptionalBoth?: ?
    CodegenTypes.DirectEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
    >,

  onDirectEventDefinedInlineWithPaperName?: ?
    CodegenTypes.DirectEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
      'paperDirectEventDefinedInlineWithPaperName',
    >,

  onBubblingEventDefinedInline:
    CodegenTypes.BubblingEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
    >,

  onBubblingEventDefinedInlineOptionalKey?:
    CodegenTypes.BubblingEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
    >,

  onBubblingEventDefinedInlineOptionalValue: ?
    CodegenTypes.BubblingEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
    >,

  onBubblingEventDefinedInlineOptionalBoth?: ?
    CodegenTypes.BubblingEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
    >,

  onBubblingEventDefinedInlineWithPaperName?: ?
    CodegenTypes.BubblingEventHandler<
      $ReadOnly<{|
        ${NAMESPACED_EVENT_DEFINITION}
      |}>,
      'paperBubblingEventDefinedInlineWithPaperName'
    >,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NAMESPACED_EVENTS_DEFINED_AS_NULL_INLINE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // No props

  // Events defined inline
  onDirectEventDefinedInlineNull: CodegenTypes.DirectEventHandler<null>,
  onDirectEventDefinedInlineNullOptionalKey?: CodegenTypes.DirectEventHandler<null>,
  onDirectEventDefinedInlineNullOptionalValue: ?CodegenTypes.DirectEventHandler<null>,
  onDirectEventDefinedInlineNullOptionalBoth?: CodegenTypes.DirectEventHandler<null>,
  onDirectEventDefinedInlineNullWithPaperName?: ?CodegenTypes.DirectEventHandler<
    null,
    'paperDirectEventDefinedInlineNullWithPaperName',
  >,

  onBubblingEventDefinedInlineNull: CodegenTypes.BubblingEventHandler<null>,
  onBubblingEventDefinedInlineNullOptionalKey?: CodegenTypes.BubblingEventHandler<null>,
  onBubblingEventDefinedInlineNullOptionalValue: ?CodegenTypes.BubblingEventHandler<null>,
  onBubblingEventDefinedInlineNullOptionalBoth?: ?CodegenTypes.BubblingEventHandler<null>,
  onBubblingEventDefinedInlineNullWithPaperName?: ?CodegenTypes.BubblingEventHandler<
    null,
    'paperBubblingEventDefinedInlineNullWithPaperName',
  >,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NAMESPACED_PROPS_AND_EVENTS_TYPES_EXPORTED = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type EventInFile = $ReadOnly<{|
  ${EVENT_DEFINITION}
|}>;

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // No props

  // Events defined inline
  onBubblingEventDefinedInline: CodegenTypes.BubblingEventHandler<EventInFile>,
  onBubblingEventDefinedInlineWithPaperName: CodegenTypes.BubblingEventHandler<EventInFile, 'paperBubblingEventDefinedInlineWithPaperName'>,
  onDirectEventDefinedInline: CodegenTypes.DirectEventHandler<EventInFile>,
  onDirectEventDefinedInlineWithPaperName: CodegenTypes.DirectEventHandler<EventInFile, 'paperDirectEventDefinedInlineWithPaperName'>,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NAMESPACED_COMMANDS_DEFINED_WITH_ALL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {RootTag} from 'RCTExport';
import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';


export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

type NativeType = HostComponent<ModuleProps>;

interface NativeCommands {
  +handleRootTag: (viewRef: React.ElementRef<NativeType>, rootTag: RootTag) => void;
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>, x: CodegenTypes.Int32, y: CodegenTypes.Int32) => void;
  scrollTo(
    viewRef: React.ElementRef<NativeType>,
    x: CodegenTypes.Float,
    y: CodegenTypes.Int32,
    z: CodegenTypes.Double,
    animated: boolean,
  ): void;
  +arrayArgs: (
    viewRef: React.ElementRef<NativeType>,
    booleanArray: $ReadOnlyArray<boolean>,
    stringArray: $ReadOnlyArray<string>,
    floatArray: $ReadOnlyArray<CodegenTypes.Float>,
    intArray: $ReadOnlyArray<CodegenTypes.Int32>,
    doubleArray: $ReadOnlyArray<CodegenTypes.Double>,
  ) => void;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['handleRootTag', 'hotspotUpdate', 'scrollTo', 'arrayArgs'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as NativeType;
`;

const NAMESPACED_COMMANDS_WITH_EXTERNAL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';

export type Boolean = boolean;
export type Int = CodegenTypes.Int32;
export type Void = void;
export type Locations = {
  x: number,
  y: number,
}

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

type NativeType = HostComponent<ModuleProps>;

export type ScrollTo = (
  viewRef: React.ElementRef<NativeType>,
  y: Int,
  animated: Boolean,
) => Void;

interface NativeCommands {
  +scrollTo: ScrollTo;
  +addOverlays: (
    viewRef: React.ElementRef<NativeType>,
    overlayColorsReadOnly: $ReadOnlyArray<string>,
    overlayColorsArray: Array<string>,
    overlayColorsArrayAnnotation: string[],
    overlayLocations: $ReadOnlyArray<Locations>,
  ) => void;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['scrollTo', 'addOverlays'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as NativeType;
`;

const NAMESPACED_COMMANDS_EVENTS_TYPES_EXPORTED = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {CodegenTypes, HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type EventInFile = $ReadOnly<{|
  ${NAMESPACED_EVENT_DEFINITION}
|}>;

export type Boolean = boolean;
export type Int = CodegenTypes.Int32;
export type Void = void;

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // No props

  // Events defined inline
  onBubblingEventDefinedInline: CodegenTypes.BubblingEventHandler<EventInFile>,
  onBubblingEventDefinedInlineWithPaperName: CodegenTypes.BubblingEventHandler<EventInFile, 'paperBubblingEventDefinedInlineWithPaperName'>,
  onDirectEventDefinedInline: CodegenTypes.DirectEventHandler<EventInFile>,
  onDirectEventDefinedInlineWithPaperName: CodegenTypes.DirectEventHandler<EventInFile, 'paperDirectEventDefinedInlineWithPaperName'>,
|}>;

type NativeType = HostComponent<ModuleProps>;

export type ScrollTo = (viewRef: React.ElementRef<NativeType>, y: Int, animated: Boolean) => Void;

interface NativeCommands {
  +scrollTo: ScrollTo;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['scrollTo']
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as NativeType;
`;

module.exports = {
  ALL_PROP_TYPES_NO_EVENTS,
  ARRAY_PROP_TYPES_NO_EVENTS,
  OBJECT_PROP_TYPES_NO_EVENTS,
  PROPS_ALIASED_LOCALLY,
  ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS,
  ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS_NO_CAST,
  NO_PROPS_EVENTS_ONLY_DEPRECATED_VIEW_CONFIG_NAME_OPTION,
  EVENTS_DEFINED_INLINE_WITH_ALL_TYPES,
  EVENTS_DEFINED_AS_NULL_INLINE,
  PROPS_AND_EVENTS_TYPES_EXPORTED,
  COMMANDS_EVENTS_TYPES_EXPORTED,
  COMMANDS_DEFINED_WITH_ALL_TYPES,
  PROPS_AS_EXTERNAL_TYPES,
  COMMANDS_WITH_EXTERNAL_TYPES,

  NAMESPACED_ALL_PROP_TYPES_NO_EVENTS,
  NAMESPACED_ARRAY_PROP_TYPES_NO_EVENTS,
  NAMESPACED_OBJECT_PROP_TYPES_NO_EVENTS,
  NAMESPACED_ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS,
  NAMESPACED_ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS_NO_CAST,
  NAMESPACED_EVENTS_DEFINED_INLINE_WITH_ALL_TYPES,
  NAMESPACED_EVENTS_DEFINED_AS_NULL_INLINE,
  NAMESPACED_PROPS_AND_EVENTS_TYPES_EXPORTED,
  NAMESPACED_COMMANDS_EVENTS_TYPES_EXPORTED,
  NAMESPACED_COMMANDS_DEFINED_WITH_ALL_TYPES,
  NAMESPACED_COMMANDS_WITH_EXTERNAL_TYPES,
};
