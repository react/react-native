/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress(
    "DEPRECATION_ERROR", // Conflicting okhttp versions
    "DEPRECATION", // Need to migrate away from AsyncTasks
)

package com.facebook.react.devsupport

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.net.Uri
import android.os.AsyncTask
import android.text.SpannedString
import android.text.method.LinkMovementMethod
import android.util.Pair
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.BaseAdapter
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.ProgressBar
import android.widget.TextView
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.common.ReactConstants
import com.facebook.react.devsupport.inspector.DevSupportHttpClient
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.ErrorType
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.devsupport.interfaces.StackFrame
import okhttp3.MediaType
import okhttp3.Request
import okhttp3.RequestBody
import org.json.JSONObject

/** Dialog for displaying JS errors in an eye-catching form (red box). */
@SuppressLint("ViewConstructor")
internal class RedBoxContentView(
    context: Context?,
    private val devSupportManager: DevSupportManager,
    private val redBoxHandler: RedBoxHandler?,
) : LinearLayout(context), AdapterView.OnItemClickListener {

  private lateinit var stackView: ListView
  private lateinit var reportButton: Button
  private lateinit var reportTextView: TextView
  private lateinit var loadingIndicator: ProgressBar
  private lateinit var lineSeparator: View

  private var isReporting = false

  private val reportCompletedListener: RedBoxHandler.ReportCompletedListener =
      object : RedBoxHandler.ReportCompletedListener {
        override fun onReportSuccess(spannedString: SpannedString?) {
          isReporting = false
          reportButton.isEnabled = true
          loadingIndicator.visibility = View.GONE
          reportTextView.text = spannedString
        }

        override fun onReportError(spannedString: SpannedString?) {
          isReporting = false
          reportButton.isEnabled = true
          loadingIndicator.visibility = View.GONE
          reportTextView.text = spannedString
        }
      }

  private val reportButtonOnClickListener = OnClickListener { view ->
    if (redBoxHandler?.isReportEnabled() != true || isReporting) {
      return@OnClickListener
    }
    isReporting = true
    reportTextView.text = "Reporting..."
    reportTextView.visibility = View.VISIBLE
    loadingIndicator.visibility = View.VISIBLE
    lineSeparator.visibility = View.VISIBLE
    reportButton.isEnabled = false

    val title = checkNotNull(devSupportManager.lastErrorTitle)
    val stack = checkNotNull(devSupportManager.lastErrorStack)
    val sourceUrl = checkNotNull(devSupportManager.sourceUrl)
    redBoxHandler.reportRedbox(view.context, title, stack, sourceUrl, reportCompletedListener)
  }

  private class StackAdapter(private val title: String, private val stack: Array<StackFrame>) :
      BaseAdapter() {
    private class FrameViewHolder(v: View) {
      val methodView: TextView = v.findViewById(R.id.rn_frame_method)
      val fileView: TextView = v.findViewById(R.id.rn_frame_file)
    }

    override fun areAllItemsEnabled(): Boolean = false

    override fun isEnabled(position: Int): Boolean = position > 0

    override fun getCount(): Int = stack.size + 1

    override fun getItem(position: Int): Any = if (position == 0) title else stack[position - 1]

    override fun getItemId(position: Int): Long = position.toLong()

    override fun getViewTypeCount(): Int = VIEW_TYPE_COUNT

    override fun getItemViewType(position: Int): Int =
        if (position == 0) VIEW_TYPE_TITLE else VIEW_TYPE_STACKFRAME

    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
      if (position == 0) {
        val titleView =
            if (convertView != null) {
              convertView as TextView
            } else {
              (LayoutInflater.from(parent.context)
                  .inflate(R.layout.redbox_item_title, parent, false) as TextView)
            }
        // Remove ANSI color codes from the title
        titleView.text = title.replace("\\x1b\\[[0-9;]*m".toRegex(), "")
        return titleView
      } else {
        val frameView =
            convertView
                ?: LayoutInflater.from(parent.context)
                    .inflate(R.layout.redbox_item_frame, parent, false)
                    .apply { tag = FrameViewHolder(this@apply) }
        val frame = stack[position - 1]
        val holder = frameView?.tag as FrameViewHolder
        holder.methodView.text = frame.method
        holder.fileView.text = StackTraceHelper.formatFrameSource(frame)
        holder.methodView.setTextColor(if (frame.isCollapsed) 0xFFAAAAAA.toInt() else Color.WHITE)
        holder.fileView.setTextColor(
            if (frame.isCollapsed) 0xFF808080.toInt() else 0xFFB3B3B3.toInt()
        )
        return frameView
      }
    }

    companion object {
      private const val VIEW_TYPE_COUNT = 2
      private const val VIEW_TYPE_TITLE = 0
      private const val VIEW_TYPE_STACKFRAME = 1
    }
  }

  private class OpenStackFrameTask(private val devSupportManager: DevSupportManager) :
      AsyncTask<StackFrame?, Void?, Void?>() {

    @Deprecated("Deprecated in Java")
    override fun doInBackground(vararg stackFrames: StackFrame?): Void? {
      try {
        val openStackFrameUrl: String =
            Uri.parse(devSupportManager.sourceUrl)
                .buildUpon()
                .path("/open-stack-frame")
                .query(null)
                .build()
                .toString()
        val client = DevSupportHttpClient.httpClient
        for (frame in stackFrames) {
          val payload = stackFrameToJson(checkNotNull(frame)).toString()
          val body: RequestBody = RequestBody.create(JSON, payload)
          val request: Request = Request.Builder().url(openStackFrameUrl).post(body).build()
          client.newCall(request).execute()
        }
      } catch (e: Exception) {
        FLog.e(ReactConstants.TAG, "Could not open stack frame", e)
      }
      return null
    }

    companion object {
      private val JSON: MediaType? = MediaType.parse("application/json; charset=utf-8")

      private fun stackFrameToJson(frame: StackFrame) =
          JSONObject(
              mapOf(
                  "file" to frame.file,
                  "methodName" to frame.method,
                  "lineNumber" to frame.line,
                  "column" to frame.column,
              )
          )
    }
  }

  fun init() {
    LayoutInflater.from(context).inflate(R.layout.redbox_view, this)

    stackView =
        findViewById<ListView>(R.id.rn_redbox_stack).apply {
          onItemClickListener = this@RedBoxContentView
        }

    findViewById<Button>(R.id.rn_redbox_reload_button).setOnClickListener {
      devSupportManager.handleReloadJS()
    }
    findViewById<Button>(R.id.rn_redbox_dismiss_button).setOnClickListener {
      devSupportManager.hideRedboxDialog()
    }

    if (redBoxHandler?.isReportEnabled() == true) {
      loadingIndicator = findViewById(R.id.rn_redbox_loading_indicator)
      lineSeparator = findViewById(R.id.rn_redbox_line_separator)
      reportTextView =
          findViewById<TextView>(R.id.rn_redbox_report_label).apply {
            movementMethod = LinkMovementMethod.getInstance()
            highlightColor = Color.TRANSPARENT
          }
      reportButton =
          findViewById<Button>(R.id.rn_redbox_report_button).apply {
            setOnClickListener(reportButtonOnClickListener)
          }
    }
  }

  fun setExceptionDetails(title: String, stack: Array<StackFrame>) {
    stackView.adapter = StackAdapter(title, stack)
  }

  /** Show the report button, hide the report textview and the loading indicator. */
  fun resetReporting() {
    if (redBoxHandler?.isReportEnabled() == false) {
      return
    }
    isReporting = false
    reportTextView.visibility = View.GONE
    loadingIndicator.visibility = View.GONE
    lineSeparator.visibility = View.GONE
    reportButton.visibility = View.VISIBLE
    reportButton.isEnabled = true
  }

  override fun onItemClick(parent: AdapterView<*>?, view: View, position: Int, id: Long) {
    OpenStackFrameTask(devSupportManager)
        .executeOnExecutor(
            AsyncTask.THREAD_POOL_EXECUTOR,
            stackView.adapter.getItem(position) as StackFrame,
        )
  }

  /** Refresh the content view with latest errors from dev support manager */
  fun refreshContentView() {
    val message: String? = devSupportManager.lastErrorTitle
    val stack: Array<StackFrame> = devSupportManager.lastErrorStack ?: emptyArray()
    val errorType: ErrorType = checkNotNull(devSupportManager.lastErrorType)
    val errorInfo: Pair<String, Array<StackFrame>> =
        checkNotNull(devSupportManager.processErrorCustomizers(Pair.create(message, stack)))
    setExceptionDetails(errorInfo.first, errorInfo.second)

    // JS errors are reported here after source mapping.
    devSupportManager.redBoxHandler?.let { redBoxHandler ->
      redBoxHandler.handleRedbox(message, stack, errorType)
      resetReporting()
    }
  }
}
