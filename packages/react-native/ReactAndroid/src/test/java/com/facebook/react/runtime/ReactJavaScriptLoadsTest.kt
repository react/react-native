/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:OptIn(UnstableReactNativeAPI::class)

package com.facebook.react.runtime

import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JSBundleLoaderDelegate
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactJavaScriptLoadsTest {
  private val loads = mutableListOf<List<String?>>()
  private val listener =
      ReactJavaScriptLoads.Listener { sourceURL, path, revisionId ->
        loads.add(listOf(sourceURL, path, revisionId))
      }

  @After
  fun tearDown() {
    ReactJavaScriptLoads.removeListener(listener)
  }

  @Test
  fun announcesEachLoadToListenersAndRemembersThatJavaScriptStarted() {
    ReactJavaScriptLoads.addListener(listener)
    ReactJavaScriptLoads.addListener(listener)

    ReactJavaScriptLoads.willExecute("http://localhost:8081/index.bundle", "/data/b.js", "rev1")
    ReactJavaScriptLoads.removeListener(listener)
    ReactJavaScriptLoads.willExecute("assets://index.android.bundle", null, null)

    assertThat(loads)
        .containsExactly(listOf("http://localhost:8081/index.bundle", "/data/b.js", "rev1"))
    assertThat(ReactJavaScriptLoads.hasStartedExecuting()).isTrue()
  }

  @Test
  fun aThrowingListenerDoesNotStopTheOthers() {
    val throwing = ReactJavaScriptLoads.Listener { _, _, _ -> throw IllegalStateException("boom") }
    ReactJavaScriptLoads.addListener(throwing)
    ReactJavaScriptLoads.addListener(listener)

    ReactJavaScriptLoads.willExecute("assets://index.android.bundle", null, null)
    ReactJavaScriptLoads.removeListener(throwing)

    assertThat(loads).containsExactly(listOf("assets://index.android.bundle", null, null))
  }

  @Test
  fun cachedNetworkLoaderCarriesTheDevServerRevision() {
    val loader =
        JSBundleLoader.createCachedBundleFromNetworkLoader(
            "http://localhost:8081/index.bundle",
            "/data/b.js",
            "rev1",
        )

    assertThat(loader.revisionId).isEqualTo("rev1")
    assertThat(loader.loadScript(mock<JSBundleLoaderDelegate>()))
        .isEqualTo("http://localhost:8081/index.bundle")
    assertThat(JSBundleLoader.createFileLoader("/data/b.js").revisionId).isNull()
  }
}
