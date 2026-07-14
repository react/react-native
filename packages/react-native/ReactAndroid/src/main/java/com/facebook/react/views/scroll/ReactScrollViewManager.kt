/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.graphics.Color
import android.view.View
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
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper.Companion.receiveCommand
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper.ScrollCommandHandler
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper.ScrollToCommandData
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper.ScrollToEndCommandData
import com.facebook.react.views.scroll.ReactScrollViewHelper.parseOverScrollMode
import com.facebook.react.views.scroll.ReactScrollViewHelper.parseSnapToAlignment
import com.facebook.react.views.scroll.ScrollEventType.Companion.getJSEventName

/**
 * View manager for [ReactScrollView] components.
 *
 * Note that [ReactScrollView] and [ReactHorizontalScrollView] are exposed to JS as a single
 * ScrollView component, configured via the `horizontal` boolean property.
 */
@ReactModule(name = ReactScrollViewManager.REACT_CLASS)
public open class ReactScrollViewManager
@JvmOverloads
constructor(private val fpsListener: FpsListener? = null) :
    ViewGroupManager<ReactScrollView>(), ScrollCommandHandler<ReactScrollView> {

  init {
    if (ReactNativeFeatureFlags.enableViewRecyclingForScrollView()) {
      setupViewRecycling()
    }
  }

  override fun prepareToRecycleView(
      reactContext: ThemedReactContext,
      view: ReactScrollView,
  ): ReactScrollView? {
    // BaseViewManager
    val preparedView = super.prepareToRecycleView(reactContext, view)
    if (preparedView != null) {
      preparedView.recycleView()
    }
    return preparedView
  }

  override fun getName(): String = REACT_CLASS

  public override fun createViewInstance(context: ThemedReactContext): ReactScrollView =
      ReactScrollView(context, fpsListener)

  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  public fun setScrollEnabled(view: ReactScrollView, value: Boolean) {
    view.scrollEnabled = value

    // Set focusable to match whether scroll is enabled. This improves keyboarding
    // experience by not making scrollview a tab stop when you cannot interact with it.
    view.isFocusable = value
  }

  @ReactProp(name = "showsVerticalScrollIndicator", defaultBoolean = true)
  public fun setShowsVerticalScrollIndicator(view: ReactScrollView, value: Boolean) {
    view.isVerticalScrollBarEnabled = value
  }

  @ReactProp(name = "decelerationRate")
  public fun setDecelerationRate(view: ReactScrollView, decelerationRate: Float) {
    view.setDecelerationRate(decelerationRate)
  }

  @ReactProp(name = "disableIntervalMomentum")
  public fun setDisableIntervalMomentum(view: ReactScrollView, disableIntervalMomentum: Boolean) {
    view.setDisableIntervalMomentum(disableIntervalMomentum)
  }

  @ReactProp(name = "scrollsChildToFocus", defaultBoolean = true)
  public fun setScrollsChildToFocus(view: ReactScrollView, scrollsChildToFocus: Boolean) {
    view.setScrollsChildToFocus(scrollsChildToFocus)
  }

  @ReactProp(name = "snapToInterval")
  public fun setSnapToInterval(view: ReactScrollView, snapToInterval: Float) {
    // snapToInterval needs to be exposed as a float because of the Javascript interface.
    val density = getDisplayMetricDensity()
    view.setSnapInterval((snapToInterval * density).toInt())
  }

  @ReactProp(name = "snapToOffsets")
  public fun setSnapToOffsets(view: ReactScrollView, snapToOffsets: ReadableArray?) {
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

  @ReactProp(name = "snapToAlignment")
  public fun setSnapToAlignment(view: ReactScrollView, alignment: String?) {
    view.setSnapToAlignment(parseSnapToAlignment(alignment))
  }

  @ReactProp(name = "snapToStart")
  public fun setSnapToStart(view: ReactScrollView, snapToStart: Boolean) {
    view.setSnapToStart(snapToStart)
  }

  @ReactProp(name = "snapToEnd")
  public fun setSnapToEnd(view: ReactScrollView, snapToEnd: Boolean) {
    view.setSnapToEnd(snapToEnd)
  }

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public fun setRemoveClippedSubviews(view: ReactScrollView, removeClippedSubviews: Boolean) {
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
  public fun setSendMomentumEvents(view: ReactScrollView, sendMomentumEvents: Boolean) {
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
  public fun setScrollPerfTag(view: ReactScrollView, scrollPerfTag: String?) {
    view.setScrollPerfTag(scrollPerfTag)
  }

  @ReactProp(name = "pagingEnabled")
  public fun setPagingEnabled(view: ReactScrollView, pagingEnabled: Boolean) {
    view.setPagingEnabled(pagingEnabled)
  }

  /**
   * When set, fills the rest of the scrollview with a color to avoid setting a background and
   * creating unnecessary overdraw.
   *
   * @param view
   * @param color
   */
  @ReactProp(name = "endFillColor", defaultInt = Color.TRANSPARENT, customType = "Color")
  public fun setBottomFillColor(view: ReactScrollView, color: Int) {
    view.setEndFillColor(color)
  }

  /** Controls overScroll behaviour */
  @ReactProp(name = "overScrollMode")
  public open fun setOverScrollMode(view: ReactScrollView, value: String?) {
    view.overScrollMode = parseOverScrollMode(value)
  }

  @ReactProp(name = "nestedScrollEnabled")
  public fun setNestedScrollEnabled(view: ReactScrollView?, value: Boolean) {
    if (view != null) {
      ViewCompat.setNestedScrollingEnabled(view, value)
    }
  }

  override fun getCommandsMap(): Map<String, Int>? = ReactScrollViewCommandHelper.getCommandsMap()

  @Deprecated(
      message =
          "ReceiveCommand with an int commandId param is deprecated. Use the overload where commandId is a string.",
      ReplaceWith("receiveCommand(scrollView, commandId, args)"),
  )
  override fun receiveCommand(scrollView: ReactScrollView, commandId: Int, args: ReadableArray?) {
    receiveCommand(this, scrollView, commandId, args)
  }

  override fun receiveCommand(
      scrollView: ReactScrollView,
      commandId: String,
      args: ReadableArray?,
  ) {
    receiveCommand<ReactScrollView>(this, scrollView, commandId, args)
  }

  override fun flashScrollIndicators(scrollView: ReactScrollView) {
    scrollView.flashScrollIndicators()
  }

  override fun scrollTo(scrollView: ReactScrollView, data: ScrollToCommandData) {
    scrollView.abortAnimation()
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(data.mDestX, data.mDestY)
    } else {
      scrollView.scrollTo(data.mDestX, data.mDestY)
    }
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
  public fun setBorderRadius(view: ReactScrollView?, index: Int, borderRadius: Float) {
    if (view != null) {
      val radius =
          if (borderRadius.isNaN()) null
          else LengthPercentage(borderRadius, LengthPercentageType.POINT)
      setBorderRadius(view, BorderRadiusProp.entries[index], radius)
    }
  }

  @ReactProp(name = "borderStyle")
  public fun setBorderStyle(view: ReactScrollView?, borderStyle: String?) {
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
  public fun setBorderWidth(view: ReactScrollView?, index: Int, width: Float) {
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
  @Suppress("UNUSED_PARAMETER")
  public fun setBorderColor(view: ReactScrollView?, index: Int, color: Int?) {
    if (view != null) {
      setBorderColor(view, LogicalEdge.ALL, color)
    }
  }

  @ReactProp(name = "overflow")
  public fun setOverflow(view: ReactScrollView, overflow: String?) {
    view.setOverflow(overflow)
  }

  override fun scrollToEnd(scrollView: ReactScrollView, data: ScrollToEndCommandData) {
    // ScrollView always has one child - the scrollable area. However, it's possible today that we
    // execute this method as view command before the child view is mounted. Here we will retry the
    // view commands as a workaround.
    val child =
        scrollView.getChildAt(0)
            ?: throw RetryableMountingLayerException(
                "scrollToEnd called on ScrollView without child"
            )

    // ScrollView always has one child - the scrollable area
    val bottom = child.height + scrollView.paddingBottom
    scrollView.abortAnimation()
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(scrollView.scrollX, bottom)
    } else {
      scrollView.scrollTo(scrollView.scrollX, bottom)
    }
  }

  @ReactProp(name = "persistentScrollbar")
  public fun setPersistentScrollbar(view: ReactScrollView, value: Boolean) {
    view.isScrollbarFadingEnabled = !value
  }

  @ReactProp(name = "fadingEdgeLength")
  public fun setFadingEdgeLength(view: ReactScrollView, value: Dynamic) {
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
      view.isVerticalFadingEdgeEnabled = true
      view.setFadingEdgeLength(
          Math.round(Math.max(view.fadingEdgeLengthStart, view.fadingEdgeLengthEnd).dpToPx())
      )
    } else {
      view.isVerticalFadingEdgeEnabled = false
      view.setFadingEdgeLength(0)
    }
  }

  @ReactProp(name = "contentOffset", customType = "Point")
  public fun setContentOffset(view: ReactScrollView, value: ReadableMap?) {
    view.setContentOffset(value)
  }

  @ReactProp(name = "maintainVisibleContentPosition")
  public fun setMaintainVisibleContentPosition(view: ReactScrollView, value: ReadableMap?) {
    if (value != null) {
      view.setMaintainVisibleContentPosition(
          MaintainVisibleScrollPositionHelper.Config.fromReadableMap(value)
      )
    } else {
      view.setMaintainVisibleContentPosition(null)
    }
  }

  override fun updateState(
      view: ReactScrollView,
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

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
    val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
    val eventTypeConstants = baseEventTypeConstants ?: HashMap()
    eventTypeConstants.putAll(createExportedCustomDirectEventTypeConstants())
    return eventTypeConstants
  }

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public fun setPointerEvents(view: ReactScrollView, pointerEventsStr: String?) {
    view.pointerEvents = parsePointerEvents(pointerEventsStr)
  }

  @ReactProp(name = "scrollEventThrottle")
  public fun setScrollEventThrottle(view: ReactScrollView, scrollEventThrottle: Int) {
    view.scrollEventThrottle = scrollEventThrottle
  }

  @ReactProp(name = "horizontal")
  @Suppress("UNUSED_PARAMETER")
  public fun setHorizontal(view: ReactScrollView?, horizontal: Boolean) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactProp(name = "isInvertedVirtualizedList")
  public fun setIsInvertedVirtualizedList(view: ReactScrollView, applyFix: Boolean) {
    // Usually when inverting the scroll view we are using scaleY: -1 on the list
    // and on the parent container. HOWEVER, starting from android API 33 there is
    // a bug that can cause an ANR due to that. Thus we are using different transform
    // commands to circumvent the ANR. This however causes the vertical scrollbar to
    // be on the wrong side. Thus we are moving it to the other side, when the list
    // is inverted.
    // See also:
    //  - https://github.com/facebook/react-native/issues/35350
    //  - https://issuetracker.google.com/issues/287304310
    if (applyFix) {
      view.verticalScrollbarPosition = View.SCROLLBAR_POSITION_LEFT
    } else {
      view.verticalScrollbarPosition = View.SCROLLBAR_POSITION_DEFAULT
    }
  }

  public companion object {
    public const val REACT_CLASS: String = "RCTScrollView"

    public fun createExportedCustomDirectEventTypeConstants(): Map<String, Any> = mapOf(
        getJSEventName(ScrollEventType.SCROLL) to mapOf("registrationName" to "onScroll"),
        getJSEventName(ScrollEventType.BEGIN_DRAG) to
            mapOf("registrationName" to "onScrollBeginDrag"),
        getJSEventName(ScrollEventType.END_DRAG) to mapOf("registrationName" to "onScrollEndDrag"),
        getJSEventName(ScrollEventType.MOMENTUM_BEGIN) to
            mapOf("registrationName" to "onMomentumScrollBegin"),
        getJSEventName(ScrollEventType.MOMENTUM_END) to
            mapOf("registrationName" to "onMomentumScrollEnd"),
    )
  }
}
