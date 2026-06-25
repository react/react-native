/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {
  throwIfConfigNotfound,
  throwIfMoreThanOneConfig,
} = require('../error-utils');
const {
  throwIfArgumentPropsAreNull,
  throwIfArrayElementTypeAnnotationIsUnsupported,
  throwIfBubblingTypeIsNull,
  throwIfEventHasNoName,
  throwIfIncorrectModuleRegistryCallArgument,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfModuleInterfaceIsMisnamed,
  throwIfModuleInterfaceNotFound,
  throwIfModuleTypeIsUnsupported,
  throwIfMoreThanOneCodegenNativecommands,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfPartialNotAnnotatingTypeParameter,
  throwIfPartialWithMoreParameter,
  throwIfTypeAliasIsNotInterface,
  throwIfUnsupportedFunctionParamTypeAnnotationParserError,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfUntypedModule,
  throwIfUnusedModuleInterfaceParserError,
  throwIfWrongNumberOfCallExpressionArgs,
} = require('../error-utils');
const {
  IncorrectModuleRegistryCallArgumentTypeParserError,
  IncorrectModuleRegistryCallArgumentValueParserError,
  IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallTypeParameterParserError,
  MisnamedModuleInterfaceParserError,
  ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleInterfaceParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedModulePropertyParserError,
  UntypedModuleRegistryCallParserError,
  UnusedModuleInterfaceParserError,
} = require('../errors');
const {FlowParser} = require('../flow/parser');
const {TypeScriptParser} = require('../typescript/parser');

describe('throwIfModuleInterfaceIsMisnamed', () => {
  it("don't throw error if module interface name is Spec", () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Spec'};
    const parserType = 'Flow';

    expect(() => {
      throwIfModuleInterfaceIsMisnamed(nativeModuleName, specId, parserType);
    }).not.toThrow(MisnamedModuleInterfaceParserError);
  });
  it('throw error if module interface is misnamed', () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Name'};
    const parserType = 'TypeScript';

    expect(() => {
      throwIfModuleInterfaceIsMisnamed(nativeModuleName, specId, parserType);
    }).toThrow(MisnamedModuleInterfaceParserError);
  });
});

describe('throwIfModuleInterfaceNotFound', () => {
  it('throw error if there are zero module specs', () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Name'};
    const parserType = 'TypeScript';

    expect(() => {
      throwIfModuleInterfaceNotFound(0, nativeModuleName, specId, parserType);
    }).toThrow(ModuleInterfaceNotFoundParserError);
  });

  it("don't throw error if there is at least one module spec", () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Spec'};
    const parserType = 'Flow';

    expect(() => {
      throwIfModuleInterfaceNotFound(1, nativeModuleName, specId, parserType);
    }).not.toThrow(ModuleInterfaceNotFoundParserError);
  });
});

describe('throwIfMoreThanOneModuleRegistryCalls', () => {
  it('throw error if module registry calls more than one', () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [
      {name: 'callExpression1'},
      {name: 'callExpression2'},
    ];

    expect(() => {
      throwIfMoreThanOneModuleRegistryCalls(
        nativeModuleName,
        callExpressions,
        callExpressions.length,
      );
    }).toThrow(MoreThanOneModuleRegistryCallsParserError);
  });
  it("don't throw error if single module registry call", () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [{name: 'callExpression1'}];

    expect(() => {
      throwIfMoreThanOneModuleRegistryCalls(
        nativeModuleName,
        callExpressions,
        callExpressions.length,
      );
    }).not.toThrow(MoreThanOneModuleRegistryCallsParserError);
  });
});

describe('throwIfUnusedModuleInterfaceParserError', () => {
  it('throw error if unused module', () => {
    const nativeModuleName = 'moduleName';
    const callExpressions: Array<$FlowFixMe> = [];
    const spec = {name: 'Spec'};
    expect(() => {
      throwIfUnusedModuleInterfaceParserError(
        nativeModuleName,
        spec,
        callExpressions,
      );
    }).toThrow(UnusedModuleInterfaceParserError);
  });

  it("don't throw error if module is used", () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [{name: 'callExpression1'}];
    const spec = {name: 'Spec'};
    expect(() => {
      throwIfUnusedModuleInterfaceParserError(
        nativeModuleName,
        spec,
        callExpressions,
      );
    }).not.toThrow(UnusedModuleInterfaceParserError);
  });
});

describe('throwErrorIfWrongNumberOfCallExpressionArgs', () => {
  it('throw error if wrong number of call expression args is used', () => {
    const nativeModuleName = 'moduleName';
    const flowCallExpression: {argument: Array<$FlowFixMe>} = {argument: []};
    const methodName = 'methodName';
    const numberOfCallExpressionArgs = flowCallExpression.argument.length;
    expect(() => {
      throwIfWrongNumberOfCallExpressionArgs(
        nativeModuleName,
        flowCallExpression,
        methodName,
        numberOfCallExpressionArgs,
      );
    }).toThrow(IncorrectModuleRegistryCallArityParserError);
  });

  it("don't throw error if correct number of call expression args is used", () => {
    const nativeModuleName = 'moduleName';
    const flowCallExpression = {argument: ['argument']};
    const methodName = 'methodName';
    const numberOfCallExpressionArgs = flowCallExpression.argument.length;
    expect(() => {
      throwIfWrongNumberOfCallExpressionArgs(
        nativeModuleName,
        flowCallExpression,
        methodName,
        numberOfCallExpressionArgs,
      );
    }).not.toThrow(IncorrectModuleRegistryCallArityParserError);
  });
});

describe('throwIfUnsupportedFunctionReturnTypeAnnotationParserError', () => {
  const returnTypeAnnotation = {
      returnType: '',
    },
    nativeModuleName = 'moduleName',
    invalidReturnType = 'FunctionTypeAnnotation';

  it('do not throw error if cxxOnly is true', () => {
    const cxxOnly = true,
      returnType = 'FunctionTypeAnnotation';

    expect(() => {
      throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
        nativeModuleName,
        returnTypeAnnotation,
        invalidReturnType,
        cxxOnly,
        returnType,
      );
    }).not.toThrow(UnsupportedFunctionReturnTypeAnnotationParserError);
  });

  it('do not throw error if returnTypeAnnotation type is not FunctionTypeAnnotation', () => {
    const cxxOnly = false,
      returnType = '';

    expect(() => {
      throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
        nativeModuleName,
        returnTypeAnnotation,
        invalidReturnType,
        cxxOnly,
        returnType,
      );
    }).not.toThrow(UnsupportedFunctionReturnTypeAnnotationParserError);
  });

  it('throw error if cxxOnly is false and returnTypeAnnotation type is FunctionTypeAnnotation', () => {
    const cxxOnly = false,
      returnType = 'FunctionTypeAnnotation';

    expect(() => {
      throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
        nativeModuleName,
        returnTypeAnnotation,
        invalidReturnType,
        cxxOnly,
        returnType,
      );
    }).toThrow(UnsupportedFunctionReturnTypeAnnotationParserError);
  });
});

describe('throwIfIncorrectModuleRegistryCallTypeParameterParserError', () => {
  const nativeModuleName = 'moduleName';
  const methodName = 'methodName';
  const moduleName = 'moduleName';
  const flowParser = new FlowParser();
  const typescriptParser = new TypeScriptParser();

  it('throw error if flowTypeArguments type is incorrect', () => {
    const flowTypeArguments = {
      type: '',
      params: [
        {
          type: 'GenericTypeAnnotation',
          id: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params length is not 1', () => {
    const flowTypeArguments: $FlowFixMe = {
      type: 'TypeParameterInstantiation',
      params: [],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params type is not GenericTypeAnnotation', () => {
    const flowTypeArguments = {
      type: 'TypeParameterInstantiation',
      params: [
        {
          type: '',
          id: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params id name is not Spec', () => {
    const flowTypeArguments = {
      type: 'TypeParameterInstantiation',
      params: [
        {
          type: 'GenericTypeAnnotation',
          id: {
            name: '',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('do not throw error if flowTypeArguments are correct', () => {
    const flowTypeArguments = {
      type: 'TypeParameterInstantiation',
      params: [
        {
          type: 'GenericTypeAnnotation',
          id: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).not.toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if typeScriptTypeArguments type not correct', () => {
    const typeScriptTypeArguments = {
      type: '',
      params: [
        {
          type: 'TSTypeReference',
          typeName: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if typeScriptTypeArguments params length is not equal to 1', () => {
    const typeScriptTypeArguments: $FlowFixMe = {
      type: 'TSTypeParameterInstantiation',
      params: [],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if typeScriptTypeArguments params type is not TSTypeReference', () => {
    const typeScriptTypeArguments = {
      type: 'TSTypeParameterInstantiation',
      params: [
        {
          type: '',
          typeName: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if typeScriptTypeArguments params typeName name is not Spec', () => {
    const typeScriptTypeArguments = {
      type: 'TSTypeParameterInstantiation',
      params: [
        {
          type: 'TSTypeReference',
          typeName: {
            name: '',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('do not throw error if typeScriptTypeArguments are correct', () => {
    const typeScriptTypeArguments = {
      type: 'TSTypeParameterInstantiation',
      params: [
        {
          type: 'TSTypeReference',
          typeName: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).not.toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });
});

describe('throwIfIncorrectModuleRegistryCallArgument', () => {
  const nativeModuleName = 'moduleName';
  const methodName = 'methodName';

  it('throw error if callExpressionArg type is unsupported in Flow', () => {
    const callExpressionArg = {type: 'NotLiteral'};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).toThrow(IncorrectModuleRegistryCallArgumentTypeParserError);
  });

  it("don't throw error if callExpressionArg type is `Literal` in Flow", () => {
    const callExpressionArg = {type: 'Literal', value: 'ValidModuleName'};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).not.toThrow(IncorrectModuleRegistryCallArgumentTypeParserError);
  });

  it('throw error if callExpressionArg type is unsupported in TypeScript', () => {
    const callExpressionArg = {type: 'NotStringLiteral'};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).toThrow(IncorrectModuleRegistryCallArgumentTypeParserError);
  });

  it("don't throw error if callExpressionArg type is `StringLiteral` in TypeScript", () => {
    const callExpressionArg = {type: 'StringLiteral', value: 'ValidModuleName'};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).not.toThrow(IncorrectModuleRegistryCallArgumentTypeParserError);
  });

  it('throw error if callExpressionArg value contains double quotes', () => {
    const callExpressionArg = {
      type: 'StringLiteral',
      value:
        'Malicious"; static { System.exit(1); } public static final String IGNORE = "',
    };
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).toThrow(IncorrectModuleRegistryCallArgumentValueParserError);
  });

  it('throw error if callExpressionArg value contains newlines', () => {
    const callExpressionArg = {
      type: 'StringLiteral',
      value: 'Malicious\nCode',
    };
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).toThrow(IncorrectModuleRegistryCallArgumentValueParserError);
  });

  it('throw error if callExpressionArg value contains spaces', () => {
    const callExpressionArg = {type: 'StringLiteral', value: 'has spaces'};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).toThrow(IncorrectModuleRegistryCallArgumentValueParserError);
  });

  it('throw error if callExpressionArg value contains special characters', () => {
    const callExpressionArg = {type: 'StringLiteral', value: 'Module;Drop'};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).toThrow(IncorrectModuleRegistryCallArgumentValueParserError);
  });

  it('throw error if callExpressionArg value is empty string', () => {
    const callExpressionArg = {type: 'StringLiteral', value: ''};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).toThrow(IncorrectModuleRegistryCallArgumentValueParserError);
  });

  it('throw error if callExpressionArg value starts with a number', () => {
    const callExpressionArg = {type: 'StringLiteral', value: '1Module'};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).toThrow(IncorrectModuleRegistryCallArgumentValueParserError);
  });

  it("don't throw error for valid module name with underscores", () => {
    const callExpressionArg = {type: 'StringLiteral', value: 'My_Module_123'};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).not.toThrow();
  });

  it("don't throw error for valid module name starting with underscore", () => {
    const callExpressionArg = {type: 'StringLiteral', value: '_PrivateModule'};
    expect(() => {
      throwIfIncorrectModuleRegistryCallArgument(
        nativeModuleName,
        callExpressionArg,
        methodName,
      );
    }).not.toThrow();
  });
});

describe('throwIfUntypedModule', () => {
  const hasteModuleName = 'moduleName';
  const methodName = 'methodName';
  const moduleName = 'moduleName';
  const callExpressions: Array<$FlowFixMe> = [];

  it('should throw error if module does not have a type', () => {
    const typeArguments = null;
    expect(() =>
      throwIfUntypedModule(
        typeArguments,
        hasteModuleName,
        callExpressions,
        methodName,
        moduleName,
      ),
    ).toThrowError(UntypedModuleRegistryCallParserError);
  });

  it('should not throw error if module have a type', () => {
    const typeArguments: $FlowFixMe = {
      type: 'TSTypeParameterInstantiations',
      params: [],
    };

    expect(() =>
      throwIfUntypedModule(
        typeArguments,
        hasteModuleName,
        callExpressions,
        methodName,
        moduleName,
      ),
    ).not.toThrowError(UntypedModuleRegistryCallParserError);
  });
});

describe('throwIfModuleTypeIsUnsupported', () => {
  const hasteModuleName = 'moduleName';
  const property = {value: 'value', key: {name: 'name'}};
  const flowParser = new FlowParser();
  const typescriptParser = new TypeScriptParser();

  it("don't throw error if module type is FunctionTypeAnnotation in Flow", () => {
    const value = {type: 'FunctionTypeAnnotation'};

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        flowParser,
      );
    }).not.toThrow(UnsupportedModulePropertyParserError);
  });
  it('throw error if module type is unsupported in Flow', () => {
    const value = {type: ''};

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        flowParser,
      );
    }).toThrow(UnsupportedModulePropertyParserError);
  });
  it("don't throw error if module type is TSFunctionType in TypeScript", () => {
    const value = {type: 'TSFunctionType'};

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        typescriptParser,
      );
    }).not.toThrow(UnsupportedModulePropertyParserError);
  });
  it("don't throw error if module type is TSMethodSignature in TypeScript", () => {
    const value = {type: 'TSMethodSignature'};

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        typescriptParser,
      );
    }).not.toThrow(UnsupportedModulePropertyParserError);
  });
  it('throw error if module type is unsupported in TypeScript', () => {
    const value = {type: ''};

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        typescriptParser,
      );
    }).toThrow(UnsupportedModulePropertyParserError);
  });
});

describe('throwIfMoreThanOneModuleInterfaceParserError', () => {
  it("don't throw error if module specs length is <= 1", () => {
    const nativeModuleName = 'moduleName';
    const moduleSpecs: ReadonlyArray<$FlowFixMe> = [];
    const parserType = 'Flow';

    expect(() => {
      throwIfMoreThanOneModuleInterfaceParserError(
        nativeModuleName,
        moduleSpecs,
        parserType,
      );
    }).not.toThrow(MoreThanOneModuleInterfaceParserError);
  });
  it('throw error if module specs is > 1 ', () => {
    const nativeModuleName = 'moduleName';
    const moduleSpecs = [{id: {name: 'Name-1'}}, {id: {name: 'Name-2'}}];
    const parserType = 'TypeScript';

    expect(() => {
      throwIfMoreThanOneModuleInterfaceParserError(
        nativeModuleName,
        moduleSpecs,
        parserType,
      );
    }).toThrow(MoreThanOneModuleInterfaceParserError);
  });
});

describe('throwIfUnsupportedFunctionParamTypeAnnotationParserError', () => {
  const nativeModuleName = 'moduleName';
  const languageParamTypeAnnotation = {type: 'VoidTypeAnnotation'};
  const paramName = 'paramName';
  it('throws an UnsupportedFunctionParamTypeAnnotationParserError', () => {
    const paramTypeAnnotationType = 'VoidTypeAnnotation';
    expect(() => {
      throwIfUnsupportedFunctionParamTypeAnnotationParserError(
        nativeModuleName,
        languageParamTypeAnnotation,
        paramName,
        paramTypeAnnotationType,
      );
    }).toThrow(UnsupportedFunctionParamTypeAnnotationParserError);
  });
});

describe('throwIfArrayElementTypeAnnotationIsUnsupported', () => {
  const {
    UnsupportedArrayElementTypeAnnotationParserError,
  } = require('../errors.js');
  const moduleName = 'moduleName';

  it('throws the error if it is the type is void type annotation', () => {
    expect(() => {
      throwIfArrayElementTypeAnnotationIsUnsupported(
        moduleName,
        undefined,
        'Array',
        'VoidTypeAnnotation',
      );
    }).toThrow(UnsupportedArrayElementTypeAnnotationParserError);
  });

  it('throws the error if it is the type is promise type annotation', () => {
    expect(() => {
      throwIfArrayElementTypeAnnotationIsUnsupported(
        moduleName,
        undefined,
        'Array',
        'PromiseTypeAnnotation',
      );
    }).toThrow(UnsupportedArrayElementTypeAnnotationParserError);
  });

  it('throws the error if it is the type is function type annotation', () => {
    expect(() => {
      throwIfArrayElementTypeAnnotationIsUnsupported(
        moduleName,
        undefined,
        'Array',
        'FunctionTypeAnnotation',
      );
    }).toThrow(UnsupportedArrayElementTypeAnnotationParserError);
  });

  it('does not throw the error if the type is NativeModuleTypeAnnotation', () => {
    expect(() => {
      throwIfArrayElementTypeAnnotationIsUnsupported(
        moduleName,
        undefined,
        'Array',
        'StringTypeAnnotation',
      );
    }).not.toThrow(UnsupportedArrayElementTypeAnnotationParserError);
  });
});

describe('throwIfPartialNotAnnotatingTypeParameter', () => {
  const flowParser = new FlowParser();
  const typescriptParser = new TypeScriptParser();
  const typerscriptTypeAnnotation = {
    typeParameters: {
      params: [
        {
          typeName: {
            name: 'TypeDeclaration',
          },
        },
      ],
    },
  };
  const flowTypeAnnotation = {
    typeParameters: {
      params: [
        {
          id: {
            name: 'TypeDeclaration',
          },
        },
      ],
    },
  };

  it('throw error if Partial Not Annotating Type Parameter in Flow', () => {
    const types = {};

    expect(() => {
      throwIfPartialNotAnnotatingTypeParameter(
        flowTypeAnnotation,
        types,
        flowParser,
      );
    }).toThrowError('Partials only support annotating a type parameter.');
  });

  it('throw error if Partial Not Annotating Type Parameter in TypeScript', () => {
    const types = {};

    expect(() => {
      throwIfPartialNotAnnotatingTypeParameter(
        typerscriptTypeAnnotation,
        types,
        typescriptParser,
      );
    }).toThrowError('Partials only support annotating a type parameter.');
  });

  it('does not throw error if Partial Annotating Type Parameter in Flow', () => {
    const types = {TypeDeclaration: {}};

    expect(() => {
      throwIfPartialNotAnnotatingTypeParameter(
        flowTypeAnnotation,
        types,
        flowParser,
      );
    }).not.toThrowError();
  });

  it('does not throw error if Partial Annotating Type Parameter in TypeScript', () => {
    const types = {TypeDeclaration: {}};

    expect(() => {
      throwIfPartialNotAnnotatingTypeParameter(
        typerscriptTypeAnnotation,
        types,
        typescriptParser,
      );
    }).not.toThrowError();
  });
});

describe('throwIfPartialWithMoreParameter', () => {
  it('throw error if Partial does not have exactly one parameter', () => {
    const typeAnnotation = {
      type: '',
      typeParameters: {params: [{}, {}]},
    };
    expect(() => {
      throwIfPartialWithMoreParameter(typeAnnotation);
    }).toThrowError('Partials only support annotating exactly one parameter.');
  });

  it('does not throw error if Partial has exactly one parameter', () => {
    const typeAnnotation = {
      type: '',
      typeParameters: {params: [{}]},
    };

    expect(() => {
      throwIfPartialWithMoreParameter(typeAnnotation);
    }).not.toThrowError();
  });
});

describe('throwIfMoreThanOneCodegenNativecommands', () => {
  it('throws an error if given more than one codegenNativeCommands', () => {
    const commandsTypeNames = [
      {
        commandTypeName: '',
        commandOptionsExpression: {},
      },
      {
        commandTypeName: '',
        commandOptionsExpression: {},
      },
    ];
    expect(() => {
      throwIfMoreThanOneCodegenNativecommands(commandsTypeNames);
    }).toThrowError('codegenNativeCommands may only be called once in a file');
  });

  it('does not throw an error if given exactly one codegenNativeCommand', () => {
    const commandsTypeNames = [
      {
        commandTypeName: '',
        commandOptionsExpression: {},
      },
    ];
    expect(() => {
      throwIfMoreThanOneCodegenNativecommands(commandsTypeNames);
    }).not.toThrow();
  });
});

describe('throwIfConfigNotfound', () => {
  it('throws an error if config is not found', () => {
    const configs: Array<{[string]: string}> = [];
    expect(() => {
      throwIfConfigNotfound(configs);
    }).toThrowError('Could not find component config for native component');
  });

  it('does not throw an error if config contains some elements', () => {
    const configs: Array<{[string]: string}> = [
      {
        propsTypeName: 'testPropsTypeName',
        componentName: 'testComponentName',
      },
    ];
    expect(() => {
      throwIfConfigNotfound(configs);
    }).not.toThrow();
  });
});

describe('throwIfMoreThanOneConfig', () => {
  it('throws an error if config is not found', () => {
    const configs: Array<{[string]: string}> = [
      {
        propsTypeName: 'testPropsTypeName1',
        componentName: 'testComponentName1',
      },
      {
        propsTypeName: 'testPropsTypeName2',
        componentName: 'testComponentName2',
      },
    ];
    expect(() => {
      throwIfMoreThanOneConfig(configs);
    }).toThrowError('Only one component is supported per file');
  });

  it('does not throw an error if config contains some elements', () => {
    const configs: Array<{[string]: string}> = [
      {
        propsTypeName: 'testPropsTypeName',
        componentName: 'testComponentName',
      },
    ];
    expect(() => {
      throwIfMoreThanOneConfig(configs);
    }).not.toThrow();
  });
});

describe('throwIfEventHasNoName', () => {
  const flowParser = new FlowParser();
  const typescriptParser = new TypeScriptParser();

  it('throws an error if typeAnnotation of event have no name in Flow', () => {
    const typeAnnotation = {};
    expect(() => {
      throwIfEventHasNoName(typeAnnotation, flowParser);
    }).toThrowError(`typeAnnotation of event doesn't have a name`);
  });

  it('does not throw an error if typeAnnotation of event have a name in Flow', () => {
    const typeAnnotation = {
      id: {
        name: 'BubblingEventHandler',
      },
    };

    expect(() => {
      throwIfEventHasNoName(typeAnnotation, flowParser);
    }).not.toThrow();
  });

  it('throws an error if typeAnnotation of event have no name in TypeScript', () => {
    const typeAnnotation = {};

    expect(() => {
      throwIfEventHasNoName(typeAnnotation, typescriptParser);
    }).toThrowError(`typeAnnotation of event doesn't have a name`);
  });

  it('does not throw an error if typeAnnotation of event have a name in TypeScript', () => {
    const typeAnnotation = {
      typeName: {
        name: 'BubblingEventHandler',
      },
    };

    expect(() => {
      throwIfEventHasNoName(typeAnnotation, typescriptParser);
    }).not.toThrow();
  });
});

describe('throwIfBubblingTypeIsNull', () => {
  it('throw an error if unable to determine event bubbling type', () => {
    const bubblingType = null;
    const eventName = 'Event';

    expect(() => {
      throwIfBubblingTypeIsNull(bubblingType, eventName);
    }).toThrowError(
      `Unable to determine event bubbling type for "${eventName}"`,
    );
  });

  it('does not throw an error if able to determine event bubbling type', () => {
    const bubblingType = 'direct';
    const eventName = 'Event';

    expect(() => {
      throwIfBubblingTypeIsNull(bubblingType, eventName);
    }).not.toThrow();
  });
});

describe('throwIfArgumentPropsAreNull', () => {
  it('throws an error if unable to determine event arguments', () => {
    const argumentProps = null;
    const eventName = 'Event';

    expect(() => {
      throwIfArgumentPropsAreNull(argumentProps, eventName);
    }).toThrowError(`Unable to determine event arguments for "${eventName}"`);
  });

  it('does not throw an error if able to determine event arguments', () => {
    const argumentProps = [{}];
    const eventName = 'Event';

    expect(() => {
      throwIfArgumentPropsAreNull(argumentProps, eventName);
    }).not.toThrow();
  });
});

describe('throwIfTypeAliasIsNotInterface', () => {
  const flowParser = new FlowParser();
  const typescriptParser = new TypeScriptParser();

  it('throws an error if type argument for codegenNativeCommands is not an interface in Flow', () => {
    const typeAlias = {
      type: '',
    };
    expect(() => {
      throwIfTypeAliasIsNotInterface(typeAlias, flowParser);
    }).toThrowError(
      `The type argument for codegenNativeCommands must be an interface, received ${typeAlias.type}`,
    );
  });

  it('does not throw an error if type argument for codegenNativeCommands is an interface in Flow', () => {
    const typeAlias = {
      type: 'InterfaceDeclaration',
    };
    expect(() => {
      throwIfTypeAliasIsNotInterface(typeAlias, flowParser);
    }).not.toThrow();
  });

  it('throws an error if type argument for codegenNativeCommands is not an interface in Trypscript', () => {
    const typeAlias = {
      type: '',
    };
    expect(() => {
      throwIfTypeAliasIsNotInterface(typeAlias, typescriptParser);
    }).toThrowError(
      `The type argument for codegenNativeCommands must be an interface, received ${typeAlias.type}`,
    );
  });

  it('does not throw an error if type argument for codegenNativeCommands is an interface in Typescript', () => {
    const typeAlias = {
      type: 'TSInterfaceDeclaration',
    };
    expect(() => {
      throwIfTypeAliasIsNotInterface(typeAlias, typescriptParser);
    }).not.toThrow();
  });
});
