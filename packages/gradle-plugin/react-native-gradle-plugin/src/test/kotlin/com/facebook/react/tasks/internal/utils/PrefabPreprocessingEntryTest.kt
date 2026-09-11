/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal.utils

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class PrefabPreprocessingEntryTest {

  @Test
  fun secondaryConstructor_createsAList() {
    val sampleEntry =
        PrefabPreprocessingEntry(
            libraryName = "justALibrary",
            pathToPrefixCouple = "aPath" to "andAPrefix",
        )

    assertThat(sampleEntry.pathToPrefixCouples.size).isEqualTo(1)
    assertThat(sampleEntry.pathToPrefixCouples[0].first).isEqualTo("aPath")
    assertThat(sampleEntry.pathToPrefixCouples[0].second).isEqualTo("andAPrefix")
  }
}
