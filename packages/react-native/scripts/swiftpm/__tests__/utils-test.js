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

const {listHeadersInFolder, setupSymlink} = require('../utils');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('setupSymlink', () => {
  let tempDir;
  let sourceFile;
  let destFile;
  let destDir;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'utils-test-'));
    sourceFile = path.join(tempDir, 'source.txt');
    destDir = path.join(tempDir, 'dest', 'subdir');
    destFile = path.join(destDir, 'dest.txt');

    // Create a source file
    fs.writeFileSync(sourceFile, 'test content');
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  it('should create destination directory if it does not exist', () => {
    expect(fs.existsSync(destDir)).toBe(false);

    setupSymlink(sourceFile, destFile);

    expect(fs.existsSync(destDir)).toBe(true);
  });

  it('should create symlink when source file exists', () => {
    setupSymlink(sourceFile, destFile);

    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('test content');
  });

  it('should remove existing symlink before creating new one', () => {
    // Create initial symlink
    fs.mkdirSync(destDir, {recursive: true});
    fs.symlinkSync(sourceFile, destFile);
    expect(fs.existsSync(destFile)).toBe(true);

    // Create another source file
    const newSourceFile = path.join(tempDir, 'newsource.txt');
    fs.writeFileSync(newSourceFile, 'new content');

    // Setup symlink should remove the old one and create new one
    setupSymlink(newSourceFile, destFile);

    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('new content');
  });

  it('should remove existing regular file before creating symlink', () => {
    // Create destination directory and regular file
    fs.mkdirSync(destDir, {recursive: true});
    fs.writeFileSync(destFile, 'regular file content');
    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(false);

    setupSymlink(sourceFile, destFile);

    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('test content');
  });

  it('should not create symlink when source file does not exist', () => {
    const nonExistentSource = path.join(tempDir, 'nonexistent.txt');

    setupSymlink(nonExistentSource, destFile);

    expect(fs.existsSync(destDir)).toBe(true); // Directory should still be created
    expect(fs.existsSync(destFile)).toBe(false); // But no symlink should be created
  });

  it('should work when destination directory already exists', () => {
    // Pre-create destination directory
    fs.mkdirSync(destDir, {recursive: true});

    setupSymlink(sourceFile, destFile);

    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.lstatSync(destFile).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('test content');
  });
});

describe('listHeadersInFolder', () => {
  let tempDir;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'headers-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  it('should find both .h and .hpp header files', () => {
    // Create mixed header files
    fs.writeFileSync(path.join(tempDir, 'test1.h'), '// header file 1');
    fs.writeFileSync(path.join(tempDir, 'test2.hpp'), '// header file 2');
    fs.writeFileSync(path.join(tempDir, 'test3.h'), '// header file 3');

    const result = listHeadersInFolder(tempDir, []);

    expect(result).toHaveLength(3);
    expect(result).toContain(path.join(tempDir, 'test1.h'));
    expect(result).toContain(path.join(tempDir, 'test2.hpp'));
    expect(result).toContain(path.join(tempDir, 'test3.h'));
  });

  it('should find header files in subdirectories', () => {
    // Create subdirectories with header files
    const subDir1 = path.join(tempDir, 'subdir1');
    const subDir2 = path.join(tempDir, 'subdir2');
    fs.mkdirSync(subDir1, {recursive: true});
    fs.mkdirSync(subDir2, {recursive: true});

    fs.writeFileSync(path.join(tempDir, 'root.h'), '// root header');
    fs.writeFileSync(path.join(subDir1, 'sub1.h'), '// sub1 header');
    fs.writeFileSync(path.join(subDir2, 'sub2.hpp'), '// sub2 header');

    const result = listHeadersInFolder(tempDir, []);

    expect(result).toHaveLength(3);
    expect(result).toContain(path.join(tempDir, 'root.h'));
    expect(result).toContain(path.join(subDir1, 'sub1.h'));
    expect(result).toContain(path.join(subDir2, 'sub2.hpp'));
  });

  it('should exclude multiple specified subfolders', () => {
    // Create subdirectories
    const keepDir = path.join(tempDir, 'keep');
    const excludeDir1 = path.join(tempDir, 'exclude1');
    const excludeDir2 = path.join(tempDir, 'exclude2');
    fs.mkdirSync(keepDir, {recursive: true});
    fs.mkdirSync(excludeDir1, {recursive: true});
    fs.mkdirSync(excludeDir2, {recursive: true});

    // Create header files
    fs.writeFileSync(path.join(keepDir, 'keep.h'), '// keep header');
    fs.writeFileSync(
      path.join(excludeDir1, 'exclude1.h'),
      '// exclude1 header',
    );
    fs.writeFileSync(
      path.join(excludeDir2, 'exclude2.h'),
      '// exclude2 header',
    );

    const result = listHeadersInFolder(tempDir, ['exclude1', 'exclude2']);

    expect(result).toHaveLength(1);
    expect(result).toContain(path.join(keepDir, 'keep.h'));
    expect(result).not.toContain(path.join(excludeDir1, 'exclude1.h'));
    expect(result).not.toContain(path.join(excludeDir2, 'exclude2.h'));
  });

  it('should return empty array when no header files found', () => {
    // Create non-header files
    fs.writeFileSync(path.join(tempDir, 'test.txt'), 'text file');
    fs.writeFileSync(path.join(tempDir, 'test.js'), 'javascript file');

    const result = listHeadersInFolder(tempDir, []);

    expect(result).toHaveLength(0);
  });

  it('should handle empty folder', () => {
    const result = listHeadersInFolder(tempDir, []);

    expect(result).toHaveLength(0);
  });

  it('should handle nested exclusions correctly', () => {
    // Create nested directory structure
    const includeDir = path.join(tempDir, 'include');
    const excludeDir = path.join(tempDir, 'exclude');
    const nestedInclude = path.join(includeDir, 'nested');
    const nestedExclude = path.join(excludeDir, 'nested');

    fs.mkdirSync(nestedInclude, {recursive: true});
    fs.mkdirSync(nestedExclude, {recursive: true});

    // Create header files
    fs.writeFileSync(path.join(includeDir, 'include.h'), '// include header');
    fs.writeFileSync(
      path.join(nestedInclude, 'nested_include.h'),
      '// nested include header',
    );
    fs.writeFileSync(path.join(excludeDir, 'exclude.h'), '// exclude header');
    fs.writeFileSync(
      path.join(nestedExclude, 'nested_exclude.h'),
      '// nested exclude header',
    );

    const result = listHeadersInFolder(tempDir, ['exclude']);

    expect(result).toHaveLength(2);
    expect(result).toContain(path.join(includeDir, 'include.h'));
    expect(result).toContain(path.join(nestedInclude, 'nested_include.h'));
    expect(result).not.toContain(path.join(excludeDir, 'exclude.h'));
    expect(result).not.toContain(path.join(nestedExclude, 'nested_exclude.h'));
  });

  it('should throw error when folder does not exist', () => {
    const nonExistentFolder = path.join(tempDir, 'nonexistent');

    expect(() => {
      listHeadersInFolder(nonExistentFolder, []);
    }).toThrow();
  });
});
