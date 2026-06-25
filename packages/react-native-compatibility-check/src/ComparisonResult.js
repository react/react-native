/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  CompleteTypeAnnotation,
  NamedShape,
  NativeModuleEnumMember,
} from '@react-native/codegen/src/CodegenSchema';

type TypeAnnotationComparisonError = {
  type: 'TypeAnnotationComparisonError',
  message: string,
  newerAnnotation: CompleteTypeAnnotation,
  olderAnnotation: CompleteTypeAnnotation,
  previousError?: TypeComparisonError,
};
type TypeInformationComparisonError = {
  type: 'TypeInformationComparisonError',
  message: string,
  newerAnnotation: CompleteTypeAnnotation,
  olderAnnotation: CompleteTypeAnnotation,
  previousError?: TypeComparisonError,
};
type PropertyComparisonError = {
  type: 'PropertyComparisonError',
  message: string,
  mismatchedProperties: Array<{
    property: string,
    fault?: TypeComparisonError,
    ...
  }>,
  previousError?: TypeComparisonError,
};
type PositionalComparisonError = {
  type: 'PositionalComparisonError',
  message: string,
  erroneousItems: Array<[number, CompleteTypeAnnotation]>,
  previousError?: TypeComparisonError,
};
type MemberComparisonError = {
  type: 'MemberComparisonError',
  message: string,
  mismatchedMembers: Array<{
    member: string,
    fault?: TypeComparisonError,
  }>,
  previousError?: TypeComparisonError,
};
export type TypeComparisonError =
  | TypeAnnotationComparisonError
  | TypeInformationComparisonError
  | PropertyComparisonError
  | PositionalComparisonError
  | MemberComparisonError;

// Collects changes that may be type safe within parameters, unions, intersections, and tuples
export type PositionalComparisonResult = {
  typeKind: 'stringUnion' | 'union' | 'intersection' | 'parameter' | 'tuple',
  // Nested changes stores the position of the old type followed by new
  // Except for union and intersection, new position === old position
  nestedChanges: Array<[number, number, ComparisonResult]>,
  // These properties should never occur for a tuple
  addedElements?: Array<[number, CompleteTypeAnnotation]>,
  removedElements?: Array<[number, CompleteTypeAnnotation]>,
  ...
};
export type FunctionComparisonResult = {
  returnType?: ComparisonResult,
  // The following should always have typeKind 'parameter'
  parameterTypes?: PositionalComparisonResult,
  ...
};

// Array<NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>>

export type PropertiesComparisonResult = {
  addedProperties?: ReadonlyArray<NamedShape<CompleteTypeAnnotation>>,
  missingProperties?: ReadonlyArray<NamedShape<CompleteTypeAnnotation>>,
  errorProperties?: Array<{
    property: string,
    fault?: TypeComparisonError,
    ...
  }>,
  madeStrict?: Array<{
    property: string,
    furtherChanges?: ComparisonResult,
    ...
  }>,
  madeOptional?: Array<{
    property: string,
    furtherChanges?: ComparisonResult,
    ...
  }>,
  nestedPropertyChanges?: Array<[string, ComparisonResult]>,
  ...
};
export type EnumMembersComparisonResult = {
  memberKind: 'enum',
  addedMembers?: Array<NativeModuleEnumMember>,
  missingMembers?: Array<NativeModuleEnumMember>,
  errorMembers?: Array<{
    member: string,
    fault?: TypeComparisonError,
  }>,
};
export type UnionMembersComparisonResult = {
  memberKind: 'union',
  addedMembers?: Array<CompleteTypeAnnotation>,
  missingMembers?: Array<CompleteTypeAnnotation>,
  errorMembers?: Array<{
    member: string,
    fault?: TypeComparisonError,
  }>,
};
export type MembersComparisonResult =
  | EnumMembersComparisonResult
  | UnionMembersComparisonResult;
export type NullableComparisonResult = {
  /* Four possible cases of change:
     void goes to T?   :: typeRefined !optionsReduced
     T?   goes to void :: typeRefined optionsReduced
     T    goes to T?   :: !typeRefined !optionsReduced
     T?   goes to T    :: !typeRefined optionsReduced
  */
  typeRefined: boolean,
  optionsReduced: boolean,
  // interiorLog not available if either type is void
  interiorLog: ?ComparisonResult,
  newType: ?CompleteTypeAnnotation,
  oldType: ?CompleteTypeAnnotation,
  ...
};
export type ComparisonResult =
  | {status: 'matching'}
  | {status: 'skipped'}
  | {
      status: 'nullableChange',
      nullableLog: NullableComparisonResult,
      errorLog?: TypeComparisonError,
    }
  | {
      status: 'properties',
      propertyLog: PropertiesComparisonResult,
      errorLog?: TypeComparisonError,
    }
  | {
      status: 'members',
      memberLog: MembersComparisonResult,
      errorLog?: TypeComparisonError,
    }
  | {
      status: 'functionChange',
      functionChangeLog: FunctionComparisonResult,
      errorLog?: TypeComparisonError,
    }
  | {
      status: 'positionalTypeChange',
      changeLog: PositionalComparisonResult,
      errorLog?: TypeComparisonError,
    }
  | {status: 'error', errorLog: TypeComparisonError};

export function isPropertyLogEmpty(
  result: PropertiesComparisonResult,
): boolean {
  return !(
    result.addedProperties ||
    result.missingProperties ||
    result.nestedPropertyChanges ||
    result.madeStrict ||
    result.madeOptional ||
    result.errorProperties
  );
}

export function isMemberLogEmpty(result: MembersComparisonResult): boolean {
  return !(result.addedMembers || result.missingMembers || result.errorMembers);
}

export function isFunctionLogEmpty(result: FunctionComparisonResult): boolean {
  return !(result.returnType || result.parameterTypes);
}

export function makeError(error: TypeComparisonError): ComparisonResult {
  return {
    status: 'error',
    errorLog: error,
  };
}

export function typeInformationComparisonError(
  message: string,
  newerAnnotation: CompleteTypeAnnotation,
  olderAnnotation: CompleteTypeAnnotation,
  previousError?: TypeComparisonError,
): TypeComparisonError {
  return {
    type: 'TypeInformationComparisonError',
    message,
    newerAnnotation,
    olderAnnotation,
    previousError,
  };
}

export function typeAnnotationComparisonError(
  message: string,
  newerAnnotation: CompleteTypeAnnotation,
  olderAnnotation: CompleteTypeAnnotation,
  previousError?: TypeComparisonError,
): TypeComparisonError {
  return {
    type: 'TypeAnnotationComparisonError',
    message,
    newerAnnotation,
    olderAnnotation,
    previousError,
  };
}

export function propertyComparisonError(
  message: string,
  mismatchedProperties: Array<{
    property: string,
    fault?: TypeComparisonError,
    ...
  }>,
  previousError?: TypeComparisonError,
): TypeComparisonError {
  return {
    type: 'PropertyComparisonError',
    message,
    mismatchedProperties,
    previousError,
  };
}

export function memberComparisonError(
  message: string,
  mismatchedMembers: Array<{
    member: string,
    fault?: TypeComparisonError,
  }>,
  previousError?: TypeComparisonError,
): TypeComparisonError {
  return {
    type: 'MemberComparisonError',
    message,
    mismatchedMembers,
    previousError,
  };
}

export function positionalComparisonError(
  message: string,
  erroneousItems: Array<[number, CompleteTypeAnnotation]>,
  previousError?: TypeComparisonError,
): TypeComparisonError {
  return {
    type: 'PositionalComparisonError',
    message,
    erroneousItems,
    previousError,
  };
}
