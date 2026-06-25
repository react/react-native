# Inspector Proxy Protocol

[🏠 Home](../../../../../__docs__/README.md)

The inspector-proxy protocol facilitates Chrome DevTools Protocol (CDP) target
discovery and communication between **debuggers** (e.g., Chrome DevTools, VS
Code) and **devices** (processes containing React Native hosts). The proxy
multiplexes connections over a single WebSocket per device, allowing multiple
debuggers to connect to multiple pages on the same device.

## 🚀 Usage

### Target Discovery (HTTP)

We implement a subset of the
[Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)'s
[HTTP endpoints](https://chromedevtools.github.io/devtools-protocol/#:~:text=a%20reconnect%20button.-,HTTP%20Endpoints,-If%20started%20with)
to allow debuggers to discover targets.

| Endpoint                    | Description              |
| --------------------------- | ------------------------ |
| `GET /json` or `/json/list` | List of debuggable pages |
| `GET /json/version`         | Protocol version info    |

### Device Registration (WebSocket)

Devices register themselves with the proxy by connecting to `/inspector/device`:

```text
ws://{host}/inspector/device?device={id}&name={name}&app={bundle_id}&profiling={true|false}
```

| Parameter   | Required | Description                                                  |
| ----------- | -------- | ------------------------------------------------------------ |
| `device`    | No\*     | Logical device identifier. Auto-generated if omitted.        |
| `name`      | No       | Human-readable device name. Defaults to "Unknown".           |
| `app`       | No       | App bundle identifier. Defaults to "Unknown".                |
| `profiling` | No       | "true" if this is a profiling build. (Used for logging only) |

\*Recommended for connection persistence across app restarts.

#### Requirements for the `device` parameter

The intent of the logical device ID is to help with target discovery and
especially *re*discovery - to reduce the number of times users need to
explicitly close and restart the debugger frontend (e.g. after an app crash).

If provided, the logical device ID:

1. SHOULD be stable for the current combination of physical device (or emulator
   instance) and app.
2. SHOULD be stable across installs/launches of the same app on the same device
   (or emulator instance), though it MAY be user-resettable (so as to not
   require any special privacy permissions).
3. MUST be unique across different apps on the same physical device (or
   emulator).
4. MUST be unique across physical devices (or emulators).
5. MUST be unique for each concurrent _instance_ of the same app on the same
   physical device (or emulator).

NOTE: The uniqueness requirements are stronger (MUST) than the stability
requirements (SHOULD). In particular, on platforms that allow multiple instances
of the same app to run concurrently, requirements 1 and/or 2 MAY be violated in
order to meet requirement 5. This is relevant, for example, on desktop
platforms.

### Debugger Connection (WebSocket)

Debuggers connect to `/inspector/debug` to form a CDP session with a page:

```text
ws://{host}/inspector/debug?device={device_id}&page={page_id}
```

Both `device` and `page` query parameters are required.

## 📐 Design

### Architecture

```text
┌─────────────────┐     ┌─────────────────────────┐     ┌────────────────┐
│    Debugger     │────▶│    Inspector Proxy      │◀────│     Device     │
│ (Chrome/VSCode) │     │      (Node.js)          │     │ (iOS/Android)  │
└─────────────────┘     └─────────────────────────┘     └────────────────┘
   WebSocket               HTTP + WebSocket               WebSocket
   /inspector/debug        /json, /json/list              /inspector/device
                           /json/version
```

### Device ↔ Proxy Protocol

All messages are JSON-encoded WebSocket text frames:

```typescript
interface Message {
  event: string;
  payload?: /* depends on event */;
}
```

#### Proxy → Device Messages

| Event          | Payload                                                       | Description                                   |
| -------------- | ------------------------------------------------------------- | --------------------------------------------- |
| `getPages`     | _(none)_                                                      | Request current page list. Sent periodically. |
| `connect`      | `{ pageId: string, sessionId: string }`                       | Prepare for debugger connection to page.      |
| `disconnect`   | `{ pageId: string, sessionId: string }`                       | Terminate debugger session for page.          |
| `wrappedEvent` | `{ pageId: string, sessionId: string, wrappedEvent: string }` | Forward CDP message (JSON string) to page.    |

#### Device → Proxy Messages

| Event          | Payload                                                        | Description                                           |
| -------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| `getPages`     | `Page[]`                                                       | Current list of inspectable pages.                    |
| `disconnect`   | `{ pageId: string, sessionId?: string }`                       | Notify that page disconnected or rejected connection. |
| `wrappedEvent` | `{ pageId: string, sessionId?: string, wrappedEvent: string }` | Forward CDP message (JSON string) from page.          |

#### Page Object

```typescript
interface Page {
  id: string; // Unique page identifier (typically numeric string)
  title: string; // Display title
  app: string; // App bundle identifier
  description?: string; // Additional description
  capabilities?: {
    nativePageReloads?: boolean; // Target keeps the socket open across reloads
    nativeSourceCodeFetching?: boolean; // Target supports Network.loadNetworkResource
    supportsMultipleDebuggers?: boolean; // Supports concurrent debugger sessions
  };
}
```

**Note**: The value of `supportsMultipleDebuggers` SHOULD be consistent across
all pages for a given device.

### Connection Lifecycle

**Device Registration:**

```text
Device                              Proxy
   │                                  │
   │──── WS Connect ─────────────────▶│
   │     /inspector/device?...        │
   │                                  │
   │◀──── getPages ───────────────────│  (periodically)
   │                                  │
   │───── getPages response ─────────▶│
   │      (page list)                 │
```

**Debugger Session:**

```text
Debugger            Proxy                        Device
   │                  │                            │
   │── WS Connect ───▶│                            │
   │   ?device&page   │── connect ────────────────▶│
   │                  │   {pageId, sessionId}      │
   │                  │                            │
   │── CDP Request ──▶│── wrappedEvent ───────────▶│
   │                  │   {pageId, sessionId,      │
   │                  │    wrappedEvent}           │
   │                  │                            │
   │                  │◀── wrappedEvent ───────────│
   │◀── CDP Response ─│   {pageId, sessionId,      │
   │                  │    wrappedEvent}           │
   │                  │                            │
   │── WS Close ─────▶│── disconnect ─────────────▶│
   │                  │   {pageId, sessionId}      │
```

**Connection Rejection:**

If a device cannot accept a `connect` (e.g., page doesn't exist), it should send
a `disconnect` back to the proxy for that `pageId`.

### Connection Semantics

#### Multi-Debugger Support

Multiple debuggers can connect simultaneously to the same page when **both** the
proxy and device support session multiplexing:

1. **Session IDs**: The proxy assigns a unique, non-empty `sessionId` to each
   debugger connection. All messages include this `sessionId` for routing. This
   SHOULD be a UUID or other suitably unique and ephemeral identifier.

2. **Capability Detection**: Devices report `supportsMultipleDebuggers: true` in
   their page capabilities to indicate session support.

3. **Backwards Compatibility**: Legacy devices ignore `sessionId` fields in
   incoming messages and don't include them in responses.

#### Connection Rules

1. **Session-Capable Device**: Multiple debuggers can connect to the same page
   simultaneously. Each connection has an independent session.

2. **Legacy Device (no `supportsMultipleDebuggers`)**: New debugger connections
   to an already-connected page disconnect the existing debugger. The proxy MUST
   NOT allow multiple debuggers to connect to the same page.

3. **Device Reconnection**: If a device reconnects with the same `device` ID
   while debugger connections to the same logical device are open in the proxy,
   the proxy may attempt to preserve active debugger sessions by forwarding them
   to the new device.

### WebSocket Close Reasons

The proxy uses specific close reasons that DevTools frontends may recognize:

| Reason                  | Context                                 |
| ----------------------- | --------------------------------------- |
| `[PAGE_NOT_FOUND]`      | Debugger connected to non-existent page |
| `[CONNECTION_LOST]`     | Device disconnected                     |
| `[RECREATING_DEVICE]`   | Device is reconnecting                  |
| `[NEW_DEBUGGER_OPENED]` | Another debugger took over this page    |
| `[UNREGISTERED_DEVICE]` | Device ID not found                     |
| `[INCORRECT_URL]`       | Missing device/page query parameters    |

### PageDescription (HTTP Response)

The `/json` endpoint returns enriched page descriptions based on those reported
by the device.

```typescript
interface PageDescription {
  // Used for target selection
  id: string; // "{deviceId}-{pageId}"

  // Used for display
  title: string;
  description: string;
  deviceName: string;

  // Used for target matching
  appId: string;

  // Used for debugger connection
  webSocketDebuggerUrl: string;

  // React Native-specific metadata
  reactNative: {
    logicalDeviceId: string; // Used for target matching
    capabilities: {
      nativePageReloads?: boolean; // Used for target filtering
    };
  };
}
```

## 🔗 Relationship with other systems

### Part of this

- **Device.js** - Per-device connection handler in the proxy
- **InspectorProxy.js** - Main proxy HTTP/WebSocket server

### Used by this

- **Chrome DevTools Protocol (CDP)** - The wrapped messages are CDP messages
  exchanged between DevTools frontends and JavaScript runtimes.
- **WebSocket** - Transport layer for device and debugger connections.

### Uses this

- **InspectorPackagerConnection (C++)** - Shared device-side protocol
  implementation in `ReactCommon/jsinspector-modern/`.
- **Platform layers** - iOS (`RCTInspectorDevServerHelper.mm`), Android
  (`DevServerHelper.kt`), and ReactCxxPlatform (`Inspector.cpp`) provide
  WebSocket I/O and threading.
- **openDebuggerMiddleware** - Uses `/json` to discover targets for the
  `/open-debugger` endpoint.
- **OpenDebuggerKeyboardHandler** - Uses `/json` to display target selection in
  the CLI.

---

## Legacy Features

The following features exist for backward compatibility with older React Native
targets that lack modern capabilities. New implementations should set
appropriate capability flags and may ignore this section.

### Synthetic Reloadable Page (Page ID `-1`)

For targets without the `nativePageReloads` capability, the proxy exposes a
synthetic page with ID `-1` titled "React Native Experimental (Improved Chrome
Reloads)". Debuggers connecting to this page are automatically redirected to the
most recent React Native page, surviving page reloads.

When a new React Native page appears while a debugger is connected to `-1`:

1. Proxy sends `disconnect` for the old page, `connect` for the new page
2. Proxy sends `Runtime.enable` and `Debugger.enable` CDP commands to the new
   page
3. When `Runtime.executionContextCreated` is received, proxy sends
   `Runtime.executionContextsCleared` to debugger, then `Debugger.resume` to
   device

### URL Rewriting

For targets without the `nativeSourceCodeFetching` capability, the proxy
rewrites URLs in CDP messages:

- **Debugger.scriptParsed** (device → debugger): Device-relative URLs are
  rewritten to debugger-relative URLs
- **Debugger.setBreakpointByUrl** (debugger → device): URLs are rewritten back
  to device-relative form
- **Debugger.getScriptSource**: Intercepted and handled by proxy via HTTP fetch
- **Network.loadNetworkResource**: Returns CDP error (code -32601) to force
  frontend fallback

Additionally, if a script URL matches `^[0-9a-z]+$` (alphanumeric ID), the proxy
prepends `file://` to ensure Chrome downloads source maps.

### Legacy Reload Notification

For targets without `nativePageReloads`, when a `disconnect` event is received
for a page, the proxy sends `{method: 'reload'}` to the connected debugger to
signal a page reload.
