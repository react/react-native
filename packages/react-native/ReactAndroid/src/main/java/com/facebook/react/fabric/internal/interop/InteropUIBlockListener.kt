/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // We want to test UIBlock and UIBlockViewResolver here.

package com.facebook.react.fabric.internal.interop

import androidx.annotation.VisibleForTesting
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.interop.UIBlock
import com.facebook.react.fabric.interop.UIBlockViewResolver

/**
 * Interop class used to support invoking [addUIBlock] and [prependUIBlock] in Fabric.
 *
 * Users on the Old Architecture used to call those methods to execute arbitrary [UIBlock]s This
 * class effectively re-implements this logic by using a [UIManagerListener] and exposing the two
 * methods that the user intend to call.
 */
@OptIn(UnstableReactNativeAPI::class)
internal class InteropUIBlockListener : UIManagerListener {
  @VisibleForTesting internal val beforeUIBlocks: MutableList<UIBlock> = mutableListOf()

  @VisibleForTesting internal val afterUIBlocks: MutableList<UIBlock> = mutableListOf()

  @Synchronized
  fun prependUIBlock(block: UIBlock) {
    beforeUIBlocks.add(block)
  }

  @Synchronized
  fun addUIBlock(block: UIBlock) {
    afterUIBlocks.add(block)
  }

  override fun willMountItems(uiManager: UIManager) {
    if (uiManager !is UIBlockViewResolver) {
      return
    }

    // avoid ConcurrentModificationException by iterating over a copy
    val blocks =
        synchronized(this) {
          if (beforeUIBlocks.isEmpty()) {
            return
          }
          beforeUIBlocks.toList().also { beforeUIBlocks.clear() }
        }

    blocks.forEach { block -> block.execute(uiManager) }
  }

  override fun didMountItems(uiManager: UIManager) {
    if (uiManager !is UIBlockViewResolver) {
      return
    }

    // avoid ConcurrentModificationException by iterating over a copy
    val blocks =
        synchronized(this) {
          if (afterUIBlocks.isEmpty()) {
            return
          }
          afterUIBlocks.toList().also { afterUIBlocks.clear() }
        }

    blocks.forEach { block -> block.execute(uiManager) }
  }

  override fun didDispatchMountItems(uiManager: UIManager) = didMountItems(uiManager)

  override fun willDispatchViewUpdates(uiManager: UIManager) = willMountItems(uiManager)

  override fun didScheduleMountItems(uiManager: UIManager) = Unit
}
