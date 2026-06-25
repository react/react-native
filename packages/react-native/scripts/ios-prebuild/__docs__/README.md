# iOS Prebuild Scripts

This directory contains scripts for prebuilding React Native itself into
XCFrameworks for iOS and related platforms.

## Overview

These scripts automate the process of building React Native as a Swift Package
and packaging it into XCFrameworks that can be distributed and consumed by iOS
applications. The build process creates optimized frameworks for multiple
architectures and platforms.

## Purpose

The prebuild scripts are used to:

- Build React Native itself (not its dependencies) as XCFrameworks
- Create distributable binaries for iOS, iOS Simulator, Catalyst.
- Support both Debug and Release build configurations
- Generate Debug Symbol (dSYM) files for debugging

## Usage

Run the prebuild script from the command line:

```bash
cd packages/react-native
node scripts/ios-prebuild
```

If no options are passed, the script executes all the steps in this order:

- setup the codebase for all platforms and flavors
- build for all platforms and flavors
- compose xcframeworks
- sign (if an identity is passed)

### Options

| Option        | Alias | Type    | Default                                    | Description                                                         |
| ------------- | ----- | ------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `--setup`     | `-s`  | boolean | -                                          | Download and setup dependencies                                     |
| `--build`     | `-b`  | boolean | -                                          | Build dependencies/platforms                                        |
| `--compose`   | `-c`  | boolean | -                                          | Compose XCFramework from built dependencies                         |
| `--platforms` | `-p`  | array   | `['ios', 'ios-simulator', 'mac-catalyst']` | Specify one or more platforms to build for                          |
| `--flavor`    | `-f`  | string  | `Debug`                                    | Specify the flavor to build: `Debug` or `Release`                   |
| `--identity`  | `-i`  | string  | -                                          | Specify the code signing identity to use for signing the frameworks |
| `--help`      | -     | boolean | -                                          | Show help information                                               |

### Output Structure

The build produces:

- XCFrameworks in the specified output directory
- Debug symbols (dSYM files) for debugging
- Build products organized by platform and configuration

## Architecture

The build system consists of several components:

### `cli.js`

The main entry point that orchestrates the build process. It:

- Parses command-line arguments
- Validates build parameters
- Coordinates the build, archiving, and XCFramework creation steps

### `build.js`

Handles the Swift Package build process. It:

- Executes `xcodebuild` commands with appropriate flags
- Builds for specific platforms and build types (Debug/Release)
- Locates and validates the generated framework artifacts
- Uses build settings like `BUILD_LIBRARY_FOR_DISTRIBUTION=YES` for binary
  compatibility

### `types.js`

Defines TypeScript/Flow type definitions for:

- `BuildFlavor`: Debug or Release configurations
- `Destination`: Target platforms (iOS, iOS Simulator, Catalyst, Vision,
  visionOS)
- `ArchiveOptions`: Configuration options for the build process

### `utils.js`

Provides utility functions including:

- Logging functionality with prefixed output
- Common helper functions used across scripts

## Build Flags

The build process uses specific `xcodebuild` flags:

- `BUILD_LIBRARY_FOR_DISTRIBUTION=YES`: Enables module stability
- `SKIP_INSTALL=NO`: Ensures frameworks are properly installed
- `DEBUG_INFORMATION_FORMAT="dwarf-with-dsym"`: Generates debug symbols
- `OTHER_SWIFT_FLAGS="-no-verify-emitted-module-interface"`: Skips interface
  verification (useful for React Native modules due to the header structure not
  beeing modular)

## Notes

- These scripts build React Native itself, not third-party dependencies
- The build process requires significant disk space for derived data
- Build times vary depending on the target platform and configuration
- XCFrameworks support multiple architectures in a single bundle

## Known Issues

The generated XCFrameworks currently use CocoaPods-style header structures
rather than standard framework header conventions. This may cause modularity
issues when:

- Consuming the XCFrameworks in projects that expect standard framework headers
- Building dependent frameworks that rely on proper module boundaries
- Integrating with Swift Package Manager projects expecting modular headers

## VFS Overlay System

The prebuilt XCFrameworks use Clang's Virtual File System (VFS) overlay
mechanism to enable header imports without modifying the actual header file
structure. This is necessary because React Native's headers are organized
differently than standard framework conventions.

### Overview

The VFS overlay creates a virtual mapping between the import paths used in code
(e.g., `#import <react/renderer/graphics/Size.h>`) and the actual physical
locations of headers within the XCFramework. This allows the prebuilt frameworks
to work seamlessly while maintaining the original import syntax.

### Build-Time VFS Generation (`vfs.js`)

The `vfs.js` script creates a VFS overlay template during the prebuild process:

1. **Header Collection** (`headers.js`): Scans all podspec files in the React
   Native package to discover header files and their target import paths.

2. **VFS Structure Building**: The `buildVFSStructure()` function creates a
   hierarchical directory tree representation from the header mappings. Clang's
   VFS overlay requires directories to contain their children in a tree
   structure.

3. **YAML Generation**: The `generateVFSOverlayYAML()` function converts the VFS
   structure into Clang's expected YAML format.

4. **Template Creation**: The generated overlay uses `${ROOT_PATH}` as a
   placeholder for the actual installation path. This template is included in
   the XCFramework as `React-VFS-template.yaml`.

#### Key Functions

- `createVFSOverlay(rootFolder)`: Main entry point that generates the complete
  VFS overlay YAML string
- `createVFSOverlayContents(rootFolder)`: Creates the VFS overlay object
  structure
- `buildVFSStructure(mappings)`: Builds the hierarchical directory tree from
  flat mappings
- `resolveVFSOverlay(vfsTemplate, rootPath)`: Replaces `${ROOT_PATH}` with the
  actual path

### Runtime VFS Processing (CocoaPods)

When consuming prebuilt frameworks via CocoaPods, the VFS overlay is processed
at pod install time by `rncore.rb`:

#### `process_vfs_overlay()`

Called during `react_native_post_install`, this method:

1. Reads the `React-VFS-template.yaml` from the XCFramework
2. Resolves the `${ROOT_PATH}` placeholder with the actual XCFramework path
3. Writes the resolved overlay to
   `$(PODS_ROOT)/React-Core-prebuilt/React-VFS.yaml`

#### `add_rncore_dependency(s)`

Adds VFS overlay compiler flags to podspecs that depend on React Native:

```ruby
# For C/C++ compilation
OTHER_CFLAGS += "-ivfsoverlay $(PODS_ROOT)/React-Core-prebuilt/React-VFS.yaml"
OTHER_CPLUSPLUSFLAGS += "-ivfsoverlay $(PODS_ROOT)/React-Core-prebuilt/React-VFS.yaml"

# For Swift compilation (flags passed to underlying Clang)
OTHER_SWIFT_FLAGS += "-Xcc -ivfsoverlay -Xcc $(PODS_ROOT)/React-Core-prebuilt/React-VFS.yaml"
```

#### `configure_aggregate_xcconfig(installer)`

Configures VFS overlay flags for:

- **Aggregate targets**: Main app targets that don't go through podspec
  processing
- **All pod targets**: Third-party pods that don't explicitly call
  `add_rncore_dependency`

This ensures all compilation units in the project can resolve React Native
headers through the VFS overlay.

### VFS Overlay Format

The VFS overlay uses Clang's hierarchical YAML format:

```yaml
version: 0
case-sensitive: false
roots:
  - name: '${ROOT_PATH}/Headers'
    type: 'directory'
    contents:
      - name: 'react'
        type: 'directory'
        contents:
          - name: 'renderer'
            type: 'directory'
            contents:
              - name: 'Size.h'
                type: 'file'
                external-contents: '${ROOT_PATH}/Headers/React/react/renderer/Size.h'
```

The structure maps virtual paths (what the compiler sees) to physical paths
(where the files actually exist in the XCFramework).

## Integrating in your project with Cocoapods

For consuming, debugging or troubleshooting when using Cocoapods scripts, you
can use the following environment variables:

- `RCT_USE_PREBUILT_RNCORE`: If set to 1, it will use the release tarball from
  Maven instead of building from source.
- `RCT_TESTONLY_RNCORE_TARBALL_PATH`: **TEST ONLY** If set, it will use a local
  tarball of RNCore if it exists.
- `RCT_TESTONLY_RNCORE_VERSION`: **TEST ONLY** If set, it will override the
  version of RNCore to be used.
- `RCT_SYMBOLICATE_PREBUILT_FRAMEWORKS`: If set to 1, it will download the dSYMs
  for the prebuilt RNCore frameworks and install these in the framework folders
