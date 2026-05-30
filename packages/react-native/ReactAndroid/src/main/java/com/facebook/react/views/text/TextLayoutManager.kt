/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.res.AssetManager
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.text.BoringLayout
import android.text.Layout
import android.text.Spannable
import android.text.SpannableString
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextDirectionHeuristics
import android.text.TextPaint
import android.text.TextUtils
import android.util.LayoutDirection
import android.view.Gravity
import android.view.View
import androidx.annotation.VisibleForTesting
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.views.text.internal.span.CustomLetterSpacingSpan
import com.facebook.react.views.text.internal.span.CustomLineHeightSpan
import com.facebook.react.views.text.internal.span.CustomStyleSpan
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.react.views.text.internal.span.ReactBackgroundColorSpan
import com.facebook.react.views.text.internal.span.ReactClickableSpan
import com.facebook.react.views.text.internal.span.ReactForegroundColorSpan
import com.facebook.react.views.text.internal.span.ReactFragmentIndexSpan
import com.facebook.react.views.text.internal.span.ReactLinkSpan
import com.facebook.react.views.text.internal.span.ReactOpacitySpan
import com.facebook.react.views.text.internal.span.ReactStrikethroughSpan
import com.facebook.react.views.text.internal.span.ReactTagSpan
import com.facebook.react.views.text.internal.span.ReactTextPaintHolderSpan
import com.facebook.react.views.text.internal.span.ReactUnderlineSpan
import com.facebook.react.views.text.internal.span.SetSpanOperation
import com.facebook.react.views.text.internal.span.ShadowStyleSpan
import com.facebook.react.views.text.internal.span.TextInlineViewPlaceholderSpan
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import org.json.JSONArray
import org.json.JSONObject

/** Class responsible of creating [Spanned] object for the JS representation of Text */
internal object TextLayoutManager {

  // constants for AttributedString serialization
  const val AS_KEY_HASH: Int = 0
  const val AS_KEY_STRING: Int = 1
  const val AS_KEY_FRAGMENTS: Int = 2
  const val AS_KEY_CACHE_ID: Int = 3
  const val AS_KEY_BASE_ATTRIBUTES: Int = 4

  // constants for Fragment serialization
  const val FR_KEY_STRING: Int = 0
  const val FR_KEY_REACT_TAG: Int = 1
  const val FR_KEY_IS_ATTACHMENT: Int = 2
  const val FR_KEY_WIDTH: Int = 3
  const val FR_KEY_HEIGHT: Int = 4
  const val FR_KEY_TEXT_ATTRIBUTES: Int = 5

  // constants for ParagraphAttributes serialization
  const val PA_KEY_MAX_NUMBER_OF_LINES: Int = 0
  const val PA_KEY_ELLIPSIZE_MODE: Int = 1
  const val PA_KEY_TEXT_BREAK_STRATEGY: Int = 2
  const val PA_KEY_ADJUST_FONT_SIZE_TO_FIT: Int = 3
  const val PA_KEY_INCLUDE_FONT_PADDING: Int = 4
  const val PA_KEY_HYPHENATION_FREQUENCY: Int = 5
  const val PA_KEY_MINIMUM_FONT_SIZE: Int = 6
  const val PA_KEY_MAXIMUM_FONT_SIZE: Int = 7
  const val PA_KEY_TEXT_ALIGN_VERTICAL: Int = 8

  private val TAG: String = TextLayoutManager::class.java.simpleName

  // Each thread has its own copy of scratch TextPaint so that TextLayoutManager
  // measurement/Spannable creation can be free-threaded.
  private val textPaintInstance: ThreadLocal<TextPaint> =
      object : ThreadLocal<TextPaint>() {
        override fun initialValue(): TextPaint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
      }

  private const val DEFAULT_INCLUDE_FONT_PADDING = true

  private const val DEFAULT_ADJUST_FONT_SIZE_TO_FIT = false

  private val tagToSpannableCache = ConcurrentHashMap<Int, Spannable>()

  // Lazily cached Method for StaticLayout.Builder.setUseBoundsForWidth (API 35+).
  // Reflection is needed because some internal targets compile against an SDK older than 35.
  private val setUseBoundsForWidthMethod: java.lang.reflect.Method? by lazy {
    try {
      StaticLayout.Builder::class
          .java
          .getMethod("setUseBoundsForWidth", Boolean::class.javaPrimitiveType)
    } catch (_: ReflectiveOperationException) {
      null
    }
  }

  fun setCachedSpannableForTag(reactTag: Int, sp: Spannable): Unit {
    tagToSpannableCache[reactTag] = sp
  }

  fun deleteCachedSpannableForTag(reactTag: Int): Unit {
    tagToSpannableCache.remove(reactTag)
  }

  fun isRTL(attributedString: MapBuffer): Boolean {
    // TODO: Don't read AS_KEY_FRAGMENTS, which may be expensive, and is not present when using
    // cached Spannable
    if (!attributedString.contains(AS_KEY_FRAGMENTS)) {
      return false
    }

    val fragments = attributedString.getMapBuffer(AS_KEY_FRAGMENTS)
    if (fragments.count == 0) {
      return false
    }

    val fragment = fragments.getMapBuffer(0)
    val textAttributes = fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES)

    if (!textAttributes.contains(TextAttributeProps.TA_KEY_LAYOUT_DIRECTION.toInt())) {
      return false
    }

    return TextAttributeProps.getLayoutDirection(
        textAttributes.getString(TextAttributeProps.TA_KEY_LAYOUT_DIRECTION.toInt())
    ) == LayoutDirection.RTL
  }

  private fun getTextAlignmentAttr(attributedString: MapBuffer): String? {
    // TODO: Don't read AS_KEY_FRAGMENTS, which may be expensive, and is not present when using
    // cached Spannable
    if (!attributedString.contains(AS_KEY_FRAGMENTS)) {
      return null
    }

    val fragments = attributedString.getMapBuffer(AS_KEY_FRAGMENTS)
    if (fragments.count != 0) {
      val fragment = fragments.getMapBuffer(0)
      val textAttributes = fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES)

      if (textAttributes.contains(TextAttributeProps.TA_KEY_ALIGNMENT.toInt())) {
        return textAttributes.getString(TextAttributeProps.TA_KEY_ALIGNMENT.toInt())
      }
    }

    return null
  }

  private fun getTextJustificationMode(alignmentAttr: String?): Int {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return -1
    }

    if (alignmentAttr != null && alignmentAttr == "justified") {
      return Layout.JUSTIFICATION_MODE_INTER_WORD
    }

    return Layout.JUSTIFICATION_MODE_NONE
  }

  private fun getTextAlignment(
      attributedString: MapBuffer,
      spanned: Spannable,
      alignmentAttr: String?,
  ): Layout.Alignment {
    // Android will align text based on the script, so normal and opposite alignment needs to be
    // swapped when the directions of paragraph and script don't match.
    // I.e. paragraph is LTR but script is RTL, text needs to be aligned to the left, which means
    // ALIGN_OPPOSITE needs to be used to align RTL script to the left
    val isParagraphRTL = isRTL(attributedString)
    val isScriptRTL = TextDirectionHeuristics.FIRSTSTRONG_LTR.isRtl(spanned, 0, spanned.length)
    val swapNormalAndOpposite = isParagraphRTL != isScriptRTL

    var alignment =
        if (swapNormalAndOpposite) Layout.Alignment.ALIGN_OPPOSITE
        else Layout.Alignment.ALIGN_NORMAL

    if (alignmentAttr == null) {
      return alignment
    }

    if (alignmentAttr == "center") {
      alignment = Layout.Alignment.ALIGN_CENTER
    } else if (alignmentAttr == "right" || alignmentAttr == "end") {
      alignment =
          if (swapNormalAndOpposite) Layout.Alignment.ALIGN_NORMAL
          else Layout.Alignment.ALIGN_OPPOSITE
    }

    return alignment
  }

  @JvmStatic
  fun getTextGravity(attributedString: MapBuffer, spanned: Spannable): Int {
    val alignmentAttr = getTextAlignmentAttr(attributedString)
    val alignment = getTextAlignment(attributedString, spanned, alignmentAttr)

    // depending on whether the script is LTR or RTL, ALIGN_NORMAL and ALIGN_OPPOSITE may mean
    // different things
    val swapLeftAndRight = TextDirectionHeuristics.FIRSTSTRONG_LTR.isRtl(spanned, 0, spanned.length)

    return when (alignment) {
      Layout.Alignment.ALIGN_NORMAL -> if (swapLeftAndRight) Gravity.RIGHT else Gravity.LEFT
      Layout.Alignment.ALIGN_OPPOSITE -> if (swapLeftAndRight) Gravity.LEFT else Gravity.RIGHT
      Layout.Alignment.ALIGN_CENTER -> Gravity.CENTER_HORIZONTAL
    }
  }

  @OptIn(UnstableReactNativeAPI::class)
  private fun buildSpannableFromFragments(
      assets: AssetManager,
      fontWeightAdjustment: Int,
      fragments: MapBuffer,
      sb: SpannableStringBuilder,
      ops: MutableList<SetSpanOperation>,
      outputReactTags: IntArray?,
      textEffectRegistry: TextEffectRegistry?,
  ) {
    // Track pending text effects to coalesce consecutive fragments with the same effects into
    // single spans, avoiding duplicate draws (e.g. multiple accent marks in HighlighterTextSpan).
    var pendingEffects: List<TextAttributeProps.TextEffectEntry> = emptyList()
    var pendingEffectStart = 0

    for (i in 0 until fragments.count) {
      val fragment = fragments.getMapBuffer(i)
      val start = sb.length

      val textAttributes =
          TextAttributeProps.fromMapBuffer(fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES))

      sb.append(
          TextTransform.apply(fragment.getString(FR_KEY_STRING), textAttributes.textTransform)
      )

      val end = sb.length
      val reactTag =
          if (fragment.contains(FR_KEY_REACT_TAG)) fragment.getInt(FR_KEY_REACT_TAG) else View.NO_ID
      if (fragment.contains(FR_KEY_IS_ATTACHMENT) && fragment.getBoolean(FR_KEY_IS_ATTACHMENT)) {
        val width = PixelUtil.toPixelFromSP(fragment.getDouble(FR_KEY_WIDTH))
        val height = PixelUtil.toPixelFromSP(fragment.getDouble(FR_KEY_HEIGHT))
        ops.add(
            SetSpanOperation(
                sb.length - 1,
                sb.length,
                TextInlineViewPlaceholderSpan(reactTag, width.toInt(), height.toInt()),
            )
        )
      } else if (end >= start) {
        val roleIsLink =
            if (textAttributes.role != null)
                (textAttributes.role == ReactAccessibilityDelegate.Role.LINK)
            else
                (textAttributes.accessibilityRole ==
                    ReactAccessibilityDelegate.AccessibilityRole.LINK)
        if (roleIsLink) {
          if (ReactNativeFeatureFlags.enablePreparedTextLayout()) {
            ops.add(SetSpanOperation(start, end, ReactLinkSpan(i)))
          } else {
            ops.add(SetSpanOperation(start, end, ReactClickableSpan(reactTag)))
          }
        }
        if (textAttributes.isColorSet) {
          textAttributes.color
              ?.let { ReactForegroundColorSpan(it) }
              ?.let { SetSpanOperation(start, end, it) }
              ?.let { ops.add(it) }
        }
        if (textAttributes.isBackgroundColorSet) {
          textAttributes.backgroundColor
              ?.let { ReactBackgroundColorSpan(it) }
              ?.let { SetSpanOperation(start, end, it) }
              ?.let { ops.add(it) }
        }
        if (!textAttributes.opacity.isNaN()) {
          ops.add(SetSpanOperation(start, end, ReactOpacitySpan(textAttributes.opacity)))
        }
        if (!textAttributes.letterSpacing.isNaN()) {
          ops.add(
              SetSpanOperation(start, end, CustomLetterSpacingSpan(textAttributes.letterSpacing))
          )
        }
        ops.add(SetSpanOperation(start, end, ReactAbsoluteSizeSpan(textAttributes.fontSize)))
        if (
            textAttributes.fontStyle != ReactConstants.UNSET ||
                textAttributes.fontWeight != ReactConstants.UNSET ||
                textAttributes.fontFamily != null
        ) {
          ops.add(
              SetSpanOperation(
                  start,
                  end,
                  CustomStyleSpan(
                      textAttributes.fontStyle,
                      textAttributes.fontWeight,
                      textAttributes.fontFeatureSettings,
                      textAttributes.fontFamily,
                      assets,
                      fontWeightAdjustment,
                  ),
              )
          )
        }
        if (textAttributes.isUnderlineTextDecorationSet) {
          ops.add(
              SetSpanOperation(
                  start,
                  end,
                  ReactUnderlineSpan(
                      textAttributes.textDecorationColor,
                      textAttributes.textDecorationStyle,
                  ),
              )
          )
        }
        if (textAttributes.isLineThroughTextDecorationSet) {
          ops.add(
              SetSpanOperation(
                  start,
                  end,
                  ReactStrikethroughSpan(
                      textAttributes.textDecorationColor,
                      textAttributes.textDecorationStyle,
                  ),
              )
          )
        }
        if (
            (textAttributes.textShadowOffsetDx != 0f ||
                textAttributes.textShadowOffsetDy != 0f ||
                textAttributes.textShadowRadius != 0f) &&
                Color.alpha(textAttributes.textShadowColor) != 0
        ) {
          ops.add(
              SetSpanOperation(
                  start,
                  end,
                  ShadowStyleSpan(
                      textAttributes.textShadowOffsetDx,
                      textAttributes.textShadowOffsetDy,
                      textAttributes.textShadowRadius,
                      textAttributes.textShadowColor,
                  ),
              )
          )
        }
        if (!textAttributes.lineHeight.isNaN()) {
          ops.add(SetSpanOperation(start, end, CustomLineHeightSpan(textAttributes.lineHeight)))
        }

        if (ReactNativeFeatureFlags.enablePreparedTextLayout()) {
          ops.add(SetSpanOperation(start, end, ReactFragmentIndexSpan(i)))
          if (outputReactTags != null) {
            outputReactTags[i] = reactTag
          }
        } else {
          ops.add(SetSpanOperation(start, end, ReactTagSpan(reactTag)))
        }
      }

      // Coalesce consecutive fragments with the same text effects into single spans.
      val effects = textAttributes.textEffects
      if (effects != pendingEffects) {
        // Flush the previous pending effects
        if (pendingEffects.isNotEmpty() && textEffectRegistry != null) {
          for (effect in pendingEffects) {
            val effectProps = jsonStringToReadableMap(effect.props)
            val span = textEffectRegistry.createSpan(effect.name, effectProps)
            if (span != null) {
              ops.add(SetSpanOperation(pendingEffectStart, start, span))
            }
          }
        }
        pendingEffects = effects
        pendingEffectStart = start
      }
    }

    // Flush any remaining pending effects after the last fragment
    if (pendingEffects.isNotEmpty() && textEffectRegistry != null) {
      for (effect in pendingEffects) {
        val effectProps = jsonStringToReadableMap(effect.props)
        val span = textEffectRegistry.createSpan(effect.name, effectProps)
        if (span != null) {
          ops.add(SetSpanOperation(pendingEffectStart, sb.length, span))
        }
      }
    }
  }

  private class FragmentAttributes(
      val props: TextAttributeProps,
      val length: Int,
      val reactTag: Int,
      val isAttachment: Boolean,
      val width: Double,
      val height: Double,
  )

  @OptIn(UnstableReactNativeAPI::class)
  private fun buildSpannableFromFragmentsOptimized(
      assets: AssetManager,
      fontWeightAdjustment: Int,
      fragments: MapBuffer,
      outputReactTags: IntArray?,
      textEffectRegistry: TextEffectRegistry?,
  ): Spannable {
    val text = StringBuilder()
    val parsedFragments = ArrayList<FragmentAttributes>(fragments.count)

    for (i in 0 until fragments.count) {
      val fragment = fragments.getMapBuffer(i)
      val props = TextAttributeProps.fromMapBuffer(fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES))
      val fragmentText = TextTransform.apply(fragment.getString(FR_KEY_STRING), props.textTransform)
      text.append(fragmentText)
      parsedFragments.add(
          FragmentAttributes(
              props = props,
              length = fragmentText.length,
              reactTag =
                  if (fragment.contains(FR_KEY_REACT_TAG)) {
                    fragment.getInt(FR_KEY_REACT_TAG)
                  } else {
                    View.NO_ID
                  },
              isAttachment =
                  fragment.contains(FR_KEY_IS_ATTACHMENT) &&
                      fragment.getBoolean(FR_KEY_IS_ATTACHMENT),
              width =
                  if (fragment.contains(FR_KEY_WIDTH)) {
                    fragment.getDouble(FR_KEY_WIDTH)
                  } else {
                    Double.NaN
                  },
              height =
                  if (fragment.contains(FR_KEY_HEIGHT)) {
                    fragment.getDouble(FR_KEY_HEIGHT)
                  } else {
                    Double.NaN
                  },
          )
      )
    }

    val spannable = SpannableString(text)

    // Track pending text effects to coalesce consecutive fragments with the same effects into
    // single spans, avoiding duplicate draws (e.g. multiple accent marks in HighlighterTextSpan).
    var pendingEffects: List<TextAttributeProps.TextEffectEntry> = emptyList()
    var pendingEffectStart = 0

    var start = 0
    for ((i, fragment) in parsedFragments.withIndex()) {
      val end = start + fragment.length
      val spanFlags =
          if (start == 0) Spannable.SPAN_INCLUSIVE_INCLUSIVE else Spannable.SPAN_EXCLUSIVE_INCLUSIVE

      if (fragment.isAttachment) {
        spannable.setSpan(
            TextInlineViewPlaceholderSpan(
                fragment.reactTag,
                PixelUtil.toPixelFromSP(fragment.width).toInt(),
                PixelUtil.toPixelFromSP(fragment.height).toInt(),
            ),
            start,
            end,
            spanFlags,
        )
      } else {
        val roleIsLink =
            if (fragment.props.role != null)
                (fragment.props.role == ReactAccessibilityDelegate.Role.LINK)
            else
                (fragment.props.accessibilityRole ==
                    ReactAccessibilityDelegate.AccessibilityRole.LINK)

        if (roleIsLink) {
          if (ReactNativeFeatureFlags.enablePreparedTextLayout()) {
            spannable.setSpan(ReactLinkSpan(i), start, end, spanFlags)
          } else {
            spannable.setSpan(ReactClickableSpan(fragment.reactTag), start, end, spanFlags)
          }
        }

        if (fragment.props.isColorSet) {
          spannable.setSpan(
              fragment.props.color?.let { ReactForegroundColorSpan(it) },
              start,
              end,
              spanFlags,
          )
        }

        if (fragment.props.isBackgroundColorSet) {
          spannable.setSpan(
              fragment.props.backgroundColor?.let { ReactBackgroundColorSpan(it) },
              start,
              end,
              spanFlags,
          )
        }

        if (!fragment.props.opacity.isNaN()) {
          spannable.setSpan(ReactOpacitySpan(fragment.props.opacity), start, end, spanFlags)
        }

        if (!fragment.props.letterSpacing.isNaN()) {
          spannable.setSpan(
              CustomLetterSpacingSpan(fragment.props.letterSpacing),
              start,
              end,
              spanFlags,
          )
        }

        spannable.setSpan(ReactAbsoluteSizeSpan(fragment.props.fontSize), start, end, spanFlags)

        if (
            fragment.props.fontStyle != ReactConstants.UNSET ||
                fragment.props.fontWeight != ReactConstants.UNSET ||
                fragment.props.fontFamily != null
        ) {
          spannable.setSpan(
              CustomStyleSpan(
                  fragment.props.fontStyle,
                  fragment.props.fontWeight,
                  fragment.props.fontFeatureSettings,
                  fragment.props.fontFamily,
                  assets,
                  fontWeightAdjustment,
              ),
              start,
              end,
              spanFlags,
          )
        }

        if (fragment.props.isUnderlineTextDecorationSet) {
          spannable.setSpan(
              ReactUnderlineSpan(
                  fragment.props.textDecorationColor,
                  fragment.props.textDecorationStyle,
              ),
              start,
              end,
              spanFlags,
          )
        }

        if (fragment.props.isLineThroughTextDecorationSet) {
          spannable.setSpan(
              ReactStrikethroughSpan(
                  fragment.props.textDecorationColor,
                  fragment.props.textDecorationStyle,
              ),
              start,
              end,
              spanFlags,
          )
        }

        if (
            (fragment.props.textShadowOffsetDx != 0f ||
                fragment.props.textShadowOffsetDy != 0f ||
                fragment.props.textShadowRadius != 0f) &&
                Color.alpha(fragment.props.textShadowColor) != 0
        ) {
          spannable.setSpan(
              ShadowStyleSpan(
                  fragment.props.textShadowOffsetDx,
                  fragment.props.textShadowOffsetDy,
                  fragment.props.textShadowRadius,
                  fragment.props.textShadowColor,
              ),
              start,
              end,
              spanFlags,
          )
        }

        if (!fragment.props.lineHeight.isNaN()) {
          spannable.setSpan(CustomLineHeightSpan(fragment.props.lineHeight), start, end, spanFlags)
        }

        if (ReactNativeFeatureFlags.enablePreparedTextLayout()) {
          spannable.setSpan(ReactFragmentIndexSpan(i), start, end, spanFlags)
          if (outputReactTags != null) {
            outputReactTags[i] = fragment.reactTag
          }
        } else {
          spannable.setSpan(ReactTagSpan(fragment.reactTag), start, end, spanFlags)
        }
      }

      // Coalesce consecutive fragments with the same text effects into single spans.
      val effects = fragment.props.textEffects
      if (effects != pendingEffects) {
        if (pendingEffects.isNotEmpty() && textEffectRegistry != null) {
          for (effect in pendingEffects) {
            val effectProps = jsonStringToReadableMap(effect.props)
            val span = textEffectRegistry.createSpan(effect.name, effectProps)
            if (span != null) {
              spannable.setSpan(span, pendingEffectStart, start, Spannable.SPAN_EXCLUSIVE_INCLUSIVE)
            }
          }
        }
        pendingEffects = effects
        pendingEffectStart = start
      }

      start = end
    }

    // Flush any remaining pending effects after the last fragment
    if (pendingEffects.isNotEmpty() && textEffectRegistry != null) {
      for (effect in pendingEffects) {
        val effectProps = jsonStringToReadableMap(effect.props)
        val span = textEffectRegistry.createSpan(effect.name, effectProps)
        if (span != null) {
          spannable.setSpan(span, pendingEffectStart, start, Spannable.SPAN_EXCLUSIVE_INCLUSIVE)
        }
      }
    }

    return spannable
  }

  @OptIn(UnstableReactNativeAPI::class)
  fun getOrCreateSpannableForText(
      assets: AssetManager,
      attributedString: MapBuffer,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
  ): Spannable =
      getOrCreateSpannableForText(assets, attributedString, reactTextViewManagerCallback, null)

  @OptIn(UnstableReactNativeAPI::class)
  fun getOrCreateSpannableForText(
      assets: AssetManager,
      fontWeightAdjustment: Int,
      attributedString: MapBuffer,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
  ): Spannable =
      getOrCreateSpannableForText(
          assets,
          fontWeightAdjustment,
          attributedString,
          reactTextViewManagerCallback,
          null,
      )

  @OptIn(UnstableReactNativeAPI::class)
  internal fun getOrCreateSpannableForText(
      assets: AssetManager,
      attributedString: MapBuffer,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      textEffectRegistry: TextEffectRegistry?,
  ): Spannable =
      getOrCreateSpannableForText(
          assets,
          0,
          attributedString,
          reactTextViewManagerCallback,
          textEffectRegistry,
      )

  @OptIn(UnstableReactNativeAPI::class)
  internal fun getOrCreateSpannableForText(
      assets: AssetManager,
      fontWeightAdjustment: Int,
      attributedString: MapBuffer,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      textEffectRegistry: TextEffectRegistry?,
  ): Spannable {
    var text: Spannable?
    if (attributedString.contains(AS_KEY_CACHE_ID)) {
      val cacheId = attributedString.getInt(AS_KEY_CACHE_ID)
      text = checkNotNull(tagToSpannableCache[cacheId])
    } else {
      text =
          createSpannableFromAttributedString(
              assets,
              fontWeightAdjustment,
              attributedString.getMapBuffer(AS_KEY_FRAGMENTS),
              reactTextViewManagerCallback,
              null,
              textEffectRegistry,
          )
    }

    return text
  }

  @OptIn(UnstableReactNativeAPI::class)
  private fun createSpannableFromAttributedString(
      assets: AssetManager,
      fontWeightAdjustment: Int,
      fragments: MapBuffer,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      outputReactTags: IntArray?,
      textEffectRegistry: TextEffectRegistry? = null,
  ): Spannable {
    if (ReactNativeFeatureFlags.enableAndroidTextMeasurementOptimizations()) {
      val spannable =
          buildSpannableFromFragmentsOptimized(
              assets,
              fontWeightAdjustment,
              fragments,
              outputReactTags,
              textEffectRegistry,
          )

      reactTextViewManagerCallback?.onPostProcessSpannable(spannable)
      return spannable
    } else {
      val sb = SpannableStringBuilder()

      // The [SpannableStringBuilder] implementation require setSpan operation to be called
      // up-to-bottom, otherwise all the spannables that are within the region for which one may set
      // a new spannable will be wiped out
      val ops: MutableList<SetSpanOperation> = ArrayList()

      buildSpannableFromFragments(
          assets,
          fontWeightAdjustment,
          fragments,
          sb,
          ops,
          outputReactTags,
          textEffectRegistry,
      )

      // TODO T31905686: add support for inline Images
      // While setting the Spans on the final text, we also check whether any of them are images.
      for (priorityIndex in ops.indices) {
        val op = ops[ops.size - priorityIndex - 1]

        // Actual order of calling {@code execute} does NOT matter,
        // but the {@code priorityIndex} DOES matter.
        op.execute(sb, priorityIndex)
      }

      reactTextViewManagerCallback?.onPostProcessSpannable(sb)
      return sb
    }
  }

  private fun createLayout(
      text: Spannable,
      boring: BoringLayout.Metrics?,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      includeFontPadding: Boolean,
      textBreakStrategy: Int,
      hyphenationFrequency: Int,
      alignment: Layout.Alignment,
      justificationMode: Int,
      ellipsizeMode: TextUtils.TruncateAt?,
      maxNumberOfLines: Int,
      paint: TextPaint,
  ): Layout {
    // If our text is boring, and fully fits in the available space, we can represent the text
    // layout as a BoringLayout
    if (
        boring != null &&
            (widthYogaMeasureMode == YogaMeasureMode.UNDEFINED || boring.width <= floor(width))
    ) {
      // Guard uses floor() but layout width below uses ceil() for EXACTLY mode intentionally:
      // text that barely fails the floor-based guard falls through to StaticLayout, which also
      // ceils for EXACTLY — no wrapping results, just a slightly less optimal layout class in a
      // rare subpixel edge case.
      val layoutWidth =
          if (widthYogaMeasureMode == YogaMeasureMode.EXACTLY) ceil(width).toInt() else boring.width
      return BoringLayout.make(
          text,
          paint,
          layoutWidth,
          alignment,
          1f,
          0f,
          boring,
          includeFontPadding,
      )
    }

    val desiredWidth = ceil(Layout.getDesiredWidth(text, paint)).toInt()

    val layoutWidth =
        when (widthYogaMeasureMode) {
          YogaMeasureMode.EXACTLY -> ceil(width).toInt()
          YogaMeasureMode.AT_MOST -> min(desiredWidth, floor(width).toInt())
          else -> desiredWidth
        }
    return buildLayout(
        text,
        layoutWidth,
        includeFontPadding,
        textBreakStrategy,
        hyphenationFrequency,
        alignment,
        justificationMode,
        ellipsizeMode,
        maxNumberOfLines,
        paint,
    )
  }

  private fun buildLayout(
      text: Spannable,
      layoutWidth: Int,
      includeFontPadding: Boolean,
      textBreakStrategy: Int,
      hyphenationFrequency: Int,
      alignment: Layout.Alignment,
      justificationMode: Int,
      ellipsizeMode: TextUtils.TruncateAt?,
      maxNumberOfLines: Int,
      paint: TextPaint,
  ): Layout {
    val builder =
        StaticLayout.Builder.obtain(text, 0, text.length, paint, layoutWidth)
            .setAlignment(alignment)
            .setLineSpacing(0f, 1f)
            .setIncludePad(includeFontPadding)
            .setBreakStrategy(textBreakStrategy)
            .setHyphenationFrequency(hyphenationFrequency)

    if (maxNumberOfLines != ReactConstants.UNSET && maxNumberOfLines != 0) {
      builder.setEllipsize(ellipsizeMode).setMaxLines(maxNumberOfLines)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      builder.setJustificationMode(justificationMode)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      builder.setUseLineSpacingFromFallbacks(true)
    }

    return builder.build()
  }

  /**
   * Sets attributes on the TextPaint, used for content outside the Spannable text, like for empty
   * strings, or newlines after the last trailing character
   */
  @VisibleForTesting
  internal fun updateTextPaint(
      paint: TextPaint,
      baseTextAttributes: TextAttributeProps,
      assets: AssetManager,
      fontWeightAdjustment: Int,
  ) {
    if (baseTextAttributes.fontSize != ReactConstants.UNSET) {
      paint.textSize = baseTextAttributes.fontSize.toFloat()
    }

    if (
        baseTextAttributes.fontStyle != ReactConstants.UNSET ||
            baseTextAttributes.fontWeight != ReactConstants.UNSET ||
            baseTextAttributes.fontFamily != null
    ) {
      val typeface =
          ReactTypefaceUtils.applyStyles(
              null,
              baseTextAttributes.fontStyle,
              baseTextAttributes.fontWeight,
              baseTextAttributes.fontFamily,
              assets,
          )
      paint.setTypeface(
          ReactTypefaceUtils.applyFontWeightAdjustment(typeface, fontWeightAdjustment)
      )

      if (
          baseTextAttributes.fontStyle != ReactConstants.UNSET &&
              baseTextAttributes.fontStyle != typeface.style
      ) {
        // https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/core/java/android/widget/TextView.java;l=2536;drc=d262a68a1e0c3b640274b094a7f1e3a5b75563e9
        val missingStyle = baseTextAttributes.fontStyle and typeface.style.inv()
        paint.isFakeBoldText = missingStyle and Typeface.BOLD != 0
        paint.textSkewX = if ((missingStyle and Typeface.ITALIC) != 0) -0.25f else 0f
      }
    } else {
      val typeface = ReactTypefaceUtils.applyFontWeightAdjustment(null, fontWeightAdjustment)
      if (typeface != null) {
        paint.setTypeface(typeface)
      }
    }
  }

  /**
   * WARNING: This paint should not be used for any layouts which may escape TextLayoutManager, as
   * they may need to be drawn later, and may not safely be reused
   */
  private fun scratchPaintWithAttributes(
      baseTextAttributes: TextAttributeProps,
      assets: AssetManager,
      fontWeightAdjustment: Int,
  ): TextPaint {
    val paint = checkNotNull(textPaintInstance.get())
    paint.setTypeface(null)
    paint.textSize = 12f
    paint.isFakeBoldText = false
    paint.textSkewX = 0f
    updateTextPaint(paint, baseTextAttributes, assets, fontWeightAdjustment)
    return paint
  }

  private fun newPaintWithAttributes(
      baseTextAttributes: TextAttributeProps,
      assets: AssetManager,
      fontWeightAdjustment: Int,
  ): TextPaint {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
    updateTextPaint(paint, baseTextAttributes, assets, fontWeightAdjustment)
    return paint
  }

  @OptIn(UnstableReactNativeAPI::class)
  private fun createLayoutForMeasurement(
      assets: AssetManager,
      fontWeightAdjustment: Int,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      textEffectRegistry: TextEffectRegistry? = null,
  ): Layout {
    val text =
        getOrCreateSpannableForText(
            assets,
            fontWeightAdjustment,
            attributedString,
            reactTextViewManagerCallback,
            textEffectRegistry,
        )

    val paint: TextPaint
    if (attributedString.contains(AS_KEY_CACHE_ID)) {
      paint = text.getSpans(0, 0, ReactTextPaintHolderSpan::class.java)[0].textPaint
    } else {
      val baseTextAttributes =
          TextAttributeProps.fromMapBuffer(attributedString.getMapBuffer(AS_KEY_BASE_ATTRIBUTES))
      paint = scratchPaintWithAttributes(baseTextAttributes, assets, fontWeightAdjustment)
    }

    return createLayout(
            text,
            paint,
            attributedString,
            paragraphAttributes,
            width,
            widthYogaMeasureMode,
            height,
            heightYogaMeasureMode,
        )
        .layout
  }

  private fun createLayout(
      text: Spannable,
      paint: TextPaint,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
  ): CreateLayoutResult {
    val boring = isBoring(text, paint)

    val textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(
            paragraphAttributes.getString(PA_KEY_TEXT_BREAK_STRATEGY)
        )
    val includeFontPadding =
        if (paragraphAttributes.contains(PA_KEY_INCLUDE_FONT_PADDING))
            paragraphAttributes.getBoolean(PA_KEY_INCLUDE_FONT_PADDING)
        else DEFAULT_INCLUDE_FONT_PADDING
    val hyphenationFrequency =
        TextAttributeProps.getHyphenationFrequency(
            paragraphAttributes.getString(PA_KEY_HYPHENATION_FREQUENCY)
        )
    val adjustFontSizeToFit =
        if (paragraphAttributes.contains(PA_KEY_ADJUST_FONT_SIZE_TO_FIT))
            paragraphAttributes.getBoolean(PA_KEY_ADJUST_FONT_SIZE_TO_FIT)
        else DEFAULT_ADJUST_FONT_SIZE_TO_FIT
    val maximumNumberOfLines =
        if (paragraphAttributes.contains(PA_KEY_MAX_NUMBER_OF_LINES))
            paragraphAttributes.getInt(PA_KEY_MAX_NUMBER_OF_LINES)
        else ReactConstants.UNSET
    val ellipsizeMode =
        if (paragraphAttributes.contains(PA_KEY_ELLIPSIZE_MODE))
            TextAttributeProps.getEllipsizeMode(
                paragraphAttributes.getString(PA_KEY_ELLIPSIZE_MODE)
            )
        else null

    // T226571629: textAlign should be moved to ParagraphAttributes
    val alignmentAttr = getTextAlignmentAttr(attributedString)
    val alignment = getTextAlignment(attributedString, text, alignmentAttr)
    val justificationMode = getTextJustificationMode(alignmentAttr)

    if (adjustFontSizeToFit) {
      val minimumFontSize =
          if (paragraphAttributes.contains(PA_KEY_MINIMUM_FONT_SIZE))
              paragraphAttributes.getDouble(PA_KEY_MINIMUM_FONT_SIZE).toFloat()
          else Float.NaN

      adjustSpannableFontToFit(
          text,
          width,
          YogaMeasureMode.EXACTLY,
          height,
          heightYogaMeasureMode,
          minimumFontSize,
          maximumNumberOfLines,
          includeFontPadding,
          textBreakStrategy,
          hyphenationFrequency,
          alignment,
          justificationMode,
          paint,
      )
    }

    return CreateLayoutResult(
        createLayout(
            text,
            boring,
            width,
            widthYogaMeasureMode,
            includeFontPadding,
            textBreakStrategy,
            hyphenationFrequency,
            alignment,
            justificationMode,
            ellipsizeMode,
            maximumNumberOfLines,
            paint,
        ),
        textBreakStrategy,
        justificationMode,
    )
  }

  @JvmStatic
  @OptIn(UnstableReactNativeAPI::class)
  fun createPreparedLayout(
      assets: AssetManager,
      attributedString: ReadableMapBuffer,
      paragraphAttributes: ReadableMapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      textEffectRegistry: TextEffectRegistry? = null,
  ): PreparedLayout =
      createPreparedLayout(
          assets,
          0,
          attributedString,
          paragraphAttributes,
          width,
          widthYogaMeasureMode,
          height,
          heightYogaMeasureMode,
          reactTextViewManagerCallback,
          textEffectRegistry,
      )

  @JvmStatic
  @OptIn(UnstableReactNativeAPI::class)
  fun createPreparedLayout(
      assets: AssetManager,
      fontWeightAdjustment: Int,
      attributedString: ReadableMapBuffer,
      paragraphAttributes: ReadableMapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      textEffectRegistry: TextEffectRegistry? = null,
  ): PreparedLayout {
    val fragments = attributedString.getMapBuffer(AS_KEY_FRAGMENTS)
    val reactTags = IntArray(fragments.count)
    val text =
        createSpannableFromAttributedString(
            assets,
            fontWeightAdjustment,
            fragments,
            reactTextViewManagerCallback,
            reactTags,
            textEffectRegistry,
        )
    val baseTextAttributes =
        TextAttributeProps.fromMapBuffer(attributedString.getMapBuffer(AS_KEY_BASE_ATTRIBUTES))
    val result =
        createLayout(
            text,
            newPaintWithAttributes(baseTextAttributes, assets, fontWeightAdjustment),
            attributedString,
            paragraphAttributes,
            width,
            widthYogaMeasureMode,
            height,
            heightYogaMeasureMode,
        )

    val maximumNumberOfLines =
        if (paragraphAttributes.contains(PA_KEY_MAX_NUMBER_OF_LINES))
            paragraphAttributes.getInt(PA_KEY_MAX_NUMBER_OF_LINES)
        else ReactConstants.UNSET

    val verticalOffset =
        getVerticalOffset(
            result.layout,
            paragraphAttributes,
            height,
            heightYogaMeasureMode,
            maximumNumberOfLines,
        )

    return PreparedLayout(
        result.layout,
        maximumNumberOfLines,
        verticalOffset,
        reactTags,
        result.textBreakStrategy,
        result.justificationMode,
    )
  }

  @JvmStatic
  fun adjustSpannableFontToFit(
      text: Spannable,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      minimumFontSizeAttr: Float,
      maximumNumberOfLines: Int,
      includeFontPadding: Boolean,
      textBreakStrategy: Int,
      hyphenationFrequency: Int,
      alignment: Layout.Alignment,
      justificationMode: Int,
      paint: TextPaint,
  ): Unit {
    var boring = isBoring(text, paint)
    var layout: Layout

    // Minimum font size is 4pts to match the iOS implementation.
    val minimumFontSize =
        (if (minimumFontSizeAttr.isNaN()) 4.dpToPx() else minimumFontSizeAttr).toInt()

    // Find the largest font size used in the spannable to use as a starting point.
    var currentFontSize = minimumFontSize
    val spans = text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java)
    for (span in spans) {
      currentFontSize = max(currentFontSize, span.size).toInt()
    }

    var intervalStart = minimumFontSize
    var intervalEnd = currentFontSize
    var previousFontSize = currentFontSize

    // `true` instead of `intervalStart != intervalEnd` so that the last iteration where both are at
    // the same size goes through and updates all relevant objects with the final font size
    while (true) {
      // Always use the point closer to the end of the interval, this way at the end when
      // end - start == 1, we land at current = end instead of current = start. In the first case
      // one measurement may be enough if intervalEnd is small enough to fit. In the second case
      // we always end up doing two measurements to check whether intervalEnd would fit.
      val currentFontSize = (intervalStart + intervalEnd + 1) / 2

      val ratio = currentFontSize.toFloat() / previousFontSize.toFloat()
      paint.textSize = max((paint.textSize * ratio).toInt(), minimumFontSize).toFloat()

      val sizeSpans = text.getSpans(0, text.length, ReactAbsoluteSizeSpan::class.java)
      for (span in sizeSpans) {
        text.setSpan(
            ReactAbsoluteSizeSpan(max((span.size * ratio).toInt(), minimumFontSize)),
            text.getSpanStart(span),
            text.getSpanEnd(span),
            text.getSpanFlags(span),
        )
        text.removeSpan(span)
      }
      if (boring != null) {
        boring = isBoring(text, paint)
      }
      layout =
          createLayout(
              text,
              boring,
              width,
              widthYogaMeasureMode,
              includeFontPadding,
              textBreakStrategy,
              hyphenationFrequency,
              alignment,
              justificationMode,
              null,
              ReactConstants.UNSET,
              paint,
          )

      if (intervalStart == intervalEnd) {
        // everything is updated at this point
        break
      }

      val singleLineTextExceedsWidth = text.length == 1 && layout.getLineWidth(0) > width
      val exceedsHeight =
          heightYogaMeasureMode != YogaMeasureMode.UNDEFINED && layout.height > height
      val exceedsMaximumNumberOfLines =
          maximumNumberOfLines != ReactConstants.UNSET &&
              maximumNumberOfLines != 0 &&
              layout.lineCount > maximumNumberOfLines

      if (
          currentFontSize > minimumFontSize &&
              (exceedsMaximumNumberOfLines || exceedsHeight || singleLineTextExceedsWidth)
      ) {
        // Text doesn't fit the constraints. If intervalEnd - intervalStart == 1, it's known that
        // the correct font size is intervalStart. Set intervalEnd to match intervalStart and do one
        // more iteration to update layout correctly.
        intervalEnd = if (intervalEnd - intervalStart == 1) intervalStart else currentFontSize
      } else {
        // Text fits the constraints
        intervalStart = currentFontSize
      }

      previousFontSize = currentFontSize
    }
  }

  @JvmStatic
  @OptIn(UnstableReactNativeAPI::class)
  fun measureText(
      assets: AssetManager,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      attachmentsPositions: FloatArray?,
      textEffectRegistry: TextEffectRegistry? = null,
  ): Long =
      measureText(
          assets,
          0,
          attributedString,
          paragraphAttributes,
          width,
          widthYogaMeasureMode,
          height,
          heightYogaMeasureMode,
          reactTextViewManagerCallback,
          attachmentsPositions,
          textEffectRegistry,
      )

  @JvmStatic
  @OptIn(UnstableReactNativeAPI::class)
  fun measureText(
      assets: AssetManager,
      fontWeightAdjustment: Int,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      attachmentsPositions: FloatArray?,
      textEffectRegistry: TextEffectRegistry? = null,
  ): Long {
    // TODO(5578671): Handle text direction (see View#getTextDirectionHeuristic)
    val layout =
        createLayoutForMeasurement(
            assets,
            fontWeightAdjustment,
            attributedString,
            paragraphAttributes,
            width,
            widthYogaMeasureMode,
            height,
            heightYogaMeasureMode,
            reactTextViewManagerCallback,
            textEffectRegistry,
        )

    val maximumNumberOfLines =
        if (paragraphAttributes.contains(PA_KEY_MAX_NUMBER_OF_LINES))
            paragraphAttributes.getInt(PA_KEY_MAX_NUMBER_OF_LINES)
        else ReactConstants.UNSET

    val text = layout.text as Spanned

    val calculatedLineCount = calculateLineCount(layout, maximumNumberOfLines)
    val calculatedWidth =
        calculateWidth(layout, text, width, widthYogaMeasureMode, calculatedLineCount)
    val calculatedHeight =
        calculateHeight(layout, height, heightYogaMeasureMode, calculatedLineCount)

    if (attachmentsPositions != null) {
      var attachmentIndex = 0
      var lastAttachmentFoundInSpan: Int

      val metrics = AttachmentMetrics()
      var i = 0
      while (i < text.length) {
        lastAttachmentFoundInSpan =
            nextAttachmentMetrics(
                layout,
                text,
                calculatedWidth,
                calculatedLineCount,
                i,
                0f,
                metrics,
            )
        if (metrics.wasFound) {
          attachmentsPositions[attachmentIndex] = metrics.top.pxToDp()
          attachmentsPositions[attachmentIndex + 1] = metrics.left.pxToDp()
          attachmentIndex += 2
        }
        i = lastAttachmentFoundInSpan
      }
    }

    val widthInSP = calculatedWidth.pxToDp()
    val heightInSP = calculatedHeight.pxToDp()

    return YogaMeasureOutput.make(widthInSP, heightInSP)
  }

  @JvmStatic
  fun measurePreparedLayout(
      preparedLayout: PreparedLayout,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
  ): FloatArray {
    val layout = preparedLayout.layout
    val text = layout.text as Spanned
    val maximumNumberOfLines = preparedLayout.maximumNumberOfLines

    val calculatedLineCount = calculateLineCount(layout, maximumNumberOfLines)
    val calculatedWidth =
        calculateWidth(layout, text, width, widthYogaMeasureMode, calculatedLineCount)
    val calculatedHeight =
        calculateHeight(layout, height, heightYogaMeasureMode, calculatedLineCount)

    val retList = ArrayList<Float>()
    retList.add(calculatedWidth.pxToDp())
    retList.add(calculatedHeight.pxToDp())

    val metrics = AttachmentMetrics()
    var lastAttachmentFoundInSpan: Int
    run {
      var i = 0
      while (i < text.length) {
        lastAttachmentFoundInSpan =
            nextAttachmentMetrics(
                layout,
                text,
                calculatedWidth,
                calculatedLineCount,
                i,
                preparedLayout.verticalOffset,
                metrics,
            )
        if (metrics.wasFound) {
          retList.add(metrics.top.pxToDp())
          retList.add(metrics.left.pxToDp())
          retList.add(metrics.width.pxToDp())
          retList.add(metrics.height.pxToDp())
        }
        i = lastAttachmentFoundInSpan
      }
    }

    val ret = FloatArray(retList.size)
    for (i in retList.indices) {
      ret[i] = retList[i]
    }
    return ret
  }

  private fun getVerticalOffset(
      layout: Layout,
      paragraphAttributes: ReadableMapBuffer,
      height: Float,
      heightMeasureMode: YogaMeasureMode,
      maximumNumberOfLines: Int,
  ): Float {
    val textAlignVertical =
        if (paragraphAttributes.contains(PA_KEY_TEXT_ALIGN_VERTICAL))
            paragraphAttributes.getString(PA_KEY_TEXT_ALIGN_VERTICAL)
        else null

    if (textAlignVertical == null) {
      return 0f
    }

    val textHeight = layout.height
    val calculatedLineCount = calculateLineCount(layout, maximumNumberOfLines)
    val boxHeight = calculateHeight(layout, height, heightMeasureMode, calculatedLineCount)

    if (textHeight > boxHeight) {
      return 0f
    }

    when (textAlignVertical) {
      "auto",
      "top" -> return 0f
      "center" -> return (boxHeight - textHeight) / 2f
      "bottom" -> return boxHeight - textHeight
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid textAlignVertical: $textAlignVertical")
        return 0f
      }
    }
  }

  private fun calculateLineCount(layout: Layout, maximumNumberOfLines: Int): Int =
      if (maximumNumberOfLines == ReactConstants.UNSET || maximumNumberOfLines == 0)
          layout.lineCount
      else min(maximumNumberOfLines, layout.lineCount)

  private fun calculateWidth(
      layout: Layout,
      text: Spanned,
      width: Float,
      widthYogaMeasureMode: YogaMeasureMode,
      calculatedLineCount: Int,
  ): Float {
    // Our layout must be created at a physical pixel boundary, so may be sized smaller by a
    // subpixel compared to the assigned layout width.
    if (widthYogaMeasureMode == YogaMeasureMode.EXACTLY) {
      return width
    }

    return layout.width.toFloat()
  }

  private fun calculateHeight(
      layout: Layout,
      height: Float,
      heightYogaMeasureMode: YogaMeasureMode,
      calculatedLineCount: Int,
  ): Float {
    var calculatedHeight = height
    if (heightYogaMeasureMode != YogaMeasureMode.EXACTLY) {
      // StaticLayout only seems to change its height in response to maxLines when ellipsizing, so
      // we must truncate
      calculatedHeight = layout.getLineBottom(calculatedLineCount - 1).toFloat()
      if (heightYogaMeasureMode == YogaMeasureMode.AT_MOST && calculatedHeight > height) {
        calculatedHeight = height
      }
    }
    return calculatedHeight
  }

  private fun nextAttachmentMetrics(
      layout: Layout,
      text: Spanned,
      calculatedWidth: Float,
      calculatedLineCount: Int,
      i: Int,
      verticalOffset: Float,
      metrics: AttachmentMetrics,
  ): Int {
    // Calculate the positions of the attachments (views) that will be rendered inside the
    // Spanned Text. The following logic is only executed when a text contains views inside.
    // This follows a similar logic than used in pre-fabric (see ReactTextView.onLayout method).
    val lastAttachmentFoundInSpan =
        text.nextSpanTransition(i, text.length, TextInlineViewPlaceholderSpan::class.java)
    val placeholders =
        text.getSpans(i, lastAttachmentFoundInSpan, TextInlineViewPlaceholderSpan::class.java)

    if (placeholders.size == 0) {
      metrics.wasFound = false
      return lastAttachmentFoundInSpan
    }

    Assertions.assertCondition(placeholders.size == 1)
    val placeholder = placeholders[0]

    val start = text.getSpanStart(placeholder)
    val line = layout.getLineForOffset(start)
    val isLineTruncated = layout.getEllipsisCount(line) > 0
    val isAttachmentTruncated =
        line > calculatedLineCount ||
            (isLineTruncated && start >= layout.getLineStart(line) + layout.getEllipsisStart(line))
    if (isAttachmentTruncated) {
      metrics.top = Float.NaN
      metrics.left = Float.NaN
    } else {
      val placeholderWidth = placeholder.width.toFloat()
      val placeholderHeight = placeholder.height.toFloat()

      // Calculate if the direction of the placeholder character is Right-To-Left.
      val isRtlChar = layout.isRtlCharAt(start)
      val isRtlParagraph = layout.getParagraphDirection(line) == Layout.DIR_RIGHT_TO_LEFT

      // The direction of the paragraph may not be exactly the direction the string is heading in at
      // the position of the placeholder. So, if the direction of the character is the same as the
      // paragraph use primary, secondary otherwise.
      val characterAndParagraphDirectionMatch = isRtlParagraph == isRtlChar
      var placeholderLeftPosition =
          if (characterAndParagraphDirectionMatch) layout.getPrimaryHorizontal(start)
          else layout.getSecondaryHorizontal(start)
      if (isRtlChar) {
        placeholderLeftPosition -= placeholderWidth
      }

      // Vertically align the inline view to the baseline of the line of text.
      val placeholderTopPosition = layout.getLineBaseline(line) - placeholderHeight

      // The attachment array returns the positions of each of the attachments as
      metrics.top = placeholderTopPosition
      metrics.left = placeholderLeftPosition
    }

    // The text may be vertically aligned to the top, center, or bottom of the container. This is
    // not captured in the Layout, but rather applied separately. We need to account for this here.
    metrics.top += verticalOffset

    metrics.wasFound = true
    metrics.width = placeholder.width.toFloat()
    metrics.height = placeholder.height.toFloat()
    return lastAttachmentFoundInSpan
  }

  @JvmStatic
  @OptIn(UnstableReactNativeAPI::class)
  fun measureLines(
      assetManager: AssetManager,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      height: Float,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      textEffectRegistry: TextEffectRegistry? = null,
  ): WritableArray =
      measureLines(
          assetManager,
          0,
          attributedString,
          paragraphAttributes,
          width,
          height,
          reactTextViewManagerCallback,
          textEffectRegistry,
      )

  @JvmStatic
  @OptIn(UnstableReactNativeAPI::class)
  fun measureLines(
      assetManager: AssetManager,
      fontWeightAdjustment: Int,
      attributedString: MapBuffer,
      paragraphAttributes: MapBuffer,
      width: Float,
      height: Float,
      reactTextViewManagerCallback: ReactTextViewManagerCallback?,
      textEffectRegistry: TextEffectRegistry? = null,
  ): WritableArray {
    val layout =
        createLayoutForMeasurement(
            assetManager,
            fontWeightAdjustment,
            attributedString,
            paragraphAttributes,
            width,
            YogaMeasureMode.EXACTLY,
            height,
            YogaMeasureMode.EXACTLY,
            reactTextViewManagerCallback,
            textEffectRegistry,
        )
    return FontMetricsUtil.getFontMetrics(
        layout.text,
        layout,
        DisplayMetricsHolder.getScreenDisplayMetrics(),
    )
  }

  private fun isBoring(text: Spannable, paint: TextPaint): BoringLayout.Metrics? {
    val metrics =
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
          BoringLayout.isBoring(text, paint)
        } else {
          // Default to include fallback line spacing on Android 13+, like TextView
          // https://cs.android.com/android/_/android/platform/frameworks/base/+/78c774defb238c05c42b34a12b6b3b0c64844ed7
          BoringLayout.isBoring(text, paint, TextDirectionHeuristics.FIRSTSTRONG_LTR, true, null)
        }

    // BoringLayout.isBoring() sometimes thinks text width is negative for some strings, even on
    // Android 15+. Fallback to StaticLayout.
    if (metrics == null || metrics.width < 0) {
      return null
    }

    return metrics
  }

  private class CreateLayoutResult(
      val layout: Layout,
      val textBreakStrategy: Int,
      val justificationMode: Int,
  )

  private class AttachmentMetrics {
    var wasFound: Boolean = false
    var top: Float = 0f
    var left: Float = 0f
    var width: Float = 0f
    var height: Float = 0f
  }

  private fun jsonStringToReadableMap(json: String?): ReadableMap? {
    if (json == null) return null
    return try {
      jsonObjectToReadableMap(JSONObject(json))
    } catch (_: Exception) {
      null
    }
  }

  private fun jsonObjectToReadableMap(jsonObject: JSONObject): JavaOnlyMap {
    val map = JavaOnlyMap()
    val keys = jsonObject.keys()
    while (keys.hasNext()) {
      val key = keys.next()
      putJsonValue(map, key, jsonObject.get(key))
    }
    return map
  }

  private fun jsonArrayToReadableArray(jsonArray: JSONArray): JavaOnlyArray {
    val array = JavaOnlyArray()
    for (i in 0 until jsonArray.length()) {
      pushJsonValue(array, jsonArray.get(i))
    }
    return array
  }

  private fun putJsonValue(map: JavaOnlyMap, key: String, value: Any) {
    when (value) {
      JSONObject.NULL -> map.putNull(key)
      is Boolean -> map.putBoolean(key, value)
      is Number -> map.putDouble(key, value.toDouble())
      is String -> map.putString(key, value)
      is JSONObject -> map.putMap(key, jsonObjectToReadableMap(value))
      is JSONArray -> map.putArray(key, jsonArrayToReadableArray(value))
      else ->
          FLog.w(
              ReactConstants.TAG,
              "Unsupported text effect prop type for key $key: ${value.javaClass.name}",
          )
    }
  }

  private fun pushJsonValue(array: JavaOnlyArray, value: Any) {
    when (value) {
      JSONObject.NULL -> array.pushNull()
      is Boolean -> array.pushBoolean(value)
      is Number -> array.pushDouble(value.toDouble())
      is String -> array.pushString(value)
      is JSONObject -> array.pushMap(jsonObjectToReadableMap(value))
      is JSONArray -> array.pushArray(jsonArrayToReadableArray(value))
      else ->
          FLog.w(
              ReactConstants.TAG,
              "Unsupported text effect prop type: ${value.javaClass.name}",
          )
    }
  }
}
