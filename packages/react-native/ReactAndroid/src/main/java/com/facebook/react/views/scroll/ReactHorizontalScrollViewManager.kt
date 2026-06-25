/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.graphics.Color
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.RetryableMountingLayerException
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderRadius
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderStyle
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderWidth
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.getDisplayMetricDensity
import com.facebook.react.uimanager.PixelUtil.toPixelFromDIP
import com.facebook.react.uimanager.PointerEvents.Companion.parsePointerEvents
import com.facebook.react.uimanager.ReactClippingViewGroupHelper
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle.Companion.fromString
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.views.scroll.MaintainVisibleScrollPositionHelper.Config.Companion.fromReadableMap
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper.Companion.receiveCommand
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper.ScrollCommandHandler
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper.ScrollToCommandData
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper.ScrollToEndCommandData
import com.facebook.react.views.scroll.ReactScrollViewHelper.parseOverScrollMode
import com.facebook.react.views.scroll.ReactScrollViewHelper.parseSnapToAlignment

/**
 * View manager for [ReactHorizontalScrollView] components.
 *
 * Note that [ReactScrollView] and [ReactHorizontalScrollView] are exposed to JS as a single
 * ScrollView component, configured via the `horizontal` boolean property.
 */
@ReactModule(name = ReactHorizontalScrollViewManager.REACT_CLASS)
public open class ReactHorizontalScrollViewManager
@JvmOverloads
constructor(private val fpsListener: FpsListener? = null) :
    ViewGroupManager<ReactHorizontalScrollView>(), ScrollCommandHandler<ReactHorizontalScrollView> {
  init {
    if (ReactNativeFeatureFlags.enableViewRecyclingForScrollView()) {
      setupViewRecycling()
    }
  }

  override fun prepareToRecycleView(
      reactContext: ThemedReactContext,
      view: ReactHorizontalScrollView,
  ): ReactHorizontalScrollView? {
    // BaseViewManager
    val preparedView = super.prepareToRecycleView(reactContext, view)
    if (preparedView != null) {
      preparedView.recycleView()
    }
    return preparedView
  }

  override fun getName(): String = REACT_CLASS

  public override fun createViewInstance(context: ThemedReactContext): ReactHorizontalScrollView =
      ReactHorizontalScrollView(context, fpsListener)

  override fun updateState(
      view: ReactHorizontalScrollView,
      props: ReactStylesDiffMap,
      stateWrapper: StateWrapper,
  ): Any? {
    view.stateWrapper = stateWrapper
    if (
        ReactNativeFeatureFlags.enableViewCulling() ||
            ReactNativeFeatureFlags.useTraitHiddenOnAndroid()
    ) {
      ReactScrollViewHelper.loadFabricScrollState(view, stateWrapper)
    }
    return null
  }

  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  public fun setScrollEnabled(view: ReactHorizontalScrollView, value: Boolean) {
    view.scrollEnabled = value
  }

  @ReactProp(name = "showsHorizontalScrollIndicator", defaultBoolean = true)
  public fun setShowsHorizontalScrollIndicator(view: ReactHorizontalScrollView, value: Boolean) {
    view.isHorizontalScrollBarEnabled = value
  }

  @ReactProp(name = "decelerationRate")
  public fun setDecelerationRate(view: ReactHorizontalScrollView, decelerationRate: Float) {
    view.setDecelerationRate(decelerationRate)
  }

  @ReactProp(name = "disableIntervalMomentum")
  public fun setDisableIntervalMomentum(
      view: ReactHorizontalScrollView,
      disableIntervalMomentum: Boolean,
  ) {
    view.setDisableIntervalMomentum(disableIntervalMomentum)
  }

  @ReactProp(name = "scrollsChildToFocus", defaultBoolean = true)
  public fun setScrollsChildToFocus(view: ReactHorizontalScrollView, scrollsChildToFocus: Boolean) {
    view.setScrollsChildToFocus(scrollsChildToFocus)
  }

  @ReactProp(name = "snapToInterval")
  public fun setSnapToInterval(view: ReactHorizontalScrollView, snapToInterval: Float) {
    // snapToInterval needs to be exposed as a float because of the Javascript interface.
    val density = getDisplayMetricDensity()
    view.setSnapInterval((snapToInterval * density).toInt())
  }

  @ReactProp(name = "snapToAlignment")
  public fun setSnapToAlignment(view: ReactHorizontalScrollView, alignment: String?) {
    view.setSnapToAlignment(parseSnapToAlignment(alignment))
  }

  @ReactProp(name = "snapToOffsets")
  public fun setSnapToOffsets(view: ReactHorizontalScrollView, snapToOffsets: ReadableArray?) {
    if (snapToOffsets == null || snapToOffsets.size() == 0) {
      view.setSnapOffsets(null)
      return
    }

    val density = getDisplayMetricDensity()
    val offsets: MutableList<Int> = ArrayList()
    for (i in 0 until snapToOffsets.size()) {
      offsets.add((snapToOffsets.getDouble(i) * density).toInt())
    }
    view.setSnapOffsets(offsets)
  }

  @ReactProp(name = "snapToStart")
  public fun setSnapToStart(view: ReactHorizontalScrollView, snapToStart: Boolean) {
    view.setSnapToStart(snapToStart)
  }

  @ReactProp(name = "snapToEnd")
  public fun setSnapToEnd(view: ReactHorizontalScrollView, snapToEnd: Boolean) {
    view.setSnapToEnd(snapToEnd)
  }

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public fun setRemoveClippedSubviews(
      view: ReactHorizontalScrollView,
      removeClippedSubviews: Boolean,
  ) {
    view.removeClippedSubviews = removeClippedSubviews
  }

  /**
   * Computing momentum events is potentially expensive since we post a runnable on the UI thread to
   * see when it is done. We only do that if {@param sendMomentumEvents} is set to true. This is
   * handled automatically in js by checking if there is a listener on the momentum events.
   *
   * @param view
   * @param sendMomentumEvents
   */
  @ReactProp(name = "sendMomentumEvents")
  public fun setSendMomentumEvents(view: ReactHorizontalScrollView, sendMomentumEvents: Boolean) {
    view.setSendMomentumEvents(sendMomentumEvents)
  }

  /**
   * Tag used for logging scroll performance on this scroll view. Will force momentum events to be
   * turned on (see setSendMomentumEvents).
   *
   * @param view
   * @param scrollPerfTag
   */
  @ReactProp(name = "scrollPerfTag")
  public fun setScrollPerfTag(view: ReactHorizontalScrollView, scrollPerfTag: String?) {
    view.setScrollPerfTag(scrollPerfTag)
  }

  @ReactProp(name = "pagingEnabled")
  public fun setPagingEnabled(view: ReactHorizontalScrollView, pagingEnabled: Boolean) {
    view.setPagingEnabled(pagingEnabled)
  }

  /** Controls overScroll behaviour */
  @ReactProp(name = "overScrollMode")
  public open fun setOverScrollMode(view: ReactHorizontalScrollView, value: String?) {
    view.overScrollMode = parseOverScrollMode(value)
  }

  @ReactProp(name = "nestedScrollEnabled")
  public fun setNestedScrollEnabled(view: ReactHorizontalScrollView?, value: Boolean) {
    if (view != null) {
      ViewCompat.setNestedScrollingEnabled(view, value)
    }
  }

  @Deprecated(
      "Use receiveCommand with String commandId instead",
      ReplaceWith("receiveCommand(scrollView, commandId, args)"),
  )
  override fun receiveCommand(
      scrollView: ReactHorizontalScrollView,
      commandId: Int,
      args: ReadableArray?,
  ) {
    receiveCommand<ReactHorizontalScrollView>(this, scrollView, commandId, args)
  }

  override fun receiveCommand(
      scrollView: ReactHorizontalScrollView,
      commandId: String,
      args: ReadableArray?,
  ) {
    receiveCommand<ReactHorizontalScrollView>(this, scrollView, commandId, args)
  }

  override fun flashScrollIndicators(scrollView: ReactHorizontalScrollView) {
    scrollView.flashScrollIndicators()
  }

  override fun scrollTo(scrollView: ReactHorizontalScrollView, data: ScrollToCommandData) {
    scrollView.abortAnimation()
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(data.mDestX, data.mDestY)
    } else {
      scrollView.scrollTo(data.mDestX, data.mDestY)
    }
  }

  override fun scrollToEnd(scrollView: ReactHorizontalScrollView, data: ScrollToEndCommandData) {
    // ScrollView always has one child - the scrollable area. However, it's possible today that we
    // execute this method as view command before the child view is mounted. Here we will retry the
    // view commands as a workaround.
    val child =
        scrollView.getChildAt(0)
            ?: throw RetryableMountingLayerException(
                "scrollToEnd called on HorizontalScrollView without child"
            )
    val right = child.width + scrollView.paddingRight
    scrollView.abortAnimation()
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(right, scrollView.scrollY)
    } else {
      scrollView.scrollTo(right, scrollView.scrollY)
    }
  }

  /**
   * When set, fills the rest of the scrollview with a color to avoid setting a background and
   * creating unnecessary overdraw.
   *
   * @param view
   * @param color
   */
  @ReactProp(name = "endFillColor", defaultInt = Color.TRANSPARENT, customType = "Color")
  public fun setBottomFillColor(view: ReactHorizontalScrollView, color: Int) {
    view.setEndFillColor(color)
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_RADIUS,
              ViewProps.BORDER_TOP_LEFT_RADIUS,
              ViewProps.BORDER_TOP_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
          ],
      defaultFloat = Float.NaN,
  )
  public fun setBorderRadius(view: ReactHorizontalScrollView?, index: Int, borderRadius: Float) {
    if (view != null) {
      val radius =
          if (borderRadius.isNaN()) null
          else LengthPercentage(borderRadius, LengthPercentageType.POINT)
      setBorderRadius(view, BorderRadiusProp.entries[index], radius)
    }
  }

  @ReactProp(name = "borderStyle")
  public fun setBorderStyle(view: ReactHorizontalScrollView?, borderStyle: String?) {
    if (view != null) {
      val parsedBorderStyle = if (borderStyle == null) null else fromString(borderStyle)
      setBorderStyle(view, parsedBorderStyle)
    }
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_WIDTH,
              ViewProps.BORDER_LEFT_WIDTH,
              ViewProps.BORDER_RIGHT_WIDTH,
              ViewProps.BORDER_TOP_WIDTH,
              ViewProps.BORDER_BOTTOM_WIDTH,
          ],
      defaultFloat = Float.NaN,
  )
  public fun setBorderWidth(view: ReactHorizontalScrollView?, index: Int, width: Float) {
    if (view != null) {
      setBorderWidth(view, LogicalEdge.entries[index], width)
    }
  }

  @ReactPropGroup(
      names =
          [
              "borderColor",
              "borderLeftColor",
              "borderRightColor",
              "borderTopColor",
              "borderBottomColor",
          ],
      customType = "Color",
  )
  public fun setBorderColor(
      view: ReactHorizontalScrollView,
      @Suppress("UNUSED_PARAMETER") index: Int,
      color: Int?,
  ) {
    setBorderColor(view, LogicalEdge.ALL, color)
  }

  @ReactProp(name = "overflow")
  public fun setOverflow(view: ReactHorizontalScrollView, overflow: String?) {
    view.setOverflow(overflow)
  }

  @ReactProp(name = "persistentScrollbar")
  public fun setPersistentScrollbar(view: ReactHorizontalScrollView, value: Boolean) {
    view.isScrollbarFadingEnabled = !value
  }

  @ReactProp(name = "fadingEdgeLength")
  public fun setFadingEdgeLength(view: ReactHorizontalScrollView, value: Dynamic) {
    when (value.type) {
      ReadableType.Number -> {
        view.fadingEdgeLengthStart = value.asInt()
        view.fadingEdgeLengthEnd = value.asInt()
      }
      ReadableType.Map -> {
        value.asMap()?.let { map ->
          var start = 0
          var end = 0
          if (map.hasKey("start") && map.getInt("start") > 0) {
            start = map.getInt("start")
          }
          if (map.hasKey("end") && map.getInt("end") > 0) {
            end = map.getInt("end")
          }
          view.fadingEdgeLengthStart = start
          view.fadingEdgeLengthEnd = end
        }
      }
      else -> {
        // no-op
      }
    }
    if (view.fadingEdgeLengthStart > 0 || view.fadingEdgeLengthEnd > 0) {
      view.isHorizontalFadingEdgeEnabled = true
      view.setFadingEdgeLength(
          Math.round(Math.max(view.fadingEdgeLengthStart, view.fadingEdgeLengthEnd).dpToPx())
      )
    } else {
      view.isHorizontalFadingEdgeEnabled = false
      view.setFadingEdgeLength(0)
    }
  }

  @ReactProp(name = "contentOffset")
  public fun setContentOffset(view: ReactHorizontalScrollView, value: ReadableMap?) {
    if (value != null) {
      val x = if (value.hasKey("x")) value.getDouble("x") else 0.0
      val y = if (value.hasKey("y")) value.getDouble("y") else 0.0
      view.scrollTo(toPixelFromDIP(x).toInt(), toPixelFromDIP(y).toInt())
    } else {
      view.scrollTo(0, 0)
    }
  }

  @ReactProp(name = "maintainVisibleContentPosition")
  public fun setMaintainVisibleContentPosition(
      view: ReactHorizontalScrollView,
      value: ReadableMap?,
  ) {
    if (value != null) {
      view.setMaintainVisibleContentPosition(fromReadableMap(value))
    } else {
      view.setMaintainVisibleContentPosition(null)
    }
  }

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public fun setPointerEvents(view: ReactHorizontalScrollView, pointerEventsStr: String?) {
    view.pointerEvents = parsePointerEvents(pointerEventsStr)
  }

  @ReactProp(name = "scrollEventThrottle")
  public fun setScrollEventThrottle(view: ReactHorizontalScrollView, scrollEventThrottle: Int) {
    view.scrollEventThrottle = scrollEventThrottle
  }

  @ReactProp(name = "horizontal")
  public fun setHorizontal(
      @Suppress("UNUSED_PARAMETER") view: ReactHorizontalScrollView?,
      @Suppress("UNUSED_PARAMETER") horizontal: Boolean,
  ) {
    // Do Nothing: Align with static ViewConfigs
  }

  public companion object {
    public const val REACT_CLASS: String = "AndroidHorizontalScrollView"
  }
}
