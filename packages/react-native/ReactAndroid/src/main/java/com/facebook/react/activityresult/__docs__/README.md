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
and intents are built and parsed by hand. On Android 14+ some contracts (e.g.
Health Connect's permission contract) produce a synthetic intent that only an
`ActivityResultRegistry` can service, so the classic `startActivityForResult`
path fails with `ActivityNotFoundException` outright.

## 🚀 Usage

The API is `ReactContext.registerForActivityResult`, deliberately identical in
shape to
[`ComponentActivity.registerForActivityResult`](https://developer.android.com/training/basics/intents/result#register):
same name, same `ActivityResultCallback<O>`, and it returns the real
`androidx.activity.result.ActivityResultLauncher<I>`.

```kotlin
class MyModule(private val context: ReactApplicationContext) :
    NativeMyModuleSpec(context) {

  private var pendingPromise: Promise? = null

  // Registering in a field initializer is fine: modules are created lazily,
  // long after the Activity exists, and registration is legal at any time.
  private val requestPermission =
      context.registerForActivityResult(
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
        ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
      // null when the user dismissed the picker
    }

pickMedia.launch(PickVisualMediaRequest(PickVisualMedia.ImageOnly))
```

### Registration keys and collisions

The registration key is the contract's fully-qualified class name, derived by
core and never passed by the caller. Registering the same contract class twice
on one `ReactContext` throws `IllegalStateException` at registration time,
naming both registrants. Two ways to disambiguate:

- **Subclass the contract** (preferred; see the parameterized-contract pattern
  below) — the subclass has its own class name and therefore its own key.
- **Use the owner overload** —
  `context.registerForActivityResult(owner, contract, callback)` scopes the key
  to `"<owner class>:<contract class>"`:

```kotlin
private val getContent =
    context.registerForActivityResult(
        /* owner = */ this, ActivityResultContracts.GetContent()) { uri -> ... }
```

### Parameterized contracts: passing values from JS per call

Contract constructor arguments are fixed at registration time. If a value comes
from JS per call — say the photo picker's item limit — move it into the
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

This is the pattern for _any_ per-call parameter, and it doubles as the
collision fix since the subclass gets a distinct key.

### Working examples

- `SampleTurboModule.kt`
  (`ReactCommon/react/nativemodule/samples/platform/android/`) —
  `requestSamplePermission` (runtime permission), `pickMedia` (photo picker,
  single select), `pickMultipleMedia` (multi select with a JS-controlled limit
  via the `PickUpToMedia` contract above).
- rn-tester screens: `TurboModule/SampleTurboModuleExample.js` and
  `PhotoPickerAndroid/PhotoPickerAndroid.js`.

## 📐 Design

`ReactActivity` extends `ComponentActivity`, so the host Activity already owns a
real `ActivityResultRegistry` and already routes `onActivityResult` /
`onRequestPermissionsResult` into it. This package only bridges the timing gap
between lazily-created modules and that registry — it does not fork or
reimplement the registry.

- `ReactActivityResultCaller` / `ReactActivityResultCallerImpl` (internal):
  owned by the `ReactContext`, holds `(key, contract, callback)` registrations,
  and binds them to the current Activity's registry — immediately when an
  Activity is available, otherwise on the next `onHostResume`.
- `DeferredActivityResultLauncher` (internal): the launcher handed to callers.
  Delegates to the real AndroidX launcher once bound; a `launch()` issued while
  unbound is queued (latest wins) and fired on bind.
- On `onHostDestroy` registrations detach from the dying registry but are kept,
  and rebind against the new Activity's registry under the same keys on the next
  `onHostResume`. Stable keys are what let AndroidX re-associate a result that
  arrives after Activity recreation.

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
  contract class can then be registered again.

## 🔗 Relationship with other systems

### Part of

- [ReactAndroid](../../../../../../../../README.md) — the core of React Native
  on Android.

### Used by this

- `com.facebook.react.bridge.ReactContext` — exposes the public
  `registerForActivityResult` methods and owns the caller instance; its
  `LifecycleEventListener` events (`onHostResume` / `onHostDestroy`) drive
  binding and rebinding.
- AndroidX `androidx.activity.result` — the contracts, launchers, and the host
  Activity's `ActivityResultRegistry` that actually starts activities and
  dispatches results.

### Uses this

- `SampleTurboModule` (demo) and, prospectively, third-party native modules that
  need activity results or AndroidX permission contracts (e.g. Health Connect).

This API coexists with `ActivityEventListener`, which is unchanged: results
claimed by the AndroidX registry are consumed by it, everything else still
reaches `ActivityEventListener.onActivityResult`. The listener remains the right
tool for intents a module builds and starts itself.
