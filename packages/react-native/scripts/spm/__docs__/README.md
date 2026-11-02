# SwiftPM (Apple platforms) — Preview

[🏠 Home](../../../../../__docs__/README.md)

> **Preview.** SwiftPM support is an early preview. The commands, flags,
> generated layout, and distribution model may change in future releases. It is
> not yet recommended for production. CocoaPods remains the supported default.

The scripts in `scripts/spm/` let a React Native iOS app consume React Native
through **Swift Package Manager** instead of CocoaPods, using prebuilt
XCFrameworks. Support is opt-in and additive: `npx react-native spm` injects
package references into the app's existing `.xcodeproj` in place, and `deinit`
reverses exactly what it injected.

[RFC0994](https://github.com/react-native-community/discussions-and-proposals/blob/main/proposals/0994-swift-package-manager-support-for-react-native-ios-projects.md)
holds the motivation, the staged migration plan, and the open questions. The
documents here describe how the implementation works.

## 🚀 Usage

```bash
cd ios
npx react-native spm      # add on first run, update thereafter
```

**If an autolinked dependency ships no `Package.swift`, setup stops with
`error: Package.swift is missing for library "<name>"` and exit code 2.** Run
`npx react-native spm scaffold`, persist the manifest with `patch-package`, and
re-run setup. See
[Community packages without a Package.swift](./spm-scripts.md#community-packages-without-a-packageswift).

See **[spm-scripts.md](./spm-scripts.md)** for the CLI actions and flags,
CocoaPods migration, brownfield apps, what to commit, fresh clones and CI, and
troubleshooting.

## 📐 Design

Three documents cover the design, each owning one area:

| Document                                                       | Covers                                                                                                                                                                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [spm-scripts.md](./spm-scripts.md)                             | The tool itself: CLI surface, the six-step pipeline, [every file it creates or modifies](./spm-scripts.md#files-the-tool-touches), the two auto-sync hooks, and how Debug/Release flavor selection works.                       |
| [spm-header-paths-contract.md](./spm-header-paths-contract.md) | How headers and package references resolve. The contract is **zero-`-I`**: no generated manifest carries a search path into React Native's own headers. Also covers remote mode.                                                |
| [spm-autolinking-plugins.md](./spm-autolinking-plugins.md)     | The extension seam for frameworks with their own module system (Expo is the first consumer): discovery, the full context/return contract including `flavoredFrameworks`, `watchPaths` and `scriptPhases`, and failure behavior. |

Two ideas explain most of the architecture:

- **Headers go through SwiftPM; runtime binaries do not.** A `binaryTarget`
  cannot vary by build configuration, but React Native ships flavored binaries.
  So the package graph vends headers only, and generated Xcode build settings
  link and embed the flavored frameworks. See
  [Debug/Release flavor is automatic](./spm-scripts.md#debugrelease-flavor-is-automatic).
- **Generated state is regenerable, and the injection is reversible.**
  Everything under `build/` is gitignored and rebuilt from the app's
  `package.json`. Every edit to the `.xcodeproj` is recorded in a
  `.spm-injected.json` marker, so `deinit` can undo exactly that.

## 🔗 Relationship with other systems

### Part of

- iOS build system — the alternative to the CocoaPods integration in
  [`scripts/cocoapods/`](../../cocoapods).

### Used by this

- **Prebuilt XCFrameworks** from [`scripts/ios-prebuild/`](../../ios-prebuild) —
  produces the `React`, `ReactNativeDependencies`, `hermes-engine`, and
  headers-only artifacts that these scripts download, stage, and link.
- **Codegen** (`generate-codegen-artifacts.js`) — its output is installed as a
  local `React-GeneratedCode` package rather than a Pod.
- **`@react-native-community/cli config`** — supplies the autolinking metadata
  (`autolinking.json`) that the SwiftPM autolinker turns into a `Package.swift`.
  Override it with the `RCT_SPM_AUTOLINKING_CONFIG_COMMAND` environment
  variable, or with `--config-command` when you run `setup-apple-spm.js`
  directly.

### Uses this

- Apps opting into SwiftPM, via the `spm` React Native CLI command.
- Frameworks layering their own module system on top of React Native, via
  [autolinking plugins](./spm-autolinking-plugins.md).
