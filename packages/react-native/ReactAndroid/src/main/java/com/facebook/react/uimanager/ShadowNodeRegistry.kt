/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.util.SparseArray
import android.util.SparseBooleanArray
import android.view.View
import com.facebook.infer.annotation.Assertions
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/**
 * Simple container class to keep track of [ReactShadowNode]s associated with a particular
 * UIManagerModule instance.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal class ShadowNodeRegistry {
  private val tagsToCSSNodes = SparseArray<ReactShadowNode<*>>()
  private val rootTags = SparseBooleanArray()
  private val threadAsserter = SingleThreadAsserter()

  fun addRootNode(node: ReactShadowNode<*>) {
    threadAsserter.assertNow()
    val tag = node.getReactTag()
    tagsToCSSNodes.put(tag, node)
    rootTags.put(tag, true)
  }

  fun removeRootNode(tag: Int) {
    threadAsserter.assertNow()
    if (tag == View.NO_ID) {
      // This root node has already been removed (likely due to a threading issue caused by async js
      // execution). Ignore this root removal.
      return
    }
    if (!rootTags[tag]) {
      throw IllegalViewOperationException("View with tag $tag is not registered as a root view")
    }

    tagsToCSSNodes.remove(tag)
    rootTags.delete(tag)
  }

  fun addNode(node: ReactShadowNode<*>) {
    threadAsserter.assertNow()
    tagsToCSSNodes.put(node.getReactTag(), node)
  }

  fun removeNode(tag: Int) {
    threadAsserter.assertNow()
    if (rootTags[tag]) {
      throw IllegalViewOperationException(
          "Trying to remove root node $tag without using removeRootNode!"
      )
    }
    tagsToCSSNodes.remove(tag)
  }

  fun getNode(tag: Int): ReactShadowNode<*>? {
    threadAsserter.assertNow()
    return tagsToCSSNodes[tag]
  }

  fun isRootNode(tag: Int): Boolean {
    threadAsserter.assertNow()
    return rootTags[tag]
  }

  val rootNodeCount: Int
    get() {
      threadAsserter.assertNow()
      return rootTags.size()
    }

  fun getRootTag(index: Int): Int {
    threadAsserter.assertNow()
    return rootTags.keyAt(index)
  }

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "ShadowNodeRegistry",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }

  inner class SingleThreadAsserter {
    private var thread: Thread? = null

    fun assertNow() {
      val currentThread = Thread.currentThread()
      if (thread == null) {
        thread = currentThread
      }
      Assertions.assertCondition(thread == currentThread)
    }
  }
}
