/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Outline
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.graphics.drawable.DrawableWrapper
import android.graphics.drawable.LayerDrawable
import android.os.Build
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusStyle

/**
 * CompositeBackgroundDrawable can overlay multiple different layers, shadows, and native effects
 * such as ripple, into an Android View's background drawable.
 */
@OptIn(UnstableReactNativeAPI::class)
internal class CompositeBackgroundDrawable(
    private val context: Context,
    /**
     * Any non-react-managed background already part of the view, like one set as Android style on a
     * TextInput
     */
    val originalBackground: Drawable? = null,

    /** Non-inset box shadows */
    val outerShadows: List<Drawable> = emptyList(),

    /** Background rendering Layer */
    val background: BackgroundDrawable? = null,

    /** Background image rendering Layer */
    val backgroundImage: BackgroundImageDrawable? = null,

    /** Border rendering Layer */
    val border: BorderDrawable? = null,

    /** TouchableNativeFeeback set selection background, like "SelectableBackground" */
    val feedbackUnderlay: Drawable? = null,

    /** Inset box-shadows */
    val innerShadows: List<Drawable> = emptyList(),

    /** Outline */
    val outline: OutlineDrawable? = null,

    // Holder value for currently set insets
    var borderInsets: BorderInsets? = null,

    // Holder value for currently set border radius
    var borderRadius: BorderRadiusStyle? = null,
) :
    LayerDrawable(
        createLayersArray(
            originalBackground,
            outerShadows,
            background,
            backgroundImage,
            border,
            feedbackUnderlay,
            innerShadows,
            outline,
        ),
    ) {

  init {
    // We want to overlay drawables, instead of placing future drawables within the content area of
    // previous ones. E.g. an EditText style may set padding on a TextInput, but we don't want to
    // constrain background color to the area inside of the padding.
    setPaddingMode(LayerDrawable.PADDING_MODE_STACK)
  }

  fun withNewBackgroundImage(
      backgroundImage: BackgroundImageDrawable?,
  ): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        background,
        backgroundImage,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  fun withNewBackground(background: BackgroundDrawable?): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        background,
        backgroundImage,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  fun withNewShadows(
      outerShadows: List<Drawable>,
      innerShadows: List<Drawable>,
  ): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        background,
        backgroundImage,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  fun withNewBorder(border: BorderDrawable): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        background,
        backgroundImage,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  fun withNewOutline(outline: OutlineDrawable): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        background,
        backgroundImage,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  fun withNewFeedbackUnderlay(newUnderlay: Drawable?): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        background,
        backgroundImage,
        border,
        newUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  /* Android's elevation implementation requires this to be implemented to know where to draw the
  elevation shadow. */
  override fun getOutline(outline: Outline) {
    if (borderRadius?.hasRoundedBorders() == true) {
      val pathForOutline = Path()

      val computedBorderRadius =
          borderRadius?.resolve(
              layoutDirection,
              context,
              bounds.width().toFloat(),
              bounds.height().toFloat(),
          )

      val computedBorderInsets = borderInsets?.resolve(layoutDirection, context)

      computedBorderRadius?.let {
        pathForOutline.addRoundRect(
            RectF(bounds),
            floatArrayOf(
                (it.topLeft.horizontal + (computedBorderInsets?.left ?: 0f)).dpToPx(),
                (it.topLeft.vertical + (computedBorderInsets?.top ?: 0f)).dpToPx(),
                (it.topRight.horizontal + (computedBorderInsets?.right ?: 0f)).dpToPx(),
                (it.topRight.vertical + (computedBorderInsets?.top ?: 0f)).dpToPx(),
                (it.bottomRight.horizontal + (computedBorderInsets?.right ?: 0f)).dpToPx(),
                (it.bottomRight.vertical + (computedBorderInsets?.bottom ?: 0f)).dpToPx(),
                (it.bottomLeft.horizontal + (computedBorderInsets?.left ?: 0f)).dpToPx(),
                (it.bottomLeft.vertical + (computedBorderInsets?.bottom ?: 0f)).dpToPx(),
            ),
            Path.Direction.CW,
        )
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        outline.setPath(pathForOutline)
      } else {
        @Suppress("DEPRECATION") outline.setConvexPath(pathForOutline)
      }
    } else {
      outline.setRect(bounds)
    }
  }

  companion object {
    private fun createLayersArray(
        originalBackground: Drawable?,
        outerShadows: List<Drawable>,
        background: BackgroundDrawable?,
        backgroundImage: BackgroundImageDrawable?,
        border: BorderDrawable?,
        feedbackUnderlay: Drawable?,
        innerShadows: List<Drawable>,
        outline: OutlineDrawable?,
    ): Array<Drawable?> {
      val layers = mutableListOf<Drawable?>()
      originalBackground?.let { layers.add(it) }
      layers.addAll(outerShadows.asReversed())
      background?.let { layers.add(it) }
      backgroundImage?.let { layers.add(it) }
      border?.let { layers.add(it) }
      feedbackUnderlay?.let {
        layers.add(
            if (ReactNativeFeatureFlags.fixBorderlessRippleAndroid()) {
              UnprojectedRippleWrapper(it)
            } else {
              it
            }
        )
      }
      layers.addAll(innerShadows.asReversed())
      outline?.let { layers.add(it) }
      return layers.toTypedArray()
    }
  }
}

/**
 * Wraps the feedback underlay so it is never reported as projected. LayerDrawable reports itself as
 * projected if any layer is, so a borderless ripple in the feedback underlay would project the
 * entire background, including the background color and borders, onto the nearest native ancestor's
 * background. With view flattening, that ancestor may be painted under the view's flattened React
 * parent, hiding the background and ripple. Ignore the underlay's projection; borderless ripples
 * can still draw outside the view's bounds since React Native views don't clip their children.
 */
private class UnprojectedRippleWrapper(drawable: Drawable) : DrawableWrapper(drawable) {
  override fun isProjected(): Boolean = false

  override fun getDirtyBounds(): Rect = drawable?.dirtyBounds ?: super.getDirtyBounds()
}
