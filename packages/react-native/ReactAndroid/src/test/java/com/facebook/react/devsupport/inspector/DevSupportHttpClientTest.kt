/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class DevSupportHttpClientTest {
  @Test
  fun acceptsHostsThatOkHttpCanConnectTo() {
    assertThat(DevSupportHttpClient.isValidHost("localhost:8081")).isTrue()
    assertThat(DevSupportHttpClient.isValidHost("10.0.2.2:8081")).isTrue()
    assertThat(DevSupportHttpClient.isValidHost("example.com:443")).isTrue()
  }

  @Test
  fun rejectsHostsThatOkHttpCannotParse() {
    assertThat(DevSupportHttpClient.isValidHost("localhost:80a")).isFalse()
    assertThat(DevSupportHttpClient.isValidHost("foo bar:8081")).isFalse()
    assertThat(DevSupportHttpClient.isValidHost("localhost:8081 ")).isFalse()
    assertThat(DevSupportHttpClient.isValidHost("localhost:8081\t")).isFalse()
  }
}
