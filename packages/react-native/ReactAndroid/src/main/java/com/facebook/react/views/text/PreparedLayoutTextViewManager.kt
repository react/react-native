/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text

import android.text.Spannable
import android.text.Spanned
import android.view.View
import com.facebook.react.R
import com.facebook.react.internal.SystraceSection
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.IViewGroupManager
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ReferenceStateWrapper
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.uimanager.style.Overflow
import com.facebook.react.views.text.ReactTextViewAccessibilityDelegate.AccessibilityLinks
import java.util.HashMap

@ReactModule(name = PreparedLayoutTextViewManager.REACT_CLASS)
internal class PreparedLayoutTextViewManager :
    BaseViewManager<PreparedLayoutTextView, LayoutShadowNode>,
    IViewGroupManager<PreparedLayoutTextView>,
    ReactTextViewManagerCallback {
  private val reactTextViewManagerCallback: ReactTextViewManagerCallback?

  @JvmOverloads
  constructor(reactTextViewManagerCallback: ReactTextViewManagerCallback? = null) : super() {
    this.reactTextViewManagerCallback = reactTextViewManagerCallback
    setupViewRecycling()
  }

  override fun prepareToRecycleView(
      reactContext: ThemedReactContext,
      view: PreparedLayoutTextView,
  ): PreparedLayoutTextView? {
    val preparedView = super.prepareToRecycleView(reactContext, view)
    preparedView?.recycleView()
    return preparedView
  }

  override fun getName(): String = REACT_CLASS

  override fun updateViewAccessibility(view: PreparedLayoutTextView) {
    ReactTextViewAccessibilityDelegate.setDelegate(
        view,
        view.isFocusable,
        view.importantForAccessibility,
    )
  }

  public override fun createViewInstance(context: ThemedReactContext): PreparedLayoutTextView =
      PreparedLayoutTextView(context)

  override fun updateExtraData(view: PreparedLayoutTextView, extraData: Any) {
    SystraceSection("PreparedLayoutTextViewManager.updateExtraData").use { _ ->
      val preparedLayout = extraData as PreparedLayout
      view.preparedLayout = preparedLayout

      // If this text view contains any clickable spans, set a view tag and reset the accessibility
      // delegate so that these can be picked up by the accessibility system.
      if (preparedLayout.layout.text is Spanned) {
        val spannedText = preparedLayout.layout.text as Spanned
        val accessibilityLinks = AccessibilityLinks(spannedText)
        view.setTag(
            R.id.accessibility_links,
            if (accessibilityLinks.size() > 0) accessibilityLinks else null,
        )
        ReactTextViewAccessibilityDelegate.resetDelegate(
            view,
            view.isFocusable,
            view.importantForAccessibility,
        )
      }
    }
  }

  override fun updateState(
      view: PreparedLayoutTextView,
      props: ReactStylesDiffMap,
      stateWrapper: StateWrapper,
  ): Any? = (stateWrapper as? ReferenceStateWrapper)?.stateDataReference

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
    val eventTypeConstants = baseEventTypeConstants ?: HashMap()
    eventTypeConstants.put("topTextLayout", mapOf("registrationName" to "onTextLayout"))
    return eventTypeConstants
  }

  @ReactProp(name = "overflow")
  fun setOverflow(view: PreparedLayoutTextView, overflow: String?): Unit {
    view.overflow = overflow?.let { Overflow.fromString(it) } ?: Overflow.VISIBLE
  }

  @ReactProp(name = "accessible")
  fun setAccessible(view: PreparedLayoutTextView, accessible: Boolean): Unit {
    view.isFocusable = accessible
  }

  @ReactProp(name = "selectable", defaultBoolean = false)
  fun setSelectable(view: PreparedLayoutTextView, isSelectable: Boolean): Unit {
    check(!isSelectable) {
      "selectable Text should use SelectableTextViewManager instead of PreparedLayoutViewManager"
    }
  }

  @ReactProp(name = "selectionColor", customType = "Color")
  fun setSelectionColor(view: PreparedLayoutTextView, color: Int?): Unit {
    if (color == null) {
      view.selectionColor = DefaultStyleValuesUtil.getDefaultTextColorHighlight(view.context)
    } else {
      view.selectionColor = color
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
  fun setBorderRadius(view: PreparedLayoutTextView, index: Int, borderRadius: Float): Unit {
    val radius =
        if (borderRadius.isNaN()) null
        else LengthPercentage(borderRadius, LengthPercentageType.POINT)
    BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], radius)
  }

  @ReactProp(name = "borderStyle")
  fun setBorderStyle(view: PreparedLayoutTextView, borderStyle: String?): Unit {
    val parsedBorderStyle = if (borderStyle == null) null else BorderStyle.fromString(borderStyle)
    BackgroundStyleApplicator.setBorderStyle(view, parsedBorderStyle)
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
  fun setBorderWidth(view: PreparedLayoutTextView, index: Int, width: Float): Unit {
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
  fun setBorderColor(view: PreparedLayoutTextView, index: Int, color: Int?): Unit {
    BackgroundStyleApplicator.setBorderColor(view, LogicalEdge.values()[index], color)
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: PreparedLayoutTextView, disabled: Boolean): Unit {
    view.isEnabled = !disabled
  }

  override fun setPadding(
      view: PreparedLayoutTextView,
      left: Int,
      top: Int,
      right: Int,
      bottom: Int,
  ): Unit {
    view.setPadding(left, top, right, bottom)
  }

  override fun getShadowNodeClass(): Class<out LayoutShadowNode> = LayoutShadowNode::class.java

  override fun addView(parent: PreparedLayoutTextView, child: View, index: Int) {
    parent.addView(child, index)
  }

  override fun getChildAt(parent: PreparedLayoutTextView, index: Int): View? =
      parent.getChildAt(index)

  override fun removeViewAt(parent: PreparedLayoutTextView, index: Int) {
    parent.removeViewAt(index)
  }

  override fun getChildCount(parent: PreparedLayoutTextView): Int = parent.childCount

  override fun needsCustomLayoutForChildren(): Boolean = false

  override fun onPostProcessSpannable(text: Spannable) {
    reactTextViewManagerCallback?.onPostProcessSpannable(text)
  }

  companion object {
    const val REACT_CLASS: String = "RCTText"
  }
}
