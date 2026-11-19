/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.swiperefresh

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Verifies behavior of [ReactSwipeRefreshLayout]. */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactSwipeRefreshLayoutTest {

  private lateinit var context: ReactApplicationContext

  @Before
  fun setup() {
    context = createTestReactApplicationContext()
  }

  @Test
  fun testClipChildrenIsDisabledByDefault() {
    val layout = ReactSwipeRefreshLayout(context)
    assertThat(layout.clipChildren).isFalse()
  }
}
