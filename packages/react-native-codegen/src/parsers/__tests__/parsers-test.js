/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use-strict';

import {FlowParser} from '../flow/parser';
import {TypeScriptParser} from '../typescript/parser';

const {
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('../errors');

const hasteModuleName = 'moduleName';
describe('FlowParser', () => {
  const parser = new FlowParser();
  describe('getKeyName', () => {
    describe('when propertyOrIndex is ObjectTypeProperty', () => {
      it('returns property name', () => {
        const property = {
          type: 'ObjectTypeProperty',
          key: {
            name: 'propertyName',
          },
        };

        const expected = 'propertyName';

        expect(parser.getKeyName(property, hasteModuleName)).toEqual(expected);
      });
    });

    describe('when propertyOrIndex is not ObjectTypeProperty or ObjectTypeIndexer', () => {
      it('throw UnsupportedObjectPropertyTypeAnnotationParserError', () => {
        const indexer = {
          type: 'EnumDeclaration',
          memberType: 'NumberTypeAnnotation',
        };

        expect(() => parser.getKeyName(indexer, hasteModuleName)).toThrowError(
          UnsupportedObjectPropertyTypeAnnotationParserError,
        );
      });
    });
  });

  describe('remapUnionTypeAnnotationMemberNames', () => {
    it('returns remaped union annotation member types without duplicates', () => {
      const membersType = [
        {type: 'NumberLiteralTypeAnnotation'},
        {type: 'ObjectTypeAnnotation'},
        {type: 'StringLiteralTypeAnnotation'},
        {type: 'ObjectTypeAnnotation'},
      ];

      expect(parser.remapUnionTypeAnnotationMemberNames(membersType)).toEqual([
        'NumberTypeAnnotation',
        'ObjectTypeAnnotation',
        'StringTypeAnnotation',
      ]);
    });
  });

  describe('isModuleInterface', () => {
    it('returns true if it is a valid node', () => {
      const node = {
        type: 'InterfaceDeclaration',
        extends: [
          {
            type: 'InterfaceExtends',
            id: {
              name: 'TurboModule',
            },
          },
        ],
      };
      expect(parser.isModuleInterface(node)).toBe(true);
    });

    it('returns false if it is a invalid node', () => {
      const node = {};
      expect(parser.isModuleInterface(node)).toBe(false);
    });
  });

  describe('isGenericTypeAnnotation', () => {
    it('returns true if it is a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('GenericTypeAnnotation')).toBe(
        true,
      );
    });

    it('returns false if it is not a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('StringTypeAnnotation')).toBe(
        false,
      );
    });
  });

  describe('callExpressionTypeParameters', () => {
    it('returns type arguments if it is a valid node', () => {
      const node = {
        type: 'CallExpression',
        typeArguments: {
          type: 'TypeParameterInstantiation',
          params: [],
        },
      };
      expect(parser.callExpressionTypeParameters(node)).toEqual({
        type: 'TypeParameterInstantiation',
        params: [],
      });
    });

    it('returns null if it is a invalid node', () => {
      const node = {};
      expect(parser.callExpressionTypeParameters(node)).toBe(null);
    });
  });

  describe('getTypeAnnotationName', () => {
    it('returns type annotation name', () => {
      const typeAnnotation = {
        id: {
          name: 'StringTypeAnnotation',
        },
      };

      expect(parser.getTypeAnnotationName(typeAnnotation)).toBe(
        'StringTypeAnnotation',
      );
    });
  });

  describe('computePartialProperties', () => {
    it('returns partial properties', () => {
      const properties = [
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'a',
          },
          value: {
            type: 'StringTypeAnnotation',
            range: [],
          },
        },
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'b',
          },
          optional: true,
          value: {
            type: 'BooleanTypeAnnotation',
            range: [],
          },
        },
      ];

      const expected = [
        {
          name: 'a',
          optional: true,
          typeAnnotation: {type: 'StringTypeAnnotation'},
        },
        {
          name: 'b',
          optional: true,
          typeAnnotation: {type: 'BooleanTypeAnnotation'},
        },
      ];

      expect(
        parser.computePartialProperties(
          properties,
          'hasteModuleName',
          {},
          {},
          {},
          () => null,
          false,
        ),
      ).toEqual(expected);
    });
  });

  describe('getTypeArgumentParamsFromDeclaration', () => {
    it('returns type arguments params from declaration', () => {
      const declaration = {
        type: 'TypeAlias',
        typeArguments: {
          type: 'TypeParameterDeclaration',
          params: [
            {
              type: 'TypeParameter',
              name: 'T',
            },
          ],
        },
      };

      const expected = [
        {
          type: 'TypeParameter',
          name: 'T',
        },
      ];

      expect(parser.getTypeArgumentParamsFromDeclaration(declaration)).toEqual(
        expected,
      );
    });

    it('returns undefined if declaration type argument params is Invalid', () => {
      const declaration = {
        type: 'TypeAlias',
        typeArguments: {
          type: 'TypeParameterDeclaration',
        },
      };

      expect(parser.getTypeArgumentParamsFromDeclaration(declaration)).toEqual(
        undefined,
      );
    });
  });

  describe('getNativeComponentType', () => {
    it('returns native component type when typeArgumentParams & funcArgumentParams are valid', () => {
      const typeArgumentParams = [
        {
          type: 'TypeParameter',
          name: 'T',
          id: {
            name: 'T',
          },
        },
      ];

      const funcArgumentParams = [
        {
          type: 'StringLiteral',
          value: 'componentName',
        },
      ];

      const expected = {
        propsTypeName: 'T' /* typeArgumentParams[0].id.name */,
        componentName: 'componentName' /* funcArgumentParams[0].value */,
      };

      expect(
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams),
      ).toEqual(expected);
    });

    it('returns undefined when typeArgumentParams & funcArgumentParams are invalid', () => {
      const typeArgumentParams = [
        {
          type: 'TypeParameter',
          name: 'T',
          id: {},
        },
      ];
      const funcArgumentParams = [{}];

      const expected = {
        propsTypeName: undefined /* typeArgumentParams[0].id.name */,
        componentName: undefined /* funcArgumentParams[0].value */,
      };

      expect(
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams),
      ).toEqual(expected);
    });
  });

  describe('isOptionalProperty', () => {
    it('when property is optional', () => {
      const property = {
        value: {
          type: 'TypeAnnotation',
        },
        optional: true,
      };

      expect(parser.isOptionalProperty(property)).toEqual(true);
    });

    it('when property is not optional', () => {
      const property = {
        value: {
          type: 'TypeAnnotation',
        },
        optional: false,
      };

      expect(parser.isOptionalProperty(property)).toEqual(false);
    });

    it('when property value type is NullableTypeAnnotation', () => {
      const property = {
        value: {
          type: 'NullableTypeAnnotation',
        },
        optional: false,
      };

      expect(parser.isOptionalProperty(property)).toEqual(true);
    });
  });

  describe('getTypeAnnotationFromProperty', () => {
    describe('when property value type is NullableTypeAnnotation', () => {
      it('returns typeAnnotation of the value', () => {
        const typeAnnotation = {
          type: 'StringTypeAnnotation',
        };

        const property = {
          value: {
            type: 'NullableTypeAnnotation',
            typeAnnotation: typeAnnotation,
          },
        };

        expect(parser.getTypeAnnotationFromProperty(property)).toEqual(
          typeAnnotation,
        );
      });
    });

    describe('when property value type is not NullableTypeAnnotation', () => {
      it('returns the value', () => {
        const value = {
          type: 'StringTypeAnnotation',
        };

        const property = {
          value: value,
        };

        expect(parser.getTypeAnnotationFromProperty(property)).toEqual(value);
      });
    });
  });

  describe('typeAlias', () => {
    it('returns typeAlias Property', () => {
      expect(parser.typeAlias).toEqual('TypeAlias');
    });
  });

  describe('enumDeclaration', () => {
    it('returns enumDeclaration Property', () => {
      expect(parser.enumDeclaration).toEqual('EnumDeclaration');
    });
  });

  describe('interfaceDeclaration', () => {
    it('returns interfaceDeclaration Property', () => {
      expect(parser.interfaceDeclaration).toEqual('InterfaceDeclaration');
    });
  });

  describe('extractTypeFromTypeAnnotation', () => {
    it('should return the name if typeAnnotation is GenericTypeAnnotation', () => {
      const typeAnnotation = {
        type: 'GenericTypeAnnotation',
        id: {
          name: 'SomeType',
        },
      };

      expect(parser.extractTypeFromTypeAnnotation(typeAnnotation)).toEqual(
        'SomeType',
      );
    });

    it('should return the type if typeAnnotation is not GenericTypeAnnotation', () => {
      const typeAnnotation = {
        type: 'SomeOtherType',
      };

      expect(parser.extractTypeFromTypeAnnotation(typeAnnotation)).toEqual(
        'SomeOtherType',
      );
    });
  });

  describe('getObjectProperties', () => {
    it('returns properties of an object represented by a type annotation', () => {
      const properties = [
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'a',
          },
          value: {
            type: 'StringTypeAnnotation',
            range: [],
          },
        },
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'b',
          },
          optional: true,
          value: {
            type: 'BooleanTypeAnnotation',
            range: [],
          },
        },
      ];

      const typeAnnotation = {
        type: 'TypeAlias',
        properties: properties,
      };

      const expected = properties;

      expect(parser.getObjectProperties(typeAnnotation)).toEqual(expected);
    });

    it('returns undefined if typeAnnotation does not have properties', () => {
      const declaration = {
        type: 'TypeAlias',
      };

      expect(parser.getObjectProperties(declaration)).toEqual(undefined);
    });
  });
  describe('getLiteralValue', () => {
    it('returns value of an union represented, given an option', () => {
      const option = {
        value: 'LiteralValue',
      };
      const expected = option.value;

      expect(parser.getLiteralValue(option)).toEqual(expected);
    });

    it('returns undefined if option does not have value', () => {
      const option = {};

      expect(parser.getLiteralValue(option)).toEqual(undefined);
    });
  });

  describe('parseEnumMembersType', () => {
    const parseEnumBody = (code: string) =>
      parser.getAst(code).body[0].declaration.body;

    it.each([
      ['export enum E {A, B}', 'StringTypeAnnotation'],
      [`export enum E {A = 'a'}`, 'StringTypeAnnotation'],
      ['export enum E of string {A}', 'StringTypeAnnotation'],
      ['export enum E {}', 'StringTypeAnnotation'],
      ['export enum E {A = 1}', 'NumberTypeAnnotation'],
      ['export enum E of number {A = 1}', 'NumberTypeAnnotation'],
      ['export enum E of number {}', 'NumberTypeAnnotation'],
    ])('returns the member type of a parsed `%s`', (code, expected) => {
      expect(parser.parseEnumMembersType(parseEnumBody(code))).toBe(expected);
    });

    it.each([
      'export enum E {A = true}',
      'export enum E of boolean {A = true}',
      'export enum E of symbol {A}',
    ])('throws for a parsed `%s`', code => {
      expect(() => parser.parseEnumMembersType(parseEnumBody(code))).toThrow(
        'Unknown enum type annotation type.',
      );
    });

    it('supports the body node types of older parser versions', () => {
      expect(parser.parseEnumMembersType({type: 'EnumStringBody'})).toBe(
        'StringTypeAnnotation',
      );
      expect(parser.parseEnumMembersType({type: 'EnumNumberBody'})).toBe(
        'NumberTypeAnnotation',
      );
      expect(() =>
        parser.parseEnumMembersType({type: 'EnumBooleanBody'}),
      ).toThrow('Unknown enum type annotation type.');
    });

    it('rejects a parsed boolean enum in a module spec', () => {
      expect(() =>
        parser.parseString(
          `
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';

          export enum SomeEnum {
            A = true,
          }

          export interface Spec extends TurboModule {
            +getEnum: (a: SomeEnum) => string;
          }

          export default TurboModuleRegistry.get<Spec>('NativeSampleTurboModule');
          `,
          'path/NativeSampleTurboModule.js',
        ),
      ).toThrow(/Flow type annotation 'Enum\w*Body' is unsupported/);
    });
  });
});

describe('TypeScriptParser', () => {
  const parser = new TypeScriptParser();
  describe('getKeyName', () => {
    describe('when propertyOrIndex is TSPropertySignature', () => {
      it('returns property name', () => {
        const property = {
          type: 'TSPropertySignature',
          key: {
            name: 'propertyName',
          },
        };

        const expected = 'propertyName';

        expect(parser.getKeyName(property, hasteModuleName)).toEqual(expected);
      });
    });

    describe('when propertyOrIndex is not TSPropertySignature or TSIndexSignature', () => {
      it('throw UnsupportedObjectPropertyTypeAnnotationParserError', () => {
        const indexer = {
          type: 'TSEnumDeclaration',
          memberType: 'NumberTypeAnnotation',
        };

        expect(() => parser.getKeyName(indexer, hasteModuleName)).toThrowError(
          UnsupportedObjectPropertyTypeAnnotationParserError,
        );
      });
    });
  });
  describe('remapUnionTypeAnnotationMemberNames', () => {
    it('returns remaped union annotation member types without duplicates', () => {
      const membersType = [
        {literal: {type: 'NumericLiteral'}},
        {type: 'ObjectTypeAnnotation'},
        {literal: {type: 'StringLiteral'}},
        {type: 'ObjectTypeAnnotation'},
      ];

      expect(parser.remapUnionTypeAnnotationMemberNames(membersType)).toEqual([
        'NumberTypeAnnotation',
        'ObjectTypeAnnotation',
        'StringTypeAnnotation',
      ]);
    });
  });

  describe('isModuleInterface', () => {
    it('returns true if it is a valid node', () => {
      const node = {
        type: 'TSInterfaceDeclaration',
        extends: [
          {
            type: 'TSExpressionWithTypeArguments',
            expression: {
              name: 'TurboModule',
            },
          },
        ],
      };
      expect(parser.isModuleInterface(node)).toBe(true);
    });

    it('returns false if it is a invalid node', () => {
      const node = {};
      expect(parser.isModuleInterface(node)).toBe(false);
    });
  });

  describe('isGenericTypeAnnotation', () => {
    it('returns true if it is a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('TSTypeReference')).toBe(true);
    });

    it('returns false if it is not a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('StringTypeAnnotation')).toBe(
        false,
      );
    });
  });

  describe('callExpressionTypeParameters', () => {
    it('returns type parameters if it is a valid node', () => {
      const node = {
        type: 'CallExpression',
        typeParameters: {
          type: 'TypeParameterInstantiation',
          params: [],
        },
      };
      expect(parser.callExpressionTypeParameters(node)).toEqual({
        type: 'TypeParameterInstantiation',
        params: [],
      });
    });

    it('returns null if it is a invalid node', () => {
      const node = {};
      expect(parser.callExpressionTypeParameters(node)).toBe(null);
    });
  });

  describe('getTypeAnnotationName', () => {
    it('returns type annotation name', () => {
      const typeAnnotation = {
        type: 'TSTypeReference',
        typeName: {
          name: 'Foo',
        },
      };

      expect(parser.getTypeAnnotationName(typeAnnotation)).toEqual('Foo');
    });
  });

  describe('computePartialProperties', () => {
    it('returns partial properties', () => {
      const properties = [
        {
          type: 'TSPropertySignature',
          key: {
            type: 'Identifier',
            name: 'a',
          },
          typeAnnotation: {
            type: 'TSTypeAnnotation',
            typeAnnotation: {
              type: 'TSTypeLiteral',
              key: {
                type: 'Identifier',
                name: 'a',
              },
              members: [],
            },
          },
        },
        {
          type: 'TSPropertySignature',
          key: {
            type: 'Identifier',
            name: 'b',
          },
          optional: true,
          typeAnnotation: {
            type: 'TSTypeAnnotation',
            typeAnnotation: {
              type: 'TSStringKeyword',
              key: {
                type: 'Identifier',
                name: 'b',
              },
              members: [],
            },
          },
        },
      ];

      const expected = [
        {
          name: 'a',
          optional: true,
          typeAnnotation: {properties: [], type: 'ObjectTypeAnnotation'},
        },
        {
          name: 'b',
          optional: true,
          typeAnnotation: {type: 'StringTypeAnnotation'},
        },
      ];

      expect(
        parser.computePartialProperties(
          properties,
          'hasteModuleName',
          {},
          {},
          {},
          () => null,
          false,
        ),
      ).toEqual(expected);
    });
  });

  describe('getTypeArgumentParamsFromDeclaration', () => {
    it('returns type argument params from declaration', () => {
      const declaration = {
        type: 'TypeAlias',
        typeParameters: {
          type: 'TypeParameterDeclaration',
          params: [
            {
              type: 'TypeParameter',
              name: 'T',
            },
          ],
        },
      };

      const expected = [
        {
          type: 'TypeParameter',
          name: 'T',
        },
      ];

      expect(parser.getTypeArgumentParamsFromDeclaration(declaration)).toEqual(
        expected,
      );
    });

    it('returns undefined if declaration type arguments params is Invalid', () => {
      const declaration = {
        type: 'TypeAlias',
        typeParameters: {},
      };

      expect(parser.getTypeArgumentParamsFromDeclaration(declaration)).toEqual(
        undefined,
      );
    });
  });

  describe('getNativeComponentType', () => {
    it('returns native component type when typeArgumentParams & funcArgumentParams are valid', () => {
      const typeArgumentParams = [
        {
          typeName: {
            type: 'Identifier',
            name: 'T',
          },
        },
      ];

      const funcArgumentParams = [
        {
          type: 'ObjectTypeAnnotation',
          value: 'StringTypeAnnotation',
        },
      ];

      const expected = {
        propsTypeName: 'T' /* typeArgumentParams[0].typeName.name */,
        componentName: 'StringTypeAnnotation' /* funcArgumentParams[0].value */,
      };

      expect(
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams),
      ).toEqual(expected);
    });

    it('returns undefined when typeArgumentParams & funcArgumentParams are invalid', () => {
      const typeArgumentParams = [
        {
          typeName: {
            type: 'Invalid',
          },
        },
      ];
      const funcArgumentParams = [{}];

      const expected = {
        propsTypeName: undefined /* typeArgumentParams[0].typeName.name */,
        componentName: undefined /* funcArgumentParams[0].value */,
      };

      expect(
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams),
      ).toEqual(expected);
    });
  });

  describe('isOptionalProperty', () => {
    it('when property is optional', () => {
      const property = {
        optional: true,
      };
      expect(parser.isOptionalProperty(property)).toEqual(true);
    });

    it('when property is undefined or not optional', () => {
      const property = {
        optional: false,
      };
      expect(parser.isOptionalProperty(property)).toEqual(false);
    });
  });

  describe('getTypeAnnotationFromProperty', () => {
    it('returns the type annotation', () => {
      const typeAnnotation = {
        type: 'TSStringKeyword',
        key: {
          type: 'Identifier',
          name: 'b',
        },
        members: [],
      };

      const property = {
        typeAnnotation: {
          type: 'TSTypeAnnotation',
          typeAnnotation: typeAnnotation,
        },
      };

      expect(parser.getTypeAnnotationFromProperty(property)).toEqual(
        typeAnnotation,
      );
    });
  });

  describe('typeAlias', () => {
    it('returns typeAlias Property', () => {
      expect(parser.typeAlias).toEqual('TSTypeAliasDeclaration');
    });
  });

  describe('enumDeclaration', () => {
    it('returns enumDeclaration Property', () => {
      expect(parser.enumDeclaration).toEqual('TSEnumDeclaration');
    });
  });

  describe('interfaceDeclaration', () => {
    it('returns interfaceDeclaration Property', () => {
      expect(parser.interfaceDeclaration).toEqual('TSInterfaceDeclaration');
    });
  });

  describe('extractTypeFromTypeAnnotation', () => {
    it('should return the name if typeAnnotation is TSTypeReference', () => {
      const typeAnnotation = {
        type: 'TSTypeReference',
        typeName: {
          name: 'SomeType',
        },
      };

      expect(parser.extractTypeFromTypeAnnotation(typeAnnotation)).toEqual(
        'SomeType',
      );
    });

    it('should return the type if typeAnnotation is not TSTypeReference', () => {
      const typeAnnotation = {
        type: 'SomeOtherType',
      };

      expect(parser.extractTypeFromTypeAnnotation(typeAnnotation)).toEqual(
        'SomeOtherType',
      );
    });
  });

  describe('getObjectProperties', () => {
    it('returns members of an object represented by a type annotation', () => {
      const members = [
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'a',
          },
          value: {
            type: 'StringTypeAnnotation',
            range: [],
          },
        },
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'b',
          },
          optional: true,
          value: {
            type: 'BooleanTypeAnnotation',
            range: [],
          },
        },
      ];

      const typeAnnotation = {
        type: 'TypeAlias',
        members: members,
      };

      const expected = members;

      expect(parser.getObjectProperties(typeAnnotation)).toEqual(expected);
    });

    it('returns undefined if typeAnnotation does not have members', () => {
      const declaration = {
        type: 'TypeAlias',
      };

      expect(parser.getObjectProperties(declaration)).toEqual(undefined);
    });
  });

  describe('getLiteralValue', () => {
    it('returns literal value of an union represented, given an option', () => {
      const literal = {
        value: 'LiteralValue',
      };
      const option = {
        literal,
      };
      const expected = literal.value;

      expect(parser.getLiteralValue(option)).toEqual(expected);
    });

    it('returns undefined if literal does not have value', () => {
      const option = {
        literal: {},
      };

      expect(parser.getLiteralValue(option)).toEqual(undefined);
    });
  });
});
