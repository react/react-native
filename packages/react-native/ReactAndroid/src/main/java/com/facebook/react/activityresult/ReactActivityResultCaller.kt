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
 * Lets a native module register an AndroidX [ActivityResultContract] and receive results without
 * any changes to the consumer's `MainActivity`. Mirrors
 * `androidx.activity.ComponentActivity.registerForActivityResult`, except registration is legal at
 * any time: the returned launcher binds to the real registry once a host Activity resumes.
 *
 * Every registration carries a key that must be unique within the `ReactContext` and stable across
 * process death (AndroidX replays a restored result to whichever registration reproduces the same
 * key). The default key `"<owner class>:<contract class>"` lets unrelated libraries register the
 * same stock contract without colliding; a collision throws [IllegalStateException] at
 * registration time, and the keyed overload (which appends to that scope, not replaces it)
 * resolves it.
 */
internal interface ReactActivityResultCaller {

  /**
   * Registers [contract] under the key `"<owner class>:<contract class>"` and returns a launcher
   * for it. [owner] must be an instance of a named class — typically the native module itself.
   * Anonymous classes are rejected because their generated names can change between builds, which
   * breaks result delivery after the process is killed and restored. For the same reason, apps
   * that minify class names (R8/ProGuard) should keep the owner class's name, since the key is not
   * guaranteed to be stable between builds otherwise.
   *
   * @throws IllegalArgumentException if [owner] is an instance of an anonymous class
   * @throws IllegalStateException if [owner] already registered this contract class
   */
  fun <I, O> registerForActivityResult(
      owner: Any,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I>

  /**
   * Registers [contract] under the key `"<owner class>:<contract class>:<key>"`. Use this when
   * one owner needs several launchers of the same contract class. [key] only has to be unique
   * among those, but must stay the same across process restarts, so derive it from a constant.
   * [owner] carries the same requirements as the two-argument overload: it must be an instance of
   * a named class.
   *
   * @throws IllegalArgumentException if [owner] is an instance of an anonymous class
   * @throws IllegalStateException if [owner] already registered this contract class under [key]
   */
  fun <I, O> registerForActivityResult(
      owner: Any,
      key: String,
      contract: ActivityResultContract<I, O>,
      callback: ActivityResultCallback<O>,
  ): ActivityResultLauncher<I>
}
