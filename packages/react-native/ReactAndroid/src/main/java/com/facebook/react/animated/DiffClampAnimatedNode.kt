/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.JSApplicationCausedNativeException
import com.facebook.react.bridge.ReadableMap
import kotlin.math.max
import kotlin.math.min

internal class DiffClampAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager,
) : ValueAnimatedNode() {
  private val inputNodeTag: Int
  private val minValue: Double
  private val maxValue: Double
  private var lastValue: Double = 0.0

  private val inputNodeValue: Double
    get() {
      val animatedNode = nativeAnimatedNodesManager.getNodeById(inputNodeTag)
      if (animatedNode == null || animatedNode !is ValueAnimatedNode) {
        throw JSApplicationCausedNativeException(
            "Illegal node ID set as an input for Animated.DiffClamp node"
        )
      }
      return animatedNode.getValue()
    }

  init {
    inputNodeTag = config.getInt("input")
    minValue = config.getDouble("min")
    maxValue = config.getDouble("max")
    nodeValue = lastValue
  }

  override fun update() {
    val value = inputNodeValue
    val diff = value - lastValue
    lastValue = value
    nodeValue = min(max(nodeValue + diff, minValue), maxValue)
  }

  override fun prettyPrint(): String =
      "DiffClampAnimatedNode[$tag]: InputNodeTag: $inputNodeTag min: $minValue " +
          "max: $maxValue lastValue: $lastValue super: ${super.prettyPrint()}"
}
