/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jstasks

import com.facebook.react.bridge.WritableMap

/**
 * Class that holds the various parameters needed to start a JS task.
 *
 * @property taskKey the key for the JS task to execute. This is the same key that you call
 *   `AppRegistry.registerTask` with in JS.
 * @property data a map of parameters passed to the JS task executor.
 * @property timeout the amount of time (in ms) after which the React instance should be terminated
 *   regardless of whether the task has completed or not. This is meant as a safeguard against
 *   accidentally keeping the device awake for long periods of time because JS crashed or some
 *   request timed out. A value of 0 means no timeout (should only be used for long-running tasks
 *   such as music playback).
 * @property isAllowedInForeground whether to allow this task to run while the app is in the
 *   foreground (i.e. there is a host in resumed mode for the current ReactContext). Only set this
 *   to true if you really need it. Note that tasks run in the same JS thread as UI code, so doing
 *   expensive operations would degrade user experience.
 * @property retryPolicy the number of times & delays the task should be retried on error.
 */
public class HeadlessJsTaskConfig
@JvmOverloads
constructor(
    public val taskKey: String,
    public val data: WritableMap,
    public val timeout: Long = 0,
    public val isAllowedInForeground: Boolean = false,
    public val retryPolicy: HeadlessJsTaskRetryPolicy? = NoRetryPolicy.INSTANCE,
) {

  /**
   * Copy constructor to create a HeadlessJsTaskConfig from an existing one. Equivalent to calling
   * [HeadlessJsTaskConfig] with `false` for `allowedInBackground`.
   */
  public constructor(
      source: HeadlessJsTaskConfig,
  ) : this(
      source.taskKey,
      source.data.copy(),
      source.timeout,
      source.isAllowedInForeground,
      source.retryPolicy?.copy(),
  )
}
