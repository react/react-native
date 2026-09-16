/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.JSApplicationCausedNativeException
import com.facebook.react.bridge.ReadableMap

internal class ModulusAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager,
) : ValueAnimatedNode() {

  private val inputNode: Int = config.getInt("input")
  private val modulus: Double = config.getDouble("modulus")

  override fun update() {
    val animatedNode = nativeAnimatedNodesManager.getNodeById(inputNode)
    if (animatedNode is ValueAnimatedNode) {
      val animatedNodeValue = animatedNode.getValue()
      nodeValue = (animatedNodeValue % modulus + modulus) % modulus
    } else {
      throw JSApplicationCausedNativeException(
          "Illegal node ID set as an input for Animated.modulus node",
      )
    }
  }

  override fun prettyPrint(): String {
    return "NativeAnimatedNodesManager[$tag] inputNode: $inputNode modulus: $modulus super: ${super.prettyPrint()}"
  }
}
