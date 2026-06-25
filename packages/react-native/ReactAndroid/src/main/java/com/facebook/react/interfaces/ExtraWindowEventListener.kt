/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.interfaces

import android.view.Window

/**
 * Listener for receiving extra window creation and destruction events.
 *
 * This allows modules to react to new windows being added or removed, such as Dialog windows
 * registered by Modal components. Modules like StatusBarModule can implement this interface to
 * apply their configuration to all active windows.
 *
 * Third-party libraries can both implement this listener and emit window events through
 * [ReactContext.onExtraWindowCreate] and [ReactContext.onExtraWindowDestroy].
 */
public interface ExtraWindowEventListener {

  /** Called when a new [Window] is created (e.g. a Dialog window for a Modal). */
  public fun onExtraWindowCreate(window: Window)

  /** Called when a [Window] is destroyed (e.g. on Dialog window dismiss). */
  public fun onExtraWindowDestroy(window: Window)
}
