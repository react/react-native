# Node-API

[🏠 Home](../../../../../../../__docs__/README.md)

This directory contains the native module behind `react-native/node-api`, which
loads [Node-API](https://nodejs.org/api/n-api.html) addons into the JS runtime
using the engine's own Node-API implementation.

## 🚀 Usage

```js
import {dlopen} from 'react-native/node-api';

const module = {exports: {}};
dlopen(module, 'libmy_addon.so'); // Android
dlopen(module, '@rpath/my_addon.framework/my_addon'); // iOS
module.exports.hello();
```

`dlopen` behaves like Node's
[`process.dlopen`](https://nodejs.org/api/process.html#processdlopenmodule-filename-flags):
it sets `module.exports` and caches nothing. `filename` is passed to the
system's `dlopen` as is, so how addons are named, laid out and cached is up to
the caller.

## 📐 Design

- `NativeNodeApi` is the `NativeNodeApiCxx` TurboModule. Each `dlopen` call
  creates a new `napi_env`, loads the addon into it and hands its exports to
  JSI.
- `NodeApiEngine` is the part that depends on the engine's embedder API:
  creating an env and loading an addon. `HermesNodeApiEngine` implements it with
  `hermes_napi_create_env` and `hermes_napi_load_module`.
- `NodeApiHost` is what the engine needs from React Native: a worker pool for
  `napi_queue_async_work`, dispatch onto the JS thread (through the
  `CallInvoker`) for thread-safe functions, and routing `napi_fatal_exception`
  to `ErrorUtils.reportFatalError`.

`HermesInstance` registers the module with `registerCxxModuleToGlobalModuleMap`
when it creates a runtime, so it's only available when Hermes is the engine.
Otherwise `react-native/node-api` throws.

Each env is owned by its runtime and torn down with it, which runs the addon's
env cleanup hooks. Hermes can read the host's callbacks during that teardown, so
hosts are kept alive for the lifetime of the process.

Addons compile against the Node-API headers Hermes vendors from Node.js
(`include/hermes/napi`) and link against the engine. The engine's embedder API
(`hermes_napi.h`) is only used here, not by addons.

## ⚙️ Building without Node-API

Apps that don't load addons can leave Node-API out of React Native and Hermes:

- Android: `disableNodeApi=true` (or `react.disableNodeApi=true`) as a Gradle
  property.
- iOS: `RCT_DISABLE_NODE_API=1` when running `pod install`, or when resolving
  the Swift package.

This defines `RCT_DISABLE_NODE_API`, which leaves out the module and its
registration, and builds Hermes with `HERMES_ENABLE_NAPI=OFF`. It only takes
effect when React Native and Hermes are built from source: prebuilt artifacts
always include Node-API. `react-native/node-api` throws in apps built without
it.

## 🔗 Relationship with other systems

### Part of

- Native Modules / TurboModules

### Uses this

- RNTester's Node-API example (`packages/rn-tester/NodeApiExample`)
