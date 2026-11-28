/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class BundleInfoTest {

  @Test
  fun keepsTheDevServerRevisionAcrossJson() {
    val info = BundleDownloader.BundleInfo()
    info._url = "http://localhost:8081/index.bundle"
    info.revisionId = "rev-1"

    val parsed = BundleDownloader.BundleInfo.fromJSONString(info.toJSONString())

    assertThat(parsed?.revisionId).isEqualTo("rev-1")
  }

  @Test
  fun readsAMissingRevisionAsNull() {
    val parsed = BundleDownloader.BundleInfo.fromJSONString("""{"url":"u","filesChangedCount":0}""")

    assertThat(parsed?.revisionId).isNull()
  }
}
