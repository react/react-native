# Reloading and Switching Metro

[🏠 Home](../../../../../__docs__/README.md)

Part of [Bundler Connection (Apple platforms)](./README.md). What a reload does,
what triggers it, and how the bundle URL can change between loads.

A reload discards the JavaScript instance, asks the app for the bundle URL
again, and loads it from scratch. The native app process keeps running:
`RCTHost` invalidates the JavaScript runtime, creates a new `RCTInstance`, and
restarts the React Native surfaces (root views) already on screen. Reloads are
triggered by:

- Cmd+R in the simulator and Mac Catalyst.
- Dev Menu → Reload.
- `r` in the Metro terminal (the `reload` message on `/message`).
- `DevSettings.reload()` in JavaScript.
- React Native DevTools.

These go through `RCTTriggerReloadCommandListeners`
(`React/Base/RCTReloadCommand`) to `-[RCTHost didReceiveReloadCommand]`. React
Native DevTools calls that method directly.

On reload, `RCTHost` passes the provider's URL to `_setBundleURL:` and creates a
new `RCTInstance`. `_setBundleURL:` replaces the current URL only when the URL
it receives differs from the previous one it received, whether that came from
the provider or from the setter. As a result:

- Each reload looks for Metro again. An app that started from the embedded
  bundle switches to Metro once Metro is running, and back to the embedded
  bundle when Metro is gone.
- A URL set with `bundleManager.bundleURL = url` lasts until the provider
  returns a different URL. The Dev Menu reloads right after setting a custom
  entry point, so the provider's URL replaces that entry point. The host and
  port survive because they are saved in `RCT_jsLocation`, which the provider
  reads.
- A URL from `RCTBundleConfiguration` overrides both, so neither the provider
  nor the setter changes what is loaded.

Dev Menu → Configure Bundler (`React/CoreModules/RCTDevMenu`) asks for a host, a
port (default `RCT_METRO_PORT`) and an entry point:

- Apply Changes: saves `host:port` as `jsLocation`. Then it sets
  `bundleManager.bundleURL` for the entry point, or calls `resetBundleURL` if
  the entry point is empty, and reloads.
- Reset to Default, or Apply Changes with an empty host and port: calls
  `resetToDefaults`, sets `bundleManager.bundleURL` to the embedded bundle
  (`file:///.../main.jsbundle`), and reloads. `resetToDefaults` restores only
  `RCT_enableDev` and `RCT_enableMinification`; a saved `RCT_jsLocation` is
  kept.

> **Example:** entering host `192.168.1.5`, port `8081` and entry point `index`
> saves `192.168.1.5:8081` as `jsLocation`, reconnects the `/message` connection
> to that address, and, if Metro answers there, reloads from
> `http://192.168.1.5:8081/index.bundle?platform=ios&...`.
