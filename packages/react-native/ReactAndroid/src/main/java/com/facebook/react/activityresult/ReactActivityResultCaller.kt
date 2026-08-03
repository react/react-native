/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.activityresult

import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContract

/**
 * Lets a native module register an AndroidX [ActivityResultContract] against the host Activity's
 * `ActivityResultRegistry` and receive results, without any changes to the consumer's
 * `MainActivity`.
 *
 * The API deliberately mirrors `androidx.activity.ComponentActivity.registerForActivityResult`:
 * same method name, same [ActivityResultCallback] shape, same returned [ActivityResultLauncher]
 * type. Unlike an Activity, a caller obtained from a `ReactContext` may register at any time --
 * including before any Activity exists -- and the returned launcher binds lazily to the real
 * registry once the host resumes.
 *
 * Every registration carries a key that must be unique within the `ReactContext` and stable across
 * process death -- after the process is killed mid-flow, AndroidX replays the restored result to
 * whichever registration reproduces the same key string. The default key is scoped to the caller
 * (`"<owner class>:<contract class>"`), which is what lets two unrelated libraries both register a
 * stock contract such as `ActivityResultContracts.GetContent` without colliding.
 *
 * A collision throws an [IllegalStateException] at registration time. With owner scoping this is
 * only reachable when a single owner registers the same contract class twice; the fix is the
 * overload that takes an extra `key`, which is appended to -- not substituted for -- the
 * owner-and-contract scope, so a poorly chosen key can never reintroduce a cross-library collision.
 */
internal interface ReactActivityResultCaller {

  /**
   * Registers [contract] under the key `"<owner class>:<contract class>"` and returns a launcher
   * for it.
   *
   * [owner] should be a stable, long-lived object -- typically the native module itself. An
   * anonymous object or a short-lived per-call helper yields a synthetic name such as
   * `com.example.Foo$1`, which is fragile across builds and defeats re-association after process
   * death.
   *
   * @throws IllegalStateException if [owner] already registered this contract class
   */
  fun <I, O> registerForActivityResult(
      owner: Any,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I>

  /**
   * Registers [contract] under the key `"<owner class>:<contract class>:<key>"`. Use this when one
   * owner needs several launchers of the same contract class.
   *
   * [key] only has to be unique among [owner]'s registrations of this contract class -- the
   * owner-and-contract scope is still applied -- but it must be stable across process death, so
   * derive it from a constant rather than from runtime state.
   *
   * @throws IllegalStateException if [owner] already registered this contract class under [key]
   */
  fun <I, O> registerForActivityResult(
      owner: Any,
      key: String,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I>
}
