/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtual

/**
 * Represents the render state of children in the most recent commit.
 *
 * This enables `ReactVirtualView` to know whether a previously emitted `VirtualViewModeChangeEvent`
 * has been committed, in order to only emit subsequent events that would change it.
 */
internal enum class VirtualViewRenderState(val value: Int) {
  Unknown(0),
  Rendered(1),
  None(2),
}
