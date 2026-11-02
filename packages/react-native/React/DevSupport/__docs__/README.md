# Bundler Connection (Apple platforms)

[🏠 Home](../../../../../__docs__/README.md)

When a React Native app on an Apple platform (iOS, tvOS, etc.) is launched, the
native side calculates where to load the JavaScript from: the bundler (Metro)
running on the development machine, or a bundle embedded in the app. In a Debug
build, the app then stays connected to Metro, which enables reloading, Fast
Refresh, opening the Dev Menu from the terminal, and debugging with React Native
DevTools. In a Release build, the app runs the embedded bundle and does not
contact Metro (see [Build modes](./BuildModes.md)).

The app talks to Metro through two kinds of channels:

1. **HTTP**: one-shot requests to check whether Metro is running, download the
   bundle, and open React Native DevTools.
2. **WebSocket**: long-lived connections for Metro's commands (`/message`), Fast
   Refresh (`/hot`), and React Native DevTools (`/inspector/device`).

The details are split into the documents below. File paths are relative to
`packages/react-native/`; paths in examples are relative to the repository root.

| Document                                                               | Covers                                                                                                                                                                             |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Bundle URL](./BundleURL.md)                                           | How the app chooses where its JavaScript comes from, how to point it at a specific Metro, how Metro is found, what the bundle request asks for, and where the current URL is kept. |
| [Downloading and Running the Bundle](./BundleLoading.md)               | Fetching the bundle from Metro or reading it from the app, the loading banner, and load errors.                                                                                    |
| [Reloading and Switching Metro](./Reloading.md)                        | What a reload restarts, what triggers it, how the URL changes between loads, and Configure Bundler.                                                                                |
| [Commands from Metro (`/message`)](./PackagerConnection.md)            | The WebSocket for reload and Dev Menu commands and its message protocol.                                                                                                           |
| [Fast Refresh (`/hot`)](./FastRefresh.md)                              | How Fast Refresh connects to Metro.                                                                                                                                                |
| [React Native DevTools (`/inspector/device`)](./DevToolsConnection.md) | How the app registers with Metro for debugging.                                                                                                                                    |
| [JavaScript Dev Tools That Use Metro](./JavaScriptDevTools.md)         | LogBox symbolication, open in editor, links, split bundles and images.                                                                                                             |
| [Build Modes](./BuildModes.md)                                         | What each build configuration and compile flag enables.                                                                                                                            |

## 🚀 Usage

The app chooses where its JavaScript comes from by implementing `bundleURL` in
the delegate of its `RCTReactNativeFactory`. Typically, Debug builds ask
`RCTBundleURLProvider` for a Metro URL and Release builds use the embedded
`main.jsbundle`. [Bundle URL](./BundleURL.md) describes this, the ways to point
the app at a specific Metro, and how the URL can change.

## 📐 Design

All bundle loading goes through `RCTHost`
(`ReactCommon/react/runtime/platform/ios/ReactCommon/RCTHost.mm`). When the app
starts, or reloads, React Native:

1. Connects to Metro for terminal commands and React Native DevTools.
2. Downloads the bundle while showing "Loading from Metro…" with progress.
3. Runs the bundle, which renders the app, and connects Fast Refresh.

```text
App delegate ── bundleURL (provider block) ──► RCTHost ── RCTBundleManager.bundleURL
                                                  │
                                            RCTInstance._loadJSBundle
                                                  │
         1. moduleForName:"DevSettings" ◄─────────┤
            RCTDevSettings.initialize             │
              ├─ RCTPackagerConnection ──────── WS /message ───────────► Metro  (receives reload and devMenu commands)
              └─ RCTInspectorDevServerHelper ── WS /inspector/device ──► Metro  (connects React Native DevTools)
                                                  │
         2. RCTHost.loadBundleAtURL ◄─────────────┤
            └─ RCTJavaScriptLoader ──────────── GET /<root>.bundle ────► Metro  (downloads the bundle)
                                                  │
         3. _loadJSBundle onComplete ◄────────────┘
            ├─ _loadScriptFromSource                                            (runs the bundle)
            │  └─ ReactInstance::loadScript                                     (runs the app's JavaScript)
            └─ setupHMRClientWithBundleURL
               └─ HMRClient.setup ───────────── WS /hot ───────────────► Metro  (applies hot updates)
```

Each step is described in its own document:
[Downloading and Running the Bundle](./BundleLoading.md),
[Commands from Metro](./PackagerConnection.md),
[React Native DevTools](./DevToolsConnection.md) and
[Fast Refresh](./FastRefresh.md).

### Endpoints

| Endpoint                   | Client                                                                         | Purpose                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /status`              | `RCTBundleURLProvider`                                                         | Is Metro running                                                                                                                                                    |
| `GET /<root>.bundle?…`     | `RCTJavaScriptLoader`                                                          | Bundle download                                                                                                                                                     |
| `GET /<root>/<name>.<ext>` | `RCTBundleURLProvider` resource URLs                                           | Native resources                                                                                                                                                    |
| WS `/message?role=ios`     | `RCTPackagerConnection`                                                        | Reload, Dev Menu, custom                                                                                                                                            |
| WS `/hot`                  | `HMRClient.js`                                                                 | Fast Refresh                                                                                                                                                        |
| WS `/inspector/device?…`   | `RCTCxxInspectorPackagerConnection`                                            | React Native DevTools                                                                                                                                               |
| `POST /open-debugger`      | `RCTInspectorDevServerHelper`                                                  | Open React Native DevTools                                                                                                                                          |
| `POST /symbolicate`        | `symbolicateStackTrace.js` (used by LogBox)                                    | Sends a JavaScript stack trace (`{stack, extraData}`); Metro maps each frame from the bundle back to the original source file, line and column using the source map |
| `POST /open-stack-frame`   | `openFileInEditor.js` (used when a LogBox stack frame or code frame is tapped) | Sends `{file, lineNumber}`; Metro opens that file at that line in the editor on the development machine                                                             |
| `POST /open-url`           | `openURLInBrowser.js`                                                          | Sends `{url}`; Metro opens the URL in the browser on the development machine                                                                                        |

## 🔗 Relationship with other systems

### Part of

- React Native developer tooling on Apple platforms.

### Part of this

- `React/Base/RCTBundleURLProvider`: finds Metro, builds bundle and resource
  URLs, stores the settings.
- `React/Base/RCTBundleManager`: `RCTBundleConfiguration` and the current bundle
  URL shared with native modules.
- `React/Base/RCTJavaScriptLoader`, `RCTMultipartDataTask`,
  `RCTMultipartStreamReader`: download and file loading.
- `React/Base/RCTReloadCommand`: reload listeners and the reload notification.
- `React/Base/RCTDevSupportHttpHeaders`: extra headers for Metro requests.
- `React/DevSupport/RCTPackagerConnection`, `RCTPackagerClient`,
  `Libraries/WebSocket/RCTReconnectingWebSocket`: the `/message` connection.
- `React/DevSupport/RCTInspectorDevServerHelper`: the DevTools connection and
  `/open-debugger`.
- `React/CoreModules/RCTDevSettings`: owns the `/message` connection, starts
  Fast Refresh and the DevTools connection.
- `React/CoreModules/RCTDevMenu`: Reload and Configure Bundler.
- `React/CoreModules/RCTDevLoadingView`: the loading banner.
- `Libraries/Utilities/HMRClient.js`, `Libraries/Core/Devtools/getDevServer.js`:
  the JavaScript side.
- `scripts/react-native-xcode.sh`: the embedded bundle and `ip.txt`.

### Used by this

- Metro and `@react-native/dev-middleware`: serve the endpoints above. See the
  [Inspector proxy protocol](../../../../dev-middleware/src/inspector-proxy/__docs__/README.md).
- `jsinspector-modern`: the DevTools socket protocol and flags (`InspectorFlags`
  adds the DevTools query parameters).
- SocketRocket: WebSocket client.
- `metro-runtime` `HMRClient`: the `/hot` protocol.

### Uses this

- `RCTHost` / `RCTInstance`: get the bundle URL, load the bundle, reload.
- `RCTReactNativeFactory` / `RCTRootViewFactory`: pass the app's bundle URL
  provider and `RCTBundleConfiguration` to `RCTHost`.
- JavaScript dev tools: LogBox symbolication, open in editor, image loading.
