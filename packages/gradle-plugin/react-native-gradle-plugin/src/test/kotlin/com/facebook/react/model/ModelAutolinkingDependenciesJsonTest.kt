/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.model

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class ModelAutolinkingDependenciesJsonTest {

  @Test
  fun nameCleansed_withoutScope() {
    assertThat(ModelAutolinkingDependenciesJson("", "name", null).nameCleansed).isEqualTo("name")
    assertThat(ModelAutolinkingDependenciesJson("", "react~native", null).nameCleansed)
        .isEqualTo("react_native")
    assertThat(ModelAutolinkingDependenciesJson("", "react*native", null).nameCleansed)
        .isEqualTo("react_native")
    assertThat(ModelAutolinkingDependenciesJson("", "react!native", null).nameCleansed)
        .isEqualTo("react_native")
    assertThat(ModelAutolinkingDependenciesJson("", "react'native", null).nameCleansed)
        .isEqualTo("react_native")
    assertThat(ModelAutolinkingDependenciesJson("", "react(native", null).nameCleansed)
        .isEqualTo("react_native")
    assertThat(ModelAutolinkingDependenciesJson("", "react)native", null).nameCleansed)
        .isEqualTo("react_native")
    assertThat(ModelAutolinkingDependenciesJson("", "react~*!'()native", null).nameCleansed)
        .isEqualTo("react_native")
  }

  @Test
  fun nameCleansed_withScope() {
    assertThat(ModelAutolinkingDependenciesJson("", "@react-native/package", null).nameCleansed)
        .isEqualTo("react-native_package")
    assertThat(
        ModelAutolinkingDependenciesJson(
            "",
            "@this*is~a(more)complicated/example!of~weird)packages",
            null,
        )
            .nameCleansed
    )
        .isEqualTo("this_is_a_more_complicated_example_of_weird_packages")
  }
}
