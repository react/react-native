/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text

import android.os.Build
import android.text.Layout
import android.text.Spannable
import android.text.SpannableString
import android.text.Spanned
import android.text.TextUtils
import android.text.util.Linkify
import android.view.Gravity
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.internal.SystraceSection
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.IViewManagerWithChildren
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ReferenceStateWrapper
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewDefaults
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle.Companion.fromString
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.views.text.DefaultStyleValuesUtil.getDefaultTextColorHighlight
import com.facebook.react.views.text.ReactTypefaceUtils.getFontWeightAdjustment
import java.util.HashMap

/** View manager for `<Text>` nodes. */
@ReactModule(name = ReactTextViewManager.REACT_CLASS)
@OptIn(UnstableReactNativeAPI::class)
public open class ReactTextViewManager
@JvmOverloads
public constructor(
    protected var reactTextViewManagerCallback: ReactTextViewManagerCallback? = null
) :
    BaseViewManager<ReactTextView, LayoutShadowNode>(),
    IViewManagerWithChildren,
    ReactTextViewManagerCallback {
  init {
    if (ReactNativeFeatureFlags.enableViewRecyclingForText()) {
      setupViewRecycling()
    }
  }

  override fun prepareToRecycleView(
      reactContext: ThemedReactContext,
      view: ReactTextView,
  ): ReactTextView? {
    // BaseViewManager
    val preparedView = super.prepareToRecycleView(reactContext, view)
    if (preparedView != null) {
      // Resets background and borders
      preparedView.recycleView()
      // Reset selection color to default
      setSelectionColor(preparedView, null)
    }
    return preparedView
  }

  override fun getName(): String = REACT_CLASS

  override fun updateViewAccessibility(view: ReactTextView) {
    ReactTextViewAccessibilityDelegate.setDelegate(
        view,
        view.isFocusable,
        view.importantForAccessibility,
    )
  }

  public override fun createViewInstance(context: ThemedReactContext): ReactTextView =
      ReactTextView(context)

  override fun updateExtraData(view: ReactTextView, extraData: Any) {
    SystraceSection("ReactTextViewManager.updateExtraData").use { s ->
      val update = extraData as ReactTextUpdate
      val spanned: Spanned = update.text
      view.setText(update)

      // If this text view contains any clickable spans, set a view tag and reset the accessibility
      // delegate so that these can be picked up by the accessibility system.
      val accessibilityLinks: ReactTextViewAccessibilityDelegate.AccessibilityLinks =
          ReactTextViewAccessibilityDelegate.AccessibilityLinks(spanned)
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

  override fun createShadowNodeInstance(): LayoutShadowNode = LayoutShadowNode()

  public fun createShadowNodeInstance(
      reactTextViewManagerCallback: ReactTextViewManagerCallback?
  ): LayoutShadowNode = LayoutShadowNode()

  override fun getShadowNodeClass(): Class<LayoutShadowNode> = LayoutShadowNode::class.java

  override fun onAfterUpdateTransaction(view: ReactTextView) {
    super.onAfterUpdateTransaction(view)
    view.updateView()
  }

  override fun needsCustomLayoutForChildren(): Boolean = true

  override fun updateState(
      view: ReactTextView,
      props: ReactStylesDiffMap,
      stateWrapper: StateWrapper,
  ): Any? {
    SystraceSection("ReactTextViewManager.updateState").use { s ->
      val refState = (stateWrapper as? ReferenceStateWrapper)?.stateDataReference
      if (refState is PreparedLayout) {
        return getReactTextUpdateFromPreparedLayout(view, refState)
      }

      val stateMapBuffer = stateWrapper.stateDataMapBuffer
      return if (stateMapBuffer != null) {
        getReactTextUpdate(view, props, stateMapBuffer)
      } else {
        null
      }
    }
  }

  private fun getReactTextUpdate(
      view: ReactTextView,
      props: ReactStylesDiffMap,
      state: MapBuffer,
  ): Any {
    val attributedString: MapBuffer = state.getMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING.toInt())
    val paragraphAttributes: MapBuffer =
        state.getMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES.toInt())
    val spanned: Spannable =
        TextLayoutManager.getOrCreateSpannableForText(
            view.context.assets,
            getFontWeightAdjustment(view.context),
            attributedString,
            reactTextViewManagerCallback,
            TextEffectRegistry.current,
        )
    view.setSpanned(spanned)

    val minimumFontSize: Float =
        paragraphAttributes.getDouble(TextLayoutManager.PA_KEY_MINIMUM_FONT_SIZE).toFloat()
    view.setMinimumFontSize(minimumFontSize)

    // Clear any stale PreparedLayout from a previous update
    view.setPreparedLayout(null)

    val textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(
            paragraphAttributes.getString(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY)
        )
    val currentJustificationMode =
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) 0 else view.justificationMode

    return ReactTextUpdate(
        spanned,
        -1, // UNUSED FOR TEXT
        TextLayoutManager.getTextGravity(attributedString, spanned),
        textBreakStrategy,
        TextAttributeProps.getJustificationMode(props, currentJustificationMode),
    )
  }

  /**
   * Constructs a [ReactTextUpdate] from a [PreparedLayout] received via [ReferenceStateWrapper].
   */
  private fun getReactTextUpdateFromPreparedLayout(
      view: ReactTextView,
      preparedLayout: PreparedLayout,
  ): ReactTextUpdate {
    val layout = preparedLayout.layout
    val text = layout.text
    val spanned = if (text is Spannable) text else SpannableString(text)
    view.setSpanned(spanned)
    view.setPreparedLayout(preparedLayout)

    val textAlign =
        when (layout.alignment) {
          Layout.Alignment.ALIGN_CENTER -> Gravity.CENTER_HORIZONTAL
          Layout.Alignment.ALIGN_OPPOSITE -> Gravity.END
          else -> Gravity.START
        }

    return ReactTextUpdate(
        spanned,
        -1,
        textAlign,
        preparedLayout.textBreakStrategy,
        preparedLayout.justificationMode,
    )
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
    val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
    val eventTypeConstants = baseEventTypeConstants ?: HashMap()
    eventTypeConstants.putAll(mapOf("topTextLayout" to mapOf("registrationName" to "onTextLayout")))
    return eventTypeConstants
  }

  override fun onPostProcessSpannable(text: Spannable) {
    reactTextViewManagerCallback?.onPostProcessSpannable(text)
  }

  override fun setPadding(view: ReactTextView, left: Int, top: Int, right: Int, bottom: Int) {
    view.setPadding(left, top, right, bottom)
  }

  @ReactProp(name = "overflow")
  public fun setOverflow(view: ReactTextView, overflow: String?) {
    view.setOverflow(overflow)
  }

  @ReactProp(name = "accessible")
  public fun setAccessible(view: ReactTextView, accessible: Boolean) {
    view.isFocusable = accessible
  }

  // maxLines can only be set in master view (block), doesn't really make sense to set in a span
  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = ViewDefaults.NUMBER_OF_LINES)
  public fun setNumberOfLines(view: ReactTextView, numberOfLines: Int) {
    view.setNumberOfLines(numberOfLines)
  }

  @ReactProp(name = ViewProps.ELLIPSIZE_MODE)
  public fun setEllipsizeMode(view: ReactTextView, ellipsizeMode: String?) {
    when (ellipsizeMode) {
      null,
      "tail" -> view.setEllipsizeLocation(TextUtils.TruncateAt.END)
      "head" -> view.setEllipsizeLocation(TextUtils.TruncateAt.START)
      "middle" -> view.setEllipsizeLocation(TextUtils.TruncateAt.MIDDLE)
      "clip" -> view.setEllipsizeLocation(null)
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid ellipsizeMode: $ellipsizeMode")
        view.setEllipsizeLocation(TextUtils.TruncateAt.END)
      }
    }
  }

  @ReactProp(name = ViewProps.ADJUSTS_FONT_SIZE_TO_FIT)
  public fun setAdjustFontSizeToFit(view: ReactTextView, adjustsFontSizeToFit: Boolean) {
    view.setAdjustFontSizeToFit(adjustsFontSizeToFit)
  }

  @ReactProp(name = ViewProps.FONT_SIZE)
  public fun setFontSize(view: ReactTextView, fontSize: Float) {
    view.setFontSize(fontSize)
  }

  @ReactProp(name = ViewProps.LETTER_SPACING, defaultFloat = 0f)
  public fun setLetterSpacing(view: ReactTextView, letterSpacing: Float) {
    view.letterSpacing = letterSpacing
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN_VERTICAL)
  public fun setTextAlignVertical(view: ReactTextView, textAlignVertical: String?) {
    when (textAlignVertical) {
      null,
      "auto" -> view.setGravityVertical(Gravity.NO_GRAVITY)
      "top" -> view.setGravityVertical(Gravity.TOP)
      "bottom" -> view.setGravityVertical(Gravity.BOTTOM)
      "center" -> view.setGravityVertical(Gravity.CENTER_VERTICAL)
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid textAlignVertical: $textAlignVertical")
        view.setGravityVertical(Gravity.NO_GRAVITY)
      }
    }
  }

  @ReactProp(name = "selectable")
  public fun setSelectable(view: ReactTextView, isSelectable: Boolean) {
    view.setTextIsSelectable(isSelectable)
  }

  @ReactProp(name = "selectionColor", customType = "Color")
  public fun setSelectionColor(view: ReactTextView, color: Int?) {
    view.highlightColor = color ?: getDefaultTextColorHighlight(view.context)
  }

  @ReactProp(name = "android_hyphenationFrequency")
  public fun setAndroidHyphenationFrequency(view: ReactTextView, frequency: String?) {
    when (frequency) {
      null,
      "none" -> view.hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NONE
      "full" -> view.hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_FULL
      "normal" -> view.hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NORMAL
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid android_hyphenationFrequency: $frequency")
        view.hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NONE
      }
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
  public fun setBorderRadius(view: ReactTextView, index: Int, borderRadius: Float) {
    val radius =
        if (borderRadius.isNaN()) {
          null
        } else {
          LengthPercentage(borderRadius, LengthPercentageType.POINT)
        }
    BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], radius)
  }

  @ReactProp(name = "borderStyle")
  public fun setBorderStyle(view: ReactTextView, borderStyle: String?) {
    val parsedBorderStyle = if (borderStyle == null) null else fromString(borderStyle)
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
  public fun setBorderWidth(view: ReactTextView, index: Int, width: Float) {
    BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.values()[index], width)
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
  public fun setBorderColor(view: ReactTextView, index: Int, color: Int?) {
    BackgroundStyleApplicator.setBorderColor(view, LogicalEdge.values()[index], color)
  }

  @ReactProp(name = ViewProps.INCLUDE_FONT_PADDING, defaultBoolean = true)
  public fun setIncludeFontPadding(view: ReactTextView, includepad: Boolean) {
    view.includeFontPadding = includepad
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  public fun setDisabled(view: ReactTextView, disabled: Boolean) {
    view.isEnabled = !disabled
  }

  @ReactProp(name = "dataDetectorType")
  public fun setDataDetectorType(view: ReactTextView, type: String?) {
    when (type) {
      "phoneNumber" -> {
        view.setLinkifyMask(Linkify.PHONE_NUMBERS)
        return
      }
      "link" -> {
        view.setLinkifyMask(Linkify.WEB_URLS)
        return
      }
      "email" -> {
        view.setLinkifyMask(Linkify.EMAIL_ADDRESSES)
        return
      }
      "all" -> {
        @Suppress("DEPRECATION") view.setLinkifyMask(Linkify.ALL)
        return
      }
    }

    // "none" case, default, and null type are equivalent.
    view.setLinkifyMask(0)
  }

  public companion object {
    private const val TX_STATE_KEY_ATTRIBUTED_STRING: Short = 0
    private const val TX_STATE_KEY_PARAGRAPH_ATTRIBUTES: Short = 1

    public const val REACT_CLASS: String = "RCTText"
  }
}
