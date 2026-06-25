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

import type {DoubleTypeAnnotation, NamedShape} from '../../CodegenSchema';

const {extractArrayElementType} = require('../flow/components/events');
const {FlowParser} = require('../flow/parser');
const {MockedParser} = require('../parserMock');
const {emitUnion} = require('../parsers-primitives');
const {
  Visitor,
  emitArrayType,
  emitBoolean,
  emitBoolProp,
  emitCommonTypes,
  emitDouble,
  emitDoubleProp,
  emitFloat,
  emitFloatProp,
  emitGenericObject,
  emitInt32,
  emitInt32Prop,
  emitMixed,
  emitNumber,
  emitObject,
  emitObjectProp,
  emitPartial,
  emitPromise,
  emitRootTag,
  emitString,
  emitStringish,
  emitStringProp,
  emitUnionProp,
  emitVoid,
  typeAliasResolution,
  typeEnumResolution,
} = require('../parsers-primitives.js');
const {TypeScriptParser} = require('../typescript/parser');

const parser = new MockedParser();
const flowParser = new FlowParser();
const typeScriptParser = new TypeScriptParser();

describe('emitBoolean', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitBoolean(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitBoolean(false);
      const expected = {
        type: 'BooleanTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitInt32', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitInt32(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'Int32TypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitInt32(false);
      const expected = {
        type: 'Int32TypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitInt32Prop', () => {
  describe('when optional is true', () => {
    it('returns optional Int32TypeAnnotation', () => {
      const result = emitInt32Prop('myProp', true);
      const expected = {
        name: 'myProp',
        optional: true,
        typeAnnotation: {
          type: 'Int32TypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('when nullable is false', () => {
    it('returns required Int32TypeAnnotation', () => {
      const result = emitInt32Prop('myProp', false);
      const expected = {
        name: 'myProp',
        optional: false,
        typeAnnotation: {
          type: 'Int32TypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitNumber', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitNumber(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'NumberTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitNumber(false);
      const expected = {
        type: 'NumberTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitRootTag', () => {
  const reservedTypeAnnotation = {
    type: 'ReservedTypeAnnotation',
    name: 'RootTag',
  };

  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitRootTag(true);

      expect(result).toEqual({
        type: 'NullableTypeAnnotation',
        typeAnnotation: reservedTypeAnnotation,
      });
    });
  });

  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitRootTag(false);

      expect(result).toEqual(reservedTypeAnnotation);
    });
  });
});

describe('emitStringProp', () => {
  describe('when optional is true', () => {
    it('returns optional StringTypeAnnotation', () => {
      const result = emitStringProp('myProp', true);
      const expected = {
        name: 'myProp',
        optional: true,
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('when nullable is false', () => {
    it('returns required StringTypeAnnotatio', () => {
      const result = emitStringProp('myProp', false);
      const expected = {
        name: 'myProp',
        optional: false,
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitStringish', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitStringish(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitStringish(false);
      const expected = {
        type: 'StringTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitString', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitString(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitString(false);
      const expected = {
        type: 'StringTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitDouble', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitDouble(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'DoubleTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitDouble(false);
      const expected = {
        type: 'DoubleTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitDoubleProp', () => {
  describe('when optional is true', () => {
    it('returns optional type annotation', () => {
      const result = emitDoubleProp('Foo', true);
      const expected: NamedShape<DoubleTypeAnnotation> = {
        name: 'Foo',
        optional: true,
        typeAnnotation: {
          type: 'DoubleTypeAnnotation',
        },
      };
      expect(result).toEqual(expected);
    });
  });
  describe('when optional is false', () => {
    it('returns required type annotation', () => {
      const result = emitDoubleProp('Foo', false);
      const expected: NamedShape<DoubleTypeAnnotation> = {
        name: 'Foo',
        optional: false,
        typeAnnotation: {
          type: 'DoubleTypeAnnotation',
        },
      };
      expect(result).toEqual(expected);
    });
  });
});

describe('emitVoid', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitVoid(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'VoidTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitVoid(false);
      const expected = {
        type: 'VoidTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('typeAliasResolution', () => {
  const objectTypeAnnotation = {
    type: 'ObjectTypeAnnotation',
    properties: [
      {
        name: 'Foo',
        optional: false,
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      },
    ],
  };

  describe('when typeResolution is successful', () => {
    const typeResolution = {successful: true, type: 'alias', name: 'Foo'};

    describe('when nullable is true', () => {
      it('returns nullable TypeAliasTypeAnnotation and map it in aliasMap', () => {
        const aliasMap = {};
        const result = typeAliasResolution(
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          typeResolution,
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          objectTypeAnnotation,
          aliasMap,
          true,
        );

        expect(aliasMap).toEqual({Foo: objectTypeAnnotation});
        expect(result).toEqual({
          type: 'NullableTypeAnnotation',
          typeAnnotation: {
            type: 'TypeAliasTypeAnnotation',
            name: 'Foo',
          },
        });
      });
    });

    describe('when nullable is false', () => {
      it('returns non nullable TypeAliasTypeAnnotation and map it in aliasMap', () => {
        const aliasMap = {};
        const result = typeAliasResolution(
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          typeResolution,
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          objectTypeAnnotation,
          aliasMap,
          false,
        );

        expect(aliasMap).toEqual({Foo: objectTypeAnnotation});
        expect(result).toEqual({
          type: 'TypeAliasTypeAnnotation',
          name: 'Foo',
        });
      });
    });
  });

  describe('when typeResolution is not successful', () => {
    const typeResolution = {successful: false};

    describe('when nullable is true', () => {
      it('returns nullable ObjectTypeAnnotation', () => {
        const aliasMap = {};
        const result = typeAliasResolution(
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          typeResolution,
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          objectTypeAnnotation,
          aliasMap,
          true,
        );

        expect(aliasMap).toEqual({});
        expect(result).toEqual({
          type: 'NullableTypeAnnotation',
          typeAnnotation: objectTypeAnnotation,
        });
      });
    });

    describe('when nullable is false', () => {
      it('returns non nullable ObjectTypeAnnotation', () => {
        const aliasMap = {};
        const result = typeAliasResolution(
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          typeResolution,
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          objectTypeAnnotation,
          aliasMap,
          false,
        );

        expect(aliasMap).toEqual({});
        expect(result).toEqual(objectTypeAnnotation);
      });
    });
  });
});

describe('typeEnumResolution', () => {
  describe('when typeResolution is successful', () => {
    describe('when nullable is true', () => {
      it('returns nullable EnumDeclaration and map it in enumMap', () => {
        const enumMap = {};
        const mockTypeAnnotation = {type: 'StringTypeAnnotation'};

        const result = typeEnumResolution(
          mockTypeAnnotation,
          {successful: true, type: 'enum', name: 'Foo'},
          true /* nullable */,
          'SomeModule' /* name */,
          enumMap,
          parser,
        );

        expect(enumMap).toEqual({
          Foo: {
            type: 'EnumDeclarationWithMembers',
            name: 'Foo',
            memberType: 'StringTypeAnnotation',
            members: [
              {
                name: 'Hello',
                value: {
                  type: 'StringLiteralTypeAnnotation',
                  value: 'hello',
                },
              },
              {
                name: 'Goodbye',
                value: {
                  type: 'StringLiteralTypeAnnotation',
                  value: 'goodbye',
                },
              },
            ],
          },
        });

        expect(result).toEqual({
          type: 'NullableTypeAnnotation',
          typeAnnotation: {
            name: 'Foo',
            type: 'EnumDeclaration',
            memberType: 'StringTypeAnnotation',
          },
        });
      });
    });

    describe('when nullable is false', () => {
      it('returns non nullable TypeAliasTypeAnnotation and map it in aliasMap', () => {
        const enumMap = {};
        const mockTypeAnnotation = {type: 'NumberTypeAnnotation'};

        const result = typeEnumResolution(
          mockTypeAnnotation,
          {successful: true, type: 'enum', name: 'Foo'},
          true /* nullable */,
          'SomeModule' /* name */,
          enumMap,
          parser,
        );

        expect(enumMap).toEqual({
          Foo: {
            type: 'EnumDeclarationWithMembers',
            name: 'Foo',
            memberType: 'NumberTypeAnnotation',
            members: [
              {
                name: 'On',
                value: {
                  type: 'NumberLiteralTypeAnnotation',
                  value: 1,
                },
              },
              {
                name: 'Off',
                value: {
                  type: 'NumberLiteralTypeAnnotation',
                  value: 0,
                },
              },
            ],
          },
        });

        expect(result).toEqual({
          type: 'NullableTypeAnnotation',
          typeAnnotation: {
            name: 'Foo',
            type: 'EnumDeclaration',
            memberType: 'NumberTypeAnnotation',
          },
        });
      });
    });
  });
});

describe('emitPromise', () => {
  const moduleName = 'testModuleName';

  function emitPromiseForUnitTest(
    typeAnnotation: $FlowFixMe,
    nullable: boolean,
  ): $FlowFixMe {
    return emitPromise(
      moduleName,
      typeAnnotation,
      parser,
      nullable,
      // mock translateTypeAnnotation function
      /* types: TypeDeclarationMap */
      {},
      /* aliasMap: {...NativeModuleAliasMap} */
      {},
      /* enumMap: {...NativeModuleEnumMap} */
      {},
      /* tryParse: ParserErrorCapturer */
      // $FlowFixMe[missing-local-annot]
      function <T>(_: () => T) {
        return null;
      },
      /* cxxOnly: boolean */
      false,
      /* the translateTypeAnnotation function */
      (_, elementType) => elementType,
    );
  }

  describe("when typeAnnotation doesn't have exactly one typeParameter", () => {
    const typeAnnotation = {
      typeParameters: {
        params: [1, 2],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    it('throws an IncorrectlyParameterizedGenericParserError error', () => {
      const nullable = false;
      expect(() => emitPromiseForUnitTest(typeAnnotation, nullable)).toThrow();
    });
  });

  describe("when typeAnnotation doesn't has exactly one typeParameter", () => {
    const typeAnnotation = {
      typeParameters: {
        params: [1],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };

    describe('when nullable is true', () => {
      const nullable = true;
      it('returns nullable type annotation', () => {
        const result = emitPromiseForUnitTest(typeAnnotation, nullable);
        const expected = {
          type: 'NullableTypeAnnotation',
          typeAnnotation: {
            type: 'PromiseTypeAnnotation',
            elementType: 1,
          },
        };

        expect(result).toEqual(expected);
      });
    });
    describe('when nullable is false', () => {
      const nullable = false;
      it('returns non nullable type annotation', () => {
        const result = emitPromiseForUnitTest(typeAnnotation, nullable);
        const expected = {
          type: 'PromiseTypeAnnotation',
          elementType: 1,
        };

        expect(result).toEqual(expected);
      });
    });
  });

  describe('when Promise element type resolves to ArrayBufferTypeAnnotation', () => {
    it('returns PromiseTypeAnnotation with ArrayBuffer element type', () => {
      const result = emitPromise(
        moduleName,
        {
          typeParameters: {
            params: [{}],
            type: 'TypeParameterInstantiation',
          },
          id: {
            name: 'Promise',
          },
        },
        parser,
        false,
        {},
        {},
        {},
        function <T>(f: () => T): $FlowFixMe {
          return f();
        },
        false,
        () => ({
          type: 'ArrayBufferTypeAnnotation',
        }),
      );
      expect(result).toEqual({
        type: 'PromiseTypeAnnotation',
        elementType: {type: 'ArrayBufferTypeAnnotation'},
      });
    });
  });
});

describe('emitGenericObject', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitGenericObject(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'GenericObjectTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitGenericObject(false);
      const expected = {
        type: 'GenericObjectTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitObject', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const props = [
        {
          name: 'a',
          optional: true,
          typeAnnotation: {
            type: 'StringTypeAnnotation',
          },
        },
        {
          name: 'b',
          optional: true,
          typeAnnotation: {
            type: 'BooleanTypeAnnotation',
          },
        },
      ];

      const result = emitObject(true, props);

      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'ObjectTypeAnnotation',
          properties: props,
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const props = [
        {
          name: 'a',
          optional: true,
          typeAnnotation: {
            type: 'StringTypeAnnotation',
          },
        },
        {
          name: 'b',
          optional: true,
          typeAnnotation: {
            type: 'BooleanTypeAnnotation',
          },
        },
      ];

      const result = emitObject(false, props);

      const expected = {
        type: 'ObjectTypeAnnotation',
        properties: props,
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitFloat', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitFloat(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'FloatTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitFloat(false);
      const expected = {
        type: 'FloatTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitFloatProp', () => {
  describe('when optional is true', () => {
    it('returns optional FloatTypeAnnotation', () => {
      const result = emitFloatProp('myProp', true);
      const expected = {
        name: 'myProp',
        optional: true,
        typeAnnotation: {
          type: 'FloatTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('when optional is false', () => {
    it('returns required FloatTypeAnnotation', () => {
      const result = emitFloatProp('myProp', false);
      const expected = {
        name: 'myProp',
        optional: false,
        typeAnnotation: {
          type: 'FloatTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitMixed', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitMixed(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'MixedTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitMixed(false);
      const expected = {
        type: 'MixedTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitUnion', () => {
  const hasteModuleName = 'SampleTurboModule';

  describe('when language is flow', () => {
    describe('when members type is numeric', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [
          {type: 'NumberLiteralTypeAnnotation', value: 1},
          {type: 'NumberLiteralTypeAnnotation', value: 2},
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnion(
            true,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            (_, elementType) => elementType,
            flowParser,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              types: [
                {
                  type: 'NumberLiteralTypeAnnotation',
                  value: 1,
                },
                {
                  type: 'NumberLiteralTypeAnnotation',
                  value: 2,
                },
              ],
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnion(
            false,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            (_, elementType) => elementType,
            flowParser,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            types: [
              {
                type: 'NumberLiteralTypeAnnotation',
                value: 1,
              },
              {
                type: 'NumberLiteralTypeAnnotation',
                value: 2,
              },
            ],
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is string', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [
          {type: 'StringLiteralTypeAnnotation', value: 'foo'},
          {type: 'StringLiteralTypeAnnotation', value: 'bar'},
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnion(
            true,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            (_, elementType) => elementType,
            flowParser,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              types: [
                {
                  type: 'StringLiteralTypeAnnotation',
                  value: 'foo',
                },
                {
                  type: 'StringLiteralTypeAnnotation',
                  value: 'bar',
                },
              ],
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnion(
            false,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            (_, elementType) => elementType,
            flowParser,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            types: [
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'foo',
              },
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'bar',
              },
            ],
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is object', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [{type: 'ObjectTypeAnnotation'}, {type: 'ObjectTypeAnnotation'}],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnion(
            true,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            (_, elementType) => elementType,
            flowParser,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              types: [
                {
                  type: 'ObjectTypeAnnotation',
                },
                {
                  type: 'ObjectTypeAnnotation',
                },
              ],
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnion(
            false,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            (_, elementType) => elementType,
            flowParser,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            types: [
              {
                type: 'ObjectTypeAnnotation',
              },
              {
                type: 'ObjectTypeAnnotation',
              },
            ],
          };

          expect(result).toEqual(expected);
        });
      });
    });
  });

  describe('when language is typescript', () => {
    describe('when members type is numeric', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
            literal: {type: 'NumericLiteral', value: 4},
          },
          {
            type: 'TSLiteralType',
            literal: {type: 'NumericLiteral', value: 5},
          },
        ],
      };

      function translateTypeAnnotation(_: $FlowFixMe, memberType: $FlowFixMe) {
        if (memberType === typeAnnotation.types[0]) {
          return {
            type: 'NumberLiteralTypeAnnotation',
            value: 4,
          };
        }
        if (memberType === typeAnnotation.types[1]) {
          return {
            type: 'NumberLiteralTypeAnnotation',
            value: 5,
          };
        }
        throw new Error('Unexpected member type');
      }

      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnion(
            true,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            translateTypeAnnotation,
            typeScriptParser,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
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
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnion(
            false,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            translateTypeAnnotation,
            typeScriptParser,
          );

          const expected = {
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
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is string', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
            literal: {type: 'StringLiteral', value: 'foo'},
          },
          {
            type: 'TSLiteralType',
            literal: {type: 'StringLiteral', value: 'bar'},
          },
        ],
      };

      function translateTypeAnnotation(_: $FlowFixMe, memberType: $FlowFixMe) {
        if (memberType === typeAnnotation.types[0]) {
          return {
            type: 'StringLiteralTypeAnnotation',
            value: 'foo',
          };
        }
        if (memberType === typeAnnotation.types[1]) {
          return {
            type: 'StringLiteralTypeAnnotation',
            value: 'bar',
          };
        }
        throw new Error('Unexpected member type');
      }

      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnion(
            true,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            translateTypeAnnotation,
            typeScriptParser,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              types: [
                {
                  type: 'StringLiteralTypeAnnotation',
                  value: 'foo',
                },
                {
                  type: 'StringLiteralTypeAnnotation',
                  value: 'bar',
                },
              ],
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnion(
            false,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            translateTypeAnnotation,
            typeScriptParser,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            types: [
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'foo',
              },
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'bar',
              },
            ],
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is object', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
          },
          {
            type: 'TSLiteralType',
          },
        ],
      };

      function translateTypeAnnotation(_: $FlowFixMe, memberType: $FlowFixMe) {
        if (memberType === typeAnnotation.types[0]) {
          return {
            type: 'ObjectTypeAnnotation',
            properties: [],
          };
        }
        if (memberType === typeAnnotation.types[1]) {
          return {
            type: 'ObjectTypeAnnotation',
            properties: [],
          };
        }
        throw new Error('Unexpected member type');
      }

      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnion(
            true,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            translateTypeAnnotation,
            typeScriptParser,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              types: [
                {
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
                {
                  type: 'ObjectTypeAnnotation',
                  properties: [],
                },
              ],
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnion(
            false,
            hasteModuleName,
            typeAnnotation,
            /* types: TypeDeclarationMap */
            {},
            /* aliasMap: {...NativeModuleAliasMap} */
            {},
            /* enumMap: {...NativeModuleEnumMap} */
            {},
            /* tryParse: ParserErrorCapturer */
            // $FlowFixMe[missing-local-annot]
            function <T>(_: () => T) {
              return null;
            },
            /* cxxOnly: boolean */
            false,
            /* the translateTypeAnnotation function */
            translateTypeAnnotation,
            typeScriptParser,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            types: [
              {
                type: 'ObjectTypeAnnotation',
                properties: [],
              },
              {
                type: 'ObjectTypeAnnotation',
                properties: [],
              },
            ],
          };

          expect(result).toEqual(expected);
        });
      });
    });
  });

  describe('emitArrayType', () => {
    function emitArrayTypeForUnitTest(
      typeAnnotation: $FlowFixMe,
      nullable: boolean,
    ): $FlowFixMe {
      return emitArrayType(
        hasteModuleName,
        typeAnnotation,
        parser,
        /* types: TypeDeclarationMap */
        {},
        /* aliasMap: {...NativeModuleAliasMap} */
        {},
        /* enumMap: {...NativeModuleEnumMap} */
        {},
        /* cxxOnly: boolean */
        false,
        nullable,
        /* the translateTypeAnnotation function */
        (_, elementType) => elementType,
      );
    }

    describe("when typeAnnotation doesn't have exactly one typeParameter", () => {
      const nullable = false;
      const typeAnnotation = {
        typeParameters: {
          params: [1, 2],
          type: 'TypeParameterInstantiation',
        },
        id: {
          name: 'typeAnnotationName',
        },
      };

      it('throws an IncorrectlyParameterizedGenericParserError error', () => {
        expect(() =>
          emitArrayTypeForUnitTest(typeAnnotation, nullable),
        ).toThrow();
      });
    });

    describe('when typeAnnotation has exactly one typeParameter', () => {
      const typeAnnotation = {
        typeParameters: {
          params: [1],
          type: 'TypeParameterInstantiation',
        },
        id: {
          name: 'typeAnnotationName',
        },
      };

      describe('when nullable is true', () => {
        const nullable = true;
        it('returns nullable type annotation', () => {
          const result = emitArrayTypeForUnitTest(typeAnnotation, nullable);
          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'ArrayTypeAnnotation',
              elementType: 1,
            },
          };

          expect(result).toEqual(expected);
        });
      });
      describe('when nullable is false', () => {
        const nullable = false;
        it('returns non nullable type annotation', () => {
          const result = emitArrayTypeForUnitTest(typeAnnotation, nullable);
          const expected = {
            type: 'ArrayTypeAnnotation',
            elementType: 1,
          };

          expect(result).toEqual(expected);
        });
      });
    });
  });

  describe('Visitor', () => {
    describe('CallExpression', () => {
      it('sets isComponent to true if callee type is Identifier and callee name is codegenNativeComponent', () => {
        const infoMap = {isComponent: false, isModule: false};
        const node = {
          callee: {type: 'Identifier', name: 'codegenNativeComponent'},
        };
        const visitor = Visitor(infoMap);
        visitor.CallExpression(node);

        expect(infoMap.isComponent).toBe(true);
      });

      it('should not set isComponent to true if callee type is not Identifier or callee name is not codegenNativeComponent', () => {
        const infoMap = {isComponent: false, isModule: false};
        const node = {
          callee: {type: '', name: ''},
        };
        const visitor = Visitor(infoMap);
        visitor.CallExpression(node);

        expect(infoMap.isComponent).toBe(false);
      });

      it('sets isModule to true if isModuleRegistryCall', () => {
        const infoMap = {isComponent: false, isModule: false};
        const node = {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: {type: 'Identifier', name: 'TurboModuleRegistry'},
            property: {type: 'Identifier', name: 'getEnforcing'},
          },
        };
        const visitor = Visitor(infoMap);
        visitor.CallExpression(node);

        expect(infoMap.isModule).toBe(true);
      });

      it('should not set isModule to true if not isModuleRegistryCall', () => {
        const infoMap = {isComponent: false, isModule: false};
        const node = {
          callee: {
            type: 'Expression',
          },
        };
        const visitor = Visitor(infoMap);
        visitor.CallExpression(node);

        expect(infoMap.isModule).toBe(false);
      });
    });

    describe('InterfaceExtends', () => {
      it('sets isModule to true if module interface extends TurboModule', () => {
        const infoMap = {isComponent: false, isModule: false};
        const node = {id: {name: 'TurboModule'}};

        const visitor = Visitor(infoMap);
        visitor.InterfaceExtends(node);

        expect(infoMap.isModule).toBe(true);
      });

      it('should not set isModule to true if module interface does not extends TurboModule', () => {
        const infoMap = {isComponent: false, isModule: false};
        const node = {id: {name: ''}};

        const visitor = Visitor(infoMap);
        visitor.InterfaceExtends(node);

        expect(infoMap.isModule).toBe(false);
      });
    });

    describe('TSInterfaceDeclaration', () => {
      it('sets isModule to true if TypeScript Interface Declaration extends TurboModule', () => {
        const infoMap = {isComponent: false, isModule: false};
        const node = {extends: [{expression: {name: 'TurboModule'}}]};

        const visitor = Visitor(infoMap);
        visitor.TSInterfaceDeclaration(node);

        expect(infoMap.isModule).toBe(true);
      });

      it('should not set isModule to true if TypeScript Interface Declaration does not extends TurboModule', () => {
        const infoMap = {isComponent: false, isModule: false};
        const node = {extends: [{expression: {name: ''}}]};

        const visitor = Visitor(infoMap);
        visitor.TSInterfaceDeclaration(node);

        expect(infoMap.isModule).toBe(false);
      });
    });
  });

  describe('emitPartial', () => {
    function emitPartialForUnitTest(
      typeAnnotation: $FlowFixMe,
      nullable: boolean,
    ): $FlowFixMe {
      return emitPartial(
        nullable,
        hasteModuleName,
        typeAnnotation,
        /* types: TypeDeclarationMap */
        {},
        /* aliasMap: {...NativeModuleAliasMap} */
        {},
        /* enumMap: {...NativeModuleEnumMap} */
        {},
        /* tryParse: ParserErrorCapturer */
        // $FlowFixMe[missing-local-annot]
        function <T>(_: () => T) {
          return null;
        },
        /* cxxOnly: boolean */
        false,
        parser,
      );
    }

    describe("when 'typeAnnotation' doesn't have exactly 'one' typeParameter", () => {
      const nullable = false;
      const typeAnnotation = {
        typeParameters: {
          params: [1, 2],
          type: 'TypeParameterInstantiation',
        },
        id: {
          name: 'typeAnnotationName',
        },
      };

      it('throws an error', () => {
        expect(() => emitPartialForUnitTest(typeAnnotation, nullable)).toThrow(
          'Partials only support annotating exactly one parameter.',
        );
      });
    });

    describe('when Partial Not annotating type parameter', () => {
      const nullable = false;
      const typeAnnotation = {
        typeParameters: {
          params: [
            {
              id: {
                name: 'TypeDeclaration',
              },
            },
          ],
        },
        id: {
          name: 'typeAnnotationName',
        },
      };

      it('throws an error', () => {
        expect(() => emitPartialForUnitTest(typeAnnotation, nullable)).toThrow(
          'Partials only support annotating a type parameter.',
        );
      });
    });
  });

  describe('emitCommonTypes', () => {
    function emitCommonTypesForUnitTest(
      typeAnnotation: $FlowFixMe,
      nullable: boolean,
    ): $FlowFixMe {
      return emitCommonTypes(
        hasteModuleName,
        /* types: TypeDeclarationMap */
        {},
        typeAnnotation,
        /* aliasMap: {...NativeModuleAliasMap} */
        {},
        /* enumMap: {...NativeModuleEnumMap} */
        {},
        /* tryParse: ParserErrorCapturer */
        // $FlowFixMe[missing-local-annot]
        function <T>(_: () => T) {
          return null;
        },
        /* cxxOnly: boolean */
        false,
        nullable,
        parser,
      );
    }

    describe("when 'typeAnnotation.id.name' is 'Stringish'", () => {
      const typeAnnotation = {
        typeParameters: {
          params: [1, 2],
          type: 'StringTypeAnnotation',
        },
        id: {
          name: 'Stringish',
        },
      };
      const expected = {
        type: 'StringTypeAnnotation',
      };
      const result = emitCommonTypesForUnitTest(typeAnnotation, false);

      it("returns 'StringTypeAnnotation'", () => {
        expect(result).toEqual(expected);
      });
    });

    describe("when 'typeAnnotation.id.name' is 'Int32'", () => {
      const typeAnnotation = {
        typeParameters: {
          params: [1, 2],
          type: 'Int32TypeAnnotation',
        },
        id: {
          name: 'Int32',
        },
      };
      const expected = {
        type: 'Int32TypeAnnotation',
      };
      const result = emitCommonTypesForUnitTest(typeAnnotation, false);

      it("returns 'Int32TypeAnnotation'", () => {
        expect(result).toEqual(expected);
      });
    });

    describe("when 'typeAnnotation.id.name' is 'Double'", () => {
      const typeAnnotation = {
        typeParameters: {
          params: [1, 2],
          type: 'DoubleTypeAnnotation',
        },
        id: {
          name: 'Double',
        },
      };
      const expected = {
        type: 'DoubleTypeAnnotation',
      };
      const result = emitCommonTypesForUnitTest(typeAnnotation, false);

      it("returns 'DoubleTypeAnnotation'", () => {
        expect(result).toEqual(expected);
      });
    });

    describe("when 'typeAnnotation.id.name' is 'Float'", () => {
      const typeAnnotation = {
        typeParameters: {
          params: [1, 2],
          type: 'FloatTypeAnnotation',
        },
        id: {
          name: 'Float',
        },
      };
      const expected = {
        type: 'FloatTypeAnnotation',
      };
      const result = emitCommonTypesForUnitTest(typeAnnotation, false);

      it("returns 'FloatTypeAnnotation'", () => {
        expect(result).toEqual(expected);
      });
    });

    describe("when 'typeAnnotation.id.name' is 'ArrayBuffer'", () => {
      const typeAnnotation = {
        typeParameters: {
          params: [1, 2],
          type: 'GenericTypeAnnotation',
        },
        id: {
          name: 'ArrayBuffer',
        },
      };
      const expected = {
        type: 'ArrayBufferTypeAnnotation',
      };
      const result = emitCommonTypesForUnitTest(typeAnnotation, false);

      it("returns 'ArrayBufferTypeAnnotation'", () => {
        expect(result).toEqual(expected);
      });
    });

    describe("when 'typeAnnotation.id.name' is 'UnsafeObject'", () => {
      const typeAnnotation = {
        typeParameters: {
          params: [1, 2],
          type: 'GenericObjectTypeAnnotation',
        },
        id: {
          name: 'UnsafeObject',
        },
      };
      const expected = {
        type: 'GenericObjectTypeAnnotation',
      };
      const result = emitCommonTypesForUnitTest(typeAnnotation, false);

      it("returns 'GenericObjectTypeAnnotation'", () => {
        expect(result).toEqual(expected);
      });
    });

    describe("when 'typeAnnotation.id.name' is 'Object'", () => {
      const typeAnnotation = {
        typeParameters: {
          params: [1, 2],
          type: 'GenericObjectTypeAnnotation',
        },
        id: {
          name: 'Object',
        },
      };
      const expected = {
        type: 'GenericObjectTypeAnnotation',
      };
      const result = emitCommonTypesForUnitTest(typeAnnotation, false);

      it("returns 'GenericObjectTypeAnnotation'", () => {
        expect(result).toEqual(expected);
      });
    });

    describe("when 'typeAnnotation.id.name' is '$Partial' i.e. Object", () => {
      const typeAnnotation = {
        typeParameters: {
          params: [1],
          type: 'GenericObjectTypeAnnotation',
        },
        id: {
          name: 'Object',
        },
      };
      const expected = {
        type: 'GenericObjectTypeAnnotation',
      };
      const result = emitCommonTypesForUnitTest(typeAnnotation, false);

      it("returns 'GenericObjectTypeAnnotation'", () => {
        expect(result).toEqual(expected);
      });
    });

    describe('when typeAnnotation is invalid', () => {
      const typeAnnotation = {
        id: {
          name: 'InvalidName',
        },
      };
      it('returns null', () => {
        expect(emitCommonTypesForUnitTest(typeAnnotation, false)).toBeNull();
      });
    });
  });

  describe('emitBoolProp', () => {
    describe('when optional is true', () => {
      it('returns optional type annotation', () => {
        const result = emitBoolProp('someProp', true);
        const expected = {
          name: 'someProp',
          optional: true,
          typeAnnotation: {
            type: 'BooleanTypeAnnotation',
          },
        };

        expect(result).toEqual(expected);
      });
    });
    describe('when optional is false', () => {
      it('returns required type annotation', () => {
        const result = emitBoolProp('someProp', false);
        const expected = {
          name: 'someProp',
          optional: false,
          typeAnnotation: {
            type: 'BooleanTypeAnnotation',
          },
        };

        expect(result).toEqual(expected);
      });
    });
  });

  describe('emitObjectProp', () => {
    const name = 'someProp';
    describe('when property is optional', () => {
      it('returns optional Object Prop', () => {
        const typeAnnotation = {
          type: 'GenericTypeAnnotation',
          id: {
            name: 'ObjectTypeAnnotation',
          },
          properties: [
            {
              key: {
                name: 'someKey',
              },
              optional: true,
              value: {
                type: 'StringTypeAnnotation',
                typeAnnotation: {
                  type: 'StringTypeAnnotation',
                },
              },
            },
          ],
        };
        const result = emitObjectProp(
          name,
          true,
          flowParser,
          typeAnnotation,
          extractArrayElementType,
        );
        const expected = {
          name: 'someProp',
          optional: true,
          typeAnnotation: {
            properties: [
              {
                name: 'someKey',
                optional: true,
                typeAnnotation: {
                  type: 'StringTypeAnnotation',
                },
              },
            ],
            type: 'ObjectTypeAnnotation',
          },
        };

        expect(result).toEqual(expected);
      });
    });

    describe('when property is required', () => {
      it('returns required Object Prop', () => {
        const typeAnnotation = {
          type: 'GenericTypeAnnotation',
          id: {
            name: 'ObjectTypeAnnotation',
          },
          properties: [
            {
              key: {
                name: 'someKey',
              },
              optional: false,
              value: {
                type: 'StringTypeAnnotation',
                typeAnnotation: {
                  type: 'StringTypeAnnotation',
                },
              },
            },
          ],
        };
        const result = emitObjectProp(
          name,
          false,
          flowParser,
          typeAnnotation,
          extractArrayElementType,
        );
        const expected = {
          name: 'someProp',
          optional: false,
          typeAnnotation: {
            properties: [
              {
                name: 'someKey',
                optional: false,
                typeAnnotation: {
                  type: 'StringTypeAnnotation',
                },
              },
            ],
            type: 'ObjectTypeAnnotation',
          },
        };

        expect(result).toEqual(expected);
      });
    });
  });

  describe('emitUnionProp', () => {
    describe('when property is optional', () => {
      it('returns optional type annotation with Flow parser', () => {
        const typeAnnotation = {
          types: [
            {
              value: 'someValue1',
            },
            {
              value: 'someValue2',
            },
          ],
        };
        const result = emitUnionProp(
          'someProp',
          true,
          flowParser,
          typeAnnotation,
        );
        const expected = {
          name: 'someProp',
          optional: true,
          typeAnnotation: {
            type: 'UnionTypeAnnotation',
            types: [
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'someValue1',
              },
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'someValue2',
              },
            ],
          },
        };

        expect(result).toEqual(expected);
      });
    });
    describe('when property is required', () => {
      it('returns required type annotation with TypeScript parser', () => {
        const typeAnnotation = {
          types: [
            {
              literal: {
                value: 'someValue1',
              },
            },
            {
              literal: {
                value: 'someValue2',
              },
            },
          ],
        };
        const result = emitUnionProp(
          'someProp',
          false,
          typeScriptParser,
          typeAnnotation,
        );

        const expected = {
          name: 'someProp',
          optional: false,
          typeAnnotation: {
            type: 'UnionTypeAnnotation',
            types: [
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'someValue1',
              },
              {
                type: 'StringLiteralTypeAnnotation',
                value: 'someValue2',
              },
            ],
          },
        };

        expect(result).toEqual(expected);
      });
    });
  });
});
