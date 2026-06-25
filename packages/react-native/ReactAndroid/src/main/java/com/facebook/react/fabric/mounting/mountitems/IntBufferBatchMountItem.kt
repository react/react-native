/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.fabric.events.EventEmitterWrapper
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.StateWrapper
import com.facebook.systrace.Systrace
import java.util.Locale

/**
 * This class represents a batch of [MountItem]s, represented directly as int buffers to remove the
 * need for actual MountItem instances.
 *
 * An IntBufferBatchMountItem batch contains an array of ints, indicating the mount actions that
 * should be taken, and a size; as well as an array of Objects, and a corresponding array size, for
 * any data that cannot be passed as a raw int.
 *
 * The purpose of encapsulating the array of MountItems this way, is to reduce the amount of
 * allocations in C++ and JNI round-trips.
 */
private const val TAG = "IntBufferBatchMountItem"

internal class IntBufferBatchMountItem(
    private val surfaceId: Int,
    private val intBuffer: IntArray,
    private val objBuffer: Array<Any?>,
    private val commitNumber: Int,
) : BatchMountItem {
  private val intBufferLen = intBuffer.size
  private val objBufferLen = objBuffer.size

  private fun beginMarkers(reason: String) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "IntBufferBatchMountItem::$reason")

    if (commitNumber > 0) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_BATCH_EXECUTION_START,
          null,
          commitNumber,
      )
    }
  }

  private fun endMarkers() {
    if (commitNumber > 0) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END,
          null,
          commitNumber,
      )
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT)
  }

  override fun execute(mountingManager: MountingManager) {
    val surfaceMountingManager = mountingManager.getSurfaceManager(surfaceId)
    if (surfaceMountingManager == null) {
      FLog.e(
          TAG,
          "Skipping batch of MountItems; no SurfaceMountingManager found for [%d].",
          surfaceId,
      )
      return
    }
    if (surfaceMountingManager.isStopped) {
      FLog.e(TAG, "Skipping batch of MountItems; was stopped [%d].", surfaceId)
      return
    }
    if (ReactNativeFeatureFlags.enableFabricLogs()) {
      FLog.d(TAG, "Executing IntBufferBatchMountItem on surface [%d]", surfaceId)
    }

    beginMarkers("mountViews")
    var i = 0
    var j = 0
    while (i < intBufferLen) {
      val rawType = intBuffer[i++]
      val type = rawType and INSTRUCTION_FLAG_MULTIPLE.inv()
      val numInstructions =
          (if ((rawType and INSTRUCTION_FLAG_MULTIPLE) != 0) intBuffer[i++] else 1)

      val args = arrayOf("numInstructions", numInstructions.toString())

      Systrace.beginSection(
          Systrace.TRACE_TAG_REACT,
          "IntBufferBatchMountItem::mountInstructions::" + nameForInstructionString(type),
          args,
          args.size,
      )
      for (k in 0 until numInstructions) {
        when (type) {
          INSTRUCTION_CREATE -> {
            val componentName = (objBuffer[j++] as String?).orEmpty()
            val fabricComponentName =
                FabricNameComponentMapping.getFabricComponentName(componentName)
            surfaceMountingManager.createView(
                fabricComponentName,
                intBuffer[i++],
                objBuffer[j++] as ReadableMap,
                objBuffer[j++] as StateWrapper?,
                objBuffer[j++] as EventEmitterWrapper?,
                intBuffer[i++] == 1,
            )
          }
          INSTRUCTION_DELETE -> surfaceMountingManager.deleteView(intBuffer[i++])
          INSTRUCTION_INSERT -> {
            val tag = intBuffer[i++]
            val parentTag = intBuffer[i++]
            surfaceMountingManager.addViewAt(parentTag, tag, intBuffer[i++])
          }
          INSTRUCTION_REMOVE ->
              surfaceMountingManager.removeViewAt(intBuffer[i++], intBuffer[i++], intBuffer[i++])
          INSTRUCTION_UPDATE_PROPS ->
              surfaceMountingManager.updateProps(intBuffer[i++], objBuffer[j++] as ReadableMap)
          INSTRUCTION_UPDATE_STATE ->
              surfaceMountingManager.updateState(intBuffer[i++], objBuffer[j++] as StateWrapper?)
          INSTRUCTION_UPDATE_LAYOUT -> {
            val reactTag = intBuffer[i++]
            val parentTag = intBuffer[i++]
            val x = intBuffer[i++]
            val y = intBuffer[i++]
            val width = intBuffer[i++]
            val height = intBuffer[i++]
            val displayType = intBuffer[i++]
            val layoutDirection = intBuffer[i++]
            surfaceMountingManager.updateLayout(
                reactTag,
                parentTag,
                x,
                y,
                width,
                height,
                displayType,
                layoutDirection,
            )
          }
          INSTRUCTION_UPDATE_PADDING ->
              surfaceMountingManager.updatePadding(
                  intBuffer[i++],
                  intBuffer[i++],
                  intBuffer[i++],
                  intBuffer[i++],
                  intBuffer[i++],
              )
          INSTRUCTION_UPDATE_OVERFLOW_INSET -> {
            val reactTag = intBuffer[i++]
            val overflowInsetLeft = intBuffer[i++]
            val overflowInsetTop = intBuffer[i++]
            val overflowInsetRight = intBuffer[i++]
            val overflowInsetBottom = intBuffer[i++]

            surfaceMountingManager.updateOverflowInset(
                reactTag,
                overflowInsetLeft,
                overflowInsetTop,
                overflowInsetRight,
                overflowInsetBottom,
            )
          }
          INSTRUCTION_UPDATE_EVENT_EMITTER -> {
            val eventEmitterWrapper = objBuffer[j++] as EventEmitterWrapper?
            if (eventEmitterWrapper != null) {
              surfaceMountingManager.updateEventEmitter(intBuffer[i++], eventEmitterWrapper)
            }
          }
          else -> {
            throw IllegalArgumentException(
                "Invalid type argument to IntBufferBatchMountItem: $type at index: $i"
            )
          }
        }
      }
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
    endMarkers()
  }

  override fun getSurfaceId(): Int = surfaceId

  override fun isBatchEmpty(): Boolean = intBufferLen == 0

  override fun toString(): String {
    try {
      val s = StringBuilder()
      s.append(String.format(Locale.ROOT, "IntBufferBatchMountItem [surface:%d]:\n", surfaceId))
      var i = 0
      var j = 0
      while (i < intBufferLen) {
        val rawType = intBuffer[i++]
        val type = rawType and INSTRUCTION_FLAG_MULTIPLE.inv()
        val numInstructions =
            (if ((rawType and INSTRUCTION_FLAG_MULTIPLE) != 0) intBuffer[i++] else 1)
        for (k in 0 until numInstructions) {
          when (type) {
            INSTRUCTION_CREATE -> {
              val componentName = (objBuffer[j++] as String?).orEmpty()
              val fabricComponentName =
                  FabricNameComponentMapping.getFabricComponentName(componentName)

              j += 3
              s.append(
                  String.format(
                      Locale.ROOT,
                      "CREATE [%d] - layoutable:%d - %s\n",
                      intBuffer[i++],
                      intBuffer[i++],
                      fabricComponentName,
                  )
              )
            }
            INSTRUCTION_DELETE ->
                s.append(String.format(Locale.ROOT, "DELETE [%d]\n", intBuffer[i++]))
            INSTRUCTION_INSERT ->
                s.append(
                    String.format(
                        Locale.ROOT,
                        "INSERT [%d]->[%d] @%d\n",
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                    )
                )
            INSTRUCTION_REMOVE ->
                s.append(
                    String.format(
                        Locale.ROOT,
                        "REMOVE [%d]->[%d] @%d\n",
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                    )
                )
            INSTRUCTION_UPDATE_PROPS -> {
              val props = objBuffer[j++]
              val propsString =
                  if (FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT) (props?.toString() ?: "<null>")
                  else "<hidden>"
              s.append(
                  String.format(Locale.ROOT, "UPDATE PROPS [%d]: %s\n", intBuffer[i++], propsString)
              )
            }
            INSTRUCTION_UPDATE_STATE -> {
              val state: StateWrapper? = objBuffer[j++] as StateWrapper?
              val stateString =
                  if (FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT) (state?.toString() ?: "<null>")
                  else "<hidden>"
              s.append(
                  String.format(Locale.ROOT, "UPDATE STATE [%d]: %s\n", intBuffer[i++], stateString)
              )
            }
            INSTRUCTION_UPDATE_LAYOUT ->
                s.append(
                    String.format(
                        Locale.ROOT,
                        "UPDATE LAYOUT [%d]->[%d]: x:%d y:%d w:%d h:%d displayType:%d" +
                            " layoutDirection:%d\n",
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                    )
                )
            INSTRUCTION_UPDATE_PADDING ->
                s.append(
                    String.format(
                        Locale.ROOT,
                        "UPDATE PADDING [%d]: top:%d right:%d bottom:%d left:%d\n",
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                    )
                )
            INSTRUCTION_UPDATE_OVERFLOW_INSET ->
                s.append(
                    String.format(
                        Locale.ROOT,
                        "UPDATE OVERFLOWINSET [%d]: left:%d top:%d right:%d bottom:%d\n",
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                        intBuffer[i++],
                    )
                )
            INSTRUCTION_UPDATE_EVENT_EMITTER -> {
              j += 1
              s.append(String.format(Locale.ROOT, "UPDATE EVENTEMITTER [%d]\n", intBuffer[i++]))
            }
            else -> {
              FLog.e(TAG, "String so far: $s")
              throw IllegalArgumentException(
                  "Invalid type argument to IntBufferBatchMountItem: $type at index: $i"
              )
            }
          }
        }
      }
      return s.toString()
    } catch (e: Exception) {
      // Generally, this only happens during development when a malformed buffer is sent through.
      // In these cases, we print the buffers to assist in debugging.
      // This should never happen in production, but if it does... it'd still be helpful to know.
      FLog.e(TAG, "Caught exception trying to print", e)

      val ss = StringBuilder()
      var ii = 0
      while (ii < intBufferLen) {
        ss.append(intBuffer[ii])
        ss.append(", ")
        ii++
      }
      FLog.e(TAG, ss.toString())

      var jj = 0
      while (jj < objBufferLen) {
        FLog.e(TAG, if (objBuffer[jj] != null) objBuffer[jj].toString() else "null")
        jj++
      }

      return ""
    }
  }

  companion object {
    const val INSTRUCTION_FLAG_MULTIPLE: Int = 1

    const val INSTRUCTION_CREATE: Int = 2
    const val INSTRUCTION_DELETE: Int = 4
    const val INSTRUCTION_INSERT: Int = 8
    const val INSTRUCTION_REMOVE: Int = 16
    const val INSTRUCTION_UPDATE_PROPS: Int = 32
    const val INSTRUCTION_UPDATE_STATE: Int = 64
    const val INSTRUCTION_UPDATE_LAYOUT: Int = 128
    const val INSTRUCTION_UPDATE_EVENT_EMITTER: Int = 256
    const val INSTRUCTION_UPDATE_PADDING: Int = 512
    const val INSTRUCTION_UPDATE_OVERFLOW_INSET: Int = 1024

    private fun nameForInstructionString(type: Int): String =
        when (type) {
          INSTRUCTION_CREATE -> "CREATE"
          INSTRUCTION_DELETE -> "DELETE"
          INSTRUCTION_INSERT -> "INSERT"
          INSTRUCTION_REMOVE -> "REMOVE"
          INSTRUCTION_UPDATE_PROPS -> "UPDATE_PROPS"
          INSTRUCTION_UPDATE_STATE -> "UPDATE_STATE"
          INSTRUCTION_UPDATE_LAYOUT -> "UPDATE_LAYOUT"
          INSTRUCTION_UPDATE_PADDING -> "UPDATE_PADDING"
          INSTRUCTION_UPDATE_OVERFLOW_INSET -> "UPDATE_OVERFLOW_INSET"
          INSTRUCTION_UPDATE_EVENT_EMITTER -> "UPDATE_EVENT_EMITTER"
          else -> "UNKNOWN"
        }
  }
}
