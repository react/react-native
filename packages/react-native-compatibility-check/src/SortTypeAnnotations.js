/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {CompleteTypeAnnotation} from '@react-native/codegen/src/CodegenSchema';

import invariant from 'invariant';

export function sortTypeAnnotations(
  annotations: ReadonlyArray<CompleteTypeAnnotation>,
): Array<[number, CompleteTypeAnnotation]> {
  const sortableArray = annotations.map(
    (a, i): [number, CompleteTypeAnnotation] => [i, a],
  );
  return sortableArray.sort(compareTypeAnnotationForSorting);
}

const EQUALITY_MSG = 'typeA and typeB differ despite check';
export function compareTypeAnnotationForSorting(
  [originalPositionA, typeA]: [number, CompleteTypeAnnotation],
  [originalPositionB, typeB]: [number, CompleteTypeAnnotation],
): number {
  if (typeA.type !== typeB.type) {
    if (typeA.type === 'NullableTypeAnnotation') {
      return compareTypeAnnotationForSorting(
        [originalPositionA, typeA.typeAnnotation],
        [originalPositionB, typeB],
      );
    }
    if (typeB.type === 'NullableTypeAnnotation') {
      return compareTypeAnnotationForSorting(
        [originalPositionA, typeA],
        [originalPositionB, typeB.typeAnnotation],
      );
    }
    return (
      typeAnnotationArbitraryOrder(typeA) - typeAnnotationArbitraryOrder(typeB)
    );
  }
  switch (typeA.type) {
    case 'AnyTypeAnnotation':
      return 0;
    case 'ArrayBufferTypeAnnotation':
      invariant(typeB.type === 'ArrayBufferTypeAnnotation', EQUALITY_MSG);
      return originalPositionA - originalPositionB;
    case 'ArrayTypeAnnotation':
      invariant(typeB.type === 'ArrayTypeAnnotation', EQUALITY_MSG);
      return compareTypeAnnotationForSorting(
        [originalPositionA, typeA.elementType],
        [originalPositionB, typeB.elementType],
      );
    case 'BooleanTypeAnnotation':
      return originalPositionA - originalPositionB;
    case 'EnumDeclaration':
      invariant(typeB.type === 'EnumDeclaration', EQUALITY_MSG);
      return typeA.memberType.localeCompare(typeB.memberType);
    case 'EnumDeclarationWithMembers':
      invariant(typeB.type === 'EnumDeclarationWithMembers', EQUALITY_MSG);
      return compareNameAnnotationArraysForSorting(
        [originalPositionA, typeA.members.map(m => [m.name, m.value])],
        [originalPositionB, typeB.members.map(m => [m.name, m.value])],
      );
    case 'FunctionTypeAnnotation':
      invariant(typeB.type === 'FunctionTypeAnnotation', EQUALITY_MSG);
      const parmComparison = compareAnnotationArraysForSorting(
        [originalPositionA, typeA.params.map(p => p.typeAnnotation)],
        [originalPositionB, typeB.params.map(p => p.typeAnnotation)],
      );
      if (parmComparison === 0) {
        return compareTypeAnnotationForSorting(
          [originalPositionA, typeA.returnTypeAnnotation],
          [originalPositionB, typeB.returnTypeAnnotation],
        );
      }
      return parmComparison;
    case 'EventEmitterTypeAnnotation':
      invariant(typeB.type === 'EventEmitterTypeAnnotation', EQUALITY_MSG);

      return compareTypeAnnotationForSorting(
        [originalPositionA, typeA.typeAnnotation],
        [originalPositionB, typeB.typeAnnotation],
      );
    case 'GenericObjectTypeAnnotation':
      invariant(typeB.type === 'GenericObjectTypeAnnotation', EQUALITY_MSG);

      if (
        typeA.dictionaryValueType == null &&
        typeB.dictionaryValueType == null
      ) {
        return 0;
      } else if (
        typeA.dictionaryValueType != null &&
        typeB.dictionaryValueType != null
      ) {
        return compareTypeAnnotationForSorting(
          [originalPositionA, typeA.dictionaryValueType],
          [originalPositionB, typeB.dictionaryValueType],
        );
      } else {
        return typeA.dictionaryValueType == null ? -1 : 1;
      }
    case 'NullableTypeAnnotation':
      invariant(typeB.type === 'NullableTypeAnnotation', EQUALITY_MSG);
      return compareTypeAnnotationForSorting(
        [originalPositionA, typeA.typeAnnotation],
        [originalPositionB, typeB.typeAnnotation],
      );
    case 'NumberTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'DoubleTypeAnnotation':
      return 0;
    case 'NumberLiteralTypeAnnotation':
      invariant(typeB.type === 'NumberLiteralTypeAnnotation', EQUALITY_MSG);
      return typeA.value - typeB.value;
    case 'BooleanLiteralTypeAnnotation':
      invariant(typeB.type === 'BooleanLiteralTypeAnnotation', EQUALITY_MSG);
      return originalPositionA - originalPositionB;
    case 'ObjectTypeAnnotation':
      invariant(typeB.type === 'ObjectTypeAnnotation', EQUALITY_MSG);
      return compareNameAnnotationArraysForSorting(
        [
          originalPositionA,
          typeA.properties.map(p => [p.name, p.typeAnnotation]),
        ],
        [
          originalPositionB,
          typeB.properties.map(p => [p.name, p.typeAnnotation]),
        ],
      );
    case 'StringTypeAnnotation':
      return originalPositionA - originalPositionB;
    case 'StringLiteralTypeAnnotation':
      invariant(typeB.type === 'StringLiteralTypeAnnotation', EQUALITY_MSG);
      return typeA.value.localeCompare(typeB.value);
    case 'UnionTypeAnnotation':
      invariant(typeB.type === 'UnionTypeAnnotation', EQUALITY_MSG);
      return compareAnnotationArraysForSorting(
        [originalPositionA, typeA.types],
        [originalPositionB, typeB.types],
      );
    case 'VoidTypeAnnotation':
      return 0;
    case 'ReservedTypeAnnotation':
      return 0;
    case 'PromiseTypeAnnotation':
      invariant(typeB.type === 'PromiseTypeAnnotation', EQUALITY_MSG);
      return compareTypeAnnotationForSorting(
        [originalPositionA, typeA.elementType],
        [originalPositionB, typeB.elementType],
      );
    case 'TypeAliasTypeAnnotation':
      invariant(typeB.type === 'TypeAliasTypeAnnotation', EQUALITY_MSG);
      return typeA.name.localeCompare(typeB.name);
    case 'MixedTypeAnnotation':
      return 0;
    default:
      typeA.type as empty;
      return -1;
  }
}

function nameComparison(
  [nameA]: [string, CompleteTypeAnnotation],
  [nameB]: [string, CompleteTypeAnnotation],
) {
  if (nameA === nameB) {
    return 0;
  } else if (nameA < nameB) {
    return -1;
  }
  return 1;
}

function compareNameAnnotationArraysForSorting(
  [originalPositionA, arrayA]: [
    number,
    Array<[string, CompleteTypeAnnotation]>,
  ],
  [originalPositionB, arrayB]: [
    number,
    Array<[string, CompleteTypeAnnotation]>,
  ],
) {
  if (arrayA.length - arrayB.length !== 0) {
    return arrayA.length - arrayB.length;
  }
  const nameSortedA = arrayA.sort(nameComparison);
  const nameSortedB = arrayB.sort(nameComparison);
  for (let i = 0; i < nameSortedA.length; i++) {
    if (nameSortedA[i][0] === nameSortedB[i][0]) {
      const compared = compareTypeAnnotationForSorting(
        [originalPositionA, nameSortedA[i][1]],
        [originalPositionB, nameSortedB[i][1]],
      );
      if (compared !== 0) {
        return compared;
      }
      continue;
    }
    if (nameSortedA[i][0] < nameSortedB[i][0]) {
      return -1;
    }
    return 1;
  }
  return 0;
}

function compareAnnotationArraysForSorting(
  [originalPositionA, arrayA]: [number, ReadonlyArray<CompleteTypeAnnotation>],
  [originalPositionB, arrayB]: [number, ReadonlyArray<CompleteTypeAnnotation>],
) {
  if (arrayA.length - arrayB.length !== 0) {
    return arrayA.length - arrayB.length;
  }
  for (let i = 0; i < arrayA.length; i++) {
    const compared = compareTypeAnnotationForSorting(
      [originalPositionA, arrayA[i]],
      [originalPositionB, arrayB[i]],
    );
    if (compared !== 0) {
      return compared;
    }
    continue;
  }
  return 0;
}

function typeAnnotationArbitraryOrder(annotation: CompleteTypeAnnotation) {
  switch (annotation.type) {
    case 'AnyTypeAnnotation':
      return 0;
    case 'ArrayTypeAnnotation':
      return 1;
    case 'BooleanTypeAnnotation':
      return 2;
    case 'FunctionTypeAnnotation':
      return 3;
    case 'EventEmitterTypeAnnotation':
      return 4;
    case 'PromiseTypeAnnotation':
      return 5;
    case 'GenericObjectTypeAnnotation':
      return 6;
    case 'NullableTypeAnnotation':
      return 9;
    case 'NumberTypeAnnotation':
      return 10;
    case 'Int32TypeAnnotation':
      return 11;
    case 'DoubleTypeAnnotation':
      return 12;
    case 'FloatTypeAnnotation':
      return 13;
    case 'NumberLiteralTypeAnnotation':
      return 14;
    case 'ObjectTypeAnnotation':
      return 15;
    case 'BooleanLiteralTypeAnnotation':
      return 16;
    case 'StringTypeAnnotation':
      return 18;
    case 'StringLiteralTypeAnnotation':
      return 19;
    case 'VoidTypeAnnotation':
      return 20;
    case 'EnumDeclaration':
      return 21;
    case 'EnumDeclarationWithMembers':
      return 22;
    case 'GenericObjectTypeAnnotation':
      return 25;
    case 'TypeAliasTypeAnnotation':
      return 26;
    case 'MixedTypeAnnotation':
      return 27;
    case 'ReservedTypeAnnotation':
      return 28;
    case 'UnionTypeAnnotation':
      return 30;
    case 'ArrayBufferTypeAnnotation':
      return 31;
    default:
      annotation.type as empty;
      return -1;
  }
}
