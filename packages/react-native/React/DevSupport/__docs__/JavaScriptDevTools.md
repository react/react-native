# JavaScript Dev Tools That Use Metro

[🏠 Home](../../../../../__docs__/README.md)

Part of [Bundler Connection (Apple platforms)](./README.md). LogBox
symbolication, open in editor, links, split bundles and images.

LogBox stack traces, "open in editor", and images in a Debug build also talk to
Metro. They find it with `getDevServer()`
(`Libraries/Core/Devtools/getDevServer.js`), which takes the origin of
`scriptURL` and falls back to `http://localhost:8081/`. The origin is cached for
the lifetime of the JavaScript instance; a reload picks up a new Metro address.
Its users:

- `symbolicateStackTrace`: maps stack traces back to source files
  (`POST /symbolicate`).
- `openFileInEditor`: opens a stack frame in the editor
  (`POST /open-stack-frame`).
- `openURLInBrowser`: opens a link on the development machine
  (`POST /open-url`).
- `loadBundleFromServer`: loads split bundles from Metro.
- `resolveAssetSource`: serves images from Metro when the bundle came from
  Metro, otherwise from the app bundle.

> **Example: who uses `symbolicateStackTrace`.** A component throws a
> `TypeError` while the app runs a bundle from Metro at `localhost:8081`.
>
> 1. LogBox records the error with its raw stack. Each frame points into
>    `http://localhost:8081/index.bundle?...` at a line and column of the
>    generated bundle.
> 2. LogBox (`Libraries/LogBox/Data/LogBoxData.js`) asks the log to symbolicate
>    itself (`LogBoxLog.symbolicate`), which calls
>    `LogBoxSymbolication.symbolicate`, which calls
>    `symbolicateStackTrace(stack, extraData)`. For a fatal error this happens
>    immediately, and LogBox waits up to 1 s for the result before opening the
>    error. Warnings and other logs are symbolicated when their notification
>    appears or the LogBox inspector opens them.
> 3. `symbolicateStackTrace` sends `POST http://localhost:8081/symbolicate` with
>    `{stack, extraData}`. Metro maps each frame through the source map (for
>    example to `src/screens/Profile.js:42:17`) and returns a `codeFrame` with
>    the surrounding source lines.
> 4. LogBox shows the mapped stack and code frame. Results are cached per stack
>    in `LogBoxSymbolication.js`.
>
> If the bundle was not loaded from Metro, `symbolicateStackTrace` throws
> ("Bundle was not loaded from Metro.") instead of sending the request.

> **Example:** `<Image source={require('./img/logo.png')} />` in a component at
> the project root, with `img/logo@2x.png` and `img/logo@3x.png`, on a 3x
> iPhone.
>
> - Bundle loaded from Metro at `localhost:8081`: the image loads from
>   `http://localhost:8081/assets/img/logo@3x.png?platform=ios&hash=<hash>`.
> - Bundle loaded from the embedded `file:///.../MyApp.app/main.jsbundle`: the
>   image loads from `file:///.../MyApp.app/assets/img/logo@3x.png`, which
>   `react-native-xcode.sh` copied into the app (`--assets-dest`) when it built
>   the bundle.
>
> `AssetSourceResolver` (`Libraries/Image/AssetSourceResolver.js`) builds both
> URLs; `pickScale` (`Libraries/Image/AssetUtils.js`) picks the scale suffix for
> the device's pixel ratio.
