/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.uimanager.StateWrapper.UpdateMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * UpdateMode.value crosses JNI and is cast straight to C++ EventQueue::UpdateMode, so the values
 * must match its order (Asynchronous = 0, unstable_Immediate = 1). A mismatch silently flips
 * async/sync state updates.
 */
@RunWith(RobolectricTestRunner::class)
class StateWrapperUpdateModeTest {

  @Test
  fun updateModeValues_matchCxxEventQueueUpdateMode() {
    assertThat(UpdateMode.Asynchronous.value).isEqualTo(0)
    assertThat(UpdateMode.unstable_Immediate.value).isEqualTo(1)
  }

  @Test
  fun updateModeValues_areDistinct() {
    assertThat(UpdateMode.entries.map { it.value }).doesNotHaveDuplicates()
  }
}
