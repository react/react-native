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

const {
  symlinkCodegenHeaders,
  symlinkHeadersFromPath,
  symlinkReactAppleHeaders,
  symlinkReactCommonHeaders,
  symlinkThirdPartyDependenciesHeaders,
} = require('../headers-utils');

// Mock all required modules
jest.mock('../utils');
jest.mock('../headers-mappings');
jest.mock('node:fs');
jest.mock('node:path');

describe('symlinkHeadersFromPath', () => {
  let mockUtils;
  let mockFs;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockUtils = require('../utils');
    mockFs = require('node:fs');
    mockPath = require('node:path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      const result = parts.join('/');
      return result === '' ? '.' : result;
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should create symlinks for found header files without preserving structure', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = [
      '/source/path/subdir/header1.h',
      '/source/path/header2.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/source/path/subdir/header1.h' ||
        filePath === '/source/path/header2.h'
      );
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(sourcePath, []);
    expect(mockUtils.setupSymlink).toHaveBeenCalledTimes(2);
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/subdir/header1.h',
      '/output/path/header1.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/header2.h',
      '/output/path/header2.h',
    );
    expect(result).toBe(2);
  });

  it('should preserve directory structure when preserveStructure is true', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = [
      '/source/path/subdir/header1.h',
      '/source/path/another/header2.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/source/path/subdir/header1.h' ||
        filePath === '/source/path/another/header2.h'
      );
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, true, []);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/subdir/header1.h',
      '/output/path/subdir/header1.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/another/header2.h',
      '/output/path/another/header2.h',
    );
    expect(result).toBe(2);
  });

  it('should exclude specified folders from find command', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const excludeFolders = ['node_modules', 'test'];

    mockUtils.listHeadersInFolder.mockReturnValue([]);

    // Execute
    symlinkHeadersFromPath(sourcePath, outputPath, false, excludeFolders);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      sourcePath,
      excludeFolders,
    );
  });

  it('should create destination directories if they do not exist', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = ['/source/path/subdir/header1.h'];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/subdir/header1.h';
    });

    // Execute
    symlinkHeadersFromPath(sourcePath, outputPath, true, []);

    // Assert - setupSymlink should be called, which internally handles directory creation
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/subdir/header1.h',
      '/output/path/subdir/header1.h',
    );
  });

  it('should remove existing symlink before creating new one', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = ['/source/path/header1.h'];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/header1.h'; // Only source file exists
    });

    // Execute
    symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert - setupSymlink should be called, which internally handles removing existing links
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/header1.h',
      '/output/path/header1.h',
    );
  });

  it('should skip non-existent source files', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = [
      '/source/path/header1.h',
      '/source/path/nonexistent.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/header1.h'; // Only header1.h exists
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledTimes(1);
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/header1.h',
      '/output/path/header1.h',
    );
    expect(result).toBe(1);
  });

  it('should handle empty find command output', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';

    mockUtils.listHeadersInFolder.mockReturnValue([]);

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle whitespace-only find command output', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';

    mockUtils.listHeadersInFolder.mockReturnValue([]);

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle listHeadersInFolder throwing an error', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const error = new Error('Command failed');

    mockUtils.listHeadersInFolder.mockImplementation(() => {
      throw error;
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to process headers from /source/path:',
      'Command failed',
    );
    expect(result).toBe(0);
  });

  it('should handle setupSymlink throwing an error', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = ['/source/path/header1.h'];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/header1.h';
    });
    mockUtils.setupSymlink.mockImplementation(() => {
      throw new Error('Link failed');
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to process headers from /source/path:',
      'Link failed',
    );
    expect(result).toBe(0);
  });
});

describe('symlinkCodegenHeaders', () => {
  let mockUtils;
  let mockFs;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockUtils = require('../utils');
    mockFs = require('node:fs');
    mockPath = require('node:path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      const result = parts.join('/');
      return result === '' ? '.' : result;
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should create symlinks for codegen headers with conditional directory structure', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const headerFiles = [
      `${reactCodegenPath}/ComponentDescriptors.h`,
      `${reactCodegenPath}/ModuleProvider.h`,
      `${reactCodegenPath}/react/renderer/components/MyComponent/ComponentDescriptors.h`,
      `${reactCodegenPath}/react/renderer/components/MyComponent/EventEmitter.h`,
    ];

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath.includes('ReactCodegen') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkCodegenHeaders(
      reactNativePath,
      iosAppPath,
      outputFolder,
    );

    // Assert
    expect(mockFs.existsSync).toHaveBeenCalledWith(reactCodegenPath);
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      reactCodegenPath,
      ['headers', 'tests'],
    );
    // Files with no subpath go to ReactCodegen folder
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${reactCodegenPath}/ComponentDescriptors.h`,
      '/output/folder/headers/ReactCodegen/ComponentDescriptors.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${reactCodegenPath}/ModuleProvider.h`,
      '/output/folder/headers/ReactCodegen/ModuleProvider.h',
    );
    // Files with subpaths preserve structure under headers/
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${reactCodegenPath}/react/renderer/components/MyComponent/ComponentDescriptors.h`,
      '/output/folder/headers/react/renderer/components/MyComponent/ComponentDescriptors.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${reactCodegenPath}/react/renderer/components/MyComponent/EventEmitter.h`,
      '/output/folder/headers/react/renderer/components/MyComponent/EventEmitter.h',
    );
    expect(result).toBe(4);
  });

  it('should warn and return 0 if ReactCodegen path does not exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return false; // ReactCodegen path doesn't exist
      return false;
    });

    // Execute
    const result = symlinkCodegenHeaders(
      reactNativePath,
      iosAppPath,
      outputFolder,
    );

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      `ReactCodegen path does not exist: ${reactCodegenPath}`,
    );
    expect(mockUtils.listHeadersInFolder).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should return 0 if no header files exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      return false;
    });
    mockUtils.listHeadersInFolder.mockReturnValue([]);

    // Execute
    const result = symlinkCodegenHeaders(
      reactNativePath,
      iosAppPath,
      outputFolder,
    );

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      reactCodegenPath,
      ['headers', 'tests'],
    );
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      'Created symlinks for 0 Codegen headers with conditional directory structure',
    );
    expect(result).toBe(0);
  });
});

describe('symlinkThirdPartyDependenciesHeaders', () => {
  let mockUtils;
  let mockFs;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockUtils = require('../utils');
    mockFs = require('node:fs');
    mockPath = require('node:path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      return parts.join('/');
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should create symlinks for third-party dependencies headers with preserved structure', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const headerFiles = [
      `${thirdPartyHeadersPath}/boost/boost.h`,
      `${thirdPartyHeadersPath}/glog/glog.h`,
      `${thirdPartyHeadersPath}/fmt/format.h`,
      `${thirdPartyHeadersPath}/folly/folly.hpp`,
    ];

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (
        filePath.includes('third-party') &&
        (filePath.endsWith('.h') || filePath.endsWith('.hpp'))
      )
        return true;
      return false;
    });
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockFs.existsSync).toHaveBeenCalledWith(thirdPartyHeadersPath);
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      thirdPartyHeadersPath,
      ['tests'],
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/boost/boost.h`,
      '/output/folder/headers/boost/boost.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/glog/glog.h`,
      '/output/folder/headers/glog/glog.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/fmt/format.h`,
      '/output/folder/headers/fmt/format.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/folly/folly.hpp`,
      '/output/folder/headers/folly/folly.hpp',
    );
    expect(result).toBe(4);
  });

  it('should use default folder name when folderName parameter is not provided', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const headerFiles = [`${thirdPartyHeadersPath}/boost/boost.h`];

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (filePath.includes('third-party') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute - without folderName parameter
    const result = symlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
    );

    // Assert - should use default 'headers' folder
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/boost/boost.h`,
      '/output/folder/headers/boost/boost.h',
    );
    expect(result).toBe(1);
  });

  it('should warn and return 0 if third-party headers path does not exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return false; // third-party headers path doesn't exist
      return false;
    });

    // Execute
    const result = symlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      `Third-party dependencies headers path does not exist: ${thirdPartyHeadersPath}`,
    );
    expect(mockUtils.listHeadersInFolder).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle setupSymlink throwing an error gracefully', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const headerFiles = [`${thirdPartyHeadersPath}/boost/boost.h`];

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (filePath.includes('third-party') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {
      throw new Error('Link failed');
    });

    // Execute and Assert - function should throw the error from setupSymlink
    expect(() => {
      symlinkThirdPartyDependenciesHeaders(
        reactNativePath,
        outputFolder,
        folderName,
      );
    }).toThrow('Link failed');
  });

  it('should handle both .h and .hpp files', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const headerFiles = [
      `${thirdPartyHeadersPath}/library1/header.h`,
      `${thirdPartyHeadersPath}/library2/header.hpp`,
    ];

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (
        filePath.includes('third-party') &&
        (filePath.endsWith('.h') || filePath.endsWith('.hpp'))
      )
        return true;
      return false;
    });
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      thirdPartyHeadersPath,
      ['tests'],
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/library1/header.h`,
      '/output/folder/headers/library1/header.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/library2/header.hpp`,
      '/output/folder/headers/library2/header.hpp',
    );
    expect(result).toBe(2);
  });
});

describe('symlinkReactAppleHeaders', () => {
  let mockUtils;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockUtils = require('../utils');
    mockPath = require('node:path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      return parts.join('/');
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });
    mockPath.sep = '/';

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should create symlinks for ReactApple headers with Exported folder structure', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/output/headers/RCTDeprecation/RCTDeprecation.h',
    );
    expect(result).toBe(1);
  });

  it('should handle empty header files from mapping', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';

    mockUtils.listHeadersInFolder.mockReturnValue([]);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle multiple header files in the same mapping', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTUtility.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledTimes(2);
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/output/headers/RCTDeprecation/RCTDeprecation.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTUtility.h',
      '/output/headers/RCTDeprecation/RCTUtility.h',
    );
    expect(result).toBe(2);
  });

  it('should handle setupSymlink throwing an error', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {
      throw new Error('Link failed');
    });

    // Execute and Assert - function throws the error from setupSymlink
    expect(() => {
      symlinkReactAppleHeaders(reactApplePath, headersOutput);
    }).toThrow('Link failed');
  });

  it('should work correctly with the symcoded mapping structure', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert - setupSymlink handles removing existing files and creating new ones internally
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/output/headers/RCTDeprecation/RCTDeprecation.h',
    );
    expect(result).toBe(1);
  });

  it('should handle listHeadersInFolder returning empty array', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';

    mockUtils.listHeadersInFolder.mockReturnValue([]);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle listHeadersInFolder throwing an error', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const error = new Error('Command failed');

    mockUtils.listHeadersInFolder.mockImplementation(() => {
      throw error;
    });

    // Execute and Assert - function throws the error from listHeadersInFolder
    expect(() => {
      symlinkReactAppleHeaders(reactApplePath, headersOutput);
    }).toThrow('Command failed');
  });

  it('should work correctly with single symcoded mapping', () => {
    // Setup - Test the specific mapping defined in the function
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert - Test the specific mapping that's symcoded
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/output/headers/RCTDeprecation/RCTDeprecation.h',
    );
    expect(result).toBe(1);
  });
});

describe('symlinkReactCommonHeaders', () => {
  let mockUtils;
  let mockReactCommonMappings;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockUtils = require('../utils');
    mockReactCommonMappings =
      require('../headers-mappings').reactCommonMappings;
    mockPath = require('node:path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      return parts.join('/');
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });
    mockPath.sep = '/';

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should use reactCommonMappings and create symlinks for mapped directories', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon': {
        destination: '/output/headers/ReactCommon',
        excludeFolders: ['tests'],
        preserveStructure: false,
      },
    };
    const headerFiles = [
      '/path/to/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/TurboModule.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockReactCommonMappings).toHaveBeenCalledWith(
      reactCommonPath,
      headersOutput,
    );
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/TurboModule.h',
      '/output/headers/ReactCommon/TurboModule.h',
    );
    expect(result).toBe(1);
  });

  it('should handle multiple mappings with different configurations', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
      '/path/to/ReactCommon/turbomodule/core': {
        destination: '/output/headers/ReactCommon',
        excludeFolders: ['tests'],
        preserveStructure: false,
      },
    };
    const headerFiles1 = [
      '/path/to/ReactCommon/react/renderer/core/Component.h',
    ];
    const headerFiles2 = [
      '/path/to/ReactCommon/turbomodule/core/TurboModule.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder
      .mockReturnValueOnce(headerFiles1)
      .mockReturnValueOnce(headerFiles2);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledTimes(2);
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/react/renderer/core/Component.h',
      '/output/headers/react/renderer/core/Component.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/turbomodule/core/TurboModule.h',
      '/output/headers/ReactCommon/TurboModule.h',
    );
    expect(result).toBe(2);
  });

  it('should handle empty mappings from reactCommonMappings', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {}; // Empty mappings

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockReactCommonMappings).toHaveBeenCalledWith(
      reactCommonPath,
      headersOutput,
    );
    expect(mockUtils.listHeadersInFolder).not.toHaveBeenCalled();
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle mapping with preserveStructure true', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
    };
    const headerFiles = [
      '/path/to/ReactCommon/react/renderer/core/subdir/Component.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/react/renderer/core/subdir/Component.h',
      '/output/headers/react/renderer/core/subdir/Component.h',
    );
    expect(result).toBe(1);
  });

  it('should handle mapping with preserveStructure false (flattened)', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/turbomodule/core': {
        destination: '/output/headers/ReactCommon',
        excludeFolders: ['tests'],
        preserveStructure: false,
      },
    };
    const headerFiles = [
      '/path/to/ReactCommon/turbomodule/core/subdir/TurboModule.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/turbomodule/core/subdir/TurboModule.h',
      '/output/headers/ReactCommon/TurboModule.h',
    );
    expect(result).toBe(1);
  });

  it('should handle listHeadersInFolder returning empty arrays for all mappings', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
      '/path/to/ReactCommon/turbomodule/core': {
        destination: '/output/headers/ReactCommon',
        excludeFolders: ['tests'],
        preserveStructure: false,
      },
    };

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue([]);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledTimes(2);
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle setupSymlink throwing an error', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
    };
    const headerFiles = [
      '/path/to/ReactCommon/react/renderer/core/Component.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {
      throw new Error('Setup failed');
    });

    // Execute and Assert - function should throw the error from setupSymlink
    expect(() => {
      symlinkReactCommonHeaders(reactCommonPath, headersOutput);
    }).toThrow('Setup failed');
  });

  it('should handle listHeadersInFolder throwing an error', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
    };

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockImplementation(() => {
      throw new Error('List failed');
    });

    // Execute and Assert - function should throw the error from listHeadersInFolder
    expect(() => {
      symlinkReactCommonHeaders(reactCommonPath, headersOutput);
    }).toThrow('List failed');
  });
});
