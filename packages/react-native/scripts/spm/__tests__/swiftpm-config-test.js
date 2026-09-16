/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

/**
 * `swiftpmConfig` in package.json is the declared home for a package's SwiftPM
 * settings. The `spm` block in react-native.config.js is the deprecated one:
 * still read, still honoured, and warned about once per file.
 */

const {readSwiftpmConfig, writeSwiftpmName} = require('../swiftpm-config');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let tmpRoot;
let roots = 0;

beforeAll(() => {
  tmpRoot = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'spm-swiftpm-config-'),
  );
});

afterAll(() => {
  fs.rmSync(tmpRoot, {recursive: true, force: true});
});

// A fresh root per case: the deprecation warning is remembered per config file.
function makeRoot(pkgJson) {
  const root = path.join(tmpRoot, `pkg-${roots++}`);
  fs.mkdirSync(root, {recursive: true});
  if (pkgJson != null) {
    fs.writeFileSync(
      path.join(root, 'package.json'),
      typeof pkgJson === 'string' ? pkgJson : JSON.stringify(pkgJson, null, 2),
    );
  }
  return root;
}

describe('readSwiftpmConfig', () => {
  it.each([
    ['name', 'RNSVG'],
    ['dependencies', ['react-native-worklets']],
    ['autolinkingPlugin', './spm-plugin.js'],
    ['scaffold', false],
    ['modules', [{name: 'MyModule', path: 'ios/MyModule'}]],
    ['denyPlugins', ['some-framework']],
  ])('reads swiftpmConfig.%s from package.json', (field, value) => {
    const root = makeRoot({name: 'lib', swiftpmConfig: {[field]: value}});
    expect(readSwiftpmConfig(root, null)?.[field]).toEqual(value);
  });

  it.each([
    ['no swiftpmConfig at all', {name: 'lib'}],
    ['no package.json', null],
    [
      'a swiftpmConfig that is not an object',
      {name: 'lib', swiftpmConfig: 'nope'},
    ],
    // An array's indices are not fields; treating it as one would report
    // "unknown keys (0, 1)" and let the writer spread indices into it.
    ['an array', {name: 'lib', swiftpmConfig: ['oops']}],
  ])('reads nothing from %s', (_label, pkgJson) => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(readSwiftpmConfig(makeRoot(pkgJson), null)).toBeNull();
      const message = warnSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(message).not.toMatch(/\bfields React Native does not know\b/);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('falls back to the package.json-free config when package.json is malformed', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot('{ not json');
      expect(readSwiftpmConfig(root, {spm: {name: 'RNSVG'}})?.name).toBe(
        'RNSVG',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('still honours the deprecated spm block', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({name: 'lib'});
      const config = readSwiftpmConfig(root, {
        spm: {name: 'RNSVG', dependencies: ['react-native-worklets']},
      });
      expect(config?.name).toBe('RNSVG');
      expect(config?.dependencies).toEqual(['react-native-worklets']);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('lets swiftpmConfig win field by field, keeping the fields it does not set', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({name: 'lib', swiftpmConfig: {name: 'RNSVG'}});
      const config = readSwiftpmConfig(root, {
        spm: {name: 'OldName', dependencies: ['react-native-worklets']},
      });
      expect(config?.name).toBe('RNSVG');
      expect(config?.dependencies).toEqual(['react-native-worklets']);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns once per config file, naming the fields and the new home', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({name: 'lib'});
      const rnConfig = {spm: {name: 'RNSVG', dependencies: ['other']}};
      readSwiftpmConfig(root, rnConfig);
      readSwiftpmConfig(root, rnConfig);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0].join(' ');
      expect(message).toContain(path.join(root, 'react-native.config.js'));
      expect(message).toContain('name');
      expect(message).toContain('dependencies');
      expect(message).toContain('swiftpmConfig');
      expect(message).toContain('package.json');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns per config file, not per package sharing a shape', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      readSwiftpmConfig(makeRoot({name: 'a'}), {spm: {name: 'A'}});
      readSwiftpmConfig(makeRoot({name: 'b'}), {spm: {name: 'B'}});
      expect(warnSpy).toHaveBeenCalledTimes(2);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('says nothing when only the new location is used', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({name: 'lib', swiftpmConfig: {name: 'RNSVG'}});
      expect(
        readSwiftpmConfig(root, {dependency: {platforms: {ios: {}}}}),
      ).toEqual({name: 'RNSVG'});
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('says nothing about an spm block with no SPM fields in it', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      readSwiftpmConfig(makeRoot({name: 'lib'}), {spm: {}});
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });
});

describe('readSwiftpmConfig (unknown keys)', () => {
  it('warns once per package.json, naming the keys it does not know', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({
        name: 'lib',
        swiftpmConfig: {name: 'RNSVG', dependancies: [], modulez: []},
      });
      readSwiftpmConfig(root, null);
      readSwiftpmConfig(root, null);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0].join(' ');
      expect(message).toContain(path.join(root, 'package.json'));
      expect(message).toContain('dependancies');
      expect(message).toContain('modulez');
      expect(message).not.toContain("'name'");
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('still reads the keys it does know', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({
        name: 'lib',
        swiftpmConfig: {name: 'RNSVG', dependancies: []},
      });
      expect(readSwiftpmConfig(root, null)?.name).toBe('RNSVG');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('says nothing when every key is known', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({
        name: 'lib',
        swiftpmConfig: {name: 'RNSVG', dependencies: [], scaffold: false},
      });
      readSwiftpmConfig(root, null);
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('says nothing about unknown keys in the deprecated block, which is going away', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({name: 'lib'});
      readSwiftpmConfig(root, {spm: {name: 'RNSVG', dependancies: []}});
      const message = warnSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(message).not.toContain('dependancies');
    } finally {
      warnSpy.mockRestore();
    }
  });
});

describe('readSwiftpmConfig (malformed swiftpmConfig)', () => {
  it('falls back to the deprecated block when swiftpmConfig is an array', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({name: 'lib', swiftpmConfig: ['oops']});
      expect(readSwiftpmConfig(root, {spm: {name: 'RNSVG'}})?.name).toBe(
        'RNSVG',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});

describe('writeSwiftpmName', () => {
  const read = root =>
    JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  it('creates swiftpmConfig when the package has none', () => {
    const root = makeRoot({name: 'react-native-svg', version: '1.0.0'});
    expect(writeSwiftpmName(root, 'RNSVG')).toBe('created');
    expect(read(root).swiftpmConfig).toEqual({name: 'RNSVG'});
  });

  it('inserts the name into an existing swiftpmConfig', () => {
    const root = makeRoot({
      name: 'react-native-svg',
      swiftpmConfig: {dependencies: ['react-native-worklets']},
    });
    expect(writeSwiftpmName(root, 'RNSVG')).toBe('inserted');
    expect(read(root).swiftpmConfig).toEqual({
      dependencies: ['react-native-worklets'],
      name: 'RNSVG',
    });
  });

  it('is a no-op when the same name is already there', () => {
    const root = makeRoot({name: 'lib', swiftpmConfig: {name: 'RNSVG'}});
    const before = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
    expect(writeSwiftpmName(root, 'RNSVG')).toBe('already-set');
    expect(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).toBe(
      before,
    );
  });

  it("leaves a different name alone and says so — the author's choice wins", () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({name: 'lib', swiftpmConfig: {name: 'MySvg'}});
      expect(writeSwiftpmName(root, 'RNSVG')).toBe('skipped');
      expect(read(root).swiftpmConfig.name).toBe('MySvg');
      const message = warnSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(message).toContain('MySvg');
      expect(message).toContain('RNSVG');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('refuses a name Swift cannot spell, without touching the file', () => {
    const root = makeRoot({name: 'lib'});
    const before = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
    expect(writeSwiftpmName(root, 'Some.Pod')).toBe('skipped');
    expect(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).toBe(
      before,
    );
  });

  it('skips a package with no package.json', () => {
    expect(writeSwiftpmName(makeRoot(null), 'RNSVG')).toBe('skipped');
  });

  it('never rewrites a swiftpmConfig that is not a settings object', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({name: 'lib', swiftpmConfig: ['oops']});
      const before = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
      expect(writeSwiftpmName(root, 'RNSVG')).toBe('skipped');
      expect(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).toBe(
        before,
      );
      expect(
        warnSpy.mock.calls.map(call => call.join(' ')).join('\n'),
      ).toContain('swiftpmConfig');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('writes nothing on a dry run', () => {
    const root = makeRoot({name: 'lib'});
    const before = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
    expect(writeSwiftpmName(root, 'RNSVG', {dryRun: true})).toBe('created');
    expect(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).toBe(
      before,
    );
  });

  it.each([
    ['two spaces', '{\n  "name": "lib"\n}\n', '  '],
    ['four spaces', '{\n    "name": "lib"\n}\n', '    '],
    ['tabs', '{\n\t"name": "lib"\n}\n', '\t'],
  ])('preserves %s of indentation', (_label, source, indent) => {
    const root = makeRoot(source);
    writeSwiftpmName(root, 'RNSVG');
    const written = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
    expect(written).toContain(`\n${indent}"swiftpmConfig": {`);
    expect(written).toContain(`\n${indent}${indent}"name": "RNSVG"`);
    expect(written.endsWith('\n')).toBe(true);
  });

  it('keeps the existing keys in the order the author wrote them', () => {
    const root = makeRoot({name: 'lib', version: '1.0.0', main: 'index.js'});
    writeSwiftpmName(root, 'RNSVG');
    expect(Object.keys(read(root))).toEqual([
      'name',
      'version',
      'main',
      'swiftpmConfig',
    ]);
  });

  it('reports a failed write instead of an outcome it did not achieve', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const root = makeRoot({name: 'lib', version: '1.0.0'});
    const before = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('ENOSPC: no space left on device');
    });
    try {
      expect(writeSwiftpmName(root, 'RNSVG')).toBe('failed');
    } finally {
      writeSpy.mockRestore();
      warnSpy.mockRestore();
    }
    expect(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).toBe(
      before,
    );
    // No half-written file left behind.
    expect(fs.readdirSync(root)).toEqual(['package.json']);
  });

  it('replaces the file atomically, so a reader never sees a partial one', () => {
    const root = makeRoot({name: 'lib', version: '1.0.0'});
    const pkgPath = path.join(root, 'package.json');
    const renames = [];
    const renameSpy = jest
      .spyOn(fs, 'renameSync')
      .mockImplementation((from, to) => {
        renames.push([from, to]);
        // Whatever was staged must already be complete JSON.
        expect(JSON.parse(fs.readFileSync(from, 'utf8')).swiftpmConfig).toEqual(
          {
            name: 'RNSVG',
          },
        );
        fs.rmSync(from);
      });
    try {
      writeSwiftpmName(root, 'RNSVG');
    } finally {
      renameSpy.mockRestore();
    }
    expect(renames).toHaveLength(1);
    expect(renames[0][1]).toBe(pkgPath);
    expect(renames[0][0]).not.toBe(pkgPath);
  });

  it('leaves a file with no trailing newline without one', () => {
    const root = makeRoot('{"name": "lib"}');
    writeSwiftpmName(root, 'RNSVG');
    expect(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8').endsWith('\n'),
    ).toBe(false);
  });
});
