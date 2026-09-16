/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.content.res.AssetManager

/** An interface for classes that initialize JavaScript using [JSBundleLoader] */
public interface JSBundleLoaderDelegate {
  /**
   * Load a JS bundle from Android assets. See [JSBundleLoader.createAssetLoader]
   *
   * @param assetManager
   * @param assetURL
   * @param loadSynchronously
   */
  public fun loadScriptFromAssets(
      assetManager: AssetManager,
      assetURL: String,
      loadSynchronously: Boolean,
  )

  /**
   * Load a JS bundle from the filesystem. See [JSBundleLoader.createFileLoader] and
   * [JSBundleLoader.createCachedBundleFromNetworkLoader]
   *
   * @param fileName
   * @param sourceURL
   * @param loadSynchronously
   */
  public fun loadScriptFromFile(fileName: String, sourceURL: String, loadSynchronously: Boolean)

  /**
   * This API is used in situations where the JS bundle is being executed not on the device, but on
   * a host machine. In that case, we must provide two source URLs for the JS bundle: One to be used
   * on the device, and one to be used on the remote debugging machine.
   *
   * @param deviceURL A source URL that is accessible from this device.
   * @param remoteURL A source URL that is accessible from the remote machine executing the JS.
   */
  public fun setSourceURLs(deviceURL: String, remoteURL: String)
}
