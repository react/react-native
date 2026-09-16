/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

import android.app.Activity

/**
 * Interface implemented by [com.facebook.react.runtime.ReactHostImplDevHelper] exposing additional
 * hooks used to implement the V2 Perf Monitor overlay (experimental).
 */
internal interface PerfMonitorDevHelper {
  val currentActivity: Activity?

  /**
   * The inspector target object. Matches the lifetime of the ReactHost. May be null if modern JS
   * debugging is disabled.
   */
  val inspectorTarget: PerfMonitorInspectorTarget?
}
