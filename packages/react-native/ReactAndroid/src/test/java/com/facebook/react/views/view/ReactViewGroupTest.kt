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
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.R
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.HasElevatedDescendantCache
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.util.ReflectionHelpers

@RunWith(RobolectricTestRunner::class)
class ReactViewGroupTest {

  private lateinit var context: Context

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = Robolectric.buildActivity(Activity::class.java).create().get()
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
  fun `auto offscreen compositing - true when flag on, alpha lt 1, and elevated descendant`() {
    overrideAutoOffscreenFlag(true)
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
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 1f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - false when there is no elevated descendant`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    mount(rvg, View(context))
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - false when flag is off`() {
    overrideAutoOffscreenFlag(false)
    val rvg = ReactViewGroup(context)
    mount(rvg, elevatedChild())
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `auto offscreen compositing - detects a nested elevated descendant`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val inner = ReactViewGroup(context)
    inner.addView(elevatedChild())
    mount(rvg, inner)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - detects an elevated view inside a non-ReactViewGroup container`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val container = FrameLayout(context)
    container.addView(elevatedChild())
    mount(rvg, container)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - invalidation bubbles through a non-ReactViewGroup ancestor`() {
    overrideAutoOffscreenFlag(true)
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
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isFalse()
    mount(rvg, elevatedChild())
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - false once the elevated descendant is removed`() {
    overrideAutoOffscreenFlag(true)
    val rvg = ReactViewGroup(context)
    val child = elevatedChild()
    mount(rvg, child)
    rvg.alpha = 0.5f
    assertThat(rvg.hasOverlappingRendering()).isTrue()
    unmount(rvg, child)
    assertThat(rvg.hasOverlappingRendering()).isFalse()
  }

  @Test
  fun `needsOffscreenAlphaCompositing forces overlapping rendering regardless of flag`() {
    val rvg = ReactViewGroup(context)
    rvg.setNeedsOffscreenAlphaCompositing(true)
    assertThat(rvg.hasOverlappingRendering()).isTrue()
  }

  @Test
  fun `auto offscreen compositing - recycling a child invalidates the parent`() {
    overrideAutoOffscreenFlag(true)
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
    overrideAutoOffscreenFlag(true)
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
    overrideAutoOffscreenFlag(true)
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
    overrideAutoOffscreenFlag(true)
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
    overrideAutoOffscreenFlag(true)
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

  @Test
  fun `hidden descendants - leave keyboard focus search`() {
    val root = ReactViewGroup(context)
    val hidden = containerView(top = 0)
    val hiddenControl = focusableView(top = 0)
    val shown = focusableView(top = 20)
    hidden.addView(hiddenControl)
    root.addView(hidden)
    root.addView(shown)

    ReactViewManager().setImportantForAccessibility(hidden, "no-hide-descendants")

    assertThat(collectKeyboardFocusables(root)).containsExactly(shown)
  }

  @Test
  fun `hidden descendants - return to keyboard focus search once shown again`() {
    val root = ReactViewGroup(context)
    val hidden = containerView(top = 0)
    val hiddenControl = focusableView(top = 0)
    val shown = focusableView(top = 20)
    hidden.addView(hiddenControl)
    root.addView(hidden)
    root.addView(shown)
    val manager = ReactViewManager()
    manager.setImportantForAccessibility(hidden, "no-hide-descendants")

    manager.setImportantForAccessibility(hidden, null)

    assertThat(collectKeyboardFocusables(root)).containsExactly(hiddenControl, shown)
  }

  @Test
  fun `hidden descendants - default focus passes over them`() {
    val root = ReactViewGroup(context)
    val hidden = containerView(top = 0)
    val hiddenControl = focusableView(top = 0)
    val shown = focusableView(top = 20)
    hidden.addView(hiddenControl)
    root.addView(hidden)
    root.addView(shown)
    ReactViewManager().setImportantForAccessibility(hidden, "no-hide-descendants")

    assertThat(root.requestFocus(View.FOCUS_DOWN)).isTrue()

    assertThat(hiddenControl.isFocused).isFalse()
    assertThat(shown.isFocused).isTrue()
  }

  @Test
  fun `hidden descendants - a descendant keyboard focus sits on gives it up as they hide`() {
    val root = ReactViewGroup(context)
    val hidden = containerView(top = 0)
    val hiddenControl = focusableView(top = 0)
    hidden.addView(hiddenControl)
    root.addView(hidden)
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)
    assertThat(hiddenControl.requestFocus()).isTrue()

    ReactViewManager().setImportantForAccessibility(hidden, "no-hide-descendants")

    assertThat(hiddenControl.isFocused).isFalse()
  }

  @Test
  fun `hidden descendants - still take focus directly, as a tap or a focus() call gives it`() {
    val root = ReactViewGroup(context)
    val hidden = containerView(top = 0)
    val hiddenControl = focusableView(top = 0)
    hidden.addView(hiddenControl)
    root.addView(hidden)
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)
    ReactViewManager().setImportantForAccessibility(hidden, "no-hide-descendants")

    assertThat(hiddenControl.requestFocus()).isTrue()
  }

  @Test
  fun `hidden descendants - a descendant focused by touch keeps its focus as they hide`() {
    val root = ReactViewGroup(context)
    val hidden = containerView(top = 0)
    val field = focusableView(top = 0).apply { isFocusableInTouchMode = true }
    hidden.addView(field)
    root.addView(hidden)
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)
    enterTouchMode(root)
    assertThat(field.requestFocus()).isTrue()

    ReactViewManager().setImportantForAccessibility(hidden, "no-hide-descendants")

    assertThat(field.isFocused).isTrue()
  }

  @Test
  fun `hidden descendants - keyboard navigation moves on from one that keeps its focus`() {
    val root = ReactViewGroup(context)
    val hidden = containerView(top = 0)
    val field = focusableView(top = 0).apply { isFocusableInTouchMode = true }
    val otherHiddenControl = focusableView(top = 0)
    val shown = focusableView(top = 20)
    hidden.addView(field)
    hidden.addView(otherHiddenControl)
    root.addView(hidden)
    root.addView(shown)
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)
    enterTouchMode(root)
    assertThat(field.requestFocus()).isTrue()

    ReactViewManager().setImportantForAccessibility(hidden, "no-hide-descendants")

    assertThat(collectKeyboardFocusables(root)).containsExactly(field, shown)
  }

  @Test
  fun `hidden descendants - the view hiding them stays a keyboard focus candidate itself`() {
    val root = ReactViewGroup(context)
    val hidden = containerView(top = 0).apply { isFocusable = true }
    val hiddenControl = focusableView(top = 0)
    val shown = focusableView(top = 20)
    hidden.addView(hiddenControl)
    root.addView(hidden)
    root.addView(shown)

    ReactViewManager().setImportantForAccessibility(hidden, "no-hide-descendants")

    assertThat(collectKeyboardFocusables(root)).containsExactly(hidden, shown)
  }

  @Test
  fun `hidden descendants - the view hiding them keeps keyboard focus it holds itself`() {
    val root = ReactViewGroup(context)
    val before = focusableView(top = 0)
    val hidden = containerView(top = 20).apply { isFocusable = true }
    hidden.addView(focusableView(top = 20))
    root.addView(before)
    root.addView(hidden)
    Robolectric.buildActivity(Activity::class.java).setup().get().setContentView(root)
    assertThat(hidden.requestFocus()).isTrue()

    ReactViewManager().setImportantForAccessibility(hidden, "no-hide-descendants")

    assertThat(hidden.isFocused).isTrue()
  }

  @Test
  fun `hidden descendants - leave the view's own descendant focusability as it was`() {
    val hidden =
        containerView(top = 0).apply { descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS }
    val manager = ReactViewManager()

    manager.setImportantForAccessibility(hidden, "no-hide-descendants")
    manager.setImportantForAccessibility(hidden, null)

    assertThat(hidden.descendantFocusability).isEqualTo(ViewGroup.FOCUS_AFTER_DESCENDANTS)
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

  private fun overrideAutoOffscreenFlag(enabled: Boolean) {
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableAndroidAutoOffscreenCompositingForElevation(): Boolean = enabled
        },
    )
  }

  private fun elevatedChild(): View = View(context).apply { elevation = 10f }

  private fun containerView(top: Int): ReactViewGroup =
      ReactViewGroup(context).apply { layout(0, top, 100, top + 10) }

  private fun focusableView(top: Int): View =
      View(context).apply {
        isFocusable = true
        layout(0, top, 100, top + 10)
      }

  private fun collectKeyboardFocusables(root: ViewGroup): List<View> {
    val focusables = ArrayList<View>()
    root.addFocusables(focusables, View.FOCUS_FORWARD, View.FOCUSABLES_ALL)
    return focusables
  }

  // A touch puts the window in touch mode; Robolectric's windows start out of it.
  private fun enterTouchMode(attached: View) {
    val attachInfo = ReflectionHelpers.getField<Any>(attached, "mAttachInfo")
    ReflectionHelpers.setField(attachInfo, "mInTouchMode", true)
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
