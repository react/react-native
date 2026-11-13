/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.views.view.ReactViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.util.ReflectionHelpers

/**
 * Regression tests for issue #58186: content jumps for one frame when
 * `maintainVisibleContentPosition` adjusts the scroll offset during a Fabric mount
 *
 * The view tree copies the reproduction. Child 0 of the content is a 0x0 anchor view at a far top
 * offset. Child 1 is a wrapper that holds absolutely positioned items. A prepend takes two mounts.
 * The first mount grows the wrapper. The second mount moves the anchor and the items down by one
 * item height and does not change the size of the content
 *
 * In the second mount, `View.scrollTo` only posts an invalidation for the next frame. The current
 * frame replays the scroll view display list with the previous scroll offset. The tests read
 * `PFLAG_INVALIDATED`, the flag that `View.updateDisplayListIfDirty` checks before it records the
 * display list again. Only an invalidation of the scroll view itself sets this flag
 */
@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
class MaintainVisibleScrollPositionHelperTest {

  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>
  private lateinit var context: ReactContext
  private lateinit var scrollView: ReactScrollView
  private lateinit var contentView: ReactViewGroup
  private lateinit var anchor: View
  private lateinit var wrapper: ReactViewGroup
  private lateinit var mountListener: UIManagerListener
  private val uiManager: UIManager = mock()
  private var itemCount = INITIAL_COUNT

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = ReactTestHelper.createCatalystContextForTest()
    uiManagerHelperMock = mockStatic(UIManagerHelper::class.java)
    uiManagerHelperMock
        .`when`<UIManager> { UIManagerHelper.getUIManager(any(), eq(UIManagerType.FABRIC)) }
        .thenReturn(uiManager)

    scrollView = ReactScrollView(context)
    contentView = ReactViewGroup(context)
    anchor = View(context)
    wrapper = ReactViewGroup(context)
    contentView.addView(anchor)
    contentView.addView(wrapper)
    scrollView.addView(contentView)
    repeat(INITIAL_COUNT) { wrapper.addView(ReactViewGroup(context)) }

    scrollView.layout(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
    layoutWrapper()
    layoutAnchorAndItems()
    scrollView.scrollTo(0, INITIAL_SCROLL)

    scrollView.setMaintainVisibleContentPosition(
        MaintainVisibleScrollPositionHelper.Config(
            minIndexForVisible = 0,
            autoScrollToTopThreshold = null,
        ),
    )
    val listener = argumentCaptor<UIManagerListener>()
    verify(uiManager).addUIManagerEventListener(listener.capture())
    mountListener = listener.firstValue
  }

  @After
  fun tearDown() {
    uiManagerHelperMock.close()
  }

  @Test
  fun prepend_recordsScrollViewDisplayListWithNewOffsetInSameFrame() {
    prependOneItem()

    assertThat(scrollView.scrollY).isEqualTo(INITIAL_SCROLL + ITEM_HEIGHT)
    assertThat(isDisplayListInvalidated(scrollView)).isTrue()
  }

  @Test
  fun repeatedPrepends_keepScrollViewDisplayListInSyncWithOffset() {
    repeat(PREPEND_COUNT) {
      prependOneItem()
      assertThat(isDisplayListInvalidated(scrollView)).isTrue()
    }

    assertThat(scrollView.scrollY).isEqualTo(INITIAL_SCROLL + PREPEND_COUNT * ITEM_HEIGHT)
  }

  @Test
  fun mountWithoutMovedAnchor_doesNotScrollOrInvalidateScrollView() {
    markDisplayListRecorded(scrollView)

    mountListener.willMountItems(uiManager)
    mountListener.didMountItems(uiManager)

    assertThat(scrollView.scrollY).isEqualTo(INITIAL_SCROLL)
    assertThat(isDisplayListInvalidated(scrollView)).isFalse()
  }

  /**
   * Runs the two mounts of a prepend. The first mount grows the wrapper. The second mount adds the
   * new item and moves the anchor and the existing items. A frame is drawn between the mounts
   */
  private fun prependOneItem() {
    itemCount++

    mountListener.willMountItems(uiManager)
    layoutWrapper()
    mountListener.didMountItems(uiManager)
    markDisplayListRecorded(scrollView)

    mountListener.willMountItems(uiManager)
    wrapper.addView(ReactViewGroup(context), 0)
    layoutAnchorAndItems()
    mountListener.didMountItems(uiManager)
  }

  private fun layoutWrapper() {
    val height = itemCount * ITEM_HEIGHT
    contentView.layout(0, 0, VIEWPORT_WIDTH, height)
    wrapper.layout(0, 0, VIEWPORT_WIDTH, height)
  }

  private fun layoutAnchorAndItems() {
    val adjust = (itemCount - INITIAL_COUNT) * ITEM_HEIGHT
    anchor.layout(0, ANCHOR_TOP + adjust, 0, ANCHOR_TOP + adjust)
    for (i in 0 until wrapper.childCount) {
      wrapper.getChildAt(i).layout(0, i * ITEM_HEIGHT, VIEWPORT_WIDTH, (i + 1) * ITEM_HEIGHT)
    }
  }

  private fun isDisplayListInvalidated(view: View): Boolean =
      ReflectionHelpers.getField<Int>(view, "mPrivateFlags") and PFLAG_INVALIDATED != 0

  /** Simulates the renderer having recorded the display list of [view]. */
  private fun markDisplayListRecorded(view: View) {
    val flags = ReflectionHelpers.getField<Int>(view, "mPrivateFlags")
    ReflectionHelpers.setField(view, "mPrivateFlags", flags and PFLAG_INVALIDATED.inv())
    assertThat(isDisplayListInvalidated(view)).isFalse()
  }

  private companion object {
    const val ITEM_HEIGHT = 105
    const val INITIAL_COUNT = 40
    const val PREPEND_COUNT = 5
    const val VIEWPORT_WIDTH = 1080
    const val VIEWPORT_HEIGHT = 1920
    const val INITIAL_SCROLL = 5 * ITEM_HEIGHT
    const val ANCHOR_TOP = 10_000_000

    /**
     * Copy of `android.view.View.PFLAG_INVALIDATED` from AOSP
     * `frameworks/base/core/java/android/view/View.java`. The field is package-private and absent
     * from the SDK stubs, so it cannot be referenced directly. `View.invalidate()` sets this bit in
     * `mPrivateFlags` and the bit stays set until the display list of the view is recorded again.
     */
    val PFLAG_INVALIDATED = 0x80000000.toInt()
  }
}
