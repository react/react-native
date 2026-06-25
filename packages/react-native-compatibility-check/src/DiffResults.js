/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  PropertiesComparisonResult,
  TypeComparisonError,
} from './ComparisonResult';
import type {CompleteTypeAnnotation} from '@react-native/codegen/src/CodegenSchema';

export type ErrorCode =
  | 'addedProps'
  | 'removedProps'
  | 'changedParams'
  | 'incompatibleTypes'
  | 'requiredProps'
  | 'optionalProps'
  | 'nonNullableOfNull'
  | 'nullableOfNonNull'
  | 'removedMemberCases'
  | 'addedMemberCases'
  | 'removedIntersectCases'
  | 'addedIntersectCases'
  | 'removedModule'
  | 'removedComponent';

export type TypeStore = {
  typeName: string,
  typeInformation: CompleteTypeAnnotation,
  ...
};
// Stores object properties that are added or removed which could be patchable
export type ObjectTypeChangeStore = {
  typeName: string,
  newType: CompleteTypeAnnotation,
  oldType: CompleteTypeAnnotation,
  propertyChange: PropertiesComparisonResult,
};
export type ErrorStore = {
  typeName: string,
  errorCode: ErrorCode,
  errorInformation: TypeComparisonError,
};
export type FormattedErrorStore = {
  message: string,
  errorCode: ErrorCode,
};
export type NativeSpecErrorStore = {
  nativeSpecName: string,
  omitted: boolean,
  errorCode: ErrorCode,
  errorInformation?: TypeComparisonError,
  changeInformation?: DiffSet,
};
export type ExportableNativeSpecErrorStore = {
  nativeSpecName: string,
  omitted: boolean,
  errorCode: ErrorCode,
  errorInformation?: TypeComparisonError,
  changeInformation?: ExportableDiffSet,
};
export type DiffSet = {
  newTypes: Set<TypeStore>,
  deprecatedTypes: Set<TypeStore>,
  objectTypeChanges: Set<ObjectTypeChangeStore>,
  incompatibleChanges: Set<ErrorStore>,
};
type ExportableDiffSet = {
  newTypes: Array<TypeStore>,
  deprecatedTypes: Array<TypeStore>,
  objectTypeChanges: Array<ObjectTypeChangeStore>,
  incompatibleChanges: Array<ErrorStore>,
};

export type Framework = 'ReactNative';
export type SchemaDiffers = {
  incompatibleSpecs: ?Set<NativeSpecErrorStore>,
};
type ExportableSchemaDiffers = {
  incompatibleSpecs: ?Array<ExportableNativeSpecErrorStore>,
};
export type SchemaDiffCategory = 'new' | 'deprecated' | SchemaDiffers;
type ExportableSchemaDiffCategory =
  | 'new'
  | 'deprecated'
  | ExportableSchemaDiffers;
export type SchemaDiff = {
  name: string,
  framework: Framework,
  status: SchemaDiffCategory,
};
export type ExportableSchemaDiff = {
  name: string,
  framework: Framework,
  status: ExportableSchemaDiffCategory,
};

export type Version = {
  device: 'android' | 'ios',
  number: string,
  ...
};

export type Incompatible = {
  framework: Framework,
  incompatibleSpecs?: Array<NativeSpecErrorStore>,
};
export type IncompatiblityReport = {
  [hasteModuleName: string]: Incompatible,
};
export type DiffSummary = {
  /** status records how the diff compares against older versions
   * ok: there are no changes that impact older versions
   * patchable: there are additions (or modifications) that are not suported
   *            in older versions but is safe with an auto-generated patch
   * incompatible: there are modifications that are not safe for use with older
   *            versions and are not fixable with an auto-generated patchable
   */
  status: 'ok' | 'patchable' | 'incompatible',
  // If there are incompatible changes, provide a record of them, otherwise {}
  incompatibilityReport: IncompatiblityReport,
};

export type FormattedIncompatible = {
  framework: Framework,
  incompatibleSpecs?: Array<FormattedErrorStore>,
};

export type FormattedIncompatiblityReport = {
  [hasteModuleName: string]: FormattedIncompatible,
};

export type FormattedDiffSummary = {
  /** status records how the diff compares against older versions
   * ok: there are no changes that impact older versions
   * patchable: there are additions (or modifications) that are not suported
   *            in older versions but is safe with an auto-generated patch
   * incompatible: there are modifications that are not safe for use with older
   *            versions and are not fixable with an auto-generated patchable
   */
  status: 'ok' | 'patchable' | 'incompatible',
  // If there are incompatible changes, provide a record of them, otherwise {}
  incompatibilityReport: FormattedIncompatiblityReport,
};

function diffSetExporter(diffSet: DiffSet): ExportableDiffSet {
  return {
    newTypes: Array.from(diffSet.newTypes),
    deprecatedTypes: Array.from(diffSet.deprecatedTypes),
    objectTypeChanges: Array.from(diffSet.objectTypeChanges),
    incompatibleChanges: Array.from(diffSet.incompatibleChanges),
  };
}

export function nativeSpecErrorExporter(
  nativeSpecError: NativeSpecErrorStore,
): ExportableNativeSpecErrorStore {
  if (nativeSpecError.changeInformation) {
    return {
      nativeSpecName: nativeSpecError.nativeSpecName,
      omitted: nativeSpecError.omitted,
      errorCode: nativeSpecError.errorCode,
      errorInformation: nativeSpecError.errorInformation,
      changeInformation: diffSetExporter(nativeSpecError.changeInformation),
    };
  }
  return {
    nativeSpecName: nativeSpecError.nativeSpecName,
    omitted: nativeSpecError.omitted,
    errorCode: nativeSpecError.errorCode,
    errorInformation: nativeSpecError.errorInformation,
  };
}

function schemaDiffCategoryExporter(
  status: SchemaDiffCategory,
): ExportableSchemaDiffCategory {
  switch (status) {
    case 'new':
    case 'deprecated':
      return status;
    default:
      return {
        incompatibleSpecs: status.incompatibleSpecs
          ? Array.from(status.incompatibleSpecs).map(nativeSpecErrorExporter)
          : undefined,
      };
  }
}

export function schemaDiffExporter(
  schemaDiff: SchemaDiff,
): ExportableSchemaDiff {
  return {
    name: schemaDiff.name,
    framework: schemaDiff.framework,
    status: schemaDiffCategoryExporter(schemaDiff.status),
  };
}
