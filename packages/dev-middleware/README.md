# @react-native/dev-middleware

[![npm]](https://www.npmjs.com/package/@react-native/dev-middleware) [![npm downloads]](https://www.npmjs.com/package/@react-native/dev-middleware)

[npm]: https://img.shields.io/npm/v/@react-native/dev-middleware.svg?color=blue
[npm downloads]: https://img.shields.io/npm/dm/@react-native/dev-middleware.svg

Dev server middleware supporting core React Native development features. This package is preconfigured in all React Native projects.

## Usage

Middleware can be attached to a dev server (e.g. [Metro](https://facebook.github.io/metro/docs/getting-started)) using the `createDevMiddleware` API.

```js
import { createDevMiddleware } from '@react-native/dev-middleware';

function myDevServerImpl(args) {
  ...

  const {middleware, websocketEndpoints} = createDevMiddleware({
    projectRoot: metroConfig.projectRoot,
    serverBaseUrl: new URL(`http://${args.host}:${args.port}`),
    logger,
  });

  await Metro.runServer(metroConfig, {
    host: args.host,
    ...,
    unstable_extraMiddleware: [
      middleware,
      // Optionally extend with additional HTTP middleware
    ],
    websocketEndpoints: {
      ...websocketEndpoints,
      // Optionally extend with additional WebSocket endpoints
    },
  });
}
```

## Included middleware

`@react-native/dev-middleware` is designed for integrators such as [`@expo/dev-server`](https://www.npmjs.com/package/@expo/dev-server) and [`@react-native/community-cli-plugin`](https://github.com/facebook/react-native/tree/main/packages/community-cli-plugin). It provides a common default implementation for core React Native dev server responsibilities.

We intend to keep this to a narrow set of functionality, based around:

- **Debugging** — The [Chrome DevTools protocol (CDP)](https://chromedevtools.github.io/devtools-protocol/) endpoints supported by React Native, including the Inspector Proxy, which facilitates connections with multiple devices.
- **Dev actions** — Endpoints implementing core [Dev Menu](https://reactnative.dev/docs/debugging#accessing-the-dev-menu) actions, e.g. reloading the app, opening the debugger frontend.

### HTTP endpoints

<small>`DevMiddlewareAPI.middleware`</small>

These are exposed as a [`connect`](https://www.npmjs.com/package/connect) middleware handler, assignable to `Metro.runServer` or other compatible HTTP servers.

#### GET `/json/list`, `/json` ([CDP](https://chromedevtools.github.io/devtools-protocol/#endpoints))

Returns the list of available WebSocket targets for all connected React Native app sessions.

#### GET `/json/version` ([CDP](https://chromedevtools.github.io/devtools-protocol/#endpoints))

Returns version metadata used by Chrome DevTools.

#### GET `/debugger-frontend`

Subpaths of this endpoint are reserved to serve the JavaScript debugger frontend.

#### POST `/open-debugger`

Open the JavaScript debugger for a given CDP target. Must be provided with one of the following query params:

- `device`‌ — An ID unique to a combination of device and app, stable across installs. Implemented by `getInspectorDeviceId` on each native platform.
- `target` — The target page ID as returned by `/json/list` for the current dev server session.
- `appId` (deprecated, legacy only) — The application bundle identifier to match (non-unique across multiple connected devices). This param will only match legacy Hermes debugger targets.

<details>
<summary>Example</summary>

    curl -X POST 'http://localhost:8081/open-debugger?target=<targetId>'
</details>

### WebSocket endpoints

<small>`DevMiddlewareAPI.websocketEndpoints`</small>

#### `/inspector/device`

WebSocket handler for registering device connections.

#### `/inspector/debug`

WebSocket handler that proxies CDP messages to/from the corresponding device.

## Experimental features

React Native frameworks may pass an `unstable_experiments` option to `createDevMiddleware` to configure experimental features. Note that these features might not work correctly, and they may change or be removed in the future without notice. Some of the experiment flags available are documented below.

### `unstable_experiments.enableStandaloneFuseboxShell`

Enables launching the debugger frontend in a standalone app shell (provided by the `@react-native/debugger-shell` package) rather than in a browser window. Since React Native 0.83 this defaults to `true`, and may be disabled by explicitly passing `false`.

The shell is powered by a separate binary that is downloaded and cached in the background (immediately after the call to `createDevMiddleware`). If there is a problem downloading or invoking this binary for the first time, the debugger frontend will revert to launching in a browser window until the next time `createDevMiddleware` is called (typically, on the next dev server start).

## Contributing

Changes to this package can be made locally and tested against the `rn-tester` app, per the [Contributing guide](https://reactnative.dev/contributing/overview#contributing-code). During development, this package is automatically run from source with no build step.
