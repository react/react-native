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
Both are pinned development dependencies installed by the repository's normal
Yarn setup. Their font licenses are compatible with React Native distribution;
the packages retain the Bitstream Vera/DejaVu and SIL Open Font License notices.
Registration runs once during Fantom's default environment setup, including when
a test has already initialized React Native itself. No host font installation or
Expo runtime is required.

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
Ninja. GN bootstrap uses Python 3. The usual JDK, Android SDK, C/C++ compiler
and Python build tools are required; graphics, crypto and font libraries come
from these prepared sources or bundled assets.

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

The pinned Skia source adds optional scalar-stage selection and makes the forced
raster pipeline apply to sprite and saved-layer compositing. This keeps native
pixel-format defaults from selecting byte-based alpha rounding instead. Gradle
patches its prepared source copy, and CMake validates the scalar selector
without modifying the source. Keep the internal target's flags and the public GN
flags aligned when changing Skia.

## Screenshot snapshots

`root.takeScreenshot()` paints the currently mounted revision into an immutable
CPU bitmap. It does not flush pending React work. Captures survive later commits
and root destruction. Use `isEqual()` to compare their dimensions and pixel rows
in memory. `saveToFile()` writes a PNG, creating parent directories and
replacing an existing file.

`toMatchSnapshot()` stores a SHA-256 hash of the image dimensions and
premultiplied RGBA pixel rows. It compares that hash with the ordinary Jest
snapshot value; it does not decode an expected PNG. An inspectable PNG is kept
beside the `.snap` file in `<test-file>.screenshots`. PNG encoding is deferred
until an image must be saved, and PNG bytes are cached for repeated saves. A
matching hash passes even when the standalone PNG is missing; the runner
recreates that image from the matching capture without updating the hash.

`toMatchInlineSnapshot()` embeds the same `{type: 'Screenshot', hash}` value in
the test source. It compares hashes without encoding or saving PNGs, including
when the inline snapshot is created, updated or fails. Inline failures use
ordinary text snapshot diagnostics.

Snapshot mismatches retain the received PNG and save a difference PNG in the
same temporary directory. Failure diagnostics include the paths to the expected,
received and difference images, including in CI and redirected output. The
difference highlights changed pixels in red over faded unchanged content; it
does not affect hash comparison. Missing or unreadable images retain their
original diagnostics without a difference image. Snapshot updates copy it into
the baseline directory before cleaning up the temporary file. Unused images are
removed only during a full successful snapshot update; empty, failed, skipped or
filtered suites preserve their baselines.

Failing screenshot snapshots show expected, received and diff PNG previews in
supported terminals instead of hash diffs, with file paths beneath the images.
Wide terminals show Expected, Received and Difference side by side; narrow
terminals stack them. Fantom selects the image protocol from the detected
terminal. VS Code requires `terminal.integrated.enableImages` in its settings;
Fantom checks the terminal's response before sending images. If that check
cannot confirm support (including when another program is reading terminal
input), it keeps text diagnostics and file paths without printing image headers.
Unsupported terminals, terminal multiplexers, CI and redirected output retain
text diagnostics and file paths. Full text diagnostics also remain when any
required image preview is unavailable.

GitHub Fantom jobs upload failed comparisons as the `fantom-screenshot-failures`
artifact, grouped by test configuration and snapshot. Each comparison includes
the expected, received and difference PNGs when available. Failures from earlier
retries are retained even if a later attempt passes.

### Painting

The painter traverses Fabric's mounted child order, including stacking changes.
Yoga supplies the frames for flow and absolute positioning. Overflow clips
descendants to the view's rounded bounds; each view restores its canvas state
before painting siblings. Nonidentity affine transforms are centered on the
view, while identity transforms preserve child coordinates without extra
floating-point translations. Singular transforms are skipped.

`View`, styled and nested `Text`, `TextInput`, `Image` and `ScrollView` use this
shared canvas. Text inputs paint values or placeholders, including multiline and
secure entry. Scroll views offset their content to show the current viewport.
Backgrounds, solid borders, rounded corners and opacity follow the mounted
props.

Images support local PNG files (`file://` or filesystem paths) and base64 PNG
data URIs, with resize modes and tint. Supply network images as local fixtures.
The shared asset resolver maps bundled `require()` sources to native files while
keeping their React Native URIs stable in text snapshots.

An empty root produces a transparent viewport; a destroyed root cannot be
captured. Viewport offsets do not move the screenshot's origin. The renderer
does not reproduce Android or iOS platform chrome, shadows or perspective
transforms. Additional font fixtures can be registered with
`NativeFantom.registerFont()` before mounting; the default fonts need no
per-test registration.
