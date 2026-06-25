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
  NativeModuleBaseTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModuleReturnTypeAnnotation,
  NativeModuleSchema,
} from '../../../../CodegenSchema';

const {
  MissingTypeParameterGenericParserError,
  UnnamedFunctionParamParserError,
  UnsupportedGenericParserError,
  UnsupportedTypeAnnotationParserError,
} = require('../../../errors');
const {unwrapNullable} = require('../../../parsers-commons');
const {TypeScriptParser} = require('../../parser');
const invariant = require('invariant');

const typescriptParser = new TypeScriptParser();

type PrimitiveTypeAnnotationType =
  | 'StringTypeAnnotation'
  | 'NumberTypeAnnotation'
  | 'Int32TypeAnnotation'
  | 'DoubleTypeAnnotation'
  | 'FloatTypeAnnotation'
  | 'BooleanTypeAnnotation';

const PRIMITIVES: ReadonlyArray<[string, PrimitiveTypeAnnotationType]> = [
  ['string', 'StringTypeAnnotation'],
  ['number', 'NumberTypeAnnotation'],
  ['Int32', 'Int32TypeAnnotation'],
  ['Double', 'DoubleTypeAnnotation'],
  ['Float', 'FloatTypeAnnotation'],
  ['boolean', 'BooleanTypeAnnotation'],
];

const RESERVED_FUNCTION_VALUE_TYPE_NAME: ReadonlyArray<'RootTag'> = ['RootTag'];

const MODULE_NAME = 'NativeFoo';

const TYPE_ALIAS_DECLARATIONS = `
type Animal = {
  name: string;
};

type AnimalPointer = Animal;
`;

function expectAnimalTypeAliasToExist(module: NativeModuleSchema) {
  const animalAlias = module.aliasMap.Animal;

  expect(animalAlias).not.toBe(null);
  invariant(animalAlias != null, '');
  expect(animalAlias.type).toBe('ObjectTypeAnnotation');
  expect(animalAlias.properties.length).toBe(1);
  expect(animalAlias.properties[0].name).toBe('name');
  expect(animalAlias.properties[0].optional).toBe(false);

  const [typeAnnotation, nullable] = unwrapNullable(
    animalAlias.properties[0].typeAnnotation,
  );

  expect(typeAnnotation.type).toBe('StringTypeAnnotation');
  expect(nullable).toBe(false);
}

describe('TypeScript Module Parser', () => {
  describe('Parameter Parsing', () => {
    it("should fail parsing when a method has an parameter of type 'any'", () => {
      const parser = () =>
        parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';
          export interface Spec extends TurboModule {
            useArg(arg: any): void;
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

      expect(parser).toThrow(UnsupportedTypeAnnotationParserError);
    });

    it('should fail parsing when a function param type is unamed', () => {
      const parser = () =>
        parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';
          export interface Spec extends TurboModule {
            useArg(boolean): void;
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

      expect(parser).toThrow(UnnamedFunctionParamParserError);
    });

    it('should properly parse negative enums', () => {
      const parser = () =>
        parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';
          enum MyEnum {
            ZERO = 0,
            POSITIVE = 1,
            NEGATIVE = -1,
          }
          export interface Spec extends TurboModule {
            useArg(arg: MyEnum): void;
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

      expect(parser).not.toThrow();
      expect(parser().enumMap.MyEnum.members).toEqual([
        {
          name: 'ZERO',
          value: {
            type: 'NumberLiteralTypeAnnotation',
            value: 0,
          },
        },
        {
          name: 'POSITIVE',
          value: {
            type: 'NumberLiteralTypeAnnotation',
            value: 1,
          },
        },
        {
          name: 'NEGATIVE',
          value: {
            type: 'NumberLiteralTypeAnnotation',
            value: -1,
          },
        },
      ]);
    });

    it('should properly parse enums', () => {
      const parser = () =>
        parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';
          enum MyEnum {
            ZERO = 0,
            POSITIVE = 1,
          }
          export interface Spec extends TurboModule {
            useArg(arg: MyEnum): void;
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

      expect(parser).not.toThrow();
      expect(parser().enumMap.MyEnum.members).toEqual([
        {
          name: 'ZERO',
          value: {
            type: 'NumberLiteralTypeAnnotation',
            value: 0,
          },
        },
        {
          name: 'POSITIVE',
          value: {
            type: 'NumberLiteralTypeAnnotation',
            value: 1,
          },
        },
      ]);
    });

    [
      {nullable: false, optional: false},
      {nullable: false, optional: true},
      {nullable: true, optional: false},
      {nullable: true, optional: true},
    ].forEach(({nullable, optional}) => {
      const PARAM_TYPE_DESCRIPTION =
        nullable && optional
          ? 'a nullable and optional'
          : nullable
            ? 'a nullable'
            : optional
              ? 'an optional'
              : 'a required';

      function annotateArg(paramName: string, paramType: string) {
        if (nullable && optional) {
          return `${paramName}?: ${paramType} | null | void`;
        }
        if (nullable) {
          return `${paramName}: ${paramType} | null | void`;
        }
        if (optional) {
          return `${paramName}?: ${paramType}`;
        }
        return `${paramName}: ${paramType}`;
      }

      function parseParamType(
        paramName: string,
        paramType: string,
      ): [NativeModuleParamTypeAnnotation, NativeModuleSchema] {
        const module = parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';

          ${TYPE_ALIAS_DECLARATIONS}

          export interface Spec extends TurboModule {
            useArg(${annotateArg(paramName, paramType)}): void;
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

        expect(module.spec.methods[0]).not.toBe(null);
        const param = unwrapNullable(module.spec.methods[0].typeAnnotation)[0]
          .params[0];
        expect(param).not.toBe(null);
        expect(param.name).toBe(paramName);
        expect(param.optional).toBe(optional);
        const [paramTypeAnnotation, isParamTypeAnnotationNullable] =
          unwrapNullable(param.typeAnnotation);
        expect(isParamTypeAnnotationNullable).toBe(nullable);

        return [paramTypeAnnotation, module];
      }

      describe(
        (nullable && optional
          ? 'Nullable and Optional'
          : nullable
            ? 'Nullable'
            : optional
              ? 'Optional'
              : 'Required') + ' Parameter',
        () => {
          it(`should not parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Function'`, () => {
            expect(() => parseParamType('arg', 'Function')).toThrow(
              UnsupportedGenericParserError,
            );
          });

          describe('Primitive types', () => {
            PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
              it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} primitive parameter of type '${FLOW_TYPE}'`, () => {
                const [paramTypeAnnotation] = parseParamType('arg', FLOW_TYPE);
                expect(paramTypeAnnotation.type).toBe(PARSED_TYPE_NAME);
              });
            });
          });

          it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Object'`, () => {
            const [paramTypeAnnotation] = parseParamType('arg', 'Object');
            expect(paramTypeAnnotation.type).toBe(
              'GenericObjectTypeAnnotation',
            );
          });

          describe('Reserved Types', () => {
            RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
              it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of reserved type '${FLOW_TYPE}'`, () => {
                const [paramTypeAnnotation] = parseParamType('arg', FLOW_TYPE);

                expect(paramTypeAnnotation.type).toBe('ReservedTypeAnnotation');
                invariant(
                  paramTypeAnnotation.type === 'ReservedTypeAnnotation',
                  'Param must be a Reserved type',
                );

                expect(paramTypeAnnotation.name).toBe(FLOW_TYPE);
              });
            });
          });

          describe('Array Types', () => {
            it(`should not parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array'`, () => {
              expect(() => parseParamType('arg', 'Array')).toThrow(
                MissingTypeParameterGenericParserError,
              );
            });

            function parseParamArrayElementType(
              paramName: string,
              paramType: string,
            ): [NativeModuleBaseTypeAnnotation, NativeModuleSchema] {
              const [paramTypeAnnotation, module] = parseParamType(
                paramName,
                `Array<${paramType}>`,
              );

              expect(paramTypeAnnotation.type).toBe('ArrayTypeAnnotation');
              invariant(paramTypeAnnotation.type === 'ArrayTypeAnnotation', '');

              expect(paramTypeAnnotation.elementType.type).not.toEqual(
                'AnyTypeAnnotation',
              );
              invariant(
                paramTypeAnnotation.elementType.type !== 'AnyTypeAnnotation',
                '',
              );
              const [elementType, isElementTypeNullable] =
                unwrapNullable<NativeModuleBaseTypeAnnotation>(
                  paramTypeAnnotation.elementType,
                );
              expect(isElementTypeNullable).toBe(false);
              return [elementType, module];
            }

            // TODO: Do we support nullable element types?

            describe('Primitive Element Types', () => {
              PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array<${FLOW_TYPE}>'`, () => {
                  const [elementType] = parseParamArrayElementType(
                    'arg',
                    FLOW_TYPE,
                  );
                  expect(elementType.type).toBe(PARSED_TYPE_NAME);
                });
              });
            });

            describe('Reserved Element Types', () => {
              RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array<${FLOW_TYPE}>'`, () => {
                  const [elementType] = parseParamArrayElementType(
                    'arg',
                    FLOW_TYPE,
                  );
                  expect(elementType.type).toBe('ReservedTypeAnnotation');
                  invariant(elementType.type === 'ReservedTypeAnnotation', '');

                  expect(elementType.name).toBe(FLOW_TYPE);
                });
              });
            });

            it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array<Object>'`, () => {
              const [elementType] = parseParamArrayElementType('arg', 'Object');
              expect(elementType.type).toBe('GenericObjectTypeAnnotation');
            });

            it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of some array of an alias`, () => {
              const [elementType, module] = parseParamArrayElementType(
                'arg',
                'Animal',
              );
              expect(elementType.type).toBe('TypeAliasTypeAnnotation');
              invariant(elementType.type === 'TypeAliasTypeAnnotation', '');

              expect(elementType.name).toBe('Animal');
              expectAnimalTypeAliasToExist(module);
            });

            it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter of type 'Array<{foo: string | null | void}>'`, () => {
              const [elementType] = parseParamArrayElementType(
                'arg',
                '{foo: string | null | void}',
              );
              expect(elementType).not.toBe(null);

              expect(elementType.type).toBe('ObjectTypeAnnotation');
              invariant(elementType.type === 'ObjectTypeAnnotation', '');

              const {properties} = elementType;
              invariant(properties != null, '');

              expect(properties).not.toBe(null);
              expect(properties[0]).not.toBe(null);
              expect(properties[0].name).toBe('foo');
              expect(properties[0].typeAnnotation).not.toBe(null);

              const [typeAnnotation, isPropertyNullable] = unwrapNullable(
                properties[0].typeAnnotation,
              );

              expect(typeAnnotation.type).toBe('StringTypeAnnotation');
              expect(isPropertyNullable).toBe(true);
              expect(properties[0].optional).toBe(false);
            });
          });

          it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of some type alias`, () => {
            const [paramTypeAnnotation, module] = parseParamType(
              'arg',
              'Animal',
            );
            expect(paramTypeAnnotation.type).toBe('TypeAliasTypeAnnotation');
            invariant(
              paramTypeAnnotation.type === 'TypeAliasTypeAnnotation',
              '',
            );

            expect(paramTypeAnnotation.name).toBe('Animal');
            expectAnimalTypeAliasToExist(module);
          });

          it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of some type alias that points to another type alias`, () => {
            const [paramTypeAnnotation, module] = parseParamType(
              'arg',
              'AnimalPointer',
            );
            expect(paramTypeAnnotation.type).toBe('TypeAliasTypeAnnotation');
            invariant(
              paramTypeAnnotation.type === 'TypeAliasTypeAnnotation',
              '',
            );

            expect(paramTypeAnnotation.name).toBe('Animal');
            expectAnimalTypeAliasToExist(module);
          });

          it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of some type alias that points to another nullable type alias`, () => {
            const module = parseModule(`
              import type {TurboModule} from 'RCTExport';
              import * as TurboModuleRegistry from 'TurboModuleRegistry';

              type Animal = {
                name: string,
              } | null | void;

              type AnimalPointer = Animal;

              export interface Spec extends TurboModule {
                useArg(${annotateArg('arg', 'AnimalPointer')}): void;
              }
              export default TurboModuleRegistry.get<Spec>('Foo');
            `);

            expect(module.spec.methods[0]).not.toBe(null);
            const param = unwrapNullable(
              module.spec.methods[0].typeAnnotation,
            )[0].params[0];
            expect(param.name).toBe('arg');
            expect(param.optional).toBe(optional);

            // The TypeAliasAnnotation is called Animal, and is nullable
            const [paramTypeAnnotation, isParamTypeAnnotationNullable] =
              unwrapNullable(param.typeAnnotation);
            expect(paramTypeAnnotation.type).toBe('TypeAliasTypeAnnotation');
            invariant(
              paramTypeAnnotation.type === 'TypeAliasTypeAnnotation',
              '',
            );
            expect(paramTypeAnnotation.name).toBe('Animal');
            expect(isParamTypeAnnotationNullable).toBe(true);

            // The Animal type alias RHS is valid, and non-null
            expectAnimalTypeAliasToExist(module);
          });

          [
            {nullable: false, optional: false},
            {nullable: false, optional: true},
            {nullable: true, optional: false},
            {nullable: true, optional: true},
          ].forEach(({nullable: isPropNullable, optional: isPropOptional}) => {
            const PROP_TYPE_DESCRIPTION =
              isPropNullable && isPropOptional
                ? 'a nullable and optional'
                : isPropNullable
                  ? 'a nullable'
                  : isPropOptional
                    ? 'an optional'
                    : 'a required';

            function annotateProp(propName: string, propType: string) {
              if (isPropNullable && isPropOptional) {
                return `${propName}?: ${propType} | null | void`;
              }
              if (isPropNullable) {
                return `${propName}: ${propType} | null | void`;
              }
              if (isPropOptional) {
                return `${propName}?: ${propType}`;
              }
              return `${propName}: ${propType}`;
            }

            function parseParamTypeObjectLiteralProp(
              propName: string,
              propType: string,
            ): [
              Readonly<{
                name: string,
                optional: boolean,
                typeAnnotation: NativeModuleBaseTypeAnnotation,
              }>,
              NativeModuleSchema,
            ] {
              const [paramTypeAnnotation, module] = parseParamType(
                'arg',
                `{${annotateProp(propName, propType)}}`,
              );

              expect(paramTypeAnnotation.type).toBe('ObjectTypeAnnotation');
              invariant(
                paramTypeAnnotation.type === 'ObjectTypeAnnotation',
                '',
              );

              const {properties} = paramTypeAnnotation;

              expect(properties).not.toBe(null);
              invariant(properties != null, '');

              expect(properties.length).toBe(1);
              expect(properties[0].name).toBe(propName);
              expect(properties[0].optional).toBe(isPropOptional);

              const [propertyTypeAnnotation, isPropertyTypeAnnotationNullable] =
                unwrapNullable(properties[0].typeAnnotation);

              expect(propertyTypeAnnotation).not.toBe(null);
              expect(isPropertyTypeAnnotationNullable).toBe(isPropNullable);

              return [
                {
                  ...properties[0],
                  typeAnnotation: propertyTypeAnnotation,
                },
                module,
              ];
            }

            describe(
              (isPropNullable && isPropOptional
                ? 'Nullable and Optional'
                : isPropNullable
                  ? 'Nullable'
                  : isPropOptional
                    ? 'Optional'
                    : 'Required') + ' Property',
              () => {
                describe('Props with Primitive Types', () => {
                  PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                    it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of primitive type '${FLOW_TYPE}'`, () => {
                      const [prop] = parseParamTypeObjectLiteralProp(
                        'prop',
                        FLOW_TYPE,
                      );
                      expect(prop.typeAnnotation.type).toBe(PARSED_TYPE_NAME);
                    });
                  });
                });

                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Object'`, () => {
                  const [prop] = parseParamTypeObjectLiteralProp(
                    'prop',
                    'Object',
                  );
                  expect(prop.typeAnnotation.type).toBe(
                    'GenericObjectTypeAnnotation',
                  );
                });

                describe('Props with Reserved Types', () => {
                  RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                    it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of reserved type '${FLOW_TYPE}'`, () => {
                      const [prop] = parseParamTypeObjectLiteralProp(
                        'prop',
                        FLOW_TYPE,
                      );
                      expect(prop.typeAnnotation.type).toBe(
                        'ReservedTypeAnnotation',
                      );
                      invariant(
                        prop.typeAnnotation.type === 'ReservedTypeAnnotation',
                        '',
                      );

                      expect(prop.typeAnnotation.name).toBe(FLOW_TYPE);
                    });
                  });
                });

                describe('Props with Array Types', () => {
                  it(`should not parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array`, () => {
                    expect(() =>
                      parseParamTypeObjectLiteralProp('prop', 'Array'),
                    ).toThrow(MissingTypeParameterGenericParserError);
                  });

                  function parseArrayElementType(
                    propName: string,
                    arrayElementType: string,
                  ): [NativeModuleBaseTypeAnnotation, NativeModuleSchema] {
                    const [property, module] = parseParamTypeObjectLiteralProp(
                      'propName',
                      `Array<${arrayElementType}>`,
                    );
                    expect(property.typeAnnotation.type).toBe(
                      'ArrayTypeAnnotation',
                    );
                    invariant(
                      property.typeAnnotation.type === 'ArrayTypeAnnotation',
                      '',
                    );

                    const {elementType: nullableElementType} =
                      property.typeAnnotation;
                    expect(nullableElementType.type).not.toEqual(
                      'AnyTypeAnnotation',
                    );

                    invariant(
                      nullableElementType.type !== 'AnyTypeAnnotation',
                      '',
                    );
                    const [elementType, isElementTypeNullable] =
                      unwrapNullable<NativeModuleBaseTypeAnnotation>(
                        nullableElementType,
                      );

                    expect(isElementTypeNullable).toBe(false);

                    return [elementType, module];
                  }

                  PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                    it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array<${FLOW_TYPE}>'`, () => {
                      const [elementType] = parseArrayElementType(
                        'prop',
                        FLOW_TYPE,
                      );

                      expect(elementType.type).toBe(PARSED_TYPE_NAME);
                    });
                  });

                  RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                    it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array<${FLOW_TYPE}>'`, () => {
                      const [elementType] = parseArrayElementType(
                        'prop',
                        FLOW_TYPE,
                      );

                      expect(elementType.type).toBe('ReservedTypeAnnotation');
                      invariant(
                        elementType.type === 'ReservedTypeAnnotation',
                        '',
                      );
                      expect(elementType.name).toBe(FLOW_TYPE);
                    });
                  });

                  it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type  'Array<Object>'`, () => {
                    const [elementType] = parseArrayElementType(
                      'prop',
                      'Object',
                    );
                    expect(elementType.type).toBe(
                      'GenericObjectTypeAnnotation',
                    );
                  });

                  it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type of some array of an alias`, () => {
                    const [elementType, module] = parseArrayElementType(
                      'prop',
                      'Animal',
                    );

                    expect(elementType.type).toBe('TypeAliasTypeAnnotation');
                    invariant(
                      elementType.type === 'TypeAliasTypeAnnotation',
                      '',
                    );

                    expect(elementType.name).toBe('Animal');
                    expectAnimalTypeAliasToExist(module);
                  });

                  it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of 'Array<{foo: string | null | void}>'`, () => {
                    const [elementType] = parseArrayElementType(
                      'prop',
                      '{foo: string | null | void}',
                    );

                    expect(elementType.type).toBe('ObjectTypeAnnotation');
                    invariant(elementType.type === 'ObjectTypeAnnotation', '');

                    const {properties} = elementType;
                    expect(properties).not.toBe(null);
                    invariant(properties != null, '');

                    expect(properties[0]).not.toBe(null);
                    expect(properties[0].name).toBe('foo');
                    expect(properties[0].typeAnnotation).not.toBe(null);

                    const [
                      propertyTypeAnnotation,
                      isPropertyTypeAnnotationNullable,
                    ] = unwrapNullable(properties[0].typeAnnotation);

                    expect(propertyTypeAnnotation.type).toBe(
                      'StringTypeAnnotation',
                    );
                    expect(isPropertyTypeAnnotationNullable).toBe(true);
                    expect(properties[0].optional).toBe(false);
                  });
                });

                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type '{foo: string | null | void}'`, () => {
                  const [property] = parseParamTypeObjectLiteralProp(
                    'prop',
                    '{foo: string | null | void}',
                  );

                  expect(property.typeAnnotation.type).toBe(
                    'ObjectTypeAnnotation',
                  );
                  invariant(
                    property.typeAnnotation.type === 'ObjectTypeAnnotation',
                    '',
                  );

                  const {properties} = property.typeAnnotation;
                  expect(properties).not.toBe(null);
                  invariant(properties != null, '');

                  expect(properties[0]).not.toBe(null);
                  expect(properties[0].name).toBe('foo');

                  const [
                    propertyTypeAnnotation,
                    isPropertyTypeAnnotationNullable,
                  ] = unwrapNullable(properties[0].typeAnnotation);

                  expect(propertyTypeAnnotation.type).toBe(
                    'StringTypeAnnotation',
                  );
                  expect(isPropertyTypeAnnotationNullable).toBe(true);
                  expect(properties[0].optional).toBe(false);
                });

                it(`should parse methods that have ${PARAM_TYPE_DESCRIPTION} parameter type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of some type alias`, () => {
                  const [property, module] = parseParamTypeObjectLiteralProp(
                    'prop',
                    'Animal',
                  );

                  expect(property.typeAnnotation.type).toBe(
                    'TypeAliasTypeAnnotation',
                  );
                  invariant(
                    property.typeAnnotation.type === 'TypeAliasTypeAnnotation',
                    '',
                  );

                  expect(property.typeAnnotation.name).toBe('Animal');
                  expectAnimalTypeAliasToExist(module);
                });
              },
            );
          });
        },
      );
    });
  });

  describe('Return Parsing', () => {
    it('should parse methods that have a return type of void', () => {
      const module = parseModule(`
        import type {TurboModule} from 'RCTExport';
        import * as TurboModuleRegistry from 'TurboModuleRegistry';
        export interface Spec extends TurboModule {
          useArg(): void;
        }
        export default TurboModuleRegistry.get<Spec>('Foo');
      `);

      expect(module.spec.methods[0]).not.toBe(null);

      const [functionTypeAnnotation, isFunctionTypeAnnotationNullable] =
        unwrapNullable(module.spec.methods[0].typeAnnotation);
      expect(isFunctionTypeAnnotationNullable).toBe(false);

      const [returnTypeAnnotation, isReturnTypeAnnotationNullable] =
        unwrapNullable(functionTypeAnnotation.returnTypeAnnotation);
      expect(returnTypeAnnotation.type).toBe('VoidTypeAnnotation');
      expect(isReturnTypeAnnotationNullable).toBe(false);
    });

    [true, false].forEach(IS_RETURN_TYPE_NULLABLE => {
      const RETURN_TYPE_DESCRIPTION = IS_RETURN_TYPE_NULLABLE
        ? 'a nullable'
        : 'a non-nullable';
      const annotateRet = (retType: string) =>
        IS_RETURN_TYPE_NULLABLE ? `${retType} | null | void` : retType;

      function parseReturnType(
        flowType: string,
      ): [NativeModuleReturnTypeAnnotation, NativeModuleSchema] {
        const module = parseModule(`
          import type {TurboModule} from 'RCTExport';
          import * as TurboModuleRegistry from 'TurboModuleRegistry';

          ${TYPE_ALIAS_DECLARATIONS}

          export interface Spec extends TurboModule {
            useArg(): ${annotateRet(flowType)};
          }
          export default TurboModuleRegistry.get<Spec>('Foo');
        `);

        expect(module.spec.methods[0]).not.toBe(null);
        const [functionTypeAnnotation, isFunctionTypeAnnotationNullable] =
          unwrapNullable(module.spec.methods[0].typeAnnotation);
        expect(isFunctionTypeAnnotationNullable).toBe(false);

        const [returnTypeAnnotation, isReturnTypeAnnotationNullable] =
          unwrapNullable(functionTypeAnnotation.returnTypeAnnotation);
        expect(isReturnTypeAnnotationNullable).toBe(IS_RETURN_TYPE_NULLABLE);

        return [returnTypeAnnotation, module];
      }

      describe(
        IS_RETURN_TYPE_NULLABLE ? 'Nullable Returns' : 'Non-Nullable Returns',
        () => {
          ['Promise<void>', 'Promise<{}>'].forEach(promiseFlowType => {
            it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type '${promiseFlowType}'`, () => {
              const [returnTypeAnnotation] = parseReturnType(promiseFlowType);
              expect(returnTypeAnnotation.type).toBe('PromiseTypeAnnotation');
            });
          });

          describe('Primitive Types', () => {
            PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
              it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} primitive return of type '${FLOW_TYPE}'`, () => {
                const [returnTypeAnnotation] = parseReturnType(FLOW_TYPE);
                expect(returnTypeAnnotation.type).toBe(PARSED_TYPE_NAME);
              });
            });
          });

          describe('Reserved Types', () => {
            RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
              it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} reserved return of type '${FLOW_TYPE}'`, () => {
                const [returnTypeAnnotation] = parseReturnType(FLOW_TYPE);
                expect(returnTypeAnnotation.type).toBe(
                  'ReservedTypeAnnotation',
                );
                invariant(
                  returnTypeAnnotation.type === 'ReservedTypeAnnotation',
                  '',
                );
                expect(returnTypeAnnotation.name).toBe(FLOW_TYPE);
              });
            });
          });

          describe('Array Types', () => {
            it(`should not parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array'`, () => {
              expect(() => parseReturnType('Array')).toThrow(
                MissingTypeParameterGenericParserError,
              );
            });

            function parseArrayElementReturnType(
              flowType: string,
            ): [NativeModuleBaseTypeAnnotation, NativeModuleSchema] {
              const [returnTypeAnnotation, module] = parseReturnType(
                'Array' + (flowType != null ? `<${flowType}>` : ''),
              );
              expect(returnTypeAnnotation.type).toBe('ArrayTypeAnnotation');
              invariant(
                returnTypeAnnotation.type === 'ArrayTypeAnnotation',
                '',
              );

              const arrayTypeAnnotation = returnTypeAnnotation;

              const {elementType} = arrayTypeAnnotation;
              expect(elementType.type).not.toEqual('AnyTypeAnnotation');
              invariant(elementType.type !== 'AnyTypeAnnotation', '');

              const [elementTypeAnnotation, isElementTypeAnnotation] =
                unwrapNullable<NativeModuleBaseTypeAnnotation>(elementType);
              expect(isElementTypeAnnotation).toBe(false);

              return [elementTypeAnnotation, module];
            }

            // TODO: Do we support nullable element types?

            describe('Primitive Element Types', () => {
              PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array<${FLOW_TYPE}>'`, () => {
                  const [elementType] = parseArrayElementReturnType(FLOW_TYPE);
                  expect(elementType.type).toBe(PARSED_TYPE_NAME);
                });
              });
            });

            describe('Reserved Element Types', () => {
              RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array<${FLOW_TYPE}>'`, () => {
                  const [elementType] = parseArrayElementReturnType(FLOW_TYPE);
                  expect(elementType.type).toBe('ReservedTypeAnnotation');
                  invariant(elementType.type === 'ReservedTypeAnnotation', '');

                  expect(elementType.name).toBe(FLOW_TYPE);
                });
              });
            });

            it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array<Object>'`, () => {
              const [elementType] = parseArrayElementReturnType('Object');
              expect(elementType.type).toBe('GenericObjectTypeAnnotation');
            });

            it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of some array of an alias`, () => {
              const [elementType, module] =
                parseArrayElementReturnType('Animal');
              expect(elementType.type).toBe('TypeAliasTypeAnnotation');
              invariant(elementType.type === 'TypeAliasTypeAnnotation', '');
              expect(elementType.name).toBe('Animal');
              expectAnimalTypeAliasToExist(module);
            });

            it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Array<{foo: string | null | void}>'`, () => {
              const [elementType] = parseArrayElementReturnType(
                '{foo: string | null | void}',
              );
              expect(elementType.type).toBe('ObjectTypeAnnotation');
              invariant(elementType.type === 'ObjectTypeAnnotation', '');

              const {properties} = elementType;
              expect(properties).not.toBe(null);
              invariant(properties != null, '');

              expect(properties[0]).not.toBe(null);
              expect(properties[0].name).toBe('foo');
              expect(properties[0].typeAnnotation).not.toBe(null);

              const [propertyTypeAnnotation, isPropertyTypeAnnotationNullable] =
                unwrapNullable(properties[0].typeAnnotation);

              expect(propertyTypeAnnotation.type).toBe('StringTypeAnnotation');
              expect(isPropertyTypeAnnotationNullable).toBe(true);
              expect(properties[0].optional).toBe(false);
            });
          });

          it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of some type alias`, () => {
            const [returnTypeAnnotation, module] = parseReturnType('Animal');
            expect(returnTypeAnnotation.type).toBe('TypeAliasTypeAnnotation');
            invariant(
              returnTypeAnnotation.type === 'TypeAliasTypeAnnotation',
              '',
            );
            expect(returnTypeAnnotation.name).toBe('Animal');
            expectAnimalTypeAliasToExist(module);
          });

          it(`should not parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Function'`, () => {
            expect(() => parseReturnType('Function')).toThrow(
              UnsupportedGenericParserError,
            );
          });

          it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return of type 'Object'`, () => {
            const [returnTypeAnnotation] = parseReturnType('Object');
            expect(returnTypeAnnotation.type).toBe(
              'GenericObjectTypeAnnotation',
            );
          });

          describe('Object Literals Types', () => {
            // TODO: Inexact vs exact object literals?

            it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an empty object literal`, () => {
              const [returnTypeAnnotation] = parseReturnType('{}');
              expect(returnTypeAnnotation.type).toBe('ObjectTypeAnnotation');
              invariant(
                returnTypeAnnotation.type === 'ObjectTypeAnnotation',
                '',
              );

              // Validate properties of object literal
              expect(returnTypeAnnotation.properties).not.toBe(null);
              expect(returnTypeAnnotation.properties?.length).toBe(0);
            });

            [
              {nullable: false, optional: false},
              {nullable: false, optional: true},
              {nullable: true, optional: false},
              {nullable: true, optional: true},
            ].forEach(({nullable, optional}) => {
              const PROP_TYPE_DESCRIPTION =
                nullable && optional
                  ? 'a nullable and optional'
                  : nullable
                    ? 'a nullable'
                    : optional
                      ? 'an optional'
                      : 'a required';

              function annotateProp(propName: string, propType: string) {
                if (nullable && optional) {
                  return `${propName}?: ${propType} | null | void`;
                }
                if (nullable) {
                  return `${propName}: ${propType} | null | void`;
                }
                if (optional) {
                  return `${propName}?: ${propType}`;
                }
                return `${propName}: ${propType}`;
              }

              function parseObjectLiteralReturnTypeProp(
                propName: string,
                propType: string,
              ): [
                Readonly<{
                  name: string,
                  optional: boolean,
                  typeAnnotation: NativeModuleBaseTypeAnnotation,
                }>,
                NativeModuleSchema,
              ] {
                const [returnTypeAnnotation, module] = parseReturnType(
                  `{${annotateProp(propName, propType)}}`,
                );
                expect(returnTypeAnnotation.type).toBe('ObjectTypeAnnotation');
                invariant(
                  returnTypeAnnotation.type === 'ObjectTypeAnnotation',
                  '',
                );

                const properties = returnTypeAnnotation.properties;
                expect(properties).not.toBe(null);
                invariant(properties != null, '');

                expect(properties.length).toBe(1);

                // Validate property
                const property = properties[0];
                expect(property.name).toBe(propName);
                expect(property.optional).toBe(optional);

                const [
                  propertyTypeAnnotation,
                  isPropertyTypeAnnotationNullable,
                ] = unwrapNullable(property.typeAnnotation);

                expect(propertyTypeAnnotation).not.toBe(null);
                expect(isPropertyTypeAnnotationNullable).toBe(nullable);
                return [
                  {
                    ...property,
                    typeAnnotation: propertyTypeAnnotation,
                  },
                  module,
                ];
              }

              describe(
                (nullable && optional
                  ? 'Nullable and Optional'
                  : nullable
                    ? 'Nullable'
                    : optional
                      ? 'Optional'
                      : 'Required') + ' Property',
                () => {
                  /**
                   * TODO: Fill out props in promise
                   */

                  describe('Props with Primitive Types', () => {
                    PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                      it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of primitive type '${FLOW_TYPE}'`, () => {
                        const [property] = parseObjectLiteralReturnTypeProp(
                          'prop',
                          FLOW_TYPE,
                        );
                        expect(property.typeAnnotation.type).toBe(
                          PARSED_TYPE_NAME,
                        );
                      });
                    });
                  });

                  it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Object'`, () => {
                    const [property] = parseObjectLiteralReturnTypeProp(
                      'prop',
                      'Object',
                    );

                    expect(property.typeAnnotation.type).toBe(
                      'GenericObjectTypeAnnotation',
                    );
                  });

                  describe('Props with Reserved Types', () => {
                    RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                      it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of reserved type '${FLOW_TYPE}'`, () => {
                        const [property] = parseObjectLiteralReturnTypeProp(
                          'prop',
                          FLOW_TYPE,
                        );

                        expect(property.typeAnnotation.type).toBe(
                          'ReservedTypeAnnotation',
                        );
                        invariant(
                          property.typeAnnotation.type ===
                            'ReservedTypeAnnotation',
                          '',
                        );

                        expect(property.typeAnnotation.name).toBe(FLOW_TYPE);
                      });
                    });
                  });

                  describe('Props with Array Types', () => {
                    it(`should not parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array`, () => {
                      expect(() =>
                        parseObjectLiteralReturnTypeProp('prop', 'Array'),
                      ).toThrow(MissingTypeParameterGenericParserError);
                    });

                    function parseArrayElementType(
                      propName: string,
                      arrayElementType: string,
                    ): [NativeModuleBaseTypeAnnotation, NativeModuleSchema] {
                      const [property, module] =
                        parseObjectLiteralReturnTypeProp(
                          propName,
                          `Array<${arrayElementType}>`,
                        );
                      expect(property.name).toBe(propName);
                      expect(property.typeAnnotation.type).toBe(
                        'ArrayTypeAnnotation',
                      );
                      invariant(
                        property.typeAnnotation.type === 'ArrayTypeAnnotation',
                        '',
                      );

                      const {elementType: nullableElementType} =
                        property.typeAnnotation;
                      expect(nullableElementType).not.toEqual(
                        'AnyTypeAnnotation',
                      );
                      invariant(
                        nullableElementType.type !== 'AnyTypeAnnotation',
                        '',
                      );

                      const [elementType, isElementTypeNullable] =
                        unwrapNullable<NativeModuleBaseTypeAnnotation>(
                          nullableElementType,
                        );
                      expect(isElementTypeNullable).toBe(false);

                      return [elementType, module];
                    }

                    PRIMITIVES.forEach(([FLOW_TYPE, PARSED_TYPE_NAME]) => {
                      it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array<${FLOW_TYPE}>'`, () => {
                        const [elementType] = parseArrayElementType(
                          'prop',
                          FLOW_TYPE,
                        );
                        expect(elementType.type).toBe(PARSED_TYPE_NAME);
                      });
                    });

                    RESERVED_FUNCTION_VALUE_TYPE_NAME.forEach(FLOW_TYPE => {
                      it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type 'Array<${FLOW_TYPE}>'`, () => {
                        const [elementType] = parseArrayElementType(
                          'prop',
                          FLOW_TYPE,
                        );
                        expect(elementType.type).toBe('ReservedTypeAnnotation');
                        invariant(
                          elementType.type === 'ReservedTypeAnnotation',
                          '',
                        );

                        expect(elementType.name).toBe(FLOW_TYPE);
                      });
                    });

                    it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type  'Array<Object>'`, () => {
                      const [elementType] = parseArrayElementType(
                        'prop',
                        'Object',
                      );
                      expect(elementType).not.toBe(null);
                      expect(elementType.type).toBe(
                        'GenericObjectTypeAnnotation',
                      );
                    });

                    it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type of some array of an aliase`, () => {
                      const [elementType, module] = parseArrayElementType(
                        'prop',
                        'Animal',
                      );
                      expect(elementType.type).toBe('TypeAliasTypeAnnotation');
                      invariant(
                        elementType.type === 'TypeAliasTypeAnnotation',
                        '',
                      );
                      expect(elementType.name).toBe('Animal');
                      expectAnimalTypeAliasToExist(module);
                    });

                    it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of type  'Array<{foo: string | null | void}>'`, () => {
                      const [elementType] = parseArrayElementType(
                        'prop',
                        '{foo: string | null | void}',
                      );
                      expect(elementType.type).toBe('ObjectTypeAnnotation');
                      invariant(
                        elementType.type === 'ObjectTypeAnnotation',
                        '',
                      );

                      const {properties} = elementType;
                      invariant(properties != null, '');
                      expect(properties).not.toBe(null);
                      expect(properties[0]).not.toBe(null);
                      expect(properties[0].name).toBe('foo');
                      expect(properties[0].optional).toBe(false);

                      const [
                        propertyTypeAnnotation,
                        isPropertyTypeAnnotationNullable,
                      ] = unwrapNullable(properties[0].typeAnnotation);

                      expect(propertyTypeAnnotation.type).toBe(
                        'StringTypeAnnotation',
                      );
                      expect(isPropertyTypeAnnotationNullable).toBe(true);
                    });
                  });

                  it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of '{foo: string | null | void}'`, () => {
                    const [property] = parseObjectLiteralReturnTypeProp(
                      'prop',
                      '{foo: string | null | void}',
                    );

                    expect(property.typeAnnotation.type).toBe(
                      'ObjectTypeAnnotation',
                    );
                    invariant(
                      property.typeAnnotation.type === 'ObjectTypeAnnotation',
                      '',
                    );

                    const {properties} = property.typeAnnotation;

                    expect(properties).not.toBe(null);
                    invariant(properties != null, '');

                    expect(properties[0]).not.toBe(null);
                    expect(properties[0].name).toBe('foo');
                    expect(properties[0].optional).toBe(false);

                    const [
                      propertyTypeAnnotation,
                      isPropertyTypeAnnotationNullable,
                    ] = unwrapNullable(properties[0].typeAnnotation);

                    expect(propertyTypeAnnotation.type).toBe(
                      'StringTypeAnnotation',
                    );
                    expect(isPropertyTypeAnnotationNullable).toBe(true);
                  });

                  it(`should parse methods that have ${RETURN_TYPE_DESCRIPTION} return type of an object literal with ${PROP_TYPE_DESCRIPTION} prop of some type alias`, () => {
                    const [property, module] = parseObjectLiteralReturnTypeProp(
                      'prop',
                      'Animal',
                    );

                    expect(property.typeAnnotation.type).toBe(
                      'TypeAliasTypeAnnotation',
                    );
                    invariant(
                      property.typeAnnotation.type ===
                        'TypeAliasTypeAnnotation',
                      '',
                    );

                    expect(property.typeAnnotation.name).toBe('Animal');
                    expectAnimalTypeAliasToExist(module);
                  });
                },
              );
            });
          });
        },
      );
    });
  });
});

function parseModule(source: string) {
  const schema = typescriptParser.parseString(source, `${MODULE_NAME}.ts`);
  const module = schema.modules.NativeFoo;
  invariant(
    module.type === 'NativeModule',
    "'nativeModules' in Spec NativeFoo shouldn't be null",
  );
  return module;
}
