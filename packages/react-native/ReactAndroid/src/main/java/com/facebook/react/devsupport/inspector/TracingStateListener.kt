/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector

import com.facebook.proguard.annotations.DoNotStripAny

@DoNotStripAny
internal fun interface TracingStateListener {
  fun onStateChanged(state: TracingState, screenshotsEnabled: Boolean)
}
