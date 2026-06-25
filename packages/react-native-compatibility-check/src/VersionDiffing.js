/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  ComparisonResult,
  FunctionComparisonResult,
  MembersComparisonResult,
  NullableComparisonResult,
  PositionalComparisonResult,
  PropertiesComparisonResult,
  TypeComparisonError,
} from './ComparisonResult';
import type {
  DiffSet,
  DiffSummary,
  ErrorCode,
  ErrorStore,
  IncompatiblityReport,
  NativeSpecErrorStore,
  ObjectTypeChangeStore,
  SchemaDiff,
} from './DiffResults';
import type {
  CompleteTypeAnnotation,
  ComponentSchema,
  NamedShape,
  NativeModuleSchema,
  SchemaType,
} from '@react-native/codegen/src/CodegenSchema';

import {
  memberComparisonError,
  positionalComparisonError,
  propertyComparisonError,
  typeAnnotationComparisonError,
  typeInformationComparisonError,
} from './ComparisonResult.js';
import convertPropToBasicTypes from './convertPropToBasicTypes';
import * as codegenTypeDiffing from './TypeDiffing';

type BoundaryDirection = 'toNative' | 'fromNative' | 'both';

type checkerType = (
  propertyChange: ?PropertiesComparisonResult,
  positionalChange: ?PositionalComparisonResult,
  nullableChange: ?NullableComparisonResult,
  memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
) => Array<ErrorStore>;

// Helper to wrap an error with path context (property, parameter, element, etc.)
function wrapErrorWithPathContext(
  error: ErrorStore,
  message: string,
  pathContext: ?TypeComparisonError,
  propertyName?: ?string,
): ErrorStore {
  const wrappedError: TypeComparisonError =
    pathContext?.type === 'TypeAnnotationComparisonError' ||
    pathContext?.type === 'TypeInformationComparisonError'
      ? typeAnnotationComparisonError(
          message,
          pathContext.newerAnnotation,
          pathContext.olderAnnotation,
          error.errorInformation,
        )
      : error.errorInformation;

  if (propertyName != null) {
    return {
      ...error,
      errorInformation: propertyComparisonError(
        'Object contained a property with a type mismatch',
        [{property: propertyName, fault: wrappedError}],
      ),
    };
  }

  return {
    ...error,
    errorInformation: wrappedError,
  };
}

function nestedPropertiesCheck(
  typeName: string,
  result: ComparisonResult,
  check: checkerType,
  inverseCheck: checkerType,
  pathContext?: ?TypeComparisonError,
): Array<ErrorStore> {
  switch (result.status) {
    case 'error':
    case 'matching':
    case 'skipped':
      throw new Error(
        'Internal error: nested property change ' + result.status,
      );
    case 'properties':
      let finalResult = check(
        result.propertyLog,
        null,
        null,
        null,
        typeName,
        pathContext ?? null,
      );
      if (result.propertyLog.nestedPropertyChanges) {
        const nestedErrors = result.propertyLog.nestedPropertyChanges.flatMap(
          ([propertyName, nestedResult]) => {
            // Recurse with the same typeName (don't extend it)
            const errors = nestedPropertiesCheck(
              typeName,
              nestedResult,
              check,
              inverseCheck,
              nestedResult.errorLog ?? null,
            );
            // Wrap each error with the property path context
            return errors.map(error =>
              wrapErrorWithPathContext(
                error,
                'has conflicting type changes',
                nestedResult.errorLog,
                propertyName,
              ),
            );
          },
        );
        finalResult = finalResult.concat(nestedErrors);
      }
      if (result.propertyLog.madeOptional) {
        const furtherNestedProps = result.propertyLog.madeOptional.filter(
          optionalProp => optionalProp.furtherChanges,
        );
        if (furtherNestedProps && furtherNestedProps.length > 0) {
          const nestedErrors = furtherNestedProps.flatMap(optionalProp => {
            if (optionalProp.furtherChanges) {
              const errors = nestedPropertiesCheck(
                typeName,
                optionalProp.furtherChanges,
                check,
                inverseCheck,
                optionalProp.furtherChanges.errorLog ?? null,
              );
              return errors.map(error =>
                wrapErrorWithPathContext(
                  error,
                  'has conflicting type changes',
                  optionalProp.furtherChanges?.errorLog,
                  optionalProp.property,
                ),
              );
            }
            throw new Error('Internal error, filter failed');
          });
          finalResult = finalResult.concat(nestedErrors);
        }
      }
      return finalResult;
    case 'members':
      return check(null, null, null, result.memberLog, typeName, null);
    case 'functionChange':
      let returnTypeResult: Array<ErrorStore> = [];
      if (result.functionChangeLog.returnType) {
        returnTypeResult = nestedPropertiesCheck(
          typeName,
          result.functionChangeLog.returnType,
          check,
          inverseCheck,
          result.functionChangeLog.returnType.errorLog ?? null,
        );
      }
      if (result.functionChangeLog.parameterTypes) {
        const parameterErrors =
          result.functionChangeLog.parameterTypes.nestedChanges.flatMap(
            ([_oldParameterNumber, newParameterNumber, nestedResult]) => {
              // Recurse with the same typeName (don't extend it)
              const errors = nestedPropertiesCheck(
                typeName,
                nestedResult,
                inverseCheck,
                check,
                nestedResult.errorLog ?? null,
              );
              // Wrap each error with the parameter path context
              return errors.map(error =>
                wrapErrorWithPathContext(
                  error,
                  `Parameter at index ${newParameterNumber} did not match`,
                  nestedResult.errorLog,
                ),
              );
            },
          );
        return returnTypeResult.concat(parameterErrors);
      }
      return returnTypeResult;
    case 'positionalTypeChange':
      const changeLog = result.changeLog;
      const currentPositionalCheck = check(
        null,
        changeLog,
        null,
        null,
        typeName,
        null,
      );
      const positionalNestedErrors = changeLog.nestedChanges.flatMap(
        ([_oldIndex, newIndex, nestedResult]) => {
          const errors = nestedPropertiesCheck(
            typeName,
            nestedResult,
            check,
            inverseCheck,
            nestedResult.errorLog ?? null,
          );
          return errors.map(error =>
            wrapErrorWithPathContext(
              error,
              `Element ${newIndex} of ${changeLog.typeKind} did not match`,
              nestedResult.errorLog,
            ),
          );
        },
      );
      return currentPositionalCheck.concat(positionalNestedErrors);
    case 'nullableChange':
      const currentCheck = check(
        null,
        null,
        result.nullableLog,
        null,
        typeName,
        null,
      );
      if (result.nullableLog.interiorLog) {
        const interiorLog = result.nullableLog.interiorLog;
        switch (interiorLog.status) {
          case 'matching':
            return currentCheck;
          case 'properties':
          case 'functionChange':
          case 'positionalTypeChange':
          case 'nullableChange':
            return currentCheck.concat(
              nestedPropertiesCheck(
                typeName,
                interiorLog,
                check,
                inverseCheck,
                interiorLog.errorLog ?? null,
              ),
            );
          default:
            throw new Error(
              'Internal error: nested with error or skipped status',
            );
        }
      }
      return currentCheck;
    default:
      result.status as empty;
      return [];
  }
}

function checkOptionalityAndSetError(
  typeName: string,
  properties: ReadonlyArray<NamedShape<CompleteTypeAnnotation>>,
  msg: string,
  errorCode: ErrorCode,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  const requiredProperties = properties.filter(
    objectTypeProperty => !objectTypeProperty.optional,
  );
  if (requiredProperties.length > 0) {
    return [
      {
        typeName,
        errorCode,
        errorInformation: propertyComparisonError(
          msg,
          requiredProperties.map(property => ({
            property: property.name,
          })),
          pathContext ?? undefined,
        ),
      },
    ];
  }
  return [];
}

// Exported for testing
export const removedPropertiesMessage =
  'Object removed required properties expected by native';
function checkForUnsafeRemovedProperties(
  propertyChange: ?PropertiesComparisonResult,
  _postionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (propertyChange && propertyChange.missingProperties) {
    return checkOptionalityAndSetError(
      typeName,
      propertyChange.missingProperties,
      removedPropertiesMessage,
      'removedProps',
      pathContext,
    );
  }
  return [];
}

export const addedPropertiesMessage =
  'Object added required properties, which native will not provide';
function checkForUnsafeAddedProperties(
  propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (propertyChange && propertyChange.addedProperties) {
    return checkOptionalityAndSetError(
      typeName,
      propertyChange.addedProperties,
      addedPropertiesMessage,
      'addedProps',
      pathContext,
    );
  }
  return [];
}

export const stricterPropertiesMessage =
  'Property made strict, but native may not provide it';
function checkForUnSafeMadeStrictProperties(
  propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (
    propertyChange &&
    propertyChange.madeStrict &&
    propertyChange.madeStrict.length > 0
  ) {
    const err = propertyComparisonError(
      stricterPropertiesMessage,
      propertyChange.madeStrict.map(property => ({
        property: property.property,
      })),
      pathContext ?? undefined,
    );
    return [
      {
        typeName,
        errorCode: 'requiredProps',
        errorInformation: err,
      },
    ];
  }
  return [];
}

export const tooOptionalPropertiesMessage =
  'Property made optional, but native requires it';
function checkForUnSafeMadeOptionalProperties(
  propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (
    propertyChange &&
    propertyChange.madeOptional &&
    propertyChange.madeOptional.length > 0
  ) {
    const err = propertyComparisonError(
      tooOptionalPropertiesMessage,
      propertyChange.madeOptional.map(property => ({
        property: property.property,
      })),
      pathContext ?? undefined,
    );
    return [
      {
        typeName,
        errorCode: 'optionalProps',
        errorInformation: err,
      },
    ];
  }
  return [];
}

export const removedEnumMessage =
  'Enum removed items, but native may still provide them';
export const removedUnionMessage =
  'Union removed items, but native may still provide them';
function checkForUnsafeRemovedMemberItems(
  _propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (memberChange == null) {
    return [];
  }

  // Check memberKind first to narrow the type, then access members
  if (memberChange.memberKind === 'enum') {
    const missingMembers = memberChange.missingMembers;
    if (missingMembers && missingMembers.length > 0) {
      return [
        {
          typeName,
          errorCode: 'removedMemberCases',
          errorInformation: memberComparisonError(
            removedEnumMessage,
            missingMembers.map(member => ({
              member: member.name,
            })),
            pathContext ?? undefined,
          ),
        },
      ];
    }
  } else {
    const missingMembers = memberChange.missingMembers;
    if (missingMembers && missingMembers.length > 0) {
      return [
        {
          typeName,
          errorCode: 'removedMemberCases',
          errorInformation: memberComparisonError(
            removedUnionMessage,
            missingMembers.map(member => ({
              member: getTypeAnnotationLabel(member),
            })),
            pathContext ?? undefined,
          ),
        },
      ];
    }
  }

  return [];
}

export const addedEnumMessage =
  'Enum added items, but native will not expect/support them';
export const addedUnionMessage =
  'Union added items, but native will not expect/support them';
function checkForUnsafeAddedMemberItems(
  _propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (memberChange == null) {
    return [];
  }

  // Check memberKind first to narrow the type, then access members
  if (memberChange.memberKind === 'enum') {
    const addedMembers = memberChange.addedMembers;
    if (addedMembers && addedMembers.length > 0) {
      return [
        {
          typeName,
          errorCode: 'addedMemberCases',
          errorInformation: memberComparisonError(
            addedEnumMessage,
            addedMembers.map(member => ({
              member: member.name,
            })),
            pathContext ?? undefined,
          ),
        },
      ];
    }
  } else {
    const addedMembers = memberChange.addedMembers;
    if (addedMembers && addedMembers.length > 0) {
      return [
        {
          typeName,
          errorCode: 'addedMemberCases',
          errorInformation: memberComparisonError(
            addedUnionMessage,
            addedMembers.map(member => ({
              member: getTypeAnnotationLabel(member),
            })),
            pathContext ?? undefined,
          ),
        },
      ];
    }
  }

  return [];
}

// Helper function to get a descriptive label for a CompleteTypeAnnotation
function getTypeAnnotationLabel(type: CompleteTypeAnnotation): string {
  if (type.type === 'StringLiteralTypeAnnotation') {
    return `"${type.value}"`;
  } else if (type.type === 'NumberLiteralTypeAnnotation') {
    return String(type.value);
  } else if (type.type === 'BooleanLiteralTypeAnnotation') {
    return String(type.value);
  } else if (type.type === 'NullableTypeAnnotation') {
    return `?${getTypeAnnotationLabel(type.typeAnnotation)}`;
  } else if (type.type === 'TypeAliasTypeAnnotation') {
    return type.name;
  } else {
    return type.type;
  }
}

export const removedIntersectionMessage =
  'Intersection removed items, but native may still require properties contained in them';
function checkForUnsafeRemovedIntersectionItems(
  _propertyChange: ?PropertiesComparisonResult,
  positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (
    positionalChange &&
    positionalChange.typeKind === 'intersection' &&
    positionalChange.removedElements &&
    positionalChange.removedElements.length > 0
  ) {
    return [
      {
        typeName,
        errorCode: 'removedIntersectCases',
        errorInformation: positionalComparisonError(
          removedIntersectionMessage,
          positionalChange.removedElements,
          pathContext ?? undefined,
        ),
      },
    ];
  }
  return [];
}

export const addedIntersectionMessage =
  'Intersection added items, but native may not provide all required attributes';
function checkForUnsafeAddedIntersectionItems(
  _propertyChange: ?PropertiesComparisonResult,
  positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (
    positionalChange &&
    positionalChange.typeKind === 'intersection' &&
    positionalChange.addedElements &&
    positionalChange.addedElements.length > 0
  ) {
    return [
      {
        typeName,
        errorCode: 'addedIntersectCases',
        errorInformation: positionalComparisonError(
          addedIntersectionMessage,
          positionalChange.addedElements,
          pathContext ?? undefined,
        ),
      },
    ];
  }
  return [];
}

export const toNativeVoidChangeMessage =
  'Native may not be able to safely handle presence of type';
export const typeNullableChangeMessage =
  'Type made nullable, but native requires it';
function checkForUnsafeNullableToNativeChange(
  _propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (
    nullableChange &&
    !nullableChange.optionsReduced &&
    nullableChange.newType &&
    nullableChange.oldType
  ) {
    return [
      {
        typeName,
        errorCode: 'nullableOfNonNull',
        errorInformation: typeAnnotationComparisonError(
          nullableChange.typeRefined
            ? toNativeVoidChangeMessage
            : typeNullableChangeMessage,
          nullableChange.newType,
          nullableChange.oldType,
          pathContext ?? undefined,
        ),
      },
    ];
  }
  return [];
}

export const fromNativeVoidChangeMessage =
  'Type set to void but native may still provide a value';
export const typeNonNullableChangeMessage =
  'Type made non-nullable, but native might provide null still';
function checkForUnsafeNullableFromNativeChange(
  _propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
  pathContext: ?TypeComparisonError,
): Array<ErrorStore> {
  if (
    nullableChange &&
    nullableChange.optionsReduced &&
    nullableChange.newType &&
    nullableChange.oldType
  ) {
    return [
      {
        typeName,
        errorCode: 'nonNullableOfNull',
        errorInformation: typeAnnotationComparisonError(
          nullableChange.typeRefined
            ? fromNativeVoidChangeMessage
            : typeNonNullableChangeMessage,
          nullableChange.newType,
          nullableChange.oldType,
          pathContext ?? undefined,
        ),
      },
    ];
  }
  return [];
}

function chainPropertiesChecks(checks: Array<checkerType>): checkerType {
  return (
    propertyChange: ?PropertiesComparisonResult,
    positionalChange: ?PositionalComparisonResult,
    nullableChange: ?NullableComparisonResult,
    memberChange: ?MembersComparisonResult,
    typeName: string,
    pathContext: ?TypeComparisonError,
  ) =>
    checks.reduce(
      (errorStore, checker) =>
        errorStore.concat(
          checker(
            propertyChange,
            positionalChange,
            nullableChange,
            memberChange,
            typeName,
            pathContext,
          ),
        ),
      [],
    );
}

function compareFunctionTypesInContext(
  typeName: string,
  functionLog: FunctionComparisonResult,
  functionErrorLog: ?TypeComparisonError,
  check: checkerType,
  inversecheck: checkerType,
  result: Array<ErrorStore>,
) {
  if (functionLog.returnType) {
    result = result.concat(
      nestedPropertiesCheck(
        typeName,
        functionLog.returnType,
        check,
        inversecheck,
      ),
    );
  }
  if (
    functionLog.parameterTypes &&
    functionLog.parameterTypes.nestedChanges.length > 0
  ) {
    const parameterErrors = functionLog.parameterTypes.nestedChanges.flatMap(
      ([_oldPropertyNum, newPropertyNum, nestedResult]) => {
        const errors = nestedPropertiesCheck(
          typeName,
          nestedResult,
          inversecheck,
          check,
        );
        // Wrap each error with the parameter path context
        return errors.map(error =>
          wrapErrorWithPathContext(
            error,
            `Parameter at index ${newPropertyNum} did not match`,
            nestedResult.errorLog,
          ),
        );
      },
    );
    result = result.concat(parameterErrors);
  }
  return result;
}

// Deleting optional properties is safe and
// Making required properties optional is unsafe.
// Adding to unions and enums is unsafe, as is removing from intersections
// Changing nullable is similar to changing a union
const checksForTypesFlowingToNative: checkerType = chainPropertiesChecks([
  checkForUnsafeRemovedProperties,
  checkForUnSafeMadeOptionalProperties,
  checkForUnsafeAddedMemberItems,
  checkForUnsafeRemovedIntersectionItems,
  checkForUnsafeNullableToNativeChange,
]);
// Adding optional properties is safe, otherwise incompatible
// Making optional properties required is unsafe.
// Removing from unions and enums is unsafe, as is adding to intersections
// Changing nullable is similar to changing a union
const checksForTypesFlowingFromNative: checkerType = chainPropertiesChecks([
  checkForUnsafeAddedProperties,
  checkForUnSafeMadeStrictProperties,
  checkForUnsafeRemovedMemberItems,
  checkForUnsafeAddedIntersectionItems,
  checkForUnsafeNullableFromNativeChange,
]);
export function assessComparisonResult(
  newTypes: Set<{
    typeName: string,
    typeInformation: CompleteTypeAnnotation,
    ...
  }>,
  deprecatedTypes: Set<{
    typeName: string,
    typeInformation: CompleteTypeAnnotation,
    ...
  }>,
  incompatibleChanges: Set<ErrorStore>,
  objectTypeChanges: Set<ObjectTypeChangeStore>,
): (
  typeName: string,
  newType: CompleteTypeAnnotation,
  oldType: ?CompleteTypeAnnotation,
  difference: ComparisonResult,
  oldDirection: BoundaryDirection,
) => void {
  return (
    typeName: string,
    newType: CompleteTypeAnnotation,
    oldType: ?CompleteTypeAnnotation,
    difference: ComparisonResult,
    oldDirection: BoundaryDirection,
  ) => {
    switch (difference.status) {
      case 'matching':
        break;
      case 'skipped':
        newTypes.add({
          typeName,
          typeInformation: newType,
        });
        break;
      case 'members':
        {
          const memberChange = difference.memberLog;

          const toNativeErrorResult = checksForTypesFlowingToNative(
            null,
            null,
            null,
            memberChange,
            typeName,
            difference.errorLog,
          );

          const fromNativeErrorResult = checksForTypesFlowingFromNative(
            null,
            null,
            null,
            memberChange,
            typeName,
            difference.errorLog,
          );

          switch (oldDirection) {
            case 'toNative':
              toNativeErrorResult.forEach(error =>
                incompatibleChanges.add(error),
              );
              break;
            case 'fromNative':
              fromNativeErrorResult.forEach(error =>
                incompatibleChanges.add(error),
              );
              break;
            case 'both':
              toNativeErrorResult.forEach(error =>
                incompatibleChanges.add(error),
              );
              fromNativeErrorResult.forEach(error =>
                incompatibleChanges.add(error),
              );
              break;
          }
        }
        break;
      case 'properties':
        const propertyChange = difference.propertyLog;
        const unsafeForToNative = nestedPropertiesCheck(
          typeName,
          difference,
          checksForTypesFlowingToNative,
          checksForTypesFlowingFromNative,
        );
        const unsafeForFromNative = nestedPropertiesCheck(
          typeName,
          difference,
          checksForTypesFlowingFromNative,
          checksForTypesFlowingToNative,
        );

        switch (oldDirection) {
          case 'toNative':
            unsafeForToNative.forEach(error => incompatibleChanges.add(error));
            break;
          case 'fromNative':
            unsafeForFromNative.forEach(error =>
              incompatibleChanges.add(error),
            );
            break;
          case 'both':
            unsafeForToNative.forEach(error => incompatibleChanges.add(error));
            unsafeForFromNative.forEach(error =>
              incompatibleChanges.add(error),
            );
            break;
        }

        if (!oldType) {
          throw new Error('Internal error: properties change with no old type');
        }
        objectTypeChanges.add({
          typeName,
          newType,
          oldType,
          propertyChange,
        });
        break;
      case 'error':
        incompatibleChanges.add({
          typeName,
          errorCode: 'incompatibleTypes',
          errorInformation: difference.errorLog,
        });
        break;
      case 'functionChange':
        const functionLog = difference.functionChangeLog;
        let propertyErrors: Array<ErrorStore> = [];
        switch (oldDirection) {
          case 'toNative':
            propertyErrors = compareFunctionTypesInContext(
              typeName,
              functionLog,
              difference.errorLog,
              checksForTypesFlowingToNative,
              checksForTypesFlowingFromNative,
              propertyErrors,
            );
            break;
          case 'fromNative':
            propertyErrors = compareFunctionTypesInContext(
              typeName,
              functionLog,
              difference.errorLog,
              checksForTypesFlowingFromNative,
              checksForTypesFlowingToNative,
              propertyErrors,
            );
            break;
          case 'both':
            propertyErrors = compareFunctionTypesInContext(
              typeName,
              functionLog,
              difference.errorLog,
              checksForTypesFlowingToNative,
              checksForTypesFlowingFromNative,
              propertyErrors,
            );
            propertyErrors = compareFunctionTypesInContext(
              typeName,
              functionLog,
              difference.errorLog,
              checksForTypesFlowingFromNative,
              checksForTypesFlowingToNative,
              propertyErrors,
            );
            break;
          default:
            oldDirection as empty;
            throw new Error(
              'Unsupported native boundary direction ' + oldDirection,
            );
        }
        propertyErrors.forEach(error => incompatibleChanges.add(error));
        break;
      case 'positionalTypeChange':
        const changeLog = difference.changeLog;
        if (
          changeLog.nestedChanges.length > 0 ||
          changeLog.addedElements ||
          changeLog.removedElements
        ) {
          const changes = changeLog.nestedChanges;
          const toNativeBase = checksForTypesFlowingToNative(
            null,
            changeLog,
            null,
            null,
            typeName,
            null,
          );
          const toNativeNestedErrors = changes.flatMap(
            ([_oldIndex, newIndex, nestedResult]) => {
              const errors = nestedPropertiesCheck(
                typeName,
                nestedResult,
                checksForTypesFlowingToNative,
                checksForTypesFlowingFromNative,
              );
              return errors.map(error =>
                wrapErrorWithPathContext(
                  error,
                  `Element ${newIndex} of ${changeLog.typeKind} did not match`,
                  nestedResult.errorLog,
                ),
              );
            },
          );
          const toNativeResult = toNativeBase.concat(toNativeNestedErrors);
          const fromNativeBase = checksForTypesFlowingFromNative(
            null,
            changeLog,
            null,
            null,
            typeName,
            null,
          );
          const fromNativeNestedErrors = changes.flatMap(
            ([_oldIndex, newIndex, nestedResult]) => {
              const errors = nestedPropertiesCheck(
                typeName,
                nestedResult,
                checksForTypesFlowingFromNative,
                checksForTypesFlowingToNative,
              );
              return errors.map(error =>
                wrapErrorWithPathContext(
                  error,
                  `Element ${newIndex} of ${changeLog.typeKind} did not match`,
                  nestedResult.errorLog,
                ),
              );
            },
          );
          const fromNativeResult = fromNativeBase.concat(
            fromNativeNestedErrors,
          );
          switch (oldDirection) {
            case 'toNative':
              toNativeResult.forEach(error => incompatibleChanges.add(error));
              break;
            case 'fromNative':
              fromNativeResult.forEach(error => incompatibleChanges.add(error));
              break;
            case 'both':
              toNativeResult.forEach(error => incompatibleChanges.add(error));
              fromNativeResult.forEach(error => incompatibleChanges.add(error));
              break;
          }
        }
        break;
      case 'nullableChange':
        if (!oldType) {
          throw new Error(
            'Internal error: old type null or undefined, after nullableChange',
          );
        }
        switch (oldDirection) {
          case 'toNative':
            checkForUnsafeNullableToNativeChange(
              null,
              null,
              difference.nullableLog,
              null,
              typeName,
              difference.errorLog,
            ).forEach(error => incompatibleChanges.add(error));
            break;
          case 'fromNative':
            checkForUnsafeNullableFromNativeChange(
              null,
              null,
              difference.nullableLog,
              null,
              typeName,
              difference.errorLog,
            ).forEach(error => incompatibleChanges.add(error));
            break;
          case 'both':
            const err = typeInformationComparisonError(
              'Type may not change nullability, due to flowing to and from native',
              newType,
              oldType,
              difference.errorLog,
            );
            incompatibleChanges.add({
              typeName,
              errorCode: 'incompatibleTypes',
              errorInformation: err,
            });
            break;
          default:
            oldDirection as empty;
            throw new Error('Unknown direction : ' + oldDirection);
        }
        /* $FlowFixMe[prop-missing] (>=0.68.0 site=react_native_fb) This
         * comment suppresses an error found when Flow v0.68 was deployed. To
         * see the error delete this comment and run Flow. */
        if (difference.interiorLog) {
          const log = difference.interiorLog;
          assessComparisonResult(
            newTypes,
            deprecatedTypes,
            incompatibleChanges,
            objectTypeChanges,
          )(typeName, newType, oldType, log, oldDirection);
        }
        break;
      default:
        difference.status as empty;
        throw new Error('Unsupported status: ' + difference.status);
    }
  };
}

function buildNativeModulesDiff(
  newerNativeModule: NativeModuleSchema,
  olderNativeModule: NativeModuleSchema,
): Set<NativeSpecErrorStore> {
  const moduleErrors = new Set<NativeSpecErrorStore>();

  const nativeModuleName = newerNativeModule.moduleName;
  if (olderNativeModule.moduleName !== newerNativeModule.moduleName) {
    // old was removed
    moduleErrors.add({
      nativeSpecName: olderNativeModule.moduleName,
      omitted: true,
      errorCode: 'removedModule',
    });
  }

  const newTypes = new Set<{
    typeInformation: CompleteTypeAnnotation,
    typeName: string,
    ...
  }>();
  const deprecatedTypes = new Set<{
    typeInformation: CompleteTypeAnnotation,
    typeName: string,
    ...
  }>();
  const incompatibleChanges = new Set<ErrorStore>();
  const objectTypeChanges = new Set<ObjectTypeChangeStore>();
  const localAssessComparison = assessComparisonResult(
    newTypes,
    deprecatedTypes,
    incompatibleChanges,
    objectTypeChanges,
  );

  const newType: CompleteTypeAnnotation = {
    type: 'ObjectTypeAnnotation',
    properties: [
      ...newerNativeModule.spec.methods,
      ...newerNativeModule.spec.eventEmitters,
    ],
  };
  const oldType: CompleteTypeAnnotation = {
    type: 'ObjectTypeAnnotation',
    properties: [
      ...olderNativeModule.spec.methods,
      ...olderNativeModule.spec.eventEmitters,
    ],
  };

  const difference = codegenTypeDiffing.compareTypes(
    newType,
    olderNativeModule.moduleName === newerNativeModule.moduleName
      ? oldType
      : null,
    newerNativeModule.aliasMap,
    olderNativeModule.aliasMap,
    newerNativeModule.enumMap,
    olderNativeModule.enumMap,
  );

  localAssessComparison(
    nativeModuleName,
    newType,
    oldType,
    difference,
    // Since we are explicitly checking the native module, we know it is starting as fromNative
    'fromNative',
  );

  const typeUpdate = {
    newTypes,
    deprecatedTypes,
    incompatibleChanges,
    objectTypeChanges,
  };
  if (hasCodegenUpdatesTypes(typeUpdate)) {
    moduleErrors.add({
      nativeSpecName: nativeModuleName,
      omitted: false,
      errorCode: 'incompatibleTypes',
      changeInformation: typeUpdate,
    });
  }

  return moduleErrors;
}

function buildNativeComponentsDiff(
  newerNativeSchema: ComponentSchema,
  olderNativeSchema: ComponentSchema,
): Set<NativeSpecErrorStore> {
  const componentErrors = new Set<NativeSpecErrorStore>();

  Object.entries(newerNativeSchema.components).forEach(
    ([newerComponentName, newerComponent]) => {
      const olderComponent = olderNativeSchema.components[newerComponentName];

      const newTypes = new Set<{
        typeInformation: CompleteTypeAnnotation,
        typeName: string,
        ...
      }>();
      const deprecatedTypes = new Set<{
        typeInformation: CompleteTypeAnnotation,
        typeName: string,
        ...
      }>();
      const incompatibleChanges = new Set<ErrorStore>();
      const objectTypeChanges = new Set<ObjectTypeChangeStore>();
      const localAssessComparison = assessComparisonResult(
        newTypes,
        deprecatedTypes,
        incompatibleChanges,
        objectTypeChanges,
      );

      /* Commands */
      // We are intentionally allowing new commands to be added
      // even though they could result in an OTA issue if the command
      // is called immediately and the native side throws on unrecognized
      // commands. There is no way to do feature detection of commands
      // today to protect against that.
      // We are choosing to allow this change to be made since we previously
      // had no protection for commands at all.
      // See https://fb.workplace.com/groups/615693552291894/posts/1905124013348835
      // for more information.
      newerComponent.commands.forEach(command => {
        const oldCommand = olderComponent.commands?.find(
          olderCommand => olderCommand.name === command.name,
        );

        const newCommands: CompleteTypeAnnotation = {
          type: 'ObjectTypeAnnotation',
          properties: [command],
        };
        const oldCommands: ?CompleteTypeAnnotation =
          oldCommand != null
            ? {
                type: 'ObjectTypeAnnotation',
                properties: [oldCommand],
              }
            : null;

        const difference = codegenTypeDiffing.compareTypes(
          newCommands,
          oldCommands,
          {},
          {},
          {},
          {},
        );

        localAssessComparison(
          newerComponentName,
          newCommands,
          oldCommands,
          difference,
          // Since we are explicitly checking the native module, we know it is starting as fromNative
          'fromNative',
        );
      });

      olderComponent.commands?.forEach(command => {
        const newCommand = newerComponent.commands.find(
          newerCommand => newerCommand.name === command.name,
        );

        if (newCommand == null) {
          deprecatedTypes.add({
            typeName: command.name,
            typeInformation: {
              type: 'ObjectTypeAnnotation',
              properties: [command],
            },
          });
        }
      });
      /* End Commands */

      // We have to do this to remove the .defaults from the props and get it into
      // standard JavaScript shapes.
      const newConvertedProps: CompleteTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        properties: newerComponent.props.map(prop => ({
          name: prop.name,
          optional: prop.optional,
          typeAnnotation: convertPropToBasicTypes(prop.typeAnnotation),
        })),
      };
      const oldConvertedProps: CompleteTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        properties: olderComponent.props.map(prop => ({
          name: prop.name,
          optional: prop.optional,
          typeAnnotation: convertPropToBasicTypes(prop.typeAnnotation),
        })),
      };

      const propDifference = codegenTypeDiffing.compareTypes(
        newConvertedProps,
        oldConvertedProps,
        {},
        {},
        {},
        {},
      );

      localAssessComparison(
        newerComponentName,
        newConvertedProps,
        oldConvertedProps,
        propDifference,
        'toNative',
      );

      const typeUpdate = {
        newTypes,
        deprecatedTypes,
        incompatibleChanges,
        objectTypeChanges,
      };
      if (hasCodegenUpdatesTypes(typeUpdate)) {
        componentErrors.add({
          nativeSpecName: newerComponentName,
          omitted: false,
          errorCode: 'incompatibleTypes',
          changeInformation: typeUpdate,
        });
      }
    },
  );

  Object.keys(olderNativeSchema.components).forEach(olderComponentName => {
    const newerComponent = newerNativeSchema.components[olderComponentName];

    if (newerComponent == null) {
      // Component is missing in new schema
      componentErrors.add({
        nativeSpecName: olderComponentName,
        omitted: true,
        errorCode: 'removedComponent',
      });
    }
  });

  return componentErrors;
}

export function hasUpdatesTypes(diff: DiffSet): boolean {
  return (
    diff.newTypes.size > 0 ||
    diff.deprecatedTypes.size > 0 ||
    diff.objectTypeChanges.size > 0 ||
    diff.incompatibleChanges.size > 0
  );
}

export function hasCodegenUpdatesTypes(diff: DiffSet): boolean {
  return (
    diff.newTypes.size > 0 ||
    diff.deprecatedTypes.size > 0 ||
    diff.objectTypeChanges.size > 0 ||
    diff.incompatibleChanges.size > 0
  );
}

export function buildSchemaDiff(
  newerSchemaSet: SchemaType,
  olderSchemaSet: SchemaType,
): Set<SchemaDiff> {
  const diff: Set<SchemaDiff> = new Set();
  const newerSchema = newerSchemaSet.modules;
  const olderSchema = olderSchemaSet.modules;

  Object.keys(newerSchema).forEach(hasteModuleName => {
    const schemaEntry = newerSchema[hasteModuleName];
    const olderSchemaEntry = olderSchema[hasteModuleName];
    const framework = 'ReactNative';

    if (schemaEntry.type === 'Component') {
      if (olderSchemaEntry?.type === 'Component') {
        const incompatibleComponents = buildNativeComponentsDiff(
          schemaEntry,
          olderSchemaEntry,
        );
        const hasIncompatibleComponents = incompatibleComponents?.size > 0;
        if (hasIncompatibleComponents) {
          diff.add({
            name: hasteModuleName,
            framework: framework,
            status: {
              incompatibleSpecs: incompatibleComponents,
            },
          });
        }
      }
    }

    if (schemaEntry.type === 'NativeModule') {
      if (olderSchemaEntry?.type === 'NativeModule') {
        // Both native modules
        const incompatibleModules = buildNativeModulesDiff(
          schemaEntry,
          olderSchemaEntry,
        );

        const hasIncompatibleModules =
          incompatibleModules != null && incompatibleModules.size;

        if (hasIncompatibleModules) {
          diff.add({
            name: hasteModuleName,
            framework: framework,
            status: {
              incompatibleSpecs: incompatibleModules,
            },
          });
        }
      }
    }

    if (olderSchemaEntry == null) {
      diff.add({
        name: hasteModuleName,
        framework: framework,
        status: 'new',
      });
    }
  });

  Object.keys(olderSchema).forEach(hasteModuleName => {
    const newSchemaEntry = newerSchema[hasteModuleName];
    const oldSchemaEntry = olderSchema[hasteModuleName];
    const framework = 'ReactNative';

    if (oldSchemaEntry != null && newSchemaEntry == null) {
      diff.add({
        name: hasteModuleName,
        framework: framework,
        status: 'deprecated',
      });
    }
  });

  return diff;
}

function summarizeSchemaDiff(diff: SchemaDiff): DiffSummary {
  switch (diff.status) {
    case 'new':
      return {status: 'patchable', incompatibilityReport: {}};
    case 'deprecated':
      // TODO add check that a component can be removed
      return {status: 'ok', incompatibilityReport: {}};
    default:
      // differs case
      const differs = diff.status;
      if (!differs.incompatibleSpecs) {
        return {status: 'patchable', incompatibilityReport: {}};
      } else {
        const incompatibleObject: IncompatiblityReport = {};
        if (differs.incompatibleSpecs) {
          const withErrors = Array.from(differs.incompatibleSpecs).filter(
            specError =>
              specError.errorInformation ||
              (specError.changeInformation &&
                specError.changeInformation.incompatibleChanges.size > 0),
          );
          if (withErrors.length > 0) {
            if (incompatibleObject[diff.name]) {
              incompatibleObject[diff.name].incompatibleSpecs = withErrors;
            } else {
              incompatibleObject[diff.name] = {
                framework: diff.framework,
                incompatibleSpecs: withErrors,
              };
            }
          }
        }
        const incompatibleUnchanged =
          Object.keys(incompatibleObject).length === 0;
        return {
          status: incompatibleUnchanged ? 'ok' : 'incompatible',
          incompatibilityReport: incompatibleObject,
        };
      }
  }
}

function combineSummaries(
  finalSummary: DiffSummary,
  setSummary: DiffSummary,
): DiffSummary {
  switch (setSummary.status) {
    case 'ok':
      return finalSummary;
    case 'patchable':
      if (finalSummary.status === 'ok') {
        return setSummary;
      } else {
        return finalSummary;
      }
    default:
      switch (finalSummary.status) {
        case 'ok':
        case 'patchable':
          return setSummary;
        default:
          Object.keys(setSummary.incompatibilityReport).forEach(
            differingSchemaName =>
              (finalSummary.incompatibilityReport[differingSchemaName] =
                setSummary.incompatibilityReport[differingSchemaName]),
          );
          return finalSummary;
      }
  }
}

export function summarizeDiffSet(diffs: Set<SchemaDiff>): DiffSummary {
  if (diffs.size === 0) {
    return {status: 'ok', incompatibilityReport: {}};
  }
  const summary: Array<DiffSummary> = [];
  diffs.forEach(schemaDiff => summary.push(summarizeSchemaDiff(schemaDiff)));
  return summary.reduce(combineSummaries, summary[0]);
}
