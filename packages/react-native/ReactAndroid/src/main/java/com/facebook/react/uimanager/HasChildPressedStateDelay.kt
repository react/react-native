/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

/**
 * Implemented by scrollable container views that allow the delaying of their children's pressed
 * state (see [android.view.ViewGroup.shouldDelayChildPressedState]) to be toggled externally,
 * without changing the view's default behavior.
 *
 * This lets a module that holds a reference to such a container disable the delay (e.g. when it
 * knows the gesture will not turn into a scroll, so children should show their pressed state
 * immediately) and re-enable it afterwards.
 */
public interface HasChildPressedStateDelay {
  /**
   * Overrides whether this view delays its children's pressed state (see
   * [android.view.ViewGroup.shouldDelayChildPressedState]).
   *
   * When `null` (the default), the view's framework default is used. Set to `true` or `false` to
   * force the behavior, and back to `null` to restore the default. Lets a module holding a
   * reference to the container toggle the delay without changing the default.
   */
  public var hasChildPressedStateDelay: Boolean?
}
