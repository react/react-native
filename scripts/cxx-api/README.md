# scripts/cxx-api

Python build pipeline for React Native's C++ (and Objective-C) API snapshots.

## Overview

`scripts/cxx-api` generates human-readable snapshots of React Native's public C++ API surface. It uses [Doxygen](https://www.doxygen.nl/) to parse C/C++/Objective-C headers and a custom Python parser to produce a simplified, sorted representation of every public symbol. Symbols declared in headers that the C++ stable API classifies as private or "for frameworks" are left out by default (see [Tier filtering](#tier-filtering)).

The pipeline produces one `.api` snapshot file per configured **API view × variant** combination:

| Snapshot | Description |
|---|---|
| `ReactCommonDebugCxx.api` | Platform-independent C++ API (debug) |
| `ReactCommonReleaseCxx.api` | Platform-independent C++ API (release) |
| `ReactAndroidDebugCxx.api` | Android-specific C++ API (debug) |
| `ReactAndroidReleaseCxx.api` | Android-specific C++ API (release) |
| `ReactAppleDebugCxx.api` | Apple-specific C++/Obj-C API (debug) |
| `ReactAppleReleaseCxx.api` | Apple-specific C++/Obj-C API (release) |
| `ReactCommonFrameworksCxx.api` | Platform-independent C++ API, including for-frameworks symbols |
| `ReactAndroidFrameworksCxx.api` | Android-specific C++ API, including for-frameworks symbols |
| `ReactAppleFrameworksCxx.api` | Apple-specific C++/Obj-C API, including for-frameworks symbols |

For each view, debug and release variants are generated with different preprocessor definitions (e.g. `REACT_NATIVE_DEBUG` vs `NDEBUG`), since `#ifdef` guards in the source headers can produce a different public API surface per variant. The frameworks variant uses the view's base definitions and also includes symbols from "for frameworks" headers.

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

#### Log tier boundary breaks

Pass `--log-boundary-breaks` (in either mode) to print every header whose includes cross a tier boundary, with the include chain that causes it:

```sh
python -m scripts.cxx-api.parser --validate --log-boundary-breaks
```

## How it works

The pipeline has three main stages:

### 1. Tier classification

Every header in a view's inputs is classified by the C++ stable API guard it includes:

| Guard | Tier |
|---|---|
| `react/cxxstableapi/UmbrellaGuard.h` | public |
| `react/cxxstableapi/FrameworksGuard.h` | for frameworks |
| `react/cxxstableapi/PrivateGuard.h` | private |
| none | unclassified |

The headers' `#include`/`#import` directives are resolved into an include graph of the view.

### 2. Doxygen XML generation

Doxygen is configured via a generated config file (built from `.doxygen.config.template`) with the input directories, exclude patterns, and preprocessor definitions specified in `config.yml`. It outputs XML describing every symbol found in the headers.

### 3. Snapshot parsing

The Python parser (`parser/`) reads the Doxygen XML output and builds a scope tree of the public API surface, leaving out symbols declared in skipped headers. The tree is then serialized to a deterministically sorted, human-readable `.api` text format.

## Tier filtering

Each view includes the tiers listed in its `visibility` config (`public`, `frameworks`, `private`), only `public` by default. A header in any other tier is skipped unless a header in an included tier reaches it, directly or through other includes: anything a public header includes is public in practice, whatever its own guard says. Unclassified headers are never skipped.

A boundary break is a public header that reaches a for-frameworks or private header, or a for-frameworks header that reaches a private one. `--log-boundary-breaks` reports them at the edge where visibility drops.

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
| `exclude_symbols` | Regex patterns for symbols to skip |
| `input_filter` | Whether to run Doxygen through the input filters in `parser/input_filters/` |
| `visibility` | C++ stable API tiers to include (`public`, `frameworks`, `private`); defaults to `[public]`. See [Tier filtering](#tier-filtering) |

`exclude_patterns` and `exclude_symbols` can also be set at the top level, in which case they apply to every view. A top-level `visibility` applies to every view that does not set its own, and a variant can set `visibility` to override its view's.

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
