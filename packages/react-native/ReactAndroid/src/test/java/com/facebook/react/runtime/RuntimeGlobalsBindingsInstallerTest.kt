/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.jni.HybridData
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.ReadableType
import com.facebook.testutils.shadows.ShadowNativeArray
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowReadableNativeArray
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeArray
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowNativeMap::class,
            ShadowReadableNativeMap::class,
            ShadowWritableNativeMap::class,
            ShadowNativeArray::class,
            ShadowReadableNativeArray::class,
            ShadowWritableNativeArray::class,
            RuntimeGlobalsBindingsInstallerTest.NativeInitializer::class,
            RuntimeGlobalsBindingsInstallerTest.NativeDestructor::class,
        ],
)
class RuntimeGlobalsBindingsInstallerTest {
  // Native initialization is mocked, so there is no native allocation to destroy.
  @Implements(HybridData.Destructor::class)
  class NativeDestructor {
    companion object {
      @JvmStatic @Implementation fun deleteNative(pointer: Long) = Unit
    }
  }

  // Only intercept the JNI boundary. create() and Arguments.makeNativeMap() run unchanged.
  @Implements(RuntimeGlobalsBindingsInstaller::class)
  class NativeInitializer {
    companion object {
      val receivedGlobals = mutableListOf<ReadableNativeMap>()
      val receivedBindingsInstallers = mutableListOf<BindingsInstaller?>()

      @JvmStatic
      @Implementation
      fun initHybrid(globals: NativeMap, bindingsInstaller: BindingsInstaller?): HybridData {
        receivedGlobals.add(globals as ReadableNativeMap)
        receivedBindingsInstallers.add(bindingsInstaller)
        return mock()
      }
    }
  }

  @Before
  fun setUp() {
    NativeInitializer.receivedGlobals.clear()
    NativeInitializer.receivedBindingsInstallers.clear()
  }

  @Test
  fun passesCallerSelectedNamesAndConvertedValuesToNative() {
    val installer =
        RuntimeGlobalsBindingsInstaller.create(
            mapOf(
                "config" to
                    mapOf(
                        "text" to "native",
                        "enabled" to true,
                        "count" to 42,
                        "long" to 43L,
                        "ratio" to 1.5f,
                        "items" to listOf("first", false, null, mapOf("nested" to 2.5)),
                    ),
                "emptyValue" to null,
                "customName" to "value",
            ),
        )

    assertThat(installer).isInstanceOf(BindingsInstaller::class.java)
    val globals = NativeInitializer.receivedGlobals.single()
    assertThat(globals.toHashMap().keys)
        .containsExactlyInAnyOrder("config", "emptyValue", "customName")
    assertThat(globals.isNull("emptyValue")).isTrue()
    assertThat(globals.getString("customName")).isEqualTo("value")
    val config = checkNotNull(globals.getMap("config"))
    assertThat(config.getString("text")).isEqualTo("native")
    assertThat(config.getBoolean("enabled")).isTrue()
    assertThat(config.getInt("count")).isEqualTo(42)
    assertThat(config.getDouble("long")).isEqualTo(43.0)
    assertThat(config.getDouble("ratio")).isEqualTo(1.5)
    val items = checkNotNull(config.getArray("items"))
    assertThat(items.size()).isEqualTo(4)
    assertThat(items.getString(0)).isEqualTo("first")
    assertThat(items.getBoolean(1)).isFalse()
    assertThat(items.isNull(2)).isTrue()
    assertThat(checkNotNull(items.getMap(3)).getDouble("nested")).isEqualTo(2.5)
  }

  @Test
  fun snapshotsMutableInputIncludingNestedCollections() {
    val items = mutableListOf<Any?>(1, null)
    val config = mutableMapOf<String, Any?>("label" to "before", "items" to items)
    val globals = mutableMapOf<String, Any?>("config" to config)

    RuntimeGlobalsBindingsInstaller.create(globals)
    globals["later"] = true
    config["label"] = "after"
    items[0] = 99
    items.add("later")

    val received = NativeInitializer.receivedGlobals.single()
    assertThat(received.hasKey("later")).isFalse()
    val receivedConfig = checkNotNull(received.getMap("config"))
    assertThat(receivedConfig.getString("label")).isEqualTo("before")
    val receivedItems = checkNotNull(receivedConfig.getArray("items"))
    assertThat(receivedItems.size()).isEqualTo(2)
    assertThat(receivedItems.getInt(0)).isEqualTo(1)
    assertThat(receivedItems.getType(1)).isEqualTo(ReadableType.Null)
  }

  @Test
  fun separateInstallersKeepTheirOwnSnapshots() {
    val globals = mutableMapOf<String, Any?>("value" to 1)
    RuntimeGlobalsBindingsInstaller.create(globals)
    globals["value"] = 2
    RuntimeGlobalsBindingsInstaller.create(globals)

    assertThat(NativeInitializer.receivedGlobals).hasSize(2)
    assertThat(NativeInitializer.receivedGlobals[0].getInt("value")).isEqualTo(1)
    assertThat(NativeInitializer.receivedGlobals[1].getInt("value")).isEqualTo(2)
  }

  @Test
  fun forwardsTheProvidedBindingsInstallerToNative() {
    val customInstaller = mock<BindingsInstaller>()

    RuntimeGlobalsBindingsInstaller.create(mapOf("value" to 1), customInstaller)

    assertThat(NativeInitializer.receivedGlobals.single().getInt("value")).isEqualTo(1)
    assertThat(NativeInitializer.receivedBindingsInstallers).containsExactly(customInstaller)
  }

  @Test
  fun singleArgumentCreateForwardsNoBindingsInstaller() {
    RuntimeGlobalsBindingsInstaller.create(mapOf("value" to 1))

    assertThat(NativeInitializer.receivedBindingsInstallers).containsExactly(null)
  }

  @Test
  fun acceptsEmptyGlobals() {
    RuntimeGlobalsBindingsInstaller.create(emptyMap())

    assertThat(NativeInitializer.receivedGlobals.single().toHashMap()).isEmpty()
  }

  @Test
  fun rejectsUnsupportedValuesBeforeCreatingTheNativeInstaller() {
    assertThatThrownBy {
          RuntimeGlobalsBindingsInstaller.create(mapOf("config" to mapOf("unsupported" to Any())))
        }
        .isInstanceOf(IllegalArgumentException::class.java)

    assertThat(NativeInitializer.receivedGlobals).isEmpty()
  }
}
