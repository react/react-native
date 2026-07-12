/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.TextPaint
import android.text.TextUtils
import android.text.TextWatcher
import android.text.method.KeyListener
import android.text.method.QwertyKeyListener
import android.util.TypedValue
import android.view.ActionMode
import android.view.DragEvent
import android.view.Gravity
import android.view.KeyEvent
import android.view.Menu
import android.view.MenuItem
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityNodeInfo
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.widget.AppCompatEditText
import androidx.core.graphics.withTranslation
import androidx.core.util.Predicate
import androidx.core.view.ViewCompat
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.uimanager.BackgroundStyleApplicator.clipToPaddingBox
import com.facebook.react.uimanager.BackgroundStyleApplicator.getBackgroundColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.getBorderColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBackgroundColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderRadius
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderStyle
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderWidth
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.uimanager.style.Overflow
import com.facebook.react.views.text.ReactTextUpdate
import com.facebook.react.views.text.ReactTypefaceUtils.applyStyles
import com.facebook.react.views.text.ReactTypefaceUtils.getFontWeightAdjustment
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontStyle
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontWeight
import com.facebook.react.views.text.TextAttributes
import com.facebook.react.views.text.TextLayoutManager
import com.facebook.react.views.text.internal.span.CanvasEffectSpan
import com.facebook.react.views.text.internal.span.CustomLetterSpacingSpan
import com.facebook.react.views.text.internal.span.CustomLineHeightSpan
import com.facebook.react.views.text.internal.span.CustomStyleSpan
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.react.views.text.internal.span.ReactBackgroundColorSpan
import com.facebook.react.views.text.internal.span.ReactForegroundColorSpan
import com.facebook.react.views.text.internal.span.ReactSpan
import com.facebook.react.views.text.internal.span.ReactStrikethroughSpan
import com.facebook.react.views.text.internal.span.ReactTextPaintHolderSpan
import com.facebook.react.views.text.internal.span.ReactUnderlineSpan
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.math.max
import kotlin.math.min

/**
 * A wrapper around the EditText that lets us better control what happens when an EditText gets
 * focused or blurred, and when to display the soft keyboard and when not to.
 *
 * ReactEditTexts have setFocusableInTouchMode set to false automatically because touches on the
 * EditText are managed on the JS side. This also removes the nasty side effect that EditTexts have,
 * which is that focus is always maintained on one of the EditTexts.
 *
 * The wrapper stops the EditText from triggering *TextChanged events, in the case where JS has
 * called this explicitly. This is the default behavior on other platforms as well.
 */
public open class ReactEditText public constructor(context: Context) : AppCompatEditText(context) {
  private val inputMethodManager: InputMethodManager
  private val TAG: String = ReactEditText::class.java.simpleName

  // This flag is set to true when we set the text of the EditText explicitly. In that case, no
  // *TextChanged events should be triggered. This is less expensive than removing the text
  // listeners and adding them back again after the text change is completed.
  protected var isSettingTextFromJS: Boolean
  private val defaultGravityHorizontal: Int
  private val defaultGravityVertical: Int

  /** A count of events sent to JS or C++. */
  protected var nativeEventCount: Int

  private var listeners: CopyOnWriteArrayList<TextWatcher>?

  public var stagedInputType: Int
  internal var stagedAutoCapitalize: Int = 0
  public var submitBehavior: String? = null
  public var dragAndDropFilter: List<String>? = null

  private var disableFullscreen: Boolean
  private var selectionWatcher: SelectionWatcher? = null
  private var contentSizeWatcher: ContentSizeWatcher? = null
  private var scrollWatcher: ScrollWatcher?
  private var keyListener: InternalKeyListener? = null
  private var detectScrollMovement = false
  private var onKeyPress = false
  private val textAttributes: TextAttributes
  private var typefaceDirty = false
  private var fontFamily: String? = null
  private var fontWeight = ReactConstants.UNSET
  private var fontStyle = ReactConstants.UNSET
  private var autoFocus = false
  private var contextMenuHidden = false
  private var didAttachToWindow = false
  private var selectTextOnFocus = false
  private var placeholder: String? = null
  private var overflow = Overflow.VISIBLE
  private var wasMultiline = false

  public var stateWrapper: StateWrapper? = null
  internal var disableTextDiffing: Boolean = false
  protected var isSettingTextFromState: Boolean = false

  private var eventDispatcher: EventDispatcher? = null

  private var textWatcherDelegator: TextWatcherDelegator? = null
    get() {
      if (field == null) {
        field = TextWatcherDelegator()
      }
      return field
    }

  internal val isMultiline: Boolean
    get() = (inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE) != 0

  private val isSecureText: Boolean
    get() =
        ((inputType and
            (InputType.TYPE_NUMBER_VARIATION_PASSWORD or InputType.TYPE_TEXT_VARIATION_PASSWORD)) !=
            0)

  public var disableFullscreenUI: Boolean
    get() = disableFullscreen
    set(disableFullscreenUI) {
      disableFullscreen = disableFullscreenUI
      updateImeOptions()
    }

  public var returnKeyType: String? = null
    set(value) {
      field = value
      updateImeOptions()
    }

  internal var gravityHorizontal: Int
    get() =
        (gravity and (Gravity.HORIZONTAL_GRAVITY_MASK or Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK))
    set(value) {
      val newValue = if (value == 0) defaultGravityHorizontal else value
      gravity =
          ((gravity and
              Gravity.HORIZONTAL_GRAVITY_MASK.inv() and
              Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK.inv()) or newValue)
    }

  internal var gravityVertical: Int
    get() = gravity and (Gravity.VERTICAL_GRAVITY_MASK)
    set(value) {
      val newValue = if (value == 0) defaultGravityVertical else value
      gravity = (gravity and Gravity.VERTICAL_GRAVITY_MASK.inv()) or newValue
    }

  init {
    inputMethodManager =
        context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    defaultGravityHorizontal =
        gravity and (Gravity.HORIZONTAL_GRAVITY_MASK or Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK)
    defaultGravityVertical = gravity and Gravity.VERTICAL_GRAVITY_MASK
    nativeEventCount = 0
    isSettingTextFromJS = false
    disableFullscreen = false
    listeners = null
    stagedInputType = inputType
    if (keyListener == null) {
      keyListener = InternalKeyListener()
    }
    scrollWatcher = null
    textAttributes = TextAttributes()

    applyTextAttributes()

    // Turn off hardware acceleration for Oreo (T40484798)
    // see https://issuetracker.google.com/issues/67102093
    if (
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            Build.VERSION.SDK_INT <= Build.VERSION_CODES.O_MR1
    ) {
      setLayerType(LAYER_TYPE_SOFTWARE, null)
    }

    val editTextAccessibilityDelegate: ReactAccessibilityDelegate =
        object :
            ReactAccessibilityDelegate(
                this@ReactEditText,
                this@ReactEditText.isFocusable,
                this@ReactEditText.importantForAccessibility,
            ) {
          override fun performAccessibilityAction(host: View, action: Int, args: Bundle?): Boolean {
            if (action == AccessibilityNodeInfo.ACTION_CLICK) {
              val length = checkNotNull(text).length
              if (length > 0) {
                // For some reason, when you swipe to focus on a text input that already has text in
                // it, it clears the selection and resets the cursor to the beginning of the input.
                // Since this is not typically (ever?) what you want, let's just explicitly set the
                // selection on accessibility click to undo that.
                setSelection(length)
              }
              return requestFocusProgrammatically()
            }
            return super.performAccessibilityAction(host, action, args)
          }
        }
    ViewCompat.setAccessibilityDelegate(this, editTextAccessibilityDelegate)
    val customActionModeCallback: ActionMode.Callback =
        object : ActionMode.Callback {
          /*
           * Editor onCreateActionMode adds the cut, copy, paste, share, autofill,
           * and paste as plain text items to the context menu.
           */
          override fun onCreateActionMode(mode: ActionMode, menu: Menu): Boolean {
            if (contextMenuHidden) {
              return false
            }
            menu.removeItem(android.R.id.pasteAsPlainText)
            return true
          }

          override fun onPrepareActionMode(mode: ActionMode, menu: Menu): Boolean = true

          override fun onActionItemClicked(mode: ActionMode, item: MenuItem): Boolean = false

          override fun onDestroyActionMode(mode: ActionMode) = Unit
        }
    customSelectionActionModeCallback = customActionModeCallback
    customInsertionActionModeCallback = customActionModeCallback
  }

  @SuppressLint("ClassImplementsFinalize")
  protected fun finalize() {
    if (DEBUG_MODE) {
      FLog.e(TAG, "finalize[$id] delete cached spannable")
    }
    TextLayoutManager.deleteCachedSpannableForTag(id)
  }

  // After the text changes inside an EditText, TextView checks if a layout() has been requested.
  // If it has, it will not scroll the text to the end of the new text inserted, but wait for the
  // next layout() to be called. However, we do not perform a layout() after a requestLayout(), so
  // we need to override isLayoutRequested to force EditText to scroll to the end of the new text
  // immediately.
  // TODO: t6408636 verify if we should schedule a layout after a View does a requestLayout()
  override fun isLayoutRequested(): Boolean = false

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    onContentSizeChange()
    if (selectTextOnFocus && isFocused) {
      // Explicitly call this method to select text when layout is drawn
      selectAll()
      // Prevent text on being selected for next layout pass
      selectTextOnFocus = false
    }
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    when (ev.action) {
      MotionEvent.ACTION_DOWN -> {
        detectScrollMovement = true
        // Disallow parent views to intercept touch events, until we can detect if we should be
        // capturing these touches or not.
        this.parent.requestDisallowInterceptTouchEvent(true)
      }

      MotionEvent.ACTION_MOVE ->
          if (detectScrollMovement) {
            if (
                !canScrollVertically(-1) &&
                    !canScrollVertically(1) &&
                    !canScrollHorizontally(-1) &&
                    !canScrollHorizontally(1)
            ) {
              // We cannot scroll, let parent views take care of these touches.
              this.parent.requestDisallowInterceptTouchEvent(false)
            }
            detectScrollMovement = false
          }
    }
    return super.onTouchEvent(ev)
  }

  // Consume 'Enter' key events: TextView tries to give focus to the next TextInput, but it can't
  // since we only allow JS to change focus, which in turn causes TextView to crash.
  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    if (keyCode == KeyEvent.KEYCODE_ENTER && !isMultiline) {
      hideSoftKeyboard()
      return true
    }
    return super.onKeyUp(keyCode, event)
  }

  override fun setLineHeight(lineHeight: Int) {
    textAttributes.lineHeight = lineHeight.toFloat()
    // We don't call super.setLineHeight() because LineHeight is fully managed by ReactNative
  }

  override fun onScrollChanged(horiz: Int, vert: Int, oldHoriz: Int, oldVert: Int) {
    super.onScrollChanged(horiz, vert, oldHoriz, oldVert)
    scrollWatcher?.onScrollChanged(horiz, vert, oldHoriz, oldVert)
  }

  override fun onCreateInputConnection(outAttrs: EditorInfo): InputConnection? {
    val reactContext = UIManagerHelper.getReactContext(this)
    var inputConnection = super.onCreateInputConnection(outAttrs)
    if (inputConnection != null && onKeyPress) {
      inputConnection =
          ReactEditTextInputConnectionWrapper(
              inputConnection,
              reactContext,
              this,
              checkNotNull(eventDispatcher),
          )
    }

    if (isMultiline && (shouldBlurOnReturn() || shouldSubmitOnReturn())) {
      // Remove IME_FLAG_NO_ENTER_ACTION to keep the original IME_OPTION
      outAttrs.imeOptions = outAttrs.imeOptions and EditorInfo.IME_FLAG_NO_ENTER_ACTION.inv()
    }
    return inputConnection
  }

  /*
   * Called when a context menu option for the text view is selected.
   * React Native replaces copy (as rich text) with copy as plain text.
   */
  override fun onTextContextMenuItem(id: Int): Boolean =
      super.onTextContextMenuItem(
          if (id == android.R.id.paste) android.R.id.pasteAsPlainText else id
      )

  internal fun clearFocusAndMaybeRefocus() {
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P || !isInTouchMode) {
      super.clearFocus()
    } else {
      // Avoid refocusing to a new view on old versions of Android by default
      // by preventing `requestFocus()` on the rootView from moving focus to any child.
      // https://cs.android.com/android/_/android/platform/frameworks/base/+/bdc66cb5a0ef513f4306edf9156cc978b08e06e4
      //
      // getRootView() returns the view itself when it is detached from the window, so the root
      // is not necessarily a ViewGroup: an IME editor action delivered over Binder can race the
      // removal of this view from the hierarchy. There is no focus to move in that case, so a
      // plain clearFocus() is enough.
      val rootViewGroup = rootView as? ViewGroup
      if (rootViewGroup != null) {
        val oldDescendantFocusability = rootViewGroup.descendantFocusability
        rootViewGroup.descendantFocusability = ViewGroup.FOCUS_BLOCK_DESCENDANTS
        super.clearFocus()
        rootViewGroup.descendantFocusability = oldDescendantFocusability
      } else {
        super.clearFocus()
      }
    }
    hideSoftKeyboard()
  }

  internal fun clearFocusFromJS() {
    clearFocusAndMaybeRefocus()
  }

  // For cases like autoFocus, or ref.focus() where we request focus programmatically and not
  // through
  // interacting with the EditText directly (like clicking on it). We cannot use stock
  // requestFocus() because it will not pop up the soft keyboard, only clicking the input will do
  // that. This method will eventually replace requestFocusInternal()
  private fun requestFocusProgrammatically(): Boolean {
    val focused = super.requestFocus(FOCUS_DOWN, null)
    if (isInTouchMode && showSoftInputOnFocus) {
      showSoftKeyboard()
    }

    return focused
  }

  override fun addTextChangedListener(watcher: TextWatcher) {
    if (listeners == null) {
      listeners = CopyOnWriteArrayList()
      super.addTextChangedListener(textWatcherDelegator)
    }
    listeners?.add(watcher)
  }

  override fun removeTextChangedListener(watcher: TextWatcher) {
    listeners?.let { nonNullListeners ->
      nonNullListeners.remove(watcher)

      if (nonNullListeners.isEmpty()) {
        this.listeners = null
        super.removeTextChangedListener(textWatcherDelegator)
      }
    }
  }

  public fun setContentSizeWatcher(contentSizeWatcher: ContentSizeWatcher?) {
    this.contentSizeWatcher = contentSizeWatcher
  }

  public fun setScrollWatcher(scrollWatcher: ScrollWatcher?) {
    this.scrollWatcher = scrollWatcher
  }

  /**
   * Attempt to set a selection or fail silently. Intentionally meant to handle bad inputs.
   * EventCounter is the same one used as with text.
   *
   * @param eventCounter
   * @param start
   * @param end
   */
  public fun maybeSetSelection(eventCounter: Int, start: Int, end: Int) {
    if (!canUpdateWithEventCount(eventCounter)) {
      return
    }

    maybeSetSelection(start, end)
  }

  private fun maybeSetSelection(start: Int, end: Int) {
    var start = start
    var end = end
    if (start != ReactConstants.UNSET && end != ReactConstants.UNSET) {
      // clamp selection values for safety
      start = clampToTextLength(start)
      end = clampToTextLength(end)

      setSelection(start, end)
    }
  }

  private fun clampToTextLength(value: Int): Int {
    val textLength = if (text == null) 0 else checkNotNull(text).length
    return max(0.0, min(value.toDouble(), textLength.toDouble())).toInt()
  }

  override fun setSelection(start: Int, end: Int) {
    if (DEBUG_MODE) {
      FLog.e(TAG, "setSelection[$id]: $start $end")
    }
    super.setSelection(start, end)
  }

  override fun onSelectionChanged(selStart: Int, selEnd: Int) {
    if (DEBUG_MODE) {
      FLog.e(TAG, "onSelectionChanged[$id]: $selStart $selEnd")
    }

    super.onSelectionChanged(selStart, selEnd)
    if (selectionWatcher != null && hasFocus()) {
      selectionWatcher?.onSelectionChanged(selStart, selEnd)
    }
  }

  override fun onFocusChanged(focused: Boolean, direction: Int, previouslyFocusedRect: Rect?) {
    super.onFocusChanged(focused, direction, previouslyFocusedRect)
    if (focused && selectionWatcher != null) {
      selectionWatcher?.onSelectionChanged(selectionStart, selectionEnd)
    }
  }

  internal fun setSelectionWatcher(selectionWatcher: SelectionWatcher?) {
    this.selectionWatcher = selectionWatcher
  }

  public fun setOnKeyPress(onKeyPress: Boolean) {
    this.onKeyPress = onKeyPress
  }

  public fun shouldBlurOnReturn(): Boolean {
    val submitBehavior = submitBehavior

    // Default shouldBlur
    val shouldBlur =
        if (submitBehavior == null) {
          !isMultiline
        } else {
          submitBehavior == "blurAndSubmit"
        }

    return shouldBlur
  }

  public fun shouldSubmitOnReturn(): Boolean {
    val submitBehavior = submitBehavior

    // Default shouldSubmit
    val shouldSubmit =
        if (submitBehavior == null) {
          !isMultiline
        } else {
          submitBehavior == "submit" || submitBehavior == "blurAndSubmit"
        }

    return shouldSubmit
  }

  internal fun commitStagedInputType() {
    if (inputType != stagedInputType) {
      val selectionStart = selectionStart
      val selectionEnd = selectionEnd
      inputType = stagedInputType
      // Restore the selection
      maybeSetSelection(selectionStart, selectionEnd)
    }
  }

  override fun setInputType(type: Int) {
    val tf = super.getTypeface()
    super.setInputType(type)
    stagedInputType = type
    // Input type password defaults to monospace font, so we need to re-apply the font
    super.setTypeface(tf)

    /**
     * Keep the single-line state in sync with the multiline input type flag.
     *
     * When multiline is on we must force [isSingleLine] off, because of a restriction on Android
     * source that enables multiline only for inputs of type Text and Multiline on method
     * [android.widget.TextView.isMultilineInputType]} Source:
     * [TextView.java](https://android.googlesource.com/platform/frameworks/base/+/jb-release/core/java/android/widget/TextView.java)
     *
     * When multiline is off we must force [isSingleLine] back on. [TextView.setInputType] only
     * re-applies the single-line layout (maxLines, horizontal scrolling) when its internal
     * single-line flag actually changes; because we force it off above whenever multiline is on,
     * that flag can be stale and the reset is skipped, leaving the placeholder/hint wrapped across
     * multiple lines after multiline is toggled back off. Setting it explicitly guarantees the
     * reset. We skip secure text so we don't replace its password transformation method with the
     * single-line one.
     */
    if (isMultiline) {
      isSingleLine = false
    } else if (!isSecureText) {
      isSingleLine = true
    }

    // Restoring the single-line input type above is not enough on its own when multiline is toggled
    // off: under Fabric the view is not re-measured while its measured size is unchanged, so the
    // placeholder/hint is rebuilt at draw time (which lays the hint out at the view's physical
    // width) and stays wrapped across multiple lines. Forcing a re-measure at the current bounds
    // rebuilds the hint as a single line, matching the initial mount.
    if (wasMultiline && !isMultiline && isLaidOut && width > 0 && height > 0) {
      forceLayout()
      measure(
          View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
          View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY),
      )
      layout(left, top, right, bottom)
    }
    wasMultiline = isMultiline

    // We override the KeyListener so that all keys on the soft input keyboard as well as hardware
    // keyboards work. Some KeyListeners like DigitsKeyListener will display the keyboard but not
    // accept all input from it
    if (keyListener == null) {
      keyListener = InternalKeyListener()
    }
    keyListener?.inputType = type
    super.setKeyListener(keyListener)
  }

  public fun setPlaceholder(placeholder: String?) {
    if (placeholder != this.placeholder) {
      this.placeholder = placeholder
      hint = placeholder
    }
  }

  public fun setFontFamily(fontFamily: String?) {
    this.fontFamily = fontFamily
    typefaceDirty = true
  }

  public fun setFontWeight(fontWeightString: String?) {
    val fontWeight = parseFontWeight(fontWeightString)
    if (fontWeight != this.fontWeight) {
      this.fontWeight = fontWeight
      typefaceDirty = true
    }
  }

  public fun setFontStyle(fontStyleString: String?) {
    val fontStyle = parseFontStyle(fontStyleString)
    if (fontStyle != this.fontStyle) {
      this.fontStyle = fontStyle
      typefaceDirty = true
    }
  }

  override fun setFontFeatureSettings(fontFeatureSettings: String?) {
    if (fontFeatureSettings != getFontFeatureSettings()) {
      super.setFontFeatureSettings(fontFeatureSettings)
      typefaceDirty = true
    }
  }

  public fun maybeUpdateTypeface() {
    if (!typefaceDirty) {
      return
    }

    typefaceDirty = false

    val newTypeface = applyStyles(typeface, fontStyle, fontWeight, fontFamily, context.assets)
    typeface = newTypeface

    // Match behavior of CustomStyleSpan and enable SUBPIXEL_TEXT_FLAG when setting anything
    // nonstandard
    val enableSubpixelText =
        fontStyle != ReactConstants.UNSET ||
            fontWeight != ReactConstants.UNSET ||
            fontFamily != null ||
            fontFeatureSettings != null
    paintFlags =
        if (enableSubpixelText) {
          paintFlags or Paint.SUBPIXEL_TEXT_FLAG
        } else {
          paintFlags and Paint.SUBPIXEL_TEXT_FLAG.inv()
        }

    paintFlags =
        if (enableSubpixelText) {
          paintFlags or Paint.LINEAR_TEXT_FLAG
        } else {
          paintFlags and Paint.LINEAR_TEXT_FLAG.inv()
        }
  }

  public fun requestFocusFromJS() {
    requestFocusProgrammatically()
  }

  public fun incrementAndGetEventCounter(): Int = ++nativeEventCount

  internal fun maybeSetTextFromJS(reactTextUpdate: ReactTextUpdate) {
    isSettingTextFromJS = true
    maybeSetText(reactTextUpdate)
    isSettingTextFromJS = false
  }

  internal fun maybeSetTextFromState(reactTextUpdate: ReactTextUpdate) {
    isSettingTextFromState = true
    maybeSetText(reactTextUpdate)
    isSettingTextFromState = false
  }

  public fun canUpdateWithEventCount(eventCounter: Int): Boolean = eventCounter >= nativeEventCount

  private fun maybeSetText(reactTextUpdate: ReactTextUpdate) {
    if (isSecureText && TextUtils.equals(text, reactTextUpdate.text)) {
      return
    }

    // Only set the text if it is up to date.
    if (!canUpdateWithEventCount(reactTextUpdate.jsEventCounter)) {
      return
    }

    if (DEBUG_MODE) {
      FLog.e(
          TAG,
          ("maybeSetText[" + id + "]: current text: " + text + " update: " + reactTextUpdate.text),
      )
    }

    // The current text gets replaced with the text received from JS. However, the spans on the
    // current text need to be adapted to the new text. Since TextView#setText() will remove or
    // reset some of these spans even if they are set directly, SpannableStringBuilder#replace() is
    // used instead (this is also used by the keyboard implementation underneath the covers).
    val spannableStringBuilder = SpannableStringBuilder(reactTextUpdate.text)

    manageSpans(spannableStringBuilder)
    stripStyleEquivalentSpans(spannableStringBuilder)

    // When we update text, we trigger onChangeText code that will
    // try to update state if the wrapper is available. Temporarily disable
    // to prevent an (asynchronous) infinite loop.
    disableTextDiffing = true

    // On some devices, when the text is cleared, buggy keyboards will not clear the composing
    // text so, we have to set text to null, which will clear the currently composing text.
    if (reactTextUpdate.text.length == 0) {
      text = null
    } else {
      // When we update text, we trigger onChangeText code that will
      // try to update state if the wrapper is available. Temporarily disable
      // to prevent an infinite loop.
      checkNotNull(text).replace(0, length(), spannableStringBuilder)
    }
    disableTextDiffing = false

    if (breakStrategy != reactTextUpdate.textBreakStrategy) {
      breakStrategy = reactTextUpdate.textBreakStrategy
    }

    // Update cached spans (in Fabric only).
    updateCachedSpannable()
  }

  /**
   * Remove and/or add [Spanned.SPAN_EXCLUSIVE_EXCLUSIVE] spans, since they should only exist as
   * long as the text they cover is the same. All other spans will remain the same, since they will
   * adapt to the new text, hence why [SpannableStringBuilder.replace] never removes them.
   */
  private fun manageSpans(spannableStringBuilder: SpannableStringBuilder) {
    val text = checkNotNull(text)
    val spans = text.getSpans(0, length(), Any::class.java)
    for (spanIdx in spans.indices) {
      val span = spans[spanIdx]
      val spanFlags = text.getSpanFlags(span)
      val isExclusiveExclusive =
          (spanFlags and Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) == Spanned.SPAN_EXCLUSIVE_EXCLUSIVE

      // Remove all styling spans we might have previously set
      if (span is ReactSpan) {
        text.removeSpan(span)
      }

      // We only add spans back for EXCLUSIVE_EXCLUSIVE spans
      if (!isExclusiveExclusive) {
        continue
      }

      val spanStart = text.getSpanStart(span)
      val spanEnd = text.getSpanEnd(span)

      // Make sure the span is removed from existing text, otherwise the spans we set will be
      // ignored or it will cover text that has changed.
      text.removeSpan(span)
      if (sameTextForSpan(text, spannableStringBuilder, spanStart, spanEnd)) {
        spannableStringBuilder.setSpan(span, spanStart, spanEnd, spanFlags)
      }
    }
  }

  /**
   * Remove spans from the SpannableStringBuilder which can be represented by TextAppearance
   * attributes on the underlying EditText. This works around instability on Samsung devices with
   * the presence of spans https://github.com/facebook/react-native/issues/35936 (S318090)
   */
  private fun stripStyleEquivalentSpans(sb: SpannableStringBuilder) {
    stripSpansOfKind(sb, ReactAbsoluteSizeSpan::class.java) { span: ReactAbsoluteSizeSpan ->
      span.size == textAttributes.effectiveFontSize
    }

    stripSpansOfKind(sb, ReactBackgroundColorSpan::class.java) { span: ReactBackgroundColorSpan ->
      span.backgroundColor == getBackgroundColor(this)
    }

    stripSpansOfKind(sb, ReactForegroundColorSpan::class.java) { span: ReactForegroundColorSpan ->
      span.foregroundColor == currentTextColor
    }

    stripSpansOfKind(sb, ReactStrikethroughSpan::class.java) {
      (paintFlags and Paint.STRIKE_THRU_TEXT_FLAG) != 0
    }

    stripSpansOfKind(sb, ReactUnderlineSpan::class.java) {
      (paintFlags and Paint.UNDERLINE_TEXT_FLAG) != 0
    }

    stripSpansOfKind(sb, CustomLetterSpacingSpan::class.java) { span: CustomLetterSpacingSpan ->
      span.spacing == textAttributes.effectiveLetterSpacing
    }

    stripSpansOfKind(sb, CustomStyleSpan::class.java) { span: CustomStyleSpan ->
      span.style == fontStyle &&
          span.fontFamily == fontFamily &&
          span.weight == fontWeight &&
          span.fontFeatureSettings == fontFeatureSettings
    }
  }

  private fun <T> stripSpansOfKind(
      sb: SpannableStringBuilder,
      clazz: Class<T>,
      shouldStrip: Predicate<T>,
  ) {
    val spans = sb.getSpans(0, sb.length, clazz)

    for (span in spans) {
      if (shouldStrip.test(span)) {
        sb.removeSpan(span)
      }
    }
  }

  /**
   * Copy styles represented as attributes to the underlying span, for later measurement or other
   * usage outside the ReactEditText.
   */
  private fun addSpansFromStyleAttributes(workingText: SpannableStringBuilder) {
    var spanFlags = Spannable.SPAN_INCLUSIVE_INCLUSIVE

    // Set all bits for SPAN_PRIORITY so that this span has the highest possible priority
    // (least precedence). This ensures the span is behind any overlapping spans.
    spanFlags = spanFlags or Spannable.SPAN_PRIORITY

    workingText.setSpan(
        ReactAbsoluteSizeSpan(textAttributes.effectiveFontSize),
        0,
        workingText.length,
        spanFlags,
    )

    workingText.setSpan(
        ReactForegroundColorSpan(currentTextColor),
        0,
        workingText.length,
        spanFlags,
    )

    val backgroundColor = getBackgroundColor(this)
    if (backgroundColor != null && backgroundColor != Color.TRANSPARENT) {
      workingText.setSpan(
          ReactBackgroundColorSpan(backgroundColor),
          0,
          workingText.length,
          spanFlags,
      )
    }

    if ((paintFlags and Paint.STRIKE_THRU_TEXT_FLAG) != 0) {
      workingText.setSpan(ReactStrikethroughSpan(), 0, workingText.length, spanFlags)
    }

    if ((paintFlags and Paint.UNDERLINE_TEXT_FLAG) != 0) {
      workingText.setSpan(ReactUnderlineSpan(), 0, workingText.length, spanFlags)
    }

    val effectiveLetterSpacing = textAttributes.effectiveLetterSpacing
    if (!effectiveLetterSpacing.isNaN()) {
      workingText.setSpan(
          CustomLetterSpacingSpan(effectiveLetterSpacing),
          0,
          workingText.length,
          spanFlags,
      )
    }

    if (
        fontStyle != ReactConstants.UNSET ||
            fontWeight != ReactConstants.UNSET ||
            fontFamily != null ||
            fontFeatureSettings != null
    ) {
      workingText.setSpan(
          CustomStyleSpan(
              fontStyle,
              fontWeight,
              fontFeatureSettings,
              fontFamily,
              context.assets,
              getFontWeightAdjustment(context),
          ),
          0,
          workingText.length,
          spanFlags,
      )
    }

    val lineHeight = textAttributes.effectiveLineHeight
    if (!lineHeight.isNaN()) {
      workingText.setSpan(CustomLineHeightSpan(lineHeight), 0, workingText.length, spanFlags)
    }
  }

  protected fun showSoftKeyboard(): Boolean = inputMethodManager.showSoftInput(this, 0)

  protected fun hideSoftKeyboard() {
    inputMethodManager.hideSoftInputFromWindow(windowToken, 0)
  }

  private fun onContentSizeChange() {
    contentSizeWatcher?.onLayout()

    setIntrinsicContentSize()
  }

  // TODO T58784068: delete this method
  private fun setIntrinsicContentSize() {
    // This serves as a check for whether we're running under Paper or Fabric.
    // By the time this is called, in Fabric we will have a state
    // wrapper 100% of the time.
    // Since the LocalData object is constructed by getting values from the underlying EditText
    // view, we don't need to construct one or apply it at all - it provides no use in Fabric.
    val reactContext = UIManagerHelper.getReactContext(this)

    if (!ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      @Suppress("DEPRECATION")
      if (stateWrapper == null && !reactContext.isBridgeless) {
        val localData = ReactTextInputLocalData(this)
        val uiManager =
            reactContext.getNativeModule(com.facebook.react.uimanager.UIManagerModule::class.java)
        uiManager?.setViewLocalData(id, localData)
      }
    }
  }

  private fun updateImeOptions() {
    // Default to IME_ACTION_DONE
    var returnKeyFlag = EditorInfo.IME_ACTION_DONE
    when (returnKeyType) {
      "go" -> returnKeyFlag = EditorInfo.IME_ACTION_GO
      "next" -> returnKeyFlag = EditorInfo.IME_ACTION_NEXT
      "none" -> returnKeyFlag = EditorInfo.IME_ACTION_NONE
      "previous" -> returnKeyFlag = EditorInfo.IME_ACTION_PREVIOUS
      "search" -> returnKeyFlag = EditorInfo.IME_ACTION_SEARCH
      "send" -> returnKeyFlag = EditorInfo.IME_ACTION_SEND
      "done" -> returnKeyFlag = EditorInfo.IME_ACTION_DONE
    }

    imeOptions =
        if (disableFullscreen) {
          returnKeyFlag or EditorInfo.IME_FLAG_NO_FULLSCREEN
        } else {
          returnKeyFlag
        }
  }

  public override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)

    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() &&
            ReactNativeFeatureFlags.enableFontScaleChangesUpdatingLayout()
    ) {
      applyTextAttributes()
    }
  }

  public override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    val selectionStart = selectionStart
    val selectionEnd = selectionEnd

    // Used to ensure that text is selectable inside of removeClippedSubviews
    // See https://github.com/facebook/react-native/issues/6805 for original
    // fix that was ported to here.
    super.setTextIsSelectable(true)

    // Restore the selection since `setTextIsSelectable` changed it.
    maybeSetSelection(selectionStart, selectionEnd)

    if (autoFocus && !didAttachToWindow) {
      requestFocusProgrammatically()
    }

    didAttachToWindow = true
  }

  override fun setBackgroundColor(color: Int) {
    setBackgroundColor(this, color)
  }

  public fun setBorderWidth(position: Int, width: Float) {
    setBorderWidth(this, LogicalEdge.entries[position], toDIPFromPixel(width))
  }

  public fun setBorderColor(position: Int, color: Int?) {
    setBorderColor(this, LogicalEdge.entries[position], color)
  }

  public fun getBorderColor(position: Int): Int =
      getBorderColor(this, LogicalEdge.entries[position]) ?: Color.TRANSPARENT

  public fun setBorderRadius(borderRadius: Float) {
    setBorderRadius(borderRadius, BorderRadiusProp.BORDER_RADIUS.ordinal)
  }

  public fun setBorderRadius(borderRadius: Float, position: Int) {
    val radius =
        if (borderRadius.isNaN()) {
          null
        } else {
          LengthPercentage(toDIPFromPixel(borderRadius), LengthPercentageType.POINT)
        }
    setBorderRadius(this, BorderRadiusProp.entries[position], radius)
  }

  public fun setBorderStyle(style: String?) {
    setBorderStyle(this, if (style == null) null else BorderStyle.fromString(style))
  }

  public fun setLetterSpacingPt(letterSpacingPt: Float) {
    textAttributes.letterSpacing = letterSpacingPt
    applyTextAttributes()
  }

  public fun setAllowFontScaling(allowFontScaling: Boolean) {
    if (textAttributes.allowFontScaling != allowFontScaling) {
      textAttributes.allowFontScaling = allowFontScaling
      applyTextAttributes()
    }
  }

  public fun setFontSize(fontSize: Float) {
    textAttributes.fontSize = fontSize
    applyTextAttributes()
  }

  public fun setMaxFontSizeMultiplier(maxFontSizeMultiplier: Float) {
    if (maxFontSizeMultiplier != textAttributes.maxFontSizeMultiplier) {
      textAttributes.maxFontSizeMultiplier = maxFontSizeMultiplier
      applyTextAttributes()
    }
  }

  public fun setAutoFocus(autoFocus: Boolean) {
    this.autoFocus = autoFocus
  }

  public fun setSelectTextOnFocus(selectTextOnFocus: Boolean) {
    super.setSelectAllOnFocus(selectTextOnFocus)
    this.selectTextOnFocus = selectTextOnFocus
  }

  public fun setContextMenuHidden(contextMenuHidden: Boolean) {
    this.contextMenuHidden = contextMenuHidden
  }

  protected fun applyTextAttributes() {
    // In general, the `getEffective*` functions return `Float.NaN` if the
    // property hasn't been set.
    // `getEffectiveFontSize` always returns a value so don't need to check for anything like
    // `Float.NaN`.
    setTextSize(TypedValue.COMPLEX_UNIT_PX, textAttributes.effectiveFontSize.toFloat())

    val effectiveLetterSpacing = textAttributes.effectiveLetterSpacing
    if (!effectiveLetterSpacing.isNaN()) {
      letterSpacing = effectiveLetterSpacing
    }
  }

  /**
   * Update the cached Spannable used in TextLayoutManager to measure the text in Fabric. This is
   * mostly copied from ReactTextInputShadowNode.java (the non-Fabric version) and
   * TextLayoutManager.java with some very minor modifications. There's some duplication between
   * here and TextLayoutManager, so there might be an opportunity for refactor.
   */
  private fun updateCachedSpannable() {
    // Noops in non-Fabric
    if (stateWrapper == null) {
      return
    }
    // If this view doesn't have an ID yet, we don't have a cache key, so bail here
    if (id == -1) {
      return
    }

    val currentText = text
    val haveText = !currentText.isNullOrEmpty()

    val sb = SpannableStringBuilder()

    // A note of caution: appending currentText to sb appends all the spans of currentText - not
    // copies of the Spans, but the actual span objects. Any modifications to sb after that point
    // can modify the spans of sb/currentText, impact the text or spans visible on screen, and
    // also call the TextChangeWatcher methods.
    if (currentText != null && haveText) {
      // This is here as a workaround for T76236115, which looks like this:
      // Hopefully we can delete all this stuff if we can get rid of the soft errors.
      // - android.text.SpannableStringBuilder.charAt (SpannableStringBuilder.java:123)
      // - android.text.CharSequenceCharacterIterator.current
      // (CharSequenceCharacterIterator.java:58)
      // - android.text.CharSequenceCharacterIterator.setIndex
      // (CharSequenceCharacterIterator.java:83)
      // - android.icu.text.RuleBasedBreakIterator.CISetIndex32 (RuleBasedBreakIterator.java:1126)
      // - android.icu.text.RuleBasedBreakIterator.isBoundary (RuleBasedBreakIterator.java:503)
      // - android.text.method.WordIterator.isBoundary (WordIterator.java:95)
      // - android.widget.Editor$SelectionHandleView.positionAtCursorOffset (Editor.java:6666)
      // - android.widget.Editor$HandleView.invalidate (Editor.java:5241)
      // - android.widget.Editor$SelectionModifierCursorController.invalidateHandles
      // (Editor.java:7442)
      // - android.widget.Editor.invalidateHandlesAndActionMode (Editor.java:2112)
      // - android.widget.TextView.spanChange (TextView.java:11189)
      // - android.widget.TextView$ChangeWatcher.onSpanAdded (TextView.java:14189)
      // - android.text.SpannableStringBuilder.sendSpanAdded (SpannableStringBuilder.java:1283)
      // - android.text.SpannableStringBuilder.sendToSpanWatchers (SpannableStringBuilder.java:663)
      // - android.text.SpannableStringBuilder.replace (SpannableStringBuilder.java:579)
      // - android.text.SpannableStringBuilder.append (SpannableStringBuilder.java:269)
      // - ReactEditText.updateCachedSpannable (ReactEditText.java:995)
      // - ReactEditText$TextWatcherDelegator.onTextChanged (ReactEditText.java:1044)
      // - android.widget.TextView.sendOnTextChanged (TextView.java:10972)
      // ...
      // - android.text.method.BaseKeyListener.onKeyDown (BaseKeyListener.java:479)
      // - android.text.method.QwertyKeyListener.onKeyDown (QwertyKeyListener.java:362)
      // - ReactEditText$InternalKeyListener.onKeyDown (ReactEditText.java:1094)
      // ...
      // - android.app.Activity.dispatchKeyEvent (Activity.java:3447)
      try {
        sb.append(currentText.subSequence(0, currentText.length))
      } catch (e: IndexOutOfBoundsException) {
        logSoftException(TAG, e)
      }
    }

    // If we don't have text, make sure we have *something* to measure.
    // Hint has the same dimensions - the only thing that's different is background or foreground
    // color
    if (!haveText) {
      if (hint != null && hint.isNotEmpty()) {
        sb.append(hint)
      }
    }

    addSpansFromStyleAttributes(sb)
    sb.setSpan(
        ReactTextPaintHolderSpan(TextPaint(paint)),
        0,
        sb.length,
        Spannable.SPAN_INCLUSIVE_INCLUSIVE,
    )
    TextLayoutManager.setCachedSpannableForTag(id, sb)
  }

  public fun setEventDispatcher(eventDispatcher: EventDispatcher?) {
    this.eventDispatcher = eventDispatcher
  }

  public fun setOverflow(overflow: String?) {
    if (overflow == null) {
      this.overflow = Overflow.VISIBLE
    } else {
      val parsedOverflow = Overflow.fromString(overflow)
      this.overflow = parsedOverflow ?: Overflow.VISIBLE
    }

    invalidate()
  }

  public override fun onDraw(canvas: Canvas) {
    if (overflow != Overflow.VISIBLE) {
      clipToPaddingBox(this, canvas)
    }

    val spanned = text as? Spanned
    if (spanned != null) {
      val layout = layout
      if (layout != null) {
        val drawSpans = spanned.getSpans(0, spanned.length, CanvasEffectSpan::class.java)
        if (drawSpans.isNotEmpty()) {
          canvas.withTranslation(compoundPaddingLeft.toFloat(), extendedPaddingTop.toFloat()) {
            for (span in drawSpans) {
              span.onPreDraw(spanned.getSpanStart(span), spanned.getSpanEnd(span), this, layout)
            }
          }

          super.onDraw(canvas)

          canvas.withTranslation(compoundPaddingLeft.toFloat(), extendedPaddingTop.toFloat()) {
            for (span in drawSpans) {
              span.onDraw(spanned.getSpanStart(span), spanned.getSpanEnd(span), this, layout)
            }
          }
          return
        }
      }
    }

    super.onDraw(canvas)
  }

  public override fun onDragEvent(event: DragEvent): Boolean {
    val dragFilter = dragAndDropFilter
    if (dragFilter != null && event.action == DragEvent.ACTION_DRAG_STARTED) {
      val shouldHandle = dragFilter.any { filter -> event.clipDescription.hasMimeType(filter) }
      if (!shouldHandle) {
        return false
      }
    }
    return super.onDragEvent(event)
  }

  /**
   * This class will redirect *TextChanged calls to the listeners only in the case where the text is
   * changed by the user, and not explicitly set by JS.
   */
  private inner class TextWatcherDelegator : TextWatcher {
    override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {
      if (!isSettingTextFromJS) {
        listeners?.forEach { listener -> listener.beforeTextChanged(s, start, count, after) }
      }
    }

    override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {
      if (DEBUG_MODE) {
        FLog.e(TAG, "onTextChanged[$id]: $s $start $before $count")
      }

      if (!isSettingTextFromJS) {
        listeners?.forEach { listener -> listener.onTextChanged(s, start, before, count) }
      }

      updateCachedSpannable()

      onContentSizeChange()
    }

    override fun afterTextChanged(s: Editable) {
      if (!isSettingTextFromJS) {
        listeners?.forEach { listener -> listener.afterTextChanged(s) }
      }
    }
  }

  /*
   * This class is set as the KeyListener for the underlying TextView
   * It does two things
   *  1) Provides the same answer to getInputType() as the real KeyListener would have which allows
   *     the proper keyboard to pop up on screen
   *  2) Permits all keyboard input through
   */
  private class InternalKeyListener : KeyListener {
    private var _inputType = 0

    /*
     * getInputType will return whatever value is passed in.  This will allow the proper keyboard
     * to be shown on screen but without the actual filtering done by other KeyListeners
     */
    override fun getInputType() = _inputType

    public fun setInputType(inputType: Int) {
      _inputType = inputType
    }

    /*
     * All overrides of key handling defer to the underlying KeyListener which is shared by all
     * ReactEditText instances.  It will basically allow any/all keyboard input whether from
     * physical keyboard or from soft input.
     */
    override fun onKeyDown(view: View, text: Editable, keyCode: Int, event: KeyEvent): Boolean =
        keyListener.onKeyDown(view, text, keyCode, event)

    override fun onKeyUp(view: View, text: Editable, keyCode: Int, event: KeyEvent): Boolean =
        keyListener.onKeyUp(view, text, keyCode, event)

    override fun onKeyOther(view: View, text: Editable, event: KeyEvent): Boolean =
        keyListener.onKeyOther(view, text, event)

    override fun clearMetaKeyState(view: View, content: Editable, states: Int) {
      keyListener.clearMetaKeyState(view, content, states)
    }
  }

  public companion object {
    public val DEBUG_MODE: Boolean = ReactBuildConfig.DEBUG && false

    private val keyListener: KeyListener = QwertyKeyListener.getInstanceForFullKeyboard()

    private fun sameTextForSpan(
        oldText: Editable,
        newText: SpannableStringBuilder,
        start: Int,
        end: Int,
    ): Boolean {
      if (start > newText.length || end > newText.length) {
        return false
      }
      for (charIdx in start..<end) {
        if (oldText[charIdx] != newText[charIdx]) {
          return false
        }
      }
      return true
    }
  }
}
