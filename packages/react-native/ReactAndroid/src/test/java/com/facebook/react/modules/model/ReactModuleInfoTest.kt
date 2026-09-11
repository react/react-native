/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.model

import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class ReactModuleInfoTest {

  @Test
  fun testCreateReactModuleInfo() {
    val reactModuleInfo =
        ReactModuleInfo(
            /* name = */ "name",
            /* className = */ "class",
            /* canOverrideExistingModule = */ false,
            /* needsEagerInit = */ false,
            /* isCxxModule = */ false,
            /* isTurboModule = */ false,
        )
    assertThat(reactModuleInfo.name).isEqualTo("name")
    assertThat(reactModuleInfo.canOverrideExistingModule).isFalse()
    assertThat(reactModuleInfo.needsEagerInit).isFalse()
    assertThat(reactModuleInfo.isCxxModule).isFalse()
    assertThat(reactModuleInfo.isTurboModule).isFalse()
  }

  @Test
  fun classIsTurboModule_withRandomClass() {
    assertThat(ReactModuleInfo.classIsTurboModule(String::class.java)).isFalse()
  }

  @Test
  fun classIsTurboModule_withTurboModule() {
    assertThat(ReactModuleInfo.classIsTurboModule(TestTurboModule::class.java)).isTrue()
  }

  inner class TestTurboModule : TurboModule {
    override fun initialize() = Unit

    override fun invalidate() = Unit
  }
}
