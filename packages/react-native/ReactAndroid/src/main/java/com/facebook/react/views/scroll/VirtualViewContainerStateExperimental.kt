/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.graphics.Rect
import android.view.ViewGroup
import com.facebook.common.logging.FLog
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.views.virtual.VirtualViewMode

internal class VirtualViewContainerStateExperimental(scrollView: ViewGroup) :
    VirtualViewContainerState(scrollView) {

  private val horizontal: Boolean =
      when (scrollView) {
        is ReactScrollView -> false
        is ReactHorizontalScrollView -> true
        else -> false // default
      }
  override val virtualViews = IntervalTree(horizontal)

  // set of all VirtualViews that are in prerender or visible ranges
  var PV: MutableSet<String> = mutableSetOf()
  // set of all VirtualViews that are in prerender (not in viewport)
  var P: MutableSet<String> = mutableSetOf()
  // set of all VirtualViews that are in viewport
  var V: MutableSet<String> = mutableSetOf()

  override fun onChange(virtualView: VirtualView) {
    if (virtualViews.add(virtualView)) {
      debugLog("add", { "virtualViewID=${virtualView.virtualViewID}" })
    } else {
      debugLog("update", { "virtualViewID=${virtualView.virtualViewID}" })
    }
    updateModes(virtualView)
  }

  override fun updateModes(virtualView: VirtualView?) {
    updateRects()
    if (virtualView != null) {
      updateMode(virtualView)
    } else {
      updateModesAll()
    }
  }

  override fun remove(virtualView: VirtualView) {
    super.remove(virtualView)
    PV.remove(virtualView.virtualViewID)
    P.remove(virtualView.virtualViewID)
    V.remove(virtualView.virtualViewID)
  }

  /**
   * Perform mode update check on a single VirtualView. Does not check other VirtualViews in the
   * collection. Use carefully
   */
  private fun updateMode(virtualView: VirtualView) {
    val rect = virtualView.containerRelativeRect

    var mode: VirtualViewMode = VirtualViewMode.Hidden
    var thresholdRect = emptyRect
    when {
      rectsOverlap(rect, visibleRect) -> {
        thresholdRect = visibleRect
        mode = VirtualViewMode.Visible
      }
      rectsOverlap(rect, prerenderRect) -> {
        mode = VirtualViewMode.Prerender
        thresholdRect = prerenderRect
      }
    }

    virtualView.onModeChange(mode, thresholdRect)

    // move the virtualView into the correct set(s)
    when (mode) {
      VirtualViewMode.Visible -> {
        PV.add(virtualView.virtualViewID)
        P.remove(virtualView.virtualViewID)
        V.add(virtualView.virtualViewID)
      }

      VirtualViewMode.Prerender -> {
        PV.add(virtualView.virtualViewID)
        P.add(virtualView.virtualViewID)
        V.remove(virtualView.virtualViewID)
      }

      VirtualViewMode.Hidden -> {
        // remove from all sets
        PV.remove(virtualView.virtualViewID)
        P.remove(virtualView.virtualViewID)
        V.remove(virtualView.virtualViewID)
      }
    }
  }

  /**
   * Efficiently check and update modes for all VirtualViews in the collection. Runs in O(m + log
   * n), where m = size of the prerender window in terms of index
   */
  private fun updateModesAll() {
    // collect V' and PV' sets
    val VPrime = virtualViews.query(visibleRect)
    val PVPrime = virtualViews.query(prerenderRect)

    debugLog("updateModes", { "V: ${V}, P: ${P}, PV: ${PV}" })

    /** Perform utility set differences: */
    // P'=PV'-V'
    val PPrime = PVPrime.minus(VPrime)

    debugLog("updateModes", { "V': ${VPrime}, P': ${PPrime}, PV': ${PVPrime}" })

    /** Get useful set differences */
    // V'-V - update to visible
    val toVisible = VPrime.minus(V)
    // P'-P - update to prerender
    val toPrerender = PPrime.minus(P)
    // PV-PV' - update to hidden
    val toHidden = PV.minus(PVPrime)

    debugLog("updateModes", { "toV: ${toVisible}, toP: ${toPrerender}, toH: ${toHidden}" })

    /** Perform updates with the calculated sets */
    for (vvID in toVisible) {
      virtualViews.getVirtualView(vvID)?.onModeChange(VirtualViewMode.Visible, visibleRect)
    }
    for (vvID in toPrerender) {
      virtualViews.getVirtualView(vvID)?.onModeChange(VirtualViewMode.Prerender, prerenderRect)
    }
    for (vvID in toHidden) {
      virtualViews.getVirtualView(vvID)?.onModeChange(VirtualViewMode.Hidden, emptyRect)
    }

    /** update old sets - V, P, and PV */
    V = VPrime
    P = PPrime.toMutableSet()
    PV = PVPrime.toMutableSet()
  }
}

/**
 * since we use 1D intervals in this implementation, we reimplement intersection (exclusive) this
 * interval implementation needs to use ID as an extra differentiator because we may have
 * overlapping VirtualViews
 */
private data class Interval(val start: Int, val end: Int, val id: String) {
  public fun intersects(other: Interval): Boolean {
    debugLog(
        "Interval: intersect",
        { "${id}:(${start}, ${end}) vs ${other.id}:(${other.start}, ${other.end})" },
    )
    return this.start < other.end && other.start < this.end
  }
}

private class IntervalNode(
    var interval: Interval,
    var virtualView: VirtualView,
    var max: Int = interval.end,
    var height: Int = 1,
    var left: IntervalNode? = null,
    var right: IntervalNode? = null,
)

internal class IntervalTree(private val horizontal: Boolean) : MutableCollection<VirtualView> {
  private var root: IntervalNode? = null
  private val idToIntervalNode = mutableMapOf<String, IntervalNode>()

  private fun rectToInterval(rect: Rect, id: String? = ""): Interval {
    return if (horizontal) {
      Interval(rect.left, rect.right, id.orEmpty())
    } else {
      Interval(rect.top, rect.bottom, id.orEmpty())
    }
  }

  /** AVL Tree Operations */
  private fun height(node: IntervalNode?): Int = node?.height ?: 0

  private fun updateHeight(node: IntervalNode) {
    node.height = 1 + maxOf(height(node.left), height(node.right))
  }

  private fun updateMax(node: IntervalNode) {
    node.max =
        maxOf(
            node.interval.end,
            node.left?.max ?: Int.MIN_VALUE,
            node.right?.max ?: Int.MIN_VALUE,
        )
  }

  private fun balanceFactor(node: IntervalNode?): Int {
    return if (node == null) 0 else height(node.left) - height(node.right)
  }

  private fun rotateRight(parent: IntervalNode): IntervalNode {
    val newParent =
        requireNotNull(parent.left) {
          "[IntervalTree] AVL node's left must not be null when rotating right."
        }
    val replacingGrandchild = newParent.right

    newParent.right = parent
    parent.left = replacingGrandchild

    updateHeight(parent)
    updateMax(parent)
    updateHeight(newParent)
    updateMax(newParent)

    return newParent
  }

  private fun rotateLeft(parent: IntervalNode): IntervalNode {
    val newParent =
        requireNotNull(parent.right) {
          "[IntervalTree] AVL node's right must not be null when rotating left."
        }
    val replacingGrandchild = newParent.left

    newParent.left = parent
    parent.right = replacingGrandchild

    updateHeight(parent)
    updateMax(parent)
    updateHeight(newParent)
    updateMax(newParent)

    return newParent
  }

  private fun balance(node: IntervalNode): IntervalNode {
    updateHeight(node)
    updateMax(node)

    val bf = balanceFactor(node)

    // Left heavy
    if (bf > 1) {
      if (balanceFactor(node.left) < 0) {
        node.left =
            rotateLeft(
                requireNotNull(node.left) {
                  "[IntervalTree] node.left must not be null when performing left rotation around it"
                }
            )
      }
      return rotateRight(node)
    }

    // Right heavy
    if (bf < -1) {
      if (balanceFactor(node.right) > 0) {
        node.right =
            rotateRight(
                requireNotNull(node.right) {
                  "[IntervalTree] node.right must not be null when performing right rotation around it"
                }
            )
      }
      return rotateLeft(node)
    }

    return node
  }

  private fun compareIntervals(i1: Interval, i2: Interval): Int {
    return when {
      i1.start != i2.start -> i1.start.compareTo(i2.start)
      i1.end != i2.end -> i1.end.compareTo(i2.end)
      else -> i1.id.compareTo(i2.id)
    }
  }

  private fun insert(
      node: IntervalNode?,
      intervalNode: IntervalNode,
  ): IntervalNode {
    if (node == null) {
      return intervalNode
    }

    when {
      compareIntervals(intervalNode.interval, node.interval) < 0 -> {
        node.left = insert(node.left, intervalNode)
      }
      else -> {
        node.right = insert(node.right, intervalNode)
      }
    }

    return balance(node)
  }

  private fun findMin(node: IntervalNode): IntervalNode {
    return node.left?.let { findMin(it) } ?: node
  }

  private fun delete(node: IntervalNode?, target: IntervalNode): IntervalNode? {
    if (node == null) {
      return null
    }

    var nodeToReturn: IntervalNode? = node
    when {
      compareIntervals(target.interval, node.interval) < 0 -> {
        node.left = delete(node.left, target)
      }
      compareIntervals(target.interval, node.interval) > 0 -> {
        node.right = delete(node.right, target)
      }
      else -> {
        // Node to delete found
        nodeToReturn =
            when {
              node.left == null -> node.right
              node.right == null -> node.left
              else -> {
                val successor =
                    findMin(
                        requireNotNull(node.right) {
                          "[IntervalTree] node.right must not be null when finding node's successor"
                        }
                    )
                node.virtualView = successor.virtualView
                node.interval = successor.interval
                node.right = delete(node.right, successor)
                node
              }
            }
      }
    }

    if (nodeToReturn == null) {
      return null
    } else {
      return balance(nodeToReturn)
    }
  }

  private fun queryHelper(
      node: IntervalNode?,
      interval: Interval,
      results: MutableSet<String>,
  ) {
    debugLog(
        "queryHelper",
        {
          "Check node (${node?.virtualView?.virtualViewID}, ${node?.virtualView?.containerRelativeRect}) against interval(${interval.start}, ${interval.end})"
        },
    )
    if (node == null || node.max <= interval.start) {
      return
    }

    queryHelper(node.left, interval, results)

    if (node.interval.intersects(interval)) {
      results.add(node.virtualView.virtualViewID)
    }

    if (node.interval.start < interval.end) {
      queryHelper(node.right, interval, results)
    }
  }

  private fun inorderTraversal(node: IntervalNode?, results: MutableList<VirtualView>) {
    if (node == null) {
      return
    }
    inorderTraversal(node.left, results)
    results.add(node.virtualView)
    inorderTraversal(node.right, results)
  }

  /**
   * Queries all intervals that overlap with the given rectangle in the set direction. Because this
   * is a 1D implementation, this will ignore all cross-axis intersection
   */
  fun query(queryRect: Rect): MutableSet<String> {
    val queryInterval = rectToInterval(queryRect)
    val results = HashSet<String>()
    debugLog("query", { "Querying tree for rect ${queryRect}" })
    queryHelper(root, queryInterval, results)
    debugLog("query", { "Query results: ${results}" })
    return results
  }

  fun getVirtualView(virtualViewID: String): VirtualView? {
    return idToIntervalNode[virtualViewID]?.virtualView
  }

  fun traverse(): MutableList<VirtualView> {
    val results = mutableListOf<VirtualView>()
    inorderTraversal(root, results)
    return results
  }

  /** MutableCollection public API */

  /**
   * Adds or updates an interval. If an interval with the given ID exists, it updates that interval.
   * Otherwise, adds a new interval.
   *
   * Returns true if we are adding a new element, false otherwise (update). The update case will
   * still override the old node.
   */
  override fun add(element: VirtualView): Boolean {
    val id = element.virtualViewID
    var newElement = true

    // If interval node with this ID exists, remove it first
    val intervalNode = idToIntervalNode[id]
    if (intervalNode != null) {
      root = delete(root, intervalNode)
      newElement = false
    }

    val newInterval = rectToInterval(element.containerRelativeRect, id)
    val newIntervalNode = IntervalNode(newInterval, element)

    root = insert(root, newIntervalNode)
    idToIntervalNode[id] = newIntervalNode

    debugLog(
        "IntervalTree: add",
        {
          "New VirtualView: (${element.virtualViewID}, ${element.containerRelativeRect}). Node interval ${newIntervalNode.interval.id}"
        },
    )

    return newElement
  }

  override fun addAll(elements: Collection<VirtualView>): Boolean {
    var changed = false
    elements.forEach { element ->
      if (add(element)) {
        changed = true
      }
    }
    return changed
  }

  override fun clear() {
    root = null
    idToIntervalNode.clear()
  }

  override fun iterator(): MutableIterator<VirtualView> {
    val list = mutableListOf<VirtualView>()
    inorderTraversal(root, list)
    return list.iterator()
  }

  override fun remove(element: VirtualView): Boolean {
    val intervalNode = idToIntervalNode[element.virtualViewID]
    if (intervalNode != null) {
      root = delete(root, intervalNode)
      idToIntervalNode.remove(element.virtualViewID)
      return true
    } else {
      return false
    }
  }

  override fun removeAll(elements: Collection<VirtualView>): Boolean {
    var removedAny = false
    elements.forEach {
      if (remove(it)) {
        removedAny = true
      }
    }
    return removedAny
  }

  override fun retainAll(elements: Collection<VirtualView>): Boolean {
    throw Error("IntervalTree does not support retainAll yet")
  }

  override val size: Int
    get() = idToIntervalNode.size

  override fun contains(element: VirtualView): Boolean {
    return idToIntervalNode.contains(element.virtualViewID)
  }

  override fun containsAll(elements: Collection<VirtualView>): Boolean {
    return elements.all { contains(it) }
  }

  override fun isEmpty(): Boolean {
    return (size == 0)
  }
}

private val ENABLE_DEBUG_LOGS = ReactBuildConfig.DEBUG && false

private inline fun debugLog(subtag: String, block: () -> String = { "" }) {
  if (ENABLE_DEBUG_LOGS) {
    FLog.d("VirtualViewContainerStateExperimental:$subtag", block())
  }
}
