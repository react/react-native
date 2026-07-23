/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Rect
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.common.ReactConstants
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.TouchTargetHelper.ViewTarget
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.PointerEvent
import com.facebook.react.uimanager.events.PointerEvent.PointerEventState
import com.facebook.react.uimanager.events.PointerEventHelper
import com.facebook.react.uimanager.events.PointerEventHelper.EVENT

/**
 * JSPointerDispatcher handles dispatching pointer events to JS from RootViews. If you implement
 * RootView you need to call handleMotionEvent from onTouchEvent, onInterceptTouchEvent,
 * onHoverEvent, onInterceptHoverEvent. It will correctly find the right view to handle the touch
 * and also dispatch the appropriate event to JS
 */
public class JSPointerDispatcher(private val rootViewGroup: ViewGroup) {

  private var lastHitPathByPointerId: MutableMap<Int, List<ViewTarget>>? = null
  private var lastEventCoordinatesByPointerId: MutableMap<Int, FloatArray>? = null
  private val currentlyDownPointerIdsToHitPath: MutableMap<Int, List<ViewTarget>> = HashMap()
  private val hoveringPointerIds: MutableSet<Int> = HashSet()

  private var childHandlingNativeGesture = UNSET_CHILD_VIEW_ID
  private var primaryPointerId = UNSET_POINTER_ID
  private var coalescingKey = 0
  private var lastButtonState = 0

  public fun onChildStartedNativeGesture(
      childView: View?,
      motionEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
  ) {
    if (childHandlingNativeGesture != UNSET_CHILD_VIEW_ID || childView == null) {
      // This means we previously had another child start handling this native gesture and now a
      // different native parent of that child has decided to intercept the touch stream and handle
      // the gesture itself. Example where this can happen: HorizontalScrollView in a ScrollView.
      return
    }

    val motionInRoot = convertMotionToRootFrame(childView, motionEvent)
    motionInRoot.action = MotionEvent.ACTION_CANCEL
    handleMotionEvent(motionInRoot, eventDispatcher, false)

    childHandlingNativeGesture = childView.id
  }

  private fun convertMotionToRootFrame(childView: View, childMotion: MotionEvent): MotionEvent {
    val motionInRoot = MotionEvent.obtain(childMotion)

    val location = IntArray(2)
    rootViewGroup.getLocationOnScreen(location)
    val screenX = childMotion.rawX
    val screenY = childMotion.rawY
    val clientX = screenX - location[0]
    val clientY = screenY - location[1]
    motionInRoot.setLocation(clientX, clientY)

    return motionInRoot
  }

  public fun onChildEndedNativeGesture() {
    // There should be only one child gesture at any given time. We can safely turn off the flag.
    childHandlingNativeGesture = UNSET_CHILD_VIEW_ID
  }

  private fun onUp(
      activeTargetTag: Int,
      eventState: PointerEventState,
      motionEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
  ) {
    val activePointerId = eventState.activePointerId
    val activeHitPath: List<ViewTarget> =
        eventState.hitPathByPointerId[activePointerId] ?: emptyList()

    val listeningForUp =
        isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.UP, EVENT.UP_CAPTURE)
    if (listeningForUp) {
      val activeHitPathViewIds: List<Int>? =
          if (ReactNativeFeatureFlags.cxxNativeAnimatedEnabled()) {
            eventState.hitPathViewIdsForActivePointer
          } else {
            null
          }
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(
              PointerEventHelper.POINTER_UP,
              activeTargetTag,
              eventState,
              motionEvent,
              activeHitPathViewIds,
          )
      )
    }

    val supportsHover = hoveringPointerIds.contains(activePointerId)

    if (!supportsHover) {
      val listeningForOut =
          isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.OUT, EVENT.OUT_CAPTURE)
      if (listeningForOut) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_OUT,
                activeTargetTag,
                eventState,
                motionEvent,
            )
        )
      }

      val leaveViewTargets =
          filterByShouldDispatch(activeHitPath, EVENT.LEAVE, EVENT.LEAVE_CAPTURE, false)

      // target -> root
      dispatchEventForViewTargets(
          PointerEventHelper.POINTER_LEAVE,
          eventState,
          motionEvent,
          leaveViewTargets,
          eventDispatcher,
      )
    }

    val hitPathDown = currentlyDownPointerIdsToHitPath.remove(activePointerId)
    if (
        hitPathDown != null &&
            isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.CLICK, EVENT.CLICK_CAPTURE)
    ) {
      val hitPathForClick = findHitPathIntersection(hitPathDown, activeHitPath)
      if (hitPathForClick.isNotEmpty()) {
        val clickTarget = hitPathForClick[0]
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.CLICK,
                clickTarget.getViewId(),
                eventState,
                motionEvent,
            )
        )
      }
    }

    if (motionEvent.actionMasked == MotionEvent.ACTION_UP) {
      primaryPointerId = UNSET_POINTER_ID
    }
    hoveringPointerIds.remove(activePointerId)
  }

  private fun incrementCoalescingKey() {
    coalescingKey = (coalescingKey + 1) % Int.MAX_VALUE
  }

  private fun getCoalescingKey(): Short = (0xffff and coalescingKey).toShort()

  private fun onDown(
      activeTargetTag: Int,
      eventState: PointerEventState,
      motionEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
  ) {
    val activeHitPath: List<ViewTarget> =
        eventState.hitPathByPointerId[eventState.activePointerId] ?: emptyList()

    incrementCoalescingKey()
    val supportsHover = hoveringPointerIds.contains(eventState.activePointerId)
    if (!supportsHover) {
      // Indirect OVER event dispatches before ENTER
      val listeningForOver =
          isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.OVER, EVENT.OVER_CAPTURE)
      if (listeningForOver) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_OVER,
                activeTargetTag,
                eventState,
                motionEvent,
            )
        )
      }

      val enterViewTargets =
          filterByShouldDispatch(activeHitPath, EVENT.ENTER, EVENT.ENTER_CAPTURE, false)

      // Dispatch root -> target, we need to reverse order of enterViewTargets
      enterViewTargets.reverse()
      dispatchEventForViewTargets(
          PointerEventHelper.POINTER_ENTER,
          eventState,
          motionEvent,
          enterViewTargets,
          eventDispatcher,
      )
    }

    // store some information if we might need to emit a click later on
    if (isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.CLICK, EVENT.CLICK_CAPTURE)) {
      currentlyDownPointerIdsToHitPath[eventState.activePointerId] = ArrayList(activeHitPath)
    }

    val listeningForDown =
        isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.DOWN, EVENT.DOWN_CAPTURE)
    if (listeningForDown) {
      val activeHitPathViewIds: List<Int>? =
          if (ReactNativeFeatureFlags.cxxNativeAnimatedEnabled()) {
            eventState.hitPathViewIdsForActivePointer
          } else {
            null
          }
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(
              PointerEventHelper.POINTER_DOWN,
              activeTargetTag,
              eventState,
              motionEvent,
              activeHitPathViewIds,
          )
      )
    }
  }

  private fun eventCoordsToScreenCoords(eventCoords: FloatArray): FloatArray {
    val screenCoords = FloatArray(2)
    rootViewGroup.getLocationOnScreen(rootScreenCoords)

    screenCoords[0] = eventCoords[0] + rootScreenCoords[0]
    screenCoords[1] = eventCoords[1] + rootScreenCoords[1]

    return screenCoords
  }

  private fun createEventState(
      activePointerId: Int,
      motionEvent: MotionEvent,
      clearHitPathForActivePointer: Boolean = false,
  ): PointerEventState {
    val offsetByPointerId: MutableMap<Int, FloatArray> = HashMap()
    val hitPathByPointerId: MutableMap<Int, List<ViewTarget>> = HashMap()
    val eventCoordinatesByPointerId: MutableMap<Int, FloatArray> = HashMap()
    val screenCoordinatesByPointerId: MutableMap<Int, FloatArray> = HashMap()
    for (index in 0 until motionEvent.pointerCount) {
      val offsetCoordinates = FloatArray(2)
      val eventCoordinates = floatArrayOf(motionEvent.getX(index), motionEvent.getY(index))
      val hitPath =
          TouchTargetHelper.findTargetPathAndCoordinatesForTouch(
              eventCoordinates[0],
              eventCoordinates[1],
              rootViewGroup,
              offsetCoordinates,
          )

      val pointerId = motionEvent.getPointerId(index)
      offsetByPointerId[pointerId] = offsetCoordinates
      hitPathByPointerId[pointerId] = hitPath
      eventCoordinatesByPointerId[pointerId] = eventCoordinates
      screenCoordinatesByPointerId[pointerId] = eventCoordsToScreenCoords(eventCoordinates)
    }

    if (clearHitPathForActivePointer) {
      hitPathByPointerId[activePointerId] = emptyList()
    }

    val surfaceId = UIManagerHelper.getSurfaceId(rootViewGroup)

    return PointerEventState(
        primaryPointerId,
        activePointerId,
        lastButtonState,
        surfaceId,
        offsetByPointerId,
        hitPathByPointerId,
        eventCoordinatesByPointerId,
        screenCoordinatesByPointerId,
        hoveringPointerIds, // Creates a copy of hovering pointer ids, as they may be updated
    )
  }

  public fun handleMotionEvent(
      motionEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
      isCapture: Boolean,
  ) {
    // Don't fire any pointer events if child view is handling native gesture
    if (childHandlingNativeGesture != UNSET_CHILD_VIEW_ID) {
      return
    }

    val action = motionEvent.actionMasked

    // On stylus or mouse input, Android will systematically dispatch ACTION_HOVER_EXIT
    // before ACTION_DOWN (button press), even if the pointer has not moved and is still
    // hovering over the same view.
    //
    // This leads to onPointerLeave being triggered incorrectly.
    //
    // To mitigate this, we suppress ACTION_HOVER_EXIT events that occur
    // while a button is pressed (i.e., buttonState != 0).
    //
    // This workaround is effective on Quest devices, however, it may not behave consistently on the
    // Android emulator, something we’ll revisit if it becomes an issue in open source.
    if (action == MotionEvent.ACTION_HOVER_EXIT && motionEvent.buttonState != 0) {
      return
    }

    val activePointerId = motionEvent.getPointerId(motionEvent.actionIndex)
    if (action == MotionEvent.ACTION_DOWN) {
      primaryPointerId = motionEvent.getPointerId(0)
    } else if (action == MotionEvent.ACTION_HOVER_MOVE) {
      hoveringPointerIds.add(activePointerId)
    }

    // We've empirically determined that when we get a ACTION_HOVER_EXIT from the root view on the
    // `onInterceptHoverEvent`, this means we've exited the root view. This logic may be wrong but
    // reasoning about the dispatch sequence for HOVER_ENTER/HOVER_EXIT doesn't follow the
    // capture/bubbling sequence like other MotionEvents.
    //
    // For more information, see:
    // https://developer.android.com/reference/android/view/MotionEvent#ACTION_HOVER_ENTER
    // https://suragch.medium.com/how-touch-events-are-delivered-in-android-eee3b607b038
    val isExitFromRoot = isCapture && action == MotionEvent.ACTION_HOVER_EXIT

    val eventState = createEventState(
        activePointerId,
        motionEvent,
        clearHitPathForActivePointer = isExitFromRoot,
    )

    // Calculate the targetTag, with special handling for when we exit the root view. In that case,
    // we use the root viewId of the last event
    val activeTargetTag: Int
    val activeTargetView: View?

    if (isExitFromRoot) {
      val lastHitPath = lastHitPathByPointerId?.get(eventState.activePointerId)
      if (lastHitPath.isNullOrEmpty()) {
        return
      }
      val activeTarget = lastHitPath[lastHitPath.size - 1]
      activeTargetTag = activeTarget.getViewId()
      activeTargetView = activeTarget.getView()
    } else {
      val currentHitPath = eventState.hitPathByPointerId[activePointerId]
      if (currentHitPath.isNullOrEmpty()) {
        return
      }
      val activeTarget = currentHitPath[0]
      activeTargetTag = activeTarget.getViewId()
      activeTargetView = activeTarget.getView()
    }

    handleHitStateDivergence(activeTargetTag, eventState, motionEvent, eventDispatcher)

    // Dispatch pointer events from the MotionEvents. When we want to ignore an event, we need to
    // exit early so we don't record anything about this MotionEvent.
    when (action) {
      MotionEvent.ACTION_DOWN,
      MotionEvent.ACTION_POINTER_DOWN ->
          onDown(activeTargetTag, eventState, motionEvent, eventDispatcher)
      MotionEvent.ACTION_HOVER_MOVE -> {
        // TODO(luwe) - converge this with ACTION_MOVE
        // If we don't move enough, ignore this event.
        val eventCoordinates = eventState.eventCoordinatesByPointerId[activePointerId]
        val lastEventCoordinates =
            lastEventCoordinatesByPointerId?.get(activePointerId) ?: floatArrayOf(0f, 0f)
        if (eventCoordinates == null || !qualifiedMove(eventCoordinates, lastEventCoordinates)) {
          return
        }

        onMove(activeTargetTag, eventState, motionEvent, eventDispatcher)
      }
      MotionEvent.ACTION_MOVE -> onMove(activeTargetTag, eventState, motionEvent, eventDispatcher)
      MotionEvent.ACTION_UP,
      MotionEvent.ACTION_POINTER_UP -> {
        incrementCoalescingKey()
        onUp(activeTargetTag, eventState, motionEvent, eventDispatcher)
      }
      MotionEvent.ACTION_CANCEL -> {
        dispatchCancelEventForTarget(activeTargetView, eventState, motionEvent, eventDispatcher)
        handleHitStateDivergence(UNSELECTED_VIEW_TAG, eventState, motionEvent, eventDispatcher)
      }
      MotionEvent.ACTION_HOVER_ENTER ->
          // Ignore these events as enters will be calculated from HOVER_MOVE
          return
      MotionEvent.ACTION_HOVER_EXIT ->
          // For root exits, we need to update our stored eventState to reflect this exit because we
          // won't receive future HOVER_MOVE events when cursor is outside root view
          if (isExitFromRoot) {
            // We've set the hit path for this pointer to be empty to calculate all exits
            onMove(activeTargetTag, eventState, motionEvent, eventDispatcher)
          }
      else -> {
        FLog.w(
            ReactConstants.TAG,
            "Motion Event was ignored. Action=$action Target=$activeTargetTag",
        )
        return
      }
    }

    // Update "previous" pointer coordinates and button state
    val nextEventCoordinatesByPointerId = HashMap(eventState.eventCoordinatesByPointerId)
    lastEventCoordinatesByPointerId = nextEventCoordinatesByPointerId
    lastButtonState = motionEvent.buttonState

    // Clean up any stale pointerIds
    val allPointerIds = nextEventCoordinatesByPointerId.keys
    hoveringPointerIds.retainAll(allPointerIds)
  }

  // Determines which views are being entered and exited based on comparison between the previous
  // hit path and the current hit path, and dispatches out/over/leave/enter events.
  private fun handleHitStateDivergence(
      targetTag: Int,
      eventState: PointerEventState,
      motionEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
  ) {
    val activePointerId = eventState.activePointerId
    val activeHitPath: List<ViewTarget> =
        if (targetTag != UNSELECTED_VIEW_TAG) {
          eventState.hitPathByPointerId[activePointerId] ?: ArrayList()
        } else {
          ArrayList()
        }
    val lastHitPath: List<ViewTarget> =
        lastHitPathByPointerId?.let { map ->
          if (map.containsKey(activePointerId)) map[activePointerId] ?: ArrayList() else ArrayList()
        } ?: ArrayList()

    // hitState is list ordered from inner child -> parent tag
    // Traverse hitState back-to-front to find the first divergence with lastHitPath
    // FIXME: this may generate incorrect events when view collapsing changes the hierarchy
    var nonDivergentListeningToEnter = false
    var nonDivergentListeningToLeave = false
    var firstDivergentIndexFromBack = 0
    while (
        firstDivergentIndexFromBack < minOf(activeHitPath.size, lastHitPath.size) &&
            activeHitPath[activeHitPath.size - 1 - firstDivergentIndexFromBack] ==
                lastHitPath[lastHitPath.size - 1 - firstDivergentIndexFromBack]
    ) {

      // Track if any non-diverging views are listening to enter/leave
      val nonDivergentViewTargetView =
          activeHitPath[activeHitPath.size - 1 - firstDivergentIndexFromBack].getView()
      if (
          !nonDivergentListeningToEnter &&
              PointerEventHelper.isListening(nonDivergentViewTargetView, EVENT.ENTER_CAPTURE)
      ) {
        nonDivergentListeningToEnter = true
      }
      if (
          !nonDivergentListeningToLeave &&
              PointerEventHelper.isListening(nonDivergentViewTargetView, EVENT.LEAVE_CAPTURE)
      ) {
        nonDivergentListeningToLeave = true
      }

      firstDivergentIndexFromBack++
    }

    val hasDiverged = firstDivergentIndexFromBack < maxOf(activeHitPath.size, lastHitPath.size)

    if (hasDiverged) {
      // If something has changed in either enter/exit, let's start a new coalescing key
      incrementCoalescingKey()

      // Out, Leave events
      if (lastHitPath.isNotEmpty()) {
        val lastTargetTag = lastHitPath[0].getViewId()
        val listeningForOut =
            isAnyoneListeningForBubblingEvent(lastHitPath, EVENT.OUT, EVENT.OUT_CAPTURE)
        if (listeningForOut) {
          eventDispatcher.dispatchEvent(
              PointerEvent.obtain(
                  PointerEventHelper.POINTER_OUT,
                  lastTargetTag,
                  eventState,
                  motionEvent,
              )
          )
        }

        // target -> root
        val leaveViewTargets = filterByShouldDispatch(
            lastHitPath.subList(0, lastHitPath.size - firstDivergentIndexFromBack),
            EVENT.LEAVE,
            EVENT.LEAVE_CAPTURE,
            nonDivergentListeningToLeave,
        )
        if (leaveViewTargets.isNotEmpty()) {
          // We want to dispatch from target -> root, so no need to reverse
          dispatchEventForViewTargets(
              PointerEventHelper.POINTER_LEAVE,
              eventState,
              motionEvent,
              leaveViewTargets,
              eventDispatcher,
          )
        }
      }

      val listeningForOver =
          isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.OVER, EVENT.OVER_CAPTURE)
      if (listeningForOver) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(PointerEventHelper.POINTER_OVER, targetTag, eventState, motionEvent)
        )
      }

      // target -> root
      val enterViewTargets = filterByShouldDispatch(
          activeHitPath.subList(0, activeHitPath.size - firstDivergentIndexFromBack),
          EVENT.ENTER,
          EVENT.ENTER_CAPTURE,
          nonDivergentListeningToEnter,
      )

      if (enterViewTargets.isNotEmpty()) {
        // We want to iterate these from root -> target so we need to reverse
        enterViewTargets.reverse()
        dispatchEventForViewTargets(
            PointerEventHelper.POINTER_ENTER,
            eventState,
            motionEvent,
            enterViewTargets,
            eventDispatcher,
        )
      }
    }

    val nextHitPathByPointerId: MutableMap<Int, List<ViewTarget>> =
        HashMap(eventState.hitPathByPointerId)

    if (targetTag == UNSELECTED_VIEW_TAG) {
      nextHitPathByPointerId.remove(activePointerId)
    }
    lastHitPathByPointerId = nextHitPathByPointerId
  }

  private fun onMove(
      targetTag: Int,
      eventState: PointerEventState,
      motionEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
  ) {
    val activePointerId = eventState.activePointerId
    val activeHitPath: List<ViewTarget> =
        eventState.hitPathByPointerId[activePointerId] ?: emptyList()

    val listeningToMove =
        isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.MOVE, EVENT.MOVE_CAPTURE)
    if (listeningToMove) {
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(
              PointerEventHelper.POINTER_MOVE,
              targetTag,
              eventState,
              motionEvent,
              getCoalescingKey(),
          )
      )
    }
  }

  private fun dispatchCancelEventForTarget(
      targetView: View?,
      eventState: PointerEventState,
      motionEvent: MotionEvent,
      eventDispatcher: EventDispatcher,
  ) {
    // This means the gesture has already ended, via some other CANCEL or UP event. This is not
    // expected to happen very often as it would mean some child View has decided to intercept the
    // touch stream and start a native gesture only upon receiving the UP/CANCEL event.
    Assertions.assertCondition(
        childHandlingNativeGesture == UNSET_CHILD_VIEW_ID,
        "Expected to not have already sent a cancel for this gesture",
    )

    val activePointerId = eventState.activePointerId
    val activeHitPath: List<ViewTarget> =
        eventState.hitPathByPointerId[activePointerId] ?: emptyList()

    if (activeHitPath.isNotEmpty() && targetView != null) {
      val listeningForCancel =
          isAnyoneListeningForBubblingEvent(activeHitPath, EVENT.CANCEL, EVENT.CANCEL_CAPTURE)
      if (listeningForCancel) {
        val targetTag = activeHitPath[0].getViewId()

        // cancel events need to report client coordinates of (0, 0) and offset coordinates relative
        // to the root view
        val childOffset = getChildOffsetRelativeToRoot(targetView)
        val normalizedEventState =
            normalizeToRoot(eventState, childOffset.left.toFloat(), childOffset.top.toFloat())
        Assertions.assertNotNull(eventDispatcher)
            .dispatchEvent(
                PointerEvent.obtain(
                    PointerEventHelper.POINTER_CANCEL,
                    targetTag,
                    normalizedEventState,
                    motionEvent,
                )
            )
      }

      incrementCoalescingKey()
      primaryPointerId = UNSET_POINTER_ID
    }
  }

  // returns child (0, 0) relative to root coordinate system
  private fun getChildOffsetRelativeToRoot(childView: View): Rect {
    childCoords.set(0, 0, 1, 1)
    if (childView.rootView !== rootViewGroup.rootView) {
      // NOTE: if we are here it means the target view has been reparented, so we can't call
      // mRootViewGroup.offsetDescendantRectToMyCoords because an exception will be thrown.
      // We still return (0, 0) to ensure the cancel event is dispatched.
      return childCoords
    }
    rootViewGroup.offsetDescendantRectToMyCoords(childView, childCoords)
    return childCoords
  }

  // Returns a copy of `original` with coordinates zeroed relative to the provided root coordinates.
  // In particular,
  // - the event (client) coordinates will all be set to 0
  // - the offset coordinates will be set to the root coordinates
  private fun normalizeToRoot(
      original: PointerEventState,
      rootX: Float,
      rootY: Float,
  ): PointerEventState {
    val newOffsets = HashMap(original.offsetByPointerId)
    val newEventCoords = HashMap(original.eventCoordinatesByPointerId)
    val newScreenCoords = HashMap(original.screenCoordinatesByPointerId)

    val rootOffset = floatArrayOf(rootX, rootY)
    for (offsetEntry in newOffsets.entries) {
      offsetEntry.setValue(rootOffset)
    }

    val zeroOffset = floatArrayOf(0f, 0f)
    for (eventCoordsEntry in newEventCoords.entries) {
      eventCoordsEntry.setValue(zeroOffset)
    }

    val screenCoords = eventCoordsToScreenCoords(rootOffset)
    for (screenCoordsEntry in newScreenCoords.entries) {
      screenCoordsEntry.setValue(screenCoords)
    }

    return PointerEventState(
        original.primaryPointerId,
        original.activePointerId,
        original.lastButtonState,
        original.getSurfaceId(),
        newOffsets,
        HashMap(original.hitPathByPointerId),
        newEventCoords,
        newScreenCoords,
        HashSet(original.hoveringPointerIds),
    )
  }

  private companion object {
    private const val UNSELECTED_VIEW_TAG = -1
    private const val UNSET_POINTER_ID = -1
    private const val UNSET_CHILD_VIEW_ID = -1
    private const val ONMOVE_EPSILON = 0.1f
    private const val TAG = "PointerEvents"

    private val rootScreenCoords = intArrayOf(0, 0)
    private val childCoords = Rect(0, 0, 1, 1)

    // returns the section of the hit path shared by both lists, or an empty list if there's no such
    // section
    private fun findHitPathIntersection(
        hitsA: List<ViewTarget>,
        hitsB: List<ViewTarget>,
    ): List<ViewTarget> {
      if (hitsA.isEmpty()) {
        return ArrayList()
      }
      if (hitsB.isEmpty()) {
        return ArrayList()
      }

      val inA = HashSet(hitsA)

      val intersection = ArrayList<ViewTarget>()

      for (vt in hitsB) {
        if (inA.contains(vt)) {
          intersection.add(vt)
        }
      }

      return intersection
    }

    private fun isAnyoneListeningForBubblingEvent(
        hitPath: List<ViewTarget>,
        event: EVENT,
        captureEvent: EVENT,
    ): Boolean {
      for (viewTarget in hitPath) {
        if (
            PointerEventHelper.isListening(viewTarget.getView(), event) ||
                PointerEventHelper.isListening(viewTarget.getView(), captureEvent)
        ) {
          return true
        }
      }
      return false
    }

    /**
     * Returns list of view targets that we should be dispatching events from
     *
     * @param viewTargets, ordered from target -> root
     * @param bubble, name of event that bubbles. Should only ever be enter or leave
     * @param capture, name of event that captures. Should only ever be enter or leave
     * @param forceDispatch, if true, all viewTargets should dispatch
     * @return list of viewTargets filtered from target -> root
     */
    private fun filterByShouldDispatch(
        viewTargets: List<ViewTarget>,
        bubble: EVENT,
        capture: EVENT,
        forceDispatch: Boolean,
    ): MutableList<ViewTarget> {

      val dispatchableViewTargets = ArrayList(viewTargets)
      if (forceDispatch) {
        return dispatchableViewTargets
      }

      var ancestorListening = false

      // Start to filter which viewTargets may not need to dispatch an event
      for (i in viewTargets.size - 1 downTo 0) {
        val viewTarget = viewTargets[i]
        val view = viewTarget.getView()

        if (
            !ancestorListening &&
                !PointerEventHelper.isListening(view, capture) &&
                !PointerEventHelper.isListening(view, bubble)
        ) {
          dispatchableViewTargets.removeAt(i)
        } else if (!ancestorListening && PointerEventHelper.isListening(view, capture)) {
          ancestorListening = true
        }
      }
      return dispatchableViewTargets
    }

    private fun dispatchEventForViewTargets(
        eventName: String,
        eventState: PointerEventState,
        motionEvent: MotionEvent,
        viewTargets: List<ViewTarget>,
        dispatcher: EventDispatcher,
    ) {
      for (viewTarget in viewTargets) {
        val viewId = viewTarget.getViewId()
        dispatcher.dispatchEvent(PointerEvent.obtain(eventName, viewId, eventState, motionEvent))
      }
    }

    private fun qualifiedMove(
        eventCoordinates: FloatArray,
        lastEventCoordinates: FloatArray,
    ): Boolean {
      return (Math.abs(lastEventCoordinates[0] - eventCoordinates[0]) > ONMOVE_EPSILON ||
          Math.abs(lastEventCoordinates[1] - eventCoordinates[1]) > ONMOVE_EPSILON)
    }
  }
}
