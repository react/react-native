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
 * Animated node which takes two or more value node as an input and outputs a product of their
 * values
 */
internal class MultiplicationAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager,
) : ValueAnimatedNode() {
  private var inputNodes: IntArray

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
    nodeValue = 1.0
    for (i in inputNodes.indices) {
      val animatedNode = nativeAnimatedNodesManager.getNodeById(inputNodes[i])
      val multiplier =
          if (animatedNode != null && animatedNode is ValueAnimatedNode) {
            animatedNode.getValue()
          } else {
            throw JSApplicationCausedNativeException(
                "Illegal node ID set as an input for Animated.multiply node",
            )
          }
      nodeValue *= multiplier
    }
  }

  override fun prettyPrint(): String =
      "MultiplicationAnimatedNode[$tag]: input nodes: $inputNodes - super: ${super.prettyPrint()}"
}
