/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Point
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.FocusFinder
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewParent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.HorizontalScrollView
import android.widget.OverScroller
import androidx.core.graphics.drawable.toDrawable
import androidx.core.view.ViewCompat
import androidx.core.view.ViewCompat.FocusDirection
import androidx.core.view.isEmpty
import androidx.core.view.isNotEmpty
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.HasChildPressedStateDelay
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.MeasureSpecAssertions
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactClippingViewGroup
import com.facebook.react.uimanager.ReactClippingViewGroupHelper
import com.facebook.react.uimanager.ReactOverflowViewWithInset
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.events.NativeGestureUtil
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.uimanager.style.Overflow
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasFlingAnimator
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasScrollEventThrottle
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasScrollState
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasSmoothScroll
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasStateWrapper
import com.facebook.react.views.scroll.ReactScrollViewHelper.ReactScrollViewScrollState
import com.facebook.react.views.scroll.ReactScrollViewHelper.SNAP_ALIGNMENT_CENTER
import com.facebook.react.views.scroll.ReactScrollViewHelper.SNAP_ALIGNMENT_DISABLED
import com.facebook.react.views.scroll.ReactScrollViewHelper.SNAP_ALIGNMENT_END
import com.facebook.react.views.scroll.ReactScrollViewHelper.SNAP_ALIGNMENT_START
import com.facebook.react.views.scroll.ReactScrollViewHelper.findNextFocusableView
import com.facebook.systrace.Systrace
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.round
import kotlin.math.sign

/** Similar to [ReactScrollView] but only supports horizontal scrolling. */
public open class ReactHorizontalScrollView
@JvmOverloads
constructor(context: Context, private val fpsListener: FpsListener? = null) :
    HorizontalScrollView(context),
    ReactClippingViewGroup,
    ViewGroup.OnHierarchyChangeListener,
    View.OnLayoutChangeListener,
    ReactAccessibleScrollView,
    ReactOverflowViewWithInset,
    HasScrollState,
    HasStateWrapper,
    HasFlingAnimator,
    HasScrollEventThrottle,
    HasSmoothScroll,
    VirtualViewContainer,
    HasChildPressedStateDelay {

  private companion object {
    private val DEBUG_MODE = false && ReactBuildConfig.DEBUG
    private val TAG = ReactHorizontalScrollView::class.java.simpleName

    private const val NO_SCROLL_POSITION = Int.MIN_VALUE
    private const val UNSET_CONTENT_OFFSET = -1

    private var scrollerField: java.lang.reflect.Field? = null
    private var triedToGetScrollerField = false

    private fun findDeepestScrollViewForMotionEvent(
        view: View,
        ev: MotionEvent,
    ): HorizontalScrollView? = findDeepestScrollViewForMotionEvent(view, ev, true)

    private fun findDeepestScrollViewForMotionEvent(
        view: View?,
        ev: MotionEvent,
        skipInitialView: Boolean,
    ): HorizontalScrollView? {
      if (view == null) return null

      val rectOnScreen = Rect()
      view.getGlobalVisibleRect(rectOnScreen)
      if (!rectOnScreen.contains(ev.rawX.toInt(), ev.rawY.toInt())) {
        return null
      }

      if (
          !skipInitialView &&
              view is HorizontalScrollView &&
              ViewCompat.isNestedScrollingEnabled(view) &&
              (view is ReactHorizontalScrollView && view.scrollEnabled)
      ) {
        return view
      }

      if (view is ViewGroup) {
        for (i in 0 until view.childCount) {
          val foundScrollView = findDeepestScrollViewForMotionEvent(view.getChildAt(i), ev, false)
          if (foundScrollView != null) {
            return foundScrollView
          }
        }
      }

      return null
    }
  }

  private var scrollXAfterMeasure = NO_SCROLL_POSITION

  private val onScrollDispatchHelper = OnScrollDispatchHelper()
  private val scroller: OverScroller? = getOverScrollerFromParent()
  private val velocityHelper = VelocityHelper()
  private val tempRect = Rect()
  private val defaultFlingAnimator: ValueAnimator = ObjectAnimator.ofInt(this, "scrollX", 0, 0)

  // Backing fields for interface properties with custom logic
  private var _overflowInset = Rect()
  private var _virtualViewContainerState: VirtualViewContainerState? = null
  private var _removeClippedSubviews = false
  private var _reactScrollViewScrollState = ReactScrollViewScrollState()

  // Private state
  private var activelyScrolling = false
  private var clippingRect: Rect? = null
  private var _overflow: Overflow =
      if (ReactNativeFeatureFlags.enablePropsUpdateReconciliationAndroid()) Overflow.VISIBLE
      else Overflow.SCROLL
  private var dragging = false
  private var pagingEnabled = false
  private var postTouchRunnable: Runnable? = null
  private var sendMomentumEvents = false
  private var scrollPerfTag: String? = null
  private var endBackground: Drawable? = null
  private var endFillColor = Color.TRANSPARENT
  private var disableIntervalMomentum = false
  private var snapInterval = 0
  private var snapOffsets: List<Int>? = null
  private var snapToStart = true
  private var snapToEnd = true
  private var snapToAlignment = SNAP_ALIGNMENT_DISABLED
  private var pagedArrowScrolling = false
  private var pendingContentOffsetX = UNSET_CONTENT_OFFSET
  private var pendingContentOffsetY = UNSET_CONTENT_OFFSET
  public open var pointerEvents: PointerEvents = PointerEvents.AUTO
  private var contentView: View? = null
  private var maintainVisibleContentPositionHelper:
      MaintainVisibleScrollPositionHelper<ReactHorizontalScrollView>? =
      null
  public open var fadingEdgeLengthStart: Int = 0
    set(value) {
      field = value
      invalidate()
    }

  public open var fadingEdgeLengthEnd: Int = 0
    set(value) {
      field = value
      invalidate()
    }

  private var emittedOverScrollSinceScrollBegin = false
  private var scrollsChildToFocus = true

  // Interface property overrides
  override var scrollEnabled: Boolean = true
  override var stateWrapper: StateWrapper? = null
  override var scrollEventThrottle: Int = 0
  override var lastScrollDispatchTime: Long = 0L
  override var hasChildPressedStateDelay: Boolean? = null

  override val virtualViewContainerState: VirtualViewContainerState
    get() =
        _virtualViewContainerState
            ?: VirtualViewContainerState.create(this).also { _virtualViewContainerState = it }

  override val overflowInset: Rect
    get() = _overflowInset

  override val overflow: String?
    get() =
        when (_overflow) {
          Overflow.HIDDEN -> "hidden"
          Overflow.SCROLL -> "scroll"
          Overflow.VISIBLE -> "visible"
        }

  override var removeClippedSubviews: Boolean
    get() = _removeClippedSubviews
    set(value) {
      if (ReactNativeFeatureFlags.disableSubviewClippingAndroid()) return
      if (value && clippingRect == null) clippingRect = Rect()
      _removeClippedSubviews = value
      updateClippingRect()
    }

  override var reactScrollViewScrollState: ReactScrollViewScrollState
    get() = _reactScrollViewScrollState
    set(value) {
      _reactScrollViewScrollState = value
      if (
          ReactNativeFeatureFlags.enableViewCulling() ||
              ReactNativeFeatureFlags.useTraitHiddenOnAndroid()
      ) {
        val scrollPosition = value.lastStateUpdateScroll
        restoreScrollTo(scrollPosition.x, scrollPosition.y)
      }
    }

  init {
    ViewCompat.setAccessibilityDelegate(this, ReactScrollViewAccessibilityDelegate())
    setOnHierarchyChangeListener(this)
    setClipChildren(false)
    initView()
  }

  /**
   * Set all default values here as opposed to in the constructor or field defaults. It is important
   * that these properties are set during the constructor, but also on-demand whenever an existing
   * ReactHorizontalScrollView is recycled.
   */
  private fun initView() {
    _overflowInset = Rect()
    _virtualViewContainerState = null
    activelyScrolling = false
    clippingRect = null
    _overflow =
        if (ReactNativeFeatureFlags.enablePropsUpdateReconciliationAndroid()) Overflow.VISIBLE
        else Overflow.SCROLL
    dragging = false
    pagingEnabled = false
    postTouchRunnable = null
    _removeClippedSubviews = false
    scrollEnabled = true
    sendMomentumEvents = false
    scrollPerfTag = null
    endBackground = null
    endFillColor = Color.TRANSPARENT
    disableIntervalMomentum = false
    snapInterval = 0
    snapOffsets = null
    snapToStart = true
    snapToEnd = true
    snapToAlignment = SNAP_ALIGNMENT_DISABLED
    pagedArrowScrolling = false
    pendingContentOffsetX = UNSET_CONTENT_OFFSET
    pendingContentOffsetY = UNSET_CONTENT_OFFSET
    stateWrapper = null
    _reactScrollViewScrollState = ReactScrollViewScrollState()
    pointerEvents = PointerEvents.AUTO
    lastScrollDispatchTime = 0
    scrollEventThrottle = 0
    contentView = null
    maintainVisibleContentPositionHelper = null
    fadingEdgeLengthStart = 0
    fadingEdgeLengthEnd = 0
    emittedOverScrollSinceScrollBegin = false
    scrollsChildToFocus = true
  }

  internal fun recycleView() {
    initView()
    if (parent != null) {
      (parent as ViewGroup).removeView(this)
    }
    updateView()
  }

  private fun updateView() {}

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)
    val testId = getTag(R.id.react_test_id) as? String
    if (testId != null) {
      info.viewIdResourceName = testId
    }
  }

  override fun canScrollHorizontally(direction: Int): Boolean {
    return scrollEnabled && super.canScrollHorizontally(direction)
  }

  private fun getOverScrollerFromParent(): OverScroller? {
    if (!triedToGetScrollerField) {
      triedToGetScrollerField = true
      try {
        scrollerField = HorizontalScrollView::class.java.getDeclaredField("mScroller")
        scrollerField?.isAccessible = true
      } catch (e: NoSuchFieldException) {
        FLog.w(
            TAG,
            "Failed to get mScroller field for HorizontalScrollView! " +
                "This app will exhibit the bounce-back scrolling bug :(",
        )
      }
    }

    val field = scrollerField ?: return null
    return try {
      val scrollerValue = field.get(this)
      if (scrollerValue is OverScroller) {
        scrollerValue
      } else {
        FLog.w(
            TAG,
            "Failed to cast mScroller field in HorizontalScrollView (probably due to OEM changes" +
                " to AOSP)! This app will exhibit the bounce-back scrolling bug :(",
        )
        null
      }
    } catch (e: IllegalAccessException) {
      throw RuntimeException("Failed to get mScroller from HorizontalScrollView!", e)
    }
  }

  public open fun setScrollPerfTag(scrollPerfTag: String?) {
    this.scrollPerfTag = scrollPerfTag
  }

  public open fun setDisableIntervalMomentum(disableIntervalMomentum: Boolean) {
    this.disableIntervalMomentum = disableIntervalMomentum
  }

  public open fun setSendMomentumEvents(sendMomentumEvents: Boolean) {
    this.sendMomentumEvents = sendMomentumEvents
  }

  public open fun setPagingEnabled(pagingEnabled: Boolean) {
    this.pagingEnabled = pagingEnabled
  }

  public open fun setScrollsChildToFocus(scrollsChildToFocus: Boolean) {
    this.scrollsChildToFocus = scrollsChildToFocus
  }

  public open fun setDecelerationRate(decelerationRate: Float) {
    reactScrollViewScrollState.decelerationRate = decelerationRate
    scroller?.setFriction(1.0f - decelerationRate)
  }

  public open fun abortAnimation() {
    if (scroller != null && !scroller.isFinished) {
      scroller.abortAnimation()
    }
  }

  public open fun setSnapInterval(snapInterval: Int) {
    this.snapInterval = snapInterval
  }

  public open fun setSnapOffsets(snapOffsets: List<Int>?) {
    this.snapOffsets = snapOffsets
  }

  public open fun setSnapToStart(snapToStart: Boolean) {
    this.snapToStart = snapToStart
  }

  public open fun setSnapToEnd(snapToEnd: Boolean) {
    this.snapToEnd = snapToEnd
  }

  public open fun setSnapToAlignment(snapToAlignment: Int) {
    this.snapToAlignment = snapToAlignment
  }

  public open fun flashScrollIndicators() {
    awakenScrollBars()
  }

  override fun getLeftFadingEdgeStrength(): Float {
    val max = max(fadingEdgeLengthStart.toFloat(), fadingEdgeLengthEnd.toFloat())
    val value =
        if (layoutDirection == LAYOUT_DIRECTION_RTL) fadingEdgeLengthEnd else fadingEdgeLengthStart
    return value / max
  }

  override fun getRightFadingEdgeStrength(): Float {
    val max = max(fadingEdgeLengthStart.toFloat(), fadingEdgeLengthEnd.toFloat())
    val value =
        if (layoutDirection == LAYOUT_DIRECTION_RTL) fadingEdgeLengthStart else fadingEdgeLengthEnd
    return value / max
  }

  public open fun setOverflow(overflow: String?) {
    _overflow =
        if (overflow == null) {
          Overflow.SCROLL
        } else {
          Overflow.fromString(overflow)
              ?: if (ReactNativeFeatureFlags.enablePropsUpdateReconciliationAndroid())
                  Overflow.VISIBLE
              else Overflow.SCROLL
        }
    invalidate()
  }

  internal open fun setMaintainVisibleContentPosition(
      config: MaintainVisibleScrollPositionHelper.Config?
  ) {
    if (config != null && maintainVisibleContentPositionHelper == null) {
      val helper = MaintainVisibleScrollPositionHelper(this, true)
      maintainVisibleContentPositionHelper = helper
      helper.start()
    } else if (config == null) {
      maintainVisibleContentPositionHelper?.stop()
      maintainVisibleContentPositionHelper = null
    }
    maintainVisibleContentPositionHelper?.let { it.config = config }
  }

  override fun setOverflowInset(left: Int, top: Int, right: Int, bottom: Int) {
    _overflowInset.set(left, top, right, bottom)
  }

  public override fun onDraw(canvas: Canvas) {
    if (_overflow != Overflow.VISIBLE) {
      BackgroundStyleApplicator.clipToPaddingBox(this, canvas)
    }
    super.onDraw(canvas)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec)

    val measuredWidth = MeasureSpec.getSize(widthMeasureSpec)
    val measuredHeight = MeasureSpec.getSize(heightMeasureSpec)

    if (DEBUG_MODE) {
      FLog.i(
          TAG,
          "onMeasure[%d] measured width: %d measured height: %d",
          id,
          measuredWidth,
          measuredHeight,
      )
    }

    val measuredHeightChanged = getMeasuredHeight() != measuredHeight

    setMeasuredDimension(measuredWidth, measuredHeight)

    // See how `scrollXAfterMeasure` is used in `onLayout`, and why we only enable the
    // hack if the height has changed.
    if (measuredHeightChanged && scroller != null) {
      scrollXAfterMeasure = scroller.currX
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "onLayout[%d] l %d t %d r %d b %d", id, l, t, r, b)
    }

    // Has the scrollX changed between the last onMeasure and this layout?
    // If so, cancel the animation.
    // Essentially, if the height changes (due to keyboard popping up, for instance) the
    // underlying View.layout method will in some cases scroll to an incorrect X position -
    // see also the hacks in `fling`. The order of layout is called in the order of: onMeasure,
    // layout, onLayout.
    // We cannot override `layout` but we can detect the sequence of events between onMeasure
    // and onLayout.
    if (
        scrollXAfterMeasure != NO_SCROLL_POSITION &&
            scroller != null &&
            scrollXAfterMeasure != scroller.finalX &&
            !scroller.isFinished
    ) {
      if (DEBUG_MODE) {
        FLog.i(
            TAG,
            "onLayout[%d] scroll hack enabled: reset to previous scrollX position of %d",
            id,
            scrollXAfterMeasure,
        )
      }
      scroller.startScroll(scrollXAfterMeasure, scroller.finalY, 0, 0)
      scroller.forceFinished(true)
      scrollXAfterMeasure = NO_SCROLL_POSITION
    }

    // Apply pending contentOffset in case it was set before the view was laid out.
    if (isContentReady()) {
      val scrollToX =
          if (pendingContentOffsetX != UNSET_CONTENT_OFFSET) pendingContentOffsetX else scrollX
      val scrollToY =
          if (pendingContentOffsetY != UNSET_CONTENT_OFFSET) pendingContentOffsetY else scrollY
      scrollTo(scrollToX, scrollToY)
    }

    ReactScrollViewHelper.emitLayoutEvent(this)
    _virtualViewContainerState?.updateState()
  }

  /**
   * Since ReactHorizontalScrollView handles layout changes on JS side, it does not call
   * super.onLayout due to which mIsLayoutDirty flag in HorizontalScrollView remains true and
   * prevents scrolling to child when requestChildFocus is called. Overriding this method and
   * scrolling to child without checking any layout dirty flag. This will fix focus navigation issue
   * for KeyEvents which are not handled in HorizontalScrollView, for example: KEYCODE_TAB.
   */
  override fun requestChildFocus(child: View, focused: View?) {
    if (focused != null && !pagingEnabled && scrollsChildToFocus) {
      scrollToChild(focused)
    }
    requestChildFocusWithoutScroll(child, focused)
  }

  /**
   * In rare cases where an app overrides the built-in ReactScrollView by overriding it, and also
   * needs to customize scroll into view on focus behaviors, this protected method can be used to
   * unblock such customization.
   */
  protected open fun requestChildFocusWithoutScroll(child: View, focused: View?) {
    super.requestChildFocus(child, focused)
  }

  override fun requestChildRectangleOnScreen(
      child: View,
      rectangle: Rect,
      immediate: Boolean,
  ): Boolean {
    if (!scrollsChildToFocus) return false
    return super.requestChildRectangleOnScreen(child, rectangle, immediate)
  }

  override fun addFocusables(views: ArrayList<View>, direction: Int, focusableMode: Int) {
    if (pagingEnabled && !pagedArrowScrolling) {
      // Only add elements within the current page to list of focusables
      val candidateViews = ArrayList<View>()
      super.addFocusables(candidateViews, direction, focusableMode)
      for (candidate in candidateViews) {
        // We must also include the currently focused in the focusables list or focus search will
        // always return the first element within the focusables list
        if (
            isScrolledInView(candidate) ||
                isPartiallyScrolledInView(candidate) ||
                candidate.isFocused
        ) {
          views.add(candidate)
        }
      }
    } else {
      super.addFocusables(views, direction, focusableMode)
    }
  }

  /** Calculates the x delta required to scroll the given descendent into view */
  private fun getScrollDelta(descendent: View): Int {
    descendent.getDrawingRect(tempRect)
    offsetDescendantRectToMyCoords(descendent, tempRect)
    return computeScrollDeltaToGetChildRectOnScreen(tempRect)
  }

  /** Returns whether the given descendent is scrolled fully in view */
  private fun isScrolledInView(descendent: View): Boolean {
    return getScrollDelta(descendent) == 0
  }

  override fun isPartiallyScrolledInView(view: View): Boolean {
    val scrollDelta = getScrollDelta(view)
    view.getDrawingRect(tempRect)
    return scrollDelta != 0 && abs(scrollDelta) < tempRect.width()
  }

  /** Returns whether the given descendent is "mostly" (>50%) scrolled in view */
  private fun isMostlyScrolledInView(descendent: View): Boolean {
    val scrollDelta = getScrollDelta(descendent)
    descendent.getDrawingRect(tempRect)
    return scrollDelta != 0 && abs(scrollDelta) < (tempRect.width() / 2)
  }

  private fun scrollToChild(child: View) {
    val scrollDelta = getScrollDelta(child)
    if (scrollDelta != 0) {
      scrollBy(scrollDelta, 0)
    }
  }

  override fun onScrollChanged(x: Int, y: Int, oldX: Int, oldY: Int) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "onScrollChanged[%d] x %d y %d oldx %d oldy %d", id, x, y, oldX, oldY)
    }

    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactHorizontalScrollView.onScrollChanged")
    try {
      super.onScrollChanged(x, y, oldX, oldY)
      activelyScrolling = true
      if (onScrollDispatchHelper.onScrollChanged(x, y)) {
        if (_removeClippedSubviews) {
          updateClippingRect()
        }
        ReactScrollViewHelper.updateStateOnScrollChanged(
            this,
            onScrollDispatchHelper.xFlingVelocity,
            onScrollDispatchHelper.yFlingVelocity,
        )
        _virtualViewContainerState?.updateState()
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
  }

  override fun shouldDelayChildPressedState(): Boolean =
      hasChildPressedStateDelay ?: super.shouldDelayChildPressedState()

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    if (!scrollEnabled) return false

    if (
        ev.action == MotionEvent.ACTION_DOWN &&
            findDeepestScrollViewForMotionEvent(this, ev) != null
    ) {
      return false
    }

    // We intercept the touch event if the children are not supposed to receive it.
    if (!PointerEvents.canChildrenBeTouchTarget(pointerEvents)) return true

    try {
      if (super.onInterceptTouchEvent(ev)) {
        handleInterceptedTouchEvent(ev)
        return true
      }
    } catch (e: IllegalArgumentException) {
      // Log and ignore the error. This seems to be a bug in the android SDK and
      // this is the commonly accepted workaround.
      // https://tinyurl.com/mw6qkod (Stack Overflow)
      FLog.w(ReactConstants.TAG, "Error intercepting touch event.", e)
    }

    return false
  }

  protected open fun handleInterceptedTouchEvent(ev: MotionEvent) {
    if (!ReactNativeFeatureFlags.shouldTriggerResponderTransferOnScrollAndroid()) {
      NativeGestureUtil.notifyNativeGestureStarted(this, ev)
    }
    ReactScrollViewHelper.emitScrollBeginDragEvent(this)
    dragging = true
    emittedOverScrollSinceScrollBegin = false
    enableFpsListener()
    getFlingAnimator().cancel()
  }

  override fun pageScroll(direction: Int): Boolean {
    val handled = super.pageScroll(direction)
    if (pagingEnabled && handled) {
      handlePostTouchScrolling(0, 0)
    }
    return handled
  }

  private fun isDescendantOf(parent: View?, view: View?): Boolean {
    if (view == null || parent == null) return false
    var p: ViewParent? = view.parent
    while (p != null && p.parent != null) {
      if (p === parent) return true
      p = p.parent
    }
    return false
  }

  override fun arrowScroll(direction: Int): Boolean {
    var handled = false

    if (pagingEnabled) {
      pagedArrowScrolling = true

      if (isNotEmpty()) {
        val currentFocused = findFocus()
        val nextFocused = FocusFinder.getInstance().findNextFocus(this, currentFocused, direction)
        val rootChild = getContentView()
        if (nextFocused != null && isDescendantOf(rootChild, nextFocused)) {
          if (!isScrolledInView(nextFocused) && !isMostlyScrolledInView(nextFocused)) {
            smoothScrollToNextPage(direction)
          }
          nextFocused.requestFocus()
          handled = true
        } else {
          smoothScrollToNextPage(direction)
          handled = true
        }
      }

      pagedArrowScrolling = false
    } else {
      handled = super.arrowScroll(direction)
    }

    return handled
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    if (!scrollEnabled) return false

    // We do not accept the touch event if this view is not supposed to receive it.
    if (!PointerEvents.canBeTouchTarget(pointerEvents)) return false

    velocityHelper.calculateVelocity(ev)
    val action = ev.actionMasked
    if (action == MotionEvent.ACTION_UP && dragging) {
      ReactScrollViewHelper.updateFabricScrollState(this)

      val velocityX = velocityHelper.xVelocity
      val velocityY = velocityHelper.yVelocity
      ReactScrollViewHelper.emitScrollEndDragEvent(this, velocityX, velocityY)
      if (!ReactNativeFeatureFlags.shouldTriggerResponderTransferOnScrollAndroid()) {
        NativeGestureUtil.notifyNativeGestureEnded(this, ev)
      }
      dragging = false
      // After the touch finishes, we may need to do some scrolling afterwards either as a result
      // of a fling or because we need to page align the content
      handlePostTouchScrolling(Math.round(velocityX), Math.round(velocityY))
    }

    if (action == MotionEvent.ACTION_DOWN) {
      cancelPostTouchScrolling()
    }

    return try {
      super.onTouchEvent(ev)
    } catch (e: IllegalArgumentException) {
      // Log and ignore the error. This seems to be a bug in the android SDK and
      // this is the commonly accepted workaround.
      // https://tinyurl.com/mw6qkod (Stack Overflow)
      FLog.w(ReactConstants.TAG, "Error handling touch event.", e)
      false
    }
  }

  override fun dispatchGenericMotionEvent(ev: MotionEvent): Boolean {
    // Ignore generic motion events (joystick, mouse wheel, trackpad) if scrolling is disabled
    if (!scrollEnabled) return false

    // We do not dispatch the motion event if its children are not supposed to receive it
    if (!PointerEvents.canChildrenBeTouchTarget(pointerEvents)) return false

    // Handle ACTION_SCROLL events (mouse wheel, trackpad, joystick)
    if (ev.actionMasked == MotionEvent.ACTION_SCROLL) {
      val hScroll = ev.getAxisValue(MotionEvent.AXIS_HSCROLL)
      if (hScroll != 0f) {
        // Perform the scroll
        enableFpsListener()
        val result = super.dispatchGenericMotionEvent(ev)
        // Schedule snap alignment to run after scrolling stops
        if (
            result &&
                (pagingEnabled ||
                    snapInterval != 0 ||
                    snapOffsets != null ||
                    snapToAlignment != SNAP_ALIGNMENT_DISABLED)
        ) {
          // Cancel any pending post-touch runnable and reschedule
          if (postTouchRunnable != null) {
            removeCallbacks(postTouchRunnable)
            postTouchRunnable = null
          }
          postTouchRunnable = Runnable {
            postTouchRunnable = null
            // +1/-1 velocity if scrolling right or left. This is to ensure that the
            // next/previous page is picked rather than sliding backwards to the current page
            var velocityX = hScroll.sign.toInt()
            if (disableIntervalMomentum) {
              velocityX = 0
            }
            flingAndSnap(velocityX)
            handlePostTouchScrolling(velocityX, 0)
          }
          postOnAnimationDelayed(postTouchRunnable, ReactScrollViewHelper.MOMENTUM_DELAY)
        } else {
          handlePostTouchScrolling(0, 0)
        }
        return result
      }
    }

    return super.dispatchGenericMotionEvent(ev)
  }

  override fun executeKeyEvent(event: KeyEvent): Boolean {
    val eventKeyCode = event.keyCode
    if (
        !scrollEnabled &&
            (eventKeyCode == KeyEvent.KEYCODE_DPAD_LEFT ||
                eventKeyCode == KeyEvent.KEYCODE_DPAD_RIGHT)
    ) {
      return false
    }
    return super.executeKeyEvent(event)
  }

  override fun fling(velocityX: Int) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "fling[%d] velocityX %d", id, velocityX)
    }

    // Workaround.
    // On Android P if a ScrollView is inverted, we will get a wrong sign for
    // velocityX (see https://issuetracker.google.com/issues/112385925).
    // At the same time, onScrollDispatchHelper tracks the correct velocity direction.
    //
    // Hence, we can use the absolute value from whatever the OS gives
    // us and use the sign of what onScrollDispatchHelper has tracked.
    val correctedVelocityX =
        if (Build.VERSION.SDK_INT == Build.VERSION_CODES.P) {
          (abs(velocityX) * onScrollDispatchHelper.xFlingVelocity.sign).toInt()
        } else {
          velocityX
        }

    if (pagingEnabled) {
      flingAndSnap(correctedVelocityX)
    } else if (scroller != null) {
      // FB SCROLLVIEW CHANGE

      // We provide our own version of fling that uses a different call to the standard OverScroller
      // which takes into account the possibility of adding new content while the ScrollView is
      // animating. Because we give essentially no max X for the fling, the fling will continue as
      // long as there is content. See onOverScrolled() to see the second part of this change which
      // properly aborts the scroller animation when we get to the bottom of the ScrollView content.

      val scrollWindowWidth = width - paddingStart - paddingEnd

      scroller.fling(
          scrollX, // startX
          scrollY, // startY
          correctedVelocityX, // velocityX
          0, // velocityY
          0, // minX
          Int.MAX_VALUE, // maxX
          0, // minY
          0, // maxY
          scrollWindowWidth / 2, // overX
          0, // overY
      )

      postInvalidateOnAnimation()

      // END FB SCROLLVIEW CHANGE
    } else {
      super.fling(correctedVelocityX)
    }
    handlePostTouchScrolling(correctedVelocityX, 0)
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (_removeClippedSubviews) {
      updateClippingRect()
    }
    _virtualViewContainerState?.updateState()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (_removeClippedSubviews) {
      updateClippingRect()
    }
    maintainVisibleContentPositionHelper?.start()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    maintainVisibleContentPositionHelper?.stop()
  }

  override fun focusSearch(focused: View, @FocusDirection direction: Int): View? {
    val nextFocus = super.focusSearch(focused, direction)

    if (ReactNativeFeatureFlags.enableCustomFocusSearchOnClippedElementsAndroid()) {
      // If we can find the next focus and it is a child of this view, return it, else it means we
      // are leaving the scroll view and we should try to find a clipped element
      if (nextFocus != null && findViewById<View>(nextFocus.id) != null) {
        return nextFocus
      }
      val nextFocusableView = findNextFocusableView(this, focused, direction)
      if (nextFocusableView != null) {
        return nextFocusableView
      }
    }

    return nextFocus
  }

  override fun updateClippingRect() {
    updateClippingRect(null)
  }

  override fun updateClippingRect(excludedViews: Set<Int>?) {
    if (!_removeClippedSubviews) return

    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactHorizontalScrollView.updateClippingRect")
    try {
      val rect = checkNotNull(clippingRect)
      ReactClippingViewGroupHelper.calculateClippingRect(this, rect)
      val cv = getContentView()
      if (cv is ReactClippingViewGroup) {
        cv.updateClippingRect(excludedViews)
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
  }

  override fun getClippingRect(outClippingRect: Rect) {
    outClippingRect.set(checkNotNull(clippingRect))
  }

  override fun getChildVisibleRect(child: View, r: Rect, offset: android.graphics.Point?): Boolean {
    return super.getChildVisibleRect(child, r, offset)
  }

  private fun getSnapInterval(): Int = if (snapInterval != 0) snapInterval else width

  private fun getContentView(): View? = getChildAt(0)

  public open fun setEndFillColor(color: Int) {
    if (color != endFillColor) {
      endFillColor = color
      endBackground = endFillColor.toDrawable()
    }
  }

  override fun onOverScrolled(scrollX: Int, scrollY: Int, clampedX: Boolean, clampedY: Boolean) {
    if (DEBUG_MODE) {
      FLog.i(
          TAG,
          "onOverScrolled[%d] scrollX %d scrollY %d clampedX %b clampedY %b",
          id,
          scrollX,
          scrollY,
          clampedX,
          clampedY,
      )
    }

    @Suppress("NAME_SHADOWING") var scrollX = scrollX

    if (scroller != null) {
      // FB SCROLLVIEW CHANGE

      // This is part two of the reimplementation of fling to fix the bounce-back bug. See fling()
      // for more information.

      if (!scroller.isFinished && scroller.currX != scroller.finalX) {
        val scrollRange = max(computeHorizontalScrollRange() - width, 0)
        if (scrollX >= scrollRange) {
          scroller.abortAnimation()
          scrollX = scrollRange
        }
      }

      // END FB SCROLLVIEW CHANGE
    }

    if (
        ReactNativeFeatureFlags.shouldTriggerResponderTransferOnScrollAndroid() &&
            clampedX &&
            !emittedOverScrollSinceScrollBegin
    ) {
      ReactScrollViewHelper.emitScrollEvent(this, 0f, 0f)
      emittedOverScrollSinceScrollBegin = true
    }

    super.onOverScrolled(scrollX, scrollY, clampedX, clampedY)
  }

  override fun onChildViewAdded(parent: View, child: View) {
    contentView = child
    child.addOnLayoutChangeListener(this)
  }

  override fun onChildViewRemoved(parent: View, child: View) {
    contentView?.removeOnLayoutChangeListener(this)
    contentView = null
  }

  private fun enableFpsListener() {
    if (isScrollPerfLoggingEnabled()) {
      val listener = fpsListener ?: return
      val perfTag = scrollPerfTag.takeUnless { it.isNullOrEmpty() } ?: return
      listener.enable(perfTag)
    }
  }

  private fun disableFpsListener() {
    if (isScrollPerfLoggingEnabled()) {
      val listener = fpsListener ?: return
      val perfTag = scrollPerfTag.takeUnless { it.isNullOrEmpty() } ?: return
      listener.disable(perfTag)
    }
  }

  private fun isScrollPerfLoggingEnabled(): Boolean {
    return fpsListener != null && !scrollPerfTag.isNullOrEmpty()
  }

  override fun draw(canvas: Canvas) {
    if (endFillColor != Color.TRANSPARENT) {
      val content = getContentView()
      val bg = endBackground
      if (bg != null && content != null && content.right < width) {
        bg.setBounds(content.right, 0, width, height)
        bg.draw(canvas)
      }
    }
    super.draw(canvas)
  }

  /**
   * This handles any sort of scrolling that may occur after a touch is finished. This may be
   * momentum scrolling (fling) or because you have pagingEnabled on the scroll view. Because we
   * don't get any events from Android about this lifecycle, we do all our detection by creating a
   * runnable that checks if we scrolled in the last frame and if so assumes we are still scrolling.
   */
  private fun handlePostTouchScrolling(velocityX: Int, velocityY: Int) {
    if (DEBUG_MODE) {
      FLog.i(
          TAG,
          "handlePostTouchScrolling[%d] velocityX %d velocityY %d",
          id,
          velocityX,
          velocityY,
      )
    }

    // Check if we are already handling this which may occur if this is called by both the touch up
    // and a fling call
    if (postTouchRunnable != null) return

    if (sendMomentumEvents) {
      ReactScrollViewHelper.emitScrollMomentumBeginEvent(this, velocityX, velocityY)
    }

    activelyScrolling = false
    postTouchRunnable =
        object : Runnable {
          private var snappingToPage = false
          private var stableFrames = 0

          override fun run() {
            if (activelyScrolling) {
              // We are still scrolling.
              activelyScrolling = false
              stableFrames = 0
              this@ReactHorizontalScrollView.postOnAnimationDelayed(
                  this,
                  ReactScrollViewHelper.MOMENTUM_DELAY,
              )
            } else {
              // There has not been a scroll update since the last time this Runnable executed.
              ReactScrollViewHelper.updateFabricScrollState(this@ReactHorizontalScrollView)

              // We keep checking for updates until the ScrollView has "stabilized" and hasn't
              // scrolled for N consecutive frames. This number is arbitrary: big enough to catch
              // a number of race conditions, but small enough to not cause perf regressions, etc.
              // In anecdotal testing, it seemed like a decent number.
              // Without this check, sometimes this Runnable stops executing too soon - it will
              // fire before the first scroll event of an animated scroll/fling, and stop
              // immediately.
              stableFrames++

              if (stableFrames >= 3) {
                postTouchRunnable = null
                if (sendMomentumEvents) {
                  ReactScrollViewHelper.emitScrollMomentumEndEvent(this@ReactHorizontalScrollView)
                }
                // Kotlin name is notifyUserDrivenScrollEnded; the _internal suffix is
                // only a @JvmName alias for Java callers.
                ReactScrollViewHelper.notifyUserDrivenScrollEnded(this@ReactHorizontalScrollView)
                disableFpsListener()
              } else {
                if (pagingEnabled && !snappingToPage) {
                  // If we have pagingEnabled and we have not snapped to the page
                  // we need to cause that scroll by asking for it
                  snappingToPage = true
                  flingAndSnap(0)
                }
                // The scrollview has not "stabilized" so we just post to check again a frame later
                this@ReactHorizontalScrollView.postOnAnimationDelayed(
                    this,
                    ReactScrollViewHelper.MOMENTUM_DELAY,
                )
              }
            }
          }
        }
    postOnAnimationDelayed(postTouchRunnable, ReactScrollViewHelper.MOMENTUM_DELAY)
  }

  private fun cancelPostTouchScrolling() {
    if (postTouchRunnable != null) {
      removeCallbacks(postTouchRunnable)
      postTouchRunnable = null
      getFlingAnimator().cancel()
    }
  }

  private fun predictFinalScrollPosition(velocityX: Int): Int {
    // predict where a fling would end up so we can scroll to the nearest snap offset
    val maximumOffset = max(0, computeHorizontalScrollRange() - width)
    // TODO(T106335409): Existing prediction still uses overscroller. Consider change this to use
    // fling animator instead.
    return if (getFlingAnimator() === defaultFlingAnimator) {
      ReactScrollViewHelper.predictFinalScrollPosition(this, velocityX, 0, maximumOffset, 0).x
    } else {
      ReactScrollViewHelper.getNextFlingStartValue(
          this,
          scrollX,
          reactScrollViewScrollState.finalAnimatedPositionScroll.x,
          velocityX,
      ) + getFlingExtrapolatedDistance(velocityX)
    }
  }

  /**
   * This will smooth scroll us to the nearest snap offset point. It currently just looks at where
   * the content is and slides to the nearest point. It is intended to be run after we are done
   * scrolling, and handling any momentum scrolling.
   */
  private fun smoothScrollAndSnap(velocity: Int) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "smoothScrollAndSnap[%d] velocity %d", id, velocity)
    }

    val interval = getSnapInterval().toDouble()
    val currentOffset =
        ReactScrollViewHelper.getNextFlingStartValue(
                this,
                scrollX,
                reactScrollViewScrollState.finalAnimatedPositionScroll.x,
                velocity,
            )
            .toDouble()
    val targetOffset = predictFinalScrollPosition(velocity).toDouble()

    var previousPage = floor(currentOffset / interval).toInt()
    var nextPage = ceil(currentOffset / interval).toInt()
    var currentPage = round(currentOffset / interval).toInt()
    val targetPage = round(targetOffset / interval).toInt()

    if (velocity > 0 && nextPage == previousPage) {
      nextPage++
    } else if (velocity < 0 && previousPage == nextPage) {
      previousPage--
    }

    if (velocity > 0 && currentPage < nextPage && targetPage > previousPage) {
      currentPage = nextPage
    } else if (velocity < 0 && currentPage > previousPage && targetPage < nextPage) {
      currentPage = previousPage
    }

    val finalTargetOffset = currentPage * interval
    if (finalTargetOffset != currentOffset) {
      activelyScrolling = true
      reactSmoothScrollTo(finalTargetOffset.toInt(), scrollY)
    }
  }

  private fun flingAndSnap(velocityX: Int) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "smoothScrollAndSnap[%d] velocityX %d", id, velocityX)
    }

    if (isEmpty()) return

    // pagingEnabled only allows snapping one interval at a time
    if (snapInterval == 0 && snapOffsets == null && snapToAlignment == SNAP_ALIGNMENT_DISABLED) {
      smoothScrollAndSnap(velocityX)
      return
    }

    @Suppress("NAME_SHADOWING") var velocityX = velocityX
    val hasCustomizedFlingAnimator = getFlingAnimator() !== defaultFlingAnimator
    val maximumOffset = max(0, computeHorizontalScrollRange() - width)
    var targetOffset = predictFinalScrollPosition(velocityX)
    if (disableIntervalMomentum) {
      targetOffset = scrollX
    }

    var smallerOffset = 0
    var largerOffset = maximumOffset
    var firstOffset = 0
    var lastOffset = maximumOffset
    val viewportWidth = width - paddingStart - paddingEnd

    // offsets are from the right edge in RTL layouts
    if (layoutDirection == LAYOUT_DIRECTION_RTL) {
      targetOffset = maximumOffset - targetOffset
      velocityX = -velocityX
    }

    // get the nearest snap points to the target offset
    val offsets = snapOffsets
    if (!offsets.isNullOrEmpty()) {
      firstOffset = offsets[0]
      lastOffset = offsets[offsets.size - 1]

      for (i in offsets.indices) {
        val offset = offsets[i]
        if (offset <= targetOffset) {
          if (targetOffset - offset < targetOffset - smallerOffset) {
            smallerOffset = offset
          }
        }
        if (offset >= targetOffset) {
          if (offset - targetOffset < largerOffset - targetOffset) {
            largerOffset = offset
          }
        }
      }
    } else if (snapToAlignment != SNAP_ALIGNMENT_DISABLED) {
      if (snapInterval > 0) {
        val ratio = targetOffset.toDouble() / snapInterval
        smallerOffset =
            max(
                getItemStartOffset(
                    snapToAlignment,
                    (floor(ratio) * snapInterval).toInt(),
                    snapInterval,
                    viewportWidth,
                ),
                0,
            )
        largerOffset =
            kotlin.math.min(
                getItemStartOffset(
                    snapToAlignment,
                    (ceil(ratio) * snapInterval).toInt(),
                    snapInterval,
                    viewportWidth,
                ),
                maximumOffset,
            )
      } else {
        val cv = getContentView() as? ViewGroup ?: return
        var smallerChildOffset = largerOffset
        var largerChildOffset = smallerOffset
        for (i in 0 until cv.childCount) {
          val item = cv.getChildAt(i)
          val itemStartOffset =
              getItemStartOffset(snapToAlignment, item.left, item.width, viewportWidth)
          if (itemStartOffset <= targetOffset) {
            if (targetOffset - itemStartOffset < targetOffset - smallerOffset) {
              smallerOffset = itemStartOffset
            }
          }
          if (itemStartOffset >= targetOffset) {
            if (itemStartOffset - targetOffset < largerOffset - targetOffset) {
              largerOffset = itemStartOffset
            }
          }
          smallerChildOffset = kotlin.math.min(smallerChildOffset, itemStartOffset)
          largerChildOffset = max(largerChildOffset, itemStartOffset)
        }

        // For Recycler ViewGroup, the maximumOffset can be much larger than the total heights of
        // items in the layout. In this case snapping is not possible beyond the currently rendered
        // children.
        smallerOffset = max(smallerOffset, smallerChildOffset)
        largerOffset = kotlin.math.min(largerOffset, largerChildOffset)
      }
    } else {
      val interval = getSnapInterval().toDouble()
      val ratio = targetOffset.toDouble() / interval
      smallerOffset = (floor(ratio) * interval).toInt()
      largerOffset = kotlin.math.min((ceil(ratio) * interval).toInt(), maximumOffset)
    }

    // Calculate the nearest offset
    val nearestOffset =
        if (abs(targetOffset - smallerOffset) < abs(largerOffset - targetOffset)) smallerOffset
        else largerOffset

    // if scrolling after the last snap offset and snapping to the
    // end of the list is disabled, then we allow free scrolling
    var currentOffset = scrollX
    if (layoutDirection == LAYOUT_DIRECTION_RTL) {
      currentOffset = maximumOffset - currentOffset
    }
    if (!snapToEnd && targetOffset >= lastOffset) {
      if (currentOffset >= lastOffset) {
        // free scrolling
      } else {
        // snap to end
        targetOffset = lastOffset
      }
    } else if (!snapToStart && targetOffset <= firstOffset) {
      if (currentOffset <= firstOffset) {
        // free scrolling
      } else {
        // snap to beginning
        targetOffset = firstOffset
      }
    } else if (velocityX > 0) {
      if (!hasCustomizedFlingAnimator) {
        // The default animator requires boost on initial velocity as when snapping velocity can
        // feel sluggish for slow swipes
        velocityX += ((largerOffset - targetOffset) * 10.0).toInt()
      }
      targetOffset = largerOffset
    } else if (velocityX < 0) {
      if (!hasCustomizedFlingAnimator) {
        // The default animator requires boost on initial velocity as when snapping velocity can
        // feel sluggish for slow swipes
        velocityX -= ((targetOffset - smallerOffset) * 10.0).toInt()
      }
      targetOffset = smallerOffset
    } else {
      targetOffset = nearestOffset
    }

    // Make sure the new offset isn't out of bounds
    targetOffset = kotlin.math.min(max(0, targetOffset), maximumOffset)

    if (layoutDirection == LAYOUT_DIRECTION_RTL) {
      targetOffset = maximumOffset - targetOffset
      velocityX = -velocityX
    }

    if (hasCustomizedFlingAnimator || scroller == null) {
      reactSmoothScrollTo(targetOffset, scrollY)
    } else {
      // smoothScrollTo will always scroll over 250ms which is often *waaay*
      // too short and will cause the scrolling to feel almost instant
      // try to manually interact with OverScroller instead
      // if velocity is 0 however, fling() won't work, so we want to use smoothScrollTo
      activelyScrolling = true

      scroller.fling(
          scrollX, // startX
          scrollY, // startY
          // velocity = 0 doesn't work with fling() so we pretend there's a reasonable
          // initial velocity going on when a touch is released without any movement
          if (velocityX != 0) velocityX else targetOffset - scrollX, // velocityX
          0, // velocityY
          // setting both minX and maxX to the same value will guarantee that we scroll to it
          // but using the standard fling-style easing rather than smoothScrollTo's 250ms animation
          targetOffset, // minX
          targetOffset, // maxX
          0, // minY
          0, // maxY
          // we only want to allow overscrolling if the final offset is at the very edge of the view
          if (targetOffset == 0 || targetOffset == maximumOffset) viewportWidth / 2 else 0, // overX
          0, // overY
      )

      postInvalidateOnAnimation()
    }
  }

  private fun getItemStartOffset(
      snapToAlignment: Int,
      itemStartPosition: Int,
      itemWidth: Int,
      viewPortWidth: Int,
  ): Int =
      when (snapToAlignment) {
        SNAP_ALIGNMENT_CENTER -> itemStartPosition - (viewPortWidth - itemWidth) / 2
        SNAP_ALIGNMENT_START -> itemStartPosition
        SNAP_ALIGNMENT_END -> itemStartPosition - (viewPortWidth - itemWidth)
        else ->
            throw IllegalStateException("Invalid SnapToAlignment value: ${this.snapToAlignment}")
      }

  private fun smoothScrollToNextPage(direction: Int) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "smoothScrollToNextPage[%d] direction %d", id, direction)
    }

    val w = width
    val currentX = scrollX

    var page = currentX / w
    if (currentX % w != 0) {
      page++
    }

    if (direction == View.FOCUS_LEFT) {
      page -= 1
    } else {
      page += 1
    }

    if (page < 0) {
      page = 0
    }

    reactSmoothScrollTo(page * w, scrollY)
    handlePostTouchScrolling(0, 0)
  }

  override fun setBackgroundColor(color: Int) {
    BackgroundStyleApplicator.setBackgroundColor(this, color)
  }

  public open fun setBorderWidth(position: Int, width: Float) {
    BackgroundStyleApplicator.setBorderWidth(
        this,
        LogicalEdge.entries[position],
        PixelUtil.toDIPFromPixel(width),
    )
  }

  public open fun setBorderColor(position: Int, color: Int?) {
    BackgroundStyleApplicator.setBorderColor(this, LogicalEdge.entries[position], color)
  }

  public open fun setBorderRadius(borderRadius: Float) {
    setBorderRadius(borderRadius, BorderRadiusProp.BORDER_RADIUS.ordinal)
  }

  public open fun setBorderRadius(borderRadius: Float, position: Int) {
    val radius =
        if (borderRadius.isNaN()) null
        else LengthPercentage(PixelUtil.toDIPFromPixel(borderRadius), LengthPercentageType.POINT)
    BackgroundStyleApplicator.setBorderRadius(this, BorderRadiusProp.entries[position], radius)
  }

  public open fun setBorderStyle(style: String?) {
    BackgroundStyleApplicator.setBorderStyle(
        this,
        if (style == null) null else BorderStyle.fromString(style),
    )
  }

  /**
   * Calls `smoothScrollTo` and updates state.
   *
   * `smoothScrollTo` changes `contentOffset` and we need to keep `contentOffset` in sync between
   * scroll view and state. Calling raw `smoothScrollTo` doesn't update state.
   */
  override fun reactSmoothScrollTo(x: Int, y: Int) {
    ReactScrollViewHelper.smoothScrollTo(this, x, y)
    setPendingContentOffsets(x, y)
  }

  /**
   * Calls `super.scrollTo` and updates state.
   *
   * `super.scrollTo` changes `contentOffset` and we need to keep `contentOffset` in sync between
   * scroll view and state.
   *
   * Note that while we can override scrollTo, we *cannot* override `smoothScrollTo` because it is
   * final. See `reactSmoothScrollTo`.
   */
  override fun scrollTo(x: Int, y: Int) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "scrollTo[%d] x %d y %d", id, x, y)
    }

    super.scrollTo(x, y)
    ReactScrollViewHelper.updateFabricScrollState(this)
    setPendingContentOffsets(x, y)
  }

  /** Scrolls to a new position preserving any momentum scrolling animation. */
  override fun scrollToPreservingMomentum(x: Int, y: Int) {
    scrollTo(x, y)
    recreateFlingAnimation(x, Int.MAX_VALUE)
  }

  protected open fun restoreScrollTo(x: Int, y: Int) {
    scrollTo(x, y)
  }

  private fun isContentReady(): Boolean {
    val child = getContentView()
    return child != null && child.width != 0 && child.height != 0
  }

  private fun setPendingContentOffsets(x: Int, y: Int) {
    if (DEBUG_MODE) {
      FLog.i(TAG, "setPendingContentOffsets[%d] x %d y %d", id, x, y)
    }

    if (isContentReady()) {
      pendingContentOffsetX = UNSET_CONTENT_OFFSET
      pendingContentOffsetY = UNSET_CONTENT_OFFSET
    } else {
      pendingContentOffsetX = x
      pendingContentOffsetY = y
    }
  }

  override fun onLayoutChange(
      v: View,
      left: Int,
      top: Int,
      right: Int,
      bottom: Int,
      oldLeft: Int,
      oldTop: Int,
      oldRight: Int,
      oldBottom: Int,
  ) {
    if (contentView == null) return

    // Adjust the scroll position to follow new content. In RTL, this means we keep a constant
    // offset from the right edge instead of the left edge, so content added to the end of the flow
    // does not shift layout. If `maintainVisibleContentPosition` is enabled, we try to adjust
    // position so that the viewport keeps the same insets to previously visible views. TODO: MVCP
    // does not work in RTL.
    if (v.layoutDirection == LAYOUT_DIRECTION_RTL) {
      adjustPositionForContentChangeRTL(left, right, oldLeft, oldRight)
    }
    ReactScrollViewHelper.emitLayoutChangeEvent(this)
  }

  /**
   * If we are in the middle of a fling animation from the user removing their finger (OverScroller
   * is in `FLING_MODE`), recreate the existing fling animation since it was calculated against
   * outdated scroll offsets.
   */
  private fun recreateFlingAnimation(scrollX: Int, maxX: Int) {
    // If we have any pending custom flings (e.g. from animated `scrollTo`, or flinging to a snap
    // point), cancel them.
    // TODO: Can we be more graceful (like OverScroller flings)?
    if (getFlingAnimator().isRunning) {
      getFlingAnimator().cancel()
    }

    if (scroller != null && !scroller.isFinished) {
      // Calculate the velocity and position of the fling animation at the time of this layout
      // event, which may be later than the last ScrollView tick. These values are not committed to
      // the underlying ScrollView, which will recalculate positions on its next tick.
      val scrollerXBeforeTick = scroller.currX
      val hasMoreTicks = scroller.computeScrollOffset()

      // Stop the existing animation at the current state of the scroller. We will then recreate
      // it starting at the adjusted x offset.
      scroller.forceFinished(true)

      if (hasMoreTicks) {
        // OverScroller.getCurrVelocity() returns an absolute value of the velocity a current fling
        // animation (only FLING_MODE animations). We derive direction along the X axis from the
        // start and end of the animation, assuming HorizontalScrollView never fires vertical fling
        // animations.
        // TODO: This does not fully handle overscroll.
        val direction = (scroller.finalX - scroller.startX).toFloat().sign
        val flingVelocityX = scroller.currVelocity * direction

        scroller.fling(scrollX, scrollY, flingVelocityX.toInt(), 0, 0, maxX, 0, 0)
      } else {
        scrollTo(scrollX + (scroller.currX - scrollerXBeforeTick), scrollY)
      }
    }
  }

  private fun adjustPositionForContentChangeRTL(
      left: Int,
      right: Int,
      oldLeft: Int,
      oldRight: Int,
  ) {
    // If we have any pending custom flings (e.g. from animated `scrollTo`, or flinging to a snap
    // point), finish them, committing the final `scrollX`.
    // TODO: Can we be more graceful (like OverScroller flings)?
    if (getFlingAnimator().isRunning) {
      getFlingAnimator().end()
    }

    val distanceToRightEdge = oldRight - scrollX
    val newWidth = right - left
    val newScrollX = newWidth - distanceToRightEdge
    scrollTo(newScrollX, scrollY)

    recreateFlingAnimation(newScrollX, newWidth - width)
  }

  override fun startFlingAnimator(start: Int, end: Int) {
    // Always cancel existing animator before starting the new one. `smoothScrollTo` contains some
    // logic that, if called multiple times in a short amount of time, will treat all calls as part
    // of the same animation and will not lengthen the duration of the animation. This means that,
    // for example, if the user is scrolling rapidly, multiple pages could be considered part of one
    // animation, causing some page animations to be animated very rapidly - looking like they're
    // not animated at all.
    defaultFlingAnimator.cancel()

    // Update the fling animator with new values
    val duration = ReactScrollViewHelper.getDefaultScrollAnimationDuration(context)
    defaultFlingAnimator.setDuration(duration.toLong()).setIntValues(start, end)

    // Start the animator
    defaultFlingAnimator.start()

    if (sendMomentumEvents) {
      val xVelocity = if (duration > 0) (end - start) / duration else 0
      ReactScrollViewHelper.emitScrollMomentumBeginEvent(this, xVelocity, 0)
      ReactScrollViewHelper.dispatchMomentumEndOnAnimationEnd(this)
    }
  }

  override fun getFlingAnimator(): ValueAnimator = defaultFlingAnimator

  override fun getFlingExtrapolatedDistance(velocity: Int): Int =
      ReactScrollViewHelper.predictFinalScrollPosition(
              this,
              velocity,
              0,
              max(0, computeHorizontalScrollRange() - width),
              0,
          )
          .x
}
