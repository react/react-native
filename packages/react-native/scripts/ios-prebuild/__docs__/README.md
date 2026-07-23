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

## Header Resolution (headers-spec layout)

The prebuilt XCFrameworks ship a **headers-spec layout** so that header imports
resolve through plain header/framework search paths — there is **no clang VFS
overlay**. The layout contract is defined and validated in code:

- `headers-spec.js`: the executable layout contract (rules R1–R8) — which
  namespaces are hoisted, which carry module maps, and how collisions are
  rejected.
- `headers-inventory.js`: scans the source tree to build the live header
  inventory that feeds the spec.
- `headers-compose.js`: emits the layout. `emitReactFrameworkHeaders()` writes
  the `React/` and bare-aliased headers into every slice's
  `React.framework/Headers`, and `buildReactNativeHeadersXcframework()`
  assembles the headers-only `ReactNativeHeaders.xcframework` carrying every
  other namespace (incl. `react/`) plus the third-party dependency namespaces
  (`folly`, `glog`, `boost`, `fmt`, `double-conversion`, `fast_float`). The
  Hermes public headers (`<hermes/...>`) are folded in only on the SwiftPM
  consumer side (`ensureHeadersLayout`); the published prebuild artifact does
  not yet carry them (TODO in `xcframework.js`).

### Artifacts

The prebuild (`xcframework.js`) always produces:

- `React.xcframework` — the compiled React core. Each slice's `React.framework`
  carries the headers-spec layout (every `<React/...>` header + the framework
  module map), which is what both CocoaPods and SwiftPM consume.
- `ReactNativeHeaders.xcframework` — headers-only; carries every other
  namespace. Consumed by SwiftPM as a `binaryTarget` and by CocoaPods via the
  `React-Core-prebuilt` pod (headers flattened onto the header search path).

### CocoaPods consumption

The `React-Core-prebuilt` pod vends `React.xcframework` (so `<React/...>` and
`@import React;` resolve through the framework module via
`FRAMEWORK_SEARCH_PATHS`) and flattens `ReactNativeHeaders.xcframework`'s
headers into a top-level `Headers/` exposed on the pod header search path (so
`<react/...>`, `<yoga/...>`, `<folly/...>` resolve). `rncore.rb` adds the
`HEADER_SEARCH_PATHS` entry to `React-Core-prebuilt/Headers` for podspec,
aggregate (main app), and third-party pod targets. No `-ivfsoverlay` flags are
added.

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
