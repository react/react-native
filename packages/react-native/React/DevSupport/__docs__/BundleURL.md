# Bundle URL

[🏠 Home](../../../../../__docs__/README.md)

Part of [Bundler Connection (Apple platforms)](./README.md). How the app decides
where its JavaScript comes from, how to point it at a specific Metro, and where
the current URL is kept.

## Choosing the bundle

The app tells React Native where its JavaScript comes from by implementing
`bundleURL` in the delegate of its `RCTReactNativeFactory`, usually the app's
`AppDelegate` or `SceneDelegate`. The factory passes that method to the
`RCTRootViewFactory` it creates (as the `bundleURLBlock` of
`RCTRootViewFactoryConfiguration`), which hands it to `RCTHost` as the provider
of the bundle URL. Typically, Debug builds ask `RCTBundleURLProvider` for a
Metro URL and Release builds use the embedded bundle.

> **Example: HelloWorld**
> (`private/helloworld/ios/HelloWorld/SceneDelegate.swift`)
>
> ```swift
> override func bundleURL() -> URL? {
>   #if DEBUG
>   RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
>   #else
>   Bundle.main.url(forResource: "main", withExtension: "jsbundle")
>   #endif
> }
> ```

The app names only the entry point (`index` for `index.js`).
`RCTBundleURLProvider` looks for a running Metro and turns the entry point into
a full bundle URL.

> **Example:** entry point `index` on an iPhone connected to Metro at
> `192.168.1.5`:
>
> ```text
> http://192.168.1.5:8081/index.bundle?platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&app=com.example.app
> ```
>
> Without a running Metro, the same entry point resolves to
> `file:///.../main.jsbundle` inside the app.

If Metro is not running, `jsBundleURLForBundleRoot:` returns the bundle embedded
in the app instead. React Native looks for it as `main.jsbundle`, the name the
build uses by default. If there is no embedded bundle either, loading fails with
"No script URL provided".

> **Example: RNTester** (`packages/rn-tester/RNTester/SceneDelegate.mm`)
>
> RNTester relies on this fallback instead of an `#if DEBUG` branch. It always
> passes the path of its entry file (`js/RNTesterApp.ios`) to
> `RCTBundleURLProvider`. When no Metro answers, as in Release builds, React
> Native returns the embedded `main.jsbundle` instead of a Metro URL.
>
> ```objc
> static NSString *const kBundlePath = @"js/RNTesterApp.ios";
>
> - (NSURL *)bundleURL
> {
>   return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:kBundlePath];
> }
> ```

The Metro URL is not fixed for the lifetime of the app. React Native calls
`bundleURL` again on every reload, so the result changes when Metro starts or
stops, or when its address is reconfigured (see
[Reloading and switching Metro](./Reloading.md)).

## Pointing the app at Metro

| To                                       | Use                                                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Change the default port                  | The `RCT_METRO_PORT` build setting (8081 by default).                                                                                                                                |
| Run on a physical device                 | No configuration required: Debug device builds record the development machine's IP in `ip.txt` (`scripts/react-native-xcode.sh`).                                                    |
| Use a specific Metro for one launch      | The launch argument `-RCT_jsLocation host:port`. It is used without checking that Metro answers.                                                                                     |
| Change Metro from inside the app         | Dev Menu → Configure Bundler, or `RCTBundleURLProvider.jsLocation`. Saved across launches.                                                                                           |
| Use HTTPS                                | `RCTBundleURLProvider.packagerScheme`, or `-RCT_packager_scheme https`.                                                                                                              |
| Ask Metro for a different kind of bundle | `enableDev`, `enableMinification`, `inlineSourceMap` (defaults `YES`, `NO`, `NO`).                                                                                                   |
| Always use a fixed Metro or bundle file  | `RCTReactNativeFactory.bundleConfiguration` (`RCTBundleConfiguration`). Overrides `bundleURL`.                                                                                       |
| Load the bundle with custom code         | `RCTHostDelegate loadBundleAtURL:onProgress:onComplete:`.                                                                                                                            |
| Modify the bundle download request       | `RCTSetCustomMultipartDataTaskRequestInterceptor`.                                                                                                                                   |
| Send extra HTTP headers to Metro         | `RCTDevSupportHttpHeaders`. Applies to status checks, `/message` and DevTools, not the bundle download.                                                                              |
| Never contact Metro (e.g. in tests)      | `RCTBundleURLProviderAllowPackagerServerAccess(NO)`, called before React Native initializes. `RCTBundleURLProvider` then skips Metro, so bundle URLs resolve to the embedded bundle. |

All `RCT_*` settings of `RCTBundleURLProvider` are stored in `NSUserDefaults`,
so each can also be passed as a launch argument.

> **Example: Metro port** (`packages/metro-config/src/index.flow.js`)
>
> The default Metro configuration reads the same variable, so setting
> `RCT_METRO_PORT` for both the Xcode build and Metro moves both sides to the
> same port:
>
> ```js
> server: {
>   port: Number(process.env.RCT_METRO_PORT) || 8081,
> },
> ```

## How the app finds Metro

In the simulator, Metro is reachable on `localhost`. On a device, the app uses
the development machine's IP recorded by the build in `ip.txt`. An explicitly
configured address (launch argument or Configure Bundler) takes priority. This
resolution runs again on every reload and whenever the `/message` connection
checks for an address change, so the selected Metro can change while the app
runs.

`-[RCTBundleURLProvider packagerServerHostPort]` (`React/Base/`) decides:

1. A `RCT_jsLocation` launch argument is used as is. A saved `RCT_jsLocation` is
   used only if `GET /status` answers `packager-status:running`.
2. Otherwise the host from `ip.txt`, or `localhost`, if `/status` answers.
3. Otherwise no Metro, and the app falls back to the embedded bundle.

A host without a port gets `RCT_METRO_PORT`. The `/status` check blocks the
calling thread for up to 6 s (plus 2 s grace); `isPackagerRunningAsync:` is the
non-blocking variant.

> **Example:** on a Debug iOS simulator with no saved address, the provider
> sends `GET http://localhost:8081/status`. If the body is
> `packager-status:running`, the bundle URL is
> `http://localhost:8081/index.bundle?platform=ios&...`; otherwise it is
> `file:///.../main.jsbundle`. On a physical device, the address in `ip.txt`
> (for example `192.168.1.5`) is checked instead of `localhost`.

> **Example: RNTester unit tests**
> (`packages/rn-tester/RNTesterUnitTests/RCTBundleURLProviderTests.m`)
>
> `testLaunchArgumentLocationIsKeptWhenPackagerDoesNotAnswer` and
> `testSavedLocationGivesWayWhenPackagerDoesNotAnswer` cover step 1. With Metro
> not answering, a `RCT_jsLocation` launch argument still produces a Metro URL,
> while the same address saved with `jsLocation` falls back to the embedded
> bundle:
>
> ```objc
> launchArguments[@"RCT_jsLocation"] = @"192.168.1.1:8099";
> [self replaceLaunchArguments:launchArguments];
> settings.jsLocation = nil;
> NSURL *URL = [settings jsBundleURLForBundleRoot:testFile];
> XCTAssertEqualObjects(URL, ipPortBundleURL());
> ```

## What the bundle request asks for

The bundle URL is `<scheme>://<host:port>/<root>.bundle`, where `<root>` is the
entry file (`index` for `index.js`). Its query parameters tell Metro what to
build:

- `platform=ios`: resolve `.ios.js` files. The value comes from
  `RCTPlatformName` and is `ios` on every Apple platform, including tvOS and
  macOS.
- `dev` and `lazy` (both follow `enableDev`): development mode, with warnings
  and dev tools, and lazy bundling.
- `minify`, `inlineSourceMap`.
- `modulesOnly=false&runModule=true` for the main bundle;
  `modulesOnly=true&runModule=false` for split bundles
  (`jsBundleURLForSplitBundleRoot:`).
- `app`: the app's bundle identifier.
- `excludeSource=true&sourcePaths=url-server` when React Native DevTools is
  enabled, so the source map points at sources on Metro instead of embedding
  them.
- Anything added through `additionalOptions` or the `RCTBundleConfiguration`
  `packagerOptionsUpdater`.

Native resources resolve against the same Metro through
`resourceURLForResourceRoot:resourceName:resourceExtension:offlineBundle:`.

## Where the current URL lives

The bundle URL is used more than once while the app runs: to download the
bundle, to connect Fast Refresh and React Native DevTools, to open DevTools from
the Dev Menu, and by JavaScript, which sees it as `scriptURL` (exported by
`RCTSourceCode`). Because the URL can change (see [Reloading](./Reloading.md)),
native code reads it from `RCTBundleManager` (`React/Base/`) instead of keeping
a copy. The manager works in one of two mutually exclusive modes.

### Fixed configuration

An `RCTBundleConfiguration` set on `RCTReactNativeFactory.bundleConfiguration`
fixes the URL up front. It holds either a bundle file (`bundleFilePath`, which
must be a file URL) or a Metro address (`packagerServerScheme`,
`packagerServerHost` and `bundlePath`, plus a `packagerOptionsUpdater` for extra
query parameters). While it yields a URL, every read returns that URL; the app's
`bundleURL`, reloads and Dev Menu changes do not affect what is loaded.

> **Example:** an app that ships its own bundle file sets
> `[[RCTBundleConfiguration alloc] initWithBundleFilePath:fileURL]`. React
> Native always loads `fileURL`, never contacts Metro for the bundle, and
> disables the "Loading from Metro…" banner.

### Dynamic URL

With the default configuration, `RCTHost` stores the app's provider block and
the current URL, and `RCTBundleManager` exposes them:

- Getter: the host's current URL.
- Setter: `-[RCTHost _setBundleURL:]`. The new URL is used from the next load;
  see [Reloading](./Reloading.md) for how long it lasts.
- `resetBundleURL`: sets the URL to whatever the app's provider returns.

`_setBundleURL:` also publishes the URL with `RCTReloadCommandSetBundleURL`; it
is attached to every reload notification
(`RCTTriggerReloadCommandNotification`).
