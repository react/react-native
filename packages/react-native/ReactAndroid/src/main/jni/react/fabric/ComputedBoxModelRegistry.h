/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <optional>
#include <unordered_map>

#include <react/renderer/graphics/RectangleEdges.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook::react {

/*
 * Stores box model data (margins and paddings) for a view.
 */
struct BoxModelData {
  EdgeInsets marginInsets{};
  EdgeInsets paddingInsets{};

  bool operator==(const BoxModelData &other) const {
    return marginInsets == other.marginInsets && paddingInsets == other.paddingInsets;
  }

  bool operator!=(const BoxModelData &other) const {
    return !(*this == other);
  }
};

/*
 * ComputedBoxModelRegistry stores computed margin and padding values for views
 * that need them. This is required for clip-path geometry box calculations including 
 * margin-box and content-box.
 */
class ComputedBoxModelRegistry final {
 public:
  ComputedBoxModelRegistry() = default;
  ComputedBoxModelRegistry(const ComputedBoxModelRegistry&) = delete;
  ComputedBoxModelRegistry &operator=(const ComputedBoxModelRegistry&) = delete;

  /*
   * Stores both margins and paddings for a view.
   */
  void store(
      SurfaceId surfaceId,
      Tag viewTag,
      const EdgeInsets &marginInsets,
      const EdgeInsets &paddingInsets);

  /*
   * Retrieves computed margins for a view on a given surface.
   * Returns std::nullopt if margins are not found.
   */
  std::optional<EdgeInsets> getMarginInsets(SurfaceId surfaceId, Tag viewTag) const;

  /*
   * Retrieves computed paddings for a view on a given surface.
   * Returns std::nullopt if paddings are not found.
   */
  std::optional<EdgeInsets> getPaddingInsets(SurfaceId surfaceId, Tag viewTag) const;

  /*
   * Removes box model data for a specific view on a given surface.
   */
  void remove(SurfaceId surfaceId, Tag viewTag);

  /*
   * Clears all box model data for a given surface.
   */
  void clearSurface(SurfaceId surfaceId);

 private:
  std::optional<BoxModelData> get(SurfaceId surfaceId, Tag viewTag) const;

  mutable std::mutex mutex_;
  std::unordered_map<SurfaceId, std::unordered_map<Tag, BoxModelData>> registry_{};
};

} // namespace facebook::react
