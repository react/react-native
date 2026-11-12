/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.content.Context
import com.facebook.react.common.DebugServerException

/** A class that stores JS bundle information and allows a [JSBundleLoaderDelegate]. */
public abstract class JSBundleLoader {

  /** Loads the script, returning the URL of the source it loaded. */
  public abstract fun loadScript(delegate: JSBundleLoaderDelegate): String

  /** The dev server's label for the revision it built the bundle from, null when there is none. */
  public open val revisionId: String?
    get() = null

  public companion object {
    /**
     * This loader is recommended one for release version of your app. In that case local JS
     * executor should be used. JS bundle will be read from assets in native code to save on passing
     * large strings from java to native memory.
     */
    @JvmStatic
    public fun createAssetLoader(
        context: Context,
        assetUrl: String,
        loadSynchronously: Boolean,
    ): JSBundleLoader =
        object : JSBundleLoader() {
          override fun loadScript(delegate: JSBundleLoaderDelegate): String {
            delegate.loadScriptFromAssets(context.assets, assetUrl, loadSynchronously)
            return assetUrl
          }
        }

    /**
     * This loader loads bundle from file system. The bundle will be read in native code to save on
     * passing large strings from java to native memory.
     */
    @JvmStatic
    public fun createFileLoader(fileName: String): JSBundleLoader =
        createFileLoader(fileName, fileName, false)

    @JvmStatic
    public fun createFileLoader(
        fileName: String,
        assetUrl: String,
        loadSynchronously: Boolean,
    ): JSBundleLoader =
        object : JSBundleLoader() {
          override fun loadScript(delegate: JSBundleLoaderDelegate): String {
            delegate.loadScriptFromFile(fileName, assetUrl, loadSynchronously)
            return fileName
          }
        }

    /**
     * This loader is used when bundle gets reloaded from dev server. In that case loader expect JS
     * bundle to be prefetched and stored in local file. We do that to avoid passing large strings
     * between java and native code and avoid allocating memory in java to fit whole JS bundle in
     * it. Providing correct [sourceURL] of downloaded bundle is required for JS stacktraces to work
     * correctly and allows for source maps to correctly symbolize those. [revisionId] is the dev
     * server's label for the revision it built the bundle from (`X-Metro-Delta-ID`), null when it
     * sent none; the loader exposes it as [JSBundleLoader.revisionId].
     */
    @JvmStatic
    @JvmOverloads
    public fun createCachedBundleFromNetworkLoader(
        sourceURL: String,
        cachedFileLocation: String,
        revisionId: String? = null,
    ): JSBundleLoader =
        object : JSBundleLoader() {
          override val revisionId: String? = revisionId

          override fun loadScript(delegate: JSBundleLoaderDelegate): String {
            return try {
              delegate.loadScriptFromFile(cachedFileLocation, sourceURL, false)
              sourceURL
            } catch (e: Exception) {
              throw DebugServerException.makeGeneric(sourceURL, e.message.orEmpty(), e)
            }
          }
        }
  }
}
