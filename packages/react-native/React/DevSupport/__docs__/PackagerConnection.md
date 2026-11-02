# Commands from Metro (`/message`)

[🏠 Home](../../../../../__docs__/README.md)

Part of [Bundler Connection (Apple platforms)](./README.md). The WebSocket that
carries reload and Dev Menu commands from Metro.

In the Metro terminal, `r` reloads the app and `d` opens the Dev Menu. Metro
sends these commands over a WebSocket that the app keeps open to `/message`.
`RCTPackagerConnection` (`React/DevSupport/`) is that connection.

- Each `RCTDevSettings` instance (`React/CoreModules/`) owns one and opens it in
  `initialize`. Every reload creates a new `RCTDevSettings`, and with it a new
  connection.
- URL: `<scheme>://<host>:<port>/message?role=ios` (`role` is `ios` on every
  Apple platform, like `platform` in the bundle URL). The host and scheme come
  from `bundleConfig.getPackagerServerHost` / `getPackagerServerScheme`: the
  `RCTBundleConfiguration` values if set, otherwise `RCTBundleURLProvider`
  (`packagerServerHostPort`, `packagerScheme`). Missing parts default to
  `localhost`, `http` and `RCT_METRO_PORT`. The host is resolved separately from
  the bundle URL, so an app whose bundle URL does not come from
  `RCTBundleURLProvider` still connects to the provider's host.
- If Metro restarts, `RCTReconnectingWebSocket` (`Libraries/WebSocket/`, on
  SocketRocket) reconnects 2 s after the socket closes or fails. It stops
  retrying when the connection is refused; the next reload creates a new
  connection.
- The connection follows a new Metro address when
  `RCTBundleURLProviderUpdatedNotification` (posted by every
  `RCTBundleURLProvider` setter) or `RCTTriggerReloadCommandNotification`
  arrives and the `host:port` or scheme changed. These observers run on the main
  queue, and resolving the host may perform a synchronous `/status` check.
- Messages are JSON with `version: 2`, `method`, `params` and an optional `id`
  (`RCTPackagerClient`):
  - Without `id`: a notification, delivered to every handler for `method`.
  - With `id`: a request, delivered to the last registered handler, which
    replies through `RCTPackagerClientResponder` with
    `{version, id, result | error}`. A request without a handler gets an error
    reply.
- `RCTDevSettings` handles `reload` (calls `RCTTriggerReloadCommandListeners`)
  and `devMenu` (shows the Dev Menu). Native code can add its own commands with
  `RCTDevSettings` `addNotificationHandler:` / `addRequestHandler:`, and run
  code once connected with `RCTPackagerConnection` `addConnectedHandler:`.

> **Example:** with Metro on `localhost:8081`, the connection URL is
> `http://localhost:8081/message?role=ios`. SocketRocket opens it as a
> WebSocket. Pressing `r` in the Metro terminal sends a message with
> `"version": 2` and `"method": "reload"` and no `id`, so every `reload` handler
> runs.
