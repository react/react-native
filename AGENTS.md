# React Native

A framework for building native applications using React.

This file provides guidance for coding agents working in this repository.

## Repo structure

React Native is a monorepo: the `react-native` package, the packages published alongside it, and the apps and tooling used to develop them.

| Path | Contents |
| --- | --- |
| `packages/react-native/Libraries` | JavaScript source (Flow) — the legacy location, with code gradually moving to `src/private` |
| `packages/react-native/src/private` | JavaScript source (Flow) |
| `packages/react-native/ReactCommon` | Shared C++ — Fabric renderer, TurboModules, JSI, Yoga, `jsinspector-modern` |
| `packages/react-native/ReactAndroid` | Android runtime (Kotlin, Java, JNI) |
| `packages/react-native/{React,ReactApple}` | Apple runtime (Objective-C++, Swift) |
| `packages/rn-tester` | RNTester — test app showcasing each core component and API, plus a `Playground` scratch surface |
| `packages/*` | Other published packages — Metro config, Codegen, ESLint config, dev-middleware, React Native DevTools frontend |
| `private/*` | Unpublished — the `helloworld` sample app, the `react-native-fantom` test runner |
| `scripts/*` | Repository tooling — build, test, release, and CI scripts |

Architecture notes live in `__docs__` directories beside the code they describe, indexed by [`__docs__/README.md`](__docs__/README.md). Treat them as reference for the subsystem you are working in, not as required reading.

## Common commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `yarn test <path>` | Jest unit tests, found in `__tests__` directories |
| `yarn fantom <path>` | [Fantom](private/react-native-fantom/__docs__/README.md) integration tests, named `*-itest.js` |
| `yarn lint` | ESLint |
| `yarn format` | Prettier and clang-format |
| `yarn flow-check` | Flow |
| `yarn start`, `yarn android` | Metro, and RNTester on Android. See [RNTester](packages/rn-tester/README.md) for iOS |

Native builds use Gradle on Android, and CocoaPods or Swift Package Manager on iOS. See [Building from source](https://reactnative.dev/contributing/how-to-build-from-source).

## Gotchas

- JavaScript sources are typed with Flow, and the public API is exported from `packages/react-native/index.js`. TypeScript types are generated from those sources, and `packages/react-native/ReactNativeApi.d.ts` is a committed snapshot of that API — run `yarn build-types` to regenerate both whenever the public API changes.
- The public native API is snapshotted as well: C++ under `scripts/cxx-api` (`yarn cxx-api-build`), and Android in `packages/react-native/ReactAndroid/api/ReactAndroid.api`. CI validates both.
- Native modules and components are declared by JavaScript specs (`Native*.js`, `*NativeComponent.js`), from which their native counterparts are generated. Do not hand-edit generated code.
- `CHANGELOG.md` is compiled at release time. Changelog entries belong in the pull request description.

## Contributing guidelines

- Keep each change focused — no unrelated refactors, formatting, or dependency updates.
- Complete the pull request template — the motivation and the user-visible effect, and a [changelog entry](https://reactnative.dev/contributing/changelogs-in-pull-requests) with its category and type tags.
- In the test plan, give the exact commands you ran and their results, plus screenshots or a video for user-interface changes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full process, including how to report bugs.
