/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TypeComparisonError} from './ComparisonResult';
import type {
  DiffSummary,
  ErrorStore,
  FormattedDiffSummary,
  FormattedErrorStore,
  FormattedIncompatible,
  FormattedIncompatiblityReport,
  NativeSpecErrorStore,
} from './DiffResults';
import type {CompleteTypeAnnotation} from '@react-native/codegen/src/CodegenSchema';

import {parseValidUnionType} from '@react-native/codegen/src/generators/Utils';

function indentedLineStart(indent: number): string {
  return '\n' + '  '.repeat(indent);
}

export function formatErrorMessage(
  error: TypeComparisonError,
  indent: number = 0,
): string {
  switch (error.type) {
    case 'PropertyComparisonError':
      const propertyPreviousError = error.previousError;
      const formattedProperties = error.mismatchedProperties.map(
        individualPropertyError =>
          indentedLineStart(indent + 1) +
          '-- ' +
          individualPropertyError.property +
          (individualPropertyError.fault
            ? ': ' +
              formatErrorMessage(individualPropertyError.fault, indent + 2)
            : ''),
      );
      return (
        (propertyPreviousError != null
          ? formatErrorMessage(propertyPreviousError, indent) +
            indentedLineStart(indent + 1)
          : '') +
        error.message +
        formattedProperties.join('')
      );
    case 'PositionalComparisonError':
      const formattedPositionalChanges = error.erroneousItems.map(
        ([index, type]) =>
          indentedLineStart(indent + 1) +
          '-- position ' +
          index +
          ' ' +
          formatTypeAnnotation(type),
      );
      return error.message + formattedPositionalChanges.join('');
    case 'TypeAnnotationComparisonError':
    case 'TypeInformationComparisonError':
      const previousError = error.previousError;

      return (
        error.message +
        indentedLineStart(indent + 1) +
        '--new: ' +
        formatTypeAnnotation(error.newerAnnotation) +
        indentedLineStart(indent + 1) +
        '--old: ' +
        formatTypeAnnotation(error.olderAnnotation) +
        (previousError != null
          ? indentedLineStart(indent + 1) +
            '' +
            formatErrorMessage(previousError, indent + 2)
          : '')
      );
    case 'MemberComparisonError':
      const formattedMembers = error.mismatchedMembers.map(
        individualMemberError =>
          indentedLineStart(indent + 1) +
          '-- Member ' +
          individualMemberError.member +
          (individualMemberError.fault
            ? ': ' + formatErrorMessage(individualMemberError.fault, indent + 2)
            : ''),
      );
      return error.message + formattedMembers.join('');
    default:
      error.type as empty;
      return '';
  }
}

function formatTypeAnnotation(annotation: CompleteTypeAnnotation): string {
  switch (annotation.type) {
    case 'AnyTypeAnnotation':
      return 'any';
    case 'ArrayBufferTypeAnnotation':
      return 'ArrayBuffer';
    case 'ArrayTypeAnnotation':
      return 'Array<' + formatTypeAnnotation(annotation.elementType) + '>';
    case 'BooleanTypeAnnotation':
      return 'boolean';
    case 'EnumDeclaration': {
      let shortHandType = '';
      switch (annotation.memberType) {
        case 'StringTypeAnnotation':
          shortHandType = 'string';
          break;
        case 'NumberTypeAnnotation':
          shortHandType = 'number';
          break;
        default:
          annotation.memberType as empty;
          throw new Error('Unexpected enum memberType');
      }

      return `Enum<${shortHandType}>` + '';
    }
    case 'EnumDeclarationWithMembers': {
      let shortHandType = '';
      switch (annotation.memberType) {
        case 'StringTypeAnnotation':
          shortHandType = 'string';
          break;
        case 'NumberTypeAnnotation':
          shortHandType = 'number';
          break;
        default:
          annotation.memberType as empty;
          throw new Error('Unexptected enum memberType');
      }

      return (
        `Enum<${shortHandType}> {` +
        annotation.members
          .map(
            member => `${member.name} = ${formatTypeAnnotation(member.value)}`,
          )
          .join(', ') +
        '}'
      );
    }
    case 'FunctionTypeAnnotation':
      return (
        '(' +
        annotation.params
          .map(
            param =>
              param.name +
              (param.optional ? '?' : '') +
              ': ' +
              formatTypeAnnotation(param.typeAnnotation),
          )
          .join(', ') +
        ')' +
        '=>' +
        formatTypeAnnotation(annotation.returnTypeAnnotation)
      );
    case 'NullableTypeAnnotation':
      return '?' + formatTypeAnnotation(annotation.typeAnnotation);
    case 'NumberTypeAnnotation':
      return 'number';
    case 'DoubleTypeAnnotation':
      return 'double';
    case 'FloatTypeAnnotation':
      return 'float';
    case 'Int32TypeAnnotation':
      return 'int';
    case 'NumberLiteralTypeAnnotation':
      return annotation.value.toString();
    case 'BooleanLiteralTypeAnnotation':
      return annotation.value.toString();
    case 'ObjectTypeAnnotation':
      return (
        '{' +
        annotation.properties
          .map(
            property =>
              property.name +
              (property.optional ? '?' : '') +
              ': ' +
              formatTypeAnnotation(property.typeAnnotation),
          )
          .join(', ') +
        '}'
      );
    case 'StringLiteralTypeAnnotation':
      // If the string is a number, disambiguate from a number literal by adding quotes
      // Other things are obviously strings so quotes unconditionally would just add noise
      return parseInt(annotation.value, 10).toString() === annotation.value ||
        annotation.value.includes(' ')
        ? `'${annotation.value}'`
        : annotation.value;
    case 'UnionTypeAnnotation':
      let validUnionType;
      try {
        validUnionType = parseValidUnionType(annotation);
      } catch (_e: unknown) {
        // parseValidUnionType throws for unsupported union types
        return 'Union<mixed>';
      }
      switch (validUnionType) {
        case 'boolean':
          if (
            annotation.types.every(
              ({type}) => type === 'BooleanLiteralTypeAnnotation',
            )
          ) {
            return (
              '(' +
              // @lint-ignore-every FLOW_INCOMPATIBLE_TYPE_ARG
              (annotation.types as ReadonlyArray<CompleteTypeAnnotation>)
                .map(boolLit => formatTypeAnnotation(boolLit))
                .join(' | ') +
              ')'
            );
          }
          return `Union<boolean>`;
        case 'number':
          if (
            annotation.types.every(
              ({type}) => type === 'NumberLiteralTypeAnnotation',
            )
          ) {
            return (
              '(' +
              // @lint-ignore-every FLOW_INCOMPATIBLE_TYPE_ARG
              (annotation.types as ReadonlyArray<CompleteTypeAnnotation>)
                .map(numLit => formatTypeAnnotation(numLit))
                .join(' | ') +
              ')'
            );
          }
          return `Union<number>`;
        case 'object':
          return `Union<Object>`;
        case 'string':
          if (
            annotation.types.every(
              ({type}) => type === 'StringLiteralTypeAnnotation',
            )
          ) {
            return (
              '(' +
              // @lint-ignore-every FLOW_INCOMPATIBLE_TYPE_ARG
              (annotation.types as ReadonlyArray<CompleteTypeAnnotation>)
                .map(stringLit => formatTypeAnnotation(stringLit))
                .join(' | ') +
              ')'
            );
          }
          // Unions of strings and string literals are treated as just strings
          return `Union<string>`;
        default:
          validUnionType as empty;
          throw new Error(`Unsupported union member type`);
      }
    case 'StringTypeAnnotation':
      return 'string';
    case 'PromiseTypeAnnotation':
      return 'Promise<' + formatTypeAnnotation(annotation.elementType) + '>';
    case 'EventEmitterTypeAnnotation':
      return (
        'EventEmitter<' + formatTypeAnnotation(annotation.typeAnnotation) + '>'
      );
    case 'TypeAliasTypeAnnotation':
    case 'ReservedTypeAnnotation':
      return annotation.name;
    case 'VoidTypeAnnotation':
      return 'void';
    case 'MixedTypeAnnotation':
      return 'mixed';
    case 'GenericObjectTypeAnnotation':
      if (annotation.dictionaryValueType) {
        return `{[string]: ${formatTypeAnnotation(annotation.dictionaryValueType)}`;
      }

      return 'Object';
    default:
      annotation.type as empty;
      return JSON.stringify(annotation);
  }
}

export function formatErrorStore(errorStore: ErrorStore): FormattedErrorStore {
  return {
    message:
      errorStore.typeName +
      ': ' +
      formatErrorMessage(errorStore.errorInformation),
    errorCode: errorStore.errorCode,
  };
}

export function formatNativeSpecErrorStore(
  specError: NativeSpecErrorStore,
): Array<FormattedErrorStore> {
  if (specError.errorInformation) {
    return [
      {
        message:
          specError.nativeSpecName +
          ': ' +
          formatErrorMessage(specError.errorInformation),
        errorCode: specError.errorCode,
      },
    ];
  }

  if (specError.changeInformation?.incompatibleChanges != null) {
    return Array.from(specError.changeInformation.incompatibleChanges).map(
      errorStore => formatErrorStore(errorStore),
    );
  }
  // changeInformation does not contain incompatible changes
  return [];
}

export function formatDiffSet(summary: DiffSummary): FormattedDiffSummary {
  const summaryStatus = summary.status;
  if (summaryStatus === 'ok' || summaryStatus === 'patchable') {
    // $FlowFixMe[incompatible-type] I don't think we can ever get in this branch
    return summary;
  }
  const hasteModules = Object.keys(summary.incompatibilityReport);
  const incompatibles = summary.incompatibilityReport;
  const formattedIncompatibilities: FormattedIncompatiblityReport = {};
  hasteModules.forEach(hasteModule => {
    const incompat = incompatibles[hasteModule];
    const formattedIncompat: FormattedIncompatible = {
      framework: incompat.framework,
    };
    if (incompat.incompatibleSpecs) {
      // nested errors
      formattedIncompat.incompatibleSpecs = incompat.incompatibleSpecs.reduce(
        (
          formattedModuleErrors: ReadonlyArray<FormattedErrorStore>,
          specErrorStore,
        ) =>
          formattedModuleErrors.concat(
            formatNativeSpecErrorStore(specErrorStore),
          ),
        [],
      );
    }

    formattedIncompatibilities[hasteModule] = formattedIncompat;
  });
  return {
    status: summaryStatus as 'incompatible',
    incompatibilityReport: formattedIncompatibilities,
  };
}
