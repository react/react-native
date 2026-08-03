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
 * Registrations are keyed by the contract's fully-qualified class name. Registering the same
 * contract class twice throws an [IllegalStateException] at registration time; disambiguate by
 * subclassing the contract or using the [registerForActivityResult] overload that takes an `owner`.
 */
public interface ReactActivityResultCaller {

  /**
   * Registers [contract] and returns a launcher for it. The registration key is the contract's
   * fully-qualified class name.
   *
   * @throws IllegalStateException if a registration with the same key already exists
   */
  public fun <I, O> registerForActivityResult(
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I>

  /**
   * Same as [registerForActivityResult], but scopes the registration key to [owner]
   * (`"<owner class>:<contract class>"`). Use this when two independent callers need the same
   * stock contract class, or when registering from something other than a native module.
   */
  public fun <I, O> registerForActivityResult(
      owner: Any,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I>
}
