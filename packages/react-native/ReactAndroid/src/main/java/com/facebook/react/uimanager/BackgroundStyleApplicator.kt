/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.ImageView
import androidx.annotation.ColorInt
import com.facebook.react.R
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.drawable.BackgroundDrawable
import com.facebook.react.uimanager.drawable.BackgroundImageDrawable
import com.facebook.react.uimanager.drawable.BorderDrawable
import com.facebook.react.uimanager.drawable.CompositeBackgroundDrawable
import com.facebook.react.uimanager.drawable.InsetBoxShadowDrawable
import com.facebook.react.uimanager.drawable.MIN_INSET_BOX_SHADOW_SDK_VERSION
import com.facebook.react.uimanager.drawable.MIN_OUTSET_BOX_SHADOW_SDK_VERSION
import com.facebook.react.uimanager.drawable.OutlineDrawable
import com.facebook.react.uimanager.drawable.OutsetBoxShadowDrawable
import com.facebook.react.uimanager.style.BackgroundImageLayer
import com.facebook.react.uimanager.style.BackgroundPosition
import com.facebook.react.uimanager.style.BackgroundRepeat
import com.facebook.react.uimanager.style.BackgroundSize
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.BoxShadow
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.uimanager.style.OutlineStyle

/**
 * Utility object responsible for applying backgrounds, borders, and related visual effects to
 * Android views.
 *
 * This object provides methods to manage background colors, images, borders, outlines, and box
 * shadows for React Native views. It handles the complex layering and composition of these visual
 * properties by managing [CompositeBackgroundDrawable] instances.
 */
@OptIn(UnstableReactNativeAPI::class)
public object BackgroundStyleApplicator {

  /**
   * Sets the background color of the view.
   *
   * @param view The view to apply the background color to
   * @param color The color to set, or null to remove the background color
   */
  @JvmStatic
  public fun setBackgroundColor(view: View, @ColorInt color: Int?) {
    // No color to set, and no color already set
    if (
        (color == null || color == Color.TRANSPARENT) &&
            view.background !is CompositeBackgroundDrawable
    ) {
      return
    }

    ensureBackgroundDrawable(view).backgroundColor = color ?: Color.TRANSPARENT
  }

  /**
   * Sets the background image layers for the view.
   *
   * @param view The view to apply the background images to
   * @param backgroundImageLayers The list of background image layers to apply, or null to remove
   */
  @JvmStatic
  public fun setBackgroundImage(
      view: View,
      backgroundImageLayers: List<BackgroundImageLayer>?,
  ) {
    ensureBackgroundImageDrawable(view).backgroundImageLayers = backgroundImageLayers
  }

  @JvmStatic
  internal fun setBackgroundSize(view: View, backgroundSizes: List<BackgroundSize>?) {
    ensureBackgroundImageDrawable(view).backgroundSize = backgroundSizes
  }

  @JvmStatic
  internal fun setBackgroundPosition(
      view: View,
      backgroundPositions: List<BackgroundPosition>?,
  ) {
    ensureBackgroundImageDrawable(view).backgroundPosition = backgroundPositions
  }

  @JvmStatic
  internal fun setBackgroundRepeat(view: View, backgroundRepeats: List<BackgroundRepeat>?) {
    ensureBackgroundImageDrawable(view).backgroundRepeat = backgroundRepeats
  }

  /**
   * Gets the background color of the view.
   *
   * @param view The view to get the background color from
   * @return The background color, or null if no background color is set
   */
  @JvmStatic
  @ColorInt
  public fun getBackgroundColor(view: View): Int? {
    return getBackground(view)?.backgroundColor
  }

  /**
   * Sets the border width for a specific edge of the view.
   *
   * @param view The view to apply the border width to
   * @param edge The logical edge (start, end, top, bottom, etc.) to set the width for
   * @param width The border width in DIPs, or null to remove
   */
  @JvmStatic
  public fun setBorderWidth(view: View, edge: LogicalEdge, width: Float?) {
    val composite = ensureCompositeBackgroundDrawable(view)
    composite.borderInsets = composite.borderInsets ?: BorderInsets()
    composite.borderInsets?.setBorderWidth(edge, width)

    ensureBorderDrawable(view).setBorderWidth(edge.toSpacingType(), width?.dpToPx() ?: Float.NaN)
    composite.background?.borderInsets = composite.borderInsets
    composite.backgroundImage?.borderInsets = composite.borderInsets
    composite.border?.borderInsets = composite.borderInsets

    composite.background?.invalidateSelf()
    composite.backgroundImage?.invalidateSelf()
    composite.border?.invalidateSelf()

    composite.borderInsets = composite.borderInsets ?: BorderInsets()
    composite.borderInsets?.setBorderWidth(edge, width)

    if (Build.VERSION.SDK_INT >= MIN_INSET_BOX_SHADOW_SDK_VERSION) {
      for (shadow in composite.innerShadows.filterIsInstance<InsetBoxShadowDrawable>()) {
        shadow.borderInsets = composite.borderInsets
      }
    }
  }

  /**
   * Gets the border width for a specific edge of the view.
   *
   * @param view The view to get the border width from
   * @param edge The logical edge to get the width for
   * @return The border width in DIPs, or null if not set
   */
  @JvmStatic
  public fun getBorderWidth(view: View, edge: LogicalEdge): Float? {
    val width = getBorder(view)?.borderWidth?.getRaw(edge.toSpacingType())
    if (width == null || width.isNaN()) {
      return null
    } else {
      return width.pxToDp()
    }
  }

  /**
   * Sets the border color for a specific edge of the view.
   *
   * @param view The view to apply the border color to
   * @param edge The logical edge to set the color for
   * @param color The border color, or null to remove
   */
  @JvmStatic
  public fun setBorderColor(view: View, edge: LogicalEdge, @ColorInt color: Int?) {
    ensureBorderDrawable(view).setBorderColor(edge, color)
  }

  /**
   * Gets the border color for a specific edge of the view.
   *
   * @param view The view to get the border color from
   * @param edge The logical edge to get the color for
   * @return The border color, or null if not set
   */
  @JvmStatic
  @ColorInt
  public fun getBorderColor(view: View, edge: LogicalEdge): Int? {
    return getBorder(view)?.getBorderColor(edge)
  }

  /**
   * Sets the border radius for a specific corner of the view.
   *
   * @param view The view to apply the border radius to
   * @param corner The corner property to set the radius for
   * @param radius The border radius value (length or percentage), or null to remove
   */
  @JvmStatic
  public fun setBorderRadius(
      view: View,
      corner: BorderRadiusProp,
      radius: LengthPercentage?,
  ) {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    compositeBackgroundDrawable.borderRadius =
        compositeBackgroundDrawable.borderRadius ?: BorderRadiusStyle()
    compositeBackgroundDrawable.borderRadius?.set(corner, radius)

    if (view is ImageView) {
      ensureBackgroundDrawable(view)
    }
    compositeBackgroundDrawable.background?.borderRadius = compositeBackgroundDrawable.borderRadius
    compositeBackgroundDrawable.backgroundImage?.borderRadius =
        compositeBackgroundDrawable.borderRadius
    compositeBackgroundDrawable.border?.borderRadius = compositeBackgroundDrawable.borderRadius

    compositeBackgroundDrawable.background?.invalidateSelf()
    compositeBackgroundDrawable.backgroundImage?.invalidateSelf()
    compositeBackgroundDrawable.border?.invalidateSelf()

    if (Build.VERSION.SDK_INT >= MIN_OUTSET_BOX_SHADOW_SDK_VERSION) {
      for (shadow in
          compositeBackgroundDrawable.outerShadows.filterIsInstance<OutsetBoxShadowDrawable>()) {
        shadow.borderRadius = compositeBackgroundDrawable.borderRadius
      }
    }

    if (Build.VERSION.SDK_INT >= MIN_INSET_BOX_SHADOW_SDK_VERSION) {
      for (shadow in
          compositeBackgroundDrawable.innerShadows.filterIsInstance<InsetBoxShadowDrawable>()) {
        shadow.borderRadius = compositeBackgroundDrawable.borderRadius
      }
    }

    compositeBackgroundDrawable.outline?.borderRadius = compositeBackgroundDrawable.borderRadius
    compositeBackgroundDrawable.invalidateSelf()
  }

  /**
   * Gets the border radius for a specific corner of the view.
   *
   * @param view The view to get the border radius from
   * @param corner The corner property to get the radius for
   * @return The border radius value, or null if not set
   */
  @JvmStatic
  public fun getBorderRadius(view: View, corner: BorderRadiusProp): LengthPercentage? {

    return getCompositeBackgroundDrawable(view)?.borderRadius?.get(corner)
  }

  /**
   * Sets the border style for the view.
   *
   * @param view The view to apply the border style to
   * @param borderStyle The border style (solid, dashed, dotted), or null to remove
   */
  @JvmStatic
  public fun setBorderStyle(view: View, borderStyle: BorderStyle?) {
    ensureBorderDrawable(view).borderStyle = borderStyle
  }

  /**
   * Gets the border style of the view.
   *
   * @param view The view to get the border style from
   * @return The border style, or null if not set
   */
  @JvmStatic
  public fun getBorderStyle(view: View): BorderStyle? {
    return getBorder(view)?.borderStyle
  }

  /**
   * Sets the outline color for the view.
   *
   * @param view The view to apply the outline color to
   * @param outlineColor The outline color, or null to remove
   */
  @JvmStatic
  public fun setOutlineColor(view: View, @ColorInt outlineColor: Int?) {
    val outline = ensureOutlineDrawable(view)
    if (outlineColor != null) {
      outline.outlineColor = outlineColor
    }
  }

  /**
   * Gets the outline color of the view.
   *
   * @param view The view to get the outline color from
   * @return The outline color, or null if not set
   */
  @JvmStatic public fun getOutlineColor(view: View): Int? = getOutlineDrawable(view)?.outlineColor

  /**
   * Sets the outline offset for the view.
   *
   * @param view The view to apply the outline offset to
   * @param outlineOffset The outline offset in DIPs
   */
  @JvmStatic
  public fun setOutlineOffset(view: View, outlineOffset: Float) {
    val outline = ensureOutlineDrawable(view)
    outline.outlineOffset = outlineOffset.dpToPx()
  }

  /**
   * Gets the outline offset of the view.
   *
   * @param view The view to get the outline offset from
   * @return The outline offset in pixels, or null if not set
   */
  public fun getOutlineOffset(view: View): Float? = getOutlineDrawable(view)?.outlineOffset

  /**
   * Sets the outline style for the view.
   *
   * @param view The view to apply the outline style to
   * @param outlineStyle The outline style (solid, dashed, dotted), or null to remove
   */
  @JvmStatic
  public fun setOutlineStyle(view: View, outlineStyle: OutlineStyle?) {
    val outline = ensureOutlineDrawable(view)
    if (outlineStyle != null) {
      outline.outlineStyle = outlineStyle
    }
  }

  /**
   * Gets the outline style of the view.
   *
   * @param view The view to get the outline style from
   * @return The outline style, or null if not set
   */
  public fun getOutlineStyle(view: View): OutlineStyle? = getOutlineDrawable(view)?.outlineStyle

  /**
   * Sets the outline width for the view.
   *
   * @param view The view to apply the outline width to
   * @param width The outline width in DIPs
   */
  @JvmStatic
  public fun setOutlineWidth(view: View, width: Float) {
    val outline = ensureOutlineDrawable(view)
    outline.outlineWidth = width.dpToPx()
  }

  /**
   * Gets the outline width of the view.
   *
   * @param view The view to get the outline width from
   * @return The outline width in pixels, or null if not set
   */
  public fun getOutlineWidth(view: View): Float? = getOutlineDrawable(view)?.outlineWidth

  /**
   * Sets box shadows for the view.
   *
   * @param view The view to apply box shadows to
   * @param shadows The list of box shadow styles to apply
   */
  @JvmStatic
  public fun setBoxShadow(view: View, shadows: List<BoxShadow>) {
    val innerShadows = mutableListOf<InsetBoxShadowDrawable>()
    val outerShadows = mutableListOf<OutsetBoxShadowDrawable>()

    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    val borderInsets = compositeBackgroundDrawable.borderInsets
    val borderRadius = compositeBackgroundDrawable.borderRadius

    /**
     * z-ordering of user-provided shadow-list is opposite direction of LayerDrawable z-ordering
     * https://drafts.csswg.org/css-backgrounds/#shadow-layers
     */
    for (boxShadow in shadows) {
      val offsetX = boxShadow.offsetX
      val offsetY = boxShadow.offsetY
      val color = boxShadow.color ?: Color.BLACK
      val blurRadius = boxShadow.blurRadius ?: 0f
      val spreadDistance = boxShadow.spreadDistance ?: 0f
      val inset = boxShadow.inset ?: false

      if (inset && Build.VERSION.SDK_INT >= MIN_INSET_BOX_SHADOW_SDK_VERSION) {
        innerShadows.add(
            InsetBoxShadowDrawable(
                context = view.context,
                borderRadius = borderRadius,
                borderInsets = borderInsets,
                shadowColor = color,
                offsetX = offsetX,
                offsetY = offsetY,
                blurRadius = blurRadius,
                spread = spreadDistance,
            ),
        )
      } else if (!inset && Build.VERSION.SDK_INT >= MIN_OUTSET_BOX_SHADOW_SDK_VERSION) {
        outerShadows.add(
            OutsetBoxShadowDrawable(
                context = view.context,
                borderRadius = borderRadius,
                shadowColor = color,
                offsetX = offsetX,
                offsetY = offsetY,
                blurRadius = blurRadius,
                spread = spreadDistance,
            ),
        )
      }
    }

    view.background =
        ensureCompositeBackgroundDrawable(view)
            .withNewShadows(outerShadows = outerShadows, innerShadows = innerShadows)
  }

  /**
   * Sets box shadows for the view from a ReadableArray.
   *
   * @param view The view to apply box shadows to
   * @param shadows The array of box shadow definitions, or null to remove all shadows
   */
  @JvmStatic
  public fun setBoxShadow(view: View, shadows: ReadableArray?) {
    if (shadows == null) {
      BackgroundStyleApplicator.setBoxShadow(view, emptyList())
      return
    }

    val shadowStyles = mutableListOf<BoxShadow>()
    for (i in 0..<shadows.size()) {
      shadowStyles.add(checkNotNull(BoxShadow.parse(shadows.getMap(i), view.context)))
    }
    BackgroundStyleApplicator.setBoxShadow(view, shadowStyles)
  }

  /**
   * Sets a feedback underlay drawable for the view.
   *
   * @param view The view to apply the feedback underlay to
   * @param drawable The drawable to use as feedback underlay, or null to remove
   */
  @JvmStatic
  public fun setFeedbackUnderlay(view: View, drawable: Drawable?) {
    view.background = ensureCompositeBackgroundDrawable(view).withNewFeedbackUnderlay(drawable)
  }

  /**
   * Clips the canvas to the padding box of the view.
   *
   * The padding box is the area within the borders of the view, accounting for border radius if
   * present.
   *
   * @param view The view whose padding box defines the clipping region
   * @param canvas The canvas to clip
   */
  @JvmStatic
  public fun clipToPaddingBox(view: View, canvas: Canvas) {
    clipToPaddingBoxWithAntiAliasing(view, canvas, null)
  }

  /**
   * Clips [view]'s content to its padding box when [clip] is true, like [clipToPaddingBox], and
   * removes any clip applied by an earlier call when [clip] is false. Views call it on every draw,
   * before drawing what the clip applies to.
   *
   * See [updatePaddingBoxOutlineClip]; when the outline clip does not apply, the canvas is clipped
   * as [clipToPaddingBox] does.
   */
  @JvmStatic
  public fun updatePaddingBoxClip(view: View, canvas: Canvas, clip: Boolean) {
    if (!updatePaddingBoxOutlineClip(view, canvas, clip) && clip) {
      clipToPaddingBox(view, canvas)
    }
  }

  /**
   * Clips [view] to its padding box with its outline ([View.setClipToOutline]) when [clip] is true
   * and the outline can describe the padding box, and removes an outline clip set by an earlier
   * call otherwise. Returns whether the outline clip is in effect; when it is not, the caller clips
   * the canvas itself.
   *
   * Before Android 11, HWUI's Canvas.clipPath is not anti-aliased, so a rounded padding box clipped
   * with it has stepped corners. On Android 9 and 10 the outline clip is anti-aliased and draws no
   * offscreen layer, but describes only a round rect, so it is used when the padding box is one: a
   * single circular radius, no border, and nothing drawn outside the bounds (box shadows, outline,
   * a feedback ripple) for it to cut off. Any other padding box keeps the canvas clip: masking it
   * with a layer, as [clipToPaddingBoxWithAntiAliasing] does for images, costs a frame's budget on
   * these devices for a screen of bordered cards.
   */
  @JvmStatic
  public fun updatePaddingBoxOutlineClip(view: View, canvas: Canvas, clip: Boolean): Boolean {
    // The outline clip is a RenderNode property, so software drawing (e.g. view.draw into a
    // bitmap) ignores it. Leave it for the next hardware draw: clearing it here would not re-record
    // the display list it was recorded for.
    if (!canvas.isHardwareAccelerated) {
      return false
    }
    val ownsOutlineClip = view.getTag(R.id.padding_box_outline_clip) == true
    val useOutlineClip = clip && canClipPaddingBoxWithOutline(view, ownsOutlineClip)
    if (useOutlineClip && !ownsOutlineClip) {
      view.setTag(R.id.padding_box_outline_clip, true)
      view.clipToOutline = true
    } else if (!useOutlineClip) {
      clearPaddingBoxOutlineClip(view)
    }
    return useOutlineClip
  }

  /**
   * Android 9 and 10 clip with a non-anti-aliased Canvas.clipPath. Earlier versions are left alone:
   * their OpenGL renderer replaces, rather than intersects, an inherited round-rect outline clip,
   * so nested rounded clips would escape their parent.
   */
  private fun usesOutlineForRoundedClip(): Boolean =
      Build.VERSION.SDK_INT in Build.VERSION_CODES.P..Build.VERSION_CODES.Q

  private fun canClipPaddingBoxWithOutline(view: View, ownsOutlineClip: Boolean): Boolean {
    if (
        !usesOutlineForRoundedClip() ||
            !(ownsOutlineClip || !view.clipToOutline) ||
            view.outlineProvider !== ViewOutlineProvider.BACKGROUND ||
            view.getTag(R.id.filter) != null
    ) {
      return false
    }

    val composite = getCompositeBackgroundDrawable(view) ?: return false
    // The outline clip also clips the view's own background, so a feedback ripple drawn there
    // (bounded or borderless in place) would be cut where the canvas clip never cut it.
    return composite.outerShadows.isEmpty() &&
        composite.feedbackUnderlay == null &&
        (composite.outline?.outlineWidth ?: 0f) == 0f &&
        composite.getUniformBorderRadiusWithoutBorder() != null
  }

  private fun clearPaddingBoxOutlineClip(view: View) {
    if (view.getTag(R.id.padding_box_outline_clip) == true) {
      view.setTag(R.id.padding_box_outline_clip, null)
      view.clipToOutline = false
    }
  }

  /**
   * Populates [outRect] with the padding box rect of the view.
   *
   * The padding box is the area within the borders of the view. For views without a
   * [CompositeBackgroundDrawable] or without borders, this returns the full view bounds.
   *
   * This is useful for overriding [View.getClipBounds] to communicate the view's clipping region to
   * the Android framework (e.g. for [View.getGlobalVisibleRect] calculations).
   *
   * @param view The view whose padding box to compute
   * @param outRect The rect to populate with the padding box bounds
   */
  internal fun getPaddingBoxRect(view: View, outRect: Rect) {
    val composite = getCompositeBackgroundDrawable(view)
    val computedBorderInsets =
        composite?.borderInsets?.resolve(composite.layoutDirection, view.context)
    if (computedBorderInsets == null) {
      outRect.set(0, 0, view.width, view.height)
      return
    }

    val left = (computedBorderInsets.left.dpToPx()).toInt()
    val top = (computedBorderInsets.top.dpToPx()).toInt()
    val right = (view.width.toFloat() - computedBorderInsets.right.dpToPx()).toInt()
    val bottom = (view.height.toFloat() - computedBorderInsets.bottom.dpToPx()).toInt()

    outRect.set(left, top, right, bottom)
  }

  /**
   * Clips the canvas to the padding box of the view.
   *
   * The padding box is the area within the borders of the view, accounting for border radius if
   * present.
   *
   * On Android 28 and below, when border radius is present, this uses an antialiased clipping
   * approach with Porter-Duff compositing to avoid jagged edges. The drawContent lambda is invoked
   * to draw the actual content after setting up the layer but before applying the mask.
   *
   * @param view The view whose padding box defines the clipping region
   * @param canvas The canvas to clip
   * @param drawContent Lambda that draws the content after clipping is set up
   */
  @JvmStatic
  public fun clipToPaddingBoxWithAntiAliasing(
      view: View,
      canvas: Canvas,
      drawContent: (() -> Unit)?,
  ) {
    val drawingRect = Rect()
    view.getDrawingRect(drawingRect)

    val composite = getCompositeBackgroundDrawable(view)
    if (composite == null) {
      canvas.clipRect(drawingRect)
      drawContent?.invoke()
      return
    }

    val paddingBoxRect = RectF()

    val computedBorderInsets =
        composite.borderInsets?.resolve(composite.layoutDirection, view.context)

    paddingBoxRect.left = composite.bounds.left + (computedBorderInsets?.left?.dpToPx() ?: 0f)
    paddingBoxRect.top = composite.bounds.top + (computedBorderInsets?.top?.dpToPx() ?: 0f)
    paddingBoxRect.right = composite.bounds.right - (computedBorderInsets?.right?.dpToPx() ?: 0f)
    paddingBoxRect.bottom = composite.bounds.bottom - (computedBorderInsets?.bottom?.dpToPx() ?: 0f)

    if (composite.borderRadius?.hasRoundedBorders() == true) {
      val paddingBoxPath =
          createPaddingBoxPath(
              view,
              composite,
              paddingBoxRect,
              computedBorderInsets,
          )
      paddingBoxPath.offset(drawingRect.left.toFloat(), drawingRect.top.toFloat())

      // HWUI's clipPath is not anti-aliased before Android 11, so on Android 10 and below use
      // antialiased clipping with Porter-Duff compositing. Newer versions use the standard
      // clipPath.
      if (
          Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q &&
              view.width > 0 &&
              view.height > 0 &&
              drawContent != null
      ) {
        clipWithAntiAliasing(
            view,
            canvas,
            paddingBoxPath,
            drawContent,
        )
      } else {
        canvas.clipPath(paddingBoxPath)
        drawContent?.invoke()
      }
    } else {
      paddingBoxRect.offset(drawingRect.left.toFloat(), drawingRect.top.toFloat())
      canvas.clipRect(paddingBoxRect)
      drawContent?.invoke()
    }
  }

  /**
   * Applies antialiased clipping using Porter-Duff compositing for Android 28 and below. This draws
   * content to a layer, then applies an antialiased mask to clip it.
   */
  private fun clipWithAntiAliasing(
      view: View,
      canvas: Canvas,
      paddingBoxPath: Path,
      drawContent: () -> Unit,
  ) {
    // Save the layer for Porter-Duff compositing
    val saveCount = canvas.saveLayer(0f, 0f, view.width.toFloat(), view.height.toFloat(), null)

    // Clip to the view's own bounds inside the layer. On API <= 28 hardware-accelerated canvases,
    // the window boundary is tracked by the GPU scissor but not reflected in the canvas clip stack.
    // Without an explicit software clip, saveLayer may allocate a buffer with uninitialized pixels
    // beyond the GPU scissor. Adding clipRect inside the layer (rather than wrapping it with
    // canvas.withClip) avoids an extra save/restore nesting level that breaks Porter-Duff
    // compositing on API 24's HWUI renderer. The saveLayer already saves and restores the clip
    // state, so a separate save/restore wrapper is unnecessary.
    canvas.clipRect(0, 0, view.width, view.height)

    // Draw the content first
    drawContent()

    val maskPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    maskPaint.style = Paint.Style.FILL

    // Transparent pixels with INVERSE_WINDING only works on API 28
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      maskPaint.xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)
      maskPaint.color = Color.TRANSPARENT
      paddingBoxPath.setFillType(Path.FillType.INVERSE_WINDING)
      canvas.drawPath(paddingBoxPath, maskPaint)
    } else {
      // API < 28: Use a nested saveLayer with DST_IN compositing to mask content to the
      // padding box path. EVEN_ODD fill + DST_OUT has rendering bugs on API 24's hardware
      // renderer, so we avoid that technique. Instead, draw the mask shape into a separate
      // layer; when restored with DST_IN, content is preserved only where the mask is opaque.
      val dstInPaint = Paint()
      dstInPaint.xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)
      val maskSave =
          canvas.saveLayer(0f, 0f, view.width.toFloat(), view.height.toFloat(), dstInPaint)
      // Clear the layer to ensure it starts fully transparent. On API 24, saveLayer may not
      // initialize the buffer to transparent, causing DST_IN to see non-zero alpha everywhere.
      canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
      maskPaint.xfermode = null
      maskPaint.color = Color.BLACK
      canvas.drawPath(paddingBoxPath, maskPaint)
      canvas.restoreToCount(maskSave)
    }

    // Restore the layer
    canvas.restoreToCount(saveCount)
  }

  /**
   * Resets the background styling of the view to its original state.
   *
   * This removes any CompositeBackgroundDrawable and restores the original background.
   *
   * @param view The view to reset
   */
  @JvmStatic
  public fun reset(view: View) {
    clearPaddingBoxOutlineClip(view)
    if (view.background is CompositeBackgroundDrawable) {
      view.background = (view.background as CompositeBackgroundDrawable).originalBackground
    }
  }

  private fun ensureCompositeBackgroundDrawable(view: View): CompositeBackgroundDrawable {
    if (view.background is CompositeBackgroundDrawable) {
      return view.background as CompositeBackgroundDrawable
    }

    val compositeDrawable =
        CompositeBackgroundDrawable(context = view.context, originalBackground = view.background)
    view.background = compositeDrawable
    return compositeDrawable
  }

  private fun getCompositeBackgroundDrawable(view: View): CompositeBackgroundDrawable? =
      view.background as? CompositeBackgroundDrawable

  private fun ensureBackgroundDrawable(view: View): BackgroundDrawable {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    var background = compositeBackgroundDrawable.background

    return if (background != null) {
      background
    } else {
      background =
          BackgroundDrawable(
              view.context,
              compositeBackgroundDrawable.borderRadius,
              compositeBackgroundDrawable.borderInsets,
          )
      view.background = compositeBackgroundDrawable.withNewBackground(background)
      background
    }
  }

  private fun getBackground(view: View): BackgroundDrawable? =
      getCompositeBackgroundDrawable(view)?.background

  private fun ensureBackgroundImageDrawable(view: View): BackgroundImageDrawable {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    var backgroundImage = compositeBackgroundDrawable.backgroundImage

    return if (backgroundImage != null) {
      backgroundImage
    } else {
      backgroundImage =
          BackgroundImageDrawable(
              view.context,
              compositeBackgroundDrawable.borderRadius,
              compositeBackgroundDrawable.borderInsets,
          )
      view.background = compositeBackgroundDrawable.withNewBackgroundImage(backgroundImage)
      backgroundImage
    }
  }

  private fun getBackgroundImage(view: View): BackgroundImageDrawable? =
      getCompositeBackgroundDrawable(view)?.backgroundImage

  private fun getBorder(view: View): BorderDrawable? = getCompositeBackgroundDrawable(view)?.border

  private fun ensureBorderDrawable(view: View): BorderDrawable {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    var border = compositeBackgroundDrawable.border
    if (border == null) {
      border =
          BorderDrawable(
              context = view.context,
              borderRadius = compositeBackgroundDrawable.borderRadius,
              borderWidth = Spacing(0f),
              borderStyle = BorderStyle.SOLID,
              borderInsets = compositeBackgroundDrawable.borderInsets,
          )
      view.background = compositeBackgroundDrawable.withNewBorder(border)
    }

    return border
  }

  private fun ensureOutlineDrawable(view: View): OutlineDrawable {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    var outline = compositeBackgroundDrawable.outline
    if (outline == null) {
      val borderRadius = compositeBackgroundDrawable.borderRadius

      outline =
          OutlineDrawable(
              context = view.context,
              borderRadius = borderRadius,
              outlineColor = Color.BLACK,
              outlineOffset = 0f,
              outlineStyle = OutlineStyle.SOLID,
              outlineWidth = 0f,
          )

      view.background = compositeBackgroundDrawable.withNewOutline(outline)
    }

    return outline
  }

  private fun getOutlineDrawable(view: View): OutlineDrawable? =
      getCompositeBackgroundDrawable(view)?.outline

  /**
   * Here, "inner" refers to the border radius on the inside of the border. So it ends up being the
   * "outer" border radius inset by the respective width.
   */
  private fun getInnerBorderRadius(computedRadius: Float?, borderWidth: Float?): Float {
    return ((computedRadius ?: 0f) - (borderWidth ?: 0f)).coerceAtLeast(0f)
  }

  private fun createPaddingBoxPath(
      view: View,
      composite: CompositeBackgroundDrawable,
      paddingBoxRect: RectF,
      computedBorderInsets: RectF?,
  ): Path {
    val computedBorderRadius =
        composite.borderRadius?.resolve(
            composite.layoutDirection,
            view.context,
            PixelUtil.toDIPFromPixel(composite.bounds.width().toFloat()),
            PixelUtil.toDIPFromPixel(composite.bounds.height().toFloat()),
        )

    val paddingBoxPath = Path()

    val innerTopLeftRadiusX =
        getInnerBorderRadius(
            computedBorderRadius?.topLeft?.horizontal?.dpToPx(),
            computedBorderInsets?.left?.dpToPx(),
        )
    val innerTopLeftRadiusY =
        getInnerBorderRadius(
            computedBorderRadius?.topLeft?.vertical?.dpToPx(),
            computedBorderInsets?.top?.dpToPx(),
        )
    val innerTopRightRadiusX =
        getInnerBorderRadius(
            computedBorderRadius?.topRight?.horizontal?.dpToPx(),
            computedBorderInsets?.right?.dpToPx(),
        )
    val innerTopRightRadiusY =
        getInnerBorderRadius(
            computedBorderRadius?.topRight?.vertical?.dpToPx(),
            computedBorderInsets?.top?.dpToPx(),
        )
    val innerBottomRightRadiusX =
        getInnerBorderRadius(
            computedBorderRadius?.bottomRight?.horizontal?.dpToPx(),
            computedBorderInsets?.right?.dpToPx(),
        )
    val innerBottomRightRadiusY =
        getInnerBorderRadius(
            computedBorderRadius?.bottomRight?.vertical?.dpToPx(),
            computedBorderInsets?.bottom?.dpToPx(),
        )
    val innerBottomLeftRadiusX =
        getInnerBorderRadius(
            computedBorderRadius?.bottomLeft?.horizontal?.dpToPx(),
            computedBorderInsets?.left?.dpToPx(),
        )
    val innerBottomLeftRadiusY =
        getInnerBorderRadius(
            computedBorderRadius?.bottomLeft?.vertical?.dpToPx(),
            computedBorderInsets?.bottom?.dpToPx(),
        )

    paddingBoxPath.addRoundRect(
        paddingBoxRect,
        floatArrayOf(
            innerTopLeftRadiusX,
            innerTopLeftRadiusY,
            innerTopRightRadiusX,
            innerTopRightRadiusY,
            innerBottomRightRadiusX,
            innerBottomRightRadiusY,
            innerBottomLeftRadiusX,
            innerBottomLeftRadiusY,
        ),
        Path.Direction.CW,
    )
    return paddingBoxPath
  }
}
