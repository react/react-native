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
 * Animated node that plays a role of value aggregator. It takes two or more value nodes as an input
 * and outputs a difference of values outputted by those nodes.
 */
internal class SubtractionAnimatedNode(
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
    for (i in inputNodes.indices) {
      val animatedNode = nativeAnimatedNodesManager.getNodeById(inputNodes[i])
      if (animatedNode != null && animatedNode is ValueAnimatedNode) {
        val value = animatedNode.getValue()
        if (i == 0) {
          nodeValue = value
        } else {
          nodeValue -= value
        }
      } else {
        throw JSApplicationCausedNativeException(
            "Illegal node ID set as an input for Animated.subtract node",
        )
      }
    }
  }

  override fun prettyPrint(): String =
      "SubtractionAnimatedNode[$tag]: input nodes: $inputNodes - super: ${super.prettyPrint()}"
}
