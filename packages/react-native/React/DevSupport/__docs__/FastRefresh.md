# Fast Refresh (`/hot`)

[🏠 Home](../../../../../__docs__/README.md)

Part of [Bundler Connection (Apple platforms)](./README.md). How Fast Refresh
connects to Metro after the bundle loads.

When a source file is saved, Metro pushes the changed modules over a WebSocket
to `/hot`, and Fast Refresh applies them without reloading the app.

After a successful load from Metro,
`-[RCTDevSettings setupHMRClientWithBundleURL:]` calls the JavaScript
`HMRClient.setup(platform, bundlePath, host, port, isEnabled, scheme)`
(`Libraries/Utilities/HMRClient.js`), which opens `<scheme>://<host:port>/hot`
through `metro-runtime`. Unlike `/message`, this connection always goes to the
Metro the bundle actually came from. It is set up again after every load, so it
follows a Metro address change after a reload.

- Dev Menu → Enable/Disable Fast Refresh calls `setHotLoadingEnabled:`. That
  saves `hotLoadingEnabled` (on by default) and calls `HMRClient.enable()` /
  `HMRClient.disable()`.
- Bundles that JavaScript loads later (`loadBundleFromServer`) are registered
  with `HMRClient.registerBundle`, so their modules refresh too. Native code
  registers its additional bundles with
  `setupHMRClientWithAdditionalBundleURL:`.
