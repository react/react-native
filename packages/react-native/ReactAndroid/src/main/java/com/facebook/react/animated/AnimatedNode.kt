/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import java.util.ArrayList

/** Base class for all Animated.js library node types that can be created on the "native" side. */
public abstract class AnimatedNode {

  internal companion object {
    internal const val INITIAL_BFS_COLOR: Int = 0
    internal const val DEFAULT_ANIMATED_NODE_CHILD_COUNT: Int = 1
  }

  // TODO: T196787278 Reduce the visibility of these fields to package once we have
  // converted the whole module to Kotlin

  @JvmField
  internal var children: MutableList<AnimatedNode>? =
      null /* lazy-initialized when a child is added */
  @JvmField internal var activeIncomingNodes: Int = 0
  @JvmField internal var BFSColor: Int = INITIAL_BFS_COLOR
  @JvmField internal var tag: Int = -1

  internal fun addChild(child: AnimatedNode) {
    val currentChildren =
        children
            ?: ArrayList<AnimatedNode>(DEFAULT_ANIMATED_NODE_CHILD_COUNT).also { children = it }

    currentChildren.add(child)
    child.onAttachedToNode(this)
  }

  internal fun removeChild(child: AnimatedNode) {
    val currentChildren = children ?: return
    child.onDetachedFromNode(this)
    currentChildren.remove(child)
  }

  /**
   * Subclasses may want to override this method in order to store a reference to the parent of a
   * given node that can then be used to calculate current node's value in [update]. In that case it
   * is important to also override [onDetachedFromNode] to clear that reference once current node
   * gets detached.
   */
  internal open fun onAttachedToNode(parent: AnimatedNode): Unit = Unit

  /** See [onAttachedToNode] */
  internal open fun onDetachedFromNode(parent: AnimatedNode): Unit = Unit

  /**
   * This method will be run on each node at most once every repetition of the animation loop. It
   * will be executed on a node only when all the node's parent has already been updated. Therefore
   * it can be used to calculate node's value.
   */
  internal open fun update(): Unit = Unit

  /**
   * Pretty-printer for the AnimatedNode. Only called in production pre-crash for debug diagnostics.
   */
  internal abstract fun prettyPrint(): String

  internal fun prettyPrintWithChildren(): String {

    val currentChildren = children?.joinToString(" ")
    return prettyPrint() +
        if (!currentChildren.isNullOrBlank()) " children: $currentChildren" else ""
  }
}
