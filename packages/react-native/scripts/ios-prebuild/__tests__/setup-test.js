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

const {createHeaderLinker} = require('../setup');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('createHeaderLinker', () => {
  let tmp /*: string */ = '';
  let root /*: string */ = '';
  let linksFolder /*: string */ = '';
  let log /*: JestMockFn<[string], void> */ = jest.fn();
  let stage /*: (fromPath: string, includePath?: ?string) => void */ = () => {};

  // Each pass gets its own linker, the way a prebuild run does.
  const newPass = () => {
    log = jest.fn();
    return createHeaderLinker(root, linksFolder, log);
  };

  const write = (relPath /*: string */, contents /*: string */) => {
    const file = path.join(root, relPath);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, contents);
    return file;
  };

  const staged = (relPath /*: string */) => path.join(linksFolder, relPath);

  const linkedMessage = (fromPath /*: string */, includePath /*: string */) =>
    `Linked ${fromPath} → ${path.relative(root, staged(includePath))}`;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'header-links-test-'));
    root = path.join(tmp, 'source');
    linksFolder = path.join(tmp, 'headers');
    fs.mkdirSync(root, {recursive: true});
    fs.mkdirSync(linksFolder, {recursive: true});
    stage = newPass();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  it('hard links a header into the staging folder', () => {
    const source = write('React/Base/RCTUtils.h', '// original\n');

    stage('React/Base', 'React');

    expect(fs.readFileSync(staged('React/RCTUtils.h'), 'utf8')).toBe(
      '// original\n',
    );
    expect(fs.statSync(staged('React/RCTUtils.h')).ino).toBe(
      fs.statSync(source).ino,
    );
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(linkedMessage('React/Base', 'React'));
  });

  it('repairs a staged link whose source was replaced by a new inode', () => {
    write('React/Base/RCTUtils.h', '// june\n');
    stage('React/Base', 'React');

    // git checkout writes a new file and renames it over the old one, so the
    // source gets a new inode and the staged link keeps serving the old one.
    const replacement = path.join(tmp, 'RCTUtils.h.new');
    fs.writeFileSync(replacement, '// august\n');
    const source = path.join(root, 'React/Base/RCTUtils.h');
    fs.renameSync(replacement, source);

    stage = newPass();
    stage('React/Base', 'React');

    expect(fs.readFileSync(staged('React/RCTUtils.h'), 'utf8')).toBe(
      '// august\n',
    );
    expect(fs.statSync(staged('React/RCTUtils.h')).ino).toBe(
      fs.statSync(source).ino,
    );
    expect(log).toHaveBeenCalledWith(linkedMessage('React/Base', 'React'));
  });

  it('does not relink an up-to-date link on a later pass', () => {
    write('React/Base/RCTUtils.h', '// original\n');
    stage('React/Base', 'React');

    const linkSync = jest.spyOn(fs, 'linkSync');
    const unlinkSync = jest.spyOn(fs, 'unlinkSync');

    stage = newPass();
    stage('React/Base', 'React');

    expect(linkSync).not.toHaveBeenCalled();
    expect(unlinkSync).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('keeps the header staged first when two sources collide on one target', () => {
    const umbrella = write('callinvoker/React/CallInvoker.h', '// umbrella\n');
    write('callinvoker/ReactCommon/CallInvoker.h', '// interface\n');

    stage('callinvoker/React', 'ReactCommon');
    stage('callinvoker/ReactCommon', 'ReactCommon');

    expect(fs.readFileSync(staged('ReactCommon/CallInvoker.h'), 'utf8')).toBe(
      '// umbrella\n',
    );
    expect(fs.statSync(staged('ReactCommon/CallInvoker.h')).ino).toBe(
      fs.statSync(umbrella).ino,
    );
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      linkedMessage('callinvoker/React', 'ReactCommon'),
    );

    const linkSync = jest.spyOn(fs, 'linkSync');
    const unlinkSync = jest.spyOn(fs, 'unlinkSync');

    stage = newPass();
    stage('callinvoker/React', 'ReactCommon');
    stage('callinvoker/ReactCommon', 'ReactCommon');

    expect(linkSync).not.toHaveBeenCalled();
    expect(unlinkSync).not.toHaveBeenCalled();
    expect(fs.readFileSync(staged('ReactCommon/CallInvoker.h'), 'utf8')).toBe(
      '// umbrella\n',
    );
  });

  it('keeps the header visited first when one pass recurses into colliding siblings', () => {
    write('callinvoker/React/CallInvoker.h', '// umbrella\n');
    write('callinvoker/ReactCommon/CallInvoker.h', '// interface\n');

    // Read the traversal order rather than assume it: the invariant is that the
    // first sibling visited wins, not that a particular sibling wins.
    const [firstVisited] = fs
      .readdirSync(path.join(root, 'callinvoker'), {withFileTypes: true})
      .filter(dirent => dirent.isDirectory())
      .map(dirent => String(dirent.name));
    const winner = path.join(
      root,
      'callinvoker',
      firstVisited,
      'CallInvoker.h',
    );

    stage('callinvoker', 'ReactCommon');

    expect(fs.readFileSync(staged('ReactCommon/CallInvoker.h'), 'utf8')).toBe(
      fs.readFileSync(winner, 'utf8'),
    );
    expect(fs.statSync(staged('ReactCommon/CallInvoker.h')).ino).toBe(
      fs.statSync(winner).ino,
    );
  });

  it('replaces a staged symlink that points at the source file', () => {
    const source = write('React/Base/RCTUtils.h', '// original\n');
    fs.mkdirSync(staged('React'), {recursive: true});
    // A symlink resolves to the source inode but does not share it, so it would
    // not track in-place edits the way the staging tree assumes.
    fs.symlinkSync(source, staged('React/RCTUtils.h'));

    stage('React/Base', 'React');

    expect(fs.lstatSync(staged('React/RCTUtils.h')).isSymbolicLink()).toBe(
      false,
    );
    expect(fs.statSync(staged('React/RCTUtils.h')).ino).toBe(
      fs.statSync(source).ino,
    );
  });

  it('stages the remaining headers when one file fails to link', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    write('React/Base/RCTUtils.h', '');
    write('React/Base/RCTConversions.h', '');

    const unlinkable = staged('React/RCTUtils.h');
    const realLinkSync = fs.linkSync;
    jest.spyOn(fs, 'linkSync').mockImplementation((sourceFile, targetFile) => {
      if (targetFile === unlinkable) {
        throw new Error('Operation not permitted');
      }
      realLinkSync(sourceFile, targetFile);
    });

    expect(() => stage('React/Base', 'React')).not.toThrow();

    expect(fs.readdirSync(staged('React'))).toEqual(['RCTConversions.h']);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to create link for`),
    );
  });

  it('replaces a staged copy that does not share the source inode', () => {
    const source = write('React/Base/RCTUtils.h', '// original\n');
    fs.mkdirSync(staged('React'), {recursive: true});
    fs.writeFileSync(staged('React/RCTUtils.h'), '// a copy, not a link\n');

    stage('React/Base', 'React');

    expect(fs.statSync(staged('React/RCTUtils.h')).ino).toBe(
      fs.statSync(source).ino,
    );
  });

  it('replaces a staged symlink instead of following it', () => {
    const source = write('React/Base/RCTUtils.h', '// original\n');
    const elsewhere = write('elsewhere/RCTUtils.h', '// elsewhere\n');
    fs.mkdirSync(staged('React'), {recursive: true});
    fs.symlinkSync(elsewhere, staged('React/RCTUtils.h'));

    stage('React/Base', 'React');

    expect(fs.lstatSync(staged('React/RCTUtils.h')).isSymbolicLink()).toBe(
      false,
    );
    expect(fs.statSync(staged('React/RCTUtils.h')).ino).toBe(
      fs.statSync(source).ino,
    );
    expect(fs.readFileSync(elsewhere, 'utf8')).toBe('// elsewhere\n');
  });

  it('stages only header files', () => {
    write('React/Base/RCTUtils.h', '');
    write('React/Base/RCTConversions.hpp', '');
    write('React/Base/RCTUtils.m', '');
    write('React/Base/RCTUtils.cpp', '');
    write('React/Base/BUCK.txt', '');

    stage('React/Base', 'React');

    expect(fs.readdirSync(staged('React')).sort()).toEqual([
      'RCTConversions.hpp',
      'RCTUtils.h',
    ]);
  });

  it('skips files of a folder without headers but still recurses into it', () => {
    write('React/README.md', '');
    write('React/Base/RCTUtils.h', '');

    stage('React', 'React');

    expect(fs.readdirSync(staged('React'))).toEqual(['RCTUtils.h']);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(linkedMessage('React/Base', 'React'));
  });

  it('does not log a pass that staged nothing', () => {
    write('React/Base/README.md', '');

    stage('React/Base', 'React');

    expect(log).not.toHaveBeenCalled();
  });

  it('flattens nested subfolders under the same include path', () => {
    write('React/Base/RCTUtils.h', '');
    write('React/Base/Surface/RCTSurface.h', '');

    stage('React/Base', 'React');

    expect(fs.readdirSync(staged('React')).sort()).toEqual([
      'RCTSurface.h',
      'RCTUtils.h',
    ]);
  });

  it.each(['__tests__', 'tests', 'platform'])(
    'does not stage headers from a %s subfolder',
    folder => {
      write('React/Base/RCTUtils.h', '');
      write(`React/Base/${folder}/RCTUtilsTests.h`, '');

      stage('React/Base', 'React');

      expect(fs.readdirSync(staged('React'))).toEqual(['RCTUtils.h']);
    },
  );
});
