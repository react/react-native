# React Native Technical Documentation

The React Native technical documentation describes how React Native works
internally, the subsystems it is composed of, how they work and how they
interact with each other.

The intended audience is people who want to learn about the internals of React
Native and contribute to it. **End users of React Native are meant to use the
[public website](https://reactnative.dev) instead** (its code can be found
[here](https://github.com/facebook/react-native-website)).

For details on how we approach technical documentation in this repository, see
[GUIDELINES.md](./GUIDELINES.md).

## 🚀 Usage

This repository is not meant to be consumed directly by end users. Instead, it
creates several packages that are published to the NPM registry for direct
consumption by end users and frameworks.

This repository uses a monorepo approach, and public packages can be found in
the [`packages`](../packages/) directory (the ones that do not contain
`"private": true` in their `package.json` file).

The most important package is the
[`react-native`](https://www.npmjs.com/package/react-native) package, located in
[`packages/react-native`](../packages/react-native), which contains the public
JavaScript API.

This repository provides the Android and iOS versions of React Native. Versions
for other platforms are maintained in their own repositories.

## 📐 Design

TODO: Explain the different components of React Native at a high level.

## 🔗 Relationship with other systems

### Part of this

- Runtime
  - Cross-platform
    - [Feature Flags](../packages/react-native/src/private/featureflags/__docs__/README.md)
    - Host / Instance / Bridgeless
    - UI / Fabric
      - Events
      - Shadow Tree Lifecycle
        - [Runtime Shadow Node Reference Update](../packages/react-native/ReactCommon/react/renderer/core/__docs__/RSNRU.md)
        - [passChildrenWhenCloningPersistedNodes](../packages/react-native/ReactCommon/react/renderer/core/__docs__/passChildrenWhenCloning.md)
      - Layout
      - Mounting
      - [Animation Backend](../packages/react-native/ReactCommon/react/renderer/animationbackend/__docs__/AnimationBackend.md)
    - Native Modules / TurboModules
    - JS Runtime
      - [Event Loop](../packages/react-native/ReactCommon/react/renderer/runtimescheduler/__docs__/README.md)
      - Globals and environment setup
      - Error handling
    - Developer Tools
      - React Native DevTools
        - Infrastructure
          - [Inspector proxy protocol](../packages/dev-middleware/src/inspector-proxy/__docs__/README.md)
      - LogBox
    - Misc
      - Web APIs
        - DOM Traversal & Layout APIs
        - [IntersectionObserver](../packages/react-native/src/private/webapis/intersectionobserver/__docs__/README.md)
        - [MutationObserver](../packages/react-native/src/private/webapis/mutationobserver/__docs__/README.md)
        - Performance & PerformanceObserver
        - Timers
  - Platform-specific
    - Host Platform Interface
  - Android
    - UI
      - [Events](../packages/react-native/ReactAndroid/src/main/java/com/facebook/react/fabric/events/__docs__/README.md)
      - Mounting
  - iOS
    - UI
      - Events
      - Mounting
- Build system
  - Android
  - iOS
  - C++
  - JavaScript
    - Metro
- Testing
  - Android
  - iOS
  - C++
  - JavaScript
    - Flow
    - TypeScript
    - Jest
    - ESLint
  - Integration / E2E
    - [Fantom](../private/react-native-fantom/__docs__/README.md)

### Used by this

This repository has many different types of dependencies: build systems,
external packages to be used during development, external packages used at
runtime, etc.

### Uses this

The main use cases for this repository are:

1. Developing React Native itself.
2. Testing and releasing React Native.
3. Synchronizing forks like `react-native-windows` and `react-native-macos`.
