# Downloading and Running the Bundle

[🏠 Home](../../../../../__docs__/README.md)

Part of [Bundler Connection (Apple platforms)](./README.md). How the bundle is
fetched from Metro or read from the app, and what happens when it loads or
fails.

While loading, the app shows a "Loading from Metro…" banner at the top of the
screen, followed by Metro's bundling progress and then the download progress. If
loading fails, a red error screen (RedBox) shows the reason. When loading from a
file in a Debug build, the banner says "Connect to Metro to develop JavaScript."

`-[RCTHost start]` takes the URL from the app's provider and creates an
`RCTInstance` (`RCTInstance.mm`, next to `RCTHost.mm`). Once the JavaScript
runtime is ready, `RCTInstance` calls `_loadJSBundle:` with
`bundleManager.bundleURL`:

1. Creates the `DevSettings` module first. That opens the `/message` connection,
   so the `r` command in the Metro terminal still reloads the app when the
   download fails.
2. Shows the banner (`RCTDevLoadingView`, `React/CoreModules/`).
3. Calls `-[RCTHost loadBundleAtURL:…]`, which uses the host delegate's loader
   if it has one, otherwise `RCTJavaScriptLoader` (`React/Base/`).
4. On error: posts `RCTJavaScriptDidFailToLoadNotification`, shows the RedBox,
   and calls `RCTFatal`.
5. On success: runs the bundle, posts `RCTInstanceDidLoadBundle` and
   `RCTJavaScriptDidLoadNotification`, and connects Fast Refresh.

`RCTJavaScriptLoader` handles the two kinds of URL:

- File (embedded bundle): loaded synchronously when `RCT_ENABLE_INSPECTOR` is
  set, otherwise on a background queue.
- Metro: `RCTMultipartDataTask` asks for a streamed response
  (`Accept: multipart/mixed`). Metro first sends JSON progress parts (`status`,
  `done`, `total`) for the banner, then the bundle itself. Download progress is
  reported for `application/javascript` and
  `application/x-metro-bytecode-bundle` parts. For the bundle part:
  - `X-Http-Status` overrides the HTTP status. A non-200 status becomes an error
    built from the response body, which is how Metro's build errors (such as a
    syntax error) reach the RedBox.
  - `Content-Type` must be `application/javascript` or `text/javascript`. For a
    JSON body, its `message` becomes the error.
  - `Content-Location`, if present, becomes the source URL used in stack traces.
  - The bundle is saved to `NSTemporaryDirectory()/ReactNativeDevBundle.js` and
    memory-mapped. The file URL is stored as
    `bundleManager.downloadedBundleFileURL`.
  - Network errors become "Could not connect to development server", with the
    URL.

  If Metro does not answer with a multipart response, the bundle is downloaded
  as a single body.
