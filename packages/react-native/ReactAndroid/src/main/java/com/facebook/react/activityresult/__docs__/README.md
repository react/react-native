# ActivityResultContracts for native modules

[🏠 Home](../../../../../../../../../../../__docs__/README.md)

This package lets an Android native module register an AndroidX
[`ActivityResultContract`](https://developer.android.com/training/basics/intents/result)
against the host Activity's `ActivityResultRegistry` and receive results, with
no changes to the consumer app's `MainActivity`, no manifest entries, and no
library-shipped transparent Activities.

Before this existed, modules had to use `ActivityEventListener` with
self-assigned int request codes: codes live in a global namespace with no
coordination between libraries, results are broadcast so every listener filters,
and intents are built and parsed by hand. And going through AndroidX directly
instead — calling `registerForActivityResult` on `getCurrentActivity()` — is a
dead end: the lifecycle-observing overload crashes with

```
LifecycleOwner com.xxx.MainActivity@c3ccf41 is attempting to register while
current state is RESUMED. LifecycleOwners must call register before they are
STARTED.
```

because AndroidX only allows that overload before the Activity is `STARTED`,
and native modules are created lazily, long after that. This is exactly the
wall hit in
[facebook/react-native#33639](https://github.com/facebook/react-native/issues/33639)
(a Health Connect module, whose permission contract has no
`startActivityForResult` equivalent); the only workaround offered there was to
move the registration into the app's own `MainActivity`, which a library
cannot ask of every consumer.

## 🚀 Usage

The API is `ReactContext.registerForActivityResult`, deliberately identical in
shape to
[`ComponentActivity.registerForActivityResult`](https://developer.android.com/training/basics/intents/result#register):
same name, same `ActivityResultCallback<O>`, and it returns the real
`androidx.activity.result.ActivityResultLauncher<I>`. The one addition is a
leading `owner` argument, which scopes the registration key; see
[Registration keys and collisions](#registration-keys-and-collisions).

```kotlin
class MyModule(private val context: ReactApplicationContext) :
    NativeMyModuleSpec(context) {

  private var pendingPromise: Promise? = null

  // Registering in a field initializer is fine: modules are created lazily,
  // long after the Activity exists, and registration is legal at any time.
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

Stock AndroidX contracts work unchanged, with their own input and output types:

```kotlin
private val pickMedia =
    context.registerForActivityResult(
        /* owner = */ this,
        ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
      // null when the user dismissed the picker
    }

pickMedia.launch(PickVisualMediaRequest(PickVisualMedia.ImageOnly))
```

### Registration keys and collisions

Registrations are keyed by `"<owner class>:<contract class>"`, derived by core
from the `owner` you pass. Because a class's fully-qualified name is globally
unique, two unrelated libraries can both register a stock contract such as
`GetContent` and never collide:

```kotlin
// react-native-image-lib
class ImageModule(ctx: ReactApplicationContext) : NativeImageModuleSpec(ctx) {
  private val pick = ctx.registerForActivityResult(this, GetContent()) { uri -> }
  // key = "com.rnimage.ImageModule:androidx...GetContent"
}

// react-native-doc-lib: same contract, different owner, no collision
class DocModule(ctx: ReactApplicationContext) : NativeDocModuleSpec(ctx) {
  private val pick = ctx.registerForActivityResult(this, GetContent()) { uri -> }
  // key = "com.rndoc.DocModule:androidx...GetContent"
}
```

Pass a stable, long-lived `owner`, normally the module itself. An anonymous
object or a per-call helper yields a synthetic name like `com.example.Foo$1`,
which is fragile across builds and defeats re-association after process death.

A collision still throws `IllegalStateException` at registration time, but with
owner scoping it is only reachable from one owner's own code: registering the
same contract class twice. The fix is the **extra-key overload**:

```kotlin
// Throws: same owner, same contract class, same key:
private val pickAvatar = ctx.registerForActivityResult(this, GetContent()) { }
private val pickBanner = ctx.registerForActivityResult(this, GetContent()) { }

// Fix:
private val pickAvatar = ctx.registerForActivityResult(this, "avatar", GetContent()) { }
// key = "com.example.MyModule:androidx...GetContent:avatar"
private val pickBanner = ctx.registerForActivityResult(this, "banner", GetContent()) { }
// key = "com.example.MyModule:androidx...GetContent:banner"
```

The key you pass is **appended to** the owner-and-contract scope, not
substituted for it, so it only has to be unique among that owner's launchers of
that contract, and no choice of key can reintroduce a cross-library collision.
It does still have to be stable across process death, so derive it from a
constant rather than from runtime state.

#### Why not auto-generated keys, like `ComponentActivity`?

`ComponentActivity` can key registrations by an incrementing counter
(`activity_rq#0`, `activity_rq#1`, …) because it registers in `onCreate`, in a
deterministic order every time. React Native cannot: native modules are created
lazily, in whatever order JS first touches them, so after process death
`activity_rq#0` may belong to a _different_ module than it did before. A
restored result would then be dispatched to the wrong callback and parsed with
the wrong contract. Deriving the key from the owner and contract classes keeps
it reproducible regardless of creation order.

### Parameterized contracts: passing values from JS per call

Contract constructor arguments are fixed at registration time. If a value comes
from JS per call (say the photo picker's item limit), move it into the
contract's **input** type, where it becomes a `launch()` argument. Subclass the
stock contract and delegate:

```kotlin
private class PickUpToMedia :
    ActivityResultContract<PickUpToMedia.Request, List<@JvmSuppressWildcards Uri>>() {
  class Request(val maxItems: Int, val request: PickVisualMediaRequest)

  private val delegate = ActivityResultContracts.PickMultipleVisualMedia(2)

  override fun createIntent(context: Context, input: Request): Intent =
      delegate.createIntent(context, input.request).apply {
        putExtra(MediaStore.EXTRA_PICK_IMAGES_MAX, input.maxItems)
      }

  override fun parseResult(resultCode: Int, intent: Intent?): List<Uri> =
      delegate.parseResult(resultCode, intent)
}

// One registration serves every limit JS asks for:
launcher.launch(PickUpToMedia.Request(jsMaxItems, request))
```

This is the pattern for _any_ per-call parameter. (It also happens to yield a
distinct key, since the subclass has its own class name, but that is incidental;
collisions are handled by owner scoping and the extra-key overload above.)

### Working examples

- `SampleTurboModule.kt`
  (`ReactCommon/react/nativemodule/samples/platform/android/`):
  `requestSamplePermission` (runtime permission), `pickMedia` (photo picker,
  single select), `pickMultipleMedia` (multi select with a JS-controlled limit
  via the `PickUpToMedia` contract above).
- rn-tester screens: `TurboModule/SampleTurboModuleExample.js` and
  `PhotoPickerAndroid/PhotoPickerAndroid.js`.

## 📐 Design

`ReactActivity` extends `ComponentActivity`, so the host Activity already owns a
real `ActivityResultRegistry` and already routes `onActivityResult` /
`onRequestPermissionsResult` into it. This package only bridges the timing gap
between lazily-created modules and that registry; it does not fork or
reimplement the registry.

- `ReactActivityResultCaller` / `ReactActivityResultCallerImpl` (internal):
  owned by the `ReactContext`, holds `(key, contract, callback)` registrations,
  and binds them to the current Activity's registry: immediately when an
  Activity is available, otherwise on the next `onHostResume`.
- `DeferredActivityResultLauncher` (internal): the launcher handed to callers.
  Delegates to the real AndroidX launcher once bound; a `launch()` issued while
  unbound is queued (latest wins) and fired on bind.
- Registrations outlive any single Activity. `onHostDestroy` detaches them from
  the dying registry but keeps them, and every `onHostResume` reconciles each
  launcher against the **current** registry, rebinding it if it is attached to a
  different one. Stable keys are what let AndroidX re-associate a result that
  arrives after Activity recreation.

  Reconciling on every resume, rather than binding only when a launcher is
  unbound, is required for multi-Activity navigation. There, the new Activity
  resumes _before_ the old one is destroyed, and
  `ReactHostImpl.onHostDestroy( activity)` then drops the old Activity's destroy
  entirely because `currentActivity` has already moved on. A launcher that
  stopped at "am I bound to something?" would stay attached to the previous
  Activity's dead registry: it would leak that Activity, and a launch from the
  new screen would dispatch into the old one. The single-Activity config-change
  path never showed this, because there the destroy and the resume are strictly
  ordered.

### Threading

`ActivityResultRegistry` is `@MainThread`, and its key tables are plain
unsynchronized maps. The annotation is not enforced at runtime, so calling it
off the main thread does not throw; it corrupts those maps silently, which
surfaces later as a lost registration, a `ConcurrentModificationException`-class
crash inside AndroidX's own `onSaveInstanceState` (i.e. on rotation), or two
keys sharing one request code, which delivers a result to the wrong callback.

React Native never calls it from the main thread by default: modules are
constructed on the JS thread, so field-initializer registrations arrive on
`mqt_v_js`, and module methods run on `mqt_v_native`, so `launch()` arrives from
there. So this package hops. State is split by owner:

- **Registration bookkeeping** (the key table used for collision detection) is a
  concurrent map, callable from any thread. Claiming a key is a single atomic
  operation, so two threads registering at once cannot both win.
- **Every call that reaches `ActivityResultRegistry`** (`register`, `launch`,
  `unregister`) is confined to the UI thread, as is the launcher's binding
  state. Each is asserted with `UiThreadUtil.assertOnUiThread()` in debug
  builds, so a regression fails loudly instead of corrupting a map.

Two consequences worth knowing:

- **Registration is still synchronous.** You get the launcher back immediately,
  and a duplicate key throws from your own frame rather than later on the UI
  thread where it could not be traced back to you. Only the registry call hops.
- **`launch()` from a background thread is asynchronous.** It never guaranteed a
  synchronous activity start anyway, since binding is deferred until an Activity
  exists.

Behavioral notes for library authors:

- **Register early, ideally in a field initializer or the module constructor.**
  Registration is cheap and legal at any time; launching is what needs an
  Activity.
- **An Activity that is not an `ActivityResultRegistryOwner`** (i.e. does not
  extend `ComponentActivity`) cannot service launchers; they stay queued and a
  warning is logged.
- **Process death:** AndroidX redelivers a pending result under the same key
  after the process is recreated, but whatever state your module held for the
  in-flight call (typically a `Promise`) died with the JS context. Design
  callbacks to tolerate firing with no pending state.
- **`unregister()`** on the returned launcher removes the registration; the same
  key can then be registered again.

## 🔗 Relationship with other systems

### Part of

- [ReactAndroid](../../../../../../../../README.md): the core of React Native on
  Android.

### Used by this

- `com.facebook.react.bridge.ReactContext`: exposes the public
  `registerForActivityResult` methods and owns the caller instance; its
  `LifecycleEventListener` events (`onHostResume` / `onHostDestroy`) drive
  binding and rebinding.
- AndroidX `androidx.activity.result`: the contracts, launchers, and the host
  Activity's `ActivityResultRegistry` that actually starts activities and
  dispatches results.

### Uses this

- `SampleTurboModule` (demo) and, prospectively, third-party native modules that
  need activity results or AndroidX permission contracts (e.g. Health Connect).

This API coexists with `ActivityEventListener`, which is unchanged: results
claimed by the AndroidX registry are consumed by it, everything else still
reaches `ActivityEventListener.onActivityResult`. The listener remains the right
tool for intents a module builds and starts itself.
