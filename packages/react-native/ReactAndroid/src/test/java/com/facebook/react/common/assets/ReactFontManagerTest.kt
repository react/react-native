/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.assets

import android.graphics.Typeface
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactFontManagerTest {

  @Test
  fun getTypeface_returnsRegisteredCustomFont() {
    val fontManager = ReactFontManager()

    fontManager.addCustomFont("CustomFont", Typeface.SERIF)

    assertThat(fontManager.customFontFamilies).containsExactly("CustomFont")
    assertThat(fontManager.getTypeface("CustomFont", Typeface.NORMAL, null)).isNotNull()
  }

  @Test
  fun addCustomFont_ignoresNullTypeface() {
    val fontManager = ReactFontManager()

    fontManager.addCustomFont("CustomFont", null)

    assertThat(fontManager.customFontFamilies).isEmpty()
  }

  @Test
  fun concurrentRegistrationAndLookup_keepsEveryFont() {
    val fontManager = ReactFontManager()
    val threadCount = 8
    val fontsPerThread = 200
    val executor = Executors.newFixedThreadPool(threadCount)
    val start = CountDownLatch(1)
    val errors = mutableListOf<Throwable>()

    val futures =
        (0 until threadCount).map { thread ->
          executor.submit {
            start.await()
            try {
              for (i in 0 until fontsPerThread) {
                fontManager.addCustomFont("Custom $thread $i", Typeface.SERIF)
                fontManager.getTypeface("Custom $thread $i", Typeface.BOLD, null)
                fontManager.getTypeface("Asset $thread $i", Typeface.NORMAL, null)
                fontManager.customFontFamilies
              }
            } catch (e: Throwable) {
              synchronized(errors) { errors.add(e) }
            }
          }
        }
    start.countDown()
    futures.forEach { it.get(30, TimeUnit.SECONDS) }
    executor.shutdown()

    assertThat(errors).isEmpty()
    assertThat(fontManager.customFontFamilies).hasSize(threadCount * fontsPerThread)
  }
}
