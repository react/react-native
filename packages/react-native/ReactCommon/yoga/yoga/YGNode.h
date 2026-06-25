/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <stdbool.h>
#include <stddef.h>

#include <yoga/YGConfig.h>
#include <yoga/YGEnums.h>
#include <yoga/YGMacros.h>

YG_EXTERN_C_BEGIN

/**
 * Handle to a mutable Yoga Node.
 */
typedef struct YGNode* YGNodeRef;

/**
 * Handle to an immutable Yoga Node.
 */
typedef const struct YGNode* YGNodeConstRef;

/**
 * Heap allocates and returns a new Yoga node using Yoga settings.
 */
YG_EXPORT YGNodeRef YGNodeNew(void);

/**
 * Heap allocates and returns a new Yoga node, with customized settings.
 */
YG_EXPORT YGNodeRef YGNodeNewWithConfig(YGConfigConstRef config);

/**
 * Returns a mutable copy of an existing node, with the same context and
 * children, but no owner set. Does not call the function set by
 * YGConfigSetCloneNodeFunc().
 */
YG_EXPORT YGNodeRef YGNodeClone(YGNodeConstRef node);

/**
 * Frees the Yoga node, disconnecting it from its owner and children.
 */
YG_EXPORT void YGNodeFree(YGNodeRef node);

/**
 * Frees the subtree of Yoga nodes rooted at the given node.
 */
YG_EXPORT void YGNodeFreeRecursive(YGNodeRef node);

/**
 * Frees the Yoga node without disconnecting it from its owner or children.
 * Allows garbage collecting Yoga nodes in parallel when the entire tree is
 * unreachable.
 */
YG_EXPORT void YGNodeFinalize(YGNodeRef node);

/**
 * Resets the node to its default state.
 */
YG_EXPORT void YGNodeReset(YGNodeRef node);

/**
 * Calculates the layout of the tree rooted at the given node.
 *
 * Layout results may be read after calling YGNodeCalculateLayout() using
 * functions like YGNodeLayoutGetLeft(), YGNodeLayoutGetTop(), etc.
 *
 * YGNodeGetHasNewLayout() may be read to know if the layout of the node or its
 * subtrees may have changed since the last time YGNodeCalculate() was called.
 */
YG_EXPORT void YGNodeCalculateLayout(
    YGNodeRef node,
    float availableWidth,
    float availableHeight,
    YGDirection ownerDirection);

/**
 * Whether the given node may have new layout results. Must be reset by calling
 * YGNodeSetHasNewLayout().
 */
YG_EXPORT bool YGNodeGetHasNewLayout(YGNodeConstRef node);

/**
 * Sets whether a nodes layout is considered new.
 */
YG_EXPORT void YGNodeSetHasNewLayout(YGNodeRef node, bool hasNewLayout);

/**
 * Whether the node's layout results are dirty due to it or its children
 * changing.
 */
YG_EXPORT bool YGNodeIsDirty(YGNodeConstRef node);

/**
 * Marks a node with custom measure function as dirty.
 */
YG_EXPORT void YGNodeMarkDirty(YGNodeRef node);

typedef void (*YGDirtiedFunc)(YGNodeConstRef node);

/**
 * Called when a change is made to the Yoga tree which dirties this node.
 */
YG_EXPORT void YGNodeSetDirtiedFunc(YGNodeRef node, YGDirtiedFunc dirtiedFunc);

/**
 * Returns a dirtied func if set.
 */
YG_EXPORT YGDirtiedFunc YGNodeGetDirtiedFunc(YGNodeConstRef node);

/**
 * Inserts a child node at the given index.
 */
YG_EXPORT void YGNodeInsertChild(YGNodeRef node, YGNodeRef child, size_t index);

/**
 * Replaces the child node at a given index with a new one.
 */
YG_EXPORT void YGNodeSwapChild(YGNodeRef node, YGNodeRef child, size_t index);

/**
 * Removes the given child node.
 */
YG_EXPORT void YGNodeRemoveChild(YGNodeRef node, YGNodeRef child);

/**
 * Removes all children nodes.
 */
YG_EXPORT void YGNodeRemoveAllChildren(YGNodeRef node);

/**
 * Sets children according to the given list of nodes.
 */
YG_EXPORT void
YGNodeSetChildren(YGNodeRef owner, const YGNodeRef* children, size_t count);

/**
 * Get the child node at a given index.
 */
YG_EXPORT YGNodeRef YGNodeGetChild(YGNodeRef node, size_t index);

/**
 * The number of child nodes.
 */
YG_EXPORT size_t YGNodeGetChildCount(YGNodeConstRef node);

/**
 * Get the parent/owner currently set for a node.
 */
YG_EXPORT YGNodeRef YGNodeGetOwner(YGNodeRef node);

/**
 * Get the parent/owner currently set for a node.
 */
YG_EXPORT YGNodeRef YGNodeGetParent(YGNodeRef node);

/**
 * Set a new config for the node after creation.
 */
YG_EXPORT void YGNodeSetConfig(YGNodeRef node, YGConfigRef config);

/**
 * Get the config currently set on the node.
 */
YG_EXPORT YGConfigConstRef YGNodeGetConfig(YGNodeRef node);

/**
 * Sets extra data on the Yoga node which may be read from during callbacks.
 */
YG_EXPORT void YGNodeSetContext(YGNodeRef node, void* context);

/**
 * Returns the context or NULL if no context has been set.
 */
YG_EXPORT void* YGNodeGetContext(YGNodeConstRef node);

typedef struct YGSize {
  float width;
  float height;
} YGSize;

/**
 * Returns the computed dimensions of the node, following the constraints of
 * `widthMode` and `heightMode`:
 *
 * YGMeasureModeUndefined: The parent has not imposed any constraint on the
 * child. It can be whatever size it wants.
 *
 * YGMeasureModeAtMost: The child can be as large as it wants up to the
 * specified size.
 *
 * YGMeasureModeExactly: The parent has determined an exact size for the
 * child. The child is going to be given those bounds regardless of how big it
 * wants to be.
 *
 * @returns the size of the leaf node, measured under the given constraints.
 */
typedef YGSize (*YGMeasureFunc)(
    YGNodeConstRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode);

/**
 * Allows providing custom measurements for a Yoga leaf node (usually for
 * measuring text). YGNodeMarkDirty() must be set if content effecting the
 * measurements of the node changes.
 */
YG_EXPORT void YGNodeSetMeasureFunc(YGNodeRef node, YGMeasureFunc measureFunc);

/**
 * Whether a measure function is set.
 */
YG_EXPORT bool YGNodeHasMeasureFunc(YGNodeConstRef node);

/**
 * Optional companion to `YGMeasureFunc` invoked by the CSS Flexbox §4.5
 * automatic minimum sizing path when probing this node for its min-content
 * size along the main axis.
 *
 * The signature mirrors `YGMeasureFunc`. The algorithm calls this with
 * `AtMost 0` along the probed axis and `Undefined` on the other. A
 * min-content-aware Primitive can return its true minimum (e.g., `Image`
 * and `Collection` along the scroll axis can return 0; text returns its
 * longest-word width; etc.) without doing a full measure pass.
 *
 * When unset, the algorithm falls back to the regular `YGMeasureFunc`
 * invoked with the same `AtMost 0` constraint — preserving today's
 * behavior. Setting this is a perf opt-in for Primitives whose min-content
 * size is cheap to compute or differs from what the regular measure would
 * return.
 */
typedef YGSize (*YGMinContentMeasureFunc)(
    YGNodeConstRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode);

/**
 * Provides a measure function specialised for min-content probes. See
 * `YGMinContentMeasureFunc`.
 */
YG_EXPORT void YGNodeSetMinContentMeasureFunc(
    YGNodeRef node,
    YGMinContentMeasureFunc minContentMeasureFunc);

/**
 * Whether a min-content measure function is set.
 */
YG_EXPORT bool YGNodeHasMinContentMeasureFunc(YGNodeConstRef node);

/**
 * Static per-axis min-content size used by the CSS Flexbox §4.5 automatic
 * minimum sizing probe. Pass `YGUndefined` to clear.
 *
 * When set, the algorithm's probe short-circuits at this node along the
 * matching axis — skipping both the regular `YGMeasureFunc` / `YGMinContent
 * MeasureFunc` callback path AND any container recursion. The most common
 * use is declaring "0" for axes that have no min-content contribution per
 * spec (e.g., images on both axes; scroll containers along their scroll
 * axis).
 *
 * Precedence inside the probe is:
 *   1. Static value via `YGNodeSetMinContentWidth/Height` (this API)
 *   2. Dynamic callback via `YGNodeSetMinContentMeasureFunc`
 *   3. Regular `YGMeasureFunc` with `AtMost 0` (today's default)
 *   4. Container recursion (sum on main axis, max on cross)
 *
 * Static is preferred for known-constant values because it skips the JNI
 * round-trip / native callback dispatch entirely.
 */
YG_EXPORT void YGNodeSetMinContentWidth(YGNodeRef node, float minContentWidth);
YG_EXPORT void YGNodeSetMinContentHeight(
    YGNodeRef node,
    float minContentHeight);

/**
 * Returns the static min-content size along the requested axis, or
 * `YGUndefined` if not set.
 */
YG_EXPORT float YGNodeGetMinContentWidth(YGNodeConstRef node);
YG_EXPORT float YGNodeGetMinContentHeight(YGNodeConstRef node);

/**
 * @returns a defined offset to baseline (ascent).
 */
typedef float (*YGBaselineFunc)(YGNodeConstRef node, float width, float height);

/**
 * Set a custom function for determining the text baseline for use in baseline
 * alignment.
 */
YG_EXPORT void YGNodeSetBaselineFunc(
    YGNodeRef node,
    YGBaselineFunc baselineFunc);

/**
 * Whether a baseline function is set.
 */
YG_EXPORT bool YGNodeHasBaselineFunc(YGNodeConstRef node);

/**
 * Sets this node should be considered the reference baseline among siblings.
 */
YG_EXPORT void YGNodeSetIsReferenceBaseline(
    YGNodeRef node,
    bool isReferenceBaseline);

/**
 * Whether this node is set as the reference baseline.
 */
YG_EXPORT bool YGNodeIsReferenceBaseline(YGNodeConstRef node);

/**
 * Sets whether a leaf node's layout results may be truncated during layout
 * rounding.
 */
YG_EXPORT void YGNodeSetNodeType(YGNodeRef node, YGNodeType nodeType);

/**
 * Whether a leaf node's layout results may be truncated during layout
 * rounding.
 */
YG_EXPORT YGNodeType YGNodeGetNodeType(YGNodeConstRef node);

/**
 * Make it so that this node will always form a containing block for any
 * descendant nodes. This is useful for when a node has a property outside of
 * of Yoga that will form a containing block. For example, transforms or some of
 * the others listed in
 * https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block
 */
YG_EXPORT void YGNodeSetAlwaysFormsContainingBlock(
    YGNodeRef node,
    bool alwaysFormsContainingBlock);

/**
 * Whether the node will always form a containing block for any descendant. This
 * can happen in situation where the client implements something like a
 * transform that can affect containing blocks but is not handled by Yoga
 * directly.
 */
YG_EXPORT bool YGNodeGetAlwaysFormsContainingBlock(YGNodeConstRef node);

/**
 * @deprecated
 */
YG_DEPRECATED(
    "YGNodeCanUseCachedMeasurement may be removed in a future version of Yoga")
YG_EXPORT bool YGNodeCanUseCachedMeasurement(
    YGMeasureMode widthMode,
    float availableWidth,
    YGMeasureMode heightMode,
    float availableHeight,
    YGMeasureMode lastWidthMode,
    float lastAvailableWidth,
    YGMeasureMode lastHeightMode,
    float lastAvailableHeight,
    float lastComputedWidth,
    float lastComputedHeight,
    float marginRow,
    float marginColumn,
    YGConfigRef config);

YG_EXTERN_C_END
