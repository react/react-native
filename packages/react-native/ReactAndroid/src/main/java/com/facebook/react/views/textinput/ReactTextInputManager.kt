/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.textinput

import android.annotation.SuppressLint
import android.graphics.BlendMode
import android.graphics.BlendModeColorFilter
import android.graphics.Paint
import android.graphics.PorterDuff
import android.os.Build
import android.text.InputFilter
import android.text.InputFilter.LengthFilter
import android.text.InputType
import android.text.Layout
import android.text.SpannableStringBuilder
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.View.OnFocusChangeListener
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.TextView
import androidx.autofill.HintConstants
import androidx.core.content.ContextCompat
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderRadius
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderStyle
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderWidth
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewDefaults
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.react.uimanager.events.BlurEvent
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.FocusEvent
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle.Companion.fromString
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.react.views.scroll.ScrollEventType
import com.facebook.react.views.scroll.ScrollEventType.Companion.getJSEventName
import com.facebook.react.views.text.DefaultStyleValuesUtil.getDefaultTextColor
import com.facebook.react.views.text.DefaultStyleValuesUtil.getDefaultTextColorHighlight
import com.facebook.react.views.text.DefaultStyleValuesUtil.getDefaultTextColorHint
import com.facebook.react.views.text.ReactTextUpdate
import com.facebook.react.views.text.ReactTextUpdate.Companion.buildReactTextUpdateFromState
import com.facebook.react.views.text.ReactTextViewManagerCallback
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontVariant
import com.facebook.react.views.text.TextAttributeProps
import com.facebook.react.views.text.TextLayoutManager
import java.util.LinkedList

/** Manages instances of TextInput. */
@ReactModule(name = ReactTextInputManager.REACT_CLASS)
public open class ReactTextInputManager public constructor() :
    BaseViewManager<ReactEditText, LayoutShadowNode>() {
  protected var reactTextViewManagerCallback: ReactTextViewManagerCallback? = null

  override fun getName(): String = REACT_CLASS

  public override fun createViewInstance(context: ThemedReactContext): ReactEditText {
    val editText = ReactEditText(context)
    val inputType = editText.inputType
    editText.inputType = inputType and (InputType.TYPE_TEXT_FLAG_MULTI_LINE.inv())
    editText.returnKeyType = "done"
    // Set default layoutParams to avoid NullPointerException to be thrown by Android EditTextView
    // when update props (PlaceHolder) is executed before the view is layout.
    // This change should not affect layout for TextInput components because layout will be
    // overridden on the first RN commit.
    editText.layoutParams =
        ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        )
    return editText
  }

  override fun createShadowNodeInstance(): LayoutShadowNode = LayoutShadowNode()

  public fun createShadowNodeInstance(
      reactTextViewManagerCallback: ReactTextViewManagerCallback?
  ): LayoutShadowNode = LayoutShadowNode()

  override fun getShadowNodeClass(): Class<out LayoutShadowNode> = LayoutShadowNode::class.java

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> {
    val baseEventTypeConstants = super.getExportedCustomBubblingEventTypeConstants()
    val eventTypeConstants = baseEventTypeConstants ?: mutableMapOf()
    eventTypeConstants.putAll(
        mapOf(
            "topSubmitEditing" to
                mapOf(
                    "phasedRegistrationNames" to
                        mapOf(
                            "bubbled" to "onSubmitEditing",
                            "captured" to "onSubmitEditingCapture",
                        )
                ),
            "topEndEditing" to
                mapOf(
                    "phasedRegistrationNames" to
                        mapOf("bubbled" to "onEndEditing", "captured" to "onEndEditingCapture")
                ),
            "topKeyPress" to
                mapOf(
                    "phasedRegistrationNames" to
                        mapOf("bubbled" to "onKeyPress", "captured" to "onKeyPressCapture")
                ),
        )
    )
    return eventTypeConstants
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
    val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
    val eventTypeConstants = baseEventTypeConstants ?: mutableMapOf()
    eventTypeConstants.putAll(
        mapOf(getJSEventName(ScrollEventType.SCROLL) to mapOf("registrationName" to "onScroll"))
    )
    return eventTypeConstants
  }

  override fun getCommandsMap(): Map<String, Int> =
      mapOf("focusTextInput" to FOCUS_TEXT_INPUT, "blurTextInput" to BLUR_TEXT_INPUT)

  @Deprecated("Deprecated in Java")
  override fun receiveCommand(reactEditText: ReactEditText, commandId: Int, args: ReadableArray?) {
    when (commandId) {
      FOCUS_TEXT_INPUT -> receiveCommand(reactEditText, "focus", args)
      BLUR_TEXT_INPUT -> receiveCommand(reactEditText, "blur", args)
      SET_MOST_RECENT_EVENT_COUNT -> {}
      SET_TEXT_AND_SELECTION -> receiveCommand(reactEditText, "setTextAndSelection", args)
    }
  }

  override fun receiveCommand(
      reactEditText: ReactEditText,
      commandId: String,
      args: ReadableArray?,
  ) {
    when (commandId) {
      "focus",
      "focusTextInput" -> reactEditText.requestFocusFromJS()
      "blur",
      "blurTextInput" -> reactEditText.clearFocusFromJS()
      "setTextAndSelection" -> {
        val mostRecentEventCount = checkNotNull(args).getInt(0)
        if (mostRecentEventCount == UNSET) {
          return
        }
        val start = args.getInt(2)
        var end = args.getInt(3)
        if (end == UNSET) {
          end = start
        }
        if (!args.isNull(1)) {
          val text = args.getString(1)
          reactEditText.maybeSetTextFromJS(getReactTextUpdate(text, mostRecentEventCount))
        }
        reactEditText.maybeSetSelection(mostRecentEventCount, start, end)
      }
    }
  }

  private fun getReactTextUpdate(text: String?, mostRecentEventCount: Int): ReactTextUpdate {
    val sb = SpannableStringBuilder()
    sb.append(text)
    return ReactTextUpdate(
        sb,
        mostRecentEventCount,
        Gravity.NO_GRAVITY,
        0,
        0,
    )
  }

  override fun updateExtraData(view: ReactEditText, extraData: Any) {
    if (extraData is ReactTextUpdate) {
      // Ensure that selection is handled correctly on text update
      val isCurrentSelectionEmpty = view.selectionStart == view.selectionEnd
      var selectionStart = UNSET
      var selectionEnd = UNSET
      if (isCurrentSelectionEmpty) {
        // if selection is not set by state, shift current selection to ensure constant gap to
        // text end
        val textLength = view.text?.length ?: 0
        val selectionOffset = textLength - view.selectionStart
        selectionStart = extraData.text.length - selectionOffset
        selectionEnd = selectionStart
      }

      view.maybeSetTextFromState(extraData)
      view.maybeSetSelection(extraData.jsEventCounter, selectionStart, selectionEnd)
    }
  }

  @ReactProp(name = ViewProps.LINE_HEIGHT, defaultFloat = ViewDefaults.LINE_HEIGHT.toFloat())
  public fun setLineHeight(view: ReactEditText, lineHeight: Int) {
    view.lineHeight = lineHeight
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = ViewDefaults.FONT_SIZE_SP)
  public fun setFontSize(view: ReactEditText, fontSize: Float) {
    view.setFontSize(fontSize)
  }

  @ReactProp(name = ViewProps.FONT_FAMILY)
  public fun setFontFamily(view: ReactEditText, fontFamily: String?) {
    view.setFontFamily(fontFamily)
  }

  @ReactProp(name = ViewProps.MAX_FONT_SIZE_MULTIPLIER, defaultFloat = Float.NaN)
  public fun setMaxFontSizeMultiplier(view: ReactEditText, maxFontSizeMultiplier: Float) {
    view.setMaxFontSizeMultiplier(maxFontSizeMultiplier)
  }

  @ReactProp(name = ViewProps.FONT_WEIGHT)
  public fun setFontWeight(view: ReactEditText, fontWeight: String?) {
    view.setFontWeight(fontWeight)
  }

  @ReactProp(name = ViewProps.FONT_STYLE)
  public fun setFontStyle(view: ReactEditText, fontStyle: String?) {
    view.setFontStyle(fontStyle)
  }

  @ReactProp(name = ViewProps.FONT_VARIANT)
  public fun setFontVariant(view: ReactEditText, fontVariant: ReadableArray?) {
    view.fontFeatureSettings = parseFontVariant(fontVariant)
  }

  @ReactProp(name = ViewProps.INCLUDE_FONT_PADDING, defaultBoolean = true)
  public fun setIncludeFontPadding(view: ReactEditText, includepad: Boolean) {
    view.includeFontPadding = includepad
  }

  @ReactProp(name = "importantForAutofill")
  public fun setImportantForAutofill(view: ReactEditText, value: String?) {
    var mode = View.IMPORTANT_FOR_AUTOFILL_AUTO
    when (value) {
      "no" -> mode = View.IMPORTANT_FOR_AUTOFILL_NO
      "noExcludeDescendants" -> mode = View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS
      "yes" -> mode = View.IMPORTANT_FOR_AUTOFILL_YES
      "yesExcludeDescendants" -> mode = View.IMPORTANT_FOR_AUTOFILL_YES_EXCLUDE_DESCENDANTS
    }
    setImportantForAutofill(view, mode)
  }

  private fun setImportantForAutofill(view: ReactEditText, mode: Int) {
    // Autofill hints were added in Android API 26.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    view.importantForAutofill = mode
  }

  private fun setAutofillHints(view: ReactEditText, vararg hints: String) {
    // Autofill hints were added in Android API 26.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    view.setAutofillHints(*hints)
  }

  @ReactProp(name = "onSelectionChange", defaultBoolean = false)
  public fun setOnSelectionChange(view: ReactEditText, onSelectionChange: Boolean) {
    if (onSelectionChange) {
      view.setSelectionWatcher(ReactTextSelectionWatcher(view))
    } else {
      view.setSelectionWatcher(null)
    }
  }

  @ReactProp(name = "submitBehavior")
  public fun setSubmitBehavior(view: ReactEditText, submitBehavior: String?) {
    view.submitBehavior = submitBehavior
  }

  @ReactProp(name = "onContentSizeChange", defaultBoolean = false)
  public fun setOnContentSizeChange(view: ReactEditText, onContentSizeChange: Boolean) {
    if (onContentSizeChange) {
      view.setContentSizeWatcher(ReactTextContentSizeWatcher(view))
    } else {
      view.setContentSizeWatcher(null)
    }
  }

  @ReactProp(name = "onScroll", defaultBoolean = false)
  public fun setOnScroll(view: ReactEditText, onScroll: Boolean) {
    if (onScroll) {
      view.setScrollWatcher(ReactTextScrollWatcher(view))
    } else {
      view.setScrollWatcher(null)
    }
  }

  @ReactProp(name = "onKeyPress", defaultBoolean = false)
  public fun setOnKeyPress(view: ReactEditText, onKeyPress: Boolean) {
    view.setOnKeyPress(onKeyPress)
  }

  // Sets the letter spacing as an absolute point size.
  // This extra handling is required for the
  // correct display of spacing in placeholder (hint) text.
  @ReactProp(name = ViewProps.LETTER_SPACING, defaultFloat = 0f)
  public fun setLetterSpacing(view: ReactEditText, letterSpacing: Float) {
    view.setLetterSpacingPt(letterSpacing)
  }

  @ReactProp(name = ViewProps.ALLOW_FONT_SCALING, defaultBoolean = true)
  public fun setAllowFontScaling(view: ReactEditText, allowFontScaling: Boolean) {
    view.setAllowFontScaling(allowFontScaling)
  }

  @ReactProp(name = "placeholder")
  public fun setPlaceholder(view: ReactEditText, placeholder: String?) {
    view.setPlaceholder(placeholder)
  }

  @ReactProp(name = "placeholderTextColor", customType = "Color")
  public fun setPlaceholderTextColor(view: ReactEditText, color: Int?) {
    if (color == null) {
      view.setHintTextColor(getDefaultTextColorHint(view.context))
    } else {
      view.setHintTextColor(color)
    }
  }

  @ReactProp(name = "selectionColor", customType = "Color")
  public fun setSelectionColor(view: ReactEditText, color: Int?) {
    if (color == null) {
      view.highlightColor = getDefaultTextColorHighlight(view.context)
    } else {
      view.highlightColor = color
    }
  }

  @ReactProp(name = "selectionHandleColor", customType = "Color")
  public fun setSelectionHandleColor(view: ReactEditText, color: Int?) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val drawableCenter = checkNotNull(view.textSelectHandle?.mutate())
      val drawableLeft = checkNotNull(view.textSelectHandleLeft?.mutate())
      val drawableRight = checkNotNull(view.textSelectHandleRight?.mutate())
      if (color != null) {
        val filter = BlendModeColorFilter(color, BlendMode.SRC_IN)
        drawableCenter.colorFilter = filter
        drawableLeft.colorFilter = filter
        drawableRight.colorFilter = filter
      } else {
        drawableCenter.clearColorFilter()
        drawableLeft.clearColorFilter()
        drawableRight.clearColorFilter()
      }
      view.setTextSelectHandle(drawableCenter)
      view.setTextSelectHandleLeft(drawableLeft)
      view.setTextSelectHandleRight(drawableRight)
      return
    }

    // Based on https://github.com/facebook/react-native/pull/31007
    if (Build.VERSION.SDK_INT == Build.VERSION_CODES.P) {
      return
    }

    // The following code uses reflection to change handles color on Android 8.1 and below.
    for (i in DRAWABLE_HANDLE_RESOURCES.indices) {
      try {
        val drawableResourceField = view.javaClass.getDeclaredField(DRAWABLE_HANDLE_RESOURCES[i])
        drawableResourceField.isAccessible = true
        val resourceId = drawableResourceField.getInt(view)

        // The view has no handle drawable.
        if (resourceId == 0) {
          return
        }

        val drawable = checkNotNull(ContextCompat.getDrawable(view.context, resourceId)?.mutate())
        if (color != null) {
          @Suppress("DEPRECATION") drawable.setColorFilter(color, PorterDuff.Mode.SRC_IN)
        } else {
          drawable.clearColorFilter()
        }

        val editorField = TextView::class.java.getDeclaredField("mEditor")
        editorField.isAccessible = true
        val editor = checkNotNull(editorField[view])

        val cursorDrawableField = editor.javaClass.getDeclaredField(DRAWABLE_HANDLE_FIELDS[i])
        cursorDrawableField.isAccessible = true
        cursorDrawableField[editor] = drawable
      } catch (_: NoSuchFieldException) {} catch (_: IllegalAccessException) {}
    }
  }

  @ReactProp(name = "cursorColor", customType = "Color")
  public fun setCursorColor(view: ReactEditText, color: Int?) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val cursorDrawable = view.textCursorDrawable
      if (cursorDrawable != null) {
        if (color != null) {
          cursorDrawable.colorFilter = BlendModeColorFilter(color, BlendMode.SRC_IN)
        } else {
          cursorDrawable.clearColorFilter()
        }
        view.textCursorDrawable = cursorDrawable
      }
      return
    }

    if (Build.VERSION.SDK_INT == Build.VERSION_CODES.P) {
      // Pre-Android 10, there was no supported API to change the cursor color programmatically.
      // In Android 9.0, they changed the underlying implementation,
      // but also "dark greylisted" the new field, rendering it unusable.
      return
    }

    // The evil code that follows uses reflection to achieve this on Android 8.1 and below.
    // Based on https://tinyurl.com/3vff8lyu https://tinyurl.com/vehggzs9
    try {
      val drawableCursorField = view.javaClass.getDeclaredField("mCursorDrawableRes")
      drawableCursorField.isAccessible = true
      val resourceId = drawableCursorField.getInt(view)

      // The view has no cursor drawable.
      if (resourceId == 0) {
        return
      }

      val drawable = checkNotNull(ContextCompat.getDrawable(view.context, resourceId)?.mutate())
      if (color != null) {
        @Suppress("DEPRECATION") drawable.setColorFilter(color, PorterDuff.Mode.SRC_IN)
      } else {
        drawable.clearColorFilter()
      }

      val editorField = TextView::class.java.getDeclaredField("mEditor")
      editorField.isAccessible = true
      val editor = checkNotNull(editorField[view])

      val cursorDrawableField = editor.javaClass.getDeclaredField("mCursorDrawable")
      cursorDrawableField.isAccessible = true
      val drawables = arrayOf(drawable, drawable)
      cursorDrawableField[editor] = drawables
    } catch (_: NoSuchFieldException) {
      // Ignore errors to avoid crashing if these private fields don't exist on modified
      // or future android versions.
    } catch (_: IllegalAccessException) {}
  }

  @ReactProp(name = "caretHidden", defaultBoolean = false)
  public fun setCaretHidden(view: ReactEditText, caretHidden: Boolean) {
    if (
        view.stagedInputType == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS &&
            shouldHideCursorForEmailTextInput()
    ) {
      return
    }
    view.isCursorVisible = !caretHidden
  }

  @ReactProp(name = "contextMenuHidden", defaultBoolean = false)
  public fun setContextMenuHidden(view: ReactEditText, contextMenuHidden: Boolean) {
    view.setContextMenuHidden(contextMenuHidden)
  }

  @ReactProp(name = "selectTextOnFocus", defaultBoolean = false)
  public fun setSelectTextOnFocus(view: ReactEditText, selectTextOnFocus: Boolean) {
    view.setSelectTextOnFocus(selectTextOnFocus)
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public fun setColor(view: ReactEditText, color: Int?) {
    if (color == null) {
      val defaultContextTextColor = getDefaultTextColor(view.context)

      if (defaultContextTextColor != null) {
        view.setTextColor(defaultContextTextColor)
      } else {
        val c = view.context
        logSoftException(
            TAG,
            IllegalStateException(
                "Could not get default text color from View Context: " +
                    (if (c != null) c.javaClass.canonicalName else "null")
            ),
        )
      }
    } else {
      view.setTextColor(color)
    }
  }

  @ReactProp(name = "underlineColorAndroid", customType = "Color")
  public fun setUnderlineColor(view: ReactEditText, underlineColor: Int?) {
    // Drawable.mutate() can sometimes crash due to an AOSP bug:
    // See https://code.google.com/p/android/issues/detail?id=191754 for more info
    val background = view.background
    var drawableToMutate = background

    if (background == null) {
      return
    }

    if (background.constantState != null) {
      try {
        drawableToMutate = checkNotNull(background.mutate())
      } catch (e: NullPointerException) {
        FLog.e(TAG, "NullPointerException when setting underlineColorAndroid for TextInput", e)
      }
    }

    if (underlineColor == null) {
      drawableToMutate.clearColorFilter()
    } else {
      @Suppress("DEPRECATION")
      drawableToMutate.setColorFilter(underlineColor, PorterDuff.Mode.SRC_IN)
    }
  }

  @SuppressLint("WrongConstant")
  @ReactProp(name = ViewProps.TEXT_ALIGN)
  public fun setTextAlign(view: ReactEditText, textAlign: String?) {
    if ("justify" == textAlign) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        view.justificationMode = Layout.JUSTIFICATION_MODE_INTER_WORD
      }
      view.gravityHorizontal = Gravity.LEFT
    } else {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        view.justificationMode = Layout.JUSTIFICATION_MODE_NONE
      }

      when (textAlign) {
        null,
        "auto" -> view.gravityHorizontal = Gravity.NO_GRAVITY
        "left" -> view.gravityHorizontal = Gravity.LEFT
        "right" -> view.gravityHorizontal = Gravity.RIGHT
        "center" -> view.gravityHorizontal = Gravity.CENTER_HORIZONTAL
        else -> {
          FLog.w(ReactConstants.TAG, "Invalid textAlign: $textAlign")
          view.gravityHorizontal = Gravity.NO_GRAVITY
        }
      }
    }
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN_VERTICAL)
  public fun setTextAlignVertical(view: ReactEditText, textAlignVertical: String?) {
    when (textAlignVertical) {
      null,
      "auto" -> view.gravityVertical = Gravity.NO_GRAVITY
      "top" -> view.gravityVertical = Gravity.TOP
      "bottom" -> view.gravityVertical = Gravity.BOTTOM
      "center" -> view.gravityVertical = Gravity.CENTER_VERTICAL
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid textAlignVertical: $textAlignVertical")
        view.gravityVertical = Gravity.NO_GRAVITY
      }
    }
  }

  @ReactProp(name = "inlineImageLeft")
  public fun setInlineImageLeft(view: ReactEditText, resource: String?) {
    val id = ResourceDrawableIdHelper.getResourceDrawableId(view.context, resource)
    view.setCompoundDrawablesWithIntrinsicBounds(id, 0, 0, 0)
  }

  @ReactProp(name = "inlineImagePadding")
  public fun setInlineImagePadding(view: ReactEditText, padding: Int) {
    view.compoundDrawablePadding = padding
  }

  @ReactProp(name = "editable", defaultBoolean = true)
  public fun setEditable(view: ReactEditText, editable: Boolean) {
    view.isEnabled = editable
  }

  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = 1)
  public fun setNumLines(view: ReactEditText, numLines: Int) {
    view.setLines(numLines)
  }

  @ReactProp(name = "maxLength")
  public fun setMaxLength(view: ReactEditText, maxLength: Int?) {
    val currentFilters = view.filters
    var newFilters = EMPTY_FILTERS

    if (maxLength == null) {
      if (currentFilters.isNotEmpty()) {
        val list = LinkedList<InputFilter?>()
        for (currentFilter in currentFilters) {
          if (currentFilter !is LengthFilter) {
            list.add(currentFilter)
          }
        }
        if (!list.isEmpty()) {
          newFilters = list.toTypedArray<InputFilter?>()
        }
      }
    } else {
      if (currentFilters.isNotEmpty()) {
        newFilters = currentFilters
        var replaced = false
        for (i in currentFilters.indices) {
          if (currentFilters[i] is LengthFilter) {
            currentFilters[i] = LengthFilter(maxLength)
            replaced = true
          }
        }
        if (!replaced) {
          newFilters = arrayOfNulls(currentFilters.size + 1)
          System.arraycopy(currentFilters, 0, newFilters, 0, currentFilters.size)
          currentFilters[currentFilters.size] = LengthFilter(maxLength)
        }
      } else {
        newFilters = arrayOfNulls(1)
        newFilters[0] = LengthFilter(maxLength)
      }
    }

    view.filters = newFilters
  }

  @ReactProp(name = "autoComplete")
  public fun setTextContentType(view: ReactEditText, autoComplete: String?) {
    when {
      autoComplete == null -> setImportantForAutofill(view, View.IMPORTANT_FOR_AUTOFILL_NO)
      "off" == autoComplete -> setImportantForAutofill(view, View.IMPORTANT_FOR_AUTOFILL_NO)
      REACT_PROPS_AUTOFILL_HINTS_MAP.containsKey(autoComplete) ->
          setAutofillHints(view, checkNotNull(REACT_PROPS_AUTOFILL_HINTS_MAP[autoComplete]))
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid autoComplete: $autoComplete")
        setImportantForAutofill(view, View.IMPORTANT_FOR_AUTOFILL_NO)
      }
    }
  }

  @ReactProp(name = "autoCorrect")
  public fun setAutoCorrect(view: ReactEditText, autoCorrect: Boolean?) {
    // clear auto correct flags, set SUGGESTIONS or NO_SUGGESTIONS depending on value
    updateStagedInputTypeFlag(
        view = view,
        flagsToUnset =
            InputType.TYPE_TEXT_FLAG_AUTO_CORRECT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS,
        flagsToSet =
            when (autoCorrect) {
              true -> InputType.TYPE_TEXT_FLAG_AUTO_CORRECT
              false -> InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
              else -> 0
            },
    )
  }

  @ReactProp(name = "multiline", defaultBoolean = false)
  public fun setMultiline(view: ReactEditText, multiline: Boolean) {
    updateStagedInputTypeFlag(
        view = view,
        flagsToUnset = if (multiline) 0 else InputType.TYPE_TEXT_FLAG_MULTI_LINE,
        flagsToSet = if (multiline) InputType.TYPE_TEXT_FLAG_MULTI_LINE else 0,
    )
  }

  @ReactProp(name = "secureTextEntry", defaultBoolean = false)
  public fun setSecureTextEntry(view: ReactEditText, password: Boolean) {
    updateStagedInputTypeFlag(
        view = view,
        flagsToUnset =
            if (password) {
              InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            } else {
              InputType.TYPE_NUMBER_VARIATION_PASSWORD or InputType.TYPE_TEXT_VARIATION_PASSWORD
            },
        flagsToSet = if (password) InputType.TYPE_TEXT_VARIATION_PASSWORD else 0,
    )
    checkPasswordType(view)
  }

  // This prop temporarily takes both numbers and strings.
  // Number values are deprecated and will be removed in a future release.
  // See T46146267
  @ReactProp(name = "autoCapitalize")
  public fun setAutoCapitalize(view: ReactEditText, autoCapitalize: Dynamic) {
    var autoCapitalizeValue = InputType.TYPE_TEXT_FLAG_CAP_SENTENCES

    if (autoCapitalize.type == ReadableType.Number) {
      autoCapitalizeValue = autoCapitalize.asInt()
    } else if (autoCapitalize.type == ReadableType.String) {
      val autoCapitalizeStr = autoCapitalize.asString()
      when (autoCapitalizeStr) {
        "none" -> autoCapitalizeValue = 0
        "characters" -> autoCapitalizeValue = InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
        "words" -> autoCapitalizeValue = InputType.TYPE_TEXT_FLAG_CAP_WORDS
        "sentences" -> autoCapitalizeValue = InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
      }
    }

    // Deferred to onAfterUpdateTransaction() so we can reconcile with the resolved
    // keyboard type — AUTOCAPITALIZE_FLAGS collides with numeric inputType flags.
    view.stagedAutoCapitalize = autoCapitalizeValue
  }

  @ReactProp(name = "keyboardType")
  public fun setKeyboardType(view: ReactEditText, keyboardType: String?) {
    var flagsToSet = InputType.TYPE_CLASS_TEXT
    if (KEYBOARD_TYPE_NUMERIC.equals(keyboardType, ignoreCase = true)) {
      flagsToSet = INPUT_TYPE_KEYBOARD_NUMBERED
    } else if (KEYBOARD_TYPE_NUMBER_PAD.equals(keyboardType, ignoreCase = true)) {
      flagsToSet = INPUT_TYPE_KEYBOARD_NUMBER_PAD
    } else if (KEYBOARD_TYPE_DECIMAL_PAD.equals(keyboardType, ignoreCase = true)) {
      flagsToSet = INPUT_TYPE_KEYBOARD_DECIMAL_PAD
    } else if (KEYBOARD_TYPE_EMAIL_ADDRESS.equals(keyboardType, ignoreCase = true)) {
      flagsToSet = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS or InputType.TYPE_CLASS_TEXT

      // Set cursor's visibility to False to fix a crash on some Xiaomi devices with Android Q. This
      // crash happens when focusing on a email EditText, during which a prompt will be triggered
      // but
      // the system fail to locate it properly. Here is an example post discussing about this
      // issue: https://github.com/facebook/react-native/issues/27204
      if (shouldHideCursorForEmailTextInput()) {
        view.isCursorVisible = false
      }
    } else if (KEYBOARD_TYPE_PHONE_PAD.equals(keyboardType, ignoreCase = true)) {
      flagsToSet = InputType.TYPE_CLASS_PHONE
    } else if (KEYBOARD_TYPE_VISIBLE_PASSWORD.equals(keyboardType, ignoreCase = true)) {
      // This will supersede secureTextEntry={false}. If it doesn't, due to the way
      //  the flags work out, the underlying field will end up a URI-type field.
      flagsToSet = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
    } else if (KEYBOARD_TYPE_URI.equals(keyboardType, ignoreCase = true)) {
      flagsToSet = InputType.TYPE_TEXT_VARIATION_URI
    }

    updateStagedInputTypeFlag(view, InputType.TYPE_MASK_CLASS, flagsToSet)
    checkPasswordType(view)
  }

  @ReactProp(name = "returnKeyType")
  public fun setReturnKeyType(view: ReactEditText, returnKeyType: String?) {
    view.returnKeyType = returnKeyType
  }

  @ReactProp(name = "acceptDragAndDropTypes")
  public fun setAcceptDragAndDropTypes(
      view: ReactEditText,
      acceptDragAndDropTypes: ReadableArray?,
  ) {
    if (acceptDragAndDropTypes == null) {
      view.dragAndDropFilter = null
    } else {
      val acceptedTypes = mutableListOf<String>()
      for (i in 0 until acceptDragAndDropTypes.size()) {
        acceptDragAndDropTypes.getString(i)?.also(acceptedTypes::add)
      }
      view.dragAndDropFilter = acceptedTypes
    }
  }

  @ReactProp(name = "disableFullscreenUI", defaultBoolean = false)
  public fun setDisableFullscreenUI(view: ReactEditText, disableFullscreenUI: Boolean) {
    view.disableFullscreenUI = disableFullscreenUI
  }

  @ReactProp(name = "returnKeyLabel")
  public fun setReturnKeyLabel(view: ReactEditText, returnKeyLabel: String?) {
    view.setImeActionLabel(returnKeyLabel, IME_ACTION_ID)
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
  public fun setBorderRadius(view: ReactEditText, index: Int, borderRadius: Float) {
    val radius =
        if (borderRadius.isNaN()) {
          null
        } else {
          LengthPercentage(borderRadius, LengthPercentageType.POINT)
        }
    setBorderRadius(view, BorderRadiusProp.entries[index], radius)
  }

  @ReactProp(name = "borderStyle")
  public fun setBorderStyle(view: ReactEditText, borderStyle: String?) {
    val parsedBorderStyle = borderStyle?.let { fromString(it) }
    setBorderStyle(view, parsedBorderStyle)
  }

  @ReactProp(name = "showSoftInputOnFocus", defaultBoolean = true)
  public fun showKeyboardOnFocus(view: ReactEditText, showKeyboardOnFocus: Boolean) {
    view.showSoftInputOnFocus = showKeyboardOnFocus
  }

  @ReactProp(name = "autoFocus", defaultBoolean = false)
  public fun setAutoFocus(view: ReactEditText, autoFocus: Boolean) {
    view.setAutoFocus(autoFocus)
  }

  @ReactProp(name = ViewProps.TEXT_DECORATION_LINE)
  public fun setTextDecorationLine(view: ReactEditText, textDecorationLineString: String?) {
    view.paintFlags =
        view.paintFlags and (Paint.STRIKE_THRU_TEXT_FLAG or Paint.UNDERLINE_TEXT_FLAG).inv()

    if (textDecorationLineString == null) {
      return
    }
    for (token in
        textDecorationLineString
            .split(" ".toRegex())
            .dropLastWhile { it.isEmpty() }
            .toTypedArray()) {
      if (token == "underline") {
        view.paintFlags = view.paintFlags or Paint.UNDERLINE_TEXT_FLAG
      } else if (token == "line-through") {
        view.paintFlags = view.paintFlags or Paint.STRIKE_THRU_TEXT_FLAG
      }
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
  public fun setBorderWidth(view: ReactEditText, index: Int, width: Float) {
    setBorderWidth(view, LogicalEdge.entries[index], width)
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
  public fun setBorderColor(view: ReactEditText, index: Int, color: Int?) {
    setBorderColor(view, LogicalEdge.ALL, color)
  }

  @ReactProp(name = "overflow")
  public fun setOverflow(view: ReactEditText, overflow: String?) {
    view.setOverflow(overflow)
  }

  override fun onAfterUpdateTransaction(view: ReactEditText) {
    super.onAfterUpdateTransaction(view)
    view.maybeUpdateTypeface()
    reconcileAutoCapitalize(view)
    view.commitStagedInputType()
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, editText: ReactEditText) {
    editText.setEventDispatcher(getEventDispatcher(reactContext, editText))
    editText.addTextChangedListener(ReactTextInputTextWatcher(reactContext, editText))

    // Implements focus/blur dispatching on behalf of BaseViewManager since only one focus listener
    // can be set on a view instance
    editText.onFocusChangeListener = OnFocusChangeListener { _: View?, hasFocus: Boolean ->
      val surfaceId = reactContext.surfaceId
      val eventDispatcher = getEventDispatcher(reactContext, editText)
      if (hasFocus) {
        eventDispatcher?.dispatchEvent(FocusEvent(surfaceId, editText.id))
      } else {
        eventDispatcher?.dispatchEvent(BlurEvent(surfaceId, editText.id))
        eventDispatcher?.dispatchEvent(
            ReactTextInputEndEditingEvent(surfaceId, editText.id, editText.text.toString())
        )
      }
    }

    editText.setOnEditorActionListener { _: TextView?, actionId: Int, _: KeyEvent? ->
      if ((actionId and EditorInfo.IME_MASK_ACTION) != 0 || actionId == EditorInfo.IME_NULL) {
        val isMultiline = editText.isMultiline

        val shouldSubmit = editText.shouldSubmitOnReturn()
        val shouldBlur = editText.shouldBlurOnReturn()

        // Motivation:
        // * shouldSubmit => Clear focus; prevent default behavior (return true);
        // * shouldBlur => Submit; prevent default behavior (return true);
        // * !shouldBlur && !shouldSubmit && isMultiline => Perform default behavior (return
        // false);
        // * !shouldBlur && !shouldSubmit && !isMultiline => Prevent default behavior (return
        // true);
        if (shouldSubmit) {
          val eventDispatcher = getEventDispatcher(reactContext, editText)
          eventDispatcher?.dispatchEvent(
              ReactTextInputSubmitEditingEvent(
                  reactContext.surfaceId,
                  editText.id,
                  editText.text.toString(),
              )
          )
        }

        if (shouldBlur) {
          editText.clearFocusAndMaybeRefocus()
        }

        // Prevent default behavior except when we want it to insert a newline.
        if (shouldBlur || shouldSubmit || !isMultiline) {
          return@setOnEditorActionListener true
        }

        // If we've reached this point, it means that the TextInput has 'submitBehavior' set
        // nullish and 'multiline' set to true. But it's still possible to get IME_ACTION_NEXT
        // and IME_ACTION_PREVIOUS here in case if 'disableFullscreenUI' is false and Android
        // decides to render this EditText in the full screen mode (when a phone has the
        // landscape orientation for example). The full screen EditText also renders an action
        // button specified by the 'returnKeyType' prop. We have to prevent Android from
        // requesting focus from the next/previous focusable view since it must only be
        // controlled from JS.
        return@setOnEditorActionListener actionId == EditorInfo.IME_ACTION_NEXT ||
            actionId == EditorInfo.IME_ACTION_PREVIOUS
      }
      true
    }
  }

  override fun getExportedViewConstants(): Map<String, Any> =
      mapOf(
          "AutoCapitalizationType" to
              mapOf(
                  "none" to 0,
                  "characters" to InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS,
                  "words" to InputType.TYPE_TEXT_FLAG_CAP_WORDS,
                  "sentences" to InputType.TYPE_TEXT_FLAG_CAP_SENTENCES,
              )
      )

  override fun setPadding(view: ReactEditText, left: Int, top: Int, right: Int, bottom: Int) {
    view.setPadding(left, top, right, bottom)
  }

  override fun updateState(
      view: ReactEditText,
      props: ReactStylesDiffMap,
      stateWrapper: StateWrapper,
  ): Any? {
    if (ReactEditText.DEBUG_MODE) {
      FLog.e(TAG, "updateState: [${view.id}]")
    }

    val stateManager = view.stateWrapper
    if (stateManager == null) {
      // HACK: In Fabric, we assume all components start off with zero padding, which is
      // not true for TextInput components. We expose the theme's default padding via
      // AndroidTextInputComponentDescriptor, which will be applied later though setPadding.
      // TODO T58784068: move this constructor once Fabric is shipped
      view.setPadding(0, 0, 0, 0)
    }

    view.stateWrapper = stateWrapper

    val stateMapBuffer: MapBuffer? = stateWrapper.stateDataMapBuffer
    if (stateMapBuffer != null) {
      return getReactTextUpdate(view, props, stateMapBuffer)
    }

    return null
  }

  public fun getReactTextUpdate(
      view: ReactEditText,
      props: ReactStylesDiffMap,
      state: MapBuffer,
  ): Any? {
    // If native wants to update the state wrapper but the state data hasn't actually
    // changed, the MapBuffer may be empty
    if (state.count == 0) {
      return null
    }

    val attributedString = state.getMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING.toInt())
    val paragraphAttributes = state.getMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES.toInt())

    val spanned =
        TextLayoutManager.getOrCreateSpannableForText(
            view.context.assets,
            attributedString,
            reactTextViewManagerCallback,
        )

    val textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(
            paragraphAttributes.getString(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY.toInt())
        )
    val currentJustificationMode =
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
          0
        } else {
          view.justificationMode
        }

    return buildReactTextUpdateFromState(
        spanned,
        state.getInt(TX_STATE_KEY_MOST_RECENT_EVENT_COUNT.toInt()),
        TextAttributeProps.getTextAlignment(
            props,
            TextLayoutManager.isRTL(attributedString),
            view.gravityHorizontal,
        ),
        textBreakStrategy,
        TextAttributeProps.getJustificationMode(props, currentJustificationMode),
    )
  }

  public companion object {
    public val TAG: String = ReactTextInputManager::class.java.simpleName
    public const val REACT_CLASS: String = "AndroidTextInput"

    // See also ReactTextViewManager
    private const val TX_STATE_KEY_ATTRIBUTED_STRING: Short = 0
    private const val TX_STATE_KEY_PARAGRAPH_ATTRIBUTES: Short = 1
    // private const val TX_STATE_KEY_HASH: Short = 2
    private const val TX_STATE_KEY_MOST_RECENT_EVENT_COUNT: Short = 3

    private val REACT_PROPS_AUTOFILL_HINTS_MAP: Map<String, String> =
        mapOf(
            "2fa-app-otp" to HintConstants.AUTOFILL_HINT_2FA_APP_OTP,
            "birthdate-day" to HintConstants.AUTOFILL_HINT_BIRTH_DATE_DAY,
            "birthdate-full" to HintConstants.AUTOFILL_HINT_BIRTH_DATE_FULL,
            "birthdate-month" to HintConstants.AUTOFILL_HINT_BIRTH_DATE_MONTH,
            "birthdate-year" to HintConstants.AUTOFILL_HINT_BIRTH_DATE_YEAR,
            "cc-csc" to HintConstants.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE,
            "cc-exp" to HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE,
            "cc-exp-day" to HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DAY,
            "cc-exp-month" to HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH,
            "cc-exp-year" to HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR,
            "cc-number" to HintConstants.AUTOFILL_HINT_CREDIT_CARD_NUMBER,
            "email" to HintConstants.AUTOFILL_HINT_EMAIL_ADDRESS,
            "email-otp" to HintConstants.AUTOFILL_HINT_EMAIL_OTP,
            "flight-confirmation-code" to HintConstants.AUTOFILL_HINT_FLIGHT_CONFIRMATION_CODE,
            "flight-number" to HintConstants.AUTOFILL_HINT_FLIGHT_NUMBER,
            "gender" to HintConstants.AUTOFILL_HINT_GENDER,
            "gift-card-number" to HintConstants.AUTOFILL_HINT_GIFT_CARD_NUMBER,
            "gift-card-pin" to HintConstants.AUTOFILL_HINT_GIFT_CARD_PIN,
            "loyalty-account-number" to HintConstants.AUTOFILL_HINT_LOYALTY_ACCOUNT_NUMBER,
            "name" to HintConstants.AUTOFILL_HINT_PERSON_NAME,
            "name-family" to HintConstants.AUTOFILL_HINT_PERSON_NAME_FAMILY,
            "name-given" to HintConstants.AUTOFILL_HINT_PERSON_NAME_GIVEN,
            "name-middle" to HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE,
            "name-middle-initial" to HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE_INITIAL,
            "name-prefix" to HintConstants.AUTOFILL_HINT_PERSON_NAME_PREFIX,
            "name-suffix" to HintConstants.AUTOFILL_HINT_PERSON_NAME_SUFFIX,
            "password" to HintConstants.AUTOFILL_HINT_PASSWORD,
            "password-new" to HintConstants.AUTOFILL_HINT_NEW_PASSWORD,
            "postal-address" to HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS,
            "postal-address-country" to HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_COUNTRY,
            "postal-address-dependent-locality" to
                HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_DEPENDENT_LOCALITY,
            "postal-address-extended" to
                HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_EXTENDED_ADDRESS,
            "postal-address-extended-postal-code" to
                HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_EXTENDED_POSTAL_CODE,
            "postal-address-locality" to HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_LOCALITY,
            "postal-address-region" to HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_REGION,
            "postal-address-unit" to HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_APT_NUMBER,
            "postal-code" to HintConstants.AUTOFILL_HINT_POSTAL_CODE,
            "promo-code" to HintConstants.AUTOFILL_HINT_PROMO_CODE,
            "street-address" to HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_STREET_ADDRESS,
            "sms-otp" to HintConstants.AUTOFILL_HINT_SMS_OTP,
            "tel" to HintConstants.AUTOFILL_HINT_PHONE_NUMBER,
            "tel-country-code" to HintConstants.AUTOFILL_HINT_PHONE_COUNTRY_CODE,
            "tel-national" to HintConstants.AUTOFILL_HINT_PHONE_NATIONAL,
            "tel-device" to HintConstants.AUTOFILL_HINT_PHONE_NUMBER_DEVICE,
            "upi-vpa" to HintConstants.AUTOFILL_HINT_UPI_VPA,
            "wifi-password" to HintConstants.AUTOFILL_HINT_WIFI_PASSWORD,
            "username" to HintConstants.AUTOFILL_HINT_USERNAME,
            "username-new" to HintConstants.AUTOFILL_HINT_NEW_USERNAME,
        )

    private const val FOCUS_TEXT_INPUT = 1
    private const val BLUR_TEXT_INPUT = 2
    private const val SET_MOST_RECENT_EVENT_COUNT = 3
    private const val SET_TEXT_AND_SELECTION = 4

    private const val INPUT_TYPE_KEYBOARD_NUMBER_PAD = InputType.TYPE_CLASS_NUMBER
    private const val INPUT_TYPE_KEYBOARD_DECIMAL_PAD =
        INPUT_TYPE_KEYBOARD_NUMBER_PAD or InputType.TYPE_NUMBER_FLAG_DECIMAL
    private const val INPUT_TYPE_KEYBOARD_NUMBERED =
        INPUT_TYPE_KEYBOARD_DECIMAL_PAD or InputType.TYPE_NUMBER_FLAG_SIGNED
    private const val AUTOCAPITALIZE_FLAGS =
        (InputType.TYPE_TEXT_FLAG_CAP_SENTENCES or
            InputType.TYPE_TEXT_FLAG_CAP_WORDS or
            InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS)

    private const val KEYBOARD_TYPE_EMAIL_ADDRESS = "email-address"
    private const val KEYBOARD_TYPE_NUMERIC = "numeric"
    private const val KEYBOARD_TYPE_DECIMAL_PAD = "decimal-pad"
    private const val KEYBOARD_TYPE_NUMBER_PAD = "number-pad"
    private const val KEYBOARD_TYPE_PHONE_PAD = "phone-pad"
    private const val KEYBOARD_TYPE_VISIBLE_PASSWORD = "visible-password"
    private const val KEYBOARD_TYPE_URI = "url"
    private val EMPTY_FILTERS = arrayOfNulls<InputFilter>(0)
    private const val UNSET = -1
    private val DRAWABLE_HANDLE_RESOURCES =
        arrayOf("mTextSelectHandleLeftRes", "mTextSelectHandleRightRes", "mTextSelectHandleRes")
    private val DRAWABLE_HANDLE_FIELDS =
        arrayOf("mSelectHandleLeft", "mSelectHandleRight", "mSelectHandleCenter")

    private fun shouldHideCursorForEmailTextInput(): Boolean {
      val manufacturer = Build.MANUFACTURER.lowercase()
      return (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q && manufacturer.contains("xiaomi"))
    }

    private const val IME_ACTION_ID = 0x670

    // AUTOCAPITALIZE_FLAGS (0x7000) shares bit positions with TYPE_NUMBER_FLAG_SIGNED
    // (0x1000) and TYPE_NUMBER_FLAG_DECIMAL (0x2000). We apply autocapitalize here
    // after all props are set so the resolved input class determines whether the
    // flags are meaningful.
    private fun reconcileAutoCapitalize(view: ReactEditText) {
      val autoCapValue = view.stagedAutoCapitalize
      val inputClass = view.stagedInputType and InputType.TYPE_MASK_CLASS

      // Only strip 0x4000 (CAP_SENTENCES) for non-text classes — 0x1000/0x2000 are
      // valid numeric flags (SIGNED/DECIMAL) and must not be cleared.
      val reconciled =
          if (inputClass == InputType.TYPE_CLASS_TEXT) {
            (view.stagedInputType and AUTOCAPITALIZE_FLAGS.inv()) or autoCapValue
          } else {
            view.stagedInputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES.inv()
          }

      if (view.stagedInputType != reconciled) {
        view.stagedInputType = reconciled
      }
    }

    // Sets the correct password type, since numeric and text passwords have different types
    private fun checkPasswordType(view: ReactEditText) {
      if (
          (view.stagedInputType and INPUT_TYPE_KEYBOARD_NUMBERED) != 0 &&
              (view.stagedInputType and InputType.TYPE_TEXT_VARIATION_PASSWORD) != 0
      ) {
        // Text input type is numbered password, remove text password variation, add numeric one
        updateStagedInputTypeFlag(
            view,
            InputType.TYPE_TEXT_VARIATION_PASSWORD,
            InputType.TYPE_NUMBER_VARIATION_PASSWORD,
        )
      }
    }

    private fun updateStagedInputTypeFlag(view: ReactEditText, flagsToUnset: Int, flagsToSet: Int) {
      view.stagedInputType = (view.stagedInputType and flagsToUnset.inv()) or flagsToSet
    }

    private fun getEventDispatcher(
        reactContext: ReactContext,
        editText: ReactEditText,
    ): EventDispatcher? = UIManagerHelper.getEventDispatcher(reactContext)
  }
}
