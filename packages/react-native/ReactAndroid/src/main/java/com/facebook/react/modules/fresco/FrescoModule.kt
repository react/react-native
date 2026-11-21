/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.fresco

import com.facebook.common.logging.FLog
import com.facebook.drawee.backends.pipeline.DraweeConfig
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.backends.okhttp3.OkHttpImagePipelineConfigFactory
import com.facebook.imagepipeline.core.DownsampleMode
import com.facebook.imagepipeline.core.ImagePipeline
import com.facebook.imagepipeline.core.ImagePipelineConfig
import com.facebook.imagepipeline.listener.RequestListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.common.ModuleDataCleaner
import com.facebook.react.modules.network.CookieJarContainer
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import okhttp3.JavaNetCookieJar

/**
 * Module to initialize the Fresco library.
 *
 * Does not expose any methods to JavaScript code. For initialization and cleanup only.
 */
@ReactModule(name = FrescoModule.NAME, needsEagerInit = true)
public open class FrescoModule
@JvmOverloads
constructor(
    reactContext: ReactApplicationContext?,
    private val clearOnDestroy: Boolean = true,
    imagePipelineConfig: ImagePipelineConfig? = null,
) :
    ReactContextBaseJavaModule(reactContext),
    ModuleDataCleaner.Cleanable,
    LifecycleEventListener,
    TurboModule {
  private var config: ImagePipelineConfig? = imagePipelineConfig
  private var pipeline: ImagePipeline? = null

  /**
   * Create a new Fresco module with a default configuration (or the previously given configuration
   * via [FrescoModule].
   *
   * @param reactContext the context to use
   * @param imagePipeline the Fresco image pipeline to use
   * @param clearOnDestroy whether to clear the memory cache in onHostDestroy: this should be `true`
   *   for pure RN apps and `false` for apps that use Fresco outside of RN as well
   * @param hasBeenInitializedExternally whether Fresco has already been initialized
   */
  @JvmOverloads
  public constructor(
      reactContext: ReactApplicationContext?,
      imagePipeline: ImagePipeline?,
      clearOnDestroy: Boolean = true,
      hasBeenInitializedExternally: Boolean = false,
  ) : this(reactContext, clearOnDestroy) {
    pipeline = imagePipeline
    if (hasBeenInitializedExternally) {
      hasBeenInitialized = true
    }
  }

  override fun initialize() {
    super.initialize()
    val reactContext = reactApplicationContext
    reactContext.addLifecycleEventListener(this)
    if (!hasBeenInitialized()) {
      val pipelineConfig = config ?: getDefaultConfig(reactContext)
      val draweeConfigBuilder = DraweeConfig.newBuilder()
      Fresco.initialize(
          reactContext.applicationContext,
          pipelineConfig,
          draweeConfigBuilder.build(),
      )
      hasBeenInitialized = true
    } else if (config != null) {
      FLog.w(
          ReactConstants.TAG,
          "Fresco has already been initialized with a different config. " +
              "The new Fresco configuration will be ignored!",
      )
    }
    config = null
  }

  override fun getName(): String = NAME

  override fun clearSensitiveData() {
    // Clear image cache.
    imagePipeline?.clearCaches()
  }

  override fun onHostResume(): Unit = Unit

  override fun onHostPause(): Unit = Unit

  override fun onHostDestroy() {
    // According to the javadoc for LifecycleEventListener#onHostDestroy, this is only called when
    // the 'last' ReactActivity is being destroyed, which effectively means the app is being
    // backgrounded.
    if (hasBeenInitialized() && clearOnDestroy) {
      imagePipeline?.clearMemoryCaches()
    }
  }

  private val imagePipeline: ImagePipeline?
    get() {
      if (pipeline == null) {
        pipeline = Fresco.getImagePipeline()
      }
      return pipeline
    }

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    super.invalidate()
  }

  public companion object {
    public const val NAME: String = "FrescoModule"
    private var hasBeenInitialized = false

    /**
     * Check whether the FrescoModule has already been initialized. If this is the case, Calls to
     * [FrescoModule] will ignore the given configuration.
     *
     * @return true if this module has already been initialized
     */
    @JvmStatic public fun hasBeenInitialized(): Boolean = hasBeenInitialized

    private fun getDefaultConfig(context: ReactContext): ImagePipelineConfig =
        getDefaultConfigBuilder(context).build()

    /**
     * Get the default Fresco configuration builder. Allows adding of configuration options in
     * addition to the default values.
     *
     * @return [com.facebook.imagepipeline.core.ImagePipelineConfig.Builder] that has been
     *   initialized with default values
     */
    @JvmStatic
    public fun getDefaultConfigBuilder(context: ReactContext): ImagePipelineConfig.Builder {
      val requestListeners = HashSet<RequestListener>()
      requestListeners.add(SystraceRequestListener())
      val client = OkHttpClientProvider.createClient()

      // make sure to forward cookies for any requests via the okHttpClient
      // so that image requests to endpoints that use cookies still work

      @Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions
      val container = client.cookieJar() as CookieJarContainer

      val handler = ForwardingCookieHandler(context.applicationContext)
      container.setCookieJar(JavaNetCookieJar(handler))
      val builder =
          OkHttpImagePipelineConfigFactory.newBuilder(context.applicationContext, client)
              .setNetworkFetcher(ReactOkHttpNetworkFetcher(client))
              .setDownsampleMode(DownsampleMode.AUTO)
              .setRequestListeners(requestListeners)
      builder.experiment().setBinaryXmlEnabled(true)
      return builder
    }
  }
}
