# iOS Prebuild Scripts Documentation

This folder contains scripts for creating precompiled XCFrameworks for React
Native's dependencies. These scripts automate the process of downloading,
building, and packaging third-party libraries into distributable XCFramework
bundles for iOS.

## Overview

The iOS prebuild system creates precompiled frameworks to reduce build times for
React Native iOS apps. Instead of compiling dependencies from source during
every build, these scripts package them as ready-to-use XCFrameworks.

The prebuild process creates a Swift package that builds frameworks for the
following 3rd party libraries:

- boost
- folly
- glog
- fmt
- double-conversion
- socketrocket
- fast-float

## Main Scripts

### `cli.js`

Command-line interface for the prebuild system.

```bash
node scripts/releases/prepare-ios-prebuilds.js
```

If no options are passed, the script executes all the steps in this order:

- setup dependencies and prepares them
- creates Swift package file
- builds for all platforms and configurations
- creates xcframeworks

**Options:**

| Option             | Short | Description                                                                                         |
| ------------------ | ----: | --------------------------------------------------------------------------------------------------- |
| `--setup`          |  `-s` | Download and setup dependencies                                                                     |
| `--build`          |  `-b` | Build dependencies for target platforms                                                             |
| `--compose`        |  `-c` | Compose XCFrameworks from built artifacts                                                           |
| `--swiftpackage`   |  `-w` | Generate `Package.swift` file                                                                       |
| `--platforms`      |  `-p` | Target platforms (ios, macos, catalyst, tvos, visionos)                                             |
| `--configurations` |  `-g` | Build configurations (Debug, Release)                                                               |
| `--dependencies`   |  `-d` | Specific dependencies to process                                                                    |
| `--clean`          |     — | Clean build folder before building                                                                  |
| `--identity`       |  `-i` | Signing identity for frameworks                                                                     |
| `--mergeable`      |     — | Build Release frameworks that Xcode can merge into the app executable. Release only, off by default |

## Integrating in your project with Cocoapods

To use the prebuilt React Native Dependencies XCFrameworks in your iOS project,
run pod install with the environment variable `RCT_USE_RN_DEP` set to `1`:

```bash
RCT_USE_RN_DEP=1 bundle exec pod install
```

This can be combined with `RCT_USE_RN_DEP=1` to use both React Native and its
dependencies as prebuilt frameworks.

For debugging and troubleshooting the Cocoapods scripts, you can use the
following environment variables:

- `RCT_USE_RN_DEP`: If set to 1, it will use the release tarball from Maven
  instead of building from source.
- `RCT_USE_LOCAL_RN_DEP`: **TEST ONLY** If set, it will use a local tarball of
  ReactNativeDependencies if it exists.
- `RCT_DEPS_VERSION`: **TEST ONLY** If set, it will override the version of
  ReactNativeDependencies to be used.
