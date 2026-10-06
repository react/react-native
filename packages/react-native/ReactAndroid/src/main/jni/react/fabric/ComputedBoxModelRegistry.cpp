/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComputedBoxModelRegistry.h"

namespace facebook::react {

void ComputedBoxModelRegistry::store(
    SurfaceId surfaceId,
    Tag viewTag,
    const EdgeInsets& marginInsets,
    const EdgeInsets& paddingInsets) {
  if (marginInsets == EdgeInsets::ZERO && paddingInsets == EdgeInsets::ZERO) {
    remove(surfaceId, viewTag);
    return;
  }
  std::lock_guard lock{mutex_};
  registry_[surfaceId][viewTag] = BoxModelData{marginInsets, paddingInsets};
}

std::optional<EdgeInsets> ComputedBoxModelRegistry::getMarginInsets(
    SurfaceId surfaceId,
    Tag viewTag) const {
  auto data = get(surfaceId, viewTag);
  return data ? std::optional<EdgeInsets>{data->marginInsets} : std::nullopt;
}

std::optional<EdgeInsets> ComputedBoxModelRegistry::getPaddingInsets(
    SurfaceId surfaceId,
    Tag viewTag) const {
  auto data = get(surfaceId, viewTag);
  return data ? std::optional<EdgeInsets>{data->paddingInsets} : std::nullopt;
}

void ComputedBoxModelRegistry::remove(SurfaceId surfaceId, Tag viewTag) {
  std::lock_guard lock{mutex_};
  auto surfaceIt = registry_.find(surfaceId);
  if (surfaceIt != registry_.end()) {
    surfaceIt->second.erase(viewTag);
    if (surfaceIt->second.empty()) {
      registry_.erase(surfaceIt);
    }
  }
}

void ComputedBoxModelRegistry::clearSurface(SurfaceId surfaceId) {
  std::lock_guard lock{mutex_};
  registry_.erase(surfaceId);
}

std::optional<BoxModelData> ComputedBoxModelRegistry::get(
    SurfaceId surfaceId,
    Tag viewTag) const {
  std::lock_guard lock{mutex_};
  auto surfaceIt = registry_.find(surfaceId);
  if (surfaceIt == registry_.end()) {
    return std::nullopt;
  }

  const auto& surfaceData = surfaceIt->second;
  auto it = surfaceData.find(viewTag);
  if (it == surfaceData.end()) {
    return std::nullopt;
  }

  return it->second;
}

} // namespace facebook::react
