/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class DebugServerExceptionTest {

  @Test
  fun testParseWithLocation() {
    val exception =
        DebugServerException.parse(
            null,
            """{"message":"SyntaxError","filename":"/path/to/App.js","lineNumber":2,"column":18}""",
        )
    checkNotNull(exception)
    assertThat(exception.message).isEqualTo("SyntaxError\n  at App.js:2:18")
    assertThat(exception.originalMessage).isEqualTo("SyntaxError")
  }

  @Test
  fun testParseWithoutLocation() {
    val exception =
        DebugServerException.parse(
            null,
            """{"type":"InternalError","errors":[],"message":"Metro has encountered an error"}""",
        )
    checkNotNull(exception)
    assertThat(exception.message).isEqualTo("Metro has encountered an error")
  }

  @Test
  fun testParseWithoutMessage() {
    assertThat(DebugServerException.parse(null, "<html>Bad Gateway</html>")).isNull()
  }
}
