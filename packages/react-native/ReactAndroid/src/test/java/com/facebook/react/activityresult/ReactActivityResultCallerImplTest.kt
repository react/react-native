/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.activityresult

import android.app.Activity
import android.os.Bundle
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts.GetContent
import androidx.activity.result.contract.ActivityResultContracts.RequestPermission
import androidx.core.app.ActivityOptionsCompat
import com.facebook.react.bridge.ReactApplicationContext
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

/**
 * Covers the registration keying scheme: owner-scoped by default so two independent modules can use
 * the same stock contract, with an extra-key overload -- appended to that scope, not replacing it --
 * for one owner needing several launchers of the same contract class.
 */
@RunWith(RobolectricTestRunner::class)
class ReactActivityResultCallerImplTest {

  /** Records the keys handed to [ActivityResultRegistry.register] and never starts anything. */
  private class RecordingRegistry : ActivityResultRegistry() {
    override fun <I, O> onLaunch(
        requestCode: Int,
        contract: ActivityResultContract<I, O>,
        input: I,
        options: ActivityOptionsCompat?,
    ): Unit = Unit

    /** [onSaveInstanceState] is the only public window into the registry's key table. */
    val registeredKeys: List<String>
      get() =
          Bundle()
              .also { onSaveInstanceState(it) }
              .getStringArrayList("KEY_COMPONENT_ACTIVITY_REGISTERED_KEYS")
              .orEmpty()
  }

  class TestActivity : Activity(), ActivityResultRegistryOwner {
    override val activityResultRegistry: ActivityResultRegistry = RecordingRegistry()
  }

  /** Two distinct owner classes, standing in for two unrelated third-party modules. */
  private class ModuleA

  private class ModuleB

  private lateinit var registry: RecordingRegistry
  private lateinit var reactContext: ReactApplicationContext
  private lateinit var caller: ReactActivityResultCallerImpl

  private val moduleA = ModuleA()
  private val moduleB = ModuleB()

  private val moduleAName = ModuleA::class.java.name
  private val moduleBName = ModuleB::class.java.name
  private val getContentName = GetContent::class.java.name

  @Before
  fun setUp() {
    val activity = Robolectric.buildActivity(TestActivity::class.java).create().get()
    registry = activity.activityResultRegistry as RecordingRegistry
    reactContext = mock<ReactApplicationContext>()
    whenever(reactContext.currentActivity).thenReturn(activity)
    caller = ReactActivityResultCallerImpl(reactContext)
  }

  @Test
  fun twoOwnersMayRegisterTheSameStockContract() {
    caller.registerForActivityResult(moduleA, GetContent()) {}
    caller.registerForActivityResult(moduleB, GetContent()) {}

    assertThat(registry.registeredKeys)
        .containsExactlyInAnyOrder(
            "$moduleAName:$getContentName", "$moduleBName:$getContentName")
  }

  @Test
  fun oneOwnerRegisteringTheSameContractTwiceThrows() {
    caller.registerForActivityResult(moduleA, GetContent()) {}

    assertThatThrownBy { caller.registerForActivityResult(moduleA, GetContent()) {} }
        .isInstanceOf(IllegalStateException::class.java)
        .hasMessageContaining("registerForActivityResult(owner, \"someName\", contract, callback)")
  }

  @Test
  fun oneOwnerMayRegisterDifferentContractClasses() {
    caller.registerForActivityResult(moduleA, GetContent()) {}
    caller.registerForActivityResult(moduleA, RequestPermission()) {}

    assertThat(registry.registeredKeys)
        .containsExactlyInAnyOrder(
            "$moduleAName:$getContentName", "$moduleAName:${RequestPermission::class.java.name}")
  }

  @Test
  fun extraKeysAllowTwoLaunchersOfOneContract() {
    caller.registerForActivityResult(moduleA, "avatar", GetContent()) {}
    caller.registerForActivityResult(moduleA, "banner", GetContent()) {}

    assertThat(registry.registeredKeys)
        .containsExactlyInAnyOrder(
            "$moduleAName:$getContentName:avatar", "$moduleAName:$getContentName:banner")
  }

  /** The owner-and-contract scope is still applied, so a shared key across owners is safe. */
  @Test
  fun theSameExtraKeyFromTwoOwnersDoesNotCollide() {
    caller.registerForActivityResult(moduleA, "pick", GetContent()) {}
    caller.registerForActivityResult(moduleB, "pick", GetContent()) {}

    assertThat(registry.registeredKeys)
        .containsExactlyInAnyOrder(
            "$moduleAName:$getContentName:pick", "$moduleBName:$getContentName:pick")
  }

  @Test
  fun duplicateExtraKeyForOneOwnerThrows() {
    caller.registerForActivityResult(moduleA, "avatar", GetContent()) {}

    assertThatThrownBy { caller.registerForActivityResult(moduleA, "avatar", GetContent()) {} }
        .isInstanceOf(IllegalStateException::class.java)
        .hasMessageContaining("$moduleAName:$getContentName:avatar")
        .hasMessageContaining("unique among this owner's launchers")
  }

  @Test
  fun aNonModuleOwnerKeysTheSameWayAModuleDoes() {
    class MediaHelper

    val helper = MediaHelper()
    caller.registerForActivityResult(helper, GetContent()) {}

    assertThat(registry.registeredKeys)
        .containsExactly("${MediaHelper::class.java.name}:$getContentName")
  }

  @Test
  fun unregisteringFreesTheKeyForReuse() {
    val launcher = caller.registerForActivityResult(moduleA, GetContent()) {}
    launcher.unregister()

    caller.registerForActivityResult(moduleA, GetContent()) {}

    assertThat(registry.registeredKeys).containsExactly("$moduleAName:$getContentName")
  }
}
