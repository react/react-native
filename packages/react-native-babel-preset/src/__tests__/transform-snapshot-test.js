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

// $FlowExpectedError[untyped-import] - Preset is untyped
const preset = require('../index');
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = path.join(__dirname, '__fixtures__');
const OUTPUT_DIR = path.join(FIXTURES_DIR, 'output');
const INPUT_FILE = path.join(FIXTURES_DIR, 'kitchen-sink-input.js');

const MOCK_FILENAME = '/absolute/path/to/input.js';

const inputCode = fs.readFileSync(INPUT_FILE, 'utf-8');

const testConfigs = [
  {
    name: 'hermes-stable-dev',
    options: {
      dev: true,
      unstable_transformProfile: 'hermes-stable',
    },
    description: 'Hermes stable transform profile in development mode',
  },
  {
    name: 'hermes-stable-prod',
    options: {
      dev: false,
    },
    description: 'Hermes stable transform profile in production mode',
  },
  {
    name: 'hermes-legacy-dev',
    options: {
      dev: true,
      unstable_transformProfile: 'hermes-legacy',
    },
    description: 'Default transform profile in development mode',
  },
  {
    name: 'hermes-legacy-prod',
    options: {
      dev: false,
      unstable_transformProfile: 'hermes-legacy',
    },
    description: 'Default transform profile in production mode',
  },
  {
    name: 'hermes-canary-dev',
    options: {
      dev: true,
      unstable_transformProfile: 'hermes-canary',
    },
    description: 'Hermes canary transform profile in development mode',
  },
  {
    name: 'hermes-canary-prod',
    options: {
      dev: false,
      unstable_transformProfile: 'hermes-canary',
    },
    description: 'Hermes canary transform profile in production mode',
  },
  {
    name: 'no-import-export-transform',
    options: {
      dev: false,
      disableImportExportTransform: true,
    },
    description: 'With import/export transform disabled',
  },
  {
    name: 'hermes-stable-prod-no-import-export-transform',
    options: {
      dev: false,
      unstable_transformProfile: 'hermes-stable',
      disableImportExportTransform: true,
    },
    description:
      'Hermes stable transform profile in production mode with import/export transform disabled',
  },
  {
    name: 'with-babel-runtime-version',
    options: {
      dev: false,
      enableBabelRuntime: '7.25.0',
    },
    description: 'With specific babel runtime version',
  },
  {
    name: 'no-babel-runtime',
    options: {
      dev: false,
      enableBabelRuntime: false,
    },
    description: 'Without babel runtime helpers',
  },
  {
    name: 'hermes-stable-dev-preserve-class-private',
    options: {
      dev: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: {
        unstable_preserveClassPrivate: true,
      },
    },
    description:
      'Hermes stable transform profile in development mode with unstable_preserveClassPrivate enabled',
  },
  {
    name: 'hermes-stable-dev-preserve-async',
    options: {
      dev: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: {
        unstable_preserveAsync: true,
      },
    },
    description:
      'Hermes stable transform profile in development mode with unstable_preserveAsync enabled',
  },
  {
    name: 'hermes-stable-dev-preserve-block-scoping',
    options: {
      dev: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: {
        unstable_preserveBlockScoping: true,
      },
    },
    description:
      'Hermes stable transform profile in development mode with unstable_preserveBlockScoping enabled',
  },
  {
    name: 'hermes-stable-dev-preserve-destructuring',
    options: {
      dev: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: {
        unstable_preserveDestructuring: true,
      },
    },
    description:
      'Hermes stable transform profile in development mode with unstable_preserveDestructuring enabled',
  },
];

function transformCode(
  code: string,
  options: {[string]: unknown},
): string | null {
  const result = babel.transformSync(code, {
    babelrc: false,
    configFile: false,
    filename: MOCK_FILENAME,
    presets: [[preset, options]],
    sourceMaps: false,
    compact: false,
  });
  return result?.code ?? null;
}

function getSnapshotPath(configName: string): string {
  return path.join(OUTPUT_DIR, `${configName}.js`);
}

function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
  }
}

function makeHeader(description: string, options: {[string]: unknown}): string {
  return `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated
 * @noformat
 * @noflow
 * @nolint
 *
 * This is a snapshot of the transform output for testing purposes.
 * To update, run: js1 test transform-snapshot-test.js -u
 *
 * Transform configuration:
 *   - ${description}
 *   - Options: ${JSON.stringify(options)}
 */

`;
}

function validateCodeIsParseable(
  code: string,
  sourceType: 'module' | 'script' = 'script',
): boolean {
  try {
    babel.parseSync(code, {
      babelrc: false,
      configFile: false,
      filename: 'test.js',
      parserOpts: {
        sourceType,
      },
    });
    return true;
  } catch {
    return false;
  }
}

describe('react-native-babel-preset transform snapshots', () => {
  beforeAll(() => {
    ensureDirectoryExists(OUTPUT_DIR);
  });

  describe.each(testConfigs)(
    '$name ($description)',
    ({name, options, description}) => {
      const snapshotPath = getSnapshotPath(name);

      it('transforms the kitchen-sink input correctly', () => {
        const transformedCode = transformCode(inputCode, options);
        const header = makeHeader(description, options);
        const fullContent = header + (transformedCode ?? '');

        // Check if we're in update mode - this allows our snapshots to be
        // updated when Jest is run with -u in the usual way. Unfortunately
        // it's a private API.
        const isUpdateMode =
          // $FlowFixMe[prop-missing] - private API
          expect.getState().snapshotState._updateSnapshot === 'all';

        if (isUpdateMode) {
          fs.writeFileSync(snapshotPath, fullContent);
        }

        // Compare against file
        expect(fs.existsSync(snapshotPath)).toBe(true);
        const expectedContent = fs.readFileSync(snapshotPath, 'utf-8');
        expect(fullContent).toBe(expectedContent);
      });

      it('produces parseable JavaScript output', () => {
        const transformedCode = transformCode(inputCode, options);
        const sourceType =
          options.disableImportExportTransform === true ? 'module' : 'script';
        expect(validateCodeIsParseable(transformedCode ?? '', sourceType)).toBe(
          true,
        );
      });
    },
  );

  describe('specific feature transformations', () => {
    it('handles async generators', () => {
      const code = `
        async function* gen() {
          yield 1;
          await Promise.resolve();
          yield 2;
        }
      `;
      const result = transformCode(code, {dev: false});
      expect(result).toContain('_wrapAsyncGenerator');
    });

    it('handles optional chaining', () => {
      const code = `const x = obj?.a?.b?.c;`;
      const result = transformCode(code, {
        dev: true,
        unstable_transformProfile: 'hermes-stable',
      });
      expect(result).not.toContain('?.');
    });

    it('handles nullish coalescing', () => {
      const code = `const x = a ?? b;`;
      const result = transformCode(code, {
        dev: true,
        unstable_transformProfile: 'hermes-stable',
      });
      expect(result).not.toContain('??');
    });

    it('handles flow enums', () => {
      const code = `
        // @flow
        enum Status { Active, Inactive }
        const s: Status = Status.Active;
      `;
      const result = transformCode(code, {dev: false});
      expect(result).toContain('Status');
    });

    it('preserves classes with hermes-stable profile in prod', () => {
      const code = `
        class Animal {
          constructor(name) {
            this.name = name;
          }
          speak() {
            return this.name;
          }
        }
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-stable',
      });
      expect(result).toContain('class Animal');
    });

    it('transforms classes with default profile', () => {
      const code = `
        class Animal {
          constructor(name) {
            this.name = name;
          }
          speak() {
            return this.name;
          }
        }
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-legacy',
      });
      expect(result).not.toContain('class Animal');
    });

    it('does not transform classes with default profile', () => {
      const code = `
        class Animal {
          constructor(name) {
            this.name = name;
          }
          speak() {
            return this.name;
          }
        }
      `;
      const result = transformCode(code, {dev: false});
      expect(result).toContain('class Animal');
    });

    it('handles named capturing groups in regex', () => {
      const code = `const match = str.match(/(?<year>\\d{4})-(?<month>\\d{2})/);`;
      const result = transformCode(code, {dev: false});
      expect(result).toContain('_wrapRegExp');
    });

    it('handles destructuring with defaults', () => {
      const code = `const {a, b = 10, ...rest} = obj;`;
      const result = transformCode(code, {dev: false});
      expect(result).toContain('_objectWithoutProperties');
    });

    it('handles JSX transformation', () => {
      const code = `const el = <div className="test">Hello</div>;`;
      const result = transformCode(code, {dev: false});
      expect(result).toContain('jsx');
    });

    it('strips flow types', () => {
      const code = `
        // @flow
        type User = {name: string, age: number};
        function greet(user: User): string {
          return user.name;
        }
      `;
      const result = transformCode(code, {dev: false});
      expect(result).not.toContain(': User');
      expect(result).not.toContain(': string');
    });

    it('transforms export default from syntax', () => {
      const code = `export {default} from './module';`;
      const result = transformCode(code, {dev: false});
      expect(result).toContain('require');
    });

    it('preserves import/export with disableImportExportTransform', () => {
      const code = `
        import {foo} from './module';
        export const bar = foo;
      `;
      const result = transformCode(code, {
        dev: false,
        disableImportExportTransform: true,
      });
      expect(result).toContain('import');
      expect(result).toContain('export');
    });

    it('preserves private class fields with unstable_preserveClassPrivate', () => {
      const code = `
        class Counter {
          #count = 0;
          #privateMethod() { return this.#count; }
          increment() { this.#count++; }
        }
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-stable',
        customTransformOptions: {
          unstable_preserveClassPrivate: true,
        },
      });
      expect(result).toContain('#count');
      expect(result).toContain('#privateMethod');
    });

    it('transforms private class fields without unstable_preserveClassPrivate', () => {
      const code = `
        class Counter {
          #count = 0;
          #privateMethod() { return this.#count; }
          increment() { this.#count++; }
        }
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-stable',
      });
      expect(result).not.toContain('#count');
      expect(result).not.toContain('#privateMethod');
      expect(result).toContain('_classPrivateFieldLooseKey');
    });

    it('preserves async/await with unstable_preserveAsync', () => {
      const code = `
        async function fetchData() {
          const response = await fetch('/api');
          return response.json();
        }
        async function* asyncGen() {
          yield await Promise.resolve(1);
          yield await Promise.resolve(2);
        }
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-stable',
        customTransformOptions: {
          unstable_preserveAsync: true,
        },
      });
      expect(result).toContain('async function fetchData');
      expect(result).toContain('await fetch');
      expect(result).toContain('async function* asyncGen');
      expect(result).not.toContain('_asyncToGenerator');
      expect(result).not.toContain('_wrapAsyncGenerator');
    });

    it('transforms async/await without unstable_preserveAsync', () => {
      const code = `
        async function fetchData() {
          const response = await fetch('/api');
          return response.json();
        }
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-stable',
      });
      expect(result).toContain('_asyncToGenerator');
    });

    it('preserves block scoping with unstable_preserveBlockScoping', () => {
      const code = `
        let x = 1;
        const y = 2;
        {
          let x = 3;
          const z = 4;
        }
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-stable',
        customTransformOptions: {
          unstable_preserveBlockScoping: true,
        },
      });
      expect(result).toContain('let x = 1');
      expect(result).toContain('const y = 2');
      expect(result).toContain('let x = 3');
      expect(result).toContain('const z = 4');
    });

    it('transforms block scoping without unstable_preserveBlockScoping', () => {
      const code = `
        let x = 1;
        const y = 2;
        {
          let x = 3;
        }
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-stable',
      });
      expect(result).toContain('var ');
      expect(result).not.toContain('let ');
      expect(result).not.toContain('const ');
    });

    it('preserves destructuring with unstable_preserveDestructuring', () => {
      const code = `
        const {a, b, ...rest} = obj;
        const [x, y, z = 10] = arr;
        const {nested: {value}} = data;
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-stable',
        customTransformOptions: {
          unstable_preserveDestructuring: true,
        },
      });
      // Check that destructuring syntax is preserved (not transformed)
      expect(result).toContain('...rest');
      expect(result).toContain('z = 10');
      expect(result).toContain('nested:');
      expect(result).not.toContain('_objectWithoutProperties');
      expect(result).not.toContain('_slicedToArray');
    });

    it('transforms destructuring without unstable_preserveDestructuring', () => {
      const code = `
        const {a, b, ...rest} = obj;
      `;
      const result = transformCode(code, {
        dev: false,
        unstable_transformProfile: 'hermes-stable',
      });
      expect(result).toContain('_objectWithoutProperties');
    });
  });
});
