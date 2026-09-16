/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import android.view.View

/**
 * Interface for handling a surface in React Native. In mobile platform a surface can be any
 * container that holds some [View]. For example, a Dialog can be a surface to wrap content view
 * object as needed. In VR platform, a surface is provided by Shell panel app sdk, which requires
 * custom logic to show/hide. NativeModules requires a surface will delegate interactions with the
 * surface to a SurfaceDelegate.
 */
public interface SurfaceDelegate {
  /**
   * Create the React content view that uses the appKey as the React application name
   *
   * @param appKey
   */
  public fun createContentView(appKey: String)

  /**
   * Check if the content view is created and ready to be shown
   *
   * @return true if the content view is ready to be shown
   */
  public fun isContentViewReady(): Boolean

  /** Destroy the React content view to avoid memory leak */
  public fun destroyContentView()

  /** Show the surface containing the React content view */
  public fun show()

  /** Hide the surface containing the React content view */
  public fun hide()

  /** Check if the surface is currently showing */
  public fun isShowing(): Boolean
}
