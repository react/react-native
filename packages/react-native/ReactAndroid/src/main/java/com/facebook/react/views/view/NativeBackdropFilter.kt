/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.annotation.SuppressLint
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.os.Build
import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.FilterHelper
import java.lang.reflect.Method

/**
 * Draws `backdropFilter` with the platform backdrop API (SDK 37.2+).
 *
 * [RenderNode.setBackdropRenderEffect] applies a [RenderEffect] to everything already drawn behind
 * the node, on the RenderThread. There is no bitmap snapshot, and the backdrop includes everything
 * behind the view: content of other parents, scrolling content, ancestors.
 *
 * The effect lives on a separate, empty [RenderNode] clipped to the view's outline (its border
 * radius). Setting it on the view itself would need `clipToOutline` on the view, which would also
 * clip the view's content even with `overflow: visible`.
 *
 * A [ReactViewGroup] draws the node at the start of its own [View.draw] ([drawBehindSelf]), so the
 * node is part of the view's display list and follows its transform, opacity and visibility,
 * including native-driver animations that never re-record the parent. Other views are handled by
 * their parent ([drawBehindChild]).
 *
 * The method is looked up by reflection because React Native compiles against SDK 37.0, which does
 * not have it. Remove the reflection once compileSdk is 37.2 or later.
 */
@SuppressLint("UseRequiresApi", "NewApi")
internal object NativeBackdropFilter {

  private const val TAG = "NativeBackdropFilter"

  // Build.VERSION_CODES_FULL value of SDK 37.2 (major * 100000 + minor).
  private const val SDK_37_2 = 3_700_002

  private val setBackdropRenderEffect: Method? by
      lazy(LazyThreadSafetyMode.NONE) {
        if (Build.VERSION.SDK_INT < 37 || Build.VERSION.SDK_INT_FULL < SDK_37_2) {
          return@lazy null
        }
        try {
          RenderNode::class.java.getMethod("setBackdropRenderEffect", RenderEffect::class.java)
        } catch (e: NoSuchMethodException) {
          FLog.w(TAG, "RenderNode.setBackdropRenderEffect is missing on SDK 37.2+", e)
          null
        }
      }

  /** Whether this device can draw backdrop filters natively. */
  val isSupported: Boolean
    get() = setBackdropRenderEffect != null

  private class State(val node: RenderNode) {
    var filters: ReadableArray? = null
    var effect: RenderEffect? = null
  }

  private val outline = Outline()

  /**
   * Draws the filtered backdrop of [view] into its own [canvas], before anything of the view is
   * drawn. Returns false when it could not be drawn natively.
   */
  fun drawBehindSelf(canvas: Canvas, view: View, filters: ReadableArray): Boolean {
    val node = prepare(canvas, view, filters) ?: return false
    canvas.drawRenderNode(node)
    return true
  }

  /**
   * Draws the filtered backdrop of [child] into its parent's [canvas], right before the child is
   * drawn. Returns false when it could not be drawn natively.
   */
  fun drawBehindChild(canvas: Canvas, child: View, filters: ReadableArray): Boolean {
    val node = prepare(canvas, child, filters) ?: return false
    node.setAlpha(child.alpha)
    val saveCount = canvas.save()
    canvas.translate(child.left.toFloat(), child.top.toFloat())
    if (!child.matrix.isIdentity) {
      canvas.concat(child.matrix)
    }
    canvas.drawRenderNode(node)
    canvas.restoreToCount(saveCount)
    return true
  }

  /** Releases the node kept for [view] once its backdrop filter is removed. */
  fun clear(view: View) {
    val state = view.getTag(R.id.backdrop_filter_node) as? State ?: return
    state.node.discardDisplayList()
    view.setTag(R.id.backdrop_filter_node, null)
  }

  private fun prepare(canvas: Canvas, view: View, filters: ReadableArray): RenderNode? {
    val method = setBackdropRenderEffect ?: return null
    if (!canvas.isHardwareAccelerated) return null

    val width = view.width
    val height = view.height
    if (width <= 0 || height <= 0) return null

    val state =
        view.getTag(R.id.backdrop_filter_node) as? State
            ?: State(RenderNode("backdropFilter")).also {
              view.setTag(R.id.backdrop_filter_node, it)
            }

    if (state.filters !== filters) {
      state.filters = filters
      state.effect = FilterHelper.parseFilters(filters)
      try {
        method.invoke(state.node, state.effect)
      } catch (e: Exception) {
        FLog.w(TAG, "setBackdropRenderEffect failed", e)
        return null
      }
    }
    if (state.effect == null) return null

    val node = state.node
    node.setPosition(0, 0, width, height)
    node.setOutline(outlineOf(view, width, height))
    node.setClipToOutline(true)

    // An empty node is not drawn; a transparent fill keeps it without adding pixels on top of the
    // processed backdrop.
    val recording = node.beginRecording(width, height)
    recording.drawColor(Color.TRANSPARENT)
    node.endRecording()
    return node
  }

  private fun outlineOf(view: View, width: Int, height: Int): Outline {
    outline.setEmpty()
    // A view sets its background's bounds while drawing the background, which happens after this
    // node is drawn. Without bounds the background's rounded outline is empty and clips everything.
    view.background?.let { background ->
      val bounds = background.bounds
      if (bounds.width() != width || bounds.height() != height) {
        background.setBounds(0, 0, width, height)
      }
    }
    view.outlineProvider?.getOutline(view, outline)
    if (outline.isEmpty) {
      outline.setRect(0, 0, width, height)
    }
    return outline
  }
}
