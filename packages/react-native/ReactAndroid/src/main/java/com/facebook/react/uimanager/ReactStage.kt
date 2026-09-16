/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.uimanager

import androidx.annotation.IntDef

/** The stage of the Surface */
@Retention(AnnotationRetention.SOURCE)
@IntDef(
    value =
        [
            ReactStage.SURFACE_DID_INITIALIZE,
            ReactStage.BRIDGE_DID_LOAD,
            ReactStage.MODULE_DID_LOAD,
            ReactStage.SURFACE_DID_RUN,
            ReactStage.SURFACE_DID_INITIAL_RENDERING,
            ReactStage.SURFACE_DID_INITIAL_LAYOUT,
            ReactStage.SURFACE_DID_INITIAL_MOUNTING,
            ReactStage.SURFACE_DID_STOP,
        ],
)
public annotation class ReactStage {
  public companion object {
    public const val SURFACE_DID_INITIALIZE: Int = 0
    public const val BRIDGE_DID_LOAD: Int = 1
    public const val MODULE_DID_LOAD: Int = 2
    public const val SURFACE_DID_RUN: Int = 3
    public const val SURFACE_DID_INITIAL_RENDERING: Int = 4
    public const val SURFACE_DID_INITIAL_LAYOUT: Int = 5
    public const val SURFACE_DID_INITIAL_MOUNTING: Int = 6
    public const val SURFACE_DID_STOP: Int = 7
    public const val ON_ATTACH_TO_INSTANCE: Int = 101
  }
}
