/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Conflicting okhttp versions + This class needs to be rewritten to don't
// use AsyncTasks
@file:Suppress("DEPRECATION", "DEPRECATION_ERROR")

package com.facebook.react.devsupport

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.os.AsyncTask
import android.provider.Settings.Secure
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.ReactConstants
import com.facebook.react.devsupport.InspectorFlags.getFuseboxEnabled
import com.facebook.react.devsupport.InspectorFlags.getIsProfilingBuild
import com.facebook.react.devsupport.inspector.DevSupportHttpClient
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers.getFriendlyDeviceName
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers.getInspectorHostMetadata
import com.facebook.react.packagerconnection.FileIoHandler
import com.facebook.react.packagerconnection.JSPackagerClient
import com.facebook.react.packagerconnection.NotificationOnlyHandler
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import com.facebook.react.packagerconnection.ReconnectingWebSocket
import com.facebook.react.packagerconnection.RequestHandler
import com.facebook.react.util.RNLog
import java.io.File
import java.io.IOException
import java.io.UnsupportedEncodingException
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.util.Locale
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okio.Okio

/**
 * Helper class for all things about the debug server running in the engineer's host machine.
 *
 * One can use 'debug_http_host' shared preferences key to provide a host name for the debug server.
 * If the setting is empty we support and detect two basic configuration that works well for android
 * emulators connection to debug server running on emulator's host:
 * - Android stock emulator with standard non-configurable local loopback alias: 10.0.2.2
 * - Genymotion emulator with default settings: 10.0.3.2
 */
@SuppressLint(
    "StaticFieldLeak"
) // TODO: This entire class should be rewritten to don't use AsyncTask
public open class DevServerHelper(
    private val settings: DeveloperSettings,
    private val applicationContext: Context,
    private val packagerConnectionSettings: PackagerConnectionSettings,
) {
  public interface PackagerCommandListener {
    public fun onPackagerConnected()

    public fun onPackagerDisconnected()

    public fun onPackagerReloadCommand()

    public fun onPackagerDevMenuCommand()

    // Allow apps to provide listeners for custom packager commands.
    public fun customCommandHandlers(): Map<String, RequestHandler>?
  }

  private enum class BundleType(val typeID: String) {
    BUNDLE("bundle"),
    MAP("map"),
  }

  private val client: OkHttpClient = DevSupportHttpClient.httpClient
  private val bundleDownloader: BundleDownloader = BundleDownloader(client)
  private val packagerStatusCheck: PackagerStatusCheck = PackagerStatusCheck(client)
  private val packageName: String = applicationContext.packageName

  private var packagerClient: JSPackagerClient? = null
  private var inspectorPackagerConnection: IInspectorPackagerConnection? = null

  /** Returns an opaque ID which is stable for the current combination of device and app, stable */
  private val inspectorDeviceId: String
    get() {
      // Every Android app has a unique application ID that looks like a Java or Kotlin package
      // name,
      // such as com.example.myapp. This ID uniquely identifies your app on the device and in the
      // Google Play Store. [Source: Android docs]
      val packageName = packageName

      // A 64-bit number expressed as a hexadecimal string, which is either:
      // * unique to each combination of app-signing key, user, and device (API level >= 26), or
      // * randomly generated when the user first sets up the device and should remain constant for
      // the lifetime of the user's device (API level < 26).
      // [Source: Android docs]
      val androidId = Secure.getString(applicationContext.contentResolver, Secure.ANDROID_ID)
      val rawDeviceId =
          String.format(
              Locale.US,
              "android-%s-%s-%s",
              packageName,
              androidId,
              if (getFuseboxEnabled()) "fusebox" else "legacy",
          )
      return getSHA256(rawDeviceId)
    }

  private val inspectorDeviceUrl: String
    get() =
        String.format(
            Locale.US,
            "%s://%s/inspector/device?name=%s&app=%s&device=%s&profiling=%b",
            DevSupportHttpClient.httpScheme(packagerConnectionSettings.debugServerHost),
            packagerConnectionSettings.debugServerHost,
            Uri.encode(getFriendlyDeviceName()),
            Uri.encode(packageName),
            Uri.encode(inspectorDeviceId),
            getIsProfilingBuild(),
        )

  /** Whether we should enable dev mode when requesting JS bundles. */
  private val devMode: Boolean
    get() = settings.isJSDevModeEnabled

  /** Whether we should request minified JS bundles. */
  private val jSMinifyMode: Boolean
    get() = settings.isJSMinifyEnabled

  public fun openPackagerConnection(clientId: String?, commandListener: PackagerCommandListener) {
    if (packagerClient != null) {
      FLog.w(ReactConstants.TAG, "Packager connection already open, nooping.")
      return
    }
    object : AsyncTask<Void, Void, Void>() {
          @Deprecated("This needs to be rewritten to not use AsyncTasks")
          override fun doInBackground(vararg backgroundParams: Void): Void? {
            val handlers: MutableMap<String, RequestHandler> = mutableMapOf()
            handlers["reload"] =
                object : NotificationOnlyHandler() {
                  override fun onNotification(params: Any?) {
                    commandListener.onPackagerReloadCommand()
                  }
                }
            handlers["devMenu"] =
                object : NotificationOnlyHandler() {
                  override fun onNotification(params: Any?) {
                    commandListener.onPackagerDevMenuCommand()
                  }
                }
            commandListener.customCommandHandlers()?.let { handlers.putAll(it) }
            handlers.putAll(FileIoHandler().handlers())

            val onPackagerConnectedCallback: ReconnectingWebSocket.ConnectionCallback =
                object : ReconnectingWebSocket.ConnectionCallback {
                  override fun onConnected() {
                    commandListener.onPackagerConnected()
                  }

                  override fun onDisconnected() {
                    commandListener.onPackagerDisconnected()
                  }
                }

            checkNotNull(clientId)
            packagerClient =
                JSPackagerClient(
                        clientId,
                        packagerConnectionSettings,
                        handlers,
                        onPackagerConnectedCallback,
                    )
                    .apply { init() }

            return null
          }
        }
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  public fun closePackagerConnection() {
    object : AsyncTask<Void, Void, Void>() {
          @Deprecated("This class needs to be rewritten to don't use AsyncTasks")
          override fun doInBackground(vararg params: Void): Void? {
            packagerClient?.close()
            packagerClient = null
            return null
          }
        }
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  public fun openInspectorConnection() {
    if (inspectorPackagerConnection != null) {
      FLog.w(ReactConstants.TAG, "Inspector connection already open, nooping.")
      return
    }
    object : AsyncTask<Void, Void, Void>() {
          @Deprecated("This class needs to be rewritten to don't use AsyncTasks")
          override fun doInBackground(vararg params: Void): Void? {
            val metadata = getInspectorHostMetadata(applicationContext)
            val deviceName = metadata["deviceName"]
            if (deviceName == null) {
              FLog.w(ReactConstants.TAG, "Could not get device name from Inspector Host Metadata.")
              return null
            }
            inspectorPackagerConnection =
                CxxInspectorPackagerConnection(
                        this@DevServerHelper.inspectorDeviceUrl,
                        deviceName,
                        packageName,
                    )
                    .apply { connect() }
            return null
          }
        }
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  public fun disableDebugger() {
    inspectorPackagerConnection?.sendEventToAllConnections(DEBUGGER_MSG_DISABLE)
  }

  public fun closeInspectorConnection() {
    object : AsyncTask<Void, Void, Void>() {
          @Deprecated("This class needs to be rewritten to don't use AsyncTasks")
          override fun doInBackground(vararg params: Void): Void? {
            inspectorPackagerConnection?.closeQuietly()
            inspectorPackagerConnection = null
            return null
          }
        }
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
  }

  @JvmOverloads
  public fun downloadBundleFromURL(
      callback: DevBundleDownloadListener,
      outputFile: File,
      bundleURL: String?,
      bundleInfo: BundleDownloader.BundleInfo?,
      requestBuilder: Request.Builder = Request.Builder(),
  ) {
    bundleDownloader.downloadBundleFromURL(
        callback,
        outputFile,
        bundleURL,
        bundleInfo,
        requestBuilder,
    )
  }

  private fun createSplitBundleURL(mainModuleID: String, host: String): String =
      createBundleURL(mainModuleID, BundleType.BUNDLE, host, true, false)

  private fun createBundleURL(
      mainModuleID: String,
      type: BundleType,
      host: String = packagerConnectionSettings.debugServerHost,
      modulesOnly: Boolean = false,
      runModule: Boolean = true,
  ): String {
    val dev = devMode
    val additionalOptionsBuilder = StringBuilder()
    val packagerOptions =
        packagerConnectionSettings.updatePackagerOptions(
            packagerConnectionSettings.additionalOptionsForPackager
        )
    for ((key, value) in packagerOptions) {
      if (value.isEmpty()) {
        continue
      }
      additionalOptionsBuilder.append("&" + key + "=" + Uri.encode(value))
    }
    return (String.format(
        Locale.US,
        "%s://%s/%s.%s?platform=android&dev=%s&lazy=%s&minify=%s&app=%s&modulesOnly=%s&runModule=%s",
        DevSupportHttpClient.httpScheme(host),
        host,
        mainModuleID,
        type.typeID,
        dev, // dev
        dev, // lazy
        jSMinifyMode,
        packageName,
        if (modulesOnly) "true" else "false",
        if (runModule) "true" else "false",
    ) +
        (if (getFuseboxEnabled()) "&excludeSource=true&sourcePaths=url-server" else "") +
        additionalOptionsBuilder.toString())
  }

  public open fun getDevServerBundleURL(jsModulePath: String): String =
      createBundleURL(jsModulePath, BundleType.BUNDLE, packagerConnectionSettings.debugServerHost)

  public open fun getDevServerSplitBundleURL(jsModulePath: String): String =
      createSplitBundleURL(jsModulePath, packagerConnectionSettings.debugServerHost)

  public open fun isPackagerRunning(callback: PackagerStatusCallback) {
    packagerStatusCheck.run(packagerConnectionSettings.debugServerHost, callback)
  }

  public open fun getSourceMapUrl(mainModuleName: String): String =
      createBundleURL(mainModuleName, BundleType.MAP)

  public open fun getSourceUrl(mainModuleName: String): String =
      createBundleURL(mainModuleName, BundleType.BUNDLE)

  /**
   * This is a debug-only utility to allow fetching a file via packager. It's made synchronous for
   * simplicity, but should only be used if it's absolutely necessary.
   *
   * @return the file with the fetched content, or null if there's any failure.
   */
  public fun downloadBundleResourceFromUrlSync(resourcePath: String, outputFile: File): File? {
    val resourceURL = createResourceURL(packagerConnectionSettings.debugServerHost, resourcePath)
    val request = Request.Builder().url(resourceURL).build()

    try {
      client.newCall(request).execute().use { response ->
        if (!response.isSuccessful || response.body() == null) {
          return null
        }
        Okio.sink(outputFile).use { output ->
          Okio.buffer(response.body()?.source()!!).readAll(output)
        }
        return outputFile
      }
    } catch (e: Exception) {
      FLog.e(
          ReactConstants.TAG,
          "Failed to fetch resource synchronously - resourcePath: \"%s\", outputFile: \"%s\"",
          resourcePath,
          outputFile.absolutePath,
          e,
      )
      return null
    }
  }

  /** Attempt to open the JS debugger on the host machine (on-device CDP debugging). */
  public fun openDebugger(
      context: ReactContext?,
      errorMessage: String?,
      panel: String?,
  ) {
    // TODO(huntie): Requests to dev server should not assume 'http' URL scheme
    val requestUrlBuilder = StringBuilder()

    requestUrlBuilder.append(
        String.format(
            Locale.US,
            "%s://%s/open-debugger?device=%s",
            DevSupportHttpClient.httpScheme(packagerConnectionSettings.debugServerHost),
            packagerConnectionSettings.debugServerHost,
            Uri.encode(inspectorDeviceId),
        )
    )

    if (panel != null) {
      requestUrlBuilder.append("&panel=" + Uri.encode(panel))
    }

    val request =
        Request.Builder()
            .url(requestUrlBuilder.toString())
            .method("POST", RequestBody.create(null, ""))
            .build()

    client
        .newCall(request)
        .enqueue(
            object : Callback {
              override fun onFailure(call: Call, e: IOException) {
                RNLog.w(context, errorMessage ?: "openDebugger error")
              }

              override fun onResponse(call: Call, response: Response) = Unit
            }
        )
  }

  private companion object {
    private const val DEBUGGER_MSG_DISABLE = "{ \"id\":1,\"method\":\"Debugger.disable\" }"

    private fun getSHA256(string: String): String {
      val digest =
          try {
            MessageDigest.getInstance("SHA-256")
          } catch (e: NoSuchAlgorithmException) {
            throw AssertionError("Could not get standard SHA-256 algorithm", e)
          }
      digest.reset()
      val result =
          try {
            digest.digest(string.toByteArray(charset("UTF-8")))
          } catch (e: UnsupportedEncodingException) {
            throw AssertionError("This environment doesn't support UTF-8 encoding", e)
          }
      return String.format(
          "%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x",
          result[0],
          result[1],
          result[2],
          result[3],
          result[4],
          result[5],
          result[6],
          result[7],
          result[8],
          result[9],
          result[10],
          result[11],
          result[12],
          result[13],
          result[14],
          result[15],
          result[16],
          result[17],
          result[18],
          result[19],
      )
    }

    private fun createResourceURL(host: String, resourcePathParam: String): String {
      // This is what we get for not using a proper URI library.
      var resourcePath = resourcePathParam
      if (resourcePath.startsWith("/")) {
        FLog.w(ReactConstants.TAG, "Resource path should not begin with `/`, removing it.")
        resourcePath = resourcePath.substring(1)
      }
      return String.format(
          Locale.US,
          "%s://%s/%s",
          DevSupportHttpClient.httpScheme(host),
          host,
          resourcePath,
      )
    }
  }
}
