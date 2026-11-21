/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import android.content.Context
import android.webkit.CookieManager
import androidx.annotation.VisibleForTesting
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactContext
import java.io.File
import java.io.IOException
import java.net.CookieHandler
import java.net.URI

/**
 * Cookie handler that forwards all cookies to the WebView CookieManager.
 *
 * This class relies on CookieManager to persist cookies to disk so cookies may be lost if the
 * application is terminated before it syncs.
 *
 * Obtaining the CookieManager starts the WebView provider (Chromium) in this process, which costs
 * about 100 ms of CPU, several threads and tens of MB of memory. When a [Context] is given, the
 * handler skips that as long as the WebView has never stored anything in this app (its data
 * directory does not exist): there are no cookies to read, so requests are sent without any. The
 * provider is started as soon as a response sets a cookie, or once the app has used a WebView.
 */
public class ForwardingCookieHandler
@JvmOverloads
public constructor(private val context: Context? = null) : CookieHandler() {

  @Deprecated(
      "Pass the application Context",
      ReplaceWith("ForwardingCookieHandler(reactContext.applicationContext)"),
  )
  public constructor(reactContext: ReactContext) : this(reactContext as Context)

  @Throws(IOException::class)
  override fun get(uri: URI, headers: Map<String, List<String>>): Map<String, List<String>> {
    if (!hasWebViewStorage()) {
      return emptyMap()
    }

    val cookies = cookieManager?.getCookie(uri.toString())
    if (cookies.isNullOrEmpty()) {
      return emptyMap()
    }

    return mapOf(COOKIE_HEADER to listOf(cookies))
  }

  @Throws(IOException::class)
  override fun put(uri: URI, headers: Map<String, List<String>>) {
    val url = uri.toString()
    for ((key, value) in headers) {
      if (isCookieHeader(key)) {
        addCookies(url, value)
      }
    }
  }

  public fun clearCookies(callback: Callback) {
    cookieManager?.removeAllCookies { value -> callback.invoke(value) }
  }

  public fun destroy(): Unit = Unit

  public fun addCookies(url: String, cookies: List<String>) {
    if (cookies.isEmpty()) {
      return
    }
    for (cookie in cookies) {
      addCookieAsync(url, cookie)
    }
    cookieManager?.flush()
  }

  private fun addCookieAsync(url: String, cookie: String) {
    cookieManager?.setCookie(url, cookie, null)
  }

  /**
   * Whether the WebView may hold cookies for this app. The WebView keeps its state, including the
   * cookie store, in `app_webview*` directories under the app's data directory, created the first
   * time the provider is started in this app. Without a context (or a readable data directory) the
   * answer is unknown and the CookieManager is used as before.
   */
  private fun hasWebViewStorage(): Boolean {
    if (webViewStorageExists) {
      return true
    }
    val dataDir = context?.applicationInfo?.dataDir ?: return true
    val entries = File(dataDir).list() ?: return true
    val exists = entries.any { it.startsWith(WEBVIEW_DATA_DIR_PREFIX) }
    if (exists) {
      webViewStorageExists = true
    }
    return exists
  }

  private var cookieManager: CookieManager? = null
    /**
     * Instantiating CookieManager will load the Chromium task taking a 100ish ms so we do it lazily
     * to make sure it's done on a background thread as needed.
     */
    get() {
      if (field == null) {
        try {
          field = CookieManager.getInstance()
          // The provider is up and will persist whatever is stored from now on.
          webViewStorageExists = true
        } catch (ex: IllegalArgumentException) {
          // https://bugs.chromium.org/p/chromium/issues/detail?id=559720
          return null
        } catch (exception: Exception) {
          // Ideally we would like to catch a `MissingWebViewPackageException` here.
          // That API is private so we can't access it.
          // Historically we used string matching on the error message to understand
          // if the exception was a Missing Webview One.
          // OEMs have been customizing that message making really hard to catch it.
          // Therefore we result to returning null as a default instead of rethrowing
          // the exception as it will result in a app crash at runtime.
          // a) We will return null for all the other unhandled conditions when a webview provider
          // is
          // not found.
          // b) We already have null checks in place for `getCookieManager()` calls.
          // c) We have annotated the method as @Nullable to notify future devs about our return
          // type.
          return null
        }
      }

      return field
    }

  internal companion object {
    private const val VERSION_ZERO_HEADER = "Set-cookie"
    private const val VERSION_ONE_HEADER = "Set-cookie2"
    private const val COOKIE_HEADER = "Cookie"

    /** `Context.getDir("webview", …)` as used by the WebView provider, optionally with a suffix. */
    private const val WEBVIEW_DATA_DIR_PREFIX = "app_webview"

    /** Process-wide: once any handler has seen the provider or its storage, all of them use it. */
    @Volatile private var webViewStorageExists = false

    @VisibleForTesting
    @JvmStatic
    internal fun resetWebViewStorageStateForTesting() {
      webViewStorageExists = false
    }

    private fun isCookieHeader(name: String): Boolean =
        name.equals(VERSION_ZERO_HEADER, ignoreCase = true) ||
            name.equals(VERSION_ONE_HEADER, ignoreCase = true)
  }
}
