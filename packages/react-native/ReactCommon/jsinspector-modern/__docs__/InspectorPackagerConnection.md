# InspectorPackagerConnection

[🏠 Home](../../../../../__docs__/README.md)

`InspectorPackagerConnection` is the shared C++ implementation of the
device-side inspector-proxy protocol, located in
`ReactCommon/jsinspector-modern/`.

## 🚀 Usage

This class handles:

1. **WebSocket connection** to the inspector proxy at `/inspector/device`
2. **Protocol message handling**: `getPages`, `connect`, `disconnect`,
   `wrappedEvent`
3. **Session management**: Routing CDP messages between the proxy and inspector
   targets

### Multi-Debugger Support

The implementation supports multiple concurrent debugger sessions per page via
`sessionId` routing:

- **Incoming `connect`**: Creates a new session keyed by `pageId` + `sessionId`
- **Incoming `wrappedEvent`**: Routes to the specific session by `sessionId`
- **Outgoing `wrappedEvent`**: Includes `sessionId` for proxy routing
- **Capability reporting**: Reports `supportsMultipleDebuggers: true` in page
  capabilities

## 📐 Design

For canonical protocol documentation, see:
**[Inspector Proxy Protocol](../../../../dev-middleware/src/inspector-proxy/__docs__/README.md)**

### Session Data Structure

Sessions are stored in a nested map for efficient page-level operations:

```cpp
std::unordered_map<std::string, std::unordered_map<std::string, Session>> inspectorSessions_;
// pageId → (sessionId → Session)
```

### Compatibility with Legacy Proxies

When connected to a legacy proxy that doesn't send `sessionId`:

- Device treats the connection as a single-session legacy connection
- Device generates an internal session ID for routing
- Device includes `sessionId` in outgoing messages (legacy proxies ignore it)

## 🔗 Relationship with other systems

### Part of

- React Native jsinspector-modern

### Uses this

- **Inspector Proxy** (`dev-middleware/src/inspector-proxy/`) - The Node.js
  proxy that this connects to
- **Platform delegates** - iOS (`RCTInspectorDevServerHelper.mm`), Android
  (`DevServerHelper.kt`), ReactCxxPlatform (`Inspector.cpp`) provide WebSocket
  I/O

### Used by this

- **IInspector** - The inspector instance for page registration and connection
- **HostTarget / InstanceTarget / RuntimeTarget** - The CDP targets that handle
  debugger sessions
