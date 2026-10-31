# RCP: Predictive back gesture support in React Native applications

## Proposal

### What is predictive back?

On Android, users go back by swiping from the left or right edge of the screen, or by pressing the back button. With **predictive back**, Android shows where back will lead _while the finger is still on the screen_. The current screen shrinks and slides, and the previous screen, or the home screen, shows up behind it. If the user lets go, back happens. If they swipe back the other way, it's cancelled and nothing changes.

Android can only show that preview if it knows ahead of time what back will do. That's the core change: Android used to ask the app _after_ the back press; now the app has to say _before_ the gesture starts whether it wants to handle back.

### How apps tell Android "I want back"

Each Android screen (an _activity_) has a list of **back callbacks**. A callback is a piece of code that says "if back happens, call me". Each one is either on (enabled) or off.

- **If any callback is on**, Android hands back to the app. The app does what it wants, for example closing a dialog or going to the previous tab. Android doesn't show its own animation, because it doesn't know what the app will do.
- **If all callbacks are off**, Android handles back itself. It plays its animation and closes the screen, or goes to the home screen.
- **If several callbacks are on**, the one turned on last wins. Any library or native screen can take back by turning its callback on later.

### How Android rolled this out

| Android version | What changed |
| --- | --- |
| Android 13 (API 33) | Predictive back added. Apps had to opt in with `android:enableOnBackInvokedCallback="true"`. The back-to-home animation was hidden behind a developer setting. |
| Android 14 (API 34) | Apps can animate their own screens during the swipe, because they get the gesture progress from 0 to 1 (`OnBackAnimationCallback`). System animations were still behind the developer setting. |
| Android 15 (API 35) | Opted-in apps get system animations without the developer setting: back to home, back to the previous activity, back to another app. |
| Android 16 (API 36) | For apps that **target** Android 16 (`targetSdk 36`), it's on by default. The old ways of hearing back, `onBackPressed()` and the `KEYCODE_BACK` key event, are no longer called. Apps can still opt out with `android:enableOnBackInvokedCallback="false"`, but Google calls this temporary. Android 16 also adds an "observer" callback type (`PRIORITY_SYSTEM_NAVIGATION_OBSERVER`) that can watch back without blocking the animation. |
| Android 17 (API 37) | Nothing new for predictive back. Google hasn't said when the opt-out will be removed. |

The _targetSdk_ is the Android version an app says it was built and tested for. Google Play raises the minimum targetSdk every year, so every React Native app will reach targetSdk 36 soon.

Sources: [Android 16 behaviour changes](https://developer.android.com/about/versions/16/behavior-changes-16), [Add support for the predictive back gesture](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture), [`OnBackInvokedDispatcher`](https://developer.android.com/reference/android/window/OnBackInvokedDispatcher).

### What React Native needs

React Native should work with Android's model instead of against it: take back only when the app has something to go back to, and otherwise let Android handle it and play its animation.

### What we plan to change

**1. React Native stops taking back by default (Android 16+, targetSdk 36+).**

- **What:** the back callback in `ReactActivity` starts **off** instead of on.
- **Why:** with no callback on, Android plays its animation. Leaving a React Native screen looks the same as leaving a native one, with no work for the app developer.
- **Effect:** by default, back closes the React Native screen with the system animation. `BackHandler` listeners are not called, unless code opts in (point 2).

**2. A new JS switch: `BackHandler.setInterceptEnabled(enabled)`.**

- **What:** JS calls `setInterceptEnabled(true)` when the current screen has something to go back to inside JS. Examples: a pushed JS screen, an open modal, an unsaved form. It calls `setInterceptEnabled(false)` when there's nothing left to go back to.
- **Why:** this is how Android wants it, with the decision made before the gesture. Navigation libraries already know this; React Navigation knows `canGoBack`.
- **Effect while on:** React Native's callback is on, Android gives back to React Native, and `BackHandler` listeners run as they do today, including `return true` to block.
- **Effect while off:** Android handles back and plays its animation.
- **Important:** this is a **request, not a guarantee**. Native code turned on later can still take back. For example, react-native-screens might let its native navigation handle back, or a brownfield app might show a native screen on top. JS also can't ask Android "do I still own back?".

**3. A native getter: `ReactActivity.getBackPressedCallback()`.**

- **What:** native code can get React Native's back callback and turn it on or off.
- **Why:** native libraries such as react-native-screens, and brownfield apps (existing native apps that embed React Native screens), sometimes need to decide who handles back. Today they can't reach React Native's callback, so they have to work around it.
- **Effect:** a small public API for native code. Nothing changes for JS.

**4. Bug fix: don't close the screen twice.**

- **What:** `invokeDefaultOnBackPressed()` now does nothing if the activity is already closing.
- **Why:** when back reaches React Native and no JS listener handles it, React Native closes the activity. In some cases that ran twice.
- **Effect:** no API change.

**5. Optional, may be a follow-up: a "back happened" notification.**

- **What:** React Native could register an Android 16 observer callback and send JS a new event, for example `backCommitted`, so apps can log back or clean up.
- **Why it must be a new event and not `hardwareBackPress`:** the observer runs _after_ Android has already acted, often after the screen is gone. JS can't block it, so returning `true` would mean nothing. In our tests, a JS listener popped its screen stack while the whole screen was already closing.
- **Limits:** Android 16+ only. On Android 16, only one observer can be registered per window. It gets no gesture progress.

### What stays out of React Native core

- **Animations driven by the gesture**, such as a progress value from 0 to 1 sent to JS, an animated view that follows the finger, or in-app back animations. We built these in a prototype branch, and they worked in a plain `ReactActivity`. They didn't work inside React Native fragments used by brownfield apps, they used their own rule for "far enough to go back", and they added a lot of API.
- These belong in community packages, for example react-native-screens through Android's fragment navigation, or animation libraries. React Native core gives the basic switch and stays thin.

## Summary

Make the Android predictive back animation work by default in React Native apps. On Android 16+ with targetSdk 36+, React Native stops taking back unless it's asked to. Code that needs to handle back opts in with `BackHandler.setInterceptEnabled(true)`.

This reduces the scope and guarantees of `BackHandler` on Android. It still works the same way when on, but it's off by default, and native code can override it.

## Basic example

A JS screen with its own back stack:

```js
import {useEffect} from 'react';
import {BackHandler} from 'react-native';

function useAndroidBack(canGoBack, goBack) {
  useEffect(() => {
    // Ask for back only while there is something to go back to.
    BackHandler.setInterceptEnabled(canGoBack);
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => {
      subscription.remove();
      BackHandler.setInterceptEnabled(false);
    };
  }, [canGoBack, goBack]);
}
```

A native library or brownfield host taking back from React Native:

```kotlin
reactActivity.backPressedCallback.isEnabled = false
```

## Motivation

### Current state

React Native's JS API for back is `BackHandler`. A listener returns `true` to say "I handled back, do nothing else" or `false` to say "not me, do the default". That model needs React Native to hear _every_ back press first, and decide only afterwards whether to keep it.

On targetSdk 36, Android no longer calls `onBackPressed()`, so React Native would stop hearing back at all. To keep `BackHandler` working, [#51096](https://github.com/facebook/react-native/pull/51096) added a back callback to `ReactActivity` that is **always on**. [#54958](https://github.com/facebook/react-native/pull/54958) later fixed re-enabling it after the default back action.

This keeps `BackHandler` working, but no React Native screen ever gets the system animation. React Native apps are quietly opted out of predictive back, while native apps get it. Users see the difference, and app developers can't fix it without fighting React Native.

### Integration with native navigation

react-native-screens uses Android fragments for native navigation, and wants Android's fragment system to handle back so it can animate screen transitions. Today it has to compete with `ReactActivity`'s always-on callback.

### Brownfield apps

In brownfield apps, React Native is one part of a bigger native app. We tested this with a demo app built on [react-native-brownfield](https://github.com/callstack/react-native-brownfield), with the path _native screen → React Native screen → native screen with an embedded React Native fragment_. We found:

- **Back callbacks are per activity, and the last one turned on wins.** When a native fragment or native screen on top turns on its own callback, it takes back from React Native. `BackHandler` stops getting back, and JS isn't told.
- **The library that hosts React Native can block the animation too.** Core's `ReactFragment` registers no callback; the host has to call `onBackPressed()` itself. react-native-brownfield's fragment adds its own always-on callback, so the system animation never plays on that screen.
- **`BackHandler` listeners are shared by every React Native screen on the same JS runtime.** A back press meant for the embedded fragment also popped the React Native screen hidden behind it.
- **The pattern that works:** the native host owns back. It animates with the androidx activity 1.8 progress callbacks, then passes the final back press to the React Native fragment.

The research write-ups are in the `rn-predictive-back-brownfield` repo, under `research/01-brownfield-demo.html` and `research/02-rn-branch-in-brownfield.html`.

### The question: integrate, or be the only one?

Should React Native on Android integrate with native back handling, or assume it's the only one handling back? This proposal says **integrate**. React Native should behave like any well-behaved Android component: take back only when it has something to go back to, and let others take it otherwise.

### Expected benefits

- The system animation works by default in every React Native app.
- Native navigation libraries and brownfield hosts can own back without hacks.
- React Native's back handling matches Android's model, so Android docs and patterns apply.

## Design

### `ReactActivity`

- On targetSdk 36+, `ReactActivity` still registers `mBackPressedCallback` on the activity's `OnBackPressedDispatcher`, but creates it **disabled**.
- When the callback is on and back happens, it runs the old path: `ReactActivityDelegate.onBackPressed()`, then the `hardwareBackPress` JS event. If no listener returns `true`, it calls `invokeDefaultOnBackPressed()`.
- `invokeDefaultOnBackPressed()` returns early if `isFinishing()`. Otherwise it turns the callback off, runs the default back action, and turns the callback back on.
- New public method `getBackPressedCallback()` returns `mBackPressedCallback`.

### JS API

- `BackHandler.setInterceptEnabled(enabled: boolean): void` is a new method. It's a no-op on iOS.
- It calls `NativeDeviceEventManager.setInterceptEnabled(enabled)`. On Android, `DeviceEventManagerModule` turns the `ReactActivity` callback on or off.
- `addEventListener('hardwareBackPress', …)` doesn't change. Listeners only run while interception is on, or on older Android versions that still call `onBackPressed()`.

### Which activity the call reaches

In our prototype, the native module acts on `currentActivity`, the activity in front. In brownfield apps that's often a native activity. A call from a hidden React Native screen is then dropped, and that screen's activity keeps its old value. In our test, a React Native screen kept blocking back while JS believed it had let go. Options:

- **A.** Store the requested value per React Native surface or per `ReactHost`, and apply it when a `ReactActivity` resumes.
- **B.** Pass the root tag of the calling surface, so native code can find the right activity.
- **C.** Keep `currentActivity`, and document that the call targets the React Native activity in front and must be repeated when a screen gets focus.

We recommend A or B; C is the minimum.

### Fragments and brownfield

- Core adds no callback to `ReactFragment`. The host app owns back and passes the final back press to the fragment with `ReactFragment.onBackPressed()` (or `ReactDelegate.onBackPressed()`).
- A small host-facing API is an open question: for example, a way for the host to ask "does JS want back right now?".
- react-native-brownfield should expose or turn off its fragment callback. That's a change in that library, not in core.

### Optional observer event

- On API 36+, register one `OnBackInvokedCallback` at `PRIORITY_SYSTEM_NAVIGATION_OBSERVER`. It's called only when no other callback took back.
- Send a new JS event, for example `backCommitted`, that can't be cancelled. Never send `hardwareBackPress` from it.
- On Android 16, only one observer is allowed per window, so the host app can't register its own. This needs a decision before shipping.

### Not in core

- Gesture progress events, `PredictiveBackAnimatedView`, React Native's own in-app back animation, and native progress listener APIs.
- If core ever sends progress, it should use the androidx activity 1.8 callbacks (`handleOnBackStarted/Progressed/Cancelled`) on the same `OnBackPressedCallback`, not a second platform callback.

## Drawbacks

- **Breaking change on Android 16+ with targetSdk 36.** Code that blocks back with `BackHandler` stops getting back until it calls `setInterceptEnabled(true)`. Examples: JS-only navigators, modals, forms with unsaved changes, "press back twice to exit".
- **No ownership guarantee.** Native code turned on later wins. JS can't ask whether it still owns back, so a screen may think it blocks back when it doesn't.
- **Libraries must update.** React Navigation's JS stack, modals and drawers need to call `setInterceptEnabled(canGoBack)`. Until they do, back in those apps closes the screen instead of going back inside JS.
- **Different behaviour across Android versions.** Older Android versions still call `onBackPressed()`, so `BackHandler` keeps working there without opting in. Developers might test only on one version.

## Alternatives

**1. Keep today's always-on callback.**
`BackHandler` keeps working, but React Native apps never get the system animation. When Google removes the manifest opt-out, React Native will still block the animation, and React Native apps will stay behind native ones.

**2. Use the observer only, never block.**
React Native would never turn on a callback. It would only watch with `PRIORITY_SYSTEM_NAVIGATION_OBSERVER` and report back to JS. Problems:

- JS loses the power to prevent the default. Today a listener can return `true` to keep the user on the screen; with an observer, Android has already acted.
- It's called after the fact, often after the activity has closed. In our test, a JS listener popped its stack on a screen that was already going away.
- It works only on Android 16+, and only one observer is allowed per window on Android 16.
- It gets no gesture progress.

It's good as an extra notification (point 5), but it can't replace `BackHandler`. Apps that need to block back still have to declare it ahead of time, which is Android's model.

**3. Turn the callback on automatically while `hardwareBackPress` listeners exist.**
React Navigation and analytics libraries always add listeners, so back would be blocked in almost every app, the same as today.

**4. Tell developers to use the manifest opt-out.**
Google calls it temporary, and it turns all predictive back animations off.

**5. Full predictive back support in core.**
We built this in a prototype: gesture progress events, `PredictiveBackAnimatedView`, and React Native's own in-app back animation. It worked in a plain `ReactActivity`. It didn't work in React Native fragments, it chose the activity to listen to only once, used its own "far enough to go back" rule, and added a lot of public API. Community packages are a better home.

**6. A claim or proxy API, or using `PRIORITY_OVERLAY`.**
React Native would try to always win against other callbacks. This works against Android's model, breaks native navigation libraries and brownfield hosts, and was rejected.

## Prior-Art

- **Android's own model.** `OnBackPressedCallback.isEnabled` means "I will handle back", and it's set ahead of time. This proposal maps `setInterceptEnabled` directly onto it.
- **Jetpack Compose.** `BackHandler(enabled = …)` is the same switch: back is handled only while `enabled` is true.
- **Flutter.** For Android predictive back, Flutter deprecated `WillPopScope`, where a widget decided after the back press whether to allow it. Its replacement is `PopScope(canPop: …)`, where the widget declares ahead of time. That's the same move this proposal makes for `BackHandler`.

## After Review

### Adoption strategy

- **Rollout:** ship the new default behind a feature flag for one release, then make it the default for targetSdk 36+.
- **Breaking change:** yes, for apps on Android 16+ with targetSdk 36 that block back with `BackHandler`. Changelog: `[Android][Breaking]`.
- **Coordinate with:**
  - React Navigation and Expo Router: call `setInterceptEnabled(canGoBack)` in JS stacks, modals and drawers.
  - react-native-screens: use `getBackPressedCallback()` when native navigation owns back.
  - react-native-brownfield: expose or turn off its fragment callback, and document "the host owns back".
- **Migration for app code:**
  - If you never block back, there's nothing to do; you get the animation.
  - If you do, call `setInterceptEnabled(true)` only while you need back, and turn it off when you're done.

### How we teach this

- **Terminology:** "intercept". Interception on means React Native takes back from Android; off means Android handles back and animates.
- **One-line message:** on Android 16+, the system animates back by default. Turn interception on only while your screen has something to go back to. It's a request, not a guarantee.
- **Docs:**
  - Update the `BackHandler` page with `setInterceptEnabled`, the Android 16 behaviour, and the example above.
  - Add a short brownfield section: the host app owns back and passes it to React Native.
  - Add a migration note to the release blog post.
- **For existing developers:** present it as a continuation of `BackHandler`, with one new rule: say ahead of time when you need back.

### Unresolved questions

- Do we accept the breaking change of disabling by default, or do we need a softer path?
- How should `setInterceptEnabled` find the right activity? Per surface or per `ReactHost` (option A), a root tag (option B), or "the React Native activity in front" (option C)?
- Should core add the observer event? What should it be called, and how do we handle the one-observer-per-window limit on Android 16?
- Should `ReactDelegate` or `ReactFragment` get a host-facing API, for example "does JS want back?"
- How can JS learn that native code took back from it?
- `BackHandler` listeners are shared by all React Native surfaces on one runtime. Is that in scope, or a separate RFC?
- Needs checking: devices on Android 13–15 with targetSdk 36 should still call `onBackPressed()`, so `BackHandler` would work as today there. We haven't tested this.
