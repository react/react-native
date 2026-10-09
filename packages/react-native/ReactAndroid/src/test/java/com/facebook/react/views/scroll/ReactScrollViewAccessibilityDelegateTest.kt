/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.content.Context
import android.view.View
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.R
import com.facebook.react.bridge.JavaOnlyMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactScrollViewAccessibilityDelegateTest {
  private lateinit var context: Context
  private lateinit var scrollView: TestScrollView
  private lateinit var contentView: FrameLayout
  private lateinit var delegate: ReactScrollViewAccessibilityDelegate

  @Before
  fun setUp() {
    context = RuntimeEnvironment.getApplication()
    scrollView = TestScrollView(context)
    contentView = FrameLayout(context)
    scrollView.addView(contentView)
    delegate = ReactScrollViewAccessibilityDelegate()
  }

  @Test
  fun testOnInitializeAccessibilityEvent_allowsMissingOptionalCollectionFields() {
    scrollView.setTag(
        R.id.accessibility_collection,
        JavaOnlyMap().apply {
          putInt("rowCount", 3)
          putInt("columnCount", 1)
        },
    )
    contentView.addView(View(context))

    val event = AccessibilityEvent()
    delegate.onInitializeAccessibilityEvent(scrollView, event)

    assertThat(event.itemCount).isEqualTo(-1)
    assertThat(event.fromIndex).isEqualTo(-1)
    assertThat(event.toIndex).isEqualTo(-1)
  }

  @Test
  fun testOnInitializeAccessibilityEvent_readsNestedCollectionItemIndex() {
    scrollView.setTag(
        R.id.accessibility_collection,
        JavaOnlyMap().apply {
          putInt("itemCount", 5)
          putInt("rowCount", 5)
          putInt("columnCount", 1)
        },
    )
    val wrapper = FrameLayout(context)
    val item = View(context)
    item.setTag(
        R.id.accessibility_collection_item,
        JavaOnlyMap().apply {
          putInt("itemIndex", 2)
          putInt("rowIndex", 2)
          putInt("rowSpan", 1)
          putInt("columnIndex", 0)
          putInt("columnSpan", 1)
          putBoolean("heading", false)
        },
    )
    wrapper.addView(item)
    contentView.addView(wrapper)

    val event = AccessibilityEvent()
    delegate.onInitializeAccessibilityEvent(scrollView, event)

    assertThat(event.itemCount).isEqualTo(5)
    assertThat(event.fromIndex).isEqualTo(2)
    assertThat(event.toIndex).isEqualTo(2)
  }

  @Test
  fun testOnInitializeAccessibilityNodeInfo_defaultsMissingHierarchicalToFalse() {
    scrollView.setTag(
        R.id.accessibility_collection,
        JavaOnlyMap().apply {
          putInt("rowCount", 3)
          putInt("columnCount", 1)
        },
    )

    val nodeInfo = AccessibilityNodeInfoCompat.obtain()
    delegate.onInitializeAccessibilityNodeInfo(scrollView, nodeInfo)

    assertThat(nodeInfo.collectionInfo).isNotNull()
    assertThat(nodeInfo.collectionInfo.rowCount).isEqualTo(3)
    assertThat(nodeInfo.collectionInfo.columnCount).isEqualTo(1)
    assertThat(nodeInfo.collectionInfo.isHierarchical).isFalse()
  }

  private class TestScrollView(context: Context) : FrameLayout(context), ReactAccessibleScrollView {
    override val scrollEnabled: Boolean = true

    override fun isPartiallyScrolledInView(view: View): Boolean = true
  }
}
