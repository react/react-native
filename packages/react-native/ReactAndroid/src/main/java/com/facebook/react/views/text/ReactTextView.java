/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.os.Build;
import android.text.Layout;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.method.LinkMovementMethod;
import android.text.util.Linkify;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatTextView;
import androidx.core.view.AccessibilityDelegateCompat;
import androidx.core.view.ViewCompat;
import androidx.customview.widget.ExploreByTouchHelper;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.internal.SystraceSection;
import com.facebook.react.uimanager.BackgroundStyleApplicator;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactCompoundView;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.style.BorderRadiusProp;
import com.facebook.react.uimanager.style.BorderStyle;
import com.facebook.react.uimanager.style.LogicalEdge;
import com.facebook.react.uimanager.style.Overflow;
import com.facebook.react.views.text.internal.span.CanvasEffectSpan;
import com.facebook.react.views.text.internal.span.ReactFragmentIndexSpan;
import com.facebook.react.views.text.internal.span.ReactTagSpan;
import com.facebook.yoga.YogaMeasureMode;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactTextView extends AppCompatTextView implements ReactCompoundView {

  private static final ViewGroup.LayoutParams EMPTY_LAYOUT_PARAMS =
      new ViewGroup.LayoutParams(0, 0);

  // https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/java/android/widget/TextView.java#L854
  private static final int DEFAULT_GRAVITY = Gravity.TOP | Gravity.START;

  private int mNumberOfLines;
  private @Nullable TextUtils.TruncateAt mEllipsizeLocation;
  private boolean mAdjustsFontSizeToFit;
  private float mFontSize;
  private float mMinimumFontSize;
  private float mLetterSpacing;
  private int mLinkifyMaskType;
  private boolean mTextIsSelectable;
  private boolean mShouldAdjustSpannableFontSize;
  private Overflow mOverflow = Overflow.VISIBLE;

  private @Nullable Spannable mSpanned;
  private @Nullable PreparedLayout mPreparedLayout;

  public ReactTextView(Context context) {
    super(context);
    initView();
  }

  /**
   * Set all default values here as opposed to in the constructor or field defaults. It is important
   * that these properties are set during the constructor, but also on-demand whenever an existing
   * ReactTextView is recycled.
   */
  private void initView() {
    mNumberOfLines = ViewDefaults.NUMBER_OF_LINES;
    mAdjustsFontSizeToFit = false;
    mLinkifyMaskType = 0;
    mTextIsSelectable = false;
    mShouldAdjustSpannableFontSize = false;
    mEllipsizeLocation = TextUtils.TruncateAt.END;
    mFontSize = Float.NaN;
    mMinimumFontSize = Float.NaN;
    mLetterSpacing = 0.f;
    mOverflow = Overflow.VISIBLE;
    mSpanned = null;
    mPreparedLayout = null;
  }

  /* package */ void recycleView() {
    // Set default field values
    initView();

    // If the view is still attached to a parent, we need to remove it from the parent
    // before we can recycle it.
    if (getParent() != null) {
      ((ViewGroup) getParent()).removeView(this);
    }

    BackgroundStyleApplicator.reset(this);

    // Defaults for these fields:
    // https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/java/android/widget/TextView.java#L1061
    setBreakStrategy(Layout.BREAK_STRATEGY_SIMPLE);
    setMovementMethod(getDefaultMovementMethod());
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      setJustificationMode(Layout.JUSTIFICATION_MODE_NONE);
    }

    // reset text
    setLayoutParams(EMPTY_LAYOUT_PARAMS);
    super.setText(null);
    applyTextAttributes();

    // Call setters to ensure that any super setters are called
    setGravity(DEFAULT_GRAVITY);
    setNumberOfLines(mNumberOfLines);
    setAdjustFontSizeToFit(mAdjustsFontSizeToFit);
    setLinkifyMask(mLinkifyMaskType);
    setTextIsSelectable(mTextIsSelectable);

    // Default true:
    // https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/java/android/widget/TextView.java#L9347
    setIncludeFontPadding(true);
    setEnabled(true);

    // reset data detectors
    setLinkifyMask(0);

    setEllipsizeLocation(mEllipsizeLocation);

    // View flags - defaults are here:
    // https://android.googlesource.com/platform/frameworks/base/+/98e54bb941cb6feb07127b75da37833281951d52/core/java/android/view/View.java#5311
    //         mViewFlags = SOUND_EFFECTS_ENABLED | HAPTIC_FEEDBACK_ENABLED |
    // LAYOUT_DIRECTION_INHERIT;
    setEnabled(true);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      setFocusable(View.FOCUSABLE_AUTO);
    }

    setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NONE);
    updateView(); // call after changing ellipsizeLocation in particular
  }

  private static WritableMap inlineViewJson(
      int visibility, int index, int left, int top, int right, int bottom) {
    WritableMap json = Arguments.createMap();
    if (visibility == View.GONE) {
      json.putString("visibility", "gone");
      json.putInt("index", index);
    } else if (visibility == View.VISIBLE) {
      json.putString("visibility", "visible");
      json.putInt("index", index);
      json.putDouble("left", PixelUtil.toDIPFromPixel(left));
      json.putDouble("top", PixelUtil.toDIPFromPixel(top));
      json.putDouble("right", PixelUtil.toDIPFromPixel(right));
      json.putDouble("bottom", PixelUtil.toDIPFromPixel(bottom));
    } else {
      json.putString("visibility", "unknown");
      json.putInt("index", index);
    }
    return json;
  }

  @Override
  protected void onLayout(
      boolean changed, int textViewLeft, int textViewTop, int textViewRight, int textViewBottom) {
    // TODO T62882314: Delete this method when Fabric is fully released in OSS
    // In Fabric, setText is called via ReactTextViewManager#updateExtraData
    // before we are laid out. This ordering is a requirement because we utilize the data from
    // setText in onLayout. The early return here is safe because the text layout is handled
    // correctly in Fabric.
  }

  @Override
  protected void onDraw(Canvas canvas) {
    try (SystraceSection s = new SystraceSection("ReactTextView.onDraw")) {
      Spannable spanned = getSpanned();
      if (mAdjustsFontSizeToFit && spanned != null && mShouldAdjustSpannableFontSize) {
        mShouldAdjustSpannableFontSize = false;
        TextLayoutManager.adjustSpannableFontToFit(
            spanned,
            getWidth(),
            YogaMeasureMode.EXACTLY,
            getHeight(),
            YogaMeasureMode.EXACTLY,
            mMinimumFontSize,
            mNumberOfLines,
            getIncludeFontPadding(),
            getBreakStrategy(),
            getHyphenationFrequency(),
            // always passing ALIGN_NORMAL here should be fine, since this method doesn't depend on
            // how exactly lines are aligned, just their width
            Layout.Alignment.ALIGN_NORMAL,
            (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) ? -1 : getJustificationMode(),
            getPaint());
        setText(spanned);
      }

      if (mOverflow != Overflow.VISIBLE) {
        BackgroundStyleApplicator.clipToPaddingBox(this, canvas);
      }

      if (spanned != null) {
        Layout layout = getLayout();
        if (layout != null) {
          CanvasEffectSpan[] drawSpans =
              spanned.getSpans(0, spanned.length(), CanvasEffectSpan.class);
          if (shouldDrawLayoutWithoutTextViewClip()) {
            drawLayoutWithoutTextViewClip(canvas, spanned, layout, drawSpans);
          } else {
            if (drawSpans.length > 0) {
              drawTextEffects(canvas, spanned, layout, drawSpans, true, false);
              super.onDraw(canvas);
              drawTextEffects(canvas, spanned, layout, drawSpans, false, false);
            } else {
              super.onDraw(canvas);
            }
          }
        } else {
          super.onDraw(canvas);
        }
      } else {
        super.onDraw(canvas);
      }
    }
  }

  private boolean shouldDrawLayoutWithoutTextViewClip() {
    return mOverflow == Overflow.VISIBLE && !mTextIsSelectable && getMovementMethod() == null;
  }

  private void drawLayoutWithoutTextViewClip(
      Canvas canvas, Spannable spanned, Layout layout, CanvasEffectSpan[] drawSpans) {
    getPaint().setColor(getCurrentTextColor());
    getPaint().drawableState = getDrawableState();

    drawTextEffects(canvas, spanned, layout, drawSpans, true, true);

    canvas.save();
    canvas.translate(
        getCompoundPaddingLeft(), getExtendedPaddingTop() + getVerticalGravityOffset(layout));
    layout.draw(canvas);
    canvas.restore();

    drawTextEffects(canvas, spanned, layout, drawSpans, false, true);
  }

  private void drawTextEffects(
      Canvas canvas,
      Spannable spanned,
      Layout layout,
      CanvasEffectSpan[] drawSpans,
      boolean beforeText,
      boolean includeVerticalGravityOffset) {
    if (drawSpans.length == 0) {
      return;
    }

    canvas.save();
    canvas.translate(
        getCompoundPaddingLeft(),
        getExtendedPaddingTop()
            + (includeVerticalGravityOffset ? getVerticalGravityOffset(layout) : 0));
    for (CanvasEffectSpan span : drawSpans) {
      int start = spanned.getSpanStart(span);
      int end = spanned.getSpanEnd(span);
      if (beforeText) {
        span.onPreDraw(start, end, canvas, layout);
      } else {
        span.onDraw(start, end, canvas, layout);
      }
    }
    canvas.restore();
  }

  private int getVerticalGravityOffset(Layout layout) {
    int availableVerticalSpace = getAvailableVerticalSpace();
    if (layout.getHeight() >= availableVerticalSpace) {
      return 0;
    }

    int verticalGravity = getGravity() & Gravity.VERTICAL_GRAVITY_MASK;
    if (verticalGravity == Gravity.BOTTOM) {
      return availableVerticalSpace - layout.getHeight();
    } else if (verticalGravity == Gravity.CENTER_VERTICAL) {
      return (availableVerticalSpace - layout.getHeight()) / 2;
    }

    return 0;
  }

  private int getAvailableVerticalSpace() {
    return getHeight() - getExtendedPaddingTop() - getExtendedPaddingBottom();
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    try (SystraceSection s = new SystraceSection("ReactTextView.onMeasure")) {
      super.onMeasure(widthMeasureSpec, heightMeasureSpec);
    }
  }

  public void setText(ReactTextUpdate update) {
    try (SystraceSection s = new SystraceSection("ReactTextView.setText(ReactTextUpdate)")) {
      // Android's TextView crashes when it tries to relayout if LayoutParams are
      // null; explicitly set the LayoutParams to prevent this crash. See:
      // https://github.com/facebook/react-native/pull/7011
      if (getLayoutParams() == null) {
        setLayoutParams(EMPTY_LAYOUT_PARAMS);
      }
      Spanned spanned = update.getText();
      if (mLinkifyMaskType > 0) {
        if (!(spanned instanceof Spannable)) {
          spanned = new SpannableString(spanned);
        }
        Linkify.addLinks((Spannable) spanned, mLinkifyMaskType);
        setMovementMethod(LinkMovementMethod.getInstance());
      }
      setText(spanned);

      int nextTextAlign = update.getTextAlign();
      if (nextTextAlign != getGravityHorizontal()) {
        setGravityHorizontal(nextTextAlign);
      }
      if (getBreakStrategy() != update.getTextBreakStrategy()) {
        setBreakStrategy(update.getTextBreakStrategy());
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        if (getJustificationMode() != update.getJustificationMode()) {
          setJustificationMode(update.getJustificationMode());
        }
      }

      // Ensure onLayout is called so the inline views can be repositioned.
      requestLayout();
    }
  }

  @Override
  public int reactTagForTouch(float touchX, float touchY) {
    CharSequence text = getText();
    int target = getId();

    int x = (int) touchX;
    int y = (int) touchY;

    Layout layout = getLayout();
    if (layout == null) {
      // If the layout is null, the view hasn't been properly laid out yet. Therefore, we can't find
      // the exact text tag that has been touched, and the correct tag to return is the default one.
      return target;
    }
    int line = layout.getLineForVertical(y);

    int lineStartX = (int) layout.getLineLeft(line);
    int lineEndX = (int) layout.getLineRight(line);

    // TODO(5966918): Consider extending touchable area for text spans by some DP constant
    if (text instanceof Spanned && x >= lineStartX && x <= lineEndX) {
      Spanned spannedText = (Spanned) text;
      int index = -1;
      try {
        index = layout.getOffsetForHorizontal(line, x);
      } catch (ArrayIndexOutOfBoundsException e) {
        // https://issuetracker.google.com/issues/113348914
        FLog.e(ReactConstants.TAG, "Crash in HorizontalMeasurementProvider: " + e.getMessage());
        return target;
      }

      // We choose the most inner span (shortest) containing character at the given index
      // if no such span can be found we will send the textview's react id as a touch handler
      // In case when there are more than one spans with same length we choose the last one
      // from the spans[] array, since it correspond to the most inner react element
      if (mPreparedLayout != null) {
        ReactFragmentIndexSpan[] fragmentSpans =
            spannedText.getSpans(index, index, ReactFragmentIndexSpan.class);

        if (fragmentSpans != null) {
          int targetSpanTextLength = text.length();
          for (int i = 0; i < fragmentSpans.length; i++) {
            int spanStart = spannedText.getSpanStart(fragmentSpans[i]);
            int spanEnd = spannedText.getSpanEnd(fragmentSpans[i]);
            if (spanEnd >= index && (spanEnd - spanStart) <= targetSpanTextLength) {
              target = mPreparedLayout.getReactTags()[fragmentSpans[i].getFragmentIndex()];
              targetSpanTextLength = (spanEnd - spanStart);
            }
          }
        }
      } else {
        ReactTagSpan[] spans = spannedText.getSpans(index, index, ReactTagSpan.class);

        if (spans != null) {
          int targetSpanTextLength = text.length();
          for (int i = 0; i < spans.length; i++) {
            int spanStart = spannedText.getSpanStart(spans[i]);
            int spanEnd = spannedText.getSpanEnd(spans[i]);
            if (spanEnd >= index && (spanEnd - spanStart) <= targetSpanTextLength) {
              target = spans[i].getReactTag();
              targetSpanTextLength = (spanEnd - spanStart);
            }
          }
        }
      }
    }

    return target;
  }

  @Override
  public void setTextIsSelectable(boolean selectable) {
    mTextIsSelectable = selectable;
    super.setTextIsSelectable(selectable);
  }

  @Override
  public void onAttachedToWindow() {
    super.onAttachedToWindow();

    // This is a workaround to ensure the text becomes selectable as it doesn't work if we call
    // `setTextIsSelectable(true)` directly when setTextIsSelectable was already true.
    if (mTextIsSelectable) {
      setTextIsSelectable(false);
      setTextIsSelectable(true);
    } else {
      setTextIsSelectable(false);
    }
  }

  @Override
  public boolean hasOverlappingRendering() {
    return false;
  }

  /* package */ int getGravityHorizontal() {
    return getGravity()
        & (Gravity.HORIZONTAL_GRAVITY_MASK | Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK);
  }

  /* package */ void setGravityHorizontal(int gravityHorizontal) {
    if (gravityHorizontal == 0) {
      gravityHorizontal =
          DEFAULT_GRAVITY
              & (Gravity.HORIZONTAL_GRAVITY_MASK | Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK);
    }
    setGravity(
        (getGravity()
                & ~Gravity.HORIZONTAL_GRAVITY_MASK
                & ~Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK)
            | gravityHorizontal);
  }

  /* package */ void setGravityVertical(int gravityVertical) {
    if (gravityVertical == 0) {
      gravityVertical = DEFAULT_GRAVITY & Gravity.VERTICAL_GRAVITY_MASK;
    }
    setGravity((getGravity() & ~Gravity.VERTICAL_GRAVITY_MASK) | gravityVertical);
  }

  public void setNumberOfLines(int numberOfLines) {
    mNumberOfLines = numberOfLines == 0 ? ViewDefaults.NUMBER_OF_LINES : numberOfLines;
    setMaxLines(mNumberOfLines);
    mShouldAdjustSpannableFontSize = true;
  }

  public void setAdjustFontSizeToFit(boolean adjustsFontSizeToFit) {
    mAdjustsFontSizeToFit = adjustsFontSizeToFit;
  }

  public void setFontSize(float fontSize) {
    mFontSize =
        mAdjustsFontSizeToFit
            ? (float) Math.ceil(PixelUtil.toPixelFromSP(fontSize))
            : (float) Math.ceil(PixelUtil.toPixelFromDIP(fontSize));

    applyTextAttributes();
  }

  public void setMinimumFontSize(float minimumFontSize) {
    mMinimumFontSize = minimumFontSize;
    mShouldAdjustSpannableFontSize = true;
  }

  @Override
  public void setIncludeFontPadding(boolean includepad) {
    super.setIncludeFontPadding(includepad);
    mShouldAdjustSpannableFontSize = true;
  }

  @Override
  public void setBreakStrategy(int breakStrategy) {
    super.setBreakStrategy(breakStrategy);
    mShouldAdjustSpannableFontSize = true;
  }

  @Override
  public void setHyphenationFrequency(int hyphenationFrequency) {
    super.setHyphenationFrequency(hyphenationFrequency);
    mShouldAdjustSpannableFontSize = true;
  }

  @Override
  public void setLetterSpacing(float letterSpacing) {
    if (Float.isNaN(letterSpacing)) {
      return;
    }

    float letterSpacingPixels = PixelUtil.toPixelFromDIP(letterSpacing);

    // `letterSpacingPixels` and `getEffectiveFontSize` are both in pixels,
    // yielding an accurate em value.
    mLetterSpacing = letterSpacingPixels / mFontSize;

    applyTextAttributes();
  }

  public void setEllipsizeLocation(@Nullable TextUtils.TruncateAt ellipsizeLocation) {
    mEllipsizeLocation = ellipsizeLocation;
  }

  public void updateView() {
    @Nullable
    TextUtils.TruncateAt ellipsizeLocation =
        mNumberOfLines == ViewDefaults.NUMBER_OF_LINES || mAdjustsFontSizeToFit
            ? null
            : mEllipsizeLocation;
    setEllipsize(ellipsizeLocation);
  }

  @Override
  public void setBackgroundColor(int color) {
    BackgroundStyleApplicator.setBackgroundColor(this, color);
  }

  public void setBorderWidth(int position, float width) {
    BackgroundStyleApplicator.setBorderWidth(
        this, LogicalEdge.values()[position], PixelUtil.toDIPFromPixel(width));
  }

  public void setBorderColor(int position, @Nullable Integer color) {
    BackgroundStyleApplicator.setBorderColor(this, LogicalEdge.values()[position], color);
  }

  public void setBorderRadius(float borderRadius) {
    setBorderRadius(borderRadius, BorderRadiusProp.BORDER_RADIUS.ordinal());
  }

  public void setBorderRadius(float borderRadius, int position) {
    @Nullable
    LengthPercentage radius =
        Float.isNaN(borderRadius)
            ? null
            : new LengthPercentage(
                PixelUtil.toDIPFromPixel(borderRadius), LengthPercentageType.POINT);
    BackgroundStyleApplicator.setBorderRadius(this, BorderRadiusProp.values()[position], radius);
  }

  public void setBorderStyle(@Nullable String style) {
    BackgroundStyleApplicator.setBorderStyle(
        this, style == null ? null : BorderStyle.fromString(style));
  }

  public void setSpanned(Spannable spanned) {
    mSpanned = spanned;
    mShouldAdjustSpannableFontSize = true;
  }

  public @Nullable Spannable getSpanned() {
    return mSpanned;
  }

  /**
   * Get the PreparedLayout originally generated by the Fabric renderer, if using {@code
   * enablePreparedTextLayout()}
   *
   * <p>TODO: Should be made internal when ReactTextView is converted to Kotlin
   */
  @UnstableReactNativeAPI
  @Nullable
  public PreparedLayout getPreparedLayout() {
    return mPreparedLayout;
  }

  /* package */ void setPreparedLayout(@Nullable PreparedLayout preparedLayout) {
    mPreparedLayout = preparedLayout;
  }

  public void setLinkifyMask(int mask) {
    mLinkifyMaskType = mask;
  }

  @Override
  protected boolean dispatchHoverEvent(MotionEvent event) {
    // if this view has an accessibility delegate set, and that delegate supports virtual view
    // children (used for links), pass the hover event along to it so that touching and holding on
    // this text will properly move focus to the virtual children.
    if (ViewCompat.hasAccessibilityDelegate(this)) {
      AccessibilityDelegateCompat delegate = ViewCompat.getAccessibilityDelegate(this);
      if (delegate instanceof ExploreByTouchHelper) {
        return ((ExploreByTouchHelper) delegate).dispatchHoverEvent(event)
            || super.dispatchHoverEvent(event);
      }
    }

    return super.dispatchHoverEvent(event);
  }

  /**
   * Note that if we have a movement method then we DO NOT forward these events to the accessibility
   * delegate. This is because the movement method should handle the focus highlighting and
   * changing. If we don't do this then we have mutliple selections happening at once. We cannot get
   * rid of movement method since links found by Linkify will not be clickable. Also, putting this
   * gating in the accessibility delegate itself will break screen reader accessibility more
   * generally, since we still need to register virtual views.
   */
  @Override
  public final void onFocusChanged(
      boolean gainFocus, int direction, @Nullable Rect previouslyFocusedRect) {
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect);
    AccessibilityDelegateCompat accessibilityDelegateCompat =
        ViewCompat.getAccessibilityDelegate(this);
    if (accessibilityDelegateCompat != null
        && accessibilityDelegateCompat instanceof ReactTextViewAccessibilityDelegate
        && getMovementMethod() == null) {
      ((ReactTextViewAccessibilityDelegate) accessibilityDelegateCompat)
          .onFocusChanged(gainFocus, direction, previouslyFocusedRect);
    }
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent event) {
    AccessibilityDelegateCompat accessibilityDelegateCompat =
        ViewCompat.getAccessibilityDelegate(this);
    return (accessibilityDelegateCompat != null
            && getMovementMethod() == null
            && accessibilityDelegateCompat instanceof ReactTextViewAccessibilityDelegate
            && ((ReactTextViewAccessibilityDelegate) accessibilityDelegateCompat)
                .dispatchKeyEvent(event))
        || super.dispatchKeyEvent(event);
  }

  private void applyTextAttributes() {
    // Workaround for an issue where text can be cut off with an ellipsis when
    // using certain font sizes and padding. Sets the provided text size and
    // letter spacing to ensure consistent rendering and prevent cut-off.
    if (!Float.isNaN(mFontSize)) {
      setTextSize(TypedValue.COMPLEX_UNIT_PX, mFontSize);
    }

    if (!Float.isNaN(mLetterSpacing)) {
      super.setLetterSpacing(mLetterSpacing);
    }
  }

  public void setOverflow(@Nullable String overflow) {
    if (overflow == null) {
      mOverflow = Overflow.VISIBLE;
    } else {
      @Nullable Overflow parsedOverflow = Overflow.fromString(overflow);
      mOverflow = parsedOverflow == null ? Overflow.VISIBLE : parsedOverflow;
    }

    invalidate();
  }
}
