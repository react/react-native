/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.util

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class JSStackTraceTest {

  @Test
  fun testSymbolication() {
    val values =
        JavaOnlyArray.of(
            JavaOnlyMap.of(
                "methodName",
                "method_from_bundle",
                "column",
                11,
                "lineNumber",
                7,
                "file",
                "Fb4aBundle.js",
            ),
            JavaOnlyMap.of(
                "methodName",
                "method_from_ram_bundle",
                "column",
                13,
                "lineNumber",
                18,
                "file",
                "199.js",
            ),
            JavaOnlyMap.of(
                "methodName",
                "method_from_ram_bundle_with_address",
                "column",
                13,
                "lineNumber",
                18,
                "file",
                "address at 199.js",
            ),
            JavaOnlyMap.of(
                "methodName",
                "method_from_segment",
                "column",
                18,
                "lineNumber",
                9,
                "file",
                "seg-1.js",
            ),
            JavaOnlyMap.of(
                "methodName",
                "method_from_segment_with_address",
                "column",
                18,
                "lineNumber",
                9,
                "file",
                "address at seg-1.js",
            ),
            JavaOnlyMap.of(
                "methodName",
                "method_from_ram_segment",
                "column",
                20,
                "lineNumber",
                10,
                "file",
                "seg-3_198.js",
            ),
            JavaOnlyMap.of(
                "methodName",
                "method_from_ram_segment_with_address",
                "column",
                20,
                "lineNumber",
                10,
                "file",
                "address at seg-3_198.js",
            ),
        )
    val message = JSStackTrace.format("Error", values)
    assertThat(message)
        .isEqualTo(
            """
            Error, stack:
            method_from_bundle@7:11
            method_from_ram_bundle@199.js:18:13
            method_from_ram_bundle_with_address@199.js:18:13
            method_from_segment@seg-1.js:9:18
            method_from_segment_with_address@seg-1.js:9:18
            method_from_ram_segment@seg-3_198.js:10:20
            method_from_ram_segment_with_address@seg-3_198.js:10:20

            """
                .trimIndent(),
        )
  }
}
