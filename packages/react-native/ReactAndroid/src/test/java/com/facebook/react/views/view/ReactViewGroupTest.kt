/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.app.Activity
import android.content.Context
import android.graphics.BlendMode
import android.graphics.Canvas
import android.graphics.Paint
import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import com.facebook.react.R
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.HasElevatedDescendantCache
import com.facebook.react.uimanager.PointerEvents
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactViewGroupTest {

  private lateinit var context: Context

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = Robolectric.buildActivity(Activity::class.java).create().get()
  }

  @After
  fun tearDown() {
    @Suppress("DEPRECATION")
    com.facebook.react.config.ReactFeatureFlags.dispatchPointerEvents = false
  }

  @Test
  fun `hover with pointer events - sends accessibility hover enter and exit`() {
    enablePointerEvents()
    val rvg = hoverableView()

    assertThat(rvg.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_ENTER, 10f))).isTrue()
    assertThat(rvg.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 20f))).isTrue()
    assertThat(rvg.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_EXIT, 20f))).isTrue()

    assertThat(rvg.sentAccessibilityEvents)
        .containsExactly(
            AccessibilityEvent.TYPE_VIEW_HOVER_ENTER,
            AccessibilityEvent.TYPE_VIEW_HOVER_EXIT,
        )
  }

  @Test
  fun `hover with pointer events - sends hover exit when the pointer moves out of the view`() {
    enablePointerEvents()
    val rvg = hoverableView()

    rvg.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 10f))
    rvg.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 150f))

    assertThat(rvg.sentAccessibilityEvents)
        .containsExactly(
            AccessibilityEvent.TYPE_VIEW_HOVER_ENTER,
            AccessibilityEvent.TYPE_VIEW_HOVER_EXIT,
        )
  }

  @Test
  fun `hover with pointer events - a hovered child attributes the hover to its accessible parent`() {
    enablePointerEvents()
    val parent = hoverableView()
    val overlay = ReactViewGroup(parent.context)
    parent.addView(overlay)
    overlay.layout(0, 0, 100, 100)

    assertThat(overlay.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_ENTER, 10f))).isTrue()

    assertThat(parent.sentAccessibilityEvents)
        .containsExactly(AccessibilityEvent.TYPE_VIEW_HOVER_ENTER)
  }

  @Test
  fun `hover with pointer events - a child with pointerEvents none does not block the parent hover`() {
    enablePointerEvents()
    val parent = hoverableView()
    val overlay = ReactViewGroup(parent.context).apply { pointerEvents = PointerEvents.NONE }
    parent.addView(overlay)
    overlay.layout(0, 0, 100, 100)

    assertThat(
            parent.dispatchGenericMotionEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 10f)),
        )
        .isTrue()

    assertThat(parent.sentAccessibilityEvents)
        .containsExactly(AccessibilityEvent.TYPE_VIEW_HOVER_ENTER)
  }

  @Test
  fun `hover with pointer events - a child under the pointer keeps the parent hover silent`() {
    enablePointerEvents()
    val parent = hoverableView()
    val label = View(parent.context)
    parent.addView(label)
    label.layout(0, 0, 50, 50)

    parent.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 10f))
    assertThat(parent.sentAccessibilityEvents).isEmpty()

    parent.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 80f))
    assertThat(parent.sentAccessibilityEvents)
        .containsExactly(AccessibilityEvent.TYPE_VIEW_HOVER_ENTER)
  }

  @Test
  fun `hover with pointer events - a view that cannot be a touch target sends no hover events`() {
    enablePointerEvents()
    val rvg = hoverableView()
    rvg.pointerEvents = PointerEvents.BOX_NONE

    assertThat(rvg.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_ENTER, 10f))).isFalse()

    assertThat(rvg.sentAccessibilityEvents).isEmpty()
  }

  @Test
  fun `hover with pointer events - a view with no accessible ancestor sends enter once it becomes accessible`() {
    enablePointerEvents()
    val rvg = AccessibilityEventRecordingViewGroup(context)
    rvg.layout(0, 0, 100, 100)

    rvg.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 10f))
    assertThat(rvg.sentAccessibilityEvents).isEmpty()

    rvg.contentDescription = "Button"
    rvg.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 20f))
    rvg.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_EXIT, 20f))

    assertThat(rvg.sentAccessibilityEvents)
        .containsExactly(
            AccessibilityEvent.TYPE_VIEW_HOVER_ENTER,
            AccessibilityEvent.TYPE_VIEW_HOVER_EXIT,
        )
  }

  @Test
  fun `hover with pointer events - hover exit goes to the view that got hover enter`() {
    enablePointerEvents()
    val parent = hoverableView()
    val overlay = AccessibilityEventRecordingViewGroup(parent.context)
    parent.addView(overlay)
    overlay.layout(0, 0, 100, 100)

    overlay.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 10f))
    overlay.contentDescription = "Overlay"
    overlay.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_EXIT, 10f))

    assertThat(parent.sentAccessibilityEvents)
        .containsExactly(
            AccessibilityEvent.TYPE_VIEW_HOVER_ENTER,
            AccessibilityEvent.TYPE_VIEW_HOVER_EXIT,
        )
    assertThat(overlay.sentAccessibilityEvents).isEmpty()
  }

  @Test
  fun `hover with pointer events - recycling a hovered view sends the pending hover exit`() {
    enablePointerEvents()
    val parent = hoverableView()
    val overlay = ReactViewGroup(parent.context)
    parent.addView(overlay)
    overlay.layout(0, 0, 100, 100)

    overlay.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 10f))
    overlay.recycleView()

    assertThat(parent.sentAccessibilityEvents)
        .containsExactly(
            AccessibilityEvent.TYPE_VIEW_HOVER_ENTER,
            AccessibilityEvent.TYPE_VIEW_HOVER_EXIT,
        )
  }

  @Test
  fun `hover with pointer events - detaching a hovered view sends the pending hover exit`() {
    enablePointerEvents()
    val parent = hoverableView()
    val overlay = ReactViewGroup(parent.context)
    parent.addView(overlay)
    overlay.layout(0, 0, 100, 100)

    overlay.onHoverEvent(hoverEvent(MotionEvent.ACTION_HOVER_MOVE, 10f))
    parent.removeView(overlay)

    assertThat(parent.sentAccessibilityEvents)
        .containsExactly(
            AccessibilityEvent.TYPE_VIEW_HOVER_ENTER,
            AccessibilityEvent.TYPE_VIEW_HOVER_EXIT,
        )
  }

  @Test
  fun `View clipping - ensure allChildren properly resizes when adding views in sequence`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    for (i in 0..20) {
      rvg.addViewWithSubviewClippingEnabled(TestView(context, i * 10), i)
    }
    rvg.updateClippingRect()
    assertThat(rvg.childCount).isEqualTo(10)
  }

  @Test
  fun `View clipping - ensure allChildren properly resizes when adding views out of sequence`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    for (i in 0..10) {
      rvg.addViewWithSubviewClippingEnabled(TestView(context, i * 10), i)
    }
    repeat(10) { rvg.addViewWithSubviewClippingEnabled(TestView(context, 90), 10) }
    rvg.updateClippingRect()
    assertThat(rvg.childCount).isEqualTo(20)
  }

  @Test
  fun `mix blend mode - drawing a child reads no sibling's blend mode`() {
    fun blendModeReadsPerChild(childCount: Int): Int {
      val rvg = ReactViewGroup(context)
      val children = List(childCount) { BlendModeReadCountingView(context) }
      children.forEach { rvg.addView(it) }
      rvg.layout(0, 0, 100, 100)
      rvg.draw(Canvas())
      return children.maxOf { it.blendModeReads }
    }

    assertThat(blendModeReadsPerChild(20)).isEqualTo(blendModeReadsPerChild(2))
  }

  @Test
  fun `mix blend mode - a child with a blend mode draws into a layer with that blend mode`() {
    val rvg = ReactViewGroup(context)
    rvg.addView(View(context))
    rvg.addView(View(context).apply { setTag(R.id.mix_blend_mode, BlendMode.MULTIPLY) })
    rvg.addView(View(context))
    rvg.layout(0, 0, 100, 100)
    val canvas = LayerRecordingCanvas()
    rvg.draw(canvas)
    assertThat(canvas.layerBlendModes).containsExactly(null, BlendMode.MULTIPLY)
  }

  @Test
  fun `auto offscreen compositing - true when alpha lt 1 and there is an elevated descendant`() {
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - true even at alpha 1 so the layer is ready for a later alpha change`() {
    // Returning true at full opacity is what bakes the offscreen decision into the RenderNode, so a
    // later alpha change -- including a native-driver opacity animation -- composites uniformly. No
    // layer is actually allocated until alpha < 1, so this costs nothing while opaque.
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 1f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - false when there is no elevated descendant`() {
    val rvg = ReactViewGroup(context)
    mount(rvg, View(context))
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - detects a nested elevated descendant`() {
    val rvg = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    inner.addView(elevatedChild())
    mount(rvg, inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - detects an elevated view inside a non-ReactViewGroup container`() {
    val rvg = ReactViewGroup(context)
    val container = FrameLayout(context)
    container.addView(elevatedChild())
    mount(rvg, container)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidation bubbles through a non-ReactViewGroup ancestor`() {
    val rvg = ReactViewGroup(context)
    val container = FrameLayout(context)
    val inner = ReactViewGroup(context)
    rvg.addView(container)
    container.addView(inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
    // An elevated view mounted deep under a non-RVG container must still invalidate the RVG
    // ancestor.
    inner.addView(elevatedChild())
    HasElevatedDescendantCache.invalidateAncestors(inner)
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - reflects an elevated child added after a prior query`() {
    val rvg = ReactViewGroup(context)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
    mount(rvg, elevatedChild())
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - false once the elevated descendant is removed`() {
    val rvg = ReactViewGroup(context)
    val child = elevatedChild()
    mount(rvg, child)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
    unmount(rvg, child)
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `needsOffscreenAlphaCompositing forces overlapping rendering`() {
    val rvg = ReactViewGroup(context)
    rvg.setNeedsOffscreenAlphaCompositing(true)
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - recycling a child invalidates the parent`() {
    val rvg = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    inner.addView(elevatedChild())
    mount(rvg, inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
    inner.recycleView()
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - counts an elevated descendant that is currently clipped out`() {
    val rvg = ReactViewGroup(context)
    rvg.left = 0
    rvg.right = 100
    rvg.top = 0
    rvg.bottom = 100
    FrameLayout(context).addView(rvg)
    rvg.removeClippedSubviews = true
    // Elevated child positioned far below the viewport, so it is clipped out (detached, only in
    // allChildren). The logical scan must still count it.
    val elevated =
        View(context).apply {
          elevation = 10f
          left = 0
          right = 100
          top = 1000
          bottom = 1010
        }
    rvg.addViewWithSubviewClippingEnabled(elevated, 0)
    rvg.updateClippingRect()
    HasElevatedDescendantCache.invalidateAncestors(rvg)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidateAncestors refreshes an outer ReactViewGroup across a nested one`() {
    val outer = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    mount(outer, inner)
    assertThat(outer.hasOverlappingRendering()).isFalse()

    // Add deep, then invalidate starting from the inner node: the walk must reach and refresh
    // outer.
    inner.addView(elevatedChild())
    HasElevatedDescendantCache.invalidateAncestors(inner)
    assertThat(outer.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidateElevatedDescendantCache reports whether it changed state`() {
    val rvg = ReactViewGroup(context)
    rvg.addView(elevatedChild())
    // Prime the cache.
    assertThat(rvg.hasOverlappingRendering()).isTrue()

    // First invalidation clears a valid cache; the second finds it already stale.
    assertThat(rvg.invalidateElevatedDescendantCache()).isTrue()
    assertThat(rvg.invalidateElevatedDescendantCache()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - invalidateAncestors short-circuits at an already-stale node`() {
    val outer = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    mount(outer, elevatedChild()) // direct elevated child, scanned first
    mount(outer, inner) // nested ReactViewGroup, scanned second

    // Querying outer returns true from its own elevated child and short-circuits before descending
    // inner, so inner's cache is left stale.
    assertThat(outer.hasOverlappingRendering()).isTrue()

    // Invalidating from inner finds inner already stale and stops there; outer's still-correct
    // cached result must be unaffected.
    HasElevatedDescendantCache.invalidateAncestors(inner)
    assertThat(outer.hasOverlappingRendering()).isTrue()
  }

  // Mirrors the ViewManager mount/unmount hooks: attach/detach the child, then refresh the cache.
  private fun mount(parent: ReactViewGroup, child: View) {
    parent.addView(child)
    HasElevatedDescendantCache.invalidateAncestors(parent)
  }

  private fun unmount(parent: ReactViewGroup, child: View) {
    parent.removeView(child)
    HasElevatedDescendantCache.invalidateAncestors(parent)
  }

  private fun elevatedChild(): View = View(context).apply { elevation = 10f }

  private fun enablePointerEvents() {
    @Suppress("DEPRECATION")
    com.facebook.react.config.ReactFeatureFlags.dispatchPointerEvents = true
  }

  // Accessibility hover events are only sent from views attached to a window.
  private fun hoverableView(): AccessibilityEventRecordingViewGroup {
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    val view =
        AccessibilityEventRecordingViewGroup(activity).apply { contentDescription = "Button" }
    activity.setContentView(view)
    view.layout(0, 0, 100, 100)
    return view
  }

  private fun hoverEvent(action: Int, position: Float): MotionEvent =
      MotionEvent.obtain(0, 0, action, position, position, 0).apply {
        source = InputDevice.SOURCE_MOUSE
      }
}

private class AccessibilityEventRecordingViewGroup(context: Context) : ReactViewGroup(context) {
  val sentAccessibilityEvents = mutableListOf<Int>()

  override fun sendAccessibilityEvent(eventType: Int) {
    sentAccessibilityEvents.add(eventType)
    super.sendAccessibilityEvent(eventType)
  }
}

class TestView(context: Context, yPos: Int) : View(context) {
  init {
    left = 0
    right = 100
    top = yPos
    bottom = top + 10
  }
}

class TestParent(context: Context) : ViewGroup(context) {
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit
}

private class BlendModeReadCountingView(context: Context) : View(context) {
  var blendModeReads = 0

  override fun getTag(key: Int): Any? {
    if (key == R.id.mix_blend_mode) {
      blendModeReads++
    }
    return super.getTag(key)
  }
}

private class LayerRecordingCanvas : Canvas() {
  val layerBlendModes = mutableListOf<BlendMode?>()

  override fun saveLayer(left: Float, top: Float, right: Float, bottom: Float, paint: Paint?): Int {
    layerBlendModes.add(paint?.blendMode)
    return super.saveLayer(left, top, right, bottom, paint)
  }
}
