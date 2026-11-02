# ActivityResultContracts for native modules

[🏠 Home](../../../../../../../../../../../__docs__/README.md)

This package lets an Android native module register an AndroidX
[`ActivityResultContract`](https://developer.android.com/training/basics/intents/result)
and receive results. The consumer app does not need to change its
`MainActivity`, add manifest entries, or ship extra Activities.

Before this, modules had to use `ActivityEventListener` with self-assigned int
request codes, which live in a global namespace with no coordination between
libraries. Calling `registerForActivityResult` on `getCurrentActivity()` does
not work either: AndroidX only allows it before the Activity is started, and
native modules are created lazily, long after that. See
[facebook/react-native#33639](https://github.com/facebook/react-native/issues/33639)
(Health Connect, whose permission contract cannot be used without
`registerForActivityResult`).

## 🚀 Usage

The API is `ReactContext.registerForActivityResult`. It has the same shape as
[`ComponentActivity.registerForActivityResult`](https://developer.android.com/training/basics/intents/result#register),
plus a leading `owner` argument that scopes the registration key. You can
register at any time. A field initializer is the recommended spot. The returned
launcher connects to the real registry once an Activity is available.

```kotlin
class MyModule(private val context: ReactApplicationContext) :
    NativeMyModuleSpec(context) {

  private var pendingPromise: Promise? = null

  private val requestPermission =
      context.registerForActivityResult(
          /* owner = */ this,
          ActivityResultContracts.RequestPermission()) { isGranted ->
        pendingPromise?.resolve(isGranted)
        pendingPromise = null
      }

  override fun requestCameraPermission(promise: Promise) {
    pendingPromise = promise
    requestPermission.launch(Manifest.permission.CAMERA)
  }
}
```

Stock AndroidX contracts work unchanged, with their own input and output types
(for example `PickVisualMedia`).

### Registration keys and collisions

Registrations are keyed by `"<owner class>:<contract class>"`, so two unrelated
libraries can register the same stock contract without clashing. Pass a stable,
long-lived `owner`, normally the module itself. Only named classes are allowed
as owners: an anonymous object gets a generated class name that can change
between builds, which breaks result delivery after the process is killed and
restored, so passing one throws `IllegalArgumentException` at registration.

The same stability concern applies to minification. If the app minifies class
names (R8/ProGuard), the obfuscated name of the owner class is not guaranteed to
be the same from one build to the next, so a result delivered after an app
update can be dropped. Keep the owner class's name (for example with
`-keepnames`) if results must survive across builds.

Registering the same contract class twice from one owner throws
`IllegalStateException`. In that case use the overload that takes a key:

```kotlin
private val pickAvatar = ctx.registerForActivityResult(this, "avatar", GetContent()) { }
private val pickBanner = ctx.registerForActivityResult(this, "banner", GetContent()) { }
```

The key is added to the owner-and-contract prefix, not used instead of it. It
only has to be unique among that owner's launchers of that contract, and it can
never clash with another library's keys. It must stay the same across process
restarts, so derive it from a constant.

Why not automatic keys, like `ComponentActivity`'s counter? Modules are created
lazily, in whatever order JS touches them. After the process is killed and
restored, the same counter value could belong to a different module, and a
restored result would reach the wrong callback. Keys built from class names do
not depend on creation order.

### Contract parameters that come from JS

Contract constructor arguments are fixed when you register. If a value comes
from JS on each call, put it in the contract's input type instead: subclass the
stock contract and pass the value through `launch()`. See `PickUpToMedia` in
`SampleTurboModule.kt`, which does this for the photo picker's item limit.

### Working examples

- `SampleTurboModule.kt`
  (`ReactCommon/react/nativemodule/samples/platform/android/`):
  `requestSamplePermission`, `pickMedia`, `pickMultipleMedia`, and
  `startSecondActivity` (multi-Activity regression check).
- rn-tester screens: `TurboModule/SampleTurboModuleExample.js` and
  `PhotoPickerAndroid/PhotoPickerAndroid.js`.

## 📐 Design

`ReactActivity` extends `ComponentActivity`, so the host Activity already owns a
real `ActivityResultRegistry`. This package only bridges the timing gap between
lazily-created modules and that registry.

- `ReactActivityResultCaller` / `ReactActivityResultCallerImpl` (internal):
  owned by the `ReactContext`. Holds the `(key, contract, callback)`
  registrations and connects them to the current Activity's registry, right away
  if an Activity exists, otherwise on the next `onHostResume`.
- `DeferredActivityResultLauncher` (internal): the launcher handed to callers.
  It forwards to the real AndroidX launcher once connected. A `launch()` made
  before that is stored (latest wins) and fired on connect.
- Registrations outlive any single Activity. `onHostDestroy` disconnects them
  but keeps them, and because the keys stay the same, AndroidX can deliver a
  result that arrives after the Activity was recreated.
- Every `onHostResume` checks each launcher against the current registry, not
  just whether it is connected to something. With more than one Activity, the
  new Activity resumes before the old one is destroyed, and the old one's
  `onHostDestroy` never runs because `currentActivity` has already moved on. A
  launcher that only checked "am I connected?" would stay attached to the old
  Activity's registry: that Activity could never be freed, and launches from the
  new screen would go to the old one.

### Threading

`ActivityResultRegistry` must only be used from the UI thread, but nothing
enforces that at runtime; calls from other threads corrupt its internal maps
silently. React Native calls in from the JS thread (registrations in field
initializers) and from the native-modules thread (`launch()`), so:

- The bookkeeping used for collision detection is a concurrent map and can be
  used from any thread. Claiming a key is a single atomic step. Registration
  stays synchronous: you get the launcher back immediately, and a duplicate key
  throws from your own call.
- Every call that reaches the registry (`register`, `launch`, `unregister`) is
  forwarded to the UI thread, and so is the launcher's connection state (checked
  with assertions in debug builds).

Notes for library authors:

- Register early, in a field initializer or the constructor. Only launching
  needs an Activity.
- An Activity that is not an `ActivityResultRegistryOwner` cannot serve
  launchers; binding to one throws `IllegalStateException`. In practice every
  `ComponentActivity` (including `ReactActivity`) is a registry owner.
- After the process is killed and restored, AndroidX redelivers a pending result
  under the same key, but any state your module held for the call (typically a
  `Promise`) is gone. Write callbacks so they tolerate firing with no pending
  state.
- `unregister()` on the returned launcher removes the registration and frees the
  key.

## 🔗 Relationship with other systems

### Part of

- [ReactAndroid](../../../../../../../../README.md): the core of React Native on
  Android.

### Used by this

- `com.facebook.react.bridge.ReactContext`: exposes the public
  `registerForActivityResult` methods, owns the caller instance, and drives
  connecting and disconnecting through its lifecycle events.
- AndroidX `androidx.activity.result`: the contracts, launchers, and registry
  that actually start activities and deliver results.

### Uses this

- `SampleTurboModule` (demo) and, in the future, third-party modules that need
  activity results or AndroidX permission contracts (for example Health
  Connect).

This API coexists with `ActivityEventListener`: results claimed by the AndroidX
registry are consumed by it, and everything else still reaches
`ActivityEventListener.onActivityResult`. The listener remains the right tool
for intents a module builds and starts itself.
