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
 * and outputs a sum of values outputted by those nodes.
 */
internal class AdditionAnimatedNode(
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
    nodeValue = 0.0
    nodeValue +=
        inputNodes.fold(
            0.0,
            { acc, id ->
              val animatedNode = nativeAnimatedNodesManager.getNodeById(id)
              if (animatedNode is ValueAnimatedNode) {
                acc + animatedNode.getValue()
              } else {
                throw JSApplicationCausedNativeException(
                    "Illegal node ID set as an input for Animated.Add node",
                )
              }
            },
        )
  }

  override fun prettyPrint(): String =
      "AdditionAnimatedNode[${tag}]: input nodes: ${inputNodes.joinToString()} - super: ${super.prettyPrint()}"
}
