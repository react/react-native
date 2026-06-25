/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

public interface DevBundleDownloadListener {
  public fun onSuccess()

  public fun onProgress(status: String?, done: Int?, total: Int?, percent: Int?)

  public fun onFailure(cause: Exception)
}
