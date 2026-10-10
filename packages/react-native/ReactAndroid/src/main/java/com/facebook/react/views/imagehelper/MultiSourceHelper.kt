/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.imagehelper

import com.facebook.imagepipeline.core.ImagePipelineFactory
import com.facebook.react.modules.fresco.ImageCacheControl
import kotlin.math.abs

/** Helper class for dealing with multisource images. */
internal object MultiSourceHelper {
  @JvmStatic
  fun getBestSourceForSize(width: Int, height: Int, sources: List<ImageSource>): MultiSourceResult =
      getBestSourceForSize(width, height, sources, 1.0)

  /**
   * Chooses the image source with the size closest to the target image size.
   *
   * @param width the width of the view that will be used to display this image
   * @param height the height of the view that will be used to display this image
   * @param sources the list of potential image sources to choose from
   * @param multiplier the area of the view will be multiplied by this number before calculating the
   *   best source; this is useful if the image will be displayed bigger than the view (e.g. zoomed)
   */
  @JvmStatic
  fun getBestSourceForSize(
      width: Int,
      height: Int,
      sources: List<ImageSource>,
      multiplier: Double,
  ): MultiSourceResult =
      getBestSourceForSize(width, height, sources, multiplier, checkDiskCache = true)

  @JvmStatic
  fun getBestSourceForSize(
      width: Int,
      height: Int,
      sources: List<ImageSource>,
      multiplier: Double,
      checkDiskCache: Boolean,
  ): MultiSourceResult {
    if (sources.isEmpty()) {
      return MultiSourceResult(null, null)
    }
    if (sources.size == 1) {
      return MultiSourceResult(sources[0], null)
    }
    if (width <= 0 || height <= 0) {
      return MultiSourceResult(null, null)
    }

    val imagePipeline = ImagePipelineFactory.getInstance().imagePipeline
    val best = findBestSourceForSize(width, height, sources, multiplier)
    val bestCached =
        findBestCachedSourceForSize(width, height, sources, multiplier) { source ->
          imagePipeline.isInBitmapMemoryCache(source.uri) ||
              (checkDiskCache && imagePipeline.isInDiskCacheSync(source.uri))
        }
    // The best source is already the primary request, so do not submit it again as a cache preview.
    val bestResultInCache = bestCached.takeUnless { it?.source == best?.source }
    if (checkDiskCache) {
      return MultiSourceResult(best, bestResultInCache)
    }

    return MultiSourceResult(
        best,
        bestResultInCache,
        diskCacheProbeCandidates =
            findDiskCacheProbeSources(width, height, sources, multiplier, best, bestCached),
    )
  }

  internal fun findDiskCacheProbeSources(
      width: Int,
      height: Int,
      sources: List<ImageSource>,
      multiplier: Double,
      best: ImageSource?,
      bestCached: ImageSource?,
  ): List<ImageSource> {
    val viewArea = width * height * multiplier
    val bestCachedPrecision = bestCached?.let { source -> abs(1.0 - source.size / viewArea) }
    val diskCacheProbeSources = ArrayList<ImageSource>(sources.size)
    for (source in sources) {
      val precision = abs(1.0 - source.size / viewArea)
      if (
          source.cacheControl != ImageCacheControl.RELOAD &&
              source.source != best?.source &&
              (source.source == bestCached?.source ||
                  bestCachedPrecision == null ||
                  precision < bestCachedPrecision)
      ) {
        diskCacheProbeSources.add(source)
      }
    }
    diskCacheProbeSources.sortBy { source -> abs(1.0 - source.size / viewArea) }
    return diskCacheProbeSources
  }

  private fun findBestSourceForSize(
      width: Int,
      height: Int,
      sources: List<ImageSource>,
      multiplier: Double,
  ): ImageSource? {
    val viewArea = width * height * multiplier
    return sources.minByOrNull { source -> abs(1.0 - source.size / viewArea) }
  }

  private fun findBestCachedSourceForSize(
      width: Int,
      height: Int,
      sources: List<ImageSource>,
      multiplier: Double,
      isCached: (ImageSource) -> Boolean,
  ): ImageSource? {
    val viewArea = width * height * multiplier
    var bestCached: ImageSource? = null
    var bestCachePrecision = Double.MAX_VALUE
    for (source in sources) {
      val precision = abs(1.0 - source.size / viewArea)
      if (
          precision < bestCachePrecision &&
              source.cacheControl != ImageCacheControl.RELOAD &&
              isCached(source)
      ) {
        bestCachePrecision = precision
        bestCached = source
      }
    }
    return bestCached
  }

  class MultiSourceResult(
      /**
       * Get the best result overall (closest in size to the view's size). Can be null if there were
       * no sources to choose from, or if there were more than 1 sources but width/height were 0.
       */
      @JvmField val bestResult: ImageSource?,
      /**
       * Get the best result (closest in size to the view's size) that is also in cache. If this
       * would be the same as the source from [getBestResult], this will return `null` instead.
       */
      @JvmField val bestResultInCache: ImageSource?,
      /**
       * Sources to probe using disk-cache-only requests, ordered from closest to least precise for
       * the view size. A source in this list is not known to be cached until its probe succeeds.
       */
      @JvmField val diskCacheProbeCandidates: List<ImageSource> = emptyList(),
  )
}
