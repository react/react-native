# scripts/cxx-api

Python build pipeline for React Native's C++ (and Objective-C) API snapshots.

## Overview

`scripts/cxx-api` generates human-readable snapshots of React Native's public C++ API surface. It uses [Doxygen](https://www.doxygen.nl/) to parse C/C++/Objective-C headers and a custom Python parser to produce a simplified, sorted representation of every public symbol.

The pipeline produces one `.api` snapshot file per configured **API view × variant** combination:

| Snapshot | Description |
|---|---|
| `ReactCommonDebugCxx.api` | Platform-independent C++ API (debug) |
| `ReactCommonReleaseCxx.api` | Platform-independent C++ API (release) |
| `ReactAndroidDebugCxx.api` | Android-specific C++ API (debug) |
| `ReactAndroidReleaseCxx.api` | Android-specific C++ API (release) |
| `ReactAppleDebugCxx.api` | Apple-specific C++/Obj-C API (debug) |
| `ReactAppleReleaseCxx.api` | Apple-specific C++/Obj-C API (release) |

For each view, debug and release variants are generated with different preprocessor definitions (e.g. `REACT_NATIVE_DEBUG` vs `NDEBUG`), since `#ifdef` guards in the source headers can produce a different public API surface per variant.

Snapshot files are committed to the repo under `scripts/cxx-api/api-snapshots/`.

## Usage

#### Generate snapshots

Maintainers should run this command whenever making intentional C++ API changes:

```sh
python -m scripts.cxx-api.parser
```

#### Validate snapshots against committed baseline

This mode generates snapshots to a temporary directory and compares them against the committed `.api` files. It is designed for CI:

```sh
python -m scripts.cxx-api.parser --validate
```

If any snapshot differs, a unified diff is printed and the process exits with a non-zero status. To fix a failing validation, regenerate the snapshots with `python -m scripts.cxx-api.parser` and commit the updated `.api` files.

## How it works

The pipeline has two main stages:

### 1. Doxygen XML generation

Doxygen is configured via a generated config file (built from `.doxygen.config.template`) with the input directories, exclude patterns, and preprocessor definitions specified in `config.yml`. It outputs XML describing every symbol found in the headers.

### 2. Snapshot parsing

The Python parser (`parser/`) reads the Doxygen XML output and builds a scope tree of the public API surface. The tree is then serialized to a deterministically sorted, human-readable `.api` text format.

## When to use it

The snapshot should be regenerated whenever making intentional changes to the public C++ API surface. This includes additions, removals, and changes to files located in:
- `xplat/js/react-native-github/`
- `xplat/js/react-native-github/ReactCommon/`
- `xplat/js/react-native-github/ReactAndroid/`
- `xplat/js/react-native-github/ReactApple/`
- `xplat/js/react-native-github/Libraries/`

## Configuration

All API views and their variants are defined in `config.yml`. Each view specifies:

| Field | Description |
|---|---|
| `inputs` | Directories to scan for headers |
| `exclude_patterns` | Glob patterns for files to skip |
| `definitions` | Preprocessor macros to define |
| `variants` | Named build variants (e.g. debug/release) with extra definitions |
| `codegen` | Optional codegen platform (`android`, `ios`) to generate TurboModule/Component headers before scanning |
| `private_directories` | Directories whose headers are scanned (they may be transitively included) but should not contribute public symbols. If any public API entity is defined in a private directory, a warning is printed to help catch accidental API exposure. |

## Snapshot format

The `.api` files use a minimal pseudo-C++ syntax designed for easy diffing:

```
namespace facebook::react {
  class ComponentDescriptor {
    public ComponentDescriptor(ComponentDescriptorParameters params);
    public ComponentHandle getComponentHandle();
  }

  enum class AccessibilityRole {
    None = 0,
    Button = 1,
  }
}
```

- Scopes and members are sorted alphabetically.
- Access specifiers (`public`, `protected`) are preserved.
- Template parameters are included.
- Doc comments and source file names are stripped.
