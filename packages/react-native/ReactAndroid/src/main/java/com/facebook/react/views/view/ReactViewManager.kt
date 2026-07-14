/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.graphics.Rect
import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactAxOrderHelper
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.react.uimanager.style.BackgroundImageLayer
import com.facebook.react.uimanager.style.BackgroundPosition
import com.facebook.react.uimanager.style.BackgroundRepeat
import com.facebook.react.uimanager.style.BackgroundSize
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge

/** View manager for AndroidViews (plain React Views). */
@ReactModule(name = ReactViewManager.REACT_CLASS)
public open class ReactViewManager : ReactClippingViewManager<ReactViewGroup>() {

  public companion object {
    public const val REACT_CLASS: String = ViewProps.VIEW_CLASS_NAME

    private val SPACING_TYPES = intArrayOf(
        Spacing.ALL,
        Spacing.LEFT,
        Spacing.RIGHT,
        Spacing.TOP,
        Spacing.BOTTOM,
        Spacing.START,
        Spacing.END,
        Spacing.BLOCK,
        Spacing.BLOCK_END,
        Spacing.BLOCK_START,
    )
    private const val CMD_HOTSPOT_UPDATE = 1
    private const val CMD_SET_PRESSED = 2
    private const val HOTSPOT_UPDATE_KEY = "hotspotUpdate"
  }

  init {
    if (
        ReactNativeFeatureFlags.enableViewRecyclingForView() &&
            this.javaClass == ReactViewManager::class.java
    ) {
      setupViewRecycling()
    }
  }

  override fun prepareToRecycleView(
      reactContext: ThemedReactContext,
      view: ReactViewGroup,
  ): ReactViewGroup? {
    // We don't want to run the view clipping when the view is being prepared for recycling to avoid
    // have size changes iterate over child view that should be removed anyway
    view.removeClippedSubviews = false

    // BaseViewManager
    val preparedView = super.prepareToRecycleView(reactContext, view)
    preparedView?.recycleView()
    return preparedView
  }

  override fun onDropViewInstance(view: ReactViewGroup) {
    super.onDropViewInstance(view)
    view.cleanUpAxOrderListener()
  }

  @ReactProp(name = "accessible")
  public open fun setAccessible(view: ReactViewGroup, accessible: Boolean) {
    view.isFocusable = accessible
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_ORDER)
  public open fun setAccessibilityOrder(view: ReactViewGroup, nativeIds: ReadableArray?) {
    if (!ReactNativeFeatureFlags.enableAccessibilityOrder()) {
      return
    }

    for (i in 0 until view.childCount) {
      ReactAxOrderHelper.cleanUpAxOrder(view.getChildAt(i))
    }

    if (nativeIds == null) {
      view.axOrderList = null
      return
    }

    val axOrderList = mutableListOf<String>()

    for (i in 0 until nativeIds.size()) {
      val id = nativeIds.getString(i)
      if (id != null) {
        axOrderList.add(id)
      }
    }

    view.axOrderList = axOrderList
  }

  @ReactProp(name = "hasTVPreferredFocus")
  public open fun setTVPreferredFocus(view: ReactViewGroup, hasTVPreferredFocus: Boolean) {
    if (hasTVPreferredFocus) {
      view.isFocusable = true
      view.isFocusableInTouchMode = true
      view.requestFocus()
    }
  }

  @ReactProp(name = ViewProps.BACKGROUND_IMAGE, customType = "BackgroundImage")
  public open fun setBackgroundImage(view: ReactViewGroup, backgroundImage: ReadableArray?) {
    if (backgroundImage != null && backgroundImage.size() > 0) {
      val backgroundImageLayers = ArrayList<BackgroundImageLayer>(backgroundImage.size())
      for (i in 0 until backgroundImage.size()) {
        val backgroundImageMap = backgroundImage.getMap(i)
        val layer = BackgroundImageLayer.parse(backgroundImageMap, view.context)
        if (layer != null) {
          backgroundImageLayers.add(layer)
        }
      }
      BackgroundStyleApplicator.setBackgroundImage(view, backgroundImageLayers)
    } else {
      BackgroundStyleApplicator.setBackgroundImage(view, null)
    }
  }

  @ReactProp(name = ViewProps.EXPERIMENTAL_BACKGROUND_IMAGE, customType = "BackgroundImage")
  public open fun setExperimentalBackgroundImage(
      view: ReactViewGroup,
      backgroundImage: ReadableArray?,
  ) {
    setBackgroundImage(view, backgroundImage)
  }

  @ReactProp(name = ViewProps.BACKGROUND_SIZE, customType = "BackgroundSize")
  public open fun setBackgroundSize(view: ReactViewGroup, backgroundSize: ReadableArray?) {
    if (backgroundSize != null && backgroundSize.size() > 0) {
      val backgroundSizes = ArrayList<BackgroundSize>(backgroundSize.size())
      for (i in 0 until backgroundSize.size()) {
        val backgroundSizeValue = backgroundSize.getDynamic(i)
        val parsedBackgroundSize = BackgroundSize.parse(backgroundSizeValue)
        if (parsedBackgroundSize != null) {
          backgroundSizes.add(parsedBackgroundSize)
        }
      }
      BackgroundStyleApplicator.setBackgroundSize(view, backgroundSizes.ifEmpty { null })
    } else {
      BackgroundStyleApplicator.setBackgroundSize(view, null)
    }
  }

  @ReactProp(name = ViewProps.BACKGROUND_POSITION, customType = "BackgroundPosition")
  public open fun setBackgroundPosition(view: ReactViewGroup, backgroundPosition: ReadableArray?) {
    if (backgroundPosition != null && backgroundPosition.size() > 0) {
      val backgroundPositions = ArrayList<BackgroundPosition>(backgroundPosition.size())
      for (i in 0 until backgroundPosition.size()) {
        val backgroundPositionMap = backgroundPosition.getMap(i)
        val parsedBackgroundPosition = BackgroundPosition.parse(backgroundPositionMap)
        if (parsedBackgroundPosition != null) {
          backgroundPositions.add(parsedBackgroundPosition)
        }
      }
      BackgroundStyleApplicator.setBackgroundPosition(view, backgroundPositions.ifEmpty { null })
    } else {
      BackgroundStyleApplicator.setBackgroundPosition(view, null)
    }
  }

  @ReactProp(name = ViewProps.BACKGROUND_REPEAT, customType = "BackgroundRepeat")
  public open fun setBackgroundRepeat(view: ReactViewGroup, backgroundRepeat: ReadableArray?) {
    if (backgroundRepeat != null && backgroundRepeat.size() > 0) {
      val backgroundRepeats = ArrayList<BackgroundRepeat>(backgroundRepeat.size())
      for (i in 0 until backgroundRepeat.size()) {
        val backgroundRepeatMap = backgroundRepeat.getMap(i)
        val parsedBackgroundRepeat = BackgroundRepeat.parse(backgroundRepeatMap)
        if (parsedBackgroundRepeat != null) {
          backgroundRepeats.add(parsedBackgroundRepeat)
        }
      }
      BackgroundStyleApplicator.setBackgroundRepeat(view, backgroundRepeats.ifEmpty { null })
    } else {
      BackgroundStyleApplicator.setBackgroundRepeat(view, null)
    }
  }

  @ReactProp(name = "nextFocusDown", defaultInt = View.NO_ID)
  public open fun nextFocusDown(view: ReactViewGroup, viewId: Int) {
    view.nextFocusDownId = viewId
  }

  @ReactProp(name = "nextFocusForward", defaultInt = View.NO_ID)
  public open fun nextFocusForward(view: ReactViewGroup, viewId: Int) {
    view.nextFocusForwardId = viewId
  }

  @ReactProp(name = "nextFocusLeft", defaultInt = View.NO_ID)
  public open fun nextFocusLeft(view: ReactViewGroup, viewId: Int) {
    view.nextFocusLeftId = viewId
  }

  @ReactProp(name = "nextFocusRight", defaultInt = View.NO_ID)
  public open fun nextFocusRight(view: ReactViewGroup, viewId: Int) {
    view.nextFocusRightId = viewId
  }

  @ReactProp(name = "nextFocusUp", defaultInt = View.NO_ID)
  public open fun nextFocusUp(view: ReactViewGroup, viewId: Int) {
    view.nextFocusUpId = viewId
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_RADIUS,
              ViewProps.BORDER_TOP_LEFT_RADIUS,
              ViewProps.BORDER_TOP_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
              ViewProps.BORDER_TOP_START_RADIUS,
              ViewProps.BORDER_TOP_END_RADIUS,
              ViewProps.BORDER_BOTTOM_START_RADIUS,
              ViewProps.BORDER_BOTTOM_END_RADIUS,
              ViewProps.BORDER_END_END_RADIUS,
              ViewProps.BORDER_END_START_RADIUS,
              ViewProps.BORDER_START_END_RADIUS,
              ViewProps.BORDER_START_START_RADIUS,
          ]
  )
  public open fun setBorderRadius(view: ReactViewGroup, index: Int, rawBorderRadius: Dynamic) {
    val borderRadius = LengthPercentage.setFromDynamic(rawBorderRadius)

    BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], borderRadius)
  }

  @Deprecated(
      "Don't use setBorderRadius(view, int, Float) as it was deprecated in React Native 0.75.0.",
      ReplaceWith("setBorderRadius(view, index, DynamicFromObject(borderRadius)"),
  )
  public open fun setBorderRadius(view: ReactViewGroup, index: Int, borderRadius: Float) {
    setBorderRadius(view, index, DynamicFromObject(borderRadius))
  }

  @ReactProp(name = "borderStyle")
  public open fun setBorderStyle(view: ReactViewGroup, borderStyle: String?) {
    val parsedBorderStyle = if (borderStyle == null) null else BorderStyle.fromString(borderStyle)
    BackgroundStyleApplicator.setBorderStyle(view, parsedBorderStyle)
  }

  @ReactProp(name = "hitSlop")
  public open fun setHitSlop(view: ReactViewGroup, hitSlop: Dynamic) {
    when (hitSlop.type) {
      ReadableType.Map -> {
        val hitSlopMap = hitSlop.asMap()
        if (hitSlopMap == null) {
          view.hitSlopRect = null
          return
        }
        view.hitSlopRect =
            (Rect(
                hitSlopMap.px("left"),
                hitSlopMap.px("top"),
                hitSlopMap.px("right"),
                hitSlopMap.px("bottom"),
            ))
      }

      ReadableType.Number -> {
        val hitSlopValue = hitSlop.asDouble().dpToPx().toInt()
        view.hitSlopRect = Rect(hitSlopValue, hitSlopValue, hitSlopValue, hitSlopValue)
      }

      ReadableType.Null -> view.hitSlopRect = null
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid type for 'hitSlop' value ${hitSlop.type}")
        view.hitSlopRect = null
      }
    }
  }

  private fun ReadableMap.px(key: String) = if (hasKey(key)) getDouble(key).dpToPx().toInt() else 0

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public open fun setPointerEvents(view: ReactViewGroup, pointerEventsStr: String?) {
    view.pointerEvents = PointerEvents.parsePointerEvents(pointerEventsStr)
    ImportantForInteractionHelper.setImportantForInteraction(view, view.pointerEvents)
  }

  @ReactProp(name = "nativeBackgroundAndroid")
  public open fun setNativeBackground(view: ReactViewGroup, background: ReadableMap?) {
    view.applyNativeBackground(background)
  }

  @ReactProp(name = "nativeForegroundAndroid")
  public open fun setNativeForeground(view: ReactViewGroup, foreground: ReadableMap?) {
    view.applyNativeForeground(foreground)
  }

  @ReactProp(name = ViewProps.NEEDS_OFFSCREEN_ALPHA_COMPOSITING)
  public open fun setNeedsOffscreenAlphaCompositing(
      view: ReactViewGroup,
      needsOffscreenAlphaCompositing: Boolean,
  ) {
    view.setNeedsOffscreenAlphaCompositing(needsOffscreenAlphaCompositing)
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_WIDTH,
              ViewProps.BORDER_LEFT_WIDTH,
              ViewProps.BORDER_RIGHT_WIDTH,
              ViewProps.BORDER_TOP_WIDTH,
              ViewProps.BORDER_BOTTOM_WIDTH,
              ViewProps.BORDER_START_WIDTH,
              ViewProps.BORDER_END_WIDTH,
          ],
      defaultFloat = Float.NaN,
  )
  public open fun setBorderWidth(view: ReactViewGroup, index: Int, width: Float) {
    BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.values()[index], width)
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_COLOR,
              ViewProps.BORDER_LEFT_COLOR,
              ViewProps.BORDER_RIGHT_COLOR,
              ViewProps.BORDER_TOP_COLOR,
              ViewProps.BORDER_BOTTOM_COLOR,
              ViewProps.BORDER_START_COLOR,
              ViewProps.BORDER_END_COLOR,
              ViewProps.BORDER_BLOCK_COLOR,
              ViewProps.BORDER_BLOCK_END_COLOR,
              ViewProps.BORDER_BLOCK_START_COLOR,
          ],
      customType = "Color",
  )
  public open fun setBorderColor(view: ReactViewGroup, index: Int, color: Int?) {
    BackgroundStyleApplicator.setBorderColor(
        view,
        LogicalEdge.fromSpacingType(SPACING_TYPES[index]),
        color,
    )
  }

  @ReactProp(name = ViewProps.COLLAPSABLE)
  @Suppress("UNUSED_PARAMETER")
  public open fun setCollapsable(view: ReactViewGroup, collapsable: Boolean) {
    // no-op: it's here only so that "collapsable" property is exported to JS.
  }

  @ReactProp(name = ViewProps.COLLAPSABLE_CHILDREN)
  @Suppress("UNUSED_PARAMETER")
  public open fun setCollapsableChildren(view: ReactViewGroup, collapsableChildren: Boolean) {
    // no-op: it's here only so that "collapsableChildren" property is exported to JS.
  }

  @ReactProp(name = "focusable")
  public open fun setFocusable(view: ReactViewGroup, focusable: Boolean) {
    if (focusable) {
      view.setOnClickListener {
        val eventDispatcher = UIManagerHelper.getEventDispatcher(view.context as ReactContext)
        eventDispatcher?.dispatchEvent(
            ViewGroupClickEvent(UIManagerHelper.getSurfaceId(view.context), view.id)
        )
      }

      // Clickable elements are focusable. On API 26, this is taken care by setClickable.
      // Explicitly calling setFocusable here for backward compatibility.
      view.isFocusable = true
    } else {
      view.setOnClickListener(null)
      view.isClickable = false
      // Don't set view.setFocusable(false) because we might still want it to be focusable for
      // accessibility reasons
    }
  }

  @ReactProp(name = ViewProps.OVERFLOW)
  public open fun setOverflow(view: ReactViewGroup, overflow: String?) {
    view.overflow = overflow
  }

  @ReactProp(name = "backfaceVisibility")
  public open fun setBackfaceVisibility(view: ReactViewGroup, backfaceVisibility: String) {
    view.setBackfaceVisibility(backfaceVisibility)
  }

  override fun setOpacity(view: ReactViewGroup, opacity: Float) {
    view.setOpacityIfPossible(opacity)
  }

  override fun setTransformProperty(
      view: ReactViewGroup,
      transforms: ReadableArray?,
      transformOrigin: ReadableArray?,
  ) {
    super.setTransformProperty(view, transforms, transformOrigin)
    view.setBackfaceVisibilityDependantOpacity()
  }

  override fun getName(): String = REACT_CLASS

  public override fun createViewInstance(context: ThemedReactContext): ReactViewGroup =
      ReactViewGroup(context)

  override fun getCommandsMap(): MutableMap<String, Int> =
      mutableMapOf(HOTSPOT_UPDATE_KEY to CMD_HOTSPOT_UPDATE, "setPressed" to CMD_SET_PRESSED)

  @Deprecated(
      "Use receiveCommand(View, String, ReadableArray)",
      ReplaceWith("receiveCommand(root, commandIdString, args)"),
  )
  override fun receiveCommand(root: ReactViewGroup, commandId: Int, args: ReadableArray?) {
    when (commandId) {
      CMD_HOTSPOT_UPDATE -> handleHotspotUpdate(root, args)
      CMD_SET_PRESSED -> handleSetPressed(root, args)
      else -> {}
    }
  }

  override fun receiveCommand(root: ReactViewGroup, commandId: String, args: ReadableArray?) {
    when (commandId) {
      HOTSPOT_UPDATE_KEY -> handleHotspotUpdate(root, args)
      "setPressed" -> handleSetPressed(root, args)
      "focus" -> handleFocus(root)
      "blur" -> handleBlur(root)
      else -> {}
    }
  }

  private fun handleSetPressed(root: ReactViewGroup, args: ReadableArray?) {
    if (args == null || args.size() != 1) {
      throw JSApplicationIllegalArgumentException(
          "Illegal number of arguments for 'setPressed' command"
      )
    }
    root.isPressed = args.getBoolean(0)
  }

  private fun handleHotspotUpdate(root: ReactViewGroup, args: ReadableArray?) {
    if (args == null || args.size() != 2) {
      throw JSApplicationIllegalArgumentException(
          "Illegal number of arguments for 'updateHotspot' command"
      )
    }

    val x = args.getDouble(0).dpToPx()
    val y = args.getDouble(1).dpToPx()
    root.drawableHotspotChanged(x, y)
  }

  private fun handleFocus(root: ReactViewGroup) {
    if (ReactNativeFeatureFlags.enableImperativeFocus()) {
      root.requestFocusFromJS()
    }
  }

  private fun handleBlur(root: ReactViewGroup) {
    if (ReactNativeFeatureFlags.enableImperativeFocus()) {
      root.clearFocusFromJS()
    }
  }
}
