/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SynchronousTransformOverlay.h"

#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/core/RawValue.h>

#include <algorithm>

namespace facebook::react {

void SynchronousTransformOverlay::update(
    Tag tag,
    const folly::dynamic& props,
    const PropsParserContext& context) {
  if (!props.isObject()) {
    return;
  }

  auto entry = Entry{};

  if (auto* transform = props.get_ptr("transform"); transform != nullptr) {
    auto value = Transform{};
    fromRawValue(context, RawValue(*transform), value);
    entry.transform = std::move(value);
  }

  if (auto* transformOrigin = props.get_ptr("transformOrigin");
      transformOrigin != nullptr) {
    auto value = TransformOrigin{};
    fromRawValue(context, RawValue(*transformOrigin), value);
    entry.transformOrigin = value;
  }

  updateEntry(tag, std::move(entry));
}

void SynchronousTransformOverlay::updateEntry(Tag tag, Entry&& entry) {
  if (!entry.transform.has_value() && !entry.transformOrigin.has_value()) {
    return;
  }

  std::unique_lock lock(mutex_);
  auto& existing = entries_[tag];
  // A partial update (e.g. only `transformOrigin`) keeps the other half of
  // the previous entry, mirroring how the mounted view merges props.
  if (entry.transform.has_value()) {
    existing.transform = std::move(entry.transform);
  }
  if (entry.transformOrigin.has_value()) {
    existing.transformOrigin = entry.transformOrigin;
  }
  size_.store(entries_.size(), std::memory_order_relaxed);
}

void SynchronousTransformOverlay::remove(Tag tag) {
  std::unique_lock lock(mutex_);
  entries_.erase(tag);
  size_.store(entries_.size(), std::memory_order_relaxed);
}

void SynchronousTransformOverlay::clear() {
  std::unique_lock lock(mutex_);
  entries_.clear();
  pruneThreshold_ = kInitialPruneThreshold;
  size_.store(0, std::memory_order_relaxed);
}

bool SynchronousTransformOverlay::isEmpty() const {
  return size_.load(std::memory_order_relaxed) == 0;
}

bool SynchronousTransformOverlay::needsPruning() const {
  std::shared_lock lock(mutex_);
  return entries_.size() >= pruneThreshold_;
}

void SynchronousTransformOverlay::prune(
    const std::function<bool(Tag)>& isAlive) {
  std::unique_lock lock(mutex_);
  for (auto it = entries_.begin(); it != entries_.end();) {
    if (isAlive(it->first)) {
      ++it;
    } else {
      it = entries_.erase(it);
    }
  }
  // Prune again only once the overlay doubled, so that a steady set of
  // animated views does not trigger a tree walk on every commit.
  pruneThreshold_ = std::max(kInitialPruneThreshold, entries_.size() * 2);
  size_.store(entries_.size(), std::memory_order_relaxed);
}

std::optional<Transform> SynchronousTransformOverlay::getTransformOverride(
    const LayoutableShadowNode& shadowNode) const {
  if (isEmpty()) {
    return std::nullopt;
  }

  auto entry = Entry{};
  {
    std::shared_lock lock(mutex_);
    auto it = entries_.find(shadowNode.getTag());
    if (it == entries_.end()) {
      return std::nullopt;
    }
    entry = it->second;
  }

  // The overlay only holds what was written synchronously; the committed
  // props fill in whatever half of the (transform, transformOrigin) pair was
  // not overridden, which is also what the mounted view does.
  const auto* viewProps =
      dynamic_cast<const BaseViewProps*>(shadowNode.getProps().get());

  const auto& transform = entry.transform.has_value() ? *entry.transform
      : viewProps != nullptr                          ? viewProps->transform
                                                      : Transform::Identity();
  const auto& transformOrigin = entry.transformOrigin.has_value()
      ? *entry.transformOrigin
      : viewProps != nullptr ? viewProps->transformOrigin
                             : TransformOrigin{};

  return BaseViewProps::resolveTransform(
      shadowNode.getLayoutMetrics().frame.size, transform, transformOrigin);
}

} // namespace facebook::react
