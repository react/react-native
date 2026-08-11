/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.fbreact.specs

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.DisplayMetrics
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ArrayBuffer
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.interfaces.BindingsInstallerHolder
import com.facebook.react.turbomodule.core.interfaces.TurboModuleWithJSIBindings
import java.util.UUID

@DoNotStrip
@ReactModule(name = SampleTurboModule.NAME)
public class SampleTurboModule(private val context: ReactApplicationContext) :
    NativeSampleTurboModuleSpec(context), TurboModuleWithJSIBindings {

  private var toast: Toast? = null

  private lateinit var permissionLauncher: ActivityResultLauncher<String>
  private var pendingPermissionPromise: Promise? = null

  // Photo picker in single-select mode, demonstrating a contract with a typed input
  // (PickVisualMediaRequest) and a nullable output. See
  // https://developer.android.com/training/data-storage/shared/photo-picker
  private lateinit var pickMediaLauncher: ActivityResultLauncher<PickVisualMediaRequest>
  private var pendingPickMediaPromise: Promise? = null

  // Photo picker in multi-select mode, using the custom [PickUpToMedia] contract (see bottom of
  // this file) so the item limit can be passed per call from JS.
  private lateinit var pickMultipleMediaLauncher: ActivityResultLauncher<PickUpToMedia.Request>
  private var pendingPickMultipleMediaPromise: Promise? = null

  override fun initialize() {
    super.initialize()

    permissionLauncher =
        context.registerForActivityResult(this, ActivityResultContracts.RequestPermission()) {
            isGranted: Boolean ->
          pendingPermissionPromise?.resolve(isGranted)
          pendingPermissionPromise = null
        }

    pickMediaLauncher =
        context.registerForActivityResult(this, ActivityResultContracts.PickVisualMedia()) {
            uri: Uri? ->
          pendingPickMediaPromise?.resolve(uri?.toString())
          pendingPickMediaPromise = null
        }

    pickMultipleMediaLauncher =
        context.registerForActivityResult(this, PickUpToMedia()) { uris: List<Uri> ->
          val result: WritableArray = WritableNativeArray()
          uris.forEach { result.pushString(it.toString()) }
          pendingPickMultipleMediaPromise?.resolve(result)
          pendingPickMultipleMediaPromise = null
        }
  }

  @DoNotStrip
  override fun getBool(arg: Boolean): Boolean {
    log("getBool", arg, arg)
    return arg
  }

  @DoNotStrip
  override fun getEnum(arg: Double): Double {
    log("getEnum", arg, arg)
    return arg
  }

  override fun getTypedExportedConstants(): MutableMap<String, Any> {
    val result: MutableMap<String, Any> = mutableMapOf()
    val activity = context.currentActivity
    if (activity != null) {
      @Suppress("DEPRECATION")
      val widthPixels =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            activity.windowManager.currentWindowMetrics.bounds.width()
          } else {
            val displayMetrics = DisplayMetrics()
            activity.windowManager.defaultDisplay.getMetrics(displayMetrics)
            displayMetrics.widthPixels
          }
      result["const2"] = widthPixels
    }
    result["const1"] = true
    result["const3"] = "something"
    log("constantsToExport", "", result)
    return result
  }

  @DoNotStrip
  override fun getNumber(arg: Double): Double {
    log("getNumber", arg, arg)
    return arg
  }

  @DoNotStrip
  override fun getString(arg: String?): String? {
    log("getString", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getRootTag(arg: Double): Double {
    log("getRootTag", arg, arg)
    return arg
  }

  @DoNotStrip
  override fun voidFunc() {
    log("voidFunc", "<void>", "<void>")
    emitOnPress()
    emitOnClick("click")
    run {
      val map =
          WritableNativeMap().apply {
            putInt("a", 1)
            putString("b", "two")
          }
      emitOnChange(map)
    }
    run {
      val array = WritableNativeArray()
      val map1 =
          WritableNativeMap().apply {
            putInt("a", 1)
            putString("b", "two")
          }
      val map2 =
          WritableNativeMap().apply {
            putInt("a", 3)
            putString("b", "four")
          }
      array.pushMap(map1)
      array.pushMap(map2)
      emitOnSubmit(array)
    }
  }

  // This function returns {@link WritableMap} instead of {@link Map} for backward compat with
  // existing native modules that use this Writable* as return types or in events. {@link
  // WritableMap} is modified in the Java side, and read (or consumed) on the C++ side.
  // In the future, all native modules should ideally return an immutable Map
  @DoNotStrip
  @Suppress("unused")
  override fun getObject(arg: ReadableMap?): WritableMap {
    val map = WritableNativeMap()
    arg?.let { map.merge(it) }
    log("getObject", arg, map)
    return map
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getUnsafeObject(arg: ReadableMap?): WritableMap {
    val map = WritableNativeMap()
    arg?.let { map.merge(it) }
    log("getUnsafeObject", arg, map)
    return map
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getValue(x: Double, y: String?, z: ReadableMap?): WritableMap {
    val map: WritableMap = WritableNativeMap()
    map.putDouble("x", x)
    map.putString("y", y)
    val zMap: WritableMap = WritableNativeMap()
    z?.let { zMap.merge(it) }
    map.putMap("z", zMap)
    log("getValue", mapOf("1-numberArg" to x, "2-stringArg" to y, "3-mapArg" to z), map)
    return map
  }

  // Mutating the argument updates the JS ArrayBuffer in place.
  @DoNotStrip
  @Suppress("unused")
  override fun getArrayBuffer(buffer: ArrayBuffer?): ArrayBuffer? {
    if (buffer != null) {
      val bytes = buffer.bytes
      for (i in 0 until bytes.capacity()) {
        bytes.put(i, (bytes.get(i) * 2).toByte())
      }
    }
    log("getArrayBuffer", buffer, buffer)
    return buffer
  }

  @DoNotStrip
  @Suppress("unused")
  override fun createNativeBuffer(size: Double): ArrayBuffer {
    require(size.isFinite() && size >= 0.0 && size <= Int.MAX_VALUE.toDouble()) {
      "createNativeBuffer: size must be a finite value in [0, ${Int.MAX_VALUE}], got $size"
    }
    val buffer = ArrayBuffer(size.toInt())
    log("createNativeBuffer", size, buffer)
    return buffer
  }

  @DoNotStrip
  @Suppress("unused")
  override fun processAsyncBuffer(payload: ArrayBuffer?, promise: Promise) {
    promise.resolve((payload?.size ?: 0).toDouble())
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getValueWithCallback(callback: Callback?) {
    val result = "Value From Callback"
    log("Callback", "Return Time", result)
    callback?.invoke(result)
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getArray(arg: ReadableArray?): WritableArray {
    if (arg == null || Arguments.toList(arg) == null) {
      // Returning an empty array, since the super class always returns non-null
      return WritableNativeArray()
    }
    val result: WritableArray = Arguments.makeNativeArray(Arguments.toList(arg))
    log("getArray", arg, result)
    return result
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getValueWithPromise(error: Boolean, promise: Promise) {
    if (error) {
      promise?.reject(
          "code 1",
          "intentional promise rejection",
          Throwable("promise intentionally rejected"),
      )
    } else {
      promise?.resolve("result")
    }
  }

  @DoNotStrip
  @Suppress("unused")
  override fun voidFuncThrows() {
    error("Intentional exception from JVM voidFuncThrows")
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getObjectThrows(arg: ReadableMap): WritableMap {
    error("Intentional exception from JVM getObjectThrows with $arg")
  }

  @DoNotStrip
  @Suppress("unused")
  override fun promiseThrows(promise: Promise) {
    error("Intentional exception from JVM promiseThrows")
  }

  @DoNotStrip
  @Suppress("unused")
  override fun voidFuncAssert() {
    assert(false) { "Intentional assert from JVM voidFuncAssert" }
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getObjectAssert(arg: ReadableMap): WritableMap? {
    assert(false) { "Intentional assert from JVM getObjectAssert with $arg" }
    return null
  }

  @DoNotStrip
  @Suppress("unused")
  override fun promiseAssert(promise: Promise) {
    assert(false) { "Intentional assert from JVM promiseAssert" }
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getImageUrl(promise: Promise) {
    val activity = context.getCurrentActivity() as? ComponentActivity
    if (activity != null) {
      val key = UUID.randomUUID().toString()
      activity.activityResultRegistry
          .register(
              key,
              ActivityResultContracts.GetContent(),
              { uri: Uri? ->
                if (uri != null) {
                  promise.resolve(uri.toString())
                } else {
                  promise.resolve(null)
                }
              },
          )
          .launch("image/*")
    } else {
      promise.reject("error", "Unable to obtain an image uri without current activity")
    }
  }

  /**
   * Demonstrates requesting a runtime permission through the [ActivityResultRegistry] owned by
   * [com.facebook.react.bridge.ReactContext], rather than through the current Activity. Unlike
   * [getImageUrl], this needs no Activity to be present at registration time and no cast to
   * [ComponentActivity].
   */
  @DoNotStrip
  @Suppress("unused")
  override fun requestSamplePermission(promise: Promise) {
    if (pendingPermissionPromise != null) {
      promise.reject("error", "A permission request is already in flight")
      return
    }
    pendingPermissionPromise = promise
    permissionLauncher.launch(Manifest.permission.CAMERA)
  }

  /**
   * Maps the JS-provided mime type onto the photo picker's [VisualMediaType]: null selects images
   * and videos, "image/&#42;" and "video/&#42;" restrict to one kind, and any other value is
   * treated as a specific mime type (e.g. "image/gif").
   */
  private fun visualMediaType(
      mimeType: String?
  ): ActivityResultContracts.PickVisualMedia.VisualMediaType =
      when (mimeType) {
        null -> ActivityResultContracts.PickVisualMedia.ImageAndVideo
        "image/*" -> ActivityResultContracts.PickVisualMedia.ImageOnly
        "video/*" -> ActivityResultContracts.PickVisualMedia.VideoOnly
        else -> ActivityResultContracts.PickVisualMedia.SingleMimeType(mimeType)
      }

  @DoNotStrip
  @Suppress("unused")
  override fun pickMedia(mimeType: String?, promise: Promise) {
    if (pendingPickMediaPromise != null) {
      promise.reject("error", "A media pick is already in flight")
      return
    }
    pendingPickMediaPromise = promise
    pickMediaLauncher.launch(PickVisualMediaRequest(visualMediaType(mimeType)))
  }

  @DoNotStrip
  @Suppress("unused")
  override fun pickMultipleMedia(mimeType: String?, maxItems: Double, promise: Promise) {
    if (pendingPickMultipleMediaPromise != null) {
      promise.reject("error", "A media pick is already in flight")
      return
    }
    val limit = maxItems.toInt()
    if (limit < 2) {
      promise.reject("error", "maxItems must be at least 2, got $limit")
      return
    }
    pendingPickMultipleMediaPromise = promise
    pickMultipleMediaLauncher.launch(
        PickUpToMedia.Request(limit, PickVisualMediaRequest(visualMediaType(mimeType))))
  }

  /**
   * Starts a second ReactActivity to exercise multi-Activity navigation: the launchers above must
   * rebind to the new Activity's registry (it resumes while the old Activity is still alive).
   * Launched by class name to avoid a compile-time dependency on the app; the data URI deep-links
   * the new surface straight to the picker example via Linking.
   */
  @DoNotStrip
  @Suppress("unused")
  override fun startSecondActivity() {
    val activity = context.currentActivity
    if (activity == null) {
      Toast.makeText(context, "No current Activity to launch from", Toast.LENGTH_LONG).show()
      return
    }
    val intent =
        Intent(Intent.ACTION_VIEW, Uri.parse("rntester://example/PhotoPickerAndroid"))
            .setClassName(activity, "${activity.packageName}.RNTesterSecondActivity")
    activity.startActivity(intent)
  }

  private fun log(method: String, input: Any?, output: Any?) {
    toast?.cancel()
    val message = StringBuilder("Method :")
    message
        .append(method)
        .append("\nInputs: ")
        .append(input.toString())
        .append("\nOutputs: ")
        .append(output.toString())
    toast = Toast.makeText(context, message.toString(), Toast.LENGTH_LONG)
    toast?.show()
  }

  override fun invalidate() {
    permissionLauncher.unregister()
    pickMediaLauncher.unregister()
    pickMultipleMediaLauncher.unregister()

    // Reject anything still in flight: the JS context that made these calls is going away.
    // Clearing the fields also lets the still-registered callbacks tolerate a late result.
    pendingPermissionPromise?.reject(
        "E_MODULE_INVALIDATED", "Permission request cancelled: SampleTurboModule was invalidated")
    pendingPermissionPromise = null

    pendingPickMediaPromise?.reject(
        "E_MODULE_INVALIDATED", "Media pick cancelled: SampleTurboModule was invalidated")
    pendingPickMediaPromise = null

    pendingPickMultipleMediaPromise?.reject(
        "E_MODULE_INVALIDATED", "Multiple media pick cancelled: SampleTurboModule was invalidated")
    pendingPickMultipleMediaPromise = null
    super.invalidate()
  }

  override fun getName(): String {
    return NAME
  }

  @DoNotStrip external override fun getBindingsInstaller(): BindingsInstallerHolder

  public companion object {
    public const val NAME: String = "SampleTurboModule"
  }
}

/**
 * Photo picker contract for multi-select with a per-call item limit. Stock
 * [ActivityResultContracts.PickMultipleVisualMedia] fixes the limit in its constructor, but here it
 * comes from JS per call. So the contract is subclassed to carry the limit in its input type, the
 * pattern library authors should copy for any contract parameter that comes from JS.
 */
private class PickUpToMedia :
    ActivityResultContract<PickUpToMedia.Request, List<@JvmSuppressWildcards Uri>>() {
  class Request(val maxItems: Int, val request: PickVisualMediaRequest)

  // Only used to build/parse intents; its constructor limit is always overwritten below.
  private val delegate = ActivityResultContracts.PickMultipleVisualMedia(2)

  override fun createIntent(context: Context, input: Request): Intent =
      delegate.createIntent(context, input.request).apply {
        // Honored by the system photo picker. On the pre-picker ACTION_OPEN_DOCUMENT fallback
        // only single-vs-multiple is distinguished, so treat the limit as best-effort there.
        putExtra(MediaStore.EXTRA_PICK_IMAGES_MAX, input.maxItems)
      }

  override fun parseResult(resultCode: Int, intent: Intent?): List<Uri> =
      delegate.parseResult(resultCode, intent)
}
