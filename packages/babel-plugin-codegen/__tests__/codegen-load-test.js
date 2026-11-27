/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

class ModuleNotFoundError extends Error {
  code: string = 'MODULE_NOT_FOUND';
}

function missingLibError(): Error {
  return new ModuleNotFoundError(
    "Cannot find module '@react-native/codegen/lib/parsers/flow/parser'",
  );
}

// Failure thrown by the virtual `lib/` mock; tests override it per case.
let mockLibLoadError: Error = missingLibError();

// `lib/` is gitignored build output and may not exist on disk, so it is
// mocked virtually for every test. This stays a top-level `jest.mock`
// because only it accepts the options argument under this repo's Flow libdef.
jest.mock(
  '@react-native/codegen/lib/parsers/flow/parser',
  () => {
    throw mockLibLoadError;
  },
  {virtual: true},
);

describe('codegen loading', () => {
  beforeEach(() => {
    mockLibLoadError = missingLibError();
  });

  it('throws an actionable error when @react-native/codegen is not built', () => {
    jest.isolateModules(() => {
      jest.doMock('@react-native/codegen/src/parsers/flow/parser', () => {
        throw new SyntaxError("Unexpected token '{'");
      });
      expect(() => {
        // $FlowFixMe[untyped-import] `../index.js` is `@noflow`.
        require('../index.js');
      }).toThrow(/never built.*yarn workspace @react-native\/codegen build/s);
    });
  });

  it('throws an actionable error when @react-native/codegen is not installed', () => {
    jest.isolateModules(() => {
      jest.doMock('@react-native/codegen/src/parsers/flow/parser', () => {
        throw new ModuleNotFoundError('Cannot find module');
      });
      expect(() => {
        // $FlowFixMe[untyped-import] `../index.js` is `@noflow`.
        require('../index.js');
      }).toThrow(/could not be found/);
    });
  });

  it('throws an actionable error when the built lib is broken', () => {
    jest.isolateModules(() => {
      mockLibLoadError = new SyntaxError("Unexpected token '{'");
      jest.doMock('@react-native/codegen/src/parsers/flow/parser', () => {
        throw new ModuleNotFoundError('Cannot find module');
      });
      expect(() => {
        // $FlowFixMe[untyped-import] `../index.js` is `@noflow`.
        require('../index.js');
      }).toThrow(/failed to load.*Rebuild/s);
    });
  });
});
