/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.yoga.YogaAlign
import com.facebook.yoga.YogaBaselineFunction
import com.facebook.yoga.YogaDirection
import com.facebook.yoga.YogaDisplay
import com.facebook.yoga.YogaFlexDirection
import com.facebook.yoga.YogaJustify
import com.facebook.yoga.YogaMeasureFunction
import com.facebook.yoga.YogaNode
import com.facebook.yoga.YogaOverflow
import com.facebook.yoga.YogaPositionType
import com.facebook.yoga.YogaValue
import com.facebook.yoga.YogaWrap

/**
 * Base node class for representing virtual tree of React nodes. Shadow nodes are used primarily for
 * layouting therefore it extends [YogaNode] to allow that. They also help with handling Common base
 * subclass of [YogaNode] for all layout nodes for react-based view. It extends [YogaNode] by adding
 * additional capabilities.
 *
 * Instances of this class receive property updates from JS via @{link UIManagerModule}. Subclasses
 * may use [updateShadowNode] to persist some of the updated fields in the node instance that
 * corresponds to a particular view type.
 *
 * Subclasses of [ReactShadowNode] should be created only from [ViewManager] that corresponds to a
 * certain type of native view. They will be updated and accessed only from JS thread. Subclasses of
 * [ViewManager] may choose to use base class [ReactShadowNode] or custom subclass of it if
 * necessary.
 *
 * The primary use-case for [ReactShadowNode] nodes is to calculate layouting. Although this might
 * be extended. For some examples please refer to ARTGroupYogaNode or ReactTextYogaNode.
 *
 * This class allows for the native view hierarchy to not be an exact copy of the hierarchy received
 * from JS by keeping track of both JS children (e.g. [getChildCount]) and separately native
 * children (e.g. [getNativeChildCount]).
 */
@LegacyArchitecture
@Deprecated("This class is part of Legacy Architecture and will be removed in a future release")
public interface ReactShadowNode<T : ReactShadowNode<T>> {

  /**
   * Nodes that return `true` will be treated as "virtual" nodes. That is, nodes that are not mapped
   * into native views or Yoga nodes (e.g. nested text node). By default this method returns
   * `false`.
   */
  public fun isVirtual(): Boolean

  /**
   * Nodes that return `true` will be treated as a root view for the virtual nodes tree. It means
   * that all of its descendants will be "virtual" nodes. Good example is `InputText` view that may
   * have children `Text` nodes but this whole hierarchy will be mapped to a single android
   * [EditText] view.
   */
  public fun isVirtualAnchor(): Boolean

  /**
   * Nodes that return `true` will not manage (and and remove) child Yoga nodes. For example
   * [ReactTextInputShadowNode] or [ReactTextShadowNode] have child nodes, which do not want Yoga to
   * lay out, so in the eyes of Yoga it is a leaf node. Override this method in subclass to enforce
   * this requirement.
   */
  public fun isYogaLeafNode(): Boolean

  /**
   * When constructing the native tree, nodes that return `true` will be treated as leaves. Instead
   * of adding this view's native children as subviews of it, they will be added as subviews of an
   * ancestor. In other words, this view wants to support native children but it cannot host them
   * itself (e.g. it isn't a ViewGroup).
   */
  public fun hoistNativeChildren(): Boolean

  /** Returns the view class name for this shadow node. */
  public fun getViewClass(): String

  /** Returns whether this node has pending updates. */
  public fun hasUpdates(): Boolean

  /** Marks all updates on this node as seen. */
  public fun markUpdateSeen()

  /** Marks this node as having been updated. */
  public fun markUpdated()

  /** Returns whether this node has updates that have not yet been seen. */
  public fun hasUnseenUpdates(): Boolean

  /** Marks this node as dirty, requiring layout recalculation. */
  public fun dirty()

  /** Returns whether this node is currently marked as dirty. */
  public fun isDirty(): Boolean

  /** Adds a child node at the specified index. */
  public fun addChildAt(child: T, i: Int)

  /** Removes and returns the child node at the specified index. */
  public fun removeChildAt(i: Int): T

  /** Returns the number of children this node has. */
  public fun getChildCount(): Int

  /** Returns the child node at the specified index. */
  public fun getChildAt(i: Int): T

  /** Returns the index of the specified child node, or -1 if not found. */
  public fun indexOf(child: T): Int

  /** Removes and disposes all children of this node. */
  public fun removeAndDisposeAllChildren()

  /**
   * This method will be called by [UIManagerModule] once per batch, before calculating layout. Will
   * be only called for nodes that are marked as updated with [markUpdated] or require layouting
   * (marked with [dirty]).
   */
  public fun onBeforeLayout(nativeViewHierarchyOptimizer: NativeViewHierarchyOptimizer)

  /** Updates the properties of this shadow node from the given props diff map. */
  public fun updateProperties(props: ReactStylesDiffMap)

  /** Called after a property update transaction has completed. */
  public fun onAfterUpdateTransaction()

  /**
   * Called after layout step at the end of the UI batch from [UIManagerModule]. May be used to
   * enqueue additional ui operations for the native view. Will only be called on nodes marked as
   * updated either with [dirty] or [markUpdated].
   *
   * @param uiViewOperationQueue interface for enqueueing UI operations
   */
  public fun onCollectExtraUpdates(uiViewOperationQueue: UIViewOperationQueue)

  /** Returns whether dispatching updates will change the layout at the given absolute position. */
  public fun dispatchUpdatesWillChangeLayout(absoluteX: Float, absoluteY: Float): Boolean

  /** Dispatches updates for this node at the given absolute position. */
  public fun dispatchUpdates(
      absoluteX: Float,
      absoluteY: Float,
      uiViewOperationQueue: UIViewOperationQueue,
      nativeViewHierarchyOptimizer: NativeViewHierarchyOptimizer,
  )

  /** Returns the React tag identifier for this node. */
  public fun getReactTag(): Int

  /** Sets the React tag identifier for this node. */
  public fun setReactTag(reactTag: Int)

  /** Returns the root tag identifier for this node. */
  public fun getRootTag(): Int

  /** Sets the root tag identifier for this node. */
  public fun setRootTag(rootTag: Int)

  /** Sets the view class name for this shadow node. */
  public fun setViewClassName(viewClassName: String)

  /** Returns the parent node, or null if this is a root node. */
  public fun getParent(): T?

  /** Returns the node that is responsible for laying out this node. */
  public fun getLayoutParent(): T?

  /** Sets the node that is responsible for laying out this node. */
  public fun setLayoutParent(layoutParent: T?)

  /**
   * Get the [ThemedReactContext] associated with this [ReactShadowNode]. This will never change
   * during the lifetime of a [ReactShadowNode] instance, but different instances can have different
   * contexts; don't cache any calculations based on theme values globally.
   */
  public fun getThemedContext(): ThemedReactContext

  /** Sets the [ThemedReactContext] associated with this [ReactShadowNode]. */
  public fun setThemedContext(themedContext: ThemedReactContext)

  /** Returns whether this node should notify on layout changes. */
  public fun shouldNotifyOnLayout(): Boolean

  /** Calculates the layout for this node. */
  public fun calculateLayout()

  /** Calculates the layout for this node with the given width and height constraints. */
  public fun calculateLayout(width: Float, height: Float)

  /** Returns whether this node has a new layout that has not yet been seen. */
  public fun hasNewLayout(): Boolean

  /** Marks the current layout as having been seen. */
  public fun markLayoutSeen()

  /**
   * Adds a child that the native view hierarchy will have at this index in the native view
   * corresponding to this node.
   */
  public fun addNativeChildAt(child: T, nativeIndex: Int)

  /** Removes and returns the native child at the specified index. */
  public fun removeNativeChildAt(i: Int): T

  /** Removes all native children from this node. */
  public fun removeAllNativeChildren()

  /** Returns the number of native children this node has. */
  public fun getNativeChildCount(): Int

  /** Returns the index of the specified native child node. */
  public fun indexOfNativeChild(nativeChild: T): Int

  /** Returns the native parent node, or null if there is none. */
  public fun getNativeParent(): T?

  /**
   * Sets whether this node only contributes to the layout of its children without doing any drawing
   * or functionality itself.
   */
  public fun setIsLayoutOnly(isLayoutOnly: Boolean)

  /** Returns whether this node is layout-only. */
  public fun isLayoutOnly(): Boolean

  /** Returns the total number of native children in the subtree rooted at this node. */
  public fun getTotalNativeChildren(): Int

  /** Returns whether this node is a descendant of the given ancestor node. */
  public fun isDescendantOf(ancestorNode: T): Boolean

  /** Returns a [String] representation of the Yoga hierarchy of this [ReactShadowNode]. */
  public fun getHierarchyInfo(): String

  /**
   * In some cases we need a way to specify some environmental data to shadow node to improve layout
   * (or do something similar), so `localData` serves these needs. For example, any stateful
   * embedded native views may benefit from this. Have in mind that this data is not supposed to
   * interfere with the state of the shadow node. Please respect one-directional data flow of React.
   * Use [UIManagerModule.setViewLocalData] to set this property (to provide local/environmental
   * data for a shadow node) from the main thread.
   */
  public fun setLocalData(data: Any)

  /**
   * Returns the offset within the native children owned by all layout-only nodes in the subtree
   * rooted at this node for the given child. Put another way, this returns the number of native
   * nodes (nodes not optimized out of the native tree) that are a) to the left (visited before by a
   * DFS) of the given child in the subtree rooted at this node and b) do not have a native parent
   * in this subtree (which means that the given child will be a sibling of theirs in the final
   * native hierarchy since they'll get attached to the same native parent).
   *
   * Basically, a view might have children that have been optimized away. Since those children will
   * then add their native children to this view, we now have ranges of native children that
   * correspond to single unoptimized children. The purpose of this method is to return the index
   * within the native children that corresponds to the **start** of the native children that belong
   * to the given child. Also, note that all of the children of a view might be optimized away, so
   * this could return the same value for multiple different children.
   *
   * Example. Native children are represented by (N) where N is the no-opt child they came from. If
   * no children are optimized away it'd look like this: (0) (1) (2) (3) ... (n)
   *
   * In case some children are optimized away, it might look like this: (0) (1) (1) (1) (3) (3) (4)
   *
   * In that case: getNativeOffsetForChild(Node 0) => 0 getNativeOffsetForChild(Node 1) => 1
   * getNativeOffsetForChild(Node 2) => 4 getNativeOffsetForChild(Node 3) => 4
   *
   * getNativeOffsetForChild(Node 4) => 6
   */
  public fun getNativeOffsetForChild(child: T): Int

  /** Returns the layout X position of this node. */
  public fun getLayoutX(): Float

  /** Returns the layout Y position of this node. */
  public fun getLayoutY(): Float

  /** Returns the layout width of this node. */
  public fun getLayoutWidth(): Float

  /** Returns the layout height of this node. */
  public fun getLayoutHeight(): Float

  /** Returns the x position of the corresponding view on the screen, rounded to pixels. */
  public fun getScreenX(): Int

  /** Returns the y position of the corresponding view on the screen, rounded to pixels. */
  public fun getScreenY(): Int

  /** Returns the width corrected for rounding to pixels. */
  public fun getScreenWidth(): Int

  /** Returns the height corrected for rounding to pixels. */
  public fun getScreenHeight(): Int

  /** Returns the layout direction for this node. */
  public fun getLayoutDirection(): YogaDirection

  /** Sets the layout direction for this node. */
  public fun setLayoutDirection(direction: YogaDirection)

  /** Returns the style width value for this node. */
  public fun getStyleWidth(): YogaValue

  /** Sets the style width in pixels. */
  public fun setStyleWidth(widthPx: Float)

  /** Sets the style width as a percentage. */
  public fun setStyleWidthPercent(percent: Float)

  /** Sets the style width to auto. */
  public fun setStyleWidthAuto()

  /** Sets the minimum style width in pixels. */
  public fun setStyleMinWidth(widthPx: Float)

  /** Sets the minimum style width as a percentage. */
  public fun setStyleMinWidthPercent(percent: Float)

  /** Sets the maximum style width in pixels. */
  public fun setStyleMaxWidth(widthPx: Float)

  /** Sets the maximum style width as a percentage. */
  public fun setStyleMaxWidthPercent(percent: Float)

  /** Returns the style height value for this node. */
  public fun getStyleHeight(): YogaValue

  /** Returns the flex value for this node. */
  public fun getFlex(): Float

  /** Sets the style height in pixels. */
  public fun setStyleHeight(heightPx: Float)

  /** Sets the style height as a percentage. */
  public fun setStyleHeightPercent(percent: Float)

  /** Sets the style height to auto. */
  public fun setStyleHeightAuto()

  /** Sets the minimum style height in pixels. */
  public fun setStyleMinHeight(widthPx: Float)

  /** Sets the minimum style height as a percentage. */
  public fun setStyleMinHeightPercent(percent: Float)

  /** Sets the maximum style height in pixels. */
  public fun setStyleMaxHeight(widthPx: Float)

  /** Sets the maximum style height as a percentage. */
  public fun setStyleMaxHeightPercent(percent: Float)

  /** Sets the flex value for this node. */
  public fun setFlex(flex: Float)

  /** Sets the flex grow value for this node. */
  public fun setFlexGrow(flexGrow: Float)

  /** Sets the row gap in pixels. */
  public fun setRowGap(rowGap: Float)

  /** Sets the row gap as a percentage. */
  public fun setRowGapPercent(percent: Float)

  /** Sets the column gap in pixels. */
  public fun setColumnGap(columnGap: Float)

  /** Sets the column gap as a percentage. */
  public fun setColumnGapPercent(percent: Float)

  /** Sets the gap in pixels (applies to both row and column). */
  public fun setGap(gap: Float)

  /** Sets the gap as a percentage (applies to both row and column). */
  public fun setGapPercent(percent: Float)

  /** Sets the flex shrink value for this node. */
  public fun setFlexShrink(flexShrink: Float)

  /** Sets the flex basis value in pixels. */
  public fun setFlexBasis(flexBasis: Float)

  /** Sets the flex basis to auto. */
  public fun setFlexBasisAuto()

  /** Sets the flex basis as a percentage. */
  public fun setFlexBasisPercent(percent: Float)

  /** Sets the style aspect ratio for this node. */
  public fun setStyleAspectRatio(aspectRatio: Float)

  /** Sets the flex direction for this node. */
  public fun setFlexDirection(flexDirection: YogaFlexDirection)

  /** Sets the flex wrap mode for this node. */
  public fun setFlexWrap(wrap: YogaWrap)

  /** Sets the align-self value for this node. */
  public fun setAlignSelf(alignSelf: YogaAlign)

  /** Sets the align-items value for this node. */
  public fun setAlignItems(alignItems: YogaAlign)

  /** Sets the align-content value for this node. */
  public fun setAlignContent(alignContent: YogaAlign)

  /** Sets the justify-content value for this node. */
  public fun setJustifyContent(justifyContent: YogaJustify)

  /** Sets the overflow mode for this node. */
  public fun setOverflow(overflow: YogaOverflow)

  /** Sets the display mode for this node. */
  public fun setDisplay(display: YogaDisplay)

  /** Sets the margin for the given spacing type in pixels. */
  public fun setMargin(spacingType: Int, margin: Float)

  /** Sets the margin for the given spacing type as a percentage. */
  public fun setMarginPercent(spacingType: Int, percent: Float)

  /** Sets the margin for the given spacing type to auto. */
  public fun setMarginAuto(spacingType: Int)

  /** Returns the padding for the given spacing type. */
  public fun getPadding(spacingType: Int): Float

  /** Returns the style padding value for the given spacing type. */
  public fun getStylePadding(spacingType: Int): YogaValue

  /** Sets the default padding for the given spacing type in pixels. */
  public fun setDefaultPadding(spacingType: Int, padding: Float)

  /** Sets the padding for the given spacing type in pixels. */
  public fun setPadding(spacingType: Int, padding: Float)

  /** Sets the padding for the given spacing type as a percentage. */
  public fun setPaddingPercent(spacingType: Int, percent: Float)

  /** Sets the border width for the given spacing type. */
  public fun setBorder(spacingType: Int, borderWidth: Float)

  /** Sets the position for the given spacing type in pixels. */
  public fun setPosition(spacingType: Int, position: Float)

  /** Sets the position for the given spacing type as a percentage. */
  public fun setPositionPercent(spacingType: Int, percent: Float)

  /** Sets the position type for this node. */
  public fun setPositionType(positionType: YogaPositionType)

  /** Sets whether this node should notify on layout changes. */
  public fun setShouldNotifyOnLayout(shouldNotifyOnLayout: Boolean)

  /** Sets the baseline function for this node. */
  public fun setBaselineFunction(baselineFunction: YogaBaselineFunction)

  /** Sets the measure function for this node. */
  public fun setMeasureFunction(measureFunction: YogaMeasureFunction)

  /** Returns whether a measure function is defined for this node. */
  public fun isMeasureDefined(): Boolean

  /** Disposes this node and releases associated resources. */
  public fun dispose()

  /** Sets the measure specs for width and height. */
  public fun setMeasureSpecs(widthMeasureSpec: Int, heightMeasureSpec: Int)

  /** Returns the width measure spec, or null if not set. */
  public fun getWidthMeasureSpec(): Int?

  /** Returns the height measure spec, or null if not set. */
  public fun getHeightMeasureSpec(): Int?

  /** Calculates layout on children and returns the iterable of children, or null. */
  public fun calculateLayoutOnChildren(): Iterable<@JvmWildcard ReactShadowNode<*>>?
}
