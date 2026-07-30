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

// Mock the headers-utils module before importing anything
jest.mock('../headers-utils', () => ({
  symlinkHeadersFromPath: jest.fn(),
  symlinkReactAppleHeaders: jest.fn(),
  symlinkReactCommonHeaders: jest.fn(),
}));

// Mock headers-mappings module
jest.mock('../headers-mappings', () => ({
  reactMappings: jest.fn(),
  librariesMappings: jest.fn(),
}));

// Mock fs and path modules
jest.mock('node:fs');
jest.mock('node:path');

const {librariesMappings, reactMappings} = require('../headers-mappings');
const {
  symlinkHeadersFromPath,
  symlinkReactAppleHeaders,
  symlinkReactCommonHeaders,
} = require('../headers-utils');
const {
  symlinkReactNativeHeaders,
} = require('../prepare-app-dependencies-headers');
const fs = require('node:fs');
const path = require('node:path');

describe('symlinkReactNativeHeaders', () => {
  let originalConsoleLog;

  beforeEach(() => {
    // Mock path.join to simply join with '/'
    path.join.mockImplementation((...args) => args.join('/'));

    // Setup mock return values for the helper functions
    symlinkHeadersFromPath.mockReturnValue(5);
    symlinkReactAppleHeaders.mockReturnValue(3);
    symlinkReactCommonHeaders.mockReturnValue(7);

    // Setup mock mappings
    reactMappings.mockReturnValue({
      '/path/to/react-native/React': {
        destination: '/output/headers/React',
        preserveStructure: false,
        excludeFolders: ['includes', 'headers', 'tests'],
      },
    });

    librariesMappings.mockReturnValue({
      '/path/to/react-native/Libraries': {
        destination: '/output/headers/React',
        preserveStructure: false,
        excludeFolders: ['tests'],
      },
    });

    // Mock console.log to prevent test output noise
    originalConsoleLog = console.log;
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  it('should create headers directory and call all processing functions with correct paths', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';
    const folderName = 'headers';

    // Mock fs.existsSync to return true for all React Native subdirectories
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return false; // headers dir doesn't exist
      if (filePath === '/output/headers/React') return false; // React dir doesn't exist
      if (filePath === '/path/to/react-native/ReactApple') return true;
      if (filePath === '/path/to/react-native/ReactCommon') return true;
      return false;
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder, folderName);

    // Assert - Verify directories are created
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers/React', {
      recursive: true,
    });

    // Assert - Verify mapping functions are called
    expect(reactMappings).toHaveBeenCalledWith(
      reactNativePath,
      '/output/headers',
    );
    expect(librariesMappings).toHaveBeenCalledWith(
      reactNativePath,
      '/output/headers',
    );

    // Assert - Verify symlinkHeadersFromPath is called for each mapping
    expect(symlinkHeadersFromPath).toHaveBeenCalledWith(
      '/path/to/react-native/React',
      '/output/headers/React',
      false,
      ['includes', 'headers', 'tests'],
    );
    expect(symlinkHeadersFromPath).toHaveBeenCalledWith(
      '/path/to/react-native/Libraries',
      '/output/headers/React',
      false,
      ['tests'],
    );

    // Assert - Verify ReactApple folder processing
    expect(symlinkReactAppleHeaders).toHaveBeenCalledWith(
      '/path/to/react-native/ReactApple',
      '/output/headers',
    );

    // Assert - Verify ReactCommon folder processing
    expect(symlinkReactCommonHeaders).toHaveBeenCalledWith(
      '/path/to/react-native/ReactCommon',
      '/output/headers',
    );

    // Assert - Verify logging
    expect(console.log).toHaveBeenCalledWith(
      'Creating symlinks for React Native headers...',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Created 3 symlinks from ReactApple folder',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Created 7 symlinks from ReactCommon folder',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Created symlinks for 10 React Native headers total',
    );
  });

  it('should use default folderName "headers" when not provided', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';
    // Note: not providing folderName parameter

    fs.existsSync.mockReturnValue(false); // No directories exist
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should use default "headers" folder name
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers/React', {
      recursive: true,
    });
  });

  it('should use custom folderName when provided', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';
    const customFolderName = 'custom-headers';

    fs.existsSync.mockReturnValue(false); // No directories exist
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder, customFolderName);

    // Assert - Should use custom folder name
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/custom-headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/custom-headers/React', {
      recursive: true,
    });
  });

  it('should skip processing folders that do not exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // Mock fs.existsSync to return false for some React Native subdirectories
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return false;
      if (filePath === '/output/headers/React') return false;
      if (filePath === '/path/to/react-native/ReactApple') return false; // ReactApple doesn't exist
      if (filePath === '/path/to/react-native/ReactCommon') return true; // ReactCommon exists
      return false;
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should process mappings regardless (handled by mappings functions)
    expect(symlinkHeadersFromPath).toHaveBeenCalledTimes(2); // React and Libraries mappings

    // Assert - Should not call ReactApple processing since it doesn't exist
    expect(symlinkReactAppleHeaders).not.toHaveBeenCalled();
    // Assert - Should call ReactCommon processing since it exists
    expect(symlinkReactCommonHeaders).toHaveBeenCalledTimes(1);

    // Assert - Should not log processing for non-existent ReactApple folder
    expect(console.log).not.toHaveBeenCalledWith(
      'Processing ReactApple folder...',
    );
    // Assert - Should log processing for existing ReactCommon folder
    expect(console.log).toHaveBeenCalledWith(
      'Processing ReactCommon folder...',
    );
  });

  it('should not create directories that already exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // Mock fs.existsSync to return true for directories (they already exist)
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return true; // headers dir exists
      if (filePath === '/output/headers/React') return true; // React dir exists
      if (filePath === '/path/to/react-native/ReactApple') return true;
      if (filePath === '/path/to/react-native/ReactCommon') return true;
      return false;
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should not create directories that already exist
    expect(fs.mkdirSync).not.toHaveBeenCalledWith('/output/headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).not.toHaveBeenCalledWith('/output/headers/React', {
      recursive: true,
    });
  });

  it('should aggregate total linked count correctly from all functions', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // Set up different return values for each function
    symlinkReactAppleHeaders.mockReturnValue(2);
    symlinkReactCommonHeaders.mockReturnValue(12);

    fs.existsSync.mockImplementation(filePath => {
      return (
        filePath.includes('/path/to/react-native/') ||
        filePath === '/output/headers' ||
        filePath === '/output/headers/React'
      );
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should aggregate counts from ReactApple and ReactCommon: 2 + 12 = 14
    expect(console.log).toHaveBeenCalledWith(
      'Created symlinks for 14 React Native headers total',
    );
  });

  it('should handle case where only some functions are called due to missing directories', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // Only ReactCommon exists
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return false;
      if (filePath === '/output/headers/React') return false;
      if (filePath === '/path/to/react-native/ReactCommon') return true;
      return false; // All other paths don't exist
    });
    fs.mkdirSync.mockImplementation(() => {});

    symlinkReactCommonHeaders.mockReturnValue(4);

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should still call symlinkHeadersFromPath for mappings (React/Libraries)
    expect(symlinkHeadersFromPath).toHaveBeenCalledTimes(2);
    expect(symlinkReactAppleHeaders).not.toHaveBeenCalled();
    expect(symlinkReactCommonHeaders).toHaveBeenCalledTimes(1);

    // Assert - Should only show total from ReactCommon
    expect(console.log).toHaveBeenCalledWith(
      'Created symlinks for 4 React Native headers total',
    );
  });

  it('should pass correct mappings for React and Libraries folders', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    fs.existsSync.mockImplementation(filePath => {
      return (
        filePath.includes('/path/to/react-native/') ||
        filePath === '/output/headers' ||
        filePath === '/output/headers/React'
      );
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Check that mappings functions are called
    expect(reactMappings).toHaveBeenCalledWith(
      reactNativePath,
      '/output/headers',
    );
    expect(librariesMappings).toHaveBeenCalledWith(
      reactNativePath,
      '/output/headers',
    );

    // Assert - Check symlinkHeadersFromPath is called for each mapping
    expect(symlinkHeadersFromPath).toHaveBeenCalledWith(
      '/path/to/react-native/React',
      '/output/headers/React',
      false,
      ['includes', 'headers', 'tests'],
    );
    expect(symlinkHeadersFromPath).toHaveBeenCalledWith(
      '/path/to/react-native/Libraries',
      '/output/headers/React',
      false,
      ['tests'],
    );
  });

  it('should pass correct parameters to ReactCommon processing function', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    fs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/path/to/react-native/ReactCommon' ||
        filePath.includes('/output/headers')
      );
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Check ReactCommon function is called with correct parameters (simplified)
    expect(symlinkReactCommonHeaders).toHaveBeenCalledWith(
      '/path/to/react-native/ReactCommon',
      '/output/headers',
    );
  });

  it('should handle the function being called without any React Native subdirectories', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // None of the React Native subdirectories exist
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return false;
      if (filePath === '/output/headers/React') return false;
      return false; // No React Native subdirectories exist
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should still create base directories
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers/React', {
      recursive: true,
    });

    // Assert - Should still call symlinkHeadersFromPath for mappings
    expect(symlinkHeadersFromPath).toHaveBeenCalledTimes(2);
    // Assert - Should not call folder-specific processing functions
    expect(symlinkReactAppleHeaders).not.toHaveBeenCalled();
    expect(symlinkReactCommonHeaders).not.toHaveBeenCalled();

    // Assert - Should show zero total from folder processing
    expect(console.log).toHaveBeenCalledWith(
      'Created symlinks for 0 React Native headers total',
    );
  });

  it('should properly log the orchestration process', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    fs.existsSync.mockImplementation(filePath => {
      return (
        filePath.includes('/path/to/react-native/') ||
        filePath === '/output/headers' ||
        filePath === '/output/headers/React'
      );
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    symlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Check logging sequence
    const logCalls = console.log.mock.calls.map(call => call[0]);

    expect(logCalls[0]).toBe('Creating symlinks for React Native headers...');
    expect(logCalls[1]).toBe('Processing ReactApple folder...');
    expect(logCalls[2]).toBe('Created 3 symlinks from ReactApple folder');
    expect(logCalls[3]).toBe('Processing ReactCommon folder...');
    expect(logCalls[4]).toBe('Created 7 symlinks from ReactCommon folder');
    expect(logCalls[5]).toBe(
      'Created symlinks for 10 React Native headers total',
    );
  });
});
