# React Native Library Gradle Plugin

This plugin configures React Native **library** projects (Android `com.android.library` modules) for codegen, Kotlin, and AGP integration.

Plugin ID: `com.facebook.react.library`

## Usage

When the consuming app uses `includeBuild` for `@react-native/gradle-plugin` (the standard React Native setup), libraries apply the plugin directly — **no `classpath` dependency is required**:

```kotlin
// android/build.gradle.kts
plugins {
  id("com.android.library")
  id("com.facebook.react.library")
}
```

See [`packages/react-native-popup-menu-android/android/build.gradle.kts`](../../react-native-popup-menu-android/android/build.gradle.kts) for a working in-repo example.
