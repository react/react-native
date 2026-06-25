/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.annotation.SuppressLint
import android.graphics.Matrix
import android.graphics.PointF
import android.view.View
import android.view.ViewGroup
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.touch.ReactHitSlopView
import java.util.EnumSet

/**
 * Class responsible for identifying which react view should handle a given {@link MotionEvent}. It
 * uses the event coordinates to traverse the view hierarchy and return a suitable view.
 */
public object TouchTargetHelper {

  private val eventCoords = FloatArray(2)
  private val tempPoint = PointF()
  private val matrixTransformCoords = FloatArray(2)
  private val inverseMatrix = Matrix()

  /**
   * Find touch event target view within the provided container given the coordinates provided via
   * {@link MotionEvent}.
   *
   * @param eventX the X screen coordinate of the touch location
   * @param eventY the Y screen coordinate of the touch location
   * @param viewGroup the container view to traverse
   * @return the react tag ID of the child view that should handle the event
   */
  @JvmStatic
  public fun findTargetTagForTouch(eventX: Float, eventY: Float, viewGroup: ViewGroup): Int =
      findTargetTagAndCoordinatesForTouch(eventX, eventY, viewGroup, eventCoords, null)

  /**
   * Find touch event target view within the provided container given the coordinates provided via
   * {@link MotionEvent}.
   *
   * @param eventX the X screen coordinate of the touch location
   * @param eventY the Y screen coordinate of the touch location
   * @param viewGroup the container view to traverse
   * @param nativeViewId the native react view containing this touch target
   * @return the react tag ID of the child view that should handle the event
   */
  @JvmStatic
  public fun findTargetTagForTouch(
      eventX: Float,
      eventY: Float,
      viewGroup: ViewGroup,
      nativeViewId: IntArray?,
  ): Int = findTargetTagAndCoordinatesForTouch(eventX, eventY, viewGroup, eventCoords, nativeViewId)

  /**
   * Find touch event target view within the provided container given the coordinates provided via
   * {@link MotionEvent}.
   *
   * @param eventX the X screen coordinate of the touch location
   * @param eventY the Y screen coordinate of the touch location
   * @param viewGroup the container view to traverse
   * @param viewCoords an out parameter that will return the X,Y value in the target view
   * @param nativeViewTag an out parameter that will return the native view id
   * @return the react tag ID of the child view that should handle the event
   */
  @JvmStatic
  public fun findTargetTagAndCoordinatesForTouch(
      eventX: Float,
      eventY: Float,
      viewGroup: ViewGroup,
      viewCoords: FloatArray,
      nativeViewTag: IntArray?,
  ): Int {
    UiThreadUtil.assertOnUiThread()
    var targetTag = viewGroup.id
    // Store eventCoords in array so that they are modified to be relative to the targetView found.
    viewCoords[0] = eventX
    viewCoords[1] = eventY
    val nativeTargetView = findTouchTargetViewWithPointerEvents(viewCoords, viewGroup)
    if (nativeTargetView != null) {
      val reactTargetView = findClosestReactAncestor(nativeTargetView)
      if (reactTargetView != null) {
        nativeViewTag?.let { nativeViewTag[0] = reactTargetView.id }
        targetTag = getTouchTargetForView(reactTargetView, viewCoords[0], viewCoords[1])
      }
    }
    return targetTag
  }

  /**
   * Find touch event target view within the provided container given the coordinates provided via
   * {@link MotionEvent}.
   *
   * @param eventX the X screen coordinate of the touch location
   * @param eventY the Y screen coordinate of the touch location
   * @param viewGroup the container view to traverse
   * @param viewCoords an out parameter that will return the X,Y value in the target view
   * @return If a target was found, returns a {@link List<ViewTarget>} containing the path through
   *   the view tree of all react tags and views that are a container for the touch target, ordered
   *   from target to root (last element)
   */
  @SuppressLint("ResourceType")
  @JvmStatic
  public fun findTargetPathAndCoordinatesForTouch(
      eventX: Float,
      eventY: Float,
      viewGroup: ViewGroup,
      viewCoords: FloatArray,
  ): List<ViewTarget> {
    UiThreadUtil.assertOnUiThread()

    // Store eventCoords in array so that they are modified to be relative to the targetView found.
    viewCoords[0] = eventX
    viewCoords[1] = eventY

    val pathAccumulator = mutableListOf<ViewTarget>()
    val targetView = findTouchTargetViewWithPointerEvents(viewCoords, viewGroup, pathAccumulator)

    if (targetView != null) {
      var reactTargetView: View? = targetView
      var firstReactAncestor = 0
      // Same logic as findClosestReactAncestor but also track the index
      while (reactTargetView != null && reactTargetView.id <= 0) {
        reactTargetView = reactTargetView.parent as? View
        firstReactAncestor++
      }

      if (firstReactAncestor > 0 && firstReactAncestor <= pathAccumulator.size) {
        // Drop non-React views from the path trace
        pathAccumulator.subList(firstReactAncestor, pathAccumulator.size)
      }

      if (reactTargetView != null) {
        val targetTag = getTouchTargetForView(reactTargetView, viewCoords[0], viewCoords[1])
        if (targetTag != reactTargetView.id) {
          pathAccumulator.add(0, ViewTarget(targetTag, null))
        }
      }
    }

    return pathAccumulator
  }

  @SuppressLint("ResourceType")
  private fun findClosestReactAncestor(view: View?): View? {
    var currentView = view
    while (currentView != null && currentView.id <= 0) {
      currentView = currentView.parent as? View
    }
    return currentView
  }

  private enum class TouchTargetReturnType {
    /** Allow returning the view passed in through the parameters. */
    SELF,
    /** Allow returning children of the view passed in through parameters. */
    CHILD,
  }

  /**
   * Returns the touch target View that is either viewGroup or one of its descendants. This is a
   * recursive DFS since the entire tree must be parsed until the target is found. If the search
   * does not backtrack, it is possible to follow a branch that cannot be a target (because of
   * pointerEvents). For example, if both C and E can be the target of an event: A (pointerEvents:
   * auto) - B (pointerEvents: box-none) - C (pointerEvents: none) \ D (pointerEvents: auto) - E
   * (pointerEvents: auto) If the search goes down the first branch, it would return A as the
   * target, which is incorrect. NB: This modifies the eventCoords to always be relative to the
   * current viewGroup. When the method returns, it will contain the eventCoords relative to the
   * targetView found.
   */
  private fun findTouchTargetView(
      eventCoords: FloatArray,
      view: View,
      allowReturnTouchTargetTypes: EnumSet<TouchTargetReturnType>,
      pathAccumulator: MutableList<ViewTarget>?,
  ): View? {
    // We prefer returning a child, so we check for a child that can handle the touch first
    if (allowReturnTouchTargetTypes.contains(TouchTargetReturnType.CHILD) && view is ViewGroup) {
      val viewGroup = view
      if (!isTouchPointInView(eventCoords[0], eventCoords[1], view)) {
        // We don't allow touches on views that are outside the bounds of an `overflow: hidden` and
        // `overflow: scroll` View.
        if (view is ReactOverflowViewWithInset) {
          // If the touch point is outside of the overflow inset for the view, we can safely ignore
          // it.
          if (!isTouchPointInViewWithOverflowInset(eventCoords[0], eventCoords[1], view)) {
            return null
          }

          val overflow = view.overflow
          if (ViewProps.HIDDEN == overflow || ViewProps.SCROLL == overflow) {
            return null
          }
        }

        // We don't allow touches on views that are outside the bounds and has clipChildren set to
        // true.
        if (viewGroup.clipChildren) {
          return null
        }
      }

      val childrenCount = viewGroup.childCount
      for (i in childrenCount - 1 downTo 0) {
        val child = viewGroup.getChildAt(i)
        val childPoint = tempPoint
        if (!getChildPoint(eventCoords[0], eventCoords[1], viewGroup, child, childPoint)) {
          // Child's transform is non-invertible (e.g. scaleX: 0 or scaleY: 0): the child is
          // visually degenerate, so it must not receive touches.
          continue
        }
        // The childPoint value will contain the view coordinates relative to the child.
        // We need to store the existing X,Y for the viewGroup away as it is possible this child
        // will not actually be the target and so we restore them if not
        val restoreX = eventCoords[0]
        val restoreY = eventCoords[1]
        eventCoords[0] = childPoint.x
        eventCoords[1] = childPoint.y
        val target = findTouchTargetViewWithPointerEvents(eventCoords, child, pathAccumulator)
        if (target != null) {
          return target
        }
        eventCoords[0] = restoreX
        eventCoords[1] = restoreY
      }
    }

    // Check if parent can handle the touch after the children
    if (
        allowReturnTouchTargetTypes.contains(TouchTargetReturnType.SELF) &&
            isTouchPointInView(eventCoords[0], eventCoords[1], view)
    ) {
      return view
    }

    return null
  }

  /**
   * Checks whether a touch at {@code x} and {@code y} are within the bounds of the View. Both
   * {@code x} and {@code y} must be relative to the top-left corner of the view.
   */
  private fun isTouchPointInView(x: Float, y: Float, view: View): Boolean {
    val hitSlopRect = (view as? ReactHitSlopView)?.hitSlopRect
    if (hitSlopRect != null) {
      if (
          x >= -hitSlopRect.left &&
              x < view.width + hitSlopRect.right &&
              y >= -hitSlopRect.top &&
              y < view.height + hitSlopRect.bottom
      ) {
        return true
      }
      return false
    } else {
      if (x >= 0 && x < view.width && y >= 0 && y < view.height) {
        return true
      }
      return false
    }
  }

  private fun isTouchPointInViewWithOverflowInset(x: Float, y: Float, view: View): Boolean {
    if (view !is ReactOverflowViewWithInset) {
      return false
    }

    val overflowInset = view.overflowInset
    return (x >= overflowInset.left && x < view.width - overflowInset.right) &&
        (y >= overflowInset.top && y < view.height - overflowInset.bottom)
  }

  /**
   * Returns the coordinates of a touch in the child View. It is transform-aware and will invert the
   * transform Matrix to find the true local points. This code is taken from {@link
   * ViewGroup#isTransformedTouchPointInView()}.
   *
   * Returns `true` when [outLocalPoint] was populated with coordinates in the child's coordinate
   * space. Returns `false` when the child's transform matrix is not invertible (for example
   * `scaleX: 0` or `scaleY: 0`). On `false`, [outLocalPoint] is left in an indeterminate state and
   * callers must skip the child — the shared [inverseMatrix] field is retained from the previous
   * successful `invert`, so using it here would leak coordinates from another view.
   */
  private fun getChildPoint(
      x: Float,
      y: Float,
      parent: ViewGroup,
      child: View,
      outLocalPoint: PointF,
  ): Boolean {
    var localX = x + parent.scrollX - child.left
    var localY = y + parent.scrollY - child.top
    // BaseViewManager applies skewX / skewY through View.setAnimationMatrix, which is composed
    // for drawing but not exposed via View.getMatrix(); fall back to the stashed matrix so hit
    // testing follows the rendered parallelogram and not the original rectangle.
    val skewMatrix = child.getTag(R.id.skew_animation_matrix) as? Matrix
    val matrix = skewMatrix ?: child.matrix
    if (!matrix.isIdentity) {
      val inverseMatrix = inverseMatrix
      if (!matrix.invert(inverseMatrix)) {
        return false
      }
      val localXY = matrixTransformCoords
      localXY[0] = localX
      localXY[1] = localY
      inverseMatrix.mapPoints(localXY)
      localX = localXY[0]
      localY = localXY[1]
    }
    outLocalPoint.set(localX, localY)
    return true
  }

  /**
   * Returns the touch target View of the event given, or null if neither the given View nor any of
   * its descendants are the touch target.
   */
  private fun findTouchTargetViewWithPointerEvents(
      eventCoords: FloatArray,
      view: View,
      pathAccumulator: MutableList<ViewTarget>? = null,
  ): View? {
    var pointerEvents =
        if (view is ReactPointerEventsView) {
          view.pointerEvents
        } else {
          PointerEvents.AUTO
        }

    // Views that are disabled should never be the target of pointer events. However, their children
    // can be because some views (SwipeRefreshLayout) use enabled but still have children that can
    // be valid targets.
    if (!view.isEnabled) {
      pointerEvents =
          when (pointerEvents) {
            PointerEvents.AUTO -> PointerEvents.BOX_NONE
            PointerEvents.BOX_ONLY -> PointerEvents.NONE
            else -> pointerEvents
          }
    }

    return when (pointerEvents) {
      PointerEvents.NONE -> {
        // This view and its children can't be the target
        null
      }
      PointerEvents.BOX_ONLY -> {
        // This view may be the target, its children don't matter
        val targetView =
            findTouchTargetView(
                eventCoords,
                view,
                EnumSet.of(TouchTargetReturnType.SELF),
                pathAccumulator,
            )
        targetView?.let { pathAccumulator?.add(ViewTarget(view.id, view)) }
        targetView
      }
      PointerEvents.BOX_NONE -> {
        // This view can't be the target, but its children might.
        val targetView =
            findTouchTargetView(
                eventCoords,
                view,
                EnumSet.of(TouchTargetReturnType.CHILD),
                pathAccumulator,
            )

        if (targetView != null) {
          pathAccumulator?.add(ViewTarget(view.id, view))
          return targetView
        }

        // PointerEvents.BOX_NONE means that this react element cannot receive pointer events.
        // However, there might be virtual children that can receive pointer events, in which case
        // we still want to return this View and dispatch a pointer event to the virtual element.
        // Note that this currently only applies to Nodes/FlatViewGroup as it's the only class that
        // is both a ViewGroup and ReactCompoundView (ReactTextView is a ReactCompoundView but not a
        // ViewGroup).
        if (view is ReactCompoundView && isTouchPointInView(eventCoords[0], eventCoords[1], view)) {
          val reactTag =
              (view as ReactCompoundView).reactTagForTouch(eventCoords[0], eventCoords[1])
          // make sure we exclude the View itself because of the PointerEvents.BOX_NONE
          if (reactTag != view.id) {
            pathAccumulator?.add(ViewTarget(view.id, view))
            return view
          }
        }

        null
      }
      else -> {
        if (pointerEvents != PointerEvents.AUTO) {
          FLog.w(ReactConstants.TAG, "Unknown pointer event type: $pointerEvents")
        }
        // Either this view or one of its children is the target
        if (
            view is ReactCompoundViewGroup &&
                isTouchPointInView(eventCoords[0], eventCoords[1], view) &&
                view.interceptsTouchEvent(eventCoords[0], eventCoords[1])
        ) {
          pathAccumulator?.add(ViewTarget(view.id, view))
          return view
        }

        val result =
            findTouchTargetView(
                eventCoords,
                view,
                EnumSet.of(TouchTargetReturnType.SELF, TouchTargetReturnType.CHILD),
                pathAccumulator,
            )
        result?.let { pathAccumulator?.add(ViewTarget(view.id, view)) }
        result
      }
    }
  }

  private fun getTouchTargetForView(targetView: View, viewX: Float, viewY: Float): Int =
      if (targetView is ReactCompoundView) {
        // Use coordinates relative to the view, which have been already computed by
        // [findTouchTargetView].
        targetView.reactTagForTouch(viewX, viewY)
      } else {
        targetView.id
      }

  // ViewTarget class as a nested class in TouchTargetHelper
  public class ViewTarget internal constructor(private val viewId: Int, private val view: View?) {

    public fun getViewId(): Int = viewId

    public fun getView(): View? = view

    public override fun equals(other: Any?): Boolean {
      // If the object is compared with itself then return true
      if (this === other) {
        return true
      }

      // Check if other is an instance of ViewTarget.
      if (other !is ViewTarget) {
        return false
      }

      // We only need to compare view id, as we assume the same view id will always map to the
      // same view.
      return other.getViewId() == viewId
    }

    public override fun hashCode(): Int = viewId.hashCode()
  }
}
