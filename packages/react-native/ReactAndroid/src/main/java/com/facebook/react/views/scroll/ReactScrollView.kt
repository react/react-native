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
import android.graphics.Rect
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.OverScroller
import android.widget.ScrollView
import androidx.core.view.ViewCompat
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.ReactConstants
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
import kotlin.math.min
import kotlin.math.round
import kotlin.math.sign

/**
 * A simple subclass of ScrollView that doesn't dispatch measure and layout to its children and has
 * a scroll listener to send scroll events to JS.
 *
 * ReactScrollView only supports vertical scrolling. For horizontal scrolling, use
 * [ReactHorizontalScrollView].
 */
public open class ReactScrollView
@JvmOverloads
constructor(context: Context, private val fpsListener: FpsListener? = null) :
    ScrollView(context),
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
    private var scrollerField: java.lang.reflect.Field? = null
    private var triedToGetScrollerField = false

    private const val UNSET_CONTENT_OFFSET = -1
  }

  // Public / interface property overrides
  override var scrollEnabled: Boolean = true
  override var stateWrapper: StateWrapper? = null
  override var scrollEventThrottle: Int = 0
  override var lastScrollDispatchTime: Long = 0L
  override var hasChildPressedStateDelay: Boolean? = null

  public open var pointerEvents: PointerEvents = PointerEvents.AUTO

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
        setScrollAwayPaddingEnabledUnstable(
            value.scrollAwayPaddingTop,
            value.scrollAwayPaddingBottom,
            false,
        )
        val scrollPosition = value.lastStateUpdateScroll
        scrollTo(scrollPosition.x, scrollPosition.y)
      }
    }

  // Private state
  private val onScrollDispatchHelper = OnScrollDispatchHelper()
  private val scroller: OverScroller? = getOverScrollerFromParent()
  private val velocityHelper = VelocityHelper()
  private val tempRect = Rect()
  private val defaultFlingAnimator: ValueAnimator = ObjectAnimator.ofInt(this, "scrollY", 0, 0)

  private var _overflowInset = Rect()
  private var _virtualViewContainerState: VirtualViewContainerState? = null
  private var _removeClippedSubviews = false
  private var _reactScrollViewScrollState = ReactScrollViewScrollState()

  private var activelyScrolling = false
  private var clippingRect: Rect? = null
  private var _overflow: Overflow =
      if (ReactNativeFeatureFlags.enablePropsUpdateReconciliationAndroid()) {
        Overflow.VISIBLE
      } else {
        Overflow.SCROLL
      }
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
  private var contentView: View? = null
  private var currentContentOffset: ReadableMap? = null
  private var pendingContentOffsetX = UNSET_CONTENT_OFFSET
  private var pendingContentOffsetY = UNSET_CONTENT_OFFSET
  private var maintainVisibleContentPositionHelper:
      MaintainVisibleScrollPositionHelper<ReactScrollView>? =
      null
  private var emittedOverScrollSinceScrollBegin = false
  private var scrollsChildToFocus = true

  init {
    setOnHierarchyChangeListener(this)
    setScrollBarStyle(SCROLLBARS_OUTSIDE_OVERLAY)
    setClipChildren(false)
    ViewCompat.setAccessibilityDelegate(this, ReactScrollViewAccessibilityDelegate())
    initView()
  }

  /**
   * Set all default values here as opposed to in the constructor or field defaults. It is important
   * that these properties are set during the constructor, but also on-demand whenever an existing
   * ReactScrollView is recycled.
   */
  private fun initView() {
    _overflowInset = Rect()
    _virtualViewContainerState = null
    activelyScrolling = false
    clippingRect = null
    _overflow =
        if (ReactNativeFeatureFlags.enablePropsUpdateReconciliationAndroid()) {
          Overflow.VISIBLE
        } else {
          Overflow.SCROLL
        }
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
    contentView = null
    currentContentOffset = null
    pendingContentOffsetX = UNSET_CONTENT_OFFSET
    pendingContentOffsetY = UNSET_CONTENT_OFFSET
    stateWrapper = null
    _reactScrollViewScrollState = ReactScrollViewScrollState()
    pointerEvents = PointerEvents.AUTO
    lastScrollDispatchTime = 0
    scrollEventThrottle = 0
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

  protected open fun getOverScrollerFromParent(): OverScroller? {
    if (!triedToGetScrollerField) {
      triedToGetScrollerField = true
      try {
        scrollerField = ScrollView::class.java.getDeclaredField("mScroller")
        scrollerField?.isAccessible = true
      } catch (e: NoSuchFieldException) {
        FLog.w(
            ReactConstants.TAG,
            "Failed to get mScroller field for ScrollView! " +
                "This app will exhibit the bounce-back scrolling bug :(",
        )
      }
    }

    val cachedScrollerField = scrollerField ?: return null
    return try {
      val scrollerValue = cachedScrollerField.get(this)
      if (scrollerValue is OverScroller) {
        scrollerValue
      } else {
        FLog.w(
            ReactConstants.TAG,
            "Failed to cast mScroller field in ScrollView (probably due to OEM changes to AOSP)! " +
                "This app will exhibit the bounce-back scrolling bug :(",
        )
        null
      }
    } catch (e: IllegalAccessException) {
      throw RuntimeException("Failed to get mScroller from ScrollView!", e)
    }
  }

  public open fun setDisableIntervalMomentum(disableIntervalMomentum: Boolean) {
    this.disableIntervalMomentum = disableIntervalMomentum
  }

  public open fun setSendMomentumEvents(sendMomentumEvents: Boolean) {
    this.sendMomentumEvents = sendMomentumEvents
  }

  public open fun setScrollPerfTag(scrollPerfTag: String?) {
    this.scrollPerfTag = scrollPerfTag
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

  override fun getTopFadingEdgeStrength(): Float {
    val max = max(fadingEdgeLengthStart.toFloat(), fadingEdgeLengthEnd.toFloat())
    return fadingEdgeLengthStart / max
  }

  override fun getBottomFadingEdgeStrength(): Float {
    val max = max(fadingEdgeLengthStart.toFloat(), fadingEdgeLengthEnd.toFloat())
    return fadingEdgeLengthEnd / max
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
      maintainVisibleContentPositionHelper =
          MaintainVisibleScrollPositionHelper(this, false).also { it.start() }
    } else if (config == null && maintainVisibleContentPositionHelper != null) {
      maintainVisibleContentPositionHelper?.stop()
      maintainVisibleContentPositionHelper = null
    }
    maintainVisibleContentPositionHelper?.let { it.config = config }
  }

  override fun setOverflowInset(left: Int, top: Int, right: Int, bottom: Int) {
    _overflowInset.set(left, top, right, bottom)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec)
    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec),
        MeasureSpec.getSize(heightMeasureSpec),
    )
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
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

  override fun focusSearch(focused: View, direction: Int): View? {
    val nextFocus = super.focusSearch(focused, direction)

    if (ReactNativeFeatureFlags.enableCustomFocusSearchOnClippedElementsAndroid()) {
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

  /**
   * Since ReactScrollView handles layout changes on JS side, it does not call super.onLayout due to
   * which mIsLayoutDirty flag in ScrollView remains true and prevents scrolling to child when
   * requestChildFocus is called. Overriding this method and scrolling to child without checking any
   * layout dirty flag. This will fix focus navigation issue for KeyEvents which are not handled by
   * ScrollView, for example: KEYCODE_TAB.
   */
  override fun requestChildFocus(child: View, focused: View?) {
    if (focused != null && scrollsChildToFocus) {
      scrollToChild(focused)
    }
    requestChildFocusWithoutScroll(child, focused)
  }

  /**
   * In rare cases where an app overrides the built-in ReactScrollView by overriding it, and also
   * needs to customize scroll into view on focus behaviors, this protected method can be used to
   * unblocks such customization.
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

  private fun getScrollDelta(descendent: View): Int {
    descendent.getDrawingRect(tempRect)
    offsetDescendantRectToMyCoords(descendent, tempRect)
    return computeScrollDeltaToGetChildRectOnScreen(tempRect)
  }

  override fun isPartiallyScrolledInView(view: View): Boolean {
    val scrollDelta = getScrollDelta(view)
    view.getDrawingRect(tempRect)
    return scrollDelta != 0 && abs(scrollDelta) < tempRect.width()
  }

  private fun scrollToChild(child: View) {
    var parent: View? = child
    var scrollViewAncestor: View? = null
    while (parent != null && parent !== this) {
      if (parent is ReactScrollView) {
        scrollViewAncestor = parent
      }
      parent = parent.parent as? View
    }

    val scrollIntoViewTarget = scrollViewAncestor ?: child
    val tempRect = Rect()
    scrollIntoViewTarget.getDrawingRect(tempRect)
    offsetDescendantRectToMyCoords(scrollIntoViewTarget, tempRect)
    val scrollDelta = computeScrollDeltaToGetChildRectOnScreen(tempRect)
    if (scrollDelta != 0) {
      scrollBy(0, scrollDelta)
    }
  }

  override fun onScrollChanged(x: Int, y: Int, oldX: Int, oldY: Int) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactScrollView.onScrollChanged")
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
    if (!PointerEvents.canChildrenBeTouchTarget(pointerEvents)) return true

    try {
      if (super.onInterceptTouchEvent(ev)) {
        handleInterceptedTouchEvent(ev)
        return true
      }
    } catch (e: IllegalArgumentException) {
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

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    if (!scrollEnabled) return false
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
      handlePostTouchScrolling(Math.round(velocityX), Math.round(velocityY))
    }

    if (action == MotionEvent.ACTION_DOWN) {
      cancelPostTouchScrolling()
    }

    return try {
      super.onTouchEvent(ev)
    } catch (e: IllegalArgumentException) {
      FLog.w(ReactConstants.TAG, "Error handling touch event.", e)
      false
    }
  }

  override fun dispatchGenericMotionEvent(ev: MotionEvent): Boolean {
    if (!scrollEnabled) return false
    if (!PointerEvents.canChildrenBeTouchTarget(pointerEvents)) return false

    if (ev.actionMasked == MotionEvent.ACTION_SCROLL) {
      val vScroll = ev.getAxisValue(MotionEvent.AXIS_VSCROLL)
      if (vScroll != 0f) {
        enableFpsListener()
        val result = super.dispatchGenericMotionEvent(ev)
        if (
            result &&
                (pagingEnabled ||
                    snapInterval != 0 ||
                    snapOffsets != null ||
                    snapToAlignment != SNAP_ALIGNMENT_DISABLED)
        ) {
          if (postTouchRunnable != null) {
            removeCallbacks(postTouchRunnable)
            postTouchRunnable = null
          }
          postTouchRunnable = Runnable {
            postTouchRunnable = null
            var velocityY = (-vScroll.sign).toInt()
            if (disableIntervalMomentum) {
              velocityY = 0
            }
            flingAndSnap(velocityY)
            handlePostTouchScrolling(0, velocityY)
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
            (eventKeyCode == KeyEvent.KEYCODE_DPAD_UP || eventKeyCode == KeyEvent.KEYCODE_DPAD_DOWN)
    ) {
      return false
    }
    return super.executeKeyEvent(event)
  }

  override fun updateClippingRect() {
    updateClippingRect(null)
  }

  override fun updateClippingRect(excludedViews: Set<Int>?) {
    if (!_removeClippedSubviews) return

    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactScrollView.updateClippingRect")
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

  override fun fling(velocityY: Int) {
    val correctedVelocityY = correctFlingVelocityY(velocityY)

    if (pagingEnabled) {
      flingAndSnap(correctedVelocityY)
    } else if (scroller != null) {
      val scrollWindowHeight = height - paddingBottom - paddingTop
      scroller.fling(
          scrollX, // startX
          scrollY, // startY
          0, // velocityX
          correctedVelocityY, // velocityY
          0, // minX
          0, // maxX
          0, // minY
          Int.MAX_VALUE, // maxY
          0, // overX
          scrollWindowHeight / 2, // overY
      )
      postInvalidateOnAnimation()
    } else {
      super.fling(correctedVelocityY)
    }
    handlePostTouchScrolling(0, correctedVelocityY)
  }

  private fun correctFlingVelocityY(velocityY: Int): Int {
    if (Build.VERSION.SDK_INT != Build.VERSION_CODES.P) return velocityY
    var signum = onScrollDispatchHelper.yFlingVelocity.sign
    if (signum == 0f) {
      signum = velocityY.toFloat().sign
    }
    return (abs(velocityY) * signum).toInt()
  }

  private fun enableFpsListener() {
    if (isScrollPerfLoggingEnabled()) {
      val listener = checkNotNull(fpsListener)
      val perfTag = checkNotNull(scrollPerfTag)
      listener.enable(perfTag)
    }
  }

  private fun disableFpsListener() {
    if (isScrollPerfLoggingEnabled()) {
      val listener = checkNotNull(fpsListener)
      val perfTag = checkNotNull(scrollPerfTag)
      listener.disable(perfTag)
    }
  }

  private fun isScrollPerfLoggingEnabled(): Boolean {
    return fpsListener != null && !scrollPerfTag.isNullOrEmpty()
  }

  private fun getMaxScrollY(): Int {
    val contentHeight = contentView?.height ?: 0
    val viewportHeight = height - paddingBottom - paddingTop
    return max(0, contentHeight - viewportHeight)
  }

  override fun draw(canvas: Canvas) {
    if (endFillColor != Color.TRANSPARENT) {
      val cv = getContentView()
      val bg = endBackground
      if (bg != null && cv != null && cv.bottom < height) {
        bg.setBounds(0, cv.bottom, width, height)
        bg.draw(canvas)
      }
    }
    super.draw(canvas)
  }

  public override fun onDraw(canvas: Canvas) {
    if (_overflow != Overflow.VISIBLE) {
      BackgroundStyleApplicator.clipToPaddingBox(this, canvas)
    }
    super.onDraw(canvas)
  }

  /**
   * This handles any sort of scrolling that may occur after a touch is finished. This may be
   * momentum scrolling (fling) or because you have pagingEnabled on the scroll view. Because we
   * don't get any events from Android about this lifecycle, we do all our detection by creating a
   * runnable that checks if we scrolled in the last frame and if so assumes we are still scrolling.
   */
  private fun handlePostTouchScrolling(velocityX: Int, velocityY: Int) {
    if (postTouchRunnable != null) return

    if (sendMomentumEvents) {
      enableFpsListener()
      ReactScrollViewHelper.emitScrollMomentumBeginEvent(this, velocityX, velocityY)
    }

    activelyScrolling = false
    postTouchRunnable =
        object : Runnable {
          private var snappingToPage = false
          private var stableFrames = 0

          override fun run() {
            if (activelyScrolling) {
              activelyScrolling = false
              stableFrames = 0
              this@ReactScrollView.postOnAnimationDelayed(
                  this,
                  ReactScrollViewHelper.MOMENTUM_DELAY,
              )
            } else {
              ReactScrollViewHelper.updateFabricScrollState(this@ReactScrollView)
              stableFrames++

              if (stableFrames >= 3) {
                postTouchRunnable = null
                if (sendMomentumEvents) {
                  ReactScrollViewHelper.emitScrollMomentumEndEvent(this@ReactScrollView)
                }
                // Kotlin name is notifyUserDrivenScrollEnded; the _internal suffix is
                // only a @JvmName alias for Java callers.
                ReactScrollViewHelper.notifyUserDrivenScrollEnded(this@ReactScrollView)
                disableFpsListener()
              } else {
                if (pagingEnabled && !snappingToPage) {
                  snappingToPage = true
                  flingAndSnap(0)
                }
                this@ReactScrollView.postOnAnimationDelayed(
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

  // Predict where a fling would end up so we can scroll to the nearest snap offset.
  // TODO(T106335409): Existing prediction still uses overscroller. Consider changing this to
  // use fling animator instead.
  private fun predictFinalScrollPosition(velocityY: Int): Int {
    return if (getFlingAnimator() === defaultFlingAnimator) {
      ReactScrollViewHelper.predictFinalScrollPosition(this, 0, velocityY, 0, getMaxScrollY()).y
    } else {
      ReactScrollViewHelper.getNextFlingStartValue(
          this,
          scrollY,
          reactScrollViewScrollState.finalAnimatedPositionScroll.y,
          velocityY,
      ) + getFlingExtrapolatedDistance(velocityY)
    }
  }

  private fun getContentView(): View? = getChildAt(0)

  /**
   * This will smooth scroll us to the nearest snap offset point. It currently just looks at where
   * the content is and slides to the nearest point. It is intended to be run after we are done
   * scrolling, and handling any momentum scrolling.
   */
  private fun smoothScrollAndSnap(velocity: Int) {
    val interval = getSnapInterval().toDouble()
    val currentOffset =
        ReactScrollViewHelper.getNextFlingStartValue(
                this,
                scrollY,
                reactScrollViewScrollState.finalAnimatedPositionScroll.y,
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
      reactSmoothScrollTo(scrollX, finalTargetOffset.toInt())
    }
  }

  private fun flingAndSnap(velocityY: Int) {
    if (childCount <= 0) return

    if (snapInterval == 0 && snapOffsets == null && snapToAlignment == SNAP_ALIGNMENT_DISABLED) {
      smoothScrollAndSnap(velocityY)
      return
    }

    @Suppress("NAME_SHADOWING") var velocityY = velocityY
    val hasCustomizedFlingAnimator = getFlingAnimator() !== defaultFlingAnimator
    val maximumOffset = getMaxScrollY()
    var targetOffset = predictFinalScrollPosition(velocityY)
    if (disableIntervalMomentum) {
      targetOffset = scrollY
    }

    var smallerOffset = 0
    var largerOffset = maximumOffset
    var firstOffset = 0
    var lastOffset = maximumOffset
    val viewportHeight = height - paddingBottom - paddingTop

    val currentSnapOffsets = snapOffsets
    if (currentSnapOffsets != null) {
      firstOffset = currentSnapOffsets[0]
      lastOffset = currentSnapOffsets[currentSnapOffsets.size - 1]

      for (i in currentSnapOffsets.indices) {
        val offset = currentSnapOffsets[i]
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
                    viewportHeight,
                ),
                0,
            )
        largerOffset =
            min(
                getItemStartOffset(
                    snapToAlignment,
                    (ceil(ratio) * snapInterval).toInt(),
                    snapInterval,
                    viewportHeight,
                ),
                maximumOffset,
            )
      } else {
        val cv = getContentView() as ViewGroup
        var smallerChildOffset = largerOffset
        var largerChildOffset = smallerOffset
        for (i in 0 until cv.childCount) {
          val item = cv.getChildAt(i)
          val itemStartOffset =
              when (snapToAlignment) {
                SNAP_ALIGNMENT_CENTER -> item.top - (viewportHeight - item.height) / 2
                SNAP_ALIGNMENT_START -> item.top
                SNAP_ALIGNMENT_END -> item.top - (viewportHeight - item.height)
                else ->
                    throw IllegalStateException("Invalid SnapToAlignment value: $snapToAlignment")
              }
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
          smallerChildOffset = min(smallerChildOffset, itemStartOffset)
          largerChildOffset = max(largerChildOffset, itemStartOffset)
        }
        smallerOffset = max(smallerOffset, smallerChildOffset)
        largerOffset = min(largerOffset, largerChildOffset)
      }
    } else {
      val interval = getSnapInterval().toDouble()
      val ratio = targetOffset.toDouble() / interval
      smallerOffset = (floor(ratio) * interval).toInt()
      largerOffset = min((ceil(ratio) * interval).toInt(), maximumOffset)
    }

    val nearestOffset =
        if (abs(targetOffset - smallerOffset) < abs(largerOffset - targetOffset)) smallerOffset
        else largerOffset

    if (!snapToEnd && targetOffset >= lastOffset) {
      if (scrollY >= lastOffset) {
        // free scrolling
      } else {
        targetOffset = lastOffset
      }
    } else if (!snapToStart && targetOffset <= firstOffset) {
      if (scrollY <= firstOffset) {
        // free scrolling
      } else {
        targetOffset = firstOffset
      }
    } else if (velocityY > 0) {
      if (!hasCustomizedFlingAnimator) {
        velocityY += ((largerOffset - targetOffset) * 10.0).toInt()
      }
      targetOffset = largerOffset
    } else if (velocityY < 0) {
      if (!hasCustomizedFlingAnimator) {
        velocityY -= ((targetOffset - smallerOffset) * 10.0).toInt()
      }
      targetOffset = smallerOffset
    } else {
      targetOffset = nearestOffset
    }

    targetOffset = min(max(0, targetOffset), maximumOffset)

    if (hasCustomizedFlingAnimator || scroller == null) {
      reactSmoothScrollTo(scrollX, targetOffset)
    } else {
      activelyScrolling = true
      scroller.fling(
          scrollX, // startX
          scrollY, // startY
          0, // velocityX
          if (velocityY != 0) velocityY else targetOffset - scrollY, // velocityY
          0, // minX
          0, // maxX
          targetOffset, // minY
          targetOffset, // maxY
          0, // overX
          if (targetOffset == 0 || targetOffset == maximumOffset) viewportHeight / 2
          else 0, // overY
      )
      postInvalidateOnAnimation()
    }
  }

  private fun getItemStartOffset(
      snapToAlignment: Int,
      itemStartPosition: Int,
      itemHeight: Int,
      viewPortHeight: Int,
  ): Int =
      when (snapToAlignment) {
        SNAP_ALIGNMENT_CENTER -> itemStartPosition - (viewPortHeight - itemHeight) / 2
        SNAP_ALIGNMENT_START -> itemStartPosition
        SNAP_ALIGNMENT_END -> itemStartPosition - (viewPortHeight - itemHeight)
        else -> throw IllegalStateException("Invalid SnapToAlignment value: $snapToAlignment")
      }

  private fun getSnapInterval(): Int = if (snapInterval != 0) snapInterval else height

  public open fun setEndFillColor(color: Int) {
    if (color != endFillColor) {
      endFillColor = color
      endBackground = ColorDrawable(endFillColor)
    }
  }

  override fun onOverScrolled(scrollX: Int, scrollY: Int, clampedX: Boolean, clampedY: Boolean) {
    @Suppress("NAME_SHADOWING") var scrollY = scrollY
    if (scroller != null && contentView != null) {
      if (!scroller.isFinished && scroller.currY != scroller.finalY) {
        val scrollRange = getMaxScrollY()
        if (scrollY >= scrollRange) {
          scroller.abortAnimation()
          scrollY = scrollRange
        }
      }
    }

    if (
        ReactNativeFeatureFlags.shouldTriggerResponderTransferOnScrollAndroid() &&
            clampedY &&
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

  public open fun setContentOffset(value: ReadableMap?) {
    if (currentContentOffset == null || currentContentOffset != value) {
      currentContentOffset = value
      if (value != null) {
        val x = if (value.hasKey("x")) value.getDouble("x") else 0.0
        val y = if (value.hasKey("y")) value.getDouble("y") else 0.0
        scrollTo(PixelUtil.toPixelFromDIP(x).toInt(), PixelUtil.toPixelFromDIP(y).toInt())
      } else {
        scrollTo(0, 0)
      }
    }
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
    super.scrollTo(x, y)
    ReactScrollViewHelper.updateFabricScrollState(this)
    setPendingContentOffsets(x, y)
  }

  /**
   * If we are in the middle of a fling animation from the user removing their finger (OverScroller
   * is in `FLING_MODE`), recreate the existing fling animation since it was calculated against
   * outdated scroll offsets.
   */
  private fun recreateFlingAnimation(scrollY: Int) {
    if (getFlingAnimator().isRunning) {
      getFlingAnimator().cancel()
    }

    if (scroller != null && !scroller.isFinished) {
      val scrollerYBeforeTick = scroller.currY
      val hasMoreTicks = scroller.computeScrollOffset()
      scroller.forceFinished(true)

      if (hasMoreTicks) {
        val direction = (scroller.finalY - scroller.startY).toFloat().sign
        val flingVelocityY = scroller.currVelocity * direction
        scroller.fling(scrollX, scrollY, 0, flingVelocityY.toInt(), 0, 0, 0, Int.MAX_VALUE)
      } else {
        scrollTo(scrollX, scrollY + (scroller.currY - scrollerYBeforeTick))
      }
    }
  }

  override fun scrollToPreservingMomentum(x: Int, y: Int) {
    scrollTo(x, y)
    recreateFlingAnimation(y)
  }

  private fun isContentReady(): Boolean {
    val child = getContentView()
    return child != null && child.width != 0 && child.height != 0
  }

  private fun setPendingContentOffsets(x: Int, y: Int) {
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

    if (isShown && isContentReady()) {
      val currentScrollY = scrollY
      val maxScrollY = getMaxScrollY()
      if (currentScrollY > maxScrollY) {
        scrollTo(scrollX, maxScrollY)
      }
    }

    ReactScrollViewHelper.emitLayoutChangeEvent(this)
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
   * ScrollAway: This enables a natively-controlled navbar that optionally obscures the top content
   * of the ScrollView. Whether or not the navbar is obscuring the React Native surface is
   * determined outside of React Native.
   *
   * Note: all ScrollViews and HorizontalScrollViews in React have exactly one child: the "content"
   * View (see ScrollView.js). That View is non-collapsable so it will never be View-flattened away.
   * However, it is possible to pass custom styles into that View.
   *
   * If you are using this feature it is assumed that you have full control over this ScrollView and
   * that you are **not** overriding the ScrollView content view to pass in a `translateY` style.
   * `translateY` must never be set from ReactJS while using this feature!
   */
  public open fun setScrollAwayPaddingEnabledUnstable(topPadding: Int, bottomPadding: Int) {
    setScrollAwayPaddingEnabledUnstable(topPadding, bottomPadding, true)
  }

  public open fun setScrollAwayPaddingEnabledUnstable(
      topPadding: Int,
      bottomPadding: Int,
      updateState: Boolean,
  ) {
    val count = childCount
    check(count <= 1) {
      "React Native ScrollView should not have more than one child, it should have exactly 1" +
          " child; a content View"
    }

    if (count > 0) {
      for (i in 0 until count) {
        val childView = getChildAt(i)
        childView.translationY = topPadding.toFloat()
      }
      setPadding(0, 0, 0, topPadding + bottomPadding)
    }

    if (updateState) {
      updateScrollAwayState(topPadding, bottomPadding)
    }
    removeClippedSubviews = _removeClippedSubviews
  }

  private fun updateScrollAwayState(scrollAwayPaddingTop: Int, scrollAwayPaddingBottom: Int) {
    _reactScrollViewScrollState.scrollAwayPaddingTop = scrollAwayPaddingTop
    _reactScrollViewScrollState.scrollAwayPaddingBottom = scrollAwayPaddingBottom
    ReactScrollViewHelper.forceUpdateState(this)
  }

  override fun startFlingAnimator(start: Int, end: Int) {
    defaultFlingAnimator.cancel()
    val duration = ReactScrollViewHelper.getDefaultScrollAnimationDuration(context)
    defaultFlingAnimator.setDuration(duration.toLong()).setIntValues(start, end)
    defaultFlingAnimator.start()

    if (sendMomentumEvents) {
      val yVelocity = if (duration > 0) (end - start) / duration else 0
      ReactScrollViewHelper.emitScrollMomentumBeginEvent(this, 0, yVelocity)
      ReactScrollViewHelper.dispatchMomentumEndOnAnimationEnd(this)
    }
  }

  override fun getFlingAnimator(): ValueAnimator = defaultFlingAnimator

  override fun getFlingExtrapolatedDistance(velocity: Int): Int =
      ReactScrollViewHelper.predictFinalScrollPosition(this, 0, velocity, 0, getMaxScrollY()).y
}
