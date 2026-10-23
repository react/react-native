/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <folly/dynamic.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/graphics/Transform.h>

#include <atomic>
#include <functional>
#include <optional>
#include <shared_mutex>
#include <unordered_map>

namespace facebook::react {

/*
 * Keeps track of `transform` (and `transformOrigin`) values that were applied
 * to mounted views synchronously on the UI thread, bypassing the ShadowTree
 * (see `UIManager::synchronouslyUpdateViewOnUIThread`). Native-driven
 * animations use that path for non-layout props, so the committed ShadowTree
 * lags behind what is on the screen until the animation system commits the
 * final values.
 *
 * Layout queries (`measure`, `measureInWindow`, `getBoundingClientRect`,
 * `findNodeAtPoint`, `UIManager::getRelativeLayoutMetrics`) consult the
 * overlay through the `TransformOverrideProvider` interface, so they describe
 * the mounted views rather than the stale committed props. Only `transform`
 * is tracked because it is the only synchronously updated prop that affects
 * geometry; layout props always go through a commit.
 *
 * An entry lives until the view is deleted (entries are pruned lazily, see
 * `prune`) or until the system that wrote it stops managing the view and
 * calls `remove`. Writers run on the UI thread, readers on any thread.
 */
class SynchronousTransformOverlay final : public LayoutableShadowNode::TransformOverrideProvider {
 public:
  /*
   * Records the `transform` / `transformOrigin` entries of `props`, if any.
   * Other props are ignored. Values are parsed exactly like the ShadowNode
   * props would be, so the overlay matches what a commit would produce.
   */
  void update(Tag tag, const folly::dynamic &props, const PropsParserContext &context);

  /*
   * Drops the entry for `tag`, if any. Called by the systems that write
   * synchronous props when they stop managing a view, and by `prune`.
   */
  void remove(Tag tag);

  void clear();

  /*
   * Returns `true` when there are no entries. Cheap, lock-free; used to skip
   * the lookups in the layout queries when nothing was written synchronously.
   */
  bool isEmpty() const;

  /*
   * Returns `true` when enough entries accumulated since the last `prune` to
   * make it worth walking the shadow trees for deleted views.
   */
  bool needsPruning() const;

  /*
   * Removes the entries whose tags are not reported as alive by `isAlive`.
   */
  void prune(const std::function<bool(Tag)> &isAlive);

#pragma mark - TransformOverrideProvider

  /*
   * Returns the transform that the mounted view for `shadowNode` has, resolved
   * against the node's layout metrics the same way
   * `ConcreteViewShadowNode::getTransform` resolves committed props. Returns
   * `std::nullopt` when there is no entry for the node.
   */
  std::optional<Transform> getTransformOverride(const LayoutableShadowNode &shadowNode) const override;

 private:
  struct Entry {
    std::optional<Transform> transform;
    std::optional<TransformOrigin> transformOrigin;
  };

  void updateEntry(Tag tag, Entry &&entry);

  mutable std::shared_mutex mutex_;
  std::unordered_map<Tag, Entry> entries_;
  std::atomic<size_t> size_{0};
  size_t pruneThreshold_{kInitialPruneThreshold};

  static constexpr size_t kInitialPruneThreshold = 64;
};

} // namespace facebook::react
