/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.JSApplicationCausedNativeException
import com.facebook.react.bridge.ReadableMap

/**
 * Animated node which takes two or more value node as an input and outputs an in-order division of
 * their values.
 */
internal class DivisionAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager,
) : ValueAnimatedNode() {
  private val inputNodes: IntArray

  init {
    val input = config.getArray("input")
    inputNodes =
        if (input == null) {
          IntArray(0)
        } else {
          IntArray(input.size()) { i -> input.getInt(i) }
        }
  }

  override fun update() {
    inputNodes.forEachIndexed { i, inputNode ->
      val animatedNode = nativeAnimatedNodesManager.getNodeById(inputNode)
      if (animatedNode != null && animatedNode is ValueAnimatedNode) {
        val v = animatedNode.nodeValue
        if (i == 0) {
          nodeValue = v
        } else if (v == 0.0) {
          throw JSApplicationCausedNativeException(
              "Detected a division by zero in Animated.divide node with Animated ID $tag",
          )
        } else {
          nodeValue /= v
        }
      } else {
        throw JSApplicationCausedNativeException(
            "Illegal node ID set as an input for Animated.divide node with Animated ID $tag",
        )
      }
    }
  }

  override fun prettyPrint(): String =
      "DivisionAnimatedNode[$tag]: input nodes: $inputNodes - super: ${super.prettyPrint()}"
}
