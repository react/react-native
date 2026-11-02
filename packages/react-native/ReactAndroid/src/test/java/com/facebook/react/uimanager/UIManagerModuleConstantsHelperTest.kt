/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.annotation.SuppressLint
import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewManager
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException
import java.util.concurrent.atomic.AtomicInteger
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class UIManagerModuleConstantsHelperTest {

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @After
  fun tearDown() {
    ViewManagerPropertyUpdater.clear()
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun nativeProps_withCoreGenericDelegateAndFlagDisabled_areGenerated() {
    assertThat(ReactViewManager().nativeProps).containsEntry("opacity", "number")
  }

  @Test
  fun nativeProps_withCoreGenericDelegateAndFlagEnabled_areGenerated() {
    enableSkippingNativeProps()

    assertThat(ReactViewManager().nativeProps).containsEntry("opacity", "number")
  }

  @Test
  fun nativeProps_withDelegateAndFlagDisabled_areGenerated() {
    val viewManager = DelegatedTestViewManager()

    assertThat(viewManager.nativeProps).containsEntry("testProp", "boolean")
    assertThat(viewManager.delegateRequests).isZero()
  }

  @Test
  fun nativeProps_withDelegateAndFlagEnabled_areSkipped() {
    enableSkippingNativeProps()
    val viewManager = DelegatedTestViewManager()

    assertThat(viewManager.nativeProps).isEmpty()
    assertThat(viewManager.shadowNodeClassRequests).isZero()
  }

  @Test
  fun nativeProps_withDelegateAndFlagEnabled_allowsSubclassToAddProps() {
    enableSkippingNativeProps()
    val viewManager =
        object : DelegatedTestViewManager() {
          override fun getNativeProps(): MutableMap<String, String> =
              super.getNativeProps().apply { put("extraProp", "String") }
        }

    val constants =
        UIManagerModuleConstantsHelper.createConstantsForViewManager(
            viewManager,
            null,
            null,
            null,
            null,
        )

    assertThat(constants).containsEntry("NativeProps", mapOf("extraProp" to "String"))
    assertThat(viewManager.shadowNodeClassRequests).isZero()
  }

  @Test
  fun nativeProps_withDelegateAndFlagEnabled_returnsIndependentMutableMaps() {
    enableSkippingNativeProps()
    val viewManager = DelegatedTestViewManager()

    val first = viewManager.nativeProps
    first["extraProp"] = "String"
    val second = viewManager.nativeProps

    assertThat(first).containsEntry("extraProp", "String")
    assertThat(second).isEmpty()
    assertThat(second === first).isFalse()
  }

  @Test
  fun nativeProps_withGenericDelegateAndFlagEnabled_areGenerated() {
    enableSkippingNativeProps()
    val viewManager = TestViewManager()

    assertThat(viewManager.nativeProps).containsEntry("testProp", "boolean")
  }

  @Test
  fun nativeProps_withGeneratedInterfaceButNoCustomDelegate_areGenerated() {
    enableSkippingNativeProps()
    val viewManager = MarkerOnlyTestViewManager()

    assertThat(viewManager.nativeProps).containsEntry("testProp", "boolean")
  }

  @Test
  fun nativeProps_withNullDelegateAndFlagEnabled_areGenerated() {
    enableSkippingNativeProps()
    val viewManager =
        object : TestViewManager() {
          override fun getDelegate(): ViewManagerDelegate<View>? = null
        }

    assertThat(viewManager.nativeProps).containsEntry("testProp", "boolean")
  }

  @Test
  fun nativeProps_withDelegate_reusesThePropUpdateDelegateCache() {
    enableSkippingNativeProps()
    val viewManager = DelegatedTestViewManager()

    assertThat(viewManager.nativeProps).isEmpty()
    assertThat(viewManager.nativeProps).isEmpty()
    assertThat(viewManager.delegateRequests).isEqualTo(1)

    val view: View = mock()
    val args: ReadableArray = mock()
    viewManager.receiveCommand(view, "testCommand", args)
    viewManager.receiveCommand(view, "testCommand", args)

    assertThat(viewManager.delegateRequests).isEqualTo(1)
    assertThat(viewManager.testDelegate.commands)
        .containsExactly(Triple(view, "testCommand", args), Triple(view, "testCommand", args))
  }

  @Test
  fun nativeProps_withPreviouslyCachedDelegate_doesNotRequestAnotherDelegate() {
    enableSkippingNativeProps()
    val viewManager = DelegatedTestViewManager()
    val view: View = mock()
    val args: ReadableArray = mock()

    viewManager.receiveCommand(view, "testCommand", args)
    assertThat(viewManager.nativeProps).isEmpty()

    assertThat(viewManager.delegateRequests).isEqualTo(1)
    assertThat(viewManager.testDelegate.commands).containsExactly(Triple(view, "testCommand", args))
  }

  // This executor belongs only to this test and is never shared.
  @SuppressLint("BadMethodUse-java.util.concurrent.ExecutorService.shutdownNow")
  @Test
  fun nativeProps_andCommands_initializeTheDelegateOnceAcrossThreads() {
    enableSkippingNativeProps()
    val delegate = RecordingDelegate<View>()
    val delegateRequests = AtomicInteger()
    val initializing = CountDownLatch(1)
    val releaseInitialization = CountDownLatch(1)
    val viewManager =
        object : TestViewManager() {
          override fun getDelegate(): ViewManagerDelegate<View> {
            delegateRequests.incrementAndGet()
            initializing.countDown()
            check(releaseInitialization.await(5, TimeUnit.SECONDS))
            return delegate
          }
        }
    val view: View = mock()
    val args: ReadableArray = mock()
    val ready = CountDownLatch(8)
    val start = CountDownLatch(1)
    val executor = Executors.newFixedThreadPool(8)

    try {
      val futures =
          (0 until 8).map { index ->
            executor.submit {
              ready.countDown()
              check(start.await(5, TimeUnit.SECONDS))
              if (index % 2 == 0) {
                assertThat(viewManager.nativeProps).isEmpty()
              } else {
                viewManager.receiveCommand(view, "testCommand", args)
              }
            }
          }
      assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue()
      start.countDown()
      assertThat(initializing.await(5, TimeUnit.SECONDS)).isTrue()
      assertThatThrownBy { futures.first().get(100, TimeUnit.MILLISECONDS) }
          .isInstanceOf(TimeoutException::class.java)
      assertThat(delegateRequests.get()).isEqualTo(1)
      releaseInitialization.countDown()
      futures.forEach { it.get(5, TimeUnit.SECONDS) }

      assertThat(delegateRequests.get()).isEqualTo(1)
      assertThat(delegate.commands)
          .containsExactly(
              Triple(view, "testCommand", args),
              Triple(view, "testCommand", args),
              Triple(view, "testCommand", args),
              Triple(view, "testCommand", args),
          )
    } finally {
      start.countDown()
      releaseInitialization.countDown()
      executor.shutdownNow()
    }
  }

  @Test
  fun constants_withDelegateAndFlagEnabled_preserveOtherMetadata() {
    enableSkippingNativeProps()
    val viewManager = DelegatedTestViewManager()

    val constants =
        UIManagerModuleConstantsHelper.createConstantsForViewManager(
            viewManager,
            null,
            null,
            null,
            null,
        )

    assertThat(constants)
        .doesNotContainKey("NativeProps")
        .containsEntry("Constants", mapOf("testConstant" to true))
        .containsEntry("Commands", mapOf("testCommand" to 1))
        .containsEntry(
            "directEventTypes",
            mapOf("topTest" to mapOf("registrationName" to "onTest")),
        )
    assertThat(viewManager.shadowNodeClassRequests).isZero()
  }

  private fun enableSkippingNativeProps() {
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun skipNativePropsForViewManagerWithDelegateAndroid(): Boolean = true
        },
    )
  }

  @Suppress("DEPRECATION")
  private open class TestViewManager : ViewManager<View, LayoutShadowNode>() {
    var shadowNodeClassRequests: Int = 0
      private set

    override fun getName(): String = "TestView"

    override fun getShadowNodeClass(): Class<LayoutShadowNode> {
      shadowNodeClassRequests++
      return LayoutShadowNode::class.java
    }

    override fun createViewInstance(context: ThemedReactContext): View =
        error("This test does not create views")

    override fun updateExtraData(root: View, extraData: Any?) = Unit

    override fun prepareToRecycleView(reactContext: ThemedReactContext, view: View): View? = null

    override fun getExportedViewConstants(): MutableMap<String, Any> =
        mutableMapOf("testConstant" to true)

    override fun getCommandsMap(): MutableMap<String, Int> = mutableMapOf("testCommand" to 1)

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
        mutableMapOf("topTest" to mapOf("registrationName" to "onTest"))

    @ReactProp(name = "testProp")
    @Suppress("UNUSED_PARAMETER")
    fun setTestProp(view: View, value: Boolean) = Unit
  }

  private class MarkerOnlyTestViewManager : TestViewManager(), ViewManagerWithGeneratedInterface

  private open class DelegatedTestViewManager : TestViewManager() {
    val testDelegate = RecordingDelegate<View>()
    var delegateRequests: Int = 0
      private set

    override fun getDelegate(): ViewManagerDelegate<View> {
      delegateRequests++
      return testDelegate
    }
  }

  private class RecordingDelegate<T : View> : ViewManagerDelegate<T> {
    val commands = ConcurrentLinkedQueue<Triple<T, String, ReadableArray>>()

    @Suppress("ACCIDENTAL_OVERRIDE", "INAPPLICABLE_JVM_NAME")
    @JvmName("kotlinCompat\$setProperty")
    @JvmSynthetic
    override fun setProperty(view: T, propName: String, value: Any?) = Unit

    @Suppress("ACCIDENTAL_OVERRIDE", "INAPPLICABLE_JVM_NAME")
    @JvmName("kotlinCompat\$receiveCommand")
    @JvmSynthetic
    override fun receiveCommand(view: T, commandName: String, args: ReadableArray) {
      commands.add(Triple(view, commandName, args))
    }
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
    val nestedObjects =
        mutableMapOf<String, Any>(
            "onColorChanged" to
                mutableMapOf<String, Any>(
                    "phasedRegistrationNames" to
                        mutableMapOf<String, Any>(
                            "bubbled" to "onColorChanged",
                            "captured" to "onColorChangedCapture",
                        ),
                ),
        )
    val result =
        checkNotNull(
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
