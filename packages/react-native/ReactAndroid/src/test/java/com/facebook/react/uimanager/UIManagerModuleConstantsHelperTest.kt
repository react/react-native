/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test

class UIManagerModuleConstantsHelperTest {

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @Test
  fun normalizeEventTypes_withEmptyMap_doesNothing() {
    val emptyMap = mutableMapOf<String, Any>()
    assertThat(UIManagerModuleConstantsHelper.normalizeEventTypes(emptyMap)).isEmpty()
  }

  @Test
  fun normalizeEventTypes_withOnEvent_doesNormalize() {
    val onClickMap = mutableMapOf<String, Any>("onClick" to "¯\\_(ツ)_/¯")
    assertThat(UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap))
        .containsKeys("topClick", "onClick")
  }

  @Test
  fun normalizeEventTypes_withTopEvent_doesNormalize() {
    val onClickMap = mutableMapOf<String, Any>("topOnClick" to "¯\\_(ツ)_/¯")
    assertThat(UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap))
        .containsKey("topOnClick")
        .doesNotContainKey("onClick")
  }

  @Suppress("UNCHECKED_CAST")
  @Test
  fun normalizeEventTypes_withNestedObjects_doesNotLoseThem() {
    val nestedObjects = mutableMapOf<String, Any>(
        "onColorChanged" to
            mutableMapOf<String, Any>(
                "phasedRegistrationNames" to
                    mutableMapOf<String, Any>(
                        "bubbled" to "onColorChanged",
                        "captured" to "onColorChangedCapture",
                    ),
            ),
    )
    val result = checkNotNull(
        UIManagerModuleConstantsHelper.normalizeEventTypes(nestedObjects)
            as Map<String, Map<String, Map<String, String>>>,
    ) {
      "returned map was null"
    }
    verifyNestedObjects(result, "topColorChanged")
    verifyNestedObjects(result, "onColorChanged")
  }

  private fun verifyNestedObjects(
      nestedObjects: Map<String, Map<String, Map<String, String>>>,
      name: String,
  ) {
    assertThat(nestedObjects).containsKey(name)
    val innerMap = checkNotNull(nestedObjects[name]) { """nestedObjects["$name"] is null""" }
    assertThat(innerMap).containsKey("phasedRegistrationNames")
    val innerInnerMap =
        checkNotNull(innerMap["phasedRegistrationNames"]) {
          """nestedObjects["$name"]["phasedRegistrationNames"] is null"""
        }
    assertThat("onColorChanged").isEqualTo(innerInnerMap["bubbled"])
    assertThat("onColorChangedCapture").isEqualTo(innerInnerMap["captured"])
  }
}
