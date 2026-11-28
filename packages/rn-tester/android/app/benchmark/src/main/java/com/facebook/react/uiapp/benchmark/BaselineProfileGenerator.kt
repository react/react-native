/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.benchmark

import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.Until
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Generates the Baseline Profile shipped with ReactAndroid
 * (`packages/react-native/ReactAndroid/src/main/baseline-prof.txt`).
 *
 * The journey is a cold start of RNTester followed by scrolling its component list. Run it on a
 * device with Android 13 or newer (or a rooted one with Android 9 or newer) against a non-minified
 * release build, then keep only ReactAndroid's rules:
 * ```
 * ./gradlew :packages:rn-tester:android:app:benchmark:connectedHermesBenchmarkAndroidTest \
 *     -Preact.internal.disableMinifyInReleaseBuilds=true \
 *     -Pandroid.testInstrumentationRunnerArguments.class=com.facebook.react.uiapp.benchmark.BaselineProfileGenerator
 * ./gradlew :packages:react-native:ReactAndroid:assembleRelease
 * node scripts/update-android-baseline-profile.js
 * ```
 *
 * `node scripts/update-android-baseline-profile.js --check` lists rules that no longer match
 * ReactAndroid's classes, without needing a device.
 */
@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {
  @get:Rule val baselineProfileRule = BaselineProfileRule()

  @Test
  fun generate() =
      baselineProfileRule.collect(
          packageName = "com.facebook.react.uiapp",
          stableIterations = 3,
          maxIterations = 10,
      ) {
        pressHome()
        // `startActivityAndWait()` can't confirm the launch on some OEM builds, so start the
        // activity directly and wait for RNTester's first screen.
        device.executeShellCommand(
            "am start -W -n $packageName/com.facebook.react.uiapp.RNTesterActivity"
        )
        // Fail instead of collecting a profile that only covers part of the journey.
        check(device.wait(Until.hasObject(By.text("Components")), 10_000)) {
          "RNTester's component list didn't appear"
        }
        device.waitForIdle()

        val list =
            checkNotNull(device.findObject(By.scrollable(true))) {
              "RNTester's component list isn't scrollable"
            }
        list.setGestureMargin(device.displayWidth / 5)
        list.fling(Direction.DOWN)
        device.waitForIdle()
        list.fling(Direction.UP)
        device.waitForIdle()
      }
}
