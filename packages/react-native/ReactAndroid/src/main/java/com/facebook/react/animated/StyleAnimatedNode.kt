/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableMap

/**
 * Native counterpart of style animated node (see AnimatedStyle class in AnimatedImplementation.js)
 */
internal class StyleAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager,
) : AnimatedNode() {
  private val propMapping: Map<String, Int>

  init {
    val style = config.getMap("style")
    val iter = style?.keySetIterator()
    propMapping =
        buildMap() {
          while (iter != null && iter.hasNextKey()) {
            val propKey = iter.nextKey()
            put(propKey, style.getInt(propKey))
          }
        }
  }

  fun collectViewUpdates(propsMap: JavaOnlyMap) {
    for ((key, value) in propMapping) {
      val node = nativeAnimatedNodesManager.getNodeById(value)
      requireNotNull(node) { "Mapped style node does not exist" }
      if (node is TransformAnimatedNode) {
        node.collectViewUpdates(propsMap)
      } else if (node is ValueAnimatedNode) {
        val animatedObject = node.getAnimatedObject()
        if (animatedObject is Int) {
          propsMap.putInt(key, animatedObject)
        } else if (animatedObject is String) {
          propsMap.putString(key, animatedObject)
        } else {
          propsMap.putDouble(key, node.getValue())
        }
      } else if (node is ColorAnimatedNode) {
        propsMap.putInt(key, node.color)
      } else if (node is ObjectAnimatedNode) {
        node.collectViewUpdates(key, propsMap)
      } else {
        throw IllegalArgumentException(
            "Unsupported type of node used in property node ${node.javaClass}",
        )
      }
    }
  }

  override fun prettyPrint(): String = "StyleAnimatedNode[$tag] mPropMapping: $propMapping"
}
