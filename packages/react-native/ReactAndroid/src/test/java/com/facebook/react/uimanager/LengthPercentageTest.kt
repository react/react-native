/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.DynamicFromObject
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.mockito.Mockito.mockStatic

class LengthPercentageTest {

  @Test
  fun parsesPointAndPercentageValues() {
    assertThat(LengthPercentage.setFromDynamic(DynamicFromObject(12.0)))
        .isEqualTo(LengthPercentage(12f, LengthPercentageType.POINT))
    assertThat(LengthPercentage.setFromDynamic(DynamicFromObject("25%")))
        .isEqualTo(LengthPercentage(25f, LengthPercentageType.PERCENT))
  }

  @Test
  fun rejectsNegativeValuesByDefault() {
    assertThat(LengthPercentage.setFromDynamic(DynamicFromObject(-1.0))).isNull()
    assertThat(LengthPercentage.setFromDynamic(DynamicFromObject("-1%"))).isNull()
  }

  @Test
  fun acceptsNegativeValuesWhenAllowed() {
    assertThat(LengthPercentage.setFromDynamic(DynamicFromObject(-1.0), allowNegative = true))
        .isEqualTo(LengthPercentage(-1f, LengthPercentageType.POINT))
    assertThat(LengthPercentage.setFromDynamic(DynamicFromObject("-1%"), allowNegative = true))
        .isEqualTo(LengthPercentage(-1f, LengthPercentageType.PERCENT))
  }

  @Test
  fun clearsNullWithoutWarning() {
    mockStatic(FLog::class.java).use { flog ->
      assertThat(LengthPercentage.setFromDynamic(DynamicFromObject(null))).isNull()
      flog.verifyNoInteractions()
    }
  }
}
