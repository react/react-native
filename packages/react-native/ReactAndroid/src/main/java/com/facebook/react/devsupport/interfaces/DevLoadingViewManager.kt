/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

/** Interface to display loading messages on top of the screen. */
public interface DevLoadingViewManager {
  public fun showMessage(message: String)

  public fun showMessage(
      message: String,
      color: Double?,
      backgroundColor: Double?,
      dismissButton: Boolean?,
  )

  public fun updateProgress(status: String?, done: Int?, total: Int?, percent: Int?)

  public fun hide()
}
