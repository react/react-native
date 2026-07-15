# SPM Build Plugins Assessment

An evaluation of whether Swift Package Manager plugins can replace the Xcode build
phase scripts currently injected by `generate-spm-xcodeproj.js`.

## Current Build Phases (6 total)

| # | Phase | Timing | SPM Plugin Feasible? |
|---|-------|--------|----------------------|
| 1 | Sync SPM Autolinking | Pre-build | Partially |
| 2 | Prepare VFS Overlay | Pre-build | Partially |
| 3 | Sources (compile) | Build | N/A (standard) |
| 4 | Frameworks (link) | Build | N/A (standard) |
| 5 | Resources (copy) | Build | N/A (standard) |
| 6 | Build JS Bundle | **Post-build** | **See below** |

> **Removed:** The "Copy Hermes Framework" phase was removed — it was a no-op.
> The underlying `copy-hermes-xcode.sh` script has been empty since Dec 2022.
> Hermes is already properly linked as an xcframework SPM dependency.

## SPM Plugin Types

SPM offers two plugin types:

1. **Build Tool Plugins** (`BuildToolPlugin`) — run pre-build, can generate source
   files/resources via `prebuildCommands` or per-file `buildCommands`.
2. **Command Plugins** (`CommandPlugin`) — run on-demand via
   `swift package <command>`.

## Key Constraints

### Sandbox restrictions

SPM plugins run sandboxed by default — no network access, limited filesystem access.
The current scripts need to:

- Run `node` (not on the sandbox-allowed path)
- Write to the source tree (`autolinked/`, `build/`)
- Access `node_modules/`
- Read git state

Command plugins can request `--allow-writing-to-package-directory`, but build tool
plugins can only write to a designated plugin work directory, not the source tree.

### No Xcode build settings

SPM plugins do not receive Xcode build settings such as `CONFIGURATION`,
`PLATFORM_NAME`, `BUILT_PRODUCTS_DIR`, or `DERIVED_FILE_DIR`. The JS bundling script
relies heavily on these to decide debug-vs-release behavior and output paths.

## JS Bundle Phase — Could Move to Pre-build

The JS bundle has no dependency on native compilation. It only needs JS source files,
Metro, and knowledge of debug vs release. The current post-build placement is
historical — the script writes directly into `BUILT_PRODUCTS_DIR`.

A potential restructuring:

1. **Generate the bundle pre-build** into a known location (e.g. `build/jsbundle/`)
2. **Declare it as an SPM resource** so it gets copied into the app automatically

Challenges:
- **Debug builds skip bundling** (app loads from Metro dev server). The script checks
  `CONFIGURATION == Debug`, which is unavailable to SPM plugins.
- **Hermes bytecode compilation** also happens in this phase for release builds.
- Making it a command plugin (`swift package bundle-js --configuration release`) would
  lose the automatic behavior — developers would need to run it explicitly.

## What Could Theoretically Work

### Codegen as a Command Plugin

A Swift command plugin could shell out to `node` to run codegen:

```swift
@main struct CodegenPlugin: CommandPlugin {
    func performCommand(context: PluginContext, arguments: [String]) throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        process.arguments = ["node", "scripts/codegen/generate-codegen-artifacts.js"]
        try process.run()
        process.waitUntilExit()
    }
}
```

Invoked as `swift package codegen`. This is essentially wrapping a shell script in
Swift with no real benefit over the current approach.

### Autolinking sync as a Prebuild Command

A `prebuildCommand` runs before every build, similar to Phase 1. But:

- Output can only go to the plugin work directory (not `autolinked/`)
- Would need to restructure the package graph to consume generated files from the
  plugin work directory
- Still needs to shell out to `node`

This is a significant architectural rework for marginal benefit.

## Recommendation

**Do not invest in SPM plugins for this use case.** Reasons:

1. **Pre-build phases already work well** as Xcode build phase scripts. Moving them
   to SPM plugins adds Swift boilerplate around `Process()` calls to `node`, while
   losing access to Xcode build settings.

2. **The ROI is poor** — a hybrid (some SPM plugins + some Xcode build phases) is
   harder to reason about than the current uniform approach of all Xcode build phases.

3. **SPM plugins shine for pure Swift source generation** (SwiftGen, SwiftProtobuf)
   where the plugin generates `.swift` files that feed into compilation. React
   Native's build steps are fundamentally different — they orchestrate a JS toolchain
   and copy runtime artifacts.

4. **The JS bundle phase could move pre-build** but would lose automatic
   debug/release detection without Xcode build settings. Worth revisiting if SPM
   gains access to build configuration in a future Swift version.

## Alternatives Worth Exploring

- **Xcode Build Tool Plug-ins** (the Xcode-specific variant, not SPM) have access to
  build settings and can run post-build, but require a different packaging model.
- **Move auto-sync to a `prepare` script** in `package.json` so it runs at
  `yarn install` time instead of every build, reducing build-time overhead.
- **Pre-build JS bundling** with the bundle declared as an SPM resource, removing the
  need for a post-build phase entirely (release builds only).
