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
  ComparisonResult,
  EnumMembersComparisonResult,
  FunctionComparisonResult,
  MembersComparisonResult,
  PositionalComparisonResult,
  PropertiesComparisonResult,
  TypeComparisonError,
  UnionMembersComparisonResult,
} from './ComparisonResult';
import type {
  BooleanLiteralTypeAnnotation,
  CompleteReservedTypeAnnotation,
  CompleteTypeAnnotation,
  EventEmitterTypeAnnotation,
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleEnumDeclaration,
  NativeModuleEnumDeclarationWithMembers,
  NativeModuleEnumMap,
  NativeModuleEnumMember,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleGenericObjectTypeAnnotation,
  NativeModuleObjectTypeAnnotation,
  NativeModulePromiseTypeAnnotation,
  NativeModuleTypeAnnotation,
  NativeModuleUnionTypeAnnotation,
  NullableTypeAnnotation,
  NumberLiteralTypeAnnotation,
  ObjectTypeAnnotation,
  StringLiteralTypeAnnotation,
  StringLiteralUnionTypeAnnotation,
} from '@react-native/codegen/src/CodegenSchema';

import {
  isFunctionLogEmpty,
  isMemberLogEmpty,
  isPropertyLogEmpty,
  makeError,
  memberComparisonError,
  propertyComparisonError,
  typeAnnotationComparisonError,
} from './ComparisonResult';
import {
  compareTypeAnnotationForSorting,
  sortTypeAnnotations,
} from './SortTypeAnnotations.js';
import invariant from 'invariant';

const EQUALITY_MSG = 'previousType and afterType differ despite check';

// NOTE: These are module scope type lookup registries. Ideally, they should be local arguments,
// however that would require threading them through all the hierarchical calls of type
// annotation processing, which is a lot of boilerplate. Since our logic is serial, having these
// as shared global variables is acceptable.
let _newerTypesReg, _olderTypesReg, _newerEnumMap, _olderEnumMap;

export function compareTypes(
  newerType: CompleteTypeAnnotation,
  olderType: ?CompleteTypeAnnotation,
  newerTypesReg: ?NativeModuleAliasMap,
  olderTypesReg: ?NativeModuleAliasMap,
  newerEnumMap: ?NativeModuleEnumMap,
  olderEnumMap: ?NativeModuleEnumMap,
): ComparisonResult {
  if (!olderType) {
    // No matching olderType for newerType, skip the Comparison.
    return {status: 'skipped'};
  }

  _newerTypesReg = newerTypesReg;
  _olderTypesReg = olderTypesReg;
  _newerEnumMap = newerEnumMap;
  _olderEnumMap = olderEnumMap;

  const res = compareTypeAnnotation(newerType, olderType);

  _newerTypesReg = undefined;
  _olderTypesReg = undefined;
  _newerEnumMap = undefined;
  _olderEnumMap = undefined;

  return res;
}

// ??T is the same as ?T so let's remove any superflous annotations
function removeNullableTypeAnnotations(
  annotation:
    | NativeModuleTypeAnnotation
    | NullableTypeAnnotation<NativeModuleTypeAnnotation>,
): NativeModuleTypeAnnotation {
  // The parser doesn't allow nested nullables
  if (annotation.type === 'NullableTypeAnnotation') {
    return removeNullableTypeAnnotations(annotation.typeAnnotation);
  }

  return annotation;
}

function lookupType(
  name: string,
  aliases: ?NativeModuleAliasMap,
): ?NativeModuleObjectTypeAnnotation {
  return aliases?.[name];
}

function lookupEnum(
  name: string,
  enums: ?NativeModuleEnumMap,
): ?NativeModuleEnumDeclarationWithMembers {
  return enums?.[name];
}

export function compareTypeAnnotation(
  originalNewerAnnotation: CompleteTypeAnnotation,
  originalOlderAnnotation: CompleteTypeAnnotation,
): ComparisonResult {
  const newerAnnotation = originalNewerAnnotation;
  const olderAnnotation = originalOlderAnnotation;

  // Consider type aliases (generic type annotations with no type parameters) to be compatible
  // with the other type, if the underlying type definition is structurally the same
  if (newerAnnotation.type === 'TypeAliasTypeAnnotation') {
    const newerAnnotationDefinition = lookupType(
      newerAnnotation.name,
      _newerTypesReg,
    );
    if (newerAnnotationDefinition != null) {
      return compareTypeAnnotation(newerAnnotationDefinition, olderAnnotation);
    }
  }

  if (olderAnnotation.type === 'TypeAliasTypeAnnotation') {
    const olderAnnotationDefinition = lookupType(
      olderAnnotation.name,
      _olderTypesReg,
    );
    if (olderAnnotationDefinition != null) {
      return compareTypeAnnotation(newerAnnotation, olderAnnotationDefinition);
    }
  }

  invariant(
    newerAnnotation.type !== 'TypeAliasTypeAnnotation' &&
      olderAnnotation.type !== 'TypeAliasTypeAnnotation',
    EQUALITY_MSG,
  );

  if (newerAnnotation.type !== olderAnnotation.type) {
    if (
      newerAnnotation.type === 'NullableTypeAnnotation' ||
      olderAnnotation.type === 'NullableTypeAnnotation'
    ) {
      return compareNullableChange(newerAnnotation, olderAnnotation);
    }

    return makeError(
      typeAnnotationComparisonError(
        'Type annotations are not the same.',
        newerAnnotation,
        olderAnnotation,
      ),
    );
  }

  switch (newerAnnotation.type) {
    case 'AnyTypeAnnotation':
    case 'MixedTypeAnnotation':
    case 'ArrayBufferTypeAnnotation':
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'BooleanTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'VoidTypeAnnotation':
      return {status: 'matching'};
    case 'ArrayTypeAnnotation':
      invariant(olderAnnotation.type === 'ArrayTypeAnnotation', EQUALITY_MSG);
      return compareTypeAnnotation(
        newerAnnotation.elementType,
        olderAnnotation.elementType,
      );
    case 'EnumDeclaration':
      invariant(olderAnnotation.type === 'EnumDeclaration', EQUALITY_MSG);
      return compareEnumDeclarations(newerAnnotation, olderAnnotation);
    case 'EnumDeclarationWithMembers':
      invariant(
        olderAnnotation.type === 'EnumDeclarationWithMembers',
        EQUALITY_MSG,
      );
      return compareEnumDeclarationWithMembers(
        newerAnnotation,
        olderAnnotation,
      );
    case 'FunctionTypeAnnotation':
      invariant(
        olderAnnotation.type === 'FunctionTypeAnnotation',
        EQUALITY_MSG,
      );
      return compareFunctionTypes(newerAnnotation, olderAnnotation);
    case 'PromiseTypeAnnotation':
      invariant(olderAnnotation.type === 'PromiseTypeAnnotation', EQUALITY_MSG);

      return comparePromiseTypes(newerAnnotation, olderAnnotation);
    case 'GenericObjectTypeAnnotation':
      invariant(
        olderAnnotation.type === 'GenericObjectTypeAnnotation',
        EQUALITY_MSG,
      );

      return compareGenericObjectTypes(newerAnnotation, olderAnnotation);
    case 'NullableTypeAnnotation':
      invariant(
        olderAnnotation.type === 'NullableTypeAnnotation',
        EQUALITY_MSG,
      );
      return compareTypeAnnotation(
        newerAnnotation.typeAnnotation,
        olderAnnotation.typeAnnotation,
      );
    case 'ObjectTypeAnnotation':
      invariant(olderAnnotation.type === 'ObjectTypeAnnotation', EQUALITY_MSG);
      return compareObjectTypes(
        newerAnnotation.properties,
        olderAnnotation.properties,
      );
    case 'NumberLiteralTypeAnnotation':
      invariant(
        olderAnnotation.type === 'NumberLiteralTypeAnnotation',
        EQUALITY_MSG,
      );
      return compareNumberLiteralTypes(newerAnnotation, olderAnnotation);
    case 'BooleanLiteralTypeAnnotation':
      invariant(
        olderAnnotation.type === 'BooleanLiteralTypeAnnotation',
        EQUALITY_MSG,
      );
      return compareBooleanLiteralTypes(newerAnnotation, olderAnnotation);
    case 'StringLiteralTypeAnnotation':
      invariant(
        olderAnnotation.type === 'StringLiteralTypeAnnotation',
        EQUALITY_MSG,
      );
      return compareStringLiteralTypes(newerAnnotation, olderAnnotation);
    case 'UnionTypeAnnotation':
      invariant(olderAnnotation.type === 'UnionTypeAnnotation', EQUALITY_MSG);
      return compareUnionTypes(newerAnnotation, olderAnnotation);
    case 'EventEmitterTypeAnnotation':
      invariant(
        olderAnnotation.type === 'EventEmitterTypeAnnotation',
        EQUALITY_MSG,
      );

      return compareEventEmitterTypes(newerAnnotation, olderAnnotation);
    case 'ReservedTypeAnnotation':
      invariant(
        olderAnnotation.type === 'ReservedTypeAnnotation',
        EQUALITY_MSG,
      );

      return compareReservedTypeAnnotation(newerAnnotation, olderAnnotation);
    default:
      // Flow exhaustiveness check
      newerAnnotation as empty;
      throw new Error(`Unsupported type annotation: ${newerAnnotation.type}`);
  }
}

function compareObjectTypeProperty<T extends CompleteTypeAnnotation>(
  first: NamedShape<T>,
  second: NamedShape<T>,
): number {
  if (first.name < second.name) {
    return -1;
  } else if (first.name > second.name) {
    return 1;
  }
  return 0;
}

function compareEnumMember(
  first: NativeModuleEnumMember,
  second: NativeModuleEnumMember,
) {
  if (first.name < second.name) {
    return -1;
  } else if (first.name > second.name) {
    return 1;
  }
  return 0;
}

function updatePropertyError(
  name: string,
  newType: CompleteTypeAnnotation,
  oldType: CompleteTypeAnnotation,
  result: PropertiesComparisonResult,
) {
  return (oldError: TypeComparisonError) => {
    const comparisonError = typeAnnotationComparisonError(
      'has conflicting type changes',
      newType,
      oldType,
      oldError,
    );
    const newFault: {fault?: TypeComparisonError, property: string} = {
      property: name,
      fault: comparisonError,
    };
    if (result.errorProperties) {
      result.errorProperties.push(newFault);
    } else {
      result.errorProperties = [newFault];
    }
  };
}

function updateMemberError(
  name: string,
  newType: CompleteTypeAnnotation,
  oldType: CompleteTypeAnnotation,
  result: MembersComparisonResult,
) {
  return (oldError: TypeComparisonError) => {
    const comparisonError = typeAnnotationComparisonError(
      'has conflicting changes',
      newType,
      oldType,
      oldError,
    );
    const newFault: {fault?: TypeComparisonError, member: string} = {
      member: name,
      fault: comparisonError,
    };
    if (result.errorMembers) {
      result.errorMembers.push(newFault);
    } else {
      result.errorMembers = [newFault];
    }
  };
}

// Helper function to get a descriptive label for a CompleteTypeAnnotation
function getTypeAnnotationLabel(type: CompleteTypeAnnotation): string {
  switch (type.type) {
    case 'StringLiteralTypeAnnotation':
      return `"${type.value}"`;
    case 'NumberLiteralTypeAnnotation':
      return String(type.value);
    case 'BooleanLiteralTypeAnnotation':
      return String(type.value);
    case 'NullableTypeAnnotation':
      return `?${getTypeAnnotationLabel(type.typeAnnotation)}`;
    default:
      return type.type;
  }
}

function updateNestedProperties(
  name: string,
  propertyChange: ComparisonResult,
  result: PropertiesComparisonResult,
) {
  if (result.nestedPropertyChanges) {
    result.nestedPropertyChanges.push([name, propertyChange]);
  } else {
    result.nestedPropertyChanges = [[name, propertyChange]];
  }
}

function updateMadeOptional(
  name: string,
  result: PropertiesComparisonResult,
  furtherChange?: ComparisonResult,
) {
  if (result.madeOptional) {
    result.madeOptional.push({property: name, furtherChange});
  } else {
    result.madeOptional = [{property: name, furtherChange}];
  }
}

function updateMadeStrict(
  name: string,
  result: PropertiesComparisonResult,
  furtherChange?: ComparisonResult,
) {
  if (result.madeStrict) {
    result.madeStrict.push({property: name, furtherChange});
  } else {
    result.madeStrict = [{property: name, furtherChange}];
  }
}

function checkOptionalityChanges(
  name: string,
  newOptionality: boolean,
  oldOptionality: boolean,
  result: PropertiesComparisonResult,
  furtherChange?: ComparisonResult,
): PropertiesComparisonResult {
  if (newOptionality === oldOptionality) {
    if (furtherChange) {
      updateNestedProperties(name, furtherChange, result);
    }
    return result;
  }
  if (newOptionality) {
    updateMadeOptional(name, result, furtherChange);
  } else {
    updateMadeStrict(name, result, furtherChange);
  }
  return result;
}

function comparePropertyArrays(
  newerOriginal: ReadonlyArray<NamedShape<CompleteTypeAnnotation>>,
  olderOriginal: ReadonlyArray<NamedShape<CompleteTypeAnnotation>>,
): PropertiesComparisonResult {
  const newer = newerOriginal.slice(0);
  const older = olderOriginal.slice(0);
  if (newer.length === 0 && older.length === 0) {
    return {};
  }
  if (newer.length === 0) {
    return {
      missingProperties: older,
    };
  }
  if (older.length === 0) {
    return {
      addedProperties: newer,
    };
  }
  const newerHead = newer.pop();
  const olderHead = older.pop();
  invariant(newerHead != null && olderHead != null, 'Array is empty');

  const newerName = newerHead.name;
  const olderName = olderHead.name;
  if (newerName === olderName) {
    const comparedTypes = compareTypeAnnotation(
      newerHead.typeAnnotation,

      olderHead.typeAnnotation,
    );
    const result = comparePropertyArrays(newer, older);
    switch (comparedTypes.status) {
      case 'matching':
        return checkOptionalityChanges(
          newerName,
          newerHead.optional,
          olderHead.optional,
          result,
        );
      case 'skipped':
        throw new Error(
          "Internal error: returned 'skipped' for non-optional older type",
        );
      case 'nullableChange':
        return checkOptionalityChanges(
          newerName,
          !comparedTypes.nullableLog.optionsReduced,
          comparedTypes.nullableLog.optionsReduced,
          result,
        );
      case 'members':
      case 'properties':
      case 'functionChange':
      case 'positionalTypeChange':
        return checkOptionalityChanges(
          newerName,
          newerHead.optional,
          olderHead.optional,
          result,
          comparedTypes,
        );
      case 'error':
        updatePropertyError(
          newerName,
          newerHead.typeAnnotation,
          olderHead.typeAnnotation,
          result,
        )(comparedTypes.errorLog);
        return result;
      default:
        comparedTypes as empty;
        throw new Error('Unsupported status ' + comparedTypes.status);
    }
  }
  // newer property must have been added based on sorting
  if (newerName > olderName) {
    older.push(olderHead);
    const result = comparePropertyArrays(newer, older);
    if (result.hasOwnProperty('addedProperties') && result.addedProperties) {
      result.addedProperties = result.addedProperties.concat([newerHead]);
    } else {
      result.addedProperties = [newerHead];
    }
    return result;
  }
  // older property must have been skipped based on sorting
  newer.push(newerHead);
  const result = comparePropertyArrays(newer, older);
  if (result.hasOwnProperty('missingProperties') && result.missingProperties) {
    result.missingProperties = result.missingProperties.concat([olderHead]);
  } else {
    result.missingProperties = [olderHead];
  }
  return result;
}

export function compareObjectTypes<T extends CompleteTypeAnnotation>(
  newerPropertyTypes: ReadonlyArray<NamedShape<T>>,
  olderPropertyTypes: ReadonlyArray<NamedShape<T>>,
): ComparisonResult {
  if (newerPropertyTypes.length === 0 && olderPropertyTypes.length === 0) {
    return {status: 'matching'};
  }
  const sortedNewerTypes = [];
  newerPropertyTypes.forEach(prop => sortedNewerTypes.push(prop));
  if (sortedNewerTypes.length !== 0) {
    sortedNewerTypes.sort(compareObjectTypeProperty);
  }
  const sortedOlderTypes = [];
  olderPropertyTypes.forEach(prop => sortedOlderTypes.push(prop));
  if (sortedOlderTypes.length !== 0) {
    sortedOlderTypes.sort(compareObjectTypeProperty);
  }

  if (sortedNewerTypes.length === 0) {
    return {
      status: 'properties',
      propertyLog: {missingProperties: sortedOlderTypes},
      errorLog: typeAnnotationComparisonError(
        'Object has property changes',
        objectTypeAnnotation(newerPropertyTypes),
        objectTypeAnnotation(olderPropertyTypes),
      ),
    };
  }
  if (sortedOlderTypes.length === 0) {
    return {
      status: 'properties',
      propertyLog: {addedProperties: sortedNewerTypes},
      errorLog: typeAnnotationComparisonError(
        'Object has property changes',
        objectTypeAnnotation(newerPropertyTypes),
        objectTypeAnnotation(olderPropertyTypes),
      ),
    };
  }
  const result = comparePropertyArrays(sortedNewerTypes, sortedOlderTypes);
  if (isPropertyLogEmpty(result)) {
    return {status: 'matching'};
  }
  if (result.errorProperties) {
    return makeError(
      propertyComparisonError(
        result.errorProperties.length > 1
          ? 'Object contained properties with type mismatches'
          : 'Object contained a property with a type mismatch',
        result.errorProperties,
      ),
    );
  }
  if (
    (result.addedProperties &&
      result.addedProperties.length > 0 &&
      result.addedProperties.length === newerPropertyTypes.length) ||
    (result.missingProperties &&
      result.missingProperties.length > 0 &&
      result.missingProperties.length === olderPropertyTypes.length)
  ) {
    return makeError(
      typeAnnotationComparisonError(
        'Object types do not match.',
        objectTypeAnnotation(newerPropertyTypes),
        objectTypeAnnotation(olderPropertyTypes),
      ),
    );
  }
  return {
    status: 'properties',
    propertyLog: result,
    errorLog: typeAnnotationComparisonError(
      'Object has property changes',
      objectTypeAnnotation(newerPropertyTypes),
      objectTypeAnnotation(olderPropertyTypes),
    ),
  };
}

function objectTypeAnnotation<T>(
  properties: ReadonlyArray<NamedShape<T>>,
): ObjectTypeAnnotation<T> {
  return {
    type: 'ObjectTypeAnnotation',
    properties,
    baseTypes: [],
  };
}

export function compareEnumDeclarations(
  newerDeclaration: NativeModuleEnumDeclaration,
  olderDeclaration: NativeModuleEnumDeclaration,
): ComparisonResult {
  if (newerDeclaration.memberType !== olderDeclaration.memberType) {
    return makeError(
      typeAnnotationComparisonError(
        'EnumDeclaration member types are not the same',
        newerDeclaration,
        olderDeclaration,
      ),
    );
  }

  const newerAnnotationDefinition = lookupEnum(
    newerDeclaration.name,
    _newerEnumMap,
  );
  const olderAnnotationDefinition = lookupEnum(
    olderDeclaration.name,
    _olderEnumMap,
  );

  invariant(
    newerAnnotationDefinition != null && olderAnnotationDefinition != null,
    'Could not find enum definition',
  );

  return compareTypeAnnotation(
    newerAnnotationDefinition,
    olderAnnotationDefinition,
  );
}

export function compareEnumDeclarationMemberArrays(
  newer: Array<NativeModuleEnumMember>,
  older: Array<NativeModuleEnumMember>,
): EnumMembersComparisonResult {
  if (newer.length === 0 && older.length === 0) {
    return {memberKind: 'enum'};
  } else if (newer.length === 0) {
    return {memberKind: 'enum', missingMembers: [...older]};
  } else if (older.length === 0) {
    return {memberKind: 'enum', addedMembers: [...newer]};
  }

  const newerHead = newer.pop();
  const olderHead = older.pop();
  invariant(newerHead != null && olderHead != null, 'Array is empty');

  const newerName = newerHead.name;
  const olderName = olderHead.name;

  if (newerName === olderName) {
    const comparedTypes = compareTypeAnnotation(
      newerHead.value,
      olderHead.value,
    );

    const result = compareEnumDeclarationMemberArrays(newer, older);
    switch (comparedTypes.status) {
      case 'matching':
        return result;
      case 'error':
        updateMemberError(
          newerName,
          newerHead.value,
          olderHead.value,
          result,
        )(comparedTypes.errorLog);
        return result;
      case 'skipped':
        throw new Error(
          "Internal error: returned 'skipped' for non-optional older type",
        );
      case 'nullableChange':
      case 'properties':
      case 'functionChange':
      case 'positionalTypeChange':
      case 'members':
        break;
      default:
        // Flow exhaustiveness check
        comparedTypes as empty;
        throw new Error('Unsupported status ' + comparedTypes.status);
    }
  } else if (newerName > olderName) {
    older.push(olderHead);
    const result = compareEnumDeclarationMemberArrays(newer, older);
    if (result.hasOwnProperty('addedMembers') && result.addedMembers) {
      result.addedMembers.push(newerHead);
    } else {
      result.addedMembers = [newerHead];
    }
    return result;
  } else if (newerName < olderName) {
    newer.push(newerHead);
    const result = compareEnumDeclarationMemberArrays(newer, older);
    if (result.hasOwnProperty('missingMembers') && result.missingMembers) {
      result.missingMembers.push(olderHead);
    } else {
      result.missingMembers = [olderHead];
    }
    return result;
  }

  throw new Error('Internal error: should not reach here');
}

export function compareUnionMemberArrays(
  newer: Array<CompleteTypeAnnotation>,
  older: Array<CompleteTypeAnnotation>,
): UnionMembersComparisonResult {
  if (newer.length === 0 && older.length === 0) {
    return {memberKind: 'union'};
  } else if (newer.length === 0) {
    return {memberKind: 'union', missingMembers: [...older]};
  } else if (older.length === 0) {
    return {memberKind: 'union', addedMembers: [...newer]};
  }

  const newerHead = newer.pop();
  const olderHead = older.pop();
  invariant(newerHead != null && olderHead != null, 'Array is empty');

  const sortComparison = compareTypeAnnotationForSorting(
    [0, newerHead],
    [0, olderHead],
  );

  if (sortComparison === 0) {
    const headComparison = compareTypeAnnotation(newerHead, olderHead);

    const restComparison = compareUnionMemberArrays(newer, older);
    switch (headComparison.status) {
      case 'matching':
        return restComparison;
      case 'error':
        updateMemberError(
          getTypeAnnotationLabel(newerHead),
          newerHead,
          olderHead,
          restComparison,
        )(headComparison.errorLog);
        return restComparison;
      case 'skipped':
        throw new Error(
          "Internal error: returned 'skipped' for non-optional older type",
        );
      case 'properties':
        restComparison.missingMembers = restComparison.missingMembers || [];
        restComparison.missingMembers.push(olderHead);
        restComparison.addedMembers = restComparison.addedMembers || [];
        restComparison.addedMembers.push(newerHead);
        return restComparison;
      //TODO: Handle the nullable changes within Union
      case 'nullableChange':
      case 'functionChange':
      case 'positionalTypeChange':
      case 'members':
        break;
      default:
        // Flow exhaustiveness check
        headComparison as empty;
        throw new Error('Unsupported status ' + headComparison.status);
    }
  } else if (sortComparison > 0) {
    older.push(olderHead);
    const restComparison = compareUnionMemberArrays(newer, older);
    restComparison.addedMembers = restComparison.addedMembers || [];
    restComparison.addedMembers.push(newerHead);
    return restComparison;
  } else if (sortComparison < 0) {
    newer.push(newerHead);
    const restComparison = compareUnionMemberArrays(newer, older);
    restComparison.missingMembers = restComparison.missingMembers || [];
    restComparison.missingMembers.push(olderHead);
    return restComparison;
  }

  throw new Error('Internal error: should not reach here');
}

export function compareEnumDeclarationWithMembers(
  newerDeclaration: NativeModuleEnumDeclarationWithMembers,
  olderDeclaration: NativeModuleEnumDeclarationWithMembers,
): ComparisonResult {
  const sortedNewerTypes = Array.from(newerDeclaration.members).sort(
    compareEnumMember,
  );
  const sortedOlderTypes = Array.from(olderDeclaration.members).sort(
    compareEnumMember,
  );

  const result = compareEnumDeclarationMemberArrays(
    sortedNewerTypes,
    sortedOlderTypes,
  );

  if (isMemberLogEmpty(result)) {
    return {status: 'matching'};
  } else if (result.errorMembers) {
    return makeError(
      typeAnnotationComparisonError(
        'Enum types do not match',
        newerDeclaration,
        olderDeclaration,
        memberComparisonError(
          result.errorMembers.length > 1
            ? 'Enum contained members with type mismatches'
            : 'Enum contained a member with a type mismatch',
          result.errorMembers,
        ),
      ),
    );
  } else if (
    (result.addedMembers &&
      result.addedMembers.length > 0 &&
      result.addedMembers.length === newerDeclaration.members.length) ||
    (result.missingMembers &&
      result.missingMembers.length > 0 &&
      result.missingMembers.length === olderDeclaration.members.length)
  ) {
    return makeError(
      typeAnnotationComparisonError(
        'Enum types do not match.',
        newerDeclaration,
        olderDeclaration,
      ),
    );
  }

  return {
    status: 'members',
    memberLog: result,
    errorLog: typeAnnotationComparisonError(
      'Enum has member changes',
      newerDeclaration,
      olderDeclaration,
    ),
  };
}

function compareNullableChange(
  newerAnnotation: CompleteTypeAnnotation,
  olderAnnotation: CompleteTypeAnnotation,
): ComparisonResult {
  const newVoidRemoved =
    newerAnnotation.type === 'NullableTypeAnnotation'
      ? removeNullableTypeAnnotations(newerAnnotation)
      : newerAnnotation;

  const oldVoidRemoved =
    olderAnnotation.type === 'NullableTypeAnnotation'
      ? removeNullableTypeAnnotations(olderAnnotation)
      : olderAnnotation;

  const optionalNew = newVoidRemoved.type !== newerAnnotation.type;
  const optionalOld = oldVoidRemoved.type !== olderAnnotation.type;

  invariant(
    optionalNew !== optionalOld,
    'compareNullableChange called with both being nullable',
  );

  const optionsReduced = !optionalNew && optionalOld;
  if (
    newVoidRemoved.type === 'VoidTypeAnnotation' ||
    oldVoidRemoved.type === 'VoidTypeAnnotation'
  ) {
    return {
      status: 'nullableChange',
      nullableLog: {
        typeRefined: true,
        optionsReduced,
        interiorLog: null,
        newType: newerAnnotation,
        oldType: olderAnnotation,
      },
      errorLog: typeAnnotationComparisonError(
        'Nullable type has changes',
        newerAnnotation,
        olderAnnotation,
      ),
    };
  }
  const interiorLog = compareTypeAnnotation(newVoidRemoved, oldVoidRemoved);
  switch (interiorLog.status) {
    case 'error':
      return makeError(
        typeAnnotationComparisonError(
          'Type annotations are not the same.',
          newerAnnotation,
          olderAnnotation,
        ),
      );
    case 'matching':
      return {
        status: 'nullableChange',
        nullableLog: {
          typeRefined: false,
          optionsReduced,
          interiorLog,
          newType: newerAnnotation,
          oldType: olderAnnotation,
        },
        errorLog: typeAnnotationComparisonError(
          'Nullable type has changes',
          newerAnnotation,
          olderAnnotation,
        ),
      };
    default:
      return {
        status: 'nullableChange',
        nullableLog: {
          typeRefined: false,
          optionsReduced,
          interiorLog,
          newType: newerAnnotation,
          oldType: olderAnnotation,
        },
        errorLog: typeAnnotationComparisonError(
          'Nullable type has changes',
          newerAnnotation,
          olderAnnotation,
          interiorLog.errorLog,
        ),
      };
  }
}

export function compareUnionTypes(
  newerType: NativeModuleUnionTypeAnnotation,
  olderType: NativeModuleUnionTypeAnnotation,
): ComparisonResult {
  const sortedNewerTypes = sortTypeAnnotations(newerType.types);
  const sortedOlderTypes = sortTypeAnnotations(olderType.types);

  const result = compareUnionMemberArrays(
    sortedNewerTypes.map(([_, type]) => type),
    sortedOlderTypes.map(([_, type]) => type),
  );

  if (isMemberLogEmpty(result)) {
    return {status: 'matching'};
  } else if (result.errorMembers) {
    return makeError(
      typeAnnotationComparisonError(
        'Union types do not match',
        newerType,
        olderType,
        memberComparisonError(
          result.errorMembers.length > 1
            ? 'Union contained members with type mismatches'
            : 'Union contained a member with a type mismatch',
          result.errorMembers,
        ),
      ),
    );
  } else if (
    (result.addedMembers &&
      result.addedMembers.length > 0 &&
      result.addedMembers.length === newerType.types.length) ||
    (result.missingMembers &&
      result.missingMembers.length > 0 &&
      result.missingMembers.length === olderType.types.length)
  ) {
    return makeError(
      typeAnnotationComparisonError(
        'Union types do not match.',
        newerType,
        olderType,
      ),
    );
  }

  return {
    status: 'members',
    memberLog: result,
    errorLog: typeAnnotationComparisonError(
      'Union has member changes',
      newerType,
      olderType,
    ),
  };
}

export function comparePromiseTypes(
  newerType: NativeModulePromiseTypeAnnotation,
  olderType: NativeModulePromiseTypeAnnotation,
): ComparisonResult {
  if (newerType.elementType == null || olderType.elementType == null) {
    return makeError(
      typeAnnotationComparisonError(
        'Promise has differing arguments',
        newerType,
        olderType,
      ),
    );
  }

  invariant(
    newerType.elementType != null && olderType.elementType != null,
    EQUALITY_MSG,
  );

  return compareTypeAnnotation(newerType.elementType, olderType.elementType);
}

export function compareGenericObjectTypes(
  newerType: NativeModuleGenericObjectTypeAnnotation,
  olderType: NativeModuleGenericObjectTypeAnnotation,
): ComparisonResult {
  if (
    newerType.dictionaryValueType == null &&
    olderType.dictionaryValueType == null
  ) {
    return {status: 'matching'};
  }

  if (
    newerType.dictionaryValueType != null &&
    olderType.dictionaryValueType != null
  ) {
    return compareTypeAnnotation(
      newerType.dictionaryValueType,
      olderType.dictionaryValueType,
    );
  }

  return makeError(
    typeAnnotationComparisonError(
      'Generic Object types do not have matching dictionary types',
      newerType,
      olderType,
    ),
  );
}

export function compareNumberLiteralTypes(
  newerType: NumberLiteralTypeAnnotation,
  olderType: NumberLiteralTypeAnnotation,
): ComparisonResult {
  return newerType.value === olderType.value
    ? {status: 'matching'}
    : makeError(
        typeAnnotationComparisonError(
          'Numeric literals are not equal',
          newerType,
          olderType,
        ),
      );
}

export function compareStringLiteralTypes(
  newerType: StringLiteralTypeAnnotation,
  olderType: StringLiteralTypeAnnotation,
): ComparisonResult {
  return newerType.value === olderType.value
    ? {status: 'matching'}
    : makeError(
        typeAnnotationComparisonError(
          'String literals are not equal',
          newerType,
          olderType,
        ),
      );
}

export function compareBooleanLiteralTypes(
  newerType: BooleanLiteralTypeAnnotation,
  olderType: BooleanLiteralTypeAnnotation,
): ComparisonResult {
  return newerType.value === olderType.value
    ? {status: 'matching'}
    : makeError(
        typeAnnotationComparisonError(
          'Boolean literals are not equal',
          newerType,
          olderType,
        ),
      );
}

export function compareStringLiteralUnionTypes(
  newerType: StringLiteralUnionTypeAnnotation,
  olderType: StringLiteralUnionTypeAnnotation,
): ComparisonResult {
  const results = compareArrayOfTypes(
    false, // Fixed order
    false, // Can grow/shrink at the end
    newerType.types,
    olderType.types,
  );
  switch (results.status) {
    case 'length-mismatch':
      throw new Error('length-mismatch returned with length changes allowed');
    case 'type-mismatch':
      return makeError(
        typeAnnotationComparisonError(
          `Subtype of union at position ${results.newIndex} did not match`,
          newerType,
          olderType,
          results.error,
        ),
      );
    case 'subtypable-changes':
      if (results.nestedChanges.length > 0) {
        throw new Error(
          'Unexpected inline objects/functions in string literal union',
        );
      }
      if (
        results.addedElements.length <= 0 &&
        results.removedElements.length <= 0
      ) {
        throw new Error('string union returned unexpected set of changes');
      }

      const changeLog: PositionalComparisonResult = {
        typeKind: 'stringUnion',
        nestedChanges: [],
      };

      if (results.addedElements.length > 0) {
        changeLog.addedElements = results.addedElements;
      }

      if (results.removedElements.length > 0) {
        changeLog.removedElements = results.removedElements;
      }

      return {
        status: 'positionalTypeChange',
        changeLog,
        errorLog: typeAnnotationComparisonError(
          'String literal union has member changes',
          newerType,
          olderType,
        ),
      };
    case 'matching':
      return {status: 'matching'};
    default:
      throw new Error('Unknown status');
  }
}

export function compareFunctionTypes(
  newerType: NativeModuleFunctionTypeAnnotation,
  olderType: NativeModuleFunctionTypeAnnotation,
): ComparisonResult {
  // Check return types
  const returnTypeResult = compareTypeAnnotation(
    newerType.returnTypeAnnotation,
    olderType.returnTypeAnnotation,
  );
  if (returnTypeResult.status === 'error') {
    return makeError(
      typeAnnotationComparisonError(
        'Function return types do not match',
        newerType,
        olderType,
        returnTypeResult.errorLog,
      ),
    );
  }
  const functionChanges: FunctionComparisonResult = {};
  if (
    returnTypeResult.status === 'properties' ||
    returnTypeResult.status === 'members' ||
    returnTypeResult.status === 'functionChange' ||
    returnTypeResult.status === 'positionalTypeChange' ||
    returnTypeResult.status === 'nullableChange'
  ) {
    functionChanges.returnType = returnTypeResult;
  }

  // Check argument types
  const argumentResults = compareArrayOfTypes(
    true, // fixedOrder
    true, // fixedLength
    newerType.params.map(_ => _.typeAnnotation),
    olderType.params.map(_ => _.typeAnnotation),
  );
  switch (argumentResults.status) {
    case 'length-mismatch':
      return makeError(
        typeAnnotationComparisonError(
          'Function types have differing length of arguments',
          newerType,
          olderType,
        ),
      );
    case 'type-mismatch':
      return makeError(
        typeAnnotationComparisonError(
          `Parameter at index ${argumentResults.newIndex} did not match`,
          newerType,
          olderType,
          argumentResults.error,
        ),
      );
    case 'subtypable-changes':
      functionChanges.parameterTypes = {
        typeKind: 'parameter',
        nestedChanges: argumentResults.nestedChanges,
      };
      break;
    case 'matching':
    default:
      break;
  }

  if (isFunctionLogEmpty(functionChanges)) {
    return {status: 'matching'};
  }
  return {
    status: 'functionChange',
    functionChangeLog: functionChanges,
    errorLog: typeAnnotationComparisonError(
      'Function has parameter or return type changes',
      newerType,
      olderType,
    ),
  };
}

type ArrayComparisonResult =
  | {status: 'matching', ...}
  | {status: 'length-mismatch', ...}
  | {
      status: 'subtypable-changes',
      nestedChanges: Array<[number, number, ComparisonResult]>,
      addedElements: Array<[number, CompleteTypeAnnotation]>,
      removedElements: Array<[number, CompleteTypeAnnotation]>,
      ...
    }
  | {
      status: 'type-mismatch',
      error: TypeComparisonError,
      newIndex: number,
      oldIndex: number,
      ...
    };

function compareArrayOfTypes(
  fixedOrder: boolean,
  fixedLength: boolean,
  newerTypes: ReadonlyArray<CompleteTypeAnnotation>,
  olderTypes: ReadonlyArray<CompleteTypeAnnotation>,
): ArrayComparisonResult {
  const sameLength = newerTypes.length === olderTypes.length;
  if (fixedLength && !sameLength) {
    return {status: 'length-mismatch'};
  }
  const nestedChanges: Array<[number, number, ComparisonResult]> = [];
  const minLength = Math.min(newerTypes.length, olderTypes.length);

  if (fixedOrder) {
    for (let i = 0; i < minLength; i++) {
      const result = compareTypeAnnotation(newerTypes[i], olderTypes[i]);
      if (result.status === 'error') {
        return {
          status: 'type-mismatch',
          error: result.errorLog,
          newIndex: i,
          oldIndex: i,
        };
      }
      if (
        result.status === 'properties' ||
        result.status === 'members' ||
        result.status === 'functionChange' ||
        result.status === 'positionalTypeChange' ||
        result.status === 'nullableChange'
      ) {
        nestedChanges.push([i, i, result]);
      }
    }
    if (nestedChanges.length === 0 && sameLength) {
      return {status: 'matching'};
    }
    const addedElements: Array<[number, CompleteTypeAnnotation]> = [];
    const removedElements: Array<[number, CompleteTypeAnnotation]> = [];
    if (newerTypes.length < olderTypes.length) {
      const elements = olderTypes.slice(minLength, olderTypes.length);
      for (let i = 0; i < elements.length; i++) {
        removedElements.push([i + minLength + 1, elements[i]]);
      }
    }
    if (newerTypes.length > olderTypes.length) {
      const elements = newerTypes.slice(minLength, newerTypes.length);
      for (let i = 0; i < elements.length; i++) {
        addedElements.push([i + minLength + 1, elements[i]]);
      }
    }
    return {
      status: 'subtypable-changes',
      nestedChanges,
      addedElements,
      removedElements,
    };
  }
  return compareArrayTypesOutOfOrder(
    sortTypeAnnotations(newerTypes),
    0,
    sortTypeAnnotations(olderTypes),
    0,
    [],
    [],
    [],
  );
}

type PotentialErrorOrChange = {
  olderPosition: number,
  newerPosition: number,
  error: TypeComparisonError,
  annotation: CompleteTypeAnnotation,
  ...
};

function compareArrayTypesOutOfOrder(
  newerTypes: Array<[number, CompleteTypeAnnotation]>,
  newerIndex: number,
  olderTypes: Array<[number, CompleteTypeAnnotation]>,
  olderIndex: number,
  potentiallyAddedElements: Array<PotentialErrorOrChange>,
  potentiallyRemovedElements: Array<PotentialErrorOrChange>,
  nestedChanges: Array<[number, number, ComparisonResult]>,
): ArrayComparisonResult {
  const newLength = newerTypes.length;
  const oldLength = olderTypes.length;
  if (newerIndex === newLength || olderIndex === oldLength) {
    const [errors, added, removed] = resolvePotentials(
      potentiallyAddedElements,
      potentiallyRemovedElements,
    );
    if (errors.length !== 0) {
      // Return the first error, others might be dubious
      return {
        status: 'type-mismatch',
        error: errors[0][0],
        oldIndex: errors[0][1],
        newIndex: errors[0][2],
      };
    }
    if (
      added.length === 0 &&
      removed.length === 0 &&
      nestedChanges.length === 0 &&
      newerIndex === newLength &&
      olderIndex === oldLength
    ) {
      return {status: 'matching'};
    }
    if (newerIndex === newLength && olderIndex === oldLength) {
      return {
        status: 'subtypable-changes',
        nestedChanges,
        addedElements: added,
        removedElements: removed,
      };
    }
    if (newerIndex === newLength) {
      return {
        status: 'subtypable-changes',
        nestedChanges,
        addedElements: added,
        removedElements: removed.concat(
          olderTypes.slice(olderIndex, oldLength),
        ),
      };
    }
    // By elimination (olderIndex === oldLength)
    return {
      status: 'subtypable-changes',
      nestedChanges,
      addedElements: added.concat(newerTypes.slice(newerIndex, newLength)),
      removedElements: removed,
    };
  }
  const newTypePosn = newerTypes[newerIndex][0];
  const newType = newerTypes[newerIndex][1];
  const oldTypePosn = olderTypes[olderIndex][0];
  const oldType = olderTypes[olderIndex][1];
  const currentResult = compareTypeAnnotation(newType, oldType);
  const sortComparison = compareTypeAnnotationForSorting(
    newerTypes[newerIndex],
    olderTypes[olderIndex],
  );
  switch (currentResult.status) {
    case 'matching':
      return compareArrayTypesOutOfOrder(
        newerTypes,
        newerIndex + 1,
        olderTypes,
        olderIndex + 1,
        potentiallyAddedElements,
        potentiallyRemovedElements,
        nestedChanges,
      );
    case 'properties':
    case 'functionChange':
    case 'positionalTypeChange':
    case 'nullableChange':
      // The match was sufficiently close so move to the next items
      return compareArrayTypesOutOfOrder(
        newerTypes,
        newerIndex + 1,
        olderTypes,
        olderIndex + 1,
        potentiallyAddedElements,
        potentiallyRemovedElements,
        // I'm not sure how I should fix this FlowFixMe. It returns `undefined`
        // and has existed since the day it was written. Fixing it might break things.
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        nestedChanges.concat[[oldTypePosn, newTypePosn, currentResult]],
      );
    case 'error':
      // This case seems impossible, but if it happens there was ceratinly an error
      if (sortComparison === 0) {
        return {
          status: 'type-mismatch',
          error: currentResult.errorLog,
          newIndex: newTypePosn,
          oldIndex: oldTypePosn,
        };
      }
      // A matching newerType should have appeared in the sorted list by now
      // So either added or an error
      if (sortComparison < 0) {
        return compareArrayTypesOutOfOrder(
          newerTypes,
          newerIndex + 1,
          olderTypes,
          olderIndex,
          potentiallyAddedElements.concat([
            {
              olderPosition: oldTypePosn,
              newerPosition: newTypePosn,
              error: currentResult.errorLog,
              annotation: newType,
            },
          ]),
          potentiallyRemovedElements,
          nestedChanges,
        );
      }
      // Else a matching olderType should have appeared in the sorted arrays
      // So either error or removed
      return compareArrayTypesOutOfOrder(
        newerTypes,
        newerIndex,
        olderTypes,
        olderIndex + 1,
        potentiallyAddedElements,
        potentiallyRemovedElements.concat([
          {
            olderPosition: oldTypePosn,
            newerPosition: newTypePosn,
            error: currentResult.errorLog,
            annotation: oldType,
          },
        ]),
        nestedChanges,
      );
    case 'skipped':
      throw new Error(
        'Unexpected skipped status for array of type annotations',
      );
    default:
      throw new Error('Unsupported status ' + currentResult.status);
  }
}

function resolvePotentials(
  potentiallyAdded: Array<PotentialErrorOrChange>,
  potentiallyRemoved: Array<PotentialErrorOrChange>,
): [
  Array<[TypeComparisonError, number, number]>,
  Array<[number, CompleteTypeAnnotation]>,
  Array<[number, CompleteTypeAnnotation]>,
] {
  const addedLength = potentiallyAdded.length;
  const removedLength = potentiallyRemoved.length;
  if (addedLength === 0 && removedLength === 0) {
    return [[], [], []];
  }
  if (addedLength === 0) {
    return [
      [],
      [],
      potentiallyRemoved.map(removed => [
        removed.olderPosition,
        removed.annotation,
      ]),
    ];
  }
  if (removedLength === 0) {
    return [
      [],
      potentiallyAdded.map(added => [added.newerPosition, added.annotation]),
      [],
    ];
  }
  const addedHead = potentiallyAdded[0];
  const removedHead = potentiallyRemoved[0];
  // Found added when looking for a match to removed,
  // Didn't find a match for removed after skipping added
  // So an add and a remove is more likely a mismatch
  if (addedHead.olderPosition === removedHead.olderPosition) {
    return [
      [[addedHead.error, addedHead.olderPosition, addedHead.newerPosition]],
      [],
      [],
    ];
  }
  // Found removed when looking for a match to added, didn't find after skipping
  if (removedHead.newerPosition === addedHead.newerPosition) {
    return [
      [
        [
          removedHead.error,
          removedHead.olderPosition,
          removedHead.newerPosition,
        ],
      ],
      [],
      [],
    ];
  }
  // Current added and current removed heads aren't the same erroneousItems
  const sortedOrder = compareTypeAnnotationForSorting(
    [addedHead.newerPosition, addedHead.annotation],
    [removedHead.olderPosition, removedHead.annotation],
  );
  // Odd but possible, step down both
  if (sortedOrder === 0) {
    const [errors, added, removed] = resolvePotentials(
      potentiallyAdded.slice(1, addedLength),
      potentiallyRemoved.slice(1, removedLength),
    );
    return [
      errors,
      added.concat([[addedHead.newerPosition, addedHead.annotation]]),
      removed.concat([[removedHead.olderPosition, removedHead.annotation]]),
    ];
  }
  if (sortedOrder < 0) {
    const [errors, added, removed] = resolvePotentials(
      potentiallyAdded.slice(1, addedLength),
      potentiallyRemoved,
    );
    return [
      errors,
      added.concat([[addedHead.newerPosition, addedHead.annotation]]),
      removed,
    ];
  }

  const [errors, added, removed] = resolvePotentials(
    potentiallyAdded,
    potentiallyRemoved.slice(1, removedLength),
  );
  return [
    errors,
    added,
    removed.concat([[removedHead.olderPosition, removedHead.annotation]]),
  ];
}

function compareEventEmitterTypes(
  newerAnnotation: EventEmitterTypeAnnotation,
  olderAnnotation: EventEmitterTypeAnnotation,
): ComparisonResult {
  const comparison = compareTypeAnnotation(
    newerAnnotation.typeAnnotation,
    olderAnnotation.typeAnnotation,
  );

  if (comparison.status === 'error') {
    return makeError(
      typeAnnotationComparisonError(
        'EventEmitter eventTypes are not equivalent',
        newerAnnotation,
        olderAnnotation,
        comparison.errorLog,
      ),
    );
  }

  return comparison;
}

function compareReservedTypeAnnotation(
  newerAnnotation: CompleteReservedTypeAnnotation,
  olderAnnotation: CompleteReservedTypeAnnotation,
): ComparisonResult {
  if (newerAnnotation.name !== olderAnnotation.name) {
    return makeError(
      typeAnnotationComparisonError(
        'Types are not equivalent',
        newerAnnotation,
        olderAnnotation,
      ),
    );
  }

  switch (newerAnnotation.name) {
    case 'RootTag':
    case 'ColorPrimitive':
    case 'ImageSourcePrimitive':
    case 'PointPrimitive':
    case 'EdgeInsetsPrimitive':
    case 'ImageRequestPrimitive':
    case 'DimensionPrimitive':
      return {status: 'matching'};
    default:
      newerAnnotation.name as empty;
      throw new Error('Unknown reserved type ' + newerAnnotation.name);
  }
}
