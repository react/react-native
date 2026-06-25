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

import type {NativeModuleUnionTypeAnnotation} from '../CodegenSchema';

function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function indent(nice: string, spaces: number): string {
  return nice
    .split('\n')
    .map((line, index) => {
      if (line.length === 0 || index === 0) {
        return line;
      }
      const emptySpaces = new Array<unknown>(spaces + 1).join(' ');
      return emptySpaces + line;
    })
    .join('\n');
}

function toPascalCase(inString: string): string {
  if (inString.length === 0) {
    return inString;
  }

  return capitalize(inString);
}

function toSafeIdentifier(input: string, shouldCapitalize: boolean): string {
  const parts = input.split('-');
  if (!shouldCapitalize) {
    return parts.join('');
  }
  return parts.map(toPascalCase).join('');
}

function toSafeCppString(input: string): string {
  return toSafeIdentifier(input, true);
}

function getEnumName(moduleName: string, origEnumName: string): string {
  const uppercasedPropName = toSafeCppString(origEnumName);
  return `${moduleName}${uppercasedPropName}`;
}

type ValidUnionType = 'boolean' | 'number' | 'object' | 'string';
const NumberTypes = ['NumberTypeAnnotation', 'NumberLiteralTypeAnnotation'];
const StringTypes = ['StringTypeAnnotation', 'StringLiteralTypeAnnotation'];
const ObjectTypes = ['ObjectTypeAnnotation'];
const BooleanTypes = ['BooleanTypeAnnotation', 'BooleanLiteralTypeAnnotation'];
const ValidUnionTypes = [
  ...NumberTypes,
  ...ObjectTypes,
  ...StringTypes,
  ...BooleanTypes,
];

class HeterogeneousUnionError extends Error {
  constructor() {
    super(`Non-homogenous union member types`);
  }
}

function parseValidUnionType(
  annotation: NativeModuleUnionTypeAnnotation,
): ValidUnionType {
  const isUnionOfType = (types: ReadonlyArray<string>): boolean => {
    return annotation.types.every(memberTypeAnnotation =>
      types.includes(memberTypeAnnotation.type),
    );
  };
  if (isUnionOfType(BooleanTypes)) {
    return 'boolean';
  }
  if (isUnionOfType(NumberTypes)) {
    return 'number';
  }
  if (isUnionOfType(ObjectTypes)) {
    return 'object';
  }
  if (isUnionOfType(StringTypes)) {
    return 'string';
  }

  const invalidTypes = annotation.types.filter(member => {
    return !ValidUnionTypes.includes(member.type);
  });

  // Check if union members are all supported but not homogeneous
  // (e.g., mix of number and boolean)
  if (invalidTypes.length === 0) {
    throw new HeterogeneousUnionError();
  } else {
    throw new Error(
      `Unsupported union member types: ${invalidTypes.join(', ')}"`,
    );
  }
}

module.exports = {
  capitalize,
  indent,
  parseValidUnionType,
  toPascalCase,
  toSafeIdentifier,
  toSafeCppString,
  getEnumName,
  HeterogeneousUnionError,
};
