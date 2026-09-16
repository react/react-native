/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler

/**
 * A simple factory that creates instances of [DevSupportManager] implementations.
 *
 * The first create() method is for the Old Architecture flow and is deprecated and should not be
 * used anymore. The second create() method is for the New Architecture/Bridgeless flow.
 */
internal class DefaultDevSupportManagerFactory : DevSupportManagerFactory {

  @Deprecated(
      "Use the other create() method with useDevSupport parameter for New Architecture. This method will be removed in a future release.",
      replaceWith =
          ReplaceWith(
              "create(applicationContext, reactInstanceManagerHelper, packagerPathForJSBundleName, enableOnCreate, redBoxHandler, devBundleDownloadListener, minNumShakes, customPackagerCommandHandlers, surfaceDelegateFactory, devLoadingViewManager, pausedInDebuggerOverlayManager)",
          ),
  )
  override fun create(
      applicationContext: Context,
      reactInstanceManagerHelper: ReactInstanceDevHelper,
      packagerPathForJSBundleName: String?,
      enableOnCreate: Boolean,
      redBoxHandler: RedBoxHandler?,
      devBundleDownloadListener: DevBundleDownloadListener?,
      minNumShakes: Int,
      customPackagerCommandHandlers: Map<String, RequestHandler>?,
      surfaceDelegateFactory: SurfaceDelegateFactory?,
      devLoadingViewManager: DevLoadingViewManager?,
      pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?,
  ): DevSupportManager =
      if (!enableOnCreate) {
        ReleaseDevSupportManager()
      } else {
        PerftestDevSupportManager(applicationContext)
      }

  override fun create(
      applicationContext: Context,
      reactInstanceManagerHelper: ReactInstanceDevHelper,
      packagerPathForJSBundleName: String?,
      enableOnCreate: Boolean,
      redBoxHandler: RedBoxHandler?,
      devBundleDownloadListener: DevBundleDownloadListener?,
      minNumShakes: Int,
      customPackagerCommandHandlers: Map<String, RequestHandler>?,
      surfaceDelegateFactory: SurfaceDelegateFactory?,
      devLoadingViewManager: DevLoadingViewManager?,
      pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?,
      useDevSupport: Boolean,
  ): DevSupportManager =
      if (ReactBuildConfig.UNSTABLE_ENABLE_FUSEBOX_RELEASE) {
        PerftestDevSupportManager(applicationContext)
      } else if (useDevSupport) {
        BridgelessDevSupportManager(
            applicationContext,
            reactInstanceManagerHelper,
            packagerPathForJSBundleName,
            enableOnCreate,
            redBoxHandler,
            devBundleDownloadListener,
            minNumShakes,
            customPackagerCommandHandlers,
            surfaceDelegateFactory,
            devLoadingViewManager,
            pausedInDebuggerOverlayManager,
        )
      } else {
        ReleaseDevSupportManager()
      }
}
