/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

/**
 * A task to execute on the UI View for third party libraries.
 *
 * @deprecated This interface is part of the Legacy Architecture and will be removed in a future
 *   release. Use [com.facebook.react.bridge.UIManagerListener] or View Commands instead.
 */
@Deprecated("Use UIManagerListener or View Commands instead")
public fun interface UIBlock {
  public fun execute(
      @Suppress("DEPRECATION") nativeViewHierarchyManager: NativeViewHierarchyManager
  )
}
