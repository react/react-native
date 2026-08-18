/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import org.assertj.core.api.Assertions
import org.assertj.core.data.MapEntry
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class UIManagerModuleConstantsTest {

  private class ConcreteViewManager(val viewName: String) : SimpleViewManager<View>() {

    private var customDirectEventTypeConstants: Map<String, Map<String, Any>> = emptyMap()

    fun setExportedCustomDirectEventTypeConstants(constants: Map<String, Map<String, Any>>) {
      customDirectEventTypeConstants = constants
    }

    override fun createViewInstance(reactContext: ThemedReactContext): View = View(reactContext)

    override fun getName(): String = viewName

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Map<String, Any>> =
        customDirectEventTypeConstants

    override fun getExportedCustomBubblingEventTypeConstants(): MutableMap<String, Any> =
        mutableMapOf("onTwirl" to TWIRL_BUBBLING_EVENT_MAP)

    override fun getExportedViewConstants(): MutableMap<String, Any> = mutableMapOf(
        "PhotoSizeType" to
            mutableMapOf(
                "Small" to 1,
                "Large" to 2,
            ),
    )

    override fun getNativeProps(): MutableMap<String, String> = mutableMapOf("fooProp" to "number")
  }

  private lateinit var reactContext: ReactApplicationContext

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
  }

  @Suppress("UNCHECKED_CAST")
  @Test
  fun testNoCustomConstants() {
    val manager = ConcreteViewManager(VIEW_MANAGER_NAME)
    manager.exportedCustomDirectEventTypeConstants = mapOf("onTwirl" to TWIRL_DIRECT_EVENT_MAP)

    val viewManagers = listOf(manager)

    val uiManagerModule = UIManagerModule(reactContext, viewManagers, 0)
    val viewManagerConstants =
        uiManagerModule.constants?.get(VIEW_MANAGER_NAME) as Map<String, Any>?

    Assertions.assertThat(viewManagerConstants)
        .containsKey(BUBBLING_EVENTS_TYPES_KEY)
        .containsKey(DIRECT_EVENTS_TYPES_KEY)
  }

  @Suppress("UNCHECKED_CAST")
  @Test
  fun testCustomBubblingEvents() {
    val manager = ConcreteViewManager(VIEW_MANAGER_NAME)
    manager.exportedCustomDirectEventTypeConstants = mapOf("onTwirl" to TWIRL_DIRECT_EVENT_MAP)

    val viewManagers = listOf(manager)

    val uiManagerModule = UIManagerModule(reactContext, viewManagers, 0)
    val viewManagerConstants = uiManagerModule.constants?.get(VIEW_MANAGER_NAME) as Map<String, Any>

    Assertions.assertThat(viewManagerConstants).containsKey(BUBBLING_EVENTS_TYPES_KEY)
    val bubblingEventTypes = viewManagerConstants[BUBBLING_EVENTS_TYPES_KEY] as Map<String, Any>
    Assertions.assertThat(bubblingEventTypes).containsEntry("onTwirl", TWIRL_BUBBLING_EVENT_MAP)
  }

  @Suppress("UNCHECKED_CAST")
  @Test
  fun testCustomDirectEvents() {
    val manager = ConcreteViewManager(VIEW_MANAGER_NAME)
    manager.exportedCustomDirectEventTypeConstants = mapOf("onTwirl" to TWIRL_DIRECT_EVENT_MAP)

    val viewManagers = listOf(manager)

    val uiManagerModule = UIManagerModule(reactContext, viewManagers, 0)
    val viewManagerConstants = uiManagerModule.constants?.get(VIEW_MANAGER_NAME) as Map<String, Any>

    Assertions.assertThat(viewManagerConstants).containsKey(DIRECT_EVENTS_TYPES_KEY)
    val directEventTypes = viewManagerConstants[DIRECT_EVENTS_TYPES_KEY] as Map<String, Any>
    Assertions.assertThat(directEventTypes).containsEntry("onTwirl", TWIRL_DIRECT_EVENT_MAP)
  }

  @Suppress("UNCHECKED_CAST")
  @Test
  fun testCustomViewConstants() {
    val manager = ConcreteViewManager(VIEW_MANAGER_NAME)
    manager.exportedCustomDirectEventTypeConstants = mapOf("onTwirl" to TWIRL_DIRECT_EVENT_MAP)

    val viewManagers = listOf(manager)

    val uiManagerModule = UIManagerModule(reactContext, viewManagers, 0)
    val constants = uiManagerModule.constants
    Assertions.assertThat(constants).containsKey(VIEW_MANAGER_NAME)

    Assertions.assertThat(constants!![VIEW_MANAGER_NAME] as Map<String, Any>)
        .containsKey("Constants")
    Assertions.assertThat(
            valueAtPath(constants, VIEW_MANAGER_NAME, "Constants") as Map<String, Any>?,
        )
        .containsKey("PhotoSizeType")
  }

  @Test
  fun testNativeProps() {
    val manager = ConcreteViewManager(VIEW_MANAGER_NAME)
    manager.exportedCustomDirectEventTypeConstants = mapOf("onTwirl" to TWIRL_DIRECT_EVENT_MAP)

    val viewManagers = listOf(manager)
    val uiManagerModule = UIManagerModule(reactContext, viewManagers, 0)
    val constants = uiManagerModule.constants.orEmpty()
    Assertions.assertThat(
            valueAtPath(constants, VIEW_MANAGER_NAME, "NativeProps", "fooProp") as String?,
        )
        .isEqualTo("number")
  }

  @Suppress("UNCHECKED_CAST")
  @Test
  fun testMergeConstants() {
    val managerX = ConcreteViewManager("ManagerX")
    managerX.exportedCustomDirectEventTypeConstants =
        mapOf(
            "onTwirl" to
                mapOf(
                    "registrationName" to "onTwirl",
                    "keyToOverride" to "valueX",
                    "mapToMerge" to
                        mapOf(
                            "keyToOverride" to "innerValueX",
                            "anotherKey" to "valueX",
                        ),
                ),
        )

    val managerY = ConcreteViewManager("ManagerY")
    managerY.exportedCustomDirectEventTypeConstants =
        mapOf(
            "onTwirl" to
                mapOf(
                    "extraKey" to "extraValue",
                    "keyToOverride" to "valueY",
                    "mapToMerge" to
                        mapOf(
                            "keyToOverride" to "innerValueY",
                            "extraKey" to "valueY",
                        ),
                ),
        )

    val viewManagers = listOf(managerX, managerY)
    val uiManagerModule = UIManagerModule(reactContext, viewManagers, 0)
    val constants = uiManagerModule.constants
    val viewManagerConstants = constants!!["ManagerX"] as Map<String, Any>
    Assertions.assertThat(viewManagerConstants[DIRECT_EVENTS_TYPES_KEY] as Map<String, Any>)
        .containsKey("onTwirl")
    val twirlMap =
        valueAtPath(viewManagerConstants, DIRECT_EVENTS_TYPES_KEY, "onTwirl") as Map<String, Any>

    Assertions.assertThat(twirlMap)
        .contains(MapEntry.entry("registrationName", "onTwirl"))
        .contains(MapEntry.entry("keyToOverride", "valueY"))
        .contains(MapEntry.entry("extraKey", "extraValue"))
        .containsKey("mapToMerge")

    val mapToMerge = valueAtPath(twirlMap, "mapToMerge") as Map<String, Any>
    Assertions.assertThat(mapToMerge)
        .contains(MapEntry.entry("keyToOverride", "innerValueY"))
        .contains(MapEntry.entry("anotherKey", "valueX"))
        .contains(MapEntry.entry("extraKey", "valueY"))
  }

  companion object {

    private val TWIRL_BUBBLING_EVENT_MAP: Map<*, *> = mapOf(
        "phasedRegistrationNames" to
            mapOf(
                "bubbled" to "onTwirl",
                "captured" to "onTwirlCaptured",
            ),
    )

    private val TWIRL_DIRECT_EVENT_MAP: Map<String, Any> = mapOf("registrationName" to "onTwirl")

    private const val VIEW_MANAGER_NAME = "viewManagerName"
    private const val BUBBLING_EVENTS_TYPES_KEY = "bubblingEventTypes"
    private const val DIRECT_EVENTS_TYPES_KEY = "directEventTypes"

    @Suppress("UNCHECKED_CAST")
    private fun valueAtPath(nestedMap: Map<String, Any>, vararg keyPath: String): Any? {
      Assertions.assertThat(keyPath).isNotEmpty
      var value: Any? = nestedMap
      for (key in keyPath) {
        Assertions.assertThat(value).isInstanceOf(MutableMap::class.java)

        val currentNestedMap = value as Map<String, Any>
        Assertions.assertThat(key in currentNestedMap).isTrue

        value = currentNestedMap[key]
      }
      return value
    }
  }
}
