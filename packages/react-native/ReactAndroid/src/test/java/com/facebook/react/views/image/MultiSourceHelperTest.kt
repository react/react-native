/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import com.facebook.react.modules.fresco.ImageCacheControl
import com.facebook.react.views.imagehelper.ImageSource
import com.facebook.react.views.imagehelper.MultiSourceHelper
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class MultiSourceHelperTest {

  @Test
  fun diskFallbackCandidatesAreOrderedByPrecision() {
    val best = imageSource("best", 100.0)
    val closest = imageSource("closest", 90.0)
    val smaller = imageSource("smaller", 50.0)

    val result =
        MultiSourceHelper.findDiskCacheFallbackSources(
            width = 100,
            height = 100,
            sources = listOf(smaller, closest, best),
            multiplier = 1.0,
            best = best,
            bestCached = null,
        )

    assertThat(result).containsExactly(closest, smaller)
  }

  @Test
  fun diskFallbackCandidatesSkipReloadSources() {
    val best = imageSource("best", 100.0)
    val reload = imageSource("reload", 90.0, ImageCacheControl.RELOAD)
    val smaller = imageSource("smaller", 50.0)

    val result =
        MultiSourceHelper.findDiskCacheFallbackSources(
            width = 100,
            height = 100,
            sources = listOf(smaller, reload, best),
            multiplier = 1.0,
            best = best,
            bestCached = null,
        )

    assertThat(result).containsExactly(smaller)
  }

  @Test
  fun diskFallbackCandidatesTryMemoryCandidateAfterMorePreciseSources() {
    val best = imageSource("best", 100.0)
    val diskCandidate = imageSource("disk", 90.0)
    val memoryCandidate = imageSource("memory", 20.0)

    val result =
        MultiSourceHelper.findDiskCacheFallbackSources(
            width = 100,
            height = 100,
            sources = listOf(memoryCandidate, diskCandidate, best),
            multiplier = 1.0,
            best = best,
            bestCached = memoryCandidate,
        )

    assertThat(result).containsExactly(diskCandidate, memoryCandidate)
  }

  @Test
  fun diskFallbackCandidatesAreEmptyWithoutAlternateSource() {
    val best = imageSource("best", 100.0)

    val result =
        MultiSourceHelper.findDiskCacheFallbackSources(
            width = 100,
            height = 100,
            sources = listOf(best),
            multiplier = 1.0,
            best = best,
            bestCached = null,
        )

    assertThat(result).isEmpty()
  }

  private fun imageSource(
      name: String,
      side: Double,
      cacheControl: ImageCacheControl = ImageCacheControl.DEFAULT,
  ): ImageSource =
      ImageSource(
          RuntimeEnvironment.getApplication(),
          "https://example.com/$name.png",
          side,
          side,
          cacheControl,
      )
}
