/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler

public interface DevSupportManagerFactory {

  /** Factory used by the Old Architecture flow to create a [DevSupportManager]. */
  @Deprecated(
      message =
          "Use the other create() method with useDevSupport parameter for New Architecture. This method will be removed in a future release.",
      replaceWith =
          ReplaceWith(
              "create(applicationContext, reactInstanceManagerHelper, packagerPathForJSBundleName, enableOnCreate, redBoxHandler, devBundleDownloadListener, minNumShakes, customPackagerCommandHandlers, surfaceDelegateFactory, devLoadingViewManager, pausedInDebuggerOverlayManager)"
          ),
  )
  public fun create(
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
  ): DevSupportManager

  /**
   * Factory used by the New Architecture/Bridgeless flow to create a [DevSupportManager] and a
   * [BridgelessDevSupportManager]
   */
  public fun create(
      applicationContext: Context,
      reactInstanceManagerHelper: ReactInstanceDevHelper,
      packagerPathForJSBundleName: String? = null,
      enableOnCreate: Boolean = true,
      redBoxHandler: RedBoxHandler? = null,
      devBundleDownloadListener: DevBundleDownloadListener? = null,
      minNumShakes: Int = 2,
      customPackagerCommandHandlers: Map<String, RequestHandler>? = null,
      surfaceDelegateFactory: SurfaceDelegateFactory? = null,
      devLoadingViewManager: DevLoadingViewManager? = null,
      pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager? = null,
      useDevSupport: Boolean = true,
  ): DevSupportManager
}
