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
  configureAppForSwift,
  createHardlinks,
  findXcodeProjectDirectory,
  generateCodegenArtifacts,
  prepareHeaders,
  runIosPrebuild,
  runPodDeintegrate,
  setBuildFromSource,
} = require('../prepare-app-utils');

// Mock child_process module
jest.mock('child_process');

// Mock fs module
jest.mock('fs');

// Mock headers-utils module
jest.mock('../headers-utils');

// Mock prepare-app-dependencies-headers module
jest.mock('../prepare-app-dependencies-headers');

// Mock codegen executor module
jest.mock('../../codegen/generate-artifacts-executor');

// Mock path module for absolute paths
jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    join: jest.fn((...args) => args.join('/')),
    relative: jest.fn((from, to) => to.replace(from + '/', '')),
  };
});

describe('createHardlinks', () => {
  let mockSymlinkReactNativeHeaders;
  let mockSymlinkThirdPartyDependenciesHeaders;
  let mockPath;
  let mockConsoleLog;

  beforeEach(() => {
    // Setup mocks
    const headersUtils = require('../headers-utils');
    const prepareAppDependenciesHeaders = require('../prepare-app-dependencies-headers');

    mockSymlinkReactNativeHeaders =
      prepareAppDependenciesHeaders.symlinkReactNativeHeaders;
    mockSymlinkThirdPartyDependenciesHeaders =
      headersUtils.symlinkThirdPartyDependenciesHeaders;

    mockPath = require('path');
    mockConsoleLog = console.log;

    // Clear and reset all mocks completely
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Set up fresh mock implementations
    mockSymlinkReactNativeHeaders.mockImplementation(() => {});
    mockSymlinkThirdPartyDependenciesHeaders.mockImplementation(() => {});

    // Mock path.join to return realistic paths
    mockPath.join.mockImplementation((...args) => args.join('/'));
  });

  it('should create hard links successfully', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    mockSymlinkReactNativeHeaders.mockImplementation(() => {});
    mockSymlinkThirdPartyDependenciesHeaders.mockImplementation(() => {});

    // Execute
    await createHardlinks(reactNativePath);

    // Assert
    const expectedReactIncludesPath = '/path/to/react-native/React';

    expect(mockSymlinkReactNativeHeaders).toHaveBeenCalledWith(
      reactNativePath,
      expectedReactIncludesPath,
      'includes',
    );
    expect(mockSymlinkThirdPartyDependenciesHeaders).toHaveBeenCalledWith(
      reactNativePath,
      expectedReactIncludesPath,
      'includes',
    );

    expect(mockSymlinkReactNativeHeaders).toHaveBeenCalledTimes(1);
    expect(mockSymlinkThirdPartyDependenciesHeaders).toHaveBeenCalledTimes(1);

    // Verify console output
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Creating hard links for React Native headers...',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ React Native hard links created in React/includes',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Creating hard links for third-party dependencies...',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ Third-party dependencies hard links created in React/includes',
    );
  });

  it('should throw error when symlinkReactNativeHeaders fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const originalError = new Error('React Native headers linking failed');

    mockSymlinkReactNativeHeaders.mockImplementation(() => {
      throw originalError;
    });

    // Execute & Assert
    await expect(createHardlinks(reactNativePath)).rejects.toThrow(
      'Hard link creation failed: React Native headers linking failed',
    );

    const expectedReactIncludesPath = '/path/to/react-native/React';

    expect(mockSymlinkReactNativeHeaders).toHaveBeenCalledWith(
      reactNativePath,
      expectedReactIncludesPath,
      'includes',
    );
    expect(mockSymlinkThirdPartyDependenciesHeaders).not.toHaveBeenCalled();

    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Creating hard links for React Native headers...',
    );
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      '✓ React Native hard links created in React/includes',
    );
  });

  it('should throw error when symlinkThirdPartyDependenciesHeaders fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const originalError = new Error('Third-party dependencies linking failed');

    mockSymlinkReactNativeHeaders.mockImplementation(() => {});
    mockSymlinkThirdPartyDependenciesHeaders.mockImplementation(() => {
      throw originalError;
    });

    // Execute & Assert
    await expect(createHardlinks(reactNativePath)).rejects.toThrow(
      'Hard link creation failed: Third-party dependencies linking failed',
    );

    const expectedReactIncludesPath = '/path/to/react-native/React';

    expect(mockSymlinkReactNativeHeaders).toHaveBeenCalledWith(
      reactNativePath,
      expectedReactIncludesPath,
      'includes',
    );
    expect(mockSymlinkThirdPartyDependenciesHeaders).toHaveBeenCalledWith(
      reactNativePath,
      expectedReactIncludesPath,
      'includes',
    );

    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Creating hard links for React Native headers...',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ React Native hard links created in React/includes',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Creating hard links for third-party dependencies...',
    );
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      '✓ Third-party dependencies hard links created in React/includes',
    );
  });

  it('should handle different React Native paths correctly', async () => {
    // Setup
    const reactNativePath = '/Users/developer/custom-react-native-path';

    mockSymlinkReactNativeHeaders.mockImplementation(() => {});
    mockSymlinkThirdPartyDependenciesHeaders.mockImplementation(() => {});

    // Execute
    await createHardlinks(reactNativePath);

    // Assert
    const expectedReactIncludesPath =
      '/Users/developer/custom-react-native-path/React';

    expect(mockSymlinkReactNativeHeaders).toHaveBeenCalledWith(
      reactNativePath,
      expectedReactIncludesPath,
      'includes',
    );
    expect(mockSymlinkThirdPartyDependenciesHeaders).toHaveBeenCalledWith(
      reactNativePath,
      expectedReactIncludesPath,
      'includes',
    );
  });

  it('should handle paths with spaces correctly', async () => {
    // Setup
    const reactNativePath = '/path/to/react native project';

    mockSymlinkReactNativeHeaders.mockImplementation(() => {});
    mockSymlinkThirdPartyDependenciesHeaders.mockImplementation(() => {});

    // Execute
    await createHardlinks(reactNativePath);

    // Assert
    const expectedReactIncludesPath = '/path/to/react native project/React';

    expect(mockSymlinkReactNativeHeaders).toHaveBeenCalledWith(
      reactNativePath,
      expectedReactIncludesPath,
      'includes',
    );
    expect(mockSymlinkThirdPartyDependenciesHeaders).toHaveBeenCalledWith(
      reactNativePath,
      expectedReactIncludesPath,
      'includes',
    );
  });
});

describe('generateCodegenArtifacts', () => {
  let mockCodegenExecutor;
  let mockConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockCodegenExecutor = require('../../codegen/generate-artifacts-executor');
    mockConsoleLog = console.log;

    // Clear and reset all mocks completely
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Set up fresh mock implementations
    mockCodegenExecutor.execute = jest.fn();
  });

  it('should run codegen successfully', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const appPath = '/path/to/app';
    const appIosPath = '/path/to/app/ios';

    mockCodegenExecutor.execute.mockImplementation(() => {});

    // Execute
    await generateCodegenArtifacts(reactNativePath, appPath, appIosPath);

    // Assert
    expect(mockCodegenExecutor.execute).toHaveBeenCalledWith(
      appPath,
      'ios',
      appIosPath,
      'app',
    );
    expect(mockCodegenExecutor.execute).toHaveBeenCalledTimes(1);

    // Verify console output
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Generating codegen artifacts...',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ Codegen artifacts generated',
    );
  });

  it('should throw error when codegen execution fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const appPath = '/path/to/app';
    const appIosPath = '/path/to/app/ios';
    const originalError = new Error('Codegen failed to generate artifacts');

    mockCodegenExecutor.execute.mockImplementation(() => {
      throw originalError;
    });

    // Execute & Assert
    await expect(
      generateCodegenArtifacts(reactNativePath, appPath, appIosPath),
    ).rejects.toThrow(
      'Codegen generation failed: Codegen failed to generate artifacts',
    );

    expect(mockCodegenExecutor.execute).toHaveBeenCalledWith(
      appPath,
      'ios',
      appIosPath,
      'app',
    );
    expect(mockCodegenExecutor.execute).toHaveBeenCalledTimes(1);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Generating codegen artifacts...',
    );
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      '✓ Codegen artifacts generated',
    );
  });

  it('should handle different paths correctly', async () => {
    // Setup
    const reactNativePath = '/Users/developer/react-native';
    const appPath = '/Users/developer/MyApp';
    const appIosPath = '/Users/developer/MyApp/ios';

    mockCodegenExecutor.execute.mockImplementation(() => {});

    // Execute
    await generateCodegenArtifacts(reactNativePath, appPath, appIosPath);

    // Assert
    expect(mockCodegenExecutor.execute).toHaveBeenCalledWith(
      appPath,
      'ios',
      appIosPath,
      'app',
    );
  });

  it('should handle paths with spaces correctly', async () => {
    // Setup
    const reactNativePath = '/path/to/react native';
    const appPath = '/path/to/my app';
    const appIosPath = '/path/to/my app/ios folder';

    mockCodegenExecutor.execute.mockImplementation(() => {});

    // Execute
    await generateCodegenArtifacts(reactNativePath, appPath, appIosPath);

    // Assert
    expect(mockCodegenExecutor.execute).toHaveBeenCalledWith(
      appPath,
      'ios',
      appIosPath,
      'app',
    );
  });
});

describe('prepareHeaders', () => {
  let mockPrepareAppDependenciesHeaders;
  let mockPath;
  let mockConsoleLog;

  beforeEach(() => {
    // Setup mocks
    const prepareAppDependenciesHeadersModule = require('../prepare-app-dependencies-headers');
    mockPrepareAppDependenciesHeaders =
      prepareAppDependenciesHeadersModule.prepareAppDependenciesHeaders;

    mockPath = require('path');
    mockConsoleLog = console.log;

    // Clear and reset all mocks completely
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Set up fresh mock implementations
    mockPrepareAppDependenciesHeaders.mockImplementation(() => {});

    // Mock path.join to return realistic paths
    mockPath.join.mockImplementation((...args) => args.join('/'));
  });

  it('should prepare all three types of headers successfully', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const appIosPath = '/path/to/app/ios';

    mockPrepareAppDependenciesHeaders.mockImplementation(() => {});

    // Execute
    await prepareHeaders(reactNativePath, appIosPath);

    // Assert
    const expectedOutputFolder =
      '/path/to/app/ios/build/generated/ios/ReactAppDependencyProvider';
    const expectedCodegenOutputFolder =
      '/path/to/app/ios/build/generated/ios/ReactCodegen';

    // Verify all three calls with correct parameters
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenCalledTimes(3);

    // 1. Codegen headers
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      1,
      reactNativePath,
      appIosPath,
      expectedOutputFolder,
      'codegen',
    );

    // 2. React Native headers
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      2,
      reactNativePath,
      appIosPath,
      expectedCodegenOutputFolder,
      'react-native',
    );

    // 3. Third-party dependencies headers
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      3,
      reactNativePath,
      appIosPath,
      expectedCodegenOutputFolder,
      'third-party-dependencies',
    );

    // Verify console output
    expect(mockConsoleLog).toHaveBeenCalledWith('Preparing codegen headers...');
    expect(mockConsoleLog).toHaveBeenCalledWith('✓ Codegen headers prepared');
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Preparing react-native headers...',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ React Native headers prepared',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Preparing third-party dependencies headers...',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ Third-party dependencies headers prepared',
    );
  });

  it('should throw error when codegen header preparation fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const appIosPath = '/path/to/app/ios';
    const originalError = new Error('Codegen header preparation failed');

    mockPrepareAppDependenciesHeaders.mockImplementationOnce(() => {
      throw originalError;
    });

    // Execute & Assert
    await expect(prepareHeaders(reactNativePath, appIosPath)).rejects.toThrow(
      'Header preparation failed: Codegen header preparation failed',
    );

    const expectedOutputFolder =
      '/path/to/app/ios/build/generated/ios/ReactAppDependencyProvider';

    expect(mockPrepareAppDependenciesHeaders).toHaveBeenCalledTimes(1);
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenCalledWith(
      reactNativePath,
      appIosPath,
      expectedOutputFolder,
      'codegen',
    );

    expect(mockConsoleLog).toHaveBeenCalledWith('Preparing codegen headers...');
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      '✓ Codegen headers prepared',
    );
  });

  it('should throw error when react-native header preparation fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const appIosPath = '/path/to/app/ios';
    const originalError = new Error('React Native header preparation failed');

    mockPrepareAppDependenciesHeaders
      .mockImplementationOnce(() => {}) // First call succeeds
      .mockImplementationOnce(() => {
        // Second call fails
        throw originalError;
      });

    // Execute & Assert
    await expect(prepareHeaders(reactNativePath, appIosPath)).rejects.toThrow(
      'Header preparation failed: React Native header preparation failed',
    );

    const expectedOutputFolder =
      '/path/to/app/ios/build/generated/ios/ReactAppDependencyProvider';
    const expectedCodegenOutputFolder =
      '/path/to/app/ios/build/generated/ios/ReactCodegen';

    expect(mockPrepareAppDependenciesHeaders).toHaveBeenCalledTimes(2);
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      1,
      reactNativePath,
      appIosPath,
      expectedOutputFolder,
      'codegen',
    );
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      2,
      reactNativePath,
      appIosPath,
      expectedCodegenOutputFolder,
      'react-native',
    );

    expect(mockConsoleLog).toHaveBeenCalledWith('Preparing codegen headers...');
    expect(mockConsoleLog).toHaveBeenCalledWith('✓ Codegen headers prepared');
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Preparing react-native headers...',
    );
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      '✓ React Native headers prepared',
    );
  });

  it('should throw error when third-party dependencies header preparation fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const appIosPath = '/path/to/app/ios';
    const originalError = new Error(
      'Third-party dependencies header preparation failed',
    );

    mockPrepareAppDependenciesHeaders
      .mockImplementationOnce(() => {}) // First call succeeds
      .mockImplementationOnce(() => {}) // Second call succeeds
      .mockImplementationOnce(() => {
        // Third call fails
        throw originalError;
      });

    // Execute & Assert
    await expect(prepareHeaders(reactNativePath, appIosPath)).rejects.toThrow(
      'Header preparation failed: Third-party dependencies header preparation failed',
    );

    const expectedOutputFolder =
      '/path/to/app/ios/build/generated/ios/ReactAppDependencyProvider';
    const expectedCodegenOutputFolder =
      '/path/to/app/ios/build/generated/ios/ReactCodegen';

    expect(mockPrepareAppDependenciesHeaders).toHaveBeenCalledTimes(3);
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      1,
      reactNativePath,
      appIosPath,
      expectedOutputFolder,
      'codegen',
    );
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      2,
      reactNativePath,
      appIosPath,
      expectedCodegenOutputFolder,
      'react-native',
    );
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      3,
      reactNativePath,
      appIosPath,
      expectedCodegenOutputFolder,
      'third-party-dependencies',
    );

    expect(mockConsoleLog).toHaveBeenCalledWith('Preparing codegen headers...');
    expect(mockConsoleLog).toHaveBeenCalledWith('✓ Codegen headers prepared');
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Preparing react-native headers...',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ React Native headers prepared',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Preparing third-party dependencies headers...',
    );
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      '✓ Third-party dependencies headers prepared',
    );
  });

  it('should handle different paths correctly', async () => {
    // Setup
    const reactNativePath = '/Users/developer/react-native';
    const appIosPath = '/Users/developer/MyApp/ios';

    mockPrepareAppDependenciesHeaders.mockImplementation(() => {});

    // Execute
    await prepareHeaders(reactNativePath, appIosPath);

    // Assert
    const expectedOutputFolder =
      '/Users/developer/MyApp/ios/build/generated/ios/ReactAppDependencyProvider';
    const expectedCodegenOutputFolder =
      '/Users/developer/MyApp/ios/build/generated/ios/ReactCodegen';

    expect(mockPrepareAppDependenciesHeaders).toHaveBeenCalledTimes(3);

    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      1,
      reactNativePath,
      appIosPath,
      expectedOutputFolder,
      'codegen',
    );
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      2,
      reactNativePath,
      appIosPath,
      expectedCodegenOutputFolder,
      'react-native',
    );
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      3,
      reactNativePath,
      appIosPath,
      expectedCodegenOutputFolder,
      'third-party-dependencies',
    );
  });

  it('should handle paths with spaces correctly', async () => {
    // Setup
    const reactNativePath = '/path/to/react native';
    const appIosPath = '/path/to/my app/ios folder';

    mockPrepareAppDependenciesHeaders.mockImplementation(() => {});

    // Execute
    await prepareHeaders(reactNativePath, appIosPath);

    // Assert
    const expectedOutputFolder =
      '/path/to/my app/ios folder/build/generated/ios/ReactAppDependencyProvider';
    const expectedCodegenOutputFolder =
      '/path/to/my app/ios folder/build/generated/ios/ReactCodegen';

    expect(mockPrepareAppDependenciesHeaders).toHaveBeenCalledTimes(3);

    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      1,
      reactNativePath,
      appIosPath,
      expectedOutputFolder,
      'codegen',
    );
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      2,
      reactNativePath,
      appIosPath,
      expectedCodegenOutputFolder,
      'react-native',
    );
    expect(mockPrepareAppDependenciesHeaders).toHaveBeenNthCalledWith(
      3,
      reactNativePath,
      appIosPath,
      expectedCodegenOutputFolder,
      'third-party-dependencies',
    );
  });
});

// Mock console methods - disable React Native's strict console checking
const originalConsole = global.console;

beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

describe('findXcodeProjectDirectory', () => {
  let mockExecSync;

  beforeEach(() => {
    // Setup mock
    const childProcess = require('child_process');
    mockExecSync = childProcess.execSync;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should find Xcode project directory successfully', () => {
    // Setup
    const appPath = '/path/to/app';
    const xcodeProjectName = 'MyApp.xcodeproj';
    const mockResult = '/path/to/app/ios/MyApp.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/path/to/app/ios');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
    expect(mockExecSync).toHaveBeenCalledTimes(1);
  });

  it('should find Xcode project in nested subdirectory', () => {
    // Setup
    const appPath = '/Users/developer/ReactNativeApp';
    const xcodeProjectName = 'ReactNativeApp.xcodeproj';
    const mockResult =
      '/Users/developer/ReactNativeApp/ios/sub/ReactNativeApp.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/Users/developer/ReactNativeApp/ios/sub');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });

  it('should handle project found at root level', () => {
    // Setup
    const appPath = '/path/to/project';
    const xcodeProjectName = 'RootProject.xcodeproj';
    const mockResult = '/path/to/project/RootProject.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/path/to/project');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });

  it('should handle paths with spaces in directory names', () => {
    // Setup
    const appPath = '/path/to/my app';
    const xcodeProjectName = 'My App.xcodeproj';
    const mockResult = '/path/to/my app/ios folder/My App.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/path/to/my app/ios folder');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });

  it('should throw error when Xcode project is not found', () => {
    // Setup
    const appPath = '/path/to/app';
    const xcodeProjectName = 'NonExistent.xcodeproj';

    mockExecSync.mockReturnValue('');

    // Execute & Assert
    expect(() => findXcodeProjectDirectory(appPath, xcodeProjectName)).toThrow(
      `Xcode project 'NonExistent.xcodeproj' not found in '/path/to/app' or its subdirectories`,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });

  it('should throw error when find command returns only whitespace', () => {
    // Setup
    const appPath = '/path/to/app';
    const xcodeProjectName = 'Missing.xcodeproj';

    mockExecSync.mockReturnValue('   \n   \t   ');

    // Execute & Assert
    expect(() => findXcodeProjectDirectory(appPath, xcodeProjectName)).toThrow(
      `Xcode project 'Missing.xcodeproj' not found in '/path/to/app' or its subdirectories`,
    );
  });

  it('should properly escape quotes in app path', () => {
    // Setup
    const appPath = '/path/to/app with "quotes"';
    const xcodeProjectName = 'MyApp.xcodeproj';
    const mockResult = '/path/to/app with "quotes"/ios/MyApp.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/path/to/app with "quotes"/ios');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });
});

describe('setBuildFromSource', () => {
  let mockFs;
  let mockPath;
  let mockConsoleLog;
  let mockConsoleWarn;

  beforeEach(() => {
    // Setup mocks
    mockFs = require('fs');
    mockPath = require('path');
    mockConsoleLog = console.log;
    mockConsoleWarn = console.warn;

    // Clear and reset all mocks completely
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Set up fresh mock implementations
    mockFs.existsSync = jest.fn();
    mockFs.readFileSync = jest.fn();
    mockFs.writeFileSync = jest.fn();

    // Mock path.join to return realistic paths
    mockPath.join.mockImplementation((...args) => args.join('/'));
  });

  it('should update BUILD_FROM_SOURCE from false to true successfully', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const mockPackageSwiftContent = `
// Package.swift
import PackageDescription

let BUILD_FROM_SOURCE = false

let package = Package(
    name: "ReactNative",
    platforms: [.iOS(.v13)],
    // rest of package
)
`;

    const expectedUpdatedContent = `
// Package.swift
import PackageDescription

let BUILD_FROM_SOURCE = true

let package = Package(
    name: "ReactNative",
    platforms: [.iOS(.v13)],
    // rest of package
)
`;

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(mockPackageSwiftContent);
    mockFs.writeFileSync.mockImplementation(() => {});

    // Execute
    await setBuildFromSource(reactNativePath);

    // Assert
    expect(mockFs.existsSync).toHaveBeenCalledWith(
      '/path/to/react-native/Package.swift',
    );
    expect(mockFs.readFileSync).toHaveBeenCalledWith(
      '/path/to/react-native/Package.swift',
      'utf8',
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/path/to/react-native/Package.swift',
      expectedUpdatedContent,
      'utf8',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Updating BUILD_FROM_SOURCE in: /path/to/react-native/Package.swift',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ BUILD_FROM_SOURCE set to true in Package.swift',
    );
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('should handle when BUILD_FROM_SOURCE is already true', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const mockPackageSwiftContent = `
// Package.swift
import PackageDescription

let BUILD_FROM_SOURCE = true

let package = Package(
    name: "ReactNative",
    platforms: [.iOS(.v13)],
    // rest of package
)
`;

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(mockPackageSwiftContent);
    mockFs.writeFileSync.mockImplementation(() => {});

    // Execute
    await setBuildFromSource(reactNativePath);

    // Assert
    expect(mockFs.existsSync).toHaveBeenCalledWith(
      '/path/to/react-native/Package.swift',
    );
    expect(mockFs.readFileSync).toHaveBeenCalledWith(
      '/path/to/react-native/Package.swift',
      'utf8',
    );
    expect(mockFs.writeFileSync).not.toHaveBeenCalled(); // Should not write when already true
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Updating BUILD_FROM_SOURCE in: /path/to/react-native/Package.swift',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ BUILD_FROM_SOURCE is already set to true in Package.swift',
    );
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('should warn when BUILD_FROM_SOURCE declaration is not found', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const mockPackageSwiftContent = `
// Package.swift
import PackageDescription

let package = Package(
    name: "ReactNative",
    platforms: [.iOS(.v13)],
    // rest of package without BUILD_FROM_SOURCE
)
`;

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(mockPackageSwiftContent);
    mockFs.writeFileSync.mockImplementation(() => {});

    // Execute
    await setBuildFromSource(reactNativePath);

    // Assert
    expect(mockFs.existsSync).toHaveBeenCalledWith(
      '/path/to/react-native/Package.swift',
    );
    expect(mockFs.readFileSync).toHaveBeenCalledWith(
      '/path/to/react-native/Package.swift',
      'utf8',
    );
    expect(mockFs.writeFileSync).not.toHaveBeenCalled(); // Should not write when declaration not found
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Updating BUILD_FROM_SOURCE in: /path/to/react-native/Package.swift',
    );
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '⚠️  BUILD_FROM_SOURCE declaration not found in Package.swift',
    );
  });

  it('should throw error when Package.swift does not exist', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    mockFs.existsSync.mockReturnValue(false);

    // Execute & Assert
    await expect(setBuildFromSource(reactNativePath)).rejects.toThrow(
      'Package.swift not found at: /path/to/react-native/Package.swift',
    );

    expect(mockFs.existsSync).toHaveBeenCalledWith(
      '/path/to/react-native/Package.swift',
    );
    expect(mockFs.readFileSync).not.toHaveBeenCalled();
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it('should handle multiple BUILD_FROM_SOURCE occurrences', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const mockPackageSwiftContent = `
// Package.swift
import PackageDescription

let BUILD_FROM_SOURCE = false
// Some comment about BUILD_FROM_SOURCE = false
let anotherVar = "BUILD_FROM_SOURCE = false in string"

let package = Package(
    name: "ReactNative",
    platforms: [.iOS(.v13)],
    // Another BUILD_FROM_SOURCE = false comment
)
`;

    const expectedUpdatedContent = `
// Package.swift
import PackageDescription

let BUILD_FROM_SOURCE = true
// Some comment about BUILD_FROM_SOURCE = false
let anotherVar = "BUILD_FROM_SOURCE = false in string"

let package = Package(
    name: "ReactNative",
    platforms: [.iOS(.v13)],
    // Another BUILD_FROM_SOURCE = false comment
)
`;

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(mockPackageSwiftContent);
    mockFs.writeFileSync.mockImplementation(() => {});

    // Execute
    await setBuildFromSource(reactNativePath);

    // Assert - should replace only the declaration, not comments or strings
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/path/to/react-native/Package.swift',
      expectedUpdatedContent,
      'utf8',
    );
  });
});

describe('runIosPrebuild', () => {
  let mockExecSync;
  let mockConsoleLog;
  let originalProcessEnv;

  beforeEach(() => {
    // Setup mocks
    const childProcess = require('child_process');
    mockExecSync = childProcess.execSync;

    mockConsoleLog = console.log;

    // Store original process.env to restore later
    originalProcessEnv = process.env;

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalProcessEnv;
  });

  it('should run iOS prebuild successfully with prebuilt versions', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    mockExecSync.mockReturnValue(undefined);

    // Execute
    await runIosPrebuild(reactNativePath);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith('node scripts/ios-prebuild -s', {
      cwd: reactNativePath,
      env: {
        ...originalProcessEnv,
        RN_DEP_VERSION: 'nightly',
        HERMES_VERSION: 'latest-v1',
      },
      stdio: 'inherit',
    });
    expect(mockExecSync).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Running iOS prebuild with prebuilt versions...',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('✓ iOS prebuild completed');
    expect(mockConsoleLog).toHaveBeenCalledTimes(2);
  });

  it('should handle different React Native paths', async () => {
    // Setup
    const reactNativePath = '/Users/developer/react-native';

    mockExecSync.mockReturnValue(undefined);

    // Execute
    await runIosPrebuild(reactNativePath);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith('node scripts/ios-prebuild -s', {
      cwd: reactNativePath,
      env: {
        ...originalProcessEnv,
        RN_DEP_VERSION: 'nightly',
        HERMES_VERSION: 'latest-v1',
      },
      stdio: 'inherit',
    });
  });

  it('should handle paths with spaces correctly', async () => {
    // Setup
    const reactNativePath = '/path/to/react native project';

    mockExecSync.mockReturnValue(undefined);

    // Execute
    await runIosPrebuild(reactNativePath);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith('node scripts/ios-prebuild -s', {
      cwd: reactNativePath,
      env: {
        ...originalProcessEnv,
        RN_DEP_VERSION: 'nightly',
        HERMES_VERSION: 'latest-v1',
      },
      stdio: 'inherit',
    });
  });

  it('should throw error when iOS prebuild fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const mockError = new Error('Build failed');

    mockExecSync.mockImplementation(() => {
      throw mockError;
    });

    // Execute & Assert
    await expect(runIosPrebuild(reactNativePath)).rejects.toThrow(
      'iOS prebuild failed: Build failed',
    );

    expect(mockExecSync).toHaveBeenCalledWith('node scripts/ios-prebuild -s', {
      cwd: reactNativePath,
      env: {
        ...originalProcessEnv,
        RN_DEP_VERSION: 'nightly',
        HERMES_VERSION: 'latest-v1',
      },
      stdio: 'inherit',
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Running iOS prebuild with prebuilt versions...',
    );
    expect(mockConsoleLog).not.toHaveBeenCalledWith('✓ iOS prebuild completed');
  });

  it('should handle script not found error', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const mockError = new Error('Cannot find module scripts/ios-prebuild');

    mockExecSync.mockImplementation(() => {
      throw mockError;
    });

    // Execute & Assert
    await expect(runIosPrebuild(reactNativePath)).rejects.toThrow(
      'iOS prebuild failed: Cannot find module scripts/ios-prebuild',
    );
  });

  it('should handle root directory path', async () => {
    // Setup
    const reactNativePath = '/';

    mockExecSync.mockReturnValue(undefined);

    // Execute
    await runIosPrebuild(reactNativePath);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith('node scripts/ios-prebuild -s', {
      cwd: '/',
      env: {
        ...originalProcessEnv,
        RN_DEP_VERSION: 'nightly',
        HERMES_VERSION: 'latest-v1',
      },
      stdio: 'inherit',
    });
  });
});

describe('runPodDeintegrate', () => {
  let mockExecSync;
  let mockConsoleLog;
  let mockConsoleWarn;

  beforeEach(() => {
    // Setup mocks
    const childProcess = require('child_process');
    mockExecSync = childProcess.execSync;

    mockConsoleLog = console.log;
    mockConsoleWarn = console.warn;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should run pod deintegrate successfully', async () => {
    // Setup
    const appIosPath = '/path/to/app/ios';

    mockExecSync.mockReturnValue(undefined);

    // Execute
    await runPodDeintegrate(appIosPath);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith('pod deintegrate', {
      cwd: appIosPath,
      stdio: 'inherit',
    });
    expect(mockExecSync).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Running pod deintegrate in: /path/to/app/ios',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('✓ Pod deintegrate completed');
    expect(mockConsoleLog).toHaveBeenCalledTimes(2);
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('should handle different iOS directory paths', async () => {
    // Setup
    const appIosPath = '/Users/developer/MyApp/ios';

    mockExecSync.mockReturnValue(undefined);

    // Execute
    await runPodDeintegrate(appIosPath);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith('pod deintegrate', {
      cwd: appIosPath,
      stdio: 'inherit',
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Running pod deintegrate in: /Users/developer/MyApp/ios',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('✓ Pod deintegrate completed');
  });

  it('should handle paths with spaces correctly', async () => {
    // Setup
    const appIosPath = '/path/to/my app/ios folder';

    mockExecSync.mockReturnValue(undefined);

    // Execute
    await runPodDeintegrate(appIosPath);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith('pod deintegrate', {
      cwd: appIosPath,
      stdio: 'inherit',
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Running pod deintegrate in: /path/to/my app/ios folder',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('✓ Pod deintegrate completed');
  });

  it('should handle pod deintegrate command failure gracefully', async () => {
    // Setup
    const appIosPath = '/path/to/app/ios';
    const mockError = new Error('No Podfile.lock found');

    mockExecSync.mockImplementation(() => {
      throw mockError;
    });

    // Execute
    await runPodDeintegrate(appIosPath);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith('pod deintegrate', {
      cwd: appIosPath,
      stdio: 'inherit',
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Running pod deintegrate in: /path/to/app/ios',
    );
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      '✓ Pod deintegrate completed',
    );
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '⚠️  Pod deintegrate failed (this might be expected if no Podfile.lock exists)',
    );
    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
  });

  it('should handle command not found error', async () => {
    // Setup
    const appIosPath = '/path/to/app/ios';
    const mockError = new Error('command not found: pod');

    mockExecSync.mockImplementation(() => {
      throw mockError;
    });

    // Execute
    await runPodDeintegrate(appIosPath);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith('pod deintegrate', {
      cwd: appIosPath,
      stdio: 'inherit',
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Running pod deintegrate in: /path/to/app/ios',
    );
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '⚠️  Pod deintegrate failed (this might be expected if no Podfile.lock exists)',
    );
  });
});

describe('configureAppForSwift', () => {
  let mockFs;
  let mockPath;
  let mockConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockFs = require('fs');
    mockPath = require('path');
    mockConsoleLog = console.log;

    // Clear and reset all mocks completely
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Set up fresh mock implementations
    mockFs.existsSync = jest.fn();
    mockFs.mkdirSync = jest.fn();
    mockFs.unlinkSync = jest.fn();
    mockFs.linkSync = jest.fn();
    mockFs.symlinkSync = jest.fn();
    mockFs.writeFileSync = jest.fn();

    // Mock path.join to return realistic paths
    mockPath.join.mockImplementation((...args) => args.join('/'));

    // Mock path.relative to return realistic relative paths
    mockPath.relative.mockImplementation((from, to) => {
      // Simple implementation for tests
      return to.replace(from + '/', '');
    });
  });

  it('should configure app for Swift integration successfully', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    // Mock file system calls
    mockFs.existsSync
      .mockReturnValueOnce(true) // reactIncludesReactPath exists
      .mockReturnValueOnce(false) // destUmbrellaPath doesn't exist
      .mockReturnValueOnce(true); // sourceUmbrellaPath exists

    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.symlinkSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {});

    // Execute
    await configureAppForSwift(reactNativePath);

    // Assert file system calls
    expect(mockFs.existsSync).toHaveBeenCalledWith(
      '/path/to/react-native/React/includes/React',
    );
    expect(mockFs.existsSync).toHaveBeenCalledWith(
      '/path/to/react-native/React/includes/React/React-umbrella.h',
    );
    expect(mockFs.existsSync).toHaveBeenCalledWith(
      '/path/to/react-native/scripts/ios-prebuild/React-umbrella.h',
    );

    expect(mockFs.symlinkSync).toHaveBeenCalledWith(
      '/path/to/react-native/scripts/ios-prebuild/React-umbrella.h',
      '/path/to/react-native/React/includes/React/React-umbrella.h',
    );

    expect(mockFs.linkSync).not.toHaveBeenCalled();

    // Verify module.modulemap content
    const expectedModuleMapContent = `framework module React {
  umbrella header "/path/to/react-native/React/includes/React/React-umbrella.h"
  export *
  module * { export * }
}
`;
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/path/to/react-native/React/includes/module.modulemap',
      expectedModuleMapContent,
      'utf8',
    );

    // Verify console output
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Configuring app for Swift integration...',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ Created hardlink: React-umbrella.h -> scripts/ios-prebuild/React-umbrella.h',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ Generated module.modulemap file',
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✓ App configured for Swift integration',
    );
  });

  it('should remove existing hardlink before creating new one', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    mockFs.existsSync
      .mockReturnValueOnce(true) // reactIncludesReactPath exists
      .mockReturnValueOnce(true) // destUmbrellaPath exists (should be removed)
      .mockReturnValueOnce(true); // sourceUmbrellaPath exists

    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {});

    // Execute
    await configureAppForSwift(reactNativePath);

    // Assert
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      '/path/to/react-native/React/includes/React/React-umbrella.h',
    );
  });

  it('should handle different React Native paths', async () => {
    // Setup
    const reactNativePath = '/Users/developer/react-native';

    mockFs.existsSync
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    mockFs.linkSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {});

    // Execute
    await configureAppForSwift(reactNativePath);

    // Assert
    expect(mockFs.symlinkSync).toHaveBeenCalledWith(
      '/Users/developer/react-native/scripts/ios-prebuild/React-umbrella.h',
      '/Users/developer/react-native/React/includes/React/React-umbrella.h',
    );

    expect(mockFs.linkSync).not.toHaveBeenCalled();
  });

  it('should throw error when source umbrella header does not exist', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    mockFs.existsSync
      .mockReturnValueOnce(true) // reactIncludesReactPath exists
      .mockReturnValueOnce(false) // destUmbrellaPath doesn't exist
      .mockReturnValueOnce(false); // sourceUmbrellaPath doesn't exist

    // Execute & Assert
    await expect(configureAppForSwift(reactNativePath)).rejects.toThrow(
      'Swift configuration failed: Source umbrella header not found: /path/to/react-native/scripts/ios-prebuild/React-umbrella.h',
    );

    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Configuring app for Swift integration...',
    );
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      '✓ App configured for Swift integration',
    );
  });

  it('should throw error when hardlink creation fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    mockFs.existsSync
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    mockFs.symlinkSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Execute & Assert
    await expect(configureAppForSwift(reactNativePath)).rejects.toThrow(
      'Swift configuration failed: Permission denied',
    );
  });

  it('should throw error when module.modulemap write fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    mockFs.existsSync
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    mockFs.symlinkSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {
      throw new Error('Disk full');
    });

    // Execute & Assert
    await expect(configureAppForSwift(reactNativePath)).rejects.toThrow(
      'Swift configuration failed: Disk full',
    );
  });

  it('should throw error when directory creation fails', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    mockFs.existsSync.mockReturnValueOnce(false); // reactIncludesReactPath doesn't exist

    mockFs.mkdirSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Execute & Assert
    await expect(configureAppForSwift(reactNativePath)).rejects.toThrow(
      'Swift configuration failed: Permission denied',
    );
  });

  it('should handle file unlink errors gracefully', async () => {
    // Setup
    const reactNativePath = '/path/to/react-native';

    mockFs.existsSync
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true) // destUmbrellaPath exists
      .mockReturnValueOnce(true);

    mockFs.unlinkSync.mockImplementation(() => {
      throw new Error('File in use');
    });

    // Execute & Assert
    await expect(configureAppForSwift(reactNativePath)).rejects.toThrow(
      'Swift configuration failed: File in use',
    );
  });

  it('should generate correct module.modulemap content with absolute path', async () => {
    // Setup
    const reactNativePath = '/custom/path/to/react-native';

    mockFs.existsSync
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    mockFs.linkSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {});

    // Execute
    await configureAppForSwift(reactNativePath);

    // Assert module.modulemap content with correct absolute path
    const expectedModuleMapContent = `framework module React {
  umbrella header "/custom/path/to/react-native/React/includes/React/React-umbrella.h"
  export *
  module * { export * }
}
`;
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/custom/path/to/react-native/React/includes/module.modulemap',
      expectedModuleMapContent,
      'utf8',
    );
  });
});
