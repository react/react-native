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

const {ParserError} = require('../errors');
const {FlowParser} = require('../flow/parser');
const {TypeScriptParser} = require('../typescript/parser');
const {
  createParserErrorCapturer,
  extractNativeModuleName,
  getTypeArguments,
  verifyPlatforms,
  visit,
} = require('../utils.js');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('extractnativeModuleName', () => {
  it('return filename when it ends with .js', () => {
    const filename = '/some_folder/NativeModule.js';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ts', () => {
    const filename = '/some_folder/NativeModule.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .tsx', () => {
    const filename = '/some_folder/NativeModule.tsx';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .android.js', () => {
    const filename = '/some_folder/NativeModule.android.js';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .android.ts', () => {
    const filename = '/some_folder/NativeModule.android.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .android.tsx', () => {
    const filename = '/some_folder/NativeModule.android.tsx';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ios.js', () => {
    const filename = '/some_folder/NativeModule.ios.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ios.ts', () => {
    const filename = '/some_folder/NativeModule.ios.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ios.tsx', () => {
    const filename = '/some_folder/NativeModule.ios.tsx';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .windows.js', () => {
    const filename = '/some_folder/NativeModule.windows.js';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
});

describe('createParserErrorCapturer', () => {
  describe("when function doesn't throw", () => {
    it("returns result and doesn't change errors array", () => {
      const [errors, guard] = createParserErrorCapturer();
      const fn = () => 'result';

      const result = guard(fn);
      expect(result).toBe('result');
      expect(errors).toHaveLength(0);
    });
  });

  describe('when function throws a ParserError', () => {
    it('returns null and adds the error in errors array instead of throwing it', () => {
      const [errors, guard] = createParserErrorCapturer();
      const ErrorThrown = new ParserError(
        'moduleName',
        null,
        'Something went wrong :(',
      );
      const fn = () => {
        throw ErrorThrown;
      };

      const result = guard(fn);
      expect(result).toBe(null);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(ErrorThrown);
      expect(() => guard(fn)).not.toThrow();
    });
  });

  describe('when function throws another error', () => {
    it("throws the error and doesn't change errors array", () => {
      const [errors, guard] = createParserErrorCapturer();
      const errorMessage = 'Something else went wrong :(';
      const fn = () => {
        throw new Error(errorMessage);
      };

      expect(() => guard(fn)).toThrow(errorMessage);
      expect(errors).toHaveLength(0);
    });
  });
});

describe('verifyPlatforms', () => {
  it('exclude android given an iOS only module', () => {
    let result = verifyPlatforms(
      'NativeSampleTurboModule',
      'SampleTurboModuleIOS',
    );

    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['android']);

    result = verifyPlatforms('NativeSampleTurboModuleIOS', 'SampleTurboModule');
    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['android']);

    result = verifyPlatforms(
      'NativeSampleTurboModuleIOS',
      'SampleTurboModuleIOS',
    );
    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['android']);
  });

  it('exclude iOS given an android only module', () => {
    let result = verifyPlatforms(
      'NativeSampleTurboModule',
      'SampleTurboModuleAndroid',
    );

    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['iOS']);

    result = verifyPlatforms(
      'NativeSampleTurboModuleAndroid',
      'SampleTurboModule',
    );
    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['iOS']);

    result = verifyPlatforms(
      'NativeSampleTurboModuleAndroid',
      'SampleTurboModuleAndroid',
    );
    expect(result.cxxOnly).toBe(false);
    expect(result.excludedPlatforms).toEqual(['iOS']);
  });

  it('exclude iOS and android given a Cxx only module', () => {
    let result = verifyPlatforms(
      'NativeSampleTurboModule',
      'SampleTurboModuleCxx',
    );

    expect(result.cxxOnly).toBe(true);
    expect(result.excludedPlatforms).toEqual(['iOS', 'android']);

    result = verifyPlatforms('NativeSampleTurboModuleCxx', 'SampleTurboModule');
    expect(result.cxxOnly).toBe(true);
    expect(result.excludedPlatforms).toEqual(['iOS', 'android']);

    result = verifyPlatforms(
      'NativeSampleTurboModuleCxx',
      'SampleTurboModuleCxx',
    );
    expect(result.cxxOnly).toBe(true);
    expect(result.excludedPlatforms).toEqual(['iOS', 'android']);
  });
});

describe('visit', () => {
  describe('when the astNode is null', () => {
    it("doesn't call the visitor function", () => {
      const visitorFunction = jest.fn();
      const visitor: {[type: string]: (node: $FlowFixMe) => void} = {
        itemType: visitorFunction,
      };

      const astNode = null;

      visit(astNode, visitor);

      expect(visitorFunction).not.toHaveBeenCalled();
    });
  });

  describe('when the astNode is not an object', () => {
    it("doesn't call the visitor function", () => {
      const visitorFunction = jest.fn();
      const visitor: {[type: string]: (node: $FlowFixMe) => void} = {
        itemType: visitorFunction,
      };

      const astNode = 'astNode';

      visit(astNode, visitor);

      expect(visitorFunction).not.toHaveBeenCalled();
    });
  });

  describe('when the astNode is an object', () => {
    describe("when the astNode has a string type that doesn't exist in the visitor object", () => {
      it("doesn't call the visitor function", () => {
        const visitorFunction = jest.fn();
        const visitor: {[type: string]: (node: $FlowFixMe) => void} = {
          itemType: visitorFunction,
        };

        const astNode = {type: 'itemTypeNotInVisitor'};

        visit(astNode, visitor);

        expect(visitorFunction).not.toHaveBeenCalled();
      });
    });

    describe('when the astNode has a string type that exists in the visitor object', () => {
      it("doesn't call the visitor function", () => {
        const visitorFunction = jest.fn();
        const visitor: {[type: string]: (node: $FlowFixMe) => void} = {
          itemType: visitorFunction,
        };

        const astNode = {type: 'itemType'};

        visit(astNode, visitor);

        expect(visitorFunction).toHaveBeenCalledTimes(1);
      });
    });

    describe("when the astNode doesn't have a string type", () => {
      it('iterates on every values of the astNode', () => {
        const visitorFunction = jest.fn();
        const visitor: {[type: string]: (node: $FlowFixMe) => void} = {
          itemType1: visitorFunction,
          itemType2: visitorFunction,
        };

        const astNode = {
          firstChildNode: {type: 'itemType1'},
          secondChildNode: {type: 'itemType2'},
          thirdChildNode: {type: 'itemType3'},
        };

        visit(astNode, visitor);

        expect(visitorFunction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('when the astNode is an array', () => {
    it('iterates on every values of the astNode', () => {
      const visitorFunction = jest.fn();
      const visitor: {[type: string]: (node: $FlowFixMe) => void} = {
        itemType1: visitorFunction,
        itemType2: visitorFunction,
      };

      const astNode = [
        {type: 'itemType1'},
        {type: 'itemType2'},
        {type: 'itemType3'},
      ];

      visit(astNode, visitor);

      expect(visitorFunction).toHaveBeenCalledTimes(2);
    });
  });
});

describe('getTypeArguments', () => {
  const getAliasedType = (
    parser: FlowParser | TypeScriptParser,
    code: string,
  ) => {
    const declaration = parser.getAst(code).body[0];
    return declaration.right ?? declaration.typeAnnotation;
  };

  it('returns the type arguments of a parsed Flow generic type', () => {
    const typeArguments = getTypeArguments(
      getAliasedType(new FlowParser(), 'type T = Readonly<{a: string}>;'),
    );

    expect(typeArguments.type).toBe('TypeParameterInstantiation');
    expect(typeArguments.params.map(param => param.type)).toEqual([
      'ObjectTypeAnnotation',
    ]);
  });

  it('returns no type arguments for a parsed non-generic Flow type', () => {
    expect(
      getTypeArguments(getAliasedType(new FlowParser(), 'type T = Foo;')) ??
        null,
    ).toBeNull();
  });

  it('returns the type arguments of a parsed TypeScript generic type', () => {
    const typeArguments = getTypeArguments(
      getAliasedType(new TypeScriptParser(), 'type T = Readonly<{a: string}>;'),
    );

    expect(typeArguments.type).toBe('TSTypeParameterInstantiation');
    expect(typeArguments.params.map(param => param.type)).toEqual([
      'TSTypeLiteral',
    ]);
  });

  it('prefers typeArguments, including null, over typeParameters', () => {
    const typeParameters = {type: 'TypeParameterInstantiation', params: []};

    expect(getTypeArguments({typeArguments: null, typeParameters})).toBeNull();
    expect(getTypeArguments({typeParameters})).toBe(typeParameters);
  });
});
