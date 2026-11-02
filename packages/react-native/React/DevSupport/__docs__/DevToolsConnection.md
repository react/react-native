# React Native DevTools (`/inspector/device`)

[🏠 Home](../../../../../__docs__/README.md)

Part of [Bundler Connection (Apple platforms)](./README.md). How the app
registers with Metro so React Native DevTools can attach.

The app registers itself with Metro as a debuggable device, so React Native
DevTools can list it and attach to it. Dev Menu → Open DevTools asks Metro to
open DevTools for this device. While the connection is down, that item reads
"Connect to Metro to debug JavaScript".

`-[RCTDevSettings initialize]` calls
`+[RCTInspectorDevServerHelper connectWithBundleURL:]` (`React/DevSupport/`),
which opens a WebSocket to:

```text
<scheme>://<host:port>/inspector/device?name=<device name>&app=<bundle id>&device=<device id>&profiling=<bool>
```

- The host and scheme come from the bundle URL. The port is the bundle URL's
  port, otherwise the `RCT_METRO_PORT` environment variable, otherwise omitted
  for `https`, otherwise 8081.
- The device ID is a SHA-256 of the vendor identifier, the bundle identifier and
  the debugger mode, so the same app on the same device keeps its ID across
  installs.
- Connections are kept in a static map keyed by URL and reused while connected.
  `initialize` runs for every new instance, so after a reload that changed the
  Metro address, a new connection is opened to the new address.
- Open DevTools (`openDebugger`) sends `POST /open-debugger?device=<device id>`.

> **Example:** an iPhone app with bundle ID `com.example.app` loaded from
> `localhost:8081` connects to
> `http://localhost:8081/inspector/device?name=iPhone&app=com.example.app&device=<sha256>&profiling=false`,
> and Open DevTools sends
> `POST http://localhost:8081/open-debugger?device=<sha256>`.

> [!TIP]
>
> Commands such as reload and debugging travel on different WebSockets
> (`/message` and `/inspector/device`), which are compiled in by different flags
> and don't have to be enabled together. For example, a profiling build has
> React Native DevTools but no `/message` connection, and a build with
> `RCT_DEV_MENU` but without `RCT_DEV` has the Dev Menu's Reload but neither
> connection (see [Build modes](./BuildModes.md)).

The protocol on this socket is described in
[InspectorPackagerConnection](../../../ReactCommon/jsinspector-modern/__docs__/InspectorPackagerConnection.md).
