# Rendering

## Text measurement

Fantom always measures intrinsic `Text` and `TextInput` sizes with Skia's CPU
font metrics. Layout and screenshot painting share the same text layout code,
including fragment styles, constrained-width wrapping, inline attachments, input
values and placeholders. `maximumNumberOfLines` limits the measured box; clipped
attachments retain their entries in Fabric's attachment mapping.

A root's `fontScale` defaults to `1` and is passed to native layout. Text and
inputs respect `allowFontScaling` and `maxFontSizeMultiplier`; line heights
scale with the font size. `devicePixelRatio` determines raster resolution,
rather than the logical text size.

### Fonts and assets

Fantom registers DejaVu Sans regular, bold, italic and bold italic faces from
[`dejavu-fonts-ttf`](https://www.npmjs.com/package/dejavu-fonts-ttf), plus
[`@expo-google-fonts/noto-color-emoji`](https://www.npmjs.com/package/@expo-google-fonts/noto-color-emoji).
Both are pinned Fantom dependencies installed by the repository's normal Yarn
setup. Their font licenses are compatible with React Native distribution; the
packages retain the Bitstream Vera/DejaVu and SIL Open Font License notices.
Registration runs once during Fantom's default environment setup. Tests that
configure React Native directly call `setUpFantomEnvironment()` themselves. No
host font installation or Expo runtime is required.

Metro preserves the source files of bundled assets in Fantom's asset metadata.
The shared resolver selects the asset variant for the root's pixel ratio and
registers its native file path. Ordinary `require()` sources therefore work
without custom path mappings. Keep a fixture alongside the test that uses it.

Default color emoji selection follows Unicode 16.0 `Emoji_Presentation`.
Explicit text and emoji variation selectors override that default. Selectors and
keycap sequences stay with their bases during fallback and wrapping; HarfBuzz
shapes color emoji sequences for both measurement and painting. General script
shaping, text decorations and ellipsis are not implemented.

### Public native build

`yarn workspace @react-native/fantom build` uses Gradle to prepare pinned Skia,
FreeType, libpng, zlib, HarfBuzz and BoringSSL sources. CMake builds HarfBuzz
and BoringSSL as static libraries, and builds Skia with GN and the Android SDK's
Ninja. BoringSSL provides SHA-256 for screenshot pixel hashes; the existing
Boost dependency has SHA-1 and MD5 but no SHA-256 implementation. GN bootstrap
uses Python 3. The usual JDK, Android SDK, C/C++ compiler and Python build tools
are required; graphics, crypto and font libraries come from these prepared
sources or bundled assets.

The native Gradle task tracks C++ sources so edits rebuild the tester.
Dependency versions and download locations are defined in
[`build.gradle.kts`](../build.gradle.kts). Native integration is configured in
[`tester/CMakeLists.txt`](../tester/CMakeLists.txt) and its third-party
subdirectories.

### Consistent raster configuration

Tests share snapshot baselines across Linux and macOS. Different font metrics
can change line wrapping and the placement of other views; different raster
rounding can change pixel hashes even when the images look alike. Keeping both
consistent makes a failing snapshot useful evidence of a rendering change,
independent of the machine running the test.

Both native builds use CPU Skia, FreeType and the same bundled fonts. Host font
managers and platform shaping backends are disabled. Text gamma correction is
configured identically in both builds.

Fantom disables the legacy shader context and lower precision raster pipeline,
forces the raster pipeline blitter, and selects scalar high precision stages.
Floating-point contraction is disabled with `-ffp-contract=off`. This avoids ARM
and x86 optimized stages producing different rounded channel values when
compositing the same pixels, including color emoji. These settings apply only to
Fantom's Skia library.

The scalar selector is an optional `SK_RASTER_PIPELINE_FORCE_SCALAR` definition
in the pinned Skia source. Gradle patches its prepared source copy, and CMake
validates the selector without modifying the source. Keep the internal target's
flags and the public GN flags aligned when changing Skia.
