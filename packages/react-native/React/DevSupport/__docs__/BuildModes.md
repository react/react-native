# Build Modes

[🏠 Home](../../../../../__docs__/README.md)

Part of [Bundler Connection (Apple platforms)](./README.md). What each build
configuration and compile flag enables.

| Build            | Flags                                                                                               | JavaScript comes from                                                              | Dev Menu, reload, Fast Refresh, DevTools |
| ---------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| Debug, simulator | `RCT_DEV=1`, `RCT_DEV_MENU=1` (from `DEBUG`)                                                        | Metro on `localhost`. No embedded bundle unless `FORCE_BUNDLING`.                  | Yes                                      |
| Debug, device    | `RCT_DEV=1`, `RCT_DEV_MENU=1` (from `DEBUG`)                                                        | Metro at the development machine's IP; the embedded development bundle without it. | Yes                                      |
| Release          | `RCT_DEV=0`, `RCT_DEV_MENU=0`                                                                       | The embedded production bundle (Hermes bytecode with Hermes).                      | No                                       |
| Profiling        | `RCT_DEV=0`, `REACT_NATIVE_DEBUGGER_MODE_PROD` (→ `RCT_REMOTE_PROFILE=1`, `RCT_ENABLE_INSPECTOR=1`) | The embedded production bundle.                                                    | React Native DevTools only               |

`RCT_DEV` and `RCT_DEV_MENU` are separate flags so that a build can enable the
Dev Menu independently of the rest of the development tooling. By default
`RCT_DEV_MENU` follows `RCT_DEV`, which follows `DEBUG`; only the builds above
have names. Other combinations are custom builds that define the macros
explicitly:

| Combination                          | Flags                                                                 | Result                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev Menu without development tooling | `RCT_DEV=0`, `RCT_DEV_MENU=1`                                         | Dev Menu with Reload and Configure Bundler, and the loading banner. Metro is found only through an explicit `RCT_jsLocation`, checked with `/status`. Fast Refresh works when the bundle comes from Metro, because the `/hot` connection is opened from JavaScript and `RCT_DEV` does not gate it. No `/message` connection, DevTools or Cmd+R.                                   |
| Development tooling without Dev Menu | `RCT_DEV=1`, `RCT_DEV_MENU=0`, `RCT_PACKAGER_LOADING_FUNCTIONALITY=1` | Metro loading with host guessing, the `/message` connection, Fast Refresh and DevTools, without the Dev Menu or loading banner. Fast Refresh stays in its saved state (on by default), since the Dev Menu toggle is unavailable. A saved `RCT_jsLocation` is used without checking. `RCT_PACKAGER_LOADING_FUNCTIONALITY` keeps the `/status` checks that host guessing relies on. |

`scripts/react-native-xcode.sh` produces this during the Xcode build:

- Debug, device: writes `ip.txt` (unless `SKIP_BUNDLING_METRO_IP`) and embeds a
  development bundle (`--dev true`).
- Debug, simulator: embeds nothing unless `FORCE_BUNDLING` is set.
- Release: embeds a production bundle (`--dev false`).
- `SKIP_BUNDLING` skips bundling in any configuration. `ENTRY_FILE`,
  `BUNDLE_NAME`, `BUNDLE_CONFIG` and `BUNDLE_COMMAND` customize the bundle
  command.

> **Example: RNTester "Build JS Bundle" phase**
> (`packages/rn-tester/RNTesterPods.xcodeproj`)
>
> ```sh
> export PROJECT_ROOT="$SRCROOT"
> export ENTRY_FILE="$SRCROOT/js/RNTesterApp.ios.js"
> export SOURCEMAP_FILE=../sourcemap.ios.map
> # export FORCE_BUNDLING=true
>
> WITH_ENVIRONMENT="../react-native/scripts/xcode/with-environment.sh"
> REACT_NATIVE_XCODE="../react-native/scripts/react-native-xcode.sh"
>
> /bin/sh -c "$WITH_ENVIRONMENT $REACT_NATIVE_XCODE"
> ```

> **Example: HelloWorld build command** (`private/helloworld/cli.flow.js`)
>
> `build ios` passes `SKIP_BUNDLING: 'true'` to `xcodebuild`, so
> `react-native-xcode.sh` does not bundle. A separate `bundle ios` command
> writes `main.jsbundle` into the built app's resources.

In the native code, the behavior is controlled by flags in
`React/Base/RCTDefines.h`:

- `RCT_DEV`: `DEBUG`.
- `RCT_DEV_MENU`: `RCT_DEV`.
- `RCT_REMOTE_PROFILE`: `REACT_NATIVE_DEBUGGER_MODE_PROD` if defined (profiling
  builds), otherwise `RCT_DEV`.
- `RCT_ENABLE_INSPECTOR`: `RCT_DEV || RCT_REMOTE_PROFILE`.
- `RCT_PACKAGER_LOADING_FUNCTIONALITY`: opt-in, undefined by default.

| Behavior                                                               | Compiled in when                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `/status` checks                                                       | `RCT_DEV_MENU` or `RCT_PACKAGER_LOADING_FUNCTIONALITY` |
| Dropping a saved `RCT_jsLocation` where Metro does not answer          | `RCT_DEV_MENU`                                         |
| Finding Metro through `ip.txt` or `localhost`                          | `RCT_DEV`                                              |
| `/message` connection, Cmd+R                                           | `RCT_DEV`                                              |
| `RCTDevSettings` (Fast Refresh setup, Metro commands); stubs otherwise | `RCT_DEV_MENU` or `RCT_REMOTE_PROFILE`                 |
| Dev Menu, `devMenu` command, loading banner                            | `RCT_DEV_MENU`                                         |
| DevTools connection, synchronous loading of plain-text file bundles    | `RCT_ENABLE_INSPECTOR`                                 |

Without these flags, `packagerServerHostPort` still returns an explicitly set
`RCT_jsLocation`, unchecked. Apps normally do not call `RCTBundleURLProvider` in
Release, as in the HelloWorld example in
[Bundle URL](./BundleURL.md#choosing-the-bundle).
