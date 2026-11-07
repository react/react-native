/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import android.net.Uri
import com.facebook.common.logging.FLog
import org.json.JSONException
import org.json.JSONObject

/**
 * Tracks errors connecting to or received from the debug server. The debug server returns errors as
 * json objects. This exception represents that error.
 */
internal class DebugServerException : RuntimeException {

  val originalMessage: String

  private constructor(
      description: String,
      fileName: String,
      lineNumber: Int,
      column: Int,
  ) : super("$description\n  at $fileName:$lineNumber:$column") {
    originalMessage = description
  }

  constructor(description: String) : super(description) {
    originalMessage = description
  }

  constructor(
      detailMessage: String,
      throwable: Throwable?,
  ) : super(detailMessage, throwable) {
    originalMessage = detailMessage
  }

  companion object {
    private val GENERIC_ERROR_MESSAGE =
        """
        |
        |
        |Try the following to fix the issue:
        |\u2022 Ensure that Metro is running
        |\u2022 Ensure that your device/emulator is connected to your machine and has USB debugging enabled - run 'adb devices' to see a list of connected devices
        |\u2022 Ensure Airplane Mode is disabled
        |\u2022 If you're on a physical device connected to the same machine, run 'adb reverse tcp:<PORT> tcp:<PORT> to forward requests from your device
        |\u2022 If your device is on the same Wi-Fi network, set 'Debug server host & port for device' in 'Dev settings' to your machine's IP address and the port of the local dev server - e.g. 10.0.1.1:<PORT>
        |
        |"""
            .trimMargin()

    @JvmStatic
    fun makeGeneric(url: String, reason: String, t: Throwable?): DebugServerException =
        makeGeneric(url, reason, "", t)

    @JvmStatic
    fun makeGeneric(
        url: String,
        reason: String,
        extra: String,
        t: Throwable?,
    ): DebugServerException {
      val uri = Uri.parse(url)
      val message = GENERIC_ERROR_MESSAGE.replace("<PORT>", "${uri.port}")
      return DebugServerException(reason + message + extra, t)
    }

    /**
     * Parse a DebugServerException from the server json string.
     *
     * @param str json string returned by the debug server
     * @return A DebugServerException or null if the string is not of proper form.
     */
    @JvmStatic
    @Suppress("UNUSED_PARAMETER")
    fun parse(url: String?, str: String?): DebugServerException? {
      if (str.isNullOrEmpty()) {
        return null
      }
      try {
        val jsonObject = JSONObject(str)
        val message = jsonObject.getString("message")
        if (
            !jsonObject.has("filename") ||
                !jsonObject.has("lineNumber") ||
                !jsonObject.has("column")
        ) {
          return DebugServerException(message)
        }
        val fullFileName = jsonObject.getString("filename")
        return DebugServerException(
            message,
            shortenFileName(fullFileName),
            jsonObject.getInt("lineNumber"),
            jsonObject.getInt("column"),
        )
      } catch (e: JSONException) {
        FLog.w(ReactConstants.TAG, "Could not parse DebugServerException from: $str", e)
        return null
      }
    }

    private fun shortenFileName(fullFileName: String): String {
      val parts = fullFileName.split("/".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
      return parts.last()
    }
  }
}
