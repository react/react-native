/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.devsupport.interfaces.StackFrame
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler.ProcessedError
import java.io.File
import java.util.regex.Pattern
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

/** Helper class converting JS and Java stack traces into arrays of [StackFrame] objects. */
@OptIn(UnstableReactNativeAPI::class)
public object StackTraceHelper {

  public const val COLUMN_KEY: String = "column"
  public const val LINE_NUMBER_KEY: String = "lineNumber"
  public const val FILE_KEY: String = "file"
  public const val METHOD_NAME_KEY: String = "methodName"
  public const val COLLAPSE_KEY: String = "collapse"

  public const val MESSAGE_KEY: String = "message"
  public const val ORIGINAL_MESSAGE_KEY: String = "originalMessage"
  public const val NAME_KEY: String = "name"
  public const val COMPONENT_STACK_KEY: String = "componentStack"
  public const val STACK_KEY: String = "stack"
  public const val ID_KEY: String = "id"
  public const val IS_FATAL_KEY: String = "isFatal"
  public const val EXTRA_DATA_KEY: String = "extraData"

  private val STACK_FRAME_PATTERN1: Pattern =
      Pattern.compile("^(?:(.*?)@)?(.*?)\\:([0-9]+)\\:([0-9]+)$")
  private val STACK_FRAME_PATTERN2: Pattern =
      Pattern.compile("\\s*(?:at)\\s*(.+?)\\s*[@(](.*):([0-9]+):([0-9]+)[)]$")

  /** Convert a JavaScript stack trace (see `parseErrorStack` JS module) to an array of [ ]s. */
  @JvmStatic
  public fun convertJsStackTrace(stack: ReadableArray?): Array<StackFrame> {
    val size = stack?.size() ?: 0
    if (stack == null) {
      return arrayOf()
    }
    return Array(size) { i ->
      val type = stack.getType(i)
      if (type == ReadableType.Map) {
        val frame = requireNotNull(stack.getMap(i))
        val method = requireNotNull(frame.getString(METHOD_NAME_KEY))
        val file = requireNotNull(frame.getString(FILE_KEY))
        val collapse =
            frame.hasKey(COLLAPSE_KEY) &&
                !frame.isNull(COLLAPSE_KEY) &&
                frame.getBoolean(COLLAPSE_KEY)
        var lineNumber = -1
        if (frame.hasKey(LINE_NUMBER_KEY) && !frame.isNull(LINE_NUMBER_KEY)) {
          lineNumber = frame.getInt(LINE_NUMBER_KEY)
        }
        var columnNumber = -1
        if (frame.hasKey(COLUMN_KEY) && !frame.isNull(COLUMN_KEY)) {
          columnNumber = frame.getInt(COLUMN_KEY)
        }
        StackFrameImpl(
            file = file,
            method = method,
            line = lineNumber,
            column = columnNumber,
            isCollapsed = collapse,
        )
      } else if (type == ReadableType.String) {
        StackFrameImpl(
            file = null,
            method = checkNotNull(stack.getString(i)),
            line = -1,
            column = -1,
        )
      } else {
        error("Cannot parse the stackframe for $stack")
      }
    }
  }

  /**
   * Convert a JavaScript stack trace (see `parseErrorStack` JS module) to an array of [StackFrame].
   */
  public fun convertJsStackTrace(stack: JSONArray?): Array<StackFrame> {
    if (stack == null) {
      return arrayOf()
    }
    val size = stack.length()
    try {
      return Array(size) { i ->
        val frame = stack.getJSONObject(i)
        val method = frame.getString(METHOD_NAME_KEY)
        val file = frame.getString(FILE_KEY)
        var lineNumber = -1
        if (frame.has(LINE_NUMBER_KEY) && !frame.isNull(LINE_NUMBER_KEY)) {
          lineNumber = frame.getInt(LINE_NUMBER_KEY)
        }
        var columnNumber = -1
        if (frame.has(COLUMN_KEY) && !frame.isNull(COLUMN_KEY)) {
          columnNumber = frame.getInt(COLUMN_KEY)
        }
        val collapse =
            frame.has(COLLAPSE_KEY) && !frame.isNull(COLLAPSE_KEY) && frame.getBoolean(COLLAPSE_KEY)
        StackFrameImpl(
            file = file,
            method = method,
            line = lineNumber,
            column = columnNumber,
            isCollapsed = collapse,
        )
      }
    } catch (exception: JSONException) {
      throw RuntimeException(exception)
    }
  }

  /** Convert a JavaScript stack trace to an array of [StackFrame]s. */
  public fun convertJsStackTrace(stack: String): Array<StackFrame> {
    val stackTrace = stack.split("\n".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
    return Array(stackTrace.size) { i ->
      val matcher1 = STACK_FRAME_PATTERN1.matcher(stackTrace[i])
      val matcher2 = STACK_FRAME_PATTERN2.matcher(stackTrace[i])
      val matcher =
          when {
            matcher2.find() -> matcher2
            matcher1.find() -> matcher1
            else -> null
          }
      if (matcher != null) {
        val file = matcher.group(2)
        val method = matcher.group(1) ?: "(unknown)"
        val lineString = matcher.group(3)
        val columnString = matcher.group(4)
        StackFrameImpl(
            file = file,
            method = method,
            line = checkNotNull(lineString).toInt(),
            column = checkNotNull(columnString).toInt(),
        )
      } else {
        StackFrameImpl(file = null, method = stackTrace[i], line = -1, column = -1)
      }
    }
  }

  /** Convert a [Throwable] to an array of [StackFrame]s. */
  @JvmStatic
  public fun convertJavaStackTrace(exception: Throwable): Array<StackFrame> {
    val stackTrace = exception.stackTrace
    return Array(stackTrace.size) { i ->
      StackFrameImpl(
          file = stackTrace[i].className,
          fileName = stackTrace[i].fileName,
          method = stackTrace[i].methodName,
          line = stackTrace[i].lineNumber,
          column = -1,
      )
    }
  }

  /** Format a [StackFrame] to a String (method name is not included). */
  public fun formatFrameSource(frame: StackFrame): String {
    val lineInfo = StringBuilder()
    lineInfo.append(frame.fileName)
    val line = frame.line
    if (line > 0) {
      lineInfo.append(":").append(line)
      val column = frame.column
      if (column > 0) {
        lineInfo.append(":").append(column)
      }
    }
    return lineInfo.toString()
  }

  /** Format an array of [StackFrame]s with the error title to a String. */
  @JvmStatic
  public fun formatStackTrace(title: String?, stack: Array<StackFrame>): String {
    val stackTrace = StringBuilder()
    stackTrace.append(title).append("\n")
    for (frame in stack) {
      stackTrace
          .append(frame.method)
          .append("\n")
          .append("    ")
          .append(formatFrameSource(frame))
          .append("\n")
    }
    return stackTrace.toString()
  }

  @JvmStatic
  internal fun convertProcessedError(error: ProcessedError): JavaOnlyMap {
    val stack = JavaOnlyArray()
    for (frame in error.stack) {
      stack.pushMap(
          JavaOnlyMap().apply {
            frame.column?.let { putDouble(COLUMN_KEY, it.toDouble()) }
            frame.lineNumber?.let { putDouble(LINE_NUMBER_KEY, it.toDouble()) }
            putString(FILE_KEY, frame.file)
            putString(METHOD_NAME_KEY, frame.methodName)
          }
      )
    }

    return JavaOnlyMap().apply {
      putString(MESSAGE_KEY, error.message)
      error.originalMessage?.let { putString(ORIGINAL_MESSAGE_KEY, it) }
      error.name?.let { putString(NAME_KEY, it) }
      error.componentStack?.let { putString(COMPONENT_STACK_KEY, it) }
      putArray(STACK_KEY, stack)
      putInt(ID_KEY, error.id)
      putBoolean(IS_FATAL_KEY, error.isFatal)
      putMap(EXTRA_DATA_KEY, error.extraData)
    }
  }

  /**
   * Represents a generic entry in a stack trace, be it originally from JS or Java.
   *
   * @property file the file this stack frame points to. JS traces return the full path to the file
   *   here, while Java traces only return the file name (the path is not known).
   * @property fileName the name of the file this frame points to. For JS traces this is different
   *   from [getFile] in that it only returns the file name, not the full path. For Java traces
   *   there is no difference.
   * @property method the name of the method this frame points to.
   * @property line the line number this frame points to in the file returned by [file]
   * @property column the column this frame points to in the file returned by [file]
   */
  public class StackFrameImpl(
      public override val file: String?,
      public override val fileName: String? = file?.let { File(it).name },
      public override val method: String,
      public override val line: Int,
      public override val column: Int,
      public override val isCollapsed: Boolean = false,
  ) : StackFrame {

    /** Convert the stack frame to a JSON representation. */
    override fun toJSON(): JSONObject = JSONObject(
        mapOf(
            FILE_KEY to (file.orEmpty()),
            METHOD_NAME_KEY to method,
            LINE_NUMBER_KEY to line,
            COLUMN_KEY to column,
            COLLAPSE_KEY to isCollapsed,
        )
    )
  }
}
