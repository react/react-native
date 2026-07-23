/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.PixelUtil

public class ReactScrollViewCommandHelper {

  public companion object {
    public const val COMMAND_SCROLL_TO: Int = 1
    public const val COMMAND_SCROLL_TO_END: Int = 2
    public const val COMMAND_FLASH_SCROLL_INDICATORS: Int = 3

    @JvmStatic
    public fun getCommandsMap(): Map<String, Int> = hashMapOf(
        "scrollTo" to COMMAND_SCROLL_TO,
        "scrollToEnd" to COMMAND_SCROLL_TO_END,
        "flashScrollIndicators" to COMMAND_FLASH_SCROLL_INDICATORS,
    )

    @JvmStatic
    public fun <T> receiveCommand(
        viewManager: ScrollCommandHandler<T>,
        scrollView: T,
        commandType: Int,
        args: ReadableArray?,
    ) {
      checkNotNull(viewManager)
      checkNotNull(scrollView)
      when (commandType) {
        COMMAND_SCROLL_TO -> scrollTo(viewManager, scrollView, checkNotNull(args))
        COMMAND_SCROLL_TO_END -> scrollToEnd(viewManager, scrollView, checkNotNull(args))
        COMMAND_FLASH_SCROLL_INDICATORS -> viewManager.flashScrollIndicators(scrollView)
        else ->
            throw IllegalArgumentException(
                "Unsupported command $commandType received by ${viewManager::class.java.simpleName}."
            )
      }
    }

    @JvmStatic
    public fun <T> receiveCommand(
        viewManager: ScrollCommandHandler<T>,
        scrollView: T,
        commandType: String,
        args: ReadableArray?,
    ) {
      checkNotNull(viewManager)
      checkNotNull(scrollView)
      when (commandType) {
        "scrollTo" -> scrollTo(viewManager, scrollView, checkNotNull(args))
        "scrollToEnd" -> scrollToEnd(viewManager, scrollView, checkNotNull(args))
        "flashScrollIndicators" -> viewManager.flashScrollIndicators(scrollView)
        else ->
            throw IllegalArgumentException(
                "Unsupported command $commandType received by ${viewManager::class.java.simpleName}."
            )
      }
    }

    private fun <T> scrollTo(
        viewManager: ScrollCommandHandler<T>,
        scrollView: T,
        args: ReadableArray,
    ) {
      val destX = Math.round(PixelUtil.toPixelFromDIP(args.getDouble(0)))
      val destY = Math.round(PixelUtil.toPixelFromDIP(args.getDouble(1)))
      val animated = args.getBoolean(2)
      viewManager.scrollTo(scrollView, ScrollToCommandData(destX, destY, animated))
    }

    private fun <T> scrollToEnd(
        viewManager: ScrollCommandHandler<T>,
        scrollView: T,
        args: ReadableArray,
    ) {
      val animated = args.getBoolean(0)
      viewManager.scrollToEnd(scrollView, ScrollToEndCommandData(animated))
    }
  }

  public interface ScrollCommandHandler<T> {
    public fun scrollTo(scrollView: T, data: ScrollToCommandData)

    public fun scrollToEnd(scrollView: T, data: ScrollToEndCommandData)

    public fun flashScrollIndicators(scrollView: T)
  }

  public class ScrollToCommandData(
      @JvmField public val mDestX: Int,
      @JvmField public val mDestY: Int,
      @JvmField public val mAnimated: Boolean,
  )

  public class ScrollToEndCommandData(@JvmField public val mAnimated: Boolean)
}
