/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.FloatUtil
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.style.BackgroundImageLayer
import com.facebook.react.uimanager.style.BackgroundPosition
import com.facebook.react.uimanager.style.BackgroundRepeat
import com.facebook.react.uimanager.style.BackgroundRepeatKeyword
import com.facebook.react.uimanager.style.BackgroundSize
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusStyle
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.round

internal class BackgroundImageDrawable(
    private val context: Context,
    /*
     * We assume borderRadius & borderInsets to be shared across multiple drawables
     * therefore we should manually invalidate this drawable when changing either of them
     */
    var borderRadius: BorderRadiusStyle? = null,
    var borderInsets: BorderInsets? = null,
) : Drawable() {
  private var needUpdatePath = true
  private var backgroundImageClipPath: Path? = null
  private var backgroundPositioningArea: RectF? = null
  private var backgroundPaintingArea: RectF? = null
  private val backgroundImageURLLoader = BackgroundImageURLLoader(context) { invalidateSelf() }

  var backgroundImageLayers: List<BackgroundImageLayer>? = null
    set(value) {
      if (field != value) {
        field = value
        backgroundImageURLLoader.loadBackgroundImages(value.orEmpty())
        invalidateSelf()
      }
    }

  var backgroundSize: List<BackgroundSize>? = null
    set(value) {
      if (field != value) {
        field = value
        invalidateSelf()
      }
    }

  var backgroundPosition: List<BackgroundPosition>? = null
    set(value) {
      if (field != value) {
        field = value
        invalidateSelf()
      }
    }

  var backgroundRepeat: List<BackgroundRepeat>? = null
    set(value) {
      if (field != value) {
        field = value
        invalidateSelf()
      }
    }

  private val backgroundPaint: Paint =
      Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG).apply { style = Paint.Style.FILL }

  /** Called when the view is dropped. */
  fun cancelBackgroundImageURLRequests() {
    backgroundImageURLLoader.cancelRequests()
  }

  override fun invalidateSelf() {
    needUpdatePath = true
    super.invalidateSelf()
  }

  override fun onBoundsChange(bounds: Rect) {
    super.onBoundsChange(bounds)
    needUpdatePath = true
  }

  override fun setAlpha(alpha: Int) {
    backgroundPaint.alpha = alpha
    invalidateSelf()
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    // do nothing
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int {
    val alpha = backgroundPaint.alpha
    return when (alpha) {
      255 -> PixelFormat.OPAQUE
      in 1..254 -> PixelFormat.TRANSLUCENT
      else -> PixelFormat.TRANSPARENT
    }
  }

  override fun draw(canvas: Canvas) {
    if (backgroundImageLayers.isNullOrEmpty()) {
      return
    }

    updatePath()

    val backgroundPaintingArea = backgroundPaintingArea ?: return
    val backgroundPositioningArea = backgroundPositioningArea ?: return

    if (hasInvalidDimensions(backgroundPositioningArea, backgroundPaintingArea)) {
      return
    }

    canvas.save()

    // 1. Clip the canvas to match the rounded border path and truncate repeating tiles
    backgroundImageClipPath?.let { canvas.clipPath(it) }

    backgroundImageLayers?.let { layers ->
      // iterate in reverse to match CSS spec i.e first background image appears closer to user.
      // So we draw in reverse (last drawn in canvas appears closest)
      for (index in layers.indices.reversed()) {
        val backgroundImageLayer = layers[index]
        val size = backgroundSize?.takeIf { it.isNotEmpty() }?.let { it.getOrNull(index % it.size) }
        val repeat =
            backgroundRepeat?.takeIf { it.isNotEmpty() }?.let { it.getOrNull(index % it.size) }
        val position =
            backgroundPosition?.takeIf { it.isNotEmpty() }?.let { it.getOrNull(index % it.size) }

        val uri = backgroundImageLayer.uri
        val urlImage: BackgroundImageURLLoader.OrientedBitmap?
        val (intrinsicWidth, intrinsicHeight) =
            if (uri == null) {
              urlImage = null
              backgroundPositioningArea.width() to backgroundPositioningArea.height()
            } else {
              val image = backgroundImageURLLoader.imageForUri(uri)
              if (image == null) {
                continue
              }
              urlImage = image
              // Asset (local require() assets) pass intrinsicWidth/Height in DIPs
              // So use those dimensions and convert from dp to physical pixels.
              val assetWidth = backgroundImageLayer.intrinsicWidth
              val assetHeight = backgroundImageLayer.intrinsicHeight
              if (assetWidth != null && assetHeight != null) {
                assetWidth.dpToPx() to assetHeight.dpToPx()
              } else {
                // Plain url() images don't pass intrinsic width/height
                // so take the decoded pixels as DIPs and convert
                image.width.dpToPx() to image.height.dpToPx()
              }
            }

        // 2. Calculate the size of a single tile.
        val (tileWidth, tileHeight) =
            calculateBackgroundImageSize(
                backgroundPositioningArea.width(),
                backgroundPositioningArea.height(),
                intrinsicWidth,
                intrinsicHeight,
                uri != null,
                size,
                repeat,
            )

        if (tileWidth <= 0 || tileHeight <= 0) {
          continue
        }

        // 3. Set paint shader for gradients (URL images don't use shaders)
        if (uri == null) {
          backgroundPaint.setShader(backgroundImageLayer.getShader(tileWidth, tileHeight))
        } else {
          backgroundPaint.setShader(null)
        }

        // 4. Calculate spacing, x and y tiles count and position for tiles
        var (initialX, initialY) = calculateBackgroundPosition(tileWidth, tileHeight, position)

        val repeatX = repeat?.x ?: BackgroundRepeatKeyword.Repeat
        var xTilesCount = 1
        var xSpacing = 0f

        if (repeatX == BackgroundRepeatKeyword.Space) {
          // The image is repeated as much as possible
          // without clipping. The first and last images are pinned to either side of
          // the element, and whitespace is distributed evenly between the images.
          // The background-position property is ignored unless only one image can be displayed
          // without
          // clipping.
          val widthOfEdgePinnedImages = tileWidth * 2
          val availableWidthForCenterImages =
              backgroundPaintingArea.width() - widthOfEdgePinnedImages
          val roundedTileWidth = round(tileWidth)
          if (
              roundedTileWidth > 0 &&
                  (availableWidthForCenterImages > 0 ||
                      FloatUtil.floatsEqual(availableWidthForCenterImages, 0f))
          ) {
            // round the values when flooring to avoid floating point precision issues
            val centerImagesCount =
                floor(round(availableWidthForCenterImages) / roundedTileWidth).toInt()
            val centerImagesWidth = centerImagesCount * tileWidth
            val totalFreeSpace = availableWidthForCenterImages - centerImagesWidth
            val totalInstances = centerImagesCount + 2
            xSpacing = totalFreeSpace / (totalInstances - 1)
            xTilesCount = totalInstances
            initialX = backgroundPaintingArea.left
          } else {
            xTilesCount = 1
          }
        } else if (
            repeatX == BackgroundRepeatKeyword.Round || repeatX == BackgroundRepeatKeyword.Repeat
        ) {
          val roundedTileWidth = round(tileWidth)
          if (roundedTileWidth > 0) {
            val tilesBeforeX = ceil(round(initialX) / roundedTileWidth).toInt()
            val tilesAfterX =
                ceil(round((backgroundPaintingArea.width() - initialX)) / roundedTileWidth).toInt()
            xTilesCount = tilesBeforeX + tilesAfterX
            initialX -= (tilesBeforeX * tileWidth)
          }
          xSpacing = 0f
        }

        val repeatY = repeat?.y ?: BackgroundRepeatKeyword.Repeat
        var yTilesCount = 1
        var ySpacing = 0f

        if (repeatY == BackgroundRepeatKeyword.Space) {
          val heightOfEdgePinnedImages = tileHeight * 2
          val availableHeightForCenterImages =
              backgroundPaintingArea.height() - heightOfEdgePinnedImages
          val roundedTileHeight = round(tileHeight)
          if (
              roundedTileHeight > 0 &&
                  (availableHeightForCenterImages > 0 ||
                      FloatUtil.floatsEqual(availableHeightForCenterImages, 0f))
          ) {
            val centerImagesCount =
                floor(round(availableHeightForCenterImages) / roundedTileHeight).toInt()
            val centerImagesHeight = centerImagesCount * tileHeight
            val totalFreeSpace = availableHeightForCenterImages - centerImagesHeight
            val totalInstances = centerImagesCount + 2
            ySpacing = totalFreeSpace / (totalInstances - 1)
            yTilesCount = totalInstances
            initialY = backgroundPaintingArea.top
          } else {
            yTilesCount = 1
          }
        } else if (
            repeatY == BackgroundRepeatKeyword.Round || repeatY == BackgroundRepeatKeyword.Repeat
        ) {
          val roundedTileHeight = round(tileHeight)
          if (roundedTileHeight > 0) {
            val tilesBeforeY = ceil(round(initialY) / roundedTileHeight).toInt()
            val tilesAfterY =
                ceil(round((backgroundPaintingArea.height() - initialY)) / roundedTileHeight)
                    .toInt()
            yTilesCount = tilesBeforeY + tilesAfterY
            initialY -= (tilesBeforeY * tileHeight)
          }
          ySpacing = 0f
        }

        // 5. draw the repeating tiles using translate
        val urlImageMatrix = urlImage?.drawMatrix(tileWidth, tileHeight)
        var translateX = initialX
        var translateY: Float
        val saveCount = canvas.saveCount
        try {
          repeat(xTilesCount) {
            translateY = initialY
            repeat(yTilesCount) {
              canvas.save()
              canvas.translate(translateX, translateY)
              if (urlImage != null && urlImageMatrix != null) {
                canvas.drawBitmap(urlImage.bitmap, urlImageMatrix, backgroundPaint)
              } else {
                canvas.drawRect(0f, 0f, tileWidth, tileHeight, backgroundPaint)
              }
              canvas.restore()
              translateY += tileHeight + ySpacing
            }
            translateX += tileWidth + xSpacing
          }
        } catch (e: RuntimeException) {
          // Like `ReactImageView`: the canvas throws for a bitmap that is too large to draw.
          canvas.restoreToCount(saveCount)
          FLog.w(ReactConstants.TAG, e, "Could not draw background image: %s", uri)
        }
      }
    }
    canvas.restore()
  }

  private fun computeBorderInsets(): RectF =
      borderInsets?.resolve(layoutDirection, context).let {
        RectF(
            it?.left?.dpToPx() ?: 0f,
            it?.top?.dpToPx() ?: 0f,
            it?.right?.dpToPx() ?: 0f,
            it?.bottom?.dpToPx() ?: 0f,
        )
      }

  private fun hasInvalidDimensions(positioningArea: RectF, paintingArea: RectF): Boolean =
      FloatUtil.floatsEqual(positioningArea.width(), 0f) ||
          positioningArea.width() < 0f ||
          FloatUtil.floatsEqual(positioningArea.height(), 0f) ||
          positioningArea.height() < 0f ||
          FloatUtil.floatsEqual(paintingArea.width(), 0f) ||
          paintingArea.width() < 0f ||
          FloatUtil.floatsEqual(paintingArea.height(), 0f) ||
          paintingArea.height() < 0f

  private fun updatePath() {
    if (!needUpdatePath) {
      return
    }
    needUpdatePath = false

    val computedBorderInsets = computeBorderInsets()

    // background-origin: padding-box
    backgroundPositioningArea =
        RectF(
            bounds.left + computedBorderInsets.left,
            bounds.top + computedBorderInsets.top,
            bounds.right - computedBorderInsets.right,
            bounds.bottom - computedBorderInsets.bottom,
        )

    // background-clip: border-box
    backgroundPaintingArea = RectF(bounds)

    val computedBorderRadius =
        borderRadius?.resolve(
            layoutDirection,
            context,
            bounds.width().pxToDp(),
            bounds.height().pxToDp(),
        )

    if (borderRadius?.hasRoundedBorders() == true) {
      val paintingArea = backgroundPaintingArea ?: return
      backgroundImageClipPath = Path()
      backgroundImageClipPath?.addRoundRect(
          paintingArea,
          floatArrayOf(
              computedBorderRadius?.topLeft?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.topLeft?.vertical?.dpToPx() ?: 0f,
              computedBorderRadius?.topRight?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.topRight?.vertical?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomRight?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomRight?.vertical?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomLeft?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomLeft?.vertical?.dpToPx() ?: 0f,
          ),
          Path.Direction.CW,
      )
    } else {
      val paintingArea = backgroundPaintingArea ?: return
      backgroundImageClipPath = Path()
      backgroundImageClipPath?.addRect(paintingArea, Path.Direction.CW)
    }
  }

  private fun positionToPixels(lengthPercentage: LengthPercentage, availableSpace: Float): Float =
      if (lengthPercentage.type == LengthPercentageType.PERCENT) {
        lengthPercentage.resolve(availableSpace)
      } else {
        lengthPercentage.resolve(availableSpace).dpToPx()
      }

  private fun calculateBackgroundImageSize(
      containerWidth: Float,
      containerHeight: Float,
      imageWidth: Float,
      imageHeight: Float,
      hasIntrinsicRatio: Boolean,
      backgroundSize: BackgroundSize?,
      repeat: BackgroundRepeat?,
  ): Pair<Float, Float> {
    var finalWidth = imageWidth
    var finalHeight = imageHeight
    // An `auto` dimension keeps the image's aspect ratio. Without a ratio (gradients), it stays at
    // its intrinsic size.
    val keepsRatio = hasIntrinsicRatio && imageWidth > 0 && imageHeight > 0
    val ratio = if (keepsRatio) imageWidth / imageHeight else 0f
    var xAuto = true
    var yAuto = true

    if (backgroundSize is BackgroundSize.LengthPercentageAuto) {
      val w = backgroundSize.lengthPercentage.x
      val h = backgroundSize.lengthPercentage.y
      xAuto = backgroundSize.lengthPercentage.isXAuto()
      yAuto = backgroundSize.lengthPercentage.isYAuto()
      if (keepsRatio) {
        if (w != null) {
          finalWidth = positionToPixels(w, containerWidth)
        }
        if (h != null) {
          finalHeight = positionToPixels(h, containerHeight)
        }
        if (!xAuto && yAuto) {
          finalHeight = finalWidth / ratio
        } else if (xAuto && !yAuto) {
          finalWidth = finalHeight * ratio
        }
      } else if (w != null && h != null) {
        finalWidth = positionToPixels(w, containerWidth)
        finalHeight = positionToPixels(h, containerHeight)
      }
    }

    if (repeat?.x == BackgroundRepeatKeyword.Round && finalWidth > 0) {
      if (!FloatUtil.floatsEqual(containerWidth.rem(finalWidth), 0f)) {
        // CSS rounds to the nearest whole number of tiles, but at least one.
        val numRepeats = maxOf(1f, round(containerWidth / finalWidth))
        finalWidth = containerWidth / numRepeats
      }
    }

    if (repeat?.y == BackgroundRepeatKeyword.Round && finalHeight > 0) {
      if (!FloatUtil.floatsEqual(containerHeight.rem(finalHeight), 0f)) {
        // CSS rounds to the nearest whole number of tiles, but at least one.
        val numRepeats = maxOf(1f, round(containerHeight / finalHeight))
        finalHeight = containerHeight / numRepeats
      }
    }

    // With `round` on one axis only, an `auto` other axis is scaled again to restore the ratio.
    val roundX = repeat?.x == BackgroundRepeatKeyword.Round
    val roundY = repeat?.y == BackgroundRepeatKeyword.Round
    if (keepsRatio && roundX && !roundY && yAuto) {
      finalHeight = finalWidth / ratio
    } else if (keepsRatio && roundY && !roundX && xAuto) {
      finalWidth = finalHeight * ratio
    }

    return finalWidth to finalHeight
  }

  private fun calculateBackgroundPosition(
      tileWidth: Float,
      tileHeight: Float,
      position: BackgroundPosition?,
  ): Pair<Float, Float> {
    val backgroundPositioningArea = backgroundPositioningArea ?: return 0f to 0f

    val availableSpaceX = backgroundPositioningArea.width() - tileWidth
    val availableSpaceY = backgroundPositioningArea.height() - tileHeight

    val translateX =
        when {
          position?.left != null -> positionToPixels(position.left, availableSpaceX)
          position?.right != null ->
              availableSpaceX - positionToPixels(position.right, availableSpaceX)
          else -> 0.0f
        } + backgroundPositioningArea.left

    val translateY =
        when {
          position?.top != null -> positionToPixels(position.top, availableSpaceY)
          position?.bottom != null ->
              availableSpaceY - positionToPixels(position.bottom, availableSpaceY)
          else -> 0.0f
        } + backgroundPositioningArea.top

    return translateX to translateY
  }
}
