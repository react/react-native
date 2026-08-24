# React Native

A framework for building native applications using React.

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

## Environment

- Yarn v1, pinned via `packageManager`. Run commands from the repository root.
- JavaScript work — lint, type checks, Jest, Metro — needs only Node and Yarn, on any platform.
- Native builds need a platform toolchain: Xcode with CocoaPods or Swift Package Manager for iOS (macOS only), and the Android SDK and NDK with Gradle for Android. See [Building from source](https://reactnative.dev/contributing/how-to-build-from-source).

## Common commands

| Command | Purpose |
| --- | --- |
| `yarn test <path>` | Jest unit tests, found in `__tests__` directories |
| `yarn fantom <path>` | [Fantom](private/react-native-fantom/__docs__/README.md) integration tests, named `*-itest.js` — builds a native tester on first run |
| `yarn lint` | ESLint (`--max-warnings 0`) |
| `yarn flow-check` | Flow |
| `yarn format` | Prettier and clang-format (`yarn format-check` for Prettier only) |

JavaScript CI is the `lint`, `test_js`, and `build_js_types` jobs in [`.github/workflows/test-all.yml`](.github/workflows/test-all.yml); Fantom and the native platforms have their own jobs.

### Verification: Running RNTester

Needed only for changes that have to be seen running, such as user interface behavior.

`yarn start` serves [RNTester](packages/rn-tester/README.md) over Metro at `http://localhost:8081`; `yarn android` builds and installs it on Android. Check the bundler with `curl "http://localhost:8081/js/RNTesterApp.bundle?platform=ios&dev=true"`.

## Gotchas

- `yarn install` dirties the working tree: a `preinstall` hook (`scripts/try-set-hermes-compiler-prebuilt.js`) resolves the `hermes-compiler` placeholder in `packages/react-native/package.json` (`0.0.0` → a real version) and touches `yarn.lock`. Expected — do not commit it.
- Metro cannot bundle until codegen is built once — `yarn --cwd packages/react-native-codegen build`. Without it, bundling fails with `Cannot find module '@react-native/codegen/lib/parsers/flow/parser'`. Every other package runs from source — `yarn build` is not needed for development (see [`scripts/build/README.md`](scripts/build/README.md)).

## Generated code

Never hand-edit generated output — change the source and regenerate. CI validates the committed snapshots.

- Native modules and components are declared by JavaScript specs (`Native*.js`, `*NativeComponent.js`); their native counterparts are generated at build time.
- Feature flags are declared in `packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js`; `yarn featureflags` regenerates the JavaScript, Java, and C++ accessors.
- JavaScript sources are typed with Flow, and the public API is exported from `packages/react-native/index.js`. TypeScript types are generated from those sources, and `packages/react-native/ReactNativeApi.d.ts` is a committed snapshot of that API — run `yarn build-types` to regenerate both whenever the public API changes, then `yarn test-generated-typescript` to type-check the result.
- The public native API is snapshotted as well: C++ under `scripts/cxx-api` (`yarn cxx-api-build`), and Android in `packages/react-native/ReactAndroid/api/ReactAndroid.api`.
- `CHANGELOG.md` is compiled at release time from pull request descriptions.

## Contributing guidelines

- Keep each change focused — no unrelated refactors, formatting, or dependency updates.
- Complete the pull request template — the motivation and the user-visible effect, and a [changelog entry](https://reactnative.dev/contributing/changelogs-in-pull-requests) with its category and type tags.
- In the test plan, give the exact commands you ran and their results, plus screenshots or a video for user-interface changes. Say which checks you could not run.

The full process is on [reactnative.dev](https://reactnative.dev/contributing/overview).
