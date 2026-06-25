/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

import convertPropToBasicTypes from '../convertPropToBasicTypes';
import {compareTypes} from '../TypeDiffing.js';
import {getTestSchema} from './utilities/getTestSchema.js';

function getModule(...filenameComponents: Array<string>) {
  const schema = getTestSchema(
    __dirname,
    '__fixtures__',
    ...filenameComponents,
  );
  const hasteModule = filenameComponents[1].split('.')[0];
  const module = schema.modules[hasteModule];
  const aliasMap = module.aliasMap;
  const enumMap = module.enumMap;
  const methods = module.spec.methods;
  const emitters = module.spec.eventEmitters;

  function methodLookup(methodName: string) {
    return methods.find(method => method.name === methodName).typeAnnotation;
  }

  function methodParamLookup(methodName: string) {
    return methodLookup(methodName).params[0].typeAnnotation;
  }

  function emitterLookup(emitterName: string) {
    return emitters.find(emitter => emitter.name === emitterName)
      .typeAnnotation;
  }

  return [aliasMap, methodParamLookup, methodLookup, emitterLookup, enumMap];
}

function getComponent(...filenameComponents: Array<string>) {
  const schema = getTestSchema(
    __dirname,
    '__fixtures__',
    ...filenameComponents,
  );
  const hasteModule = filenameComponents[1].split('.')[0];
  const component = schema.modules[hasteModule];
  const firstComponent =
    component.components[Object.keys(component.components)[0]];

  const {commands} = firstComponent;

  function commandLookup(commandName: string) {
    return commands.find(command => command.name === commandName)
      .typeAnnotation;
  }

  function propLookup(propName: string) {
    // This conversion is done in VersionDiffing, so we need to emulate it here.
    return convertPropToBasicTypes(
      firstComponent.props.find(prop => prop.name === propName).typeAnnotation,
    );
  }

  return [propLookup, commandLookup];
}

const [
  nativeModuleBeforeAfterTypesAliases,
  nativeModuleBeforeAfterTypesMethodParamLookup,
  nativeModuleBeforeAfterTypesMethodLookup,
] = getModule(
  'native-module-before-after-types',
  'NativeModuleBeforeAfterTypes.js.flow',
);

const [
  nativeTypeDiffingTypesAliases,
  nativeTypeDiffingTypesMethodParamLookup,
  nativeTypeDiffingTypesMethodLookup,
  ,
  nativeTypeDiffingTypesEnums,
] = getModule(
  'native-module-type-diffing-types',
  'NativeTypeDiffingTypes.js.flow',
);

/* eslint-disable no-unused-vars */
const [
  nativeModuleWithEventEmitterAliases,
  _nativeModuleWithEventEmitterMethodParamLookup,
  _nativeModuleWithEventEmitterMethodLookup,
  nativeModuleWithEventEmitterEmitterLookup,
] = getModule('native-module-with-eventemitter', 'NativeModule.js.flow');

const [
  nativeModuleWithEventEmitterChangesAliases,
  _nativeModuleWithEventEmitterChangesMethodParamLookup,
  _nativeModuleWithEventEmitterChangesMethodLookup,
  nativeModuleWithEventEmitterChangesEmitterLookup,
] = getModule(
  'native-module-with-eventemitter-changes',
  'NativeModule.js.flow',
);
/* eslint-enable no-unused-vars */

const [
  nativeComponentAllTypesPropLookup,
  nativeComponentAllTypesCommandLookup,
] = getComponent('native-component-all-types', 'NativeComponent.js.flow');

expect.extend({
  toBeAnError(received) {
    expect(received.status).toBe('error');
    return {
      pass: true,
    };
  },

  toHaveErrorWithMessage(received, argument) {
    expect(received.hasOwnProperty('errorLog')).toBe(true);
    expect(received.errorLog.message).toContain(argument);
    return {
      message: () => '',
      pass: true,
    };
  },
});

describe('components', () => {
  describe('props', () => {
    it('errors between number types', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('double'),
          nativeComponentAllTypesPropLookup('float'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Type annotations are not the same.');
    });

    it('does not error between same types', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('double'),
          nativeComponentAllTypesPropLookup('double'),
          {},
          {},
        ).status,
      ).toBe('matching');
    });

    it('mixed can not become another type', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('int'),
          nativeComponentAllTypesPropLookup('mixed'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Type annotations are not the same.');
    });

    it('int matches WithDefault int', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('int'),
          nativeComponentAllTypesPropLookup('optionalInt'),
          {},
          {},
        ).status,
      ).toBe('matching');
    });

    it('string matches WithDefault string', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('string'),
          nativeComponentAllTypesPropLookup('optionalString'),
          {},
          {},
        ).status,
      ).toBe('matching');
    });

    it('optional string with different defaults match', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('optionalString'),
          nativeComponentAllTypesPropLookup('optionalStringDiffDefault'),
          {},
          {},
        ).status,
      ).toBe('matching');
    });

    it('string not compatible with string union', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('string'),
          nativeComponentAllTypesPropLookup('stringUnion'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Type annotations are not the same.');
    });

    it('string union not compatible with int union', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('stringUnion'),
          nativeComponentAllTypesPropLookup('intUnion'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Type annotations are not the same.');
    });

    it('nested object with changed value not compatible', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('nestedObjectChanged'),
          nativeComponentAllTypesPropLookup('nestedObject'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage(
        'Object contained a property with a type mismatch',
      );
    });

    it('array with a string union to an extra option not compatible', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('arrayStringUnionExtra'),
          nativeComponentAllTypesPropLookup('arrayStringUnion'),
          {},
          {},
        ),
      ).toEqual(
        expect.objectContaining({
          status: 'members',
          memberLog: {
            memberKind: 'union',
            addedMembers: [
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'baz',
              },
            ],
          },
          errorLog: expect.objectContaining({
            type: 'TypeAnnotationComparisonError',
          }),
        }),
      );
    });

    it('array of an object to an extra key not compatible', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesPropLookup('arrayNestedObjectChange'),
          nativeComponentAllTypesPropLookup('arrayNestedObject'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage(
        'Object contained a property with a type mismatch',
      );
    });
  });
  describe('commands', () => {
    it('errors on type of parameter changing', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodInt'),
          nativeComponentAllTypesCommandLookup('methodString'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Parameter at index 0 did not match');
    });

    it('errors on parameter changing between number types', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodFloat'),
          nativeComponentAllTypesCommandLookup('methodInt'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Parameter at index 0 did not match');
    });

    it('errors on parameter changing from int to RootTag (opaque int)', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodRootTag'),
          nativeComponentAllTypesCommandLookup('methodInt'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Parameter at index 0 did not match');
    });

    it('does not error when unchanged with string', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodString'),
          nativeComponentAllTypesCommandLookup('methodString'),
          {},
          {},
        ).status,
      ).toBe('matching');
    });

    it('does not error when unchanged with RootTag', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodRootTag'),
          nativeComponentAllTypesCommandLookup('methodRootTag'),
          {},
          {},
        ).status,
      ).toBe('matching');
    });

    it('errors on additional argument', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodIntString'),
          nativeComponentAllTypesCommandLookup('methodInt'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage(
        'Function types have differing length of arguments',
      );
    });

    it('errors on argument removed', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodInt'),
          nativeComponentAllTypesCommandLookup('methodIntString'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage(
        'Function types have differing length of arguments',
      );
    });

    it('errors on argument compared to array of argument', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodInt'),
          nativeComponentAllTypesCommandLookup('methodIntArray'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Parameter at index 0 did not match');
    });

    it('errors on arrays of different types', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodIntArray'),
          nativeComponentAllTypesCommandLookup('methodFloatArray'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Parameter at index 0 did not match');
    });

    it('does not error when becoming an alias', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodBool'),
          nativeComponentAllTypesCommandLookup('methodBoolAlias'),
          {},
          {},
        ).status,
      ).toBe('matching');
    });

    it('does not error when becoming inlined', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodString'),
          nativeComponentAllTypesCommandLookup('methodStringAlias'),
          {},
          {},
        ).status,
      ).toBe('matching');
    });

    it('does not error (but it should) on arrays of two different objects', () => {
      // This doesn't fail because we don't store object alias info in the schema
      // These are just arrays of mixed. Someday someone should fix this. NativeModules support this.
      // More info in https://github.com/facebook/react-native/pull/48476
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodCustomObjArray'),
          nativeComponentAllTypesCommandLookup('methodCustomObj2Array'),
          {},
          {},
        ).status,
      ).toBe('matching');
    });

    it('errors on arrays of mixed vs array of standard type', () => {
      expect(
        compareTypes(
          nativeComponentAllTypesCommandLookup('methodIntArray'),
          nativeComponentAllTypesCommandLookup('methodCustomObjArray'),
          {},
          {},
        ),
      ).toHaveErrorWithMessage('Parameter at index 0 did not match');
    });
  });
});

describe('compareTypes', () => {
  it('matches the exact same type', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesAliases.SimpleObject,
        nativeModuleBeforeAfterTypesAliases.SimpleObject,
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('skips null types', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesAliases.SimpleObject,
        null,
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('skipped');
  });

  it('matches on types with the same generic parameters', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesAliases.BeforeMatchingGeneric,
        nativeModuleBeforeAfterTypesAliases.AfterMatchingGeneric,
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('matches the exact same EventEmitter', () => {
    expect(
      compareTypes(
        nativeModuleWithEventEmitterEmitterLookup('onClick'),
        nativeModuleWithEventEmitterEmitterLookup('onClick'),
        nativeModuleWithEventEmitterAliases,
        nativeModuleWithEventEmitterAliases,
      ).status,
    ).toBe('matching');
  });

  it('fails on mismatching EventEmitter parameters', () => {
    expect(
      compareTypes(
        nativeModuleWithEventEmitterEmitterLookup('onClick'),
        nativeModuleWithEventEmitterChangesEmitterLookup('onClick'),
        nativeModuleWithEventEmitterAliases,
        nativeModuleWithEventEmitterChangesAliases,
      ),
    ).toHaveErrorWithMessage('EventEmitter eventTypes are not equivalent');
  });
});

describe('compareTypes objects', () => {
  it('matches objects with same properties', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithProps,
        nativeTypeDiffingTypesAliases.ObjectTypeWithProps,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('matches objects with unsafe objects', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodLookup('genericObjectType'),
        nativeTypeDiffingTypesMethodLookup('unsafeObjectType'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('reports objects with added properties', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithProps,
        nativeTypeDiffingTypesAliases.ObjectTypeLessProps,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'properties',
        propertyLog: expect.objectContaining({
          addedProperties: expect.any(Object),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('reports objects with removed properties', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeLessProps,
        nativeTypeDiffingTypesAliases.ObjectTypeWithProps,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'properties',
        propertyLog: expect.objectContaining({
          missingProperties: expect.any(Object),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('matches objects with nested objects', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithNesting,
        nativeTypeDiffingTypesAliases.ObjectTypeWithNesting,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('reports objects with changed properties', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithNesting,
        nativeTypeDiffingTypesAliases.ObjectTypeWithChanges,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toHaveErrorWithMessage(
      'Object contained properties with type mismatches',
    );
  });

  it('reports objects with changed nested properties', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithNesting,
        nativeTypeDiffingTypesAliases.ObjectTypeWithNestedChanges,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toHaveErrorWithMessage(
      'Object contained a property with a type mismatch',
    );
  });

  it('reports objects with completely different properties', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithProps,
        nativeTypeDiffingTypesAliases.ObjectTypeWithDifferentProps,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toHaveErrorWithMessage('Object types do not match.');
  });

  it('matches objects with optional properties, no changes', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithTwoOptionals,
        nativeTypeDiffingTypesAliases.ObjectTypeWithTwoOptionals,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('reports objects with properties made strict', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithProps,
        nativeTypeDiffingTypesAliases.ObjectTypeWithTwoOptionals,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'properties',
        propertyLog: expect.objectContaining({
          madeStrict: expect.any(Object),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('reports objects with properties made optional', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithTwoOptionals,
        nativeTypeDiffingTypesAliases.ObjectTypeWithProps,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'properties',
        propertyLog: expect.objectContaining({
          madeOptional: expect.any(Object),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('reports objects with properties made strict, and nested changes', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithNesting,
        nativeTypeDiffingTypesAliases.ObjectTypeWithOptionalNestedChange,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'properties',
        propertyLog: expect.objectContaining({
          madeStrict: expect.objectContaining({
            '0': expect.objectContaining({
              furtherChange: expect.objectContaining({
                status: 'properties',
                errorLog: expect.objectContaining({
                  type: 'TypeAnnotationComparisonError',
                }),
              }),
            }),
          }),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('reports objects with properties made optional, and nested changes', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeWithOptionalNestedChange,
        nativeTypeDiffingTypesAliases.ObjectTypeWithNesting,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'properties',
        propertyLog: expect.objectContaining({
          madeOptional: expect.objectContaining({
            '0': expect.objectContaining({
              furtherChange: expect.objectContaining({
                status: 'properties',
                errorLog: expect.objectContaining({
                  type: 'TypeAnnotationComparisonError',
                }),
              }),
            }),
          }),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('matches structurally same objects', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeLiteral1,
        nativeTypeDiffingTypesAliases.ObjectTypeLiteral2,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('matches objects with their type aliases', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeLiteral1,
        nativeTypeDiffingTypesMethodParamLookup('objectTypeLiteral1TypeAlias'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('matches objects with type aliases of structurally same objects', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesAliases.ObjectTypeLiteral1,
        nativeTypeDiffingTypesMethodParamLookup('objectTypeLiteral2TypeAlias'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('objectTypeLiteral1TypeAlias'),
        nativeTypeDiffingTypesAliases.ObjectTypeLiteral2,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('matches two type aliases of structurally same objects', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('objectTypeLiteral1TypeAlias'),
        nativeTypeDiffingTypesMethodParamLookup('objectTypeLiteral2TypeAlias'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });
});

describe('compareTypes primitives', () => {
  it('matches primitive types that are the same', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodParamLookup('booleanType'),
        nativeModuleBeforeAfterTypesMethodParamLookup('booleanType'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('fails on primitive types that are not the same', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodParamLookup('booleanType'),
        nativeModuleBeforeAfterTypesMethodParamLookup('stringType'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ),
    ).toHaveErrorWithMessage('Type annotations are not the same');
  });
});

describe('compareTypes functions', () => {
  it('matches functions on primitive types that are the same', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodLookup('simpleFunction'),
        nativeModuleBeforeAfterTypesMethodLookup('simpleFunction'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('fails on functions with differing return types', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodLookup('simpleFunction'),
        nativeModuleBeforeAfterTypesMethodLookup('simpleFunction2'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ),
    ).toHaveErrorWithMessage('Function return types do not match');
  });

  it('fails on functions with differing parameter types', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodLookup('simpleFunction'),
        nativeModuleBeforeAfterTypesMethodLookup('simpleFunction4'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ),
    ).toHaveErrorWithMessage('Parameter at index 0 did not match');
  });
});

describe('compareTypes unions', () => {
  it('matches unions that are the same', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleUnion'),
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleUnion'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('matching');
  });
  it('matches unions that are the same alias', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnion'),
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnion'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('matching');
  });
  it('fails on differing unions with same length, string -> number', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleUnion'),
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleUnion2'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ),
    ).toEqual({
      status: 'error',
      errorLog: {
        type: 'TypeAnnotationComparisonError',
        message: 'Union types do not match.',
        newerAnnotation: {
          type: 'UnionTypeAnnotation',
          types: [
            {
              type: 'StringLiteralTypeAnnotation',
              value: 'str1',
            },
            {
              type: 'StringLiteralTypeAnnotation',
              value: 'str2',
            },
          ],
        },
        olderAnnotation: {
          type: 'UnionTypeAnnotation',
          types: [
            {
              type: 'NumberLiteralTypeAnnotation',
              value: 4,
            },
            {
              type: 'NumberLiteralTypeAnnotation',
              value: 5,
            },
          ],
        },
        previousError: undefined,
      },
    });
  });
  it('fails on differing unions with same length and same alias name', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnion'),
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnion2'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ),
    ).toEqual({
      status: 'error',
      errorLog: {
        type: 'TypeAnnotationComparisonError',
        message: 'Parameter at index 0 did not match',
        newerAnnotation: {
          type: 'FunctionTypeAnnotation',
          params: [
            {
              name: 'a',
              optional: false,
              typeAnnotation: {
                type: 'UnionTypeAnnotation',
                types: [
                  {
                    type: 'StringLiteralTypeAnnotation',
                    value: 'str1',
                  },
                  {
                    type: 'StringLiteralTypeAnnotation',
                    value: 'str2',
                  },
                ],
              },
            },
          ],
          returnTypeAnnotation: {
            type: 'VoidTypeAnnotation',
          },
        },
        olderAnnotation: {
          type: 'FunctionTypeAnnotation',
          params: [
            {
              name: 'a',
              optional: false,
              typeAnnotation: {
                type: 'UnionTypeAnnotation',
                types: [
                  {
                    type: 'NumberLiteralTypeAnnotation',
                    value: 4,
                  },
                  {
                    type: 'NumberLiteralTypeAnnotation',
                    value: 5,
                  },
                ],
              },
            },
          ],
          returnTypeAnnotation: {
            type: 'VoidTypeAnnotation',
          },
        },
        previousError: {
          type: 'TypeAnnotationComparisonError',
          message: 'Union types do not match.',
          newerAnnotation: {
            type: 'UnionTypeAnnotation',
            types: [
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'str1',
              },
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'str2',
              },
            ],
          },
          olderAnnotation: {
            type: 'UnionTypeAnnotation',
            types: [
              {
                type: 'NumberLiteralTypeAnnotation',
                value: 4,
              },
              {
                type: 'NumberLiteralTypeAnnotation',
                value: 5,
              },
            ],
          },
          previousError: undefined,
        },
      },
    });
  });
  it('reports on unions with differing types: string -> object', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleUnion2'),
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleUnion3'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ),
    ).toEqual({
      status: 'error',
      errorLog: {
        type: 'TypeAnnotationComparisonError',
        message: 'Union types do not match.',
        newerAnnotation: {
          type: 'UnionTypeAnnotation',
          types: [
            {
              type: 'NumberLiteralTypeAnnotation',
              value: 4,
            },
            {
              type: 'NumberLiteralTypeAnnotation',
              value: 5,
            },
          ],
        },
        olderAnnotation: {
          type: 'UnionTypeAnnotation',
          types: [
            {
              properties: [],
              type: 'ObjectTypeAnnotation',
            },
            {
              properties: [
                {
                  name: 'key',
                  optional: false,
                  typeAnnotation: {
                    type: 'StringLiteralTypeAnnotation',
                    value: 'value',
                  },
                },
              ],
              type: 'ObjectTypeAnnotation',
            },
          ],
        },
        previousError: undefined,
      },
    });
  });
  it('reports on unions with differing lengths same alias', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnion'),
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnionLonger'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).functionChangeLog.parameterTypes.nestedChanges[0][2],
    ).toEqual(
      expect.objectContaining({
        status: 'members',
        memberLog: expect.objectContaining({
          memberKind: 'union',
          missingMembers: expect.any(Array),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });
  it('reports on unions with same lengths same alias String order changed', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnion'),
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnionOrderChanged'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('matching');
  });
  it('reports on unions with same lengths same alias Number order changed', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnion2'),
        nativeModuleBeforeAfterTypesMethodLookup('simpleUnion2OrderChanged'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('matching');
  });
});

describe('compareTypes on arrays', () => {
  it('arrays that are the same, with primitive types', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleArray'),
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleArray'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('arrays that have changed, with primitive types', () => {
    expect(
      compareTypes(
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleArray'),
        nativeModuleBeforeAfterTypesMethodParamLookup('simpleArrayChange'),
        nativeModuleBeforeAfterTypesAliases,
        nativeModuleBeforeAfterTypesAliases,
      ),
    ).toHaveErrorWithMessage('Type annotations are not the same');
  });
});

describe('compareTypes on string literals', () => {
  it('matches literals that are the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('stringLiteral0'),
        nativeTypeDiffingTypesMethodParamLookup('stringLiteral0'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('fails on literals that are not the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('stringLiteral0'),
        nativeTypeDiffingTypesMethodParamLookup('stringLiteral1'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toHaveErrorWithMessage('String literals are not equal');
  });
});

describe('compareTypes on boolean literals', () => {
  it('matches literals that are the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('booleanLiteral0'),
        nativeTypeDiffingTypesMethodParamLookup('booleanLiteral0'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('fails on literals that are not the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('booleanLiteral0'),
        nativeTypeDiffingTypesMethodParamLookup('booleanLiteral1'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toHaveErrorWithMessage('Boolean literals are not equal');
  });
});

describe('compareTypes on numeric literals', () => {
  it('matches literals that are the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('numericLiteral0'),
        nativeTypeDiffingTypesMethodParamLookup('numericLiteral0'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('fails on literals that are not the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('numericLiteral0'),
        nativeTypeDiffingTypesMethodParamLookup('numericLiteral1'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toHaveErrorWithMessage('Numeric literals are not equal');
  });
});

describe('compareTypes on generic types', () => {
  it('matches generic types that are the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('referenceType'),
        nativeTypeDiffingTypesMethodParamLookup('referenceType'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('fails when different types are referenced', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('referenceType'),
        nativeTypeDiffingTypesMethodParamLookup('referenceType3'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'properties',
        propertyLog: expect.objectContaining({
          missingProperties: expect.any(Object),
        }),
        errorLog: expect.any(Object),
      }),
    );
  });

  it('matches when structurally same types are referenced', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('referenceType'),
        nativeTypeDiffingTypesMethodParamLookup('referenceType2'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });
});

describe('compareTypes on string literal unions', () => {
  it('matches unions that are the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('stringLiteralUnion0'),
        nativeTypeDiffingTypesMethodParamLookup('stringLiteralUnion0'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('reports on unions with different lengths', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('stringLiteralUnion0'),
        nativeTypeDiffingTypesMethodParamLookup('stringLiteralUnion1'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'members',
        memberLog: {
          memberKind: 'union',
          missingMembers: [
            {
              type: 'StringLiteralTypeAnnotation',
              value: 'd',
            },
          ],
        },
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('fails on unions with differing elements', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('stringLiteralUnion0'),
        nativeTypeDiffingTypesMethodParamLookup('stringLiteralUnion2'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'members',
        memberLog: {
          memberKind: 'union',
          addedMembers: [
            {
              type: 'StringLiteralTypeAnnotation',
              value: 'b',
            },
          ],
          missingMembers: [
            {
              type: 'StringLiteralTypeAnnotation',
              value: 'x',
            },
          ],
        },
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });
});

describe('compareTypes on nullables', () => {
  it('matches nullables that are the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('nullableType'),
        nativeTypeDiffingTypesMethodParamLookup('nullableType'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ).status,
    ).toBe('matching');
  });

  it('reports nullables that have changed to strict', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('nonNullableType'),
        nativeTypeDiffingTypesMethodParamLookup('nullableType'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'nullableChange',
        nullableLog: expect.objectContaining({
          optionsReduced: true,
          interiorLog: expect.objectContaining({status: 'matching'}),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('reports nonnullables that have changed to nullable', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('nullableType'),
        nativeTypeDiffingTypesMethodParamLookup('nonNullableType'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'nullableChange',
        nullableLog: expect.objectContaining({
          optionsReduced: false,
          interiorLog: expect.objectContaining({status: 'matching'}),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('reports nullable change, and interior change', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('objectTypeWithProps'),
        nativeTypeDiffingTypesMethodParamLookup('optionalTypeLessProps'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'nullableChange',
        nullableLog: expect.objectContaining({
          optionsReduced: true,
          interiorLog: expect.objectContaining({
            status: 'properties',
            errorLog: expect.objectContaining({
              type: 'TypeAnnotationComparisonError',
            }),
          }),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });
});

describe('compareTypes on enums', () => {
  it('matches enums that are the same', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('enum'),
        nativeTypeDiffingTypesMethodParamLookup('enum'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesEnums,
        nativeTypeDiffingTypesEnums,
      ).status,
    ).toBe('matching');
  });

  it('reports enums that have changed types', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('enum'),
        nativeTypeDiffingTypesMethodParamLookup('enumWithTypeChange'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesEnums,
        nativeTypeDiffingTypesEnums,
      ),
    ).toHaveErrorWithMessage('EnumDeclaration member types are not the same');
  });

  it('reports enums that have changed values', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('enum'),
        nativeTypeDiffingTypesMethodParamLookup('enumWithValueChange'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesEnums,
        nativeTypeDiffingTypesEnums,
      ),
    ).toEqual(
      expect.objectContaining({
        errorLog: expect.objectContaining({
          message: 'Enum types do not match',
          previousError: expect.objectContaining({
            message: 'Enum contained a member with a type mismatch',
            mismatchedMembers: expect.arrayContaining([
              expect.objectContaining({
                member: 'D',
              }),
            ]),
          }),
        }),
      }),
    );
  });

  it('reports enums that have removed items', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('enumWithRemoval'),
        nativeTypeDiffingTypesMethodParamLookup('enum'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesEnums,
        nativeTypeDiffingTypesEnums,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'members',
        memberLog: expect.objectContaining({
          memberKind: 'enum',
          missingMembers: expect.arrayContaining([
            expect.objectContaining({
              name: 'D',
              value: expect.objectContaining({
                value: 4,
              }),
            }),
          ]),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('reports enums that have added items', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('enum'),
        nativeTypeDiffingTypesMethodParamLookup('enumWithRemoval'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesEnums,
        nativeTypeDiffingTypesEnums,
      ),
    ).toEqual(
      expect.objectContaining({
        status: 'members',
        memberLog: expect.objectContaining({
          memberKind: 'enum',
          addedMembers: expect.arrayContaining([
            expect.objectContaining({
              name: 'D',
              value: expect.objectContaining({
                value: 4,
              }),
            }),
          ]),
        }),
        errorLog: expect.objectContaining({
          type: 'TypeAnnotationComparisonError',
        }),
      }),
    );
  });

  it('matches enums that are the same but sorted differently', () => {
    expect(
      compareTypes(
        nativeTypeDiffingTypesMethodParamLookup('enum'),
        nativeTypeDiffingTypesMethodParamLookup('enumUnsorted'),
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesAliases,
        nativeTypeDiffingTypesEnums,
        nativeTypeDiffingTypesEnums,
      ).status,
    ).toBe('matching');
  });
});
