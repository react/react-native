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

import type {Pojo, PojoProperty, PojoTypeAnnotation} from './PojoCollector';

const {capitalize} = require('../../Utils');

type ImportCollector = ($import: string) => void;

function toJavaType(
  typeAnnotation: PojoTypeAnnotation,
  addImport: ImportCollector,
): string {
  const importNullable = () => addImport('androidx.annotation.Nullable');
  const importReadableMap = () =>
    addImport('com.facebook.react.bridge.ReadableMap');
  const importArrayList = () => addImport('java.util.ArrayList');
  const importYogaValue = () => addImport('com.facebook.yoga.YogaValue');
  const importDynamic = () => addImport('com.facebook.react.bridge.Dynamic');
  switch (typeAnnotation.type) {
    /**
     * Primitives
     */
    case 'BooleanTypeAnnotation': {
      if (typeAnnotation.default === null) {
        importNullable();
        return '@Nullable Boolean';
      } else {
        return 'boolean';
      }
    }
    case 'StringTypeAnnotation': {
      importNullable();
      return '@Nullable String';
    }
    case 'DoubleTypeAnnotation': {
      return 'double';
    }
    case 'FloatTypeAnnotation': {
      if (typeAnnotation.default === null) {
        importNullable();
        return '@Nullable Float';
      } else {
        return 'float';
      }
    }
    case 'Int32TypeAnnotation': {
      return 'int';
    }

    /**
     * Enums
     */
    // TODO: Make StringEnumTypeAnnotation type-safe?
    case 'StringEnumTypeAnnotation':
      importNullable();
      return '@Nullable String';
    // TODO: Make Int32EnumTypeAnnotation type-safe?
    case 'Int32EnumTypeAnnotation':
      importNullable();
      return '@Nullable Integer';

    /**
     * Reserved types
     */
    case 'ReservedPropTypeAnnotation': {
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          importNullable();
          return '@Nullable Integer';

        // TODO: Make ImageSourcePrimitive type-safe
        case 'ImageSourcePrimitive':
          importNullable();
          importReadableMap();
          return '@Nullable ReadableMap';

        // TODO: Make ImageRequestPrimitive type-safe
        case 'ImageRequestPrimitive':
          importNullable();
          importReadableMap();
          return '@Nullable ReadableMap';

        // TODO: Make PointPrimitive type-safe
        case 'PointPrimitive':
          importNullable();
          importReadableMap();
          return '@Nullable ReadableMap';

        // TODO: Make EdgeInsetsPrimitive type-safe
        case 'EdgeInsetsPrimitive':
          importNullable();
          importReadableMap();
          return '@Nullable ReadableMap';

        case 'DimensionPrimitive':
          importNullable();
          importYogaValue();
          return '@Nullable YogaValue';

        default:
          typeAnnotation.name as empty;
          throw new Error(
            `Received unknown ReservedPropTypeAnnotation ${typeAnnotation.name}`,
          );
      }
    }

    /**
     * Other Pojo objects
     */
    case 'PojoTypeAliasTypeAnnotation': {
      return typeAnnotation.name;
    }

    /**
     * Arrays
     */
    case 'ArrayTypeAnnotation': {
      const {elementType} = typeAnnotation;

      const elementTypeString = (() => {
        switch (elementType.type) {
          /**
           * Primitives
           */
          case 'BooleanTypeAnnotation': {
            return 'Boolean';
          }
          case 'StringTypeAnnotation': {
            return 'String';
          }
          case 'DoubleTypeAnnotation': {
            return 'Double';
          }
          case 'FloatTypeAnnotation': {
            return 'Float';
          }
          case 'Int32TypeAnnotation': {
            return 'Integer';
          }
          case 'MixedTypeAnnotation': {
            importDynamic();
            return 'Dynamic';
          }

          /**
           * Enums
           */
          // TODO: Make StringEnums type-safe in Pojos
          case 'StringEnumTypeAnnotation': {
            return 'String';
          }

          /**
           * Other Pojo objects
           */
          case 'PojoTypeAliasTypeAnnotation': {
            return elementType.name;
          }

          /**
           * Reserved types
           */
          case 'ReservedPropTypeAnnotation': {
            switch (elementType.name) {
              case 'ColorPrimitive':
                return 'Integer';

              // TODO: Make ImageSourcePrimitive type-safe
              case 'ImageSourcePrimitive':
                importReadableMap();
                return 'ReadableMap';

              // TODO: Make ImageRequestPrimitive type-safe
              case 'ImageRequestPrimitive':
                importReadableMap();
                return 'ReadableMap';

              // TODO: Make PointPrimitive type-safe
              case 'PointPrimitive':
                importReadableMap();
                return 'ReadableMap';

              // TODO: Make EdgeInsetsPrimitive type-safe
              case 'EdgeInsetsPrimitive':
                importReadableMap();
                return 'ReadableMap';

              case 'DimensionPrimitive':
                importYogaValue();
                return 'YogaValue';

              default:
                elementType.name as empty;
                throw new Error(
                  `Received unknown ReservedPropTypeAnnotation ${elementType.name}`,
                );
            }
          }

          // Arrays
          case 'ArrayTypeAnnotation': {
            const {elementType: pojoTypeAliasTypeAnnotation} = elementType;

            importArrayList();
            return `ArrayList<${pojoTypeAliasTypeAnnotation.name}>`;
          }
          default: {
            elementType.type as empty;
            throw new Error(
              `Unrecognized PojoTypeAnnotation Array element type annotation '${elementType.type}'`,
            );
          }
        }
      })();

      importArrayList();
      return `ArrayList<${elementTypeString}>`;
    }

    case 'MixedTypeAnnotation': {
      importDynamic();
      return 'Dynamic';
    }

    default: {
      typeAnnotation.type as empty;
      throw new Error(
        `Unrecognized PojoTypeAnnotation '${typeAnnotation.type}'`,
      );
    }
  }
}

function toJavaMemberName(property: PojoProperty): string {
  return `m${capitalize(property.name)}`;
}

function toJavaMemberDeclaration(
  property: PojoProperty,
  addImport: ImportCollector,
): string {
  const type = toJavaType(property.typeAnnotation, addImport);
  const memberName = toJavaMemberName(property);
  return `private ${type} ${memberName};`;
}

function toJavaGetter(property: PojoProperty, addImport: ImportCollector) {
  const type = toJavaType(property.typeAnnotation, addImport);
  const getterName = `get${capitalize(property.name)}`;
  const memberName = toJavaMemberName(property);

  addImport('com.facebook.proguard.annotations.DoNotStrip');
  return `@DoNotStrip
public ${type} ${getterName}() {
  return ${memberName};
}`;
}

function serializePojo(pojo: Pojo, basePackageName: string): string {
  const importSet: Set<string> = new Set();
  const addImport = ($import: string) => {
    importSet.add($import);
  };

  addImport('com.facebook.proguard.annotations.DoNotStrip');

  const indent = ' '.repeat(2);

  const members = pojo.properties
    .map(property => toJavaMemberDeclaration(property, addImport))
    .map(member => `${indent}${member}`)
    .join('\n');

  const getters = pojo.properties
    .map(property => toJavaGetter(property, addImport))
    .map(getter =>
      getter
        .split('\n')
        .map(line => `${indent}${line}`)
        .join('\n'),
    )
    .join('\n');

  const imports = [...importSet]
    .map($import => `import ${$import};`)
    .sort()
    .join('\n');

  return `/**
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*
* ${'@'}generated by codegen project: GeneratePropsJavaPojo.js
*/

package ${basePackageName}.${pojo.namespace};
${imports === '' ? '' : `\n${imports}\n`}
@DoNotStrip
public class ${pojo.name} {
${members}
${getters}
}
`;
}

module.exports = {serializePojo};
