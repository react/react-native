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

import type {ParserType} from '../errors';

import {FlowParser} from '../flow/parser';
import {MockedParser} from '../parserMock';
import {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  buildSchema,
  buildSchemaFromConfigType,
  createComponentConfig,
  getCommandOptions,
  getCommandTypeNameAndOptionsExpression,
  getOptions,
  getTypeResolutionStatus,
  handleGenericTypeAnnotation,
  isObjectProperty,
  parseModuleName,
  parseObjectProperty,
  propertyNames,
  unwrapNullable,
  wrapNullable,
} from '../parsers-commons';

const {
  IncorrectModuleRegistryCallArgumentTypeParserError,
  IncorrectModuleRegistryCallArityParserError,
  MisnamedModuleInterfaceParserError,
  ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleInterfaceParserError,
  MoreThanOneModuleRegistryCallsParserError,
  ParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UntypedModuleRegistryCallParserError,
  UnusedModuleInterfaceParserError,
} = require('../errors');
const {buildComponentSchema} = require('../flow/components');
const {flowTranslateTypeAnnotation} = require('../flow/modules/index');
const {buildModuleSchema} = require('../parsers-commons.js');
const {Visitor} = require('../parsers-primitives');
const {wrapComponentSchema} = require('../schema.js');
const typeScriptTranslateTypeAnnotation = require('../typescript/modules/index');
const {
  createParserErrorCapturer,
  isModuleRegistryCall,
} = require('../utils.js');

const parser = new MockedParser();
const flowParser = new FlowParser();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('wrapNullable', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = wrapNullable(true, {
        type: 'BooleanTypeAnnotation',
      });
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
      const result = wrapNullable(false, {
        type: 'BooleanTypeAnnotation',
      });
      const expected = {
        type: 'BooleanTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('unwrapNullable', () => {
  describe('when type annotation is nullable', () => {
    it('returns original type annotation', () => {
      // $FlowFixMe[incompatible-type]
      const result = unwrapNullable<{
        type: 'NullableTypeAnnotation',
        typeAnnotation: {type: 'BooleanTypeAnnotation'},
      }>({
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        true,
      ];

      expect(result).toEqual(expected);
    });
  });
  describe('when type annotation is not nullable', () => {
    it('returns original type annotation', () => {
      const result = unwrapNullable<{type: 'BooleanTypeAnnotation'}>({
        type: 'BooleanTypeAnnotation',
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        false,
      ];

      expect(result).toEqual(expected);
    });
  });
});

describe('assertGenericTypeAnnotationHasExactlyOneTypeParameter', () => {
  const moduleName = 'testModuleName';

  it("doesn't throw any Error when typeAnnotation has exactly one typeParameter", () => {
    const typeAnnotation = {
      typeParameters: {
        type: 'TypeParameterInstantiation',
        params: [1],
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotation,
        parser,
      ),
    ).not.toThrow();
  });

  it('throws a MissingTypeParameterGenericParserError if typeParameters is null', () => {
    const typeAnnotation = {
      typeParameters: null,
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotation,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have type parameters."`,
    );
  });

  it('throws an error if typeAnnotation.typeParameters.type is not equal to parser.typeParameterInstantiation', () => {
    const flowTypeAnnotation = {
      typeParameters: {
        type: 'wrongType',
        params: [1],
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        flowTypeAnnotation,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TypeParameterInstantiation'"`,
    );
  });

  it("throws a MoreThanOneTypeParameterGenericParserError if typeParameters don't have 1 exactly parameter", () => {
    const typeAnnotationWithTwoParams = {
      typeParameters: {
        params: [1, 2],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithTwoParams,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );

    const typeAnnotationWithNoParams = {
      typeParameters: {
        params: [],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithNoParams,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );
  });
});

describe('isObjectProperty', () => {
  const propertyStub = {
    /* type: 'notObjectTypeProperty', */
    typeAnnotation: {
      typeAnnotation: 'wrongTypeAnnotation',
    },
    value: 'wrongValue',
    name: 'wrongName',
  };

  describe("when 'language' is 'Flow'", () => {
    const language: ParserType = 'Flow';
    it("returns 'true' if 'property.type' is 'ObjectTypeProperty'", () => {
      const result = isObjectProperty(
        {
          type: 'ObjectTypeProperty',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'false' if 'property.type' is not 'ObjectTypeProperty'", () => {
      const result = isObjectProperty(
        {
          type: 'notObjectTypeProperty',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(false);
    });
  });

  describe("when 'language' is 'TypeScript'", () => {
    const language: ParserType = 'TypeScript';
    it("returns 'true' if 'property.type' is 'TSPropertySignature'", () => {
      const result = isObjectProperty(
        {
          type: 'TSPropertySignature',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'false' if 'property.type' is not 'TSPropertySignature'", () => {
      const result = isObjectProperty(
        {
          type: 'notTSPropertySignature',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(false);
    });
  });
});

describe('parseObjectProperty', () => {
  const moduleName = 'testModuleName';
  const types = {['wrongName']: 'wrongType'};
  const aliasMap = {};
  const enumMap = {};
  const tryParse = () => null;
  const cxxOnly = false;
  const nullable = true;

  describe("when 'language' is 'Flow'", () => {
    const language: ParserType = 'Flow';
    it("throws an 'UnsupportedObjectPropertyTypeAnnotationParserError' error if 'property.type' is not 'ObjectTypeProperty'.", () => {
      const property = {
        type: 'notObjectTypeProperty',
        typeAnnotation: {
          type: 'notObjectTypeProperty',
          typeAnnotation: 'wrongTypeAnnotation',
        },
        value: 'wrongValue',
        name: 'wrongName',
      };
      const expected = new UnsupportedObjectPropertyTypeAnnotationParserError(
        moduleName,
        property,
        property.type,
        language,
      );
      expect(() =>
        parseObjectProperty(
          null, // parentObject
          property,
          moduleName,
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          nullable,
          flowTranslateTypeAnnotation,
          parser,
        ),
      ).toThrow(expected);
    });
  });

  describe("when 'language' is 'TypeScript'", () => {
    const language: ParserType = 'TypeScript';
    it("throws an 'UnsupportedObjectPropertyTypeAnnotationParserError' error if 'property.type' is not 'TSPropertySignature'.", () => {
      const property = {
        type: 'notTSPropertySignature',
        typeAnnotation: {
          typeAnnotation: 'wrongTypeAnnotation',
        },
        value: 'wrongValue',
        name: 'wrongName',
      };
      const expected = new UnsupportedObjectPropertyTypeAnnotationParserError(
        moduleName,
        property,
        property.type,
        language,
      );
      expect(() =>
        parseObjectProperty(
          null, // parentObject
          property,
          moduleName,
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          nullable,
          typeScriptTranslateTypeAnnotation,
          parser,
        ),
      ).toThrow(expected);
    });
  });
});

describe('buildSchemaFromConfigType', () => {
  const astMock = {
    type: 'Program',
    loc: {
      source: null,
      start: {line: 2, column: 10},
      end: {line: 16, column: 62},
    },
    range: [11, 373],
    body: [],
    comments: [],
    errors: [],
  };

  const componentSchemaMock = {
    filename: 'filename',
    componentName: 'componentName',
    extendsProps: [],
    events: [],
    props: [],
    commands: [],
  };

  const moduleSchemaMock = {
    type: 'NativeModule',
    aliasMap: {},
    enumMap: {},
    spec: {eventEmitters: [], methods: []},
    moduleName: '',
  };

  const wrapComponentSchemaMock = jest.fn();
  const buildComponentSchemaMock = jest.fn(
    (_ast, _parser) => componentSchemaMock,
  );
  const buildModuleSchemaMock = jest.fn(
    (_0, _1, _2, _3, _4) => moduleSchemaMock,
  );

  const buildSchemaFromConfigTypeHelper = (
    configType: 'module' | 'component' | 'none',
    filename: ?string,
  ) =>
    buildSchemaFromConfigType(
      configType,
      filename,
      astMock,
      wrapComponentSchemaMock,
      buildComponentSchemaMock,
      /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */
      buildModuleSchemaMock,
      parser,
      flowTranslateTypeAnnotation,
    );

  describe('when configType is none', () => {
    it('returns an empty schema', () => {
      const schema = buildSchemaFromConfigTypeHelper('none');

      expect(schema).toEqual({modules: {}});
    });
  });

  describe('when configType is component', () => {
    it('calls buildComponentSchema with ast and wrapComponentSchema with the result', () => {
      buildSchemaFromConfigTypeHelper('component');

      expect(buildComponentSchemaMock).toHaveBeenCalledTimes(1);
      expect(buildComponentSchemaMock).toHaveBeenCalledWith(astMock, parser);
      expect(wrapComponentSchemaMock).toHaveBeenCalledTimes(1);
      expect(wrapComponentSchemaMock).toHaveBeenCalledWith(componentSchemaMock);

      expect(buildModuleSchemaMock).not.toHaveBeenCalled();
    });
  });

  describe('when configType is module', () => {
    describe('when filename is undefined', () => {
      it('throws an error', () => {
        expect(() => buildSchemaFromConfigTypeHelper('module')).toThrow(
          'Filepath expected while parasing a module',
        );
      });
    });

    describe('when filename is null', () => {
      it('throws an error', () => {
        expect(() => buildSchemaFromConfigTypeHelper('module', null)).toThrow(
          'Filepath expected while parasing a module',
        );
      });
    });

    describe('when filename is defined and not null', () => {
      describe('when buildModuleSchema throws', () => {
        it('throws the error', () => {
          const parserError = new ParserError(
            'moduleName',
            astMock,
            'Something went wrong',
          );
          buildModuleSchemaMock.mockImplementationOnce(() => {
            throw parserError;
          });

          expect(() =>
            buildSchemaFromConfigTypeHelper('module', 'filename'),
          ).toThrow(parserError);
        });
      });

      describe('when buildModuleSchema returns null', () => {
        it('throws an error', () => {
          // $FlowFixMe[incompatible-type] - This is to test an invariant
          buildModuleSchemaMock.mockReturnValueOnce(null);

          expect(() =>
            buildSchemaFromConfigTypeHelper('module', 'filename'),
          ).toThrow(
            'When there are no parsing errors, the schema should not be null',
          );
        });
      });

      describe('when buildModuleSchema returns a schema', () => {
        it('calls buildModuleSchema with ast and wrapModuleSchema with the result', () => {
          buildSchemaFromConfigTypeHelper('module', 'filename');

          expect(buildModuleSchemaMock).toHaveBeenCalledTimes(1);
          expect(buildModuleSchemaMock).toHaveBeenCalledWith(
            'filename',
            astMock,
            expect.any(Function),
            parser,
            flowTranslateTypeAnnotation,
          );

          expect(buildComponentSchemaMock).not.toHaveBeenCalled();
          expect(wrapComponentSchemaMock).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('isModuleRegistryCall', () => {
    describe('when node is not of CallExpression type', () => {
      it('returns false', () => {
        const node = {
          type: 'NotCallExpression',
        };
        expect(isModuleRegistryCall(node)).toBe(false);
      });
    });

    describe('when node is of CallExpressionType', () => {
      describe('when callee type is not of MemberExpression type', () => {
        it('returns false', () => {
          const node = {
            type: 'CallExpression',
            callee: {
              type: 'NotMemberExpression',
            },
          };
          expect(isModuleRegistryCall(node)).toBe(false);
        });
      });

      describe('when callee type is of MemberExpression type', () => {
        describe('when memberExpression has an object of type different than "Identifier"', () => {
          it('returns false', () => {
            const node = {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: {
                  type: 'NotIdentifier',
                  name: 'TurboModuleRegistry',
                },
              },
            };
            expect(isModuleRegistryCall(node)).toBe(false);
          });
        });

        describe('when memberExpression has an object of name different than "TurboModuleRegistry"', () => {
          it('returns false', () => {
            const node = {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: {
                  type: 'Identifier',
                  name: 'NotTurboModuleRegistry',
                },
              },
            };
            expect(isModuleRegistryCall(node)).toBe(false);
          });
        });

        describe('when memberExpression has an object of type "Identifier" and name "TurboModuleRegistry', () => {
          describe('when memberExpression has a property of type different than "Identifier"', () => {
            it('returns false', () => {
              const node = {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: {
                    type: 'Identifier',
                    name: 'TurboModuleRegistry',
                  },
                  property: {
                    type: 'NotIdentifier',
                    name: 'get',
                  },
                },
              };
              expect(isModuleRegistryCall(node)).toBe(false);
            });
          });

          describe('when memberExpression has a property of name different than "get" or "getEnforcing', () => {
            it('returns false', () => {
              const node = {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: {
                    type: 'Identifier',
                    name: 'TurboModuleRegistry',
                  },
                  property: {
                    type: 'Identifier',
                    name: 'NotGet',
                  },
                },
              };
              expect(isModuleRegistryCall(node)).toBe(false);
            });
          });

          describe('when memberExpression has a property of type "Identifier" and of name "get" or "getEnforcing', () => {
            describe('when memberExpression is computed', () => {
              it('returns false', () => {
                const node = {
                  type: 'CallExpression',
                  callee: {
                    type: 'MemberExpression',
                    object: {
                      type: 'Identifier',
                      name: 'TurboModuleRegistry',
                    },
                    property: {
                      type: 'Identifier',
                      name: 'get',
                    },
                    computed: true,
                  },
                };
                expect(isModuleRegistryCall(node)).toBe(false);
              });
            });

            describe('when memberExpression is not computed', () => {
              it('returns true', () => {
                const node = {
                  type: 'CallExpression',
                  callee: {
                    type: 'MemberExpression',
                    object: {
                      type: 'Identifier',
                      name: 'TurboModuleRegistry',
                    },
                    property: {
                      type: 'Identifier',
                      name: 'get',
                    },
                    computed: false,
                  },
                };
                expect(isModuleRegistryCall(node)).toBe(true);
              });
            });
          });
        });
      });
    });
  });
});

describe('buildSchema', () => {
  const getConfigTypeSpy = jest.spyOn(require('../utils'), 'getConfigType');

  describe('when there is no codegenNativeComponent and no TurboModule', () => {
    const contents = '';

    it('returns an empty module', () => {
      const schema = buildSchema(
        contents,
        'fileName',
        wrapComponentSchema,
        buildComponentSchema,
        buildModuleSchema,
        Visitor,
        parser,
        flowTranslateTypeAnnotation,
      );

      expect(getConfigTypeSpy).not.toHaveBeenCalled();
      expect(schema).toEqual({modules: {}});
    });
  });

  describe('when there is a codegenNativeComponent', () => {
    const contents = `
      import type {ViewProps} from 'ViewPropTypes';
      import type {HostComponent} from 'react-native';

      const codegenNativeComponent = require('codegenNativeComponent');

      export type ModuleProps = $ReadOnly<{|
        ...ViewProps,
      |}>;

      export default codegenNativeComponent<ModuleProps>(
        'Module',
      ) as HostComponent<ModuleProps>;
    `;

    it('returns a module with good properties', () => {
      const schema = buildSchema(
        contents,
        'fileName',
        wrapComponentSchema,
        buildComponentSchema,
        buildModuleSchema,
        Visitor,
        flowParser,
        flowTranslateTypeAnnotation,
      );

      expect(getConfigTypeSpy).toHaveBeenCalledTimes(1);
      expect(getConfigTypeSpy).toHaveBeenCalledWith(
        parser.getAst(contents, 'fileName'),
        Visitor,
      );
      expect(schema).toEqual({
        modules: {
          Module: {
            type: 'Component',
            components: {
              Module: {
                extendsProps: [
                  {
                    type: 'ReactNativeBuiltInType',
                    knownTypeName: 'ReactNativeCoreViewProps',
                  },
                ],
                events: [],
                props: [],
                commands: [],
              },
            },
          },
        },
      });
    });
  });

  describe('when there is a codegenNativeComponent, using `as`', () => {
    const contents = `
      import type {ViewProps} from 'ViewPropTypes';
      import type {HostComponent} from 'react-native';

      const codegenNativeComponent = require('codegenNativeComponent');

      export type ModuleProps = $ReadOnly<{|
        ...ViewProps,
      |}>;

      export default codegenNativeComponent<ModuleProps>(
        'Module',
      ) as HostComponent<ModuleProps>;
    `;

    it('returns a module with good properties', () => {
      const schema = buildSchema(
        contents,
        'fileName',
        wrapComponentSchema,
        buildComponentSchema,
        buildModuleSchema,
        Visitor,
        flowParser,
        flowTranslateTypeAnnotation,
      );

      expect(getConfigTypeSpy).toHaveBeenCalledTimes(1);
      expect(getConfigTypeSpy).toHaveBeenCalledWith(
        parser.getAst(contents, 'fileName'),
        Visitor,
      );
      expect(schema).toEqual({
        modules: {
          Module: {
            type: 'Component',
            components: {
              Module: {
                extendsProps: [
                  {
                    type: 'ReactNativeBuiltInType',
                    knownTypeName: 'ReactNativeCoreViewProps',
                  },
                ],
                events: [],
                props: [],
                commands: [],
              },
            },
          },
        },
      });
    });
  });

  describe('when there is a TurboModule', () => {
    const contents = `
      import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
      import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

      export interface Spec extends TurboModule {
        +getArray: (a: Array<any>) => Array<string>;
      }

      export default TurboModuleRegistry.getEnforcing<Spec>(
        'SampleTurboModule',
      ) as Spec;
    `;

    it('returns a module with good properties', () => {
      const schema = buildSchema(
        contents,
        'fileName',
        wrapComponentSchema,
        buildComponentSchema,
        buildModuleSchema,
        Visitor,
        flowParser,
        flowTranslateTypeAnnotation,
      );

      expect(getConfigTypeSpy).toHaveBeenCalledTimes(1);
      expect(getConfigTypeSpy).toHaveBeenCalledWith(
        parser.getAst(contents, 'fileName'),
        Visitor,
      );
      expect(schema).toEqual({
        modules: {
          fileName: {
            type: 'NativeModule',
            aliasMap: {},
            enumMap: {},
            spec: {
              eventEmitters: [],
              methods: [
                {
                  name: 'getArray',
                  optional: false,
                  typeAnnotation: {
                    type: 'FunctionTypeAnnotation',
                    returnTypeAnnotation: {
                      type: 'ArrayTypeAnnotation',
                      elementType: {type: 'StringTypeAnnotation'},
                    },
                    params: [
                      {
                        name: 'a',
                        optional: false,
                        typeAnnotation: {
                          type: 'ArrayTypeAnnotation',
                          elementType: {type: 'AnyTypeAnnotation'},
                        },
                      },
                    ],
                  },
                },
              ],
            },
            moduleName: 'SampleTurboModule',
            excludedPlatforms: undefined,
          },
        },
      });
    });
  });
});

describe('parseModuleName', () => {
  const hasteModuleName = 'testModuleName';
  const emptyFlowAst = parser.getAst('');
  const moduleSpecs = [{name: 'Spec'}];
  const flowAstWithOneCallExpression = parser.getAst(
    "export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');",
  );

  describe('throwIfUnusedModuleInterfaceParserError', () => {
    it("throws an 'UnusedModuleInterfaceParserError' error if 'callExpressions' array is 'empty'", () => {
      const expected = new UnusedModuleInterfaceParserError(
        hasteModuleName,
        moduleSpecs[0],
      );

      expect(() =>
        parseModuleName(hasteModuleName, moduleSpecs[0], emptyFlowAst, parser),
      ).toThrow(expected);
    });

    it("doesn't throw an 'UnusedModuleInterfaceParserError' error if 'callExpressions' array is 'NOT empty'", () => {
      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithOneCallExpression,
          parser,
        ),
      ).not.toThrow(UnusedModuleInterfaceParserError);
    });
  });

  describe('throwIfMoreThanOneModuleRegistryCalls', () => {
    it("throws an 'MoreThanOneModuleRegistryCallsParserError' error if 'callExpressions' array contains more than one 'callExpression'", () => {
      const flowAstWithTwoCallExpressions = parser.getAst(
        "export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule'); TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');",
      );

      const callExpressions: Array<$FlowFixMe> =
        flowAstWithTwoCallExpressions.body;

      const expected = new MoreThanOneModuleRegistryCallsParserError(
        hasteModuleName,
        callExpressions,
        callExpressions.length,
      );

      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithTwoCallExpressions,
          parser,
        ),
      ).toThrow(expected);
    });

    it("doesn't throw an 'MoreThanOneModuleRegistryCallsParserError' error if 'callExpressions' array contains extactly one 'callExpression'", () => {
      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithOneCallExpression,
          parser,
        ),
      ).not.toThrow(MoreThanOneModuleRegistryCallsParserError);
    });
  });

  describe('throwIfWrongNumberOfCallExpressionArgs', () => {
    it("throws an 'IncorrectModuleRegistryCallArityParserError' error if wrong number of call expression args is used", () => {
      const flowAstWithZeroCallExpressionArgs = parser.getAst(
        'export default TurboModuleRegistry.getEnforcing();',
      );
      const flowCallExpressionWithoutArgs =
        flowAstWithZeroCallExpressionArgs.body[0].declaration;
      const numberOfCallExpressionArgs =
        flowCallExpressionWithoutArgs.arguments.length;
      const flowCallExpressionWithoutArgsCallee =
        flowCallExpressionWithoutArgs.callee.property.name;

      const expected = new IncorrectModuleRegistryCallArityParserError(
        hasteModuleName,
        flowCallExpressionWithoutArgs,
        flowCallExpressionWithoutArgsCallee,
        numberOfCallExpressionArgs,
      );

      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithZeroCallExpressionArgs,
          parser,
        ),
      ).toThrow(expected);
    });

    it("doesn't throw an 'IncorrectModuleRegistryCallArityParserError' error if correct number of call expression args is used", () => {
      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithOneCallExpression,
          parser,
        ),
      ).not.toThrow(IncorrectModuleRegistryCallArityParserError);
    });
  });

  describe('throwIfIncorrectModuleRegistryCallArgument', () => {
    it("throws an 'IncorrectModuleRegistryCallArgumentTypeParserError' error if call expression arg is NOT a string literal", () => {
      const flowAstWithNonStringLiteralCallExpressionArg = parser.getAst(
        'export default TurboModuleRegistry.getEnforcing(Spec);',
      );
      const flowCallExpression =
        flowAstWithNonStringLiteralCallExpressionArg.body[0].declaration;
      const flowCallExpressionCalllee = flowCallExpression.callee.property.name;
      const flowCallExpressionArg = flowCallExpression.arguments[0];

      const expected = new IncorrectModuleRegistryCallArgumentTypeParserError(
        hasteModuleName,
        flowCallExpressionArg,
        flowCallExpressionCalllee,
        flowCallExpressionArg.type,
      );

      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithNonStringLiteralCallExpressionArg,
          parser,
        ),
      ).toThrow(expected);
    });

    it("doesn't throw an 'IncorrectModuleRegistryCallArgumentTypeParserError' error if call expression arg is a string literal", () => {
      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithOneCallExpression,
          parser,
        ),
      ).not.toThrow(IncorrectModuleRegistryCallArgumentTypeParserError);
    });
  });

  describe('throwIfUntypedModule', () => {
    it("throws an 'UntypedModuleRegistryCallParserError' error if call expression is untyped", () => {
      const flowAstWithUntypedCallExpression = parser.getAst(
        "export default TurboModuleRegistry.getEnforcing('SampleTurboModule');",
      );
      const flowCallExpression =
        flowAstWithUntypedCallExpression.body[0].declaration;
      const flowCallExpressionCallee = flowCallExpression.callee.property.name;
      const moduleName = flowCallExpression.arguments[0].value;
      const expected = new UntypedModuleRegistryCallParserError(
        hasteModuleName,
        flowCallExpression,
        flowCallExpressionCallee,
        moduleName,
      );

      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithUntypedCallExpression,
          parser,
        ),
      ).toThrow(expected);
    });

    it("doesn't throw an 'UntypedModuleRegistryCallParserError' error if call expression is typed", () => {
      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithOneCallExpression,
          parser,
        ),
      ).not.toThrow(UntypedModuleRegistryCallParserError);
    });
  });

  describe('when flow ast with valid module is passed', () => {
    it("returns the correct ModuleName and doesn't throw any error", () => {
      const moduleType = 'Spec';
      const moduleName = 'SampleTurboModule';
      const flowAstWithValidModule = parser.getAst(
        `export default TurboModuleRegistry.getEnforcing<${moduleType}>('${moduleName}');`,
      );

      const expected = moduleName;

      expect(
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithValidModule,
          parser,
        ),
      ).toEqual(expected);

      expect(() =>
        parseModuleName(
          hasteModuleName,
          moduleSpecs[0],
          flowAstWithValidModule,
          parser,
        ),
      ).not.toThrow();
    });
  });
});

describe('buildModuleSchema', () => {
  const hasteModuleName = 'TestModuleName';
  const [, tryParse] = createParserErrorCapturer();
  const language = flowParser.language();
  const NATIVE_MODULE = `
  import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
    import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

    export interface Spec extends TurboModule {
      +getArray: (a: Array<any>) => Array<string>;
    }

    export default TurboModuleRegistry.getEnforcing<Spec>(
      'SampleTurboModule',
    ) as Spec;
  `;

  describe('throwIfModuleInterfaceNotFound', () => {
    it('should throw ModuleInterfaceNotFoundParserError if no module interface is found', () => {
      const ast = flowParser.getAst('');
      const expected = new ModuleInterfaceNotFoundParserError(
        hasteModuleName,
        ast,
        language,
      );

      expect(() =>
        buildModuleSchema(
          hasteModuleName,
          ast,
          tryParse,
          flowParser,
          flowTranslateTypeAnnotation,
        ),
      ).toThrow(expected);
    });

    it('should not throw ModuleInterfaceNotFoundParserError if module interface is found', () => {
      const ast = flowParser.getAst(NATIVE_MODULE);

      expect(() =>
        buildModuleSchema(
          hasteModuleName,
          ast,
          tryParse,
          flowParser,
          flowTranslateTypeAnnotation,
        ),
      ).not.toThrow();
    });
  });

  describe('throwIfMoreThanOneModuleInterfaceParser', () => {
    it('should throw an error if mulitple module interfaces are found', () => {
      const contents = `
      import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
        import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

        export interface Spec extends TurboModule {
          +getBool: (arg: boolean) => boolean;      }
        export interface SpecOther extends TurboModule {
          +getArray: (a: Array<any>) => Array<string>;
        }
      `;
      const ast = flowParser.getAst(contents);
      const types = flowParser.getTypes(ast);
      const moduleSpecs = Object.values(types).filter(t =>
        flowParser.isModuleInterface(t),
      );
      const expected = new MoreThanOneModuleInterfaceParserError(
        hasteModuleName,
        moduleSpecs,
        moduleSpecs.map(node => node.id.name),
        language,
      );

      expect(() =>
        buildModuleSchema(
          hasteModuleName,
          ast,
          tryParse,
          flowParser,
          flowTranslateTypeAnnotation,
        ),
      ).toThrow(expected);
    });

    it('should not throw an error if exactly one module interface is found', () => {
      const ast = flowParser.getAst(NATIVE_MODULE);

      expect(() =>
        buildModuleSchema(
          hasteModuleName,
          ast,
          tryParse,
          flowParser,
          flowTranslateTypeAnnotation,
        ),
      ).not.toThrow();
    });
  });

  describe('throwIfModuleInterfaceIsMisnamed', () => {
    it('should throw an error if module interface is misnamed', () => {
      const contents = `
      import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
        import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

        export interface MisnamedSpec extends TurboModule {
          +getArray: (a: Array<any>) => Array<string>;
        }

        export default TurboModuleRegistry.getEnforcing<Spec>(
          'SampleTurboModule',
        ) as Spec;
      `;
      const ast = flowParser.getAst(contents);
      const types = flowParser.getTypes(ast);
      const moduleSpecs = Object.values(types).filter(t =>
        flowParser.isModuleInterface(t),
      );
      const [moduleSpec] = moduleSpecs;

      const expected = new MisnamedModuleInterfaceParserError(
        hasteModuleName,
        moduleSpec.id,
        language,
      );

      expect(() =>
        buildModuleSchema(
          hasteModuleName,
          ast,
          tryParse,
          flowParser,
          flowTranslateTypeAnnotation,
        ),
      ).toThrow(expected);
    });

    it('should not throw an error if module interface is correctly named', () => {
      const ast = flowParser.getAst(NATIVE_MODULE);

      expect(() =>
        buildModuleSchema(
          hasteModuleName,
          ast,
          tryParse,
          flowParser,
          flowTranslateTypeAnnotation,
        ),
      ).not.toThrow();
    });
  });

  it('should return valid module schema', () => {
    const ast = flowParser.getAst(NATIVE_MODULE);
    const schmeaMock = {
      aliasMap: {},
      enumMap: {},
      excludedPlatforms: undefined,
      moduleName: 'SampleTurboModule',
      spec: {
        eventEmitters: [],
        methods: [
          {
            name: 'getArray',
            optional: false,
            typeAnnotation: {
              params: [
                {
                  name: 'a',
                  optional: false,
                  typeAnnotation: {
                    type: 'ArrayTypeAnnotation',
                    elementType: {type: 'AnyTypeAnnotation'},
                  },
                },
              ],
              returnTypeAnnotation: {
                elementType: {type: 'StringTypeAnnotation'},
                type: 'ArrayTypeAnnotation',
              },
              type: 'FunctionTypeAnnotation',
            },
          },
        ],
      },
      type: 'NativeModule',
    };
    const schema = buildModuleSchema(
      hasteModuleName,
      ast,
      tryParse,
      flowParser,
      flowTranslateTypeAnnotation,
    );

    expect(schema).toEqual(schmeaMock);
  });
});

describe('createComponentConfig', () => {
  const foundConfig = {
    propsTypeName: 'testPropsTypeName',
    componentName: 'testComponentName',
  };

  describe('when commandTypeNames contains an object as first element', () => {
    it('returns expected config', () => {
      const commandsTypeNames = [
        {
          commandTypeName: 'testTypeName',
          commandOptionsExpression: 'testOptionsExpression',
        },
      ];

      const expectedConfig = {
        propsTypeName: 'testPropsTypeName',
        componentName: 'testComponentName',
        commandTypeName: 'testTypeName',
        commandOptionsExpression: 'testOptionsExpression',
      };

      const configs = createComponentConfig(foundConfig, commandsTypeNames);
      expect(configs).toEqual(expectedConfig);
    });
  });

  describe('when commandTypeNames is an empty array', () => {
    it('returns the foundConfig and null for the command parameters', () => {
      // $FlowFixMe[missing-empty-array-annot]
      const commandsTypeNames = [];

      const expectedConfig = {
        propsTypeName: 'testPropsTypeName',
        componentName: 'testComponentName',
        commandTypeName: null,
        commandOptionsExpression: null,
      };

      const configs = createComponentConfig(foundConfig, commandsTypeNames);
      expect(configs).toEqual(expectedConfig);
    });
  });
});

describe('getCommandOptions', () => {
  it('returns null when commandOptionsExpression is null', () => {
    const result = getCommandOptions(null);
    expect(result).toBeNull();
  });

  it('parses and returns command options correctly', () => {
    const commandOptionsExpression = {
      properties: [
        {
          range: [],
          loc: {},
          type: '',
          key: {
            name: 'hotspotUpdate',
            loc: {},
          },
          value: {
            elements: [
              {
                value: 'value',
              },
            ],
          },
        },
      ],
    };
    const result = getCommandOptions(commandOptionsExpression);
    expect(result).toEqual({
      hotspotUpdate: ['value'],
    });
  });

  it('should throw an error if command options are not defined correctly', () => {
    const commandOptionsExpression = {
      properties: null,
    };
    expect(() => getCommandOptions(commandOptionsExpression)).toThrowError(
      'Failed to parse command options, please check that they are defined correctly',
    );
  });
});

describe('getOptions', () => {
  it('returns null if optionsExpression is falsy', () => {
    expect(getOptions(null)).toBeNull();
    expect(getOptions(undefined)).toBeNull();
    expect(getOptions(false)).toBeNull();
    expect(getOptions(0)).toBeNull();
    expect(getOptions('')).toBeNull();
  });

  it('parses and returns options correctly if codegen options are defined correctly', () => {
    const optionsExpression = {
      properties: [
        {
          value: {
            type: 'ArrayExpression',
            value: 'value',
            elements: [
              {
                value: 'value1',
              },
            ],
          },
          key: {
            name: 'keyName',
          },
        },
      ],
    };
    expect(getOptions(optionsExpression)).toEqual({
      keyName: ['value1'],
    });
  });

  it('throws an error if codegen options are not defined correctly', () => {
    const optionsExpression = {
      properties: null,
    };
    expect(() => getOptions(optionsExpression)).toThrowError(
      'Failed to parse codegen options, please check that they are defined correctly',
    );
  });

  it('throws an error if both paperComponentName and paperComponentNameDeprecated are used', () => {
    const optionsExpression = {
      properties: [
        {
          key: {name: 'paperComponentName'},
          value: {value: 'RCTRefreshControl'},
        },
        {
          key: {name: 'paperComponentNameDeprecated'},
          value: {value: 'RCTSwitch'},
        },
      ],
    };
    expect(() => getOptions(optionsExpression)).toThrowError(
      'Failed to parse codegen options, cannot use both paperComponentName and paperComponentNameDeprecated',
    );
  });

  it('returns options if only paperComponentName is used', () => {
    const optionsExpression = {
      properties: [
        {
          key: {name: 'paperComponentName'},
          value: {value: 'RCTRefreshControl'},
        },
      ],
    };
    const expectedOptions = {paperComponentName: 'RCTRefreshControl'};
    expect(getOptions(optionsExpression)).toEqual(expectedOptions);
  });

  it('returns options if only paperComponentNameDeprecated is used', () => {
    const optionsExpression = {
      properties: [
        {
          key: {name: 'paperComponentNameDeprecated'},
          value: {value: 'RCTRefreshControl'},
        },
      ],
    };
    const expectedOptions = {paperComponentNameDeprecated: 'RCTRefreshControl'};
    expect(getOptions(optionsExpression)).toEqual(expectedOptions);
  });
});

describe('getCommandTypeNameAndOptionsExpression', () => {
  it("returns undefined when namedExport isn't well formatted", () => {
    expect(
      getCommandTypeNameAndOptionsExpression(null, flowParser),
    ).toBeUndefined();

    expect(
      getCommandTypeNameAndOptionsExpression(undefined, flowParser),
    ).toBeUndefined();

    expect(
      getCommandTypeNameAndOptionsExpression({}, flowParser),
    ).toBeUndefined();
  });

  it('returns undefined when the called expression name is not codegenNativeCommands', () => {
    const namedExportMock = {
      declaration: {
        declarations: [
          {
            init: {
              callee: {
                name: 'notCodegenNativeCommands',
              },
            },
          },
        ],
      },
    };

    expect(
      getCommandTypeNameAndOptionsExpression(namedExportMock, flowParser),
    ).toBeUndefined();
  });

  it("throws when the called expression doesn't have 1 argument", () => {
    const namedExportMock = {
      declaration: {
        declarations: [
          {
            init: {
              callee: {
                name: 'codegenNativeCommands',
              },
              arguments: [],
            },
          },
        ],
      },
    };

    expect(() =>
      getCommandTypeNameAndOptionsExpression(namedExportMock, flowParser),
    ).toThrow(
      new Error(
        'codegenNativeCommands must be passed options including the supported commands',
      ),
    );
  });

  it('throws when the type of the argument is not a generic type annotation', () => {
    const namedExportMock = {
      declaration: {
        declarations: [
          {
            init: {
              callee: {
                name: 'codegenNativeCommands',
              },
              arguments: [{}],
              typeArguments: {params: [{type: 'StringTypeAnnotation'}]},
            },
          },
        ],
      },
    };

    expect(() =>
      getCommandTypeNameAndOptionsExpression(namedExportMock, flowParser),
    ).toThrow(
      new Error(
        "codegenNativeCommands doesn't support inline definitions. Specify a file local type alias",
      ),
    );
  });

  it('returns the command TypeName and options expression when the named export is valid', () => {
    const commandTypeName = 'MyCommandType';
    const commandOptionsExpression = {
      type: 'ObjectExpression',
      properties: [],
    };

    const namedExportMock = {
      declaration: {
        declarations: [
          {
            init: {
              callee: {
                name: 'codegenNativeCommands',
              },
              arguments: [commandOptionsExpression],
              typeArguments: {
                params: [
                  {
                    type: 'GenericTypeAnnotation',
                    id: {
                      name: commandTypeName,
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    };

    expect(
      getCommandTypeNameAndOptionsExpression(namedExportMock, flowParser),
    ).toStrictEqual({
      commandTypeName,
      commandOptionsExpression,
    });
  });

  describe('propertyNames', () => {
    it('returns propertyNames with valid properties', () => {
      const properties = [
        {key: {name: 'testName'}},
        {key: {name: 'testName2'}},
      ];
      const expected = ['testName', 'testName2'];
      expect(propertyNames(properties)).toEqual(expected);
    });

    it('returns empty propertyNames with incorrect properties', () => {
      const properties = [
        {key: {invalid: 'testName'}},
        {key: {invalid: 'testName2'}},
      ];
      expect(propertyNames(properties)).toEqual([]);
    });
  });
});

describe('getTypeResolutionStatus', () => {
  it('returns type resolution status for a type declaration', () => {
    const typeAnnotation = {
      id: {
        name: 'TypeAnnotationName',
      },
    };
    expect(
      getTypeResolutionStatus('alias', typeAnnotation, flowParser),
    ).toEqual({
      successful: true,
      type: 'alias',
      name: 'TypeAnnotationName',
    });
  });

  it('returns type resolution status for an enum declaration', () => {
    const typeAnnotation = {
      id: {
        name: 'TypeAnnotationName',
      },
    };
    expect(getTypeResolutionStatus('enum', typeAnnotation, flowParser)).toEqual(
      {
        successful: true,
        type: 'enum',
        name: 'TypeAnnotationName',
      },
    );
  });
});

describe('handleGenericTypeAnnotation', () => {
  it('returns when TypeAnnotation is a type declaration', () => {
    const typeAnnotation = {
      id: {
        name: 'TypeAnnotationName',
      },
    };
    const resolvedTypeAnnotation = {
      type: 'TypeAlias',
      right: {
        type: 'TypeAnnotation',
      },
    };
    expect(
      handleGenericTypeAnnotation(
        typeAnnotation,
        resolvedTypeAnnotation,
        flowParser,
      ),
    ).toEqual({
      typeAnnotation: {
        type: 'TypeAnnotation',
      },
      typeResolutionStatus: {
        successful: true,
        type: 'alias',
        name: 'TypeAnnotationName',
      },
    });
  });

  it('returns when TypeAnnotation is an enum declaration', () => {
    const typeAnnotation = {
      id: {
        name: 'TypeAnnotationName',
      },
    };
    const resolvedTypeAnnotation = {
      type: 'EnumDeclaration',
      body: {
        type: 'TypeAnnotation',
      },
    };
    expect(
      handleGenericTypeAnnotation(
        typeAnnotation,
        resolvedTypeAnnotation,
        flowParser,
      ),
    ).toEqual({
      typeAnnotation: {
        type: 'TypeAnnotation',
      },
      typeResolutionStatus: {
        successful: true,
        type: 'enum',
        name: 'TypeAnnotationName',
      },
    });
  });

  it('throws when the non GenericTypeAnnotation is unsupported', () => {
    const typeAnnotation = {
      type: 'UnsupportedTypeAnnotation',
      id: {
        name: 'UnsupportedType',
      },
    };
    const resolvedTypeAnnotation = {
      type: 'UnsupportedTypeAnnotation',
    };
    expect(() =>
      handleGenericTypeAnnotation(
        typeAnnotation,
        resolvedTypeAnnotation,
        flowParser,
      ),
    ).toThrow(
      new Error(
        parser.genericTypeAnnotationErrorMessage(resolvedTypeAnnotation),
      ),
    );
  });
});
