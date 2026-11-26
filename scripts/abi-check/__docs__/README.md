# C++ ABI check

[🏠 Home](../../../__docs__/README.md)

The scripts in `scripts/abi-check/` find ABI breaks in the C++ stable API of
React Native. An ABI break is a change in the size or the memory layout of a
public type, in the order of its virtual methods, or in the values of its
enumerators. Code that was compiled against the earlier release then reads the
wrong memory or calls the wrong function, even though it still compiles against
the new headers.

The API snapshots in `scripts/cxx-api` and `scripts/js-api` record declarations,
not layouts, so they do not find these changes. For example, between 0.87 and
0.88 `facebook::yoga::Style` shrank from 280 to 160 bytes. This changed the
layout of `YogaStylableProps` and `BaseViewProps`, and no existing check
reported it.

The check compiles the stable API headers of two versions with clang, dumps the
layouts of their types, and compares the dumps. The base is always a version
published on Maven. The other side is another published version or a checkout of
this repository.

## 🚀 Usage

```bash
node scripts/abi-check/cli.js --platform ios --build-type release \
  --base 0.88.0 --current .
```

| Flag           | Value                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `--platform`   | `ios` or `android`.                                                                                                 |
| `--build-type` | `debug` or `release`.                                                                                               |
| `--base`       | The published version to compare with, such as `0.88.0`.                                                            |
| `--current`    | The root folder of a checkout, if that folder exists. Otherwise a published version.                                |
| `--cache-dir`  | Where downloaded artifacts are kept. The default is `react-native-abi-check` in the temporary folder of the system. |
| `--json`       | Prints the result as JSON instead of text.                                                                          |

Each platform and build type is a separate ABI, so one run checks one pair.

The exit status is:

- `0`: no ABI breaks.
- `1`: one or more ABI breaks. The output lists each changed or removed type.
- `2`: bad arguments, or a tool error, such as a failed download or a header
  that does not compile.

Requirements:

- iOS needs Xcode. The check finds the `iphoneos` SDK with `xcrun`.
- Android needs the Android NDK. The check uses `ANDROID_NDK_HOME`. Otherwise it
  uses the newest NDK in the `ndk` folder of the Android SDK, from
  `ANDROID_HOME`, `ANDROID_SDK_ROOT` or `~/Library/Android/sdk`.

To run the unit tests:

```bash
yarn jest --no-cache -i scripts/abi-check
```

## 📐 Design

A run has these stages: select the headers, lay out each side, dump the layouts
with clang, and compare the dumps.

### Header selection (`tiers.js`)

A header is in the stable API when the first `react/cxxstableapi/*Guard.h` it
includes is `UmbrellaGuard.h` or `FrameworksGuard.h`. This rule is a copy of the
one in `scripts/cxx-api/parser/tiers.py`. The check then removes the headers
that the C++ API snapshot excludes for the platform. The exclude patterns are a
copy of `_TEMPLATE_EXCLUDE_PATTERNS` in `scripts/cxx-api/parser/__main__.py` and
of the lists in `scripts/cxx-api/config.yml`. Keep all three in sync.

A header is identified by its include path, the path written in
`#include <...>`. So a header gets the same verdict in the source tree and in a
published artifact.

### Header layouts (`layout.js`)

A header layout is the data that clang needs for one side: the `-I` folders, the
`-F` folders, and a map from include path to file. When two layouts are merged,
a header that is in both comes from the first, as clang finds it.

### Published baseline (`artifacts.js`)

The check downloads the headers of a published version from Maven Central:

- iOS: the `reactnative-core` and `reactnative-dependencies-headers` tarballs of
  `react-native-artifacts`, for the build type.
- Android: the `react-android` AAR, whose prefab modules hold the headers, and
  the `fbjni` AAR at the version that the `react-android` POM names.

Each archive is kept in the cache folder. It gets its cache name only after its
SHA-1 matches the checksum that Maven lists. The headers are extracted next to
the archive once.

### Checkout side (`source.js`)

For a checkout, the check builds the layout that the published artifacts would
have:

- iOS: it writes the headers as the iOS prebuild spec plans them. It always uses
  the prebuild scripts of this repository, whatever the version of the checkout.
- Android: it copies the headers by the prefab rules in
  `ReactAndroid/build.gradle.kts`. It adds the `fbjni` headers at the version in
  the Gradle version catalog.

A checkout has no third-party, codegen or Hermes headers. Clang finds them in
the base artifacts, after the headers of the checkout.

### Dumping (`dump.js`)

The check compiles one translation unit per side with the flags of React
Native's own builds for the platform and build type. Clang dumps:

- the record layout of each type: size, alignment, and field offsets,
- the vtable of each polymorphic class. Clang lays out a vtable only when the
  translation unit uses it, so a second run adds code that uses each one,
- the enumerator values of each enum.

Only types in `facebook::react`, `facebook::yoga` and `facebook::jsi` are kept.

### Comparison (`check.js`, `diff.js`)

Both sides are dumped with the union of their stable API headers. A header that
only one side marks as stable is still dumped on both sides, so a change of tier
alone is not reported. Each side dumps only the headers that it has.

A type whose dump changed or that was removed is an ABI break. A type that was
added is not a break. The result counts added types but does not list them.

### Skip list (`skipped-headers.js`)

Some stable API headers do not compile in a published layout. The skip list
names each one with its platform and a reason. An entry can also name the
versions it applies to. It then applies when the base or the current version is
one of them. Without versions, it applies to all comparisons.

The check removes the skipped headers from both sides and prints their names.
Any other header that does not compile stops the run with exit status `2`.

To add an entry, add the header, the platform and the reason to
`SKIPPED_HEADERS`. Give `versions` when only some releases are affected. To
remove an entry, make sure that its cause is fixed in every version the check
compares with, then delete it.

## ⚠️ Known limits

- The check does not run in CI yet.
- It does not check exported symbols, or the Java and Kotlin API.
- Some published iOS headers do not compile alone, because the prebuilt package
  flattens their subfolders. These headers are on the skip list. PR
  [#60295](https://github.com/react/react-native/pull/60295) fixes the cause.

## 🔗 Relationship with other systems

### Part of

- Testing / C++ in the [root documentation](../../../__docs__/README.md).

### Used by this

- `packages/react-native/scripts/spm/download-spm-artifacts`: downloads the
  Maven artifacts, with retries.
- [iOS prebuild](../../../packages/react-native/scripts/ios-prebuild/__docs__/README.md):
  its headers spec gives the header layout of an iOS checkout.
- `scripts/cxx-api`: `parser/tiers.py` holds the stable API rule, and
  `parser/__main__.py` and `config.yml` hold the exclude patterns. `tiers.js`
  copies all three.

### Uses this

- Nothing yet. A CI workflow is a planned follow-up.
