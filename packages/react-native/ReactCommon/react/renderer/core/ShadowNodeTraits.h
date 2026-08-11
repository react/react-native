/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>

namespace facebook::react {

/*
 * A set of predefined traits associated with a particular `ShadowNode` class
 * and an instance of that class. Used for efficient checking for interface
 * conformance for and storing important flags.
 */
class ShadowNodeTraits {
 public:
  /*
   * Underlying type for the traits.
   * The first 23 bits are reserved for Core.
   */
  enum Trait : int32_t {
    None = 0,

    // Note:
    // Not all traits are used yet (but all will be used in the near future).

    // Inherits `ConcreteViewShadowNode<>` template.
    ViewKind = 1 << 0,

    // Used when calculating relative layout in
    // LayoutableShadowNode::getRelativeLayoutMetrics. This trait marks node as
    // root, so when calculating relative layout, the calculation will not
    // traverse beyond this node. See T61257516 for details.
    RootNodeKind = 1 << 1,

    // The node is hidden.
    // Nodes with this trait (and all their descendants) will not produce views.
    Hidden = 1 << 2,

    // Inherits `YogaLayoutableShadowNode` and enforces that the yoga node is a
    // leaf.
    LeafYogaNode = 1 << 3,

    // Inherits `YogaLayoutableShadowNode` and has a custom measure function.
    // Only Leaf nodes can have this trait.
    MeasurableYogaNode = 1 << 4,

    // Indicates that the `ShadowNode` must form a stacking context.
    // A Stacking Context forms a level of a `ShadowView` hierarchy (in contrast
    // with a level of a `ShadowNode` hierarchy).
    // See W3C standard for more details: https://www.w3.org/TR/CSS2/zindex.html
    FormsStackingContext = 1 << 5,

    // Indicates that the node must form a `ShadowView`.
    FormsView = 1 << 6,

    // Internal to `ShadowNode`; do not use it outside.
    // Indicates that `children` list is shared between nodes and need
    // to be cloned before the first mutation.
    ChildrenAreShared = 1 << 7,

    // Indicates that direct children of the node should not be collapsed
    ChildrenFormStackingContext = 1 << 8,

    // Inherits `YogaLayoutableShadowNode` and has a custom baseline function.
    BaselineYogaNode = 1 << 9,

    // Forces the node not to form a host view.
    ForceFlattenView = 1 << 10,

    // Indicates if the node is keyboard focusable.
    KeyboardFocusable = 1 << 11,

    // Indicates if the node is uncullable. Apply this to your component
    // if it has side effects beyond just rendering (e.g. it opens a modal).
    Unstable_uncullableView = 1 << 12,

    // Must not be set directly. It is used by the view culling algorithm to
    // efficiently determine if a node is uncullable.
    Unstable_uncullableTrace = 1 << 13,

    // Indicates that the `YogaLayoutableShadowNode` must set `isDirty` flag for
    // Yoga node when a `ShadowNode` is being cloned. `ShadowNode`s that modify
    // Yoga styles in the constructor (or later) *after* the `ShadowNode`
    // is cloned must set this trait.
    // Any Yoga node (not only Leaf ones) can have this trait.
    // **Deprecated**: This trait is deprecated and will be removed in a future
    // version of React Native.
    DirtyYogaNode = 1 << 14,
  };

  /*
   * Sets, unsets, and checks individual traits.
   */
  inline void set(Trait trait) {
    traits_ = ShadowNodeTraits::Trait(traits_ | trait);
  }

  inline void unset(Trait trait) {
    traits_ = ShadowNodeTraits::Trait(traits_ & ~trait);
  }

  inline bool check(Trait traits) const {
    return ShadowNodeTraits::Trait(traits_ & traits) == traits;
  }

  inline Trait get() const {
    return traits_;
  }

 private:
  Trait traits_{Trait::None};
};

} // namespace facebook::react
