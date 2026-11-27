/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/mounting/ShadowViewMutation.h>

#include <algorithm>
#include <iterator>
#include <unordered_set>

namespace facebook::react {
namespace {

inline bool requiresStrictMountItemOrder(const ShadowViewMutationList &mutations)
{
  auto firstDelete = std::find_if(mutations.begin(), mutations.end(), [](const auto &mutation) {
    return mutation.type == ShadowViewMutation::Delete;
  });
  if (firstDelete == mutations.end() || std::none_of(std::next(firstDelete), mutations.end(), [](const auto &mutation) {
        return mutation.type == ShadowViewMutation::Create;
      })) {
    return false;
  }

  // Do not allocate a set for ordinary mount-only or unmount-only batches.
  std::unordered_set<Tag> deletedTags;
  for (auto it = firstDelete; it != mutations.end(); ++it) {
    const auto &mutation = *it;
    if (mutation.type == ShadowViewMutation::Delete) {
      deletedTags.insert(mutation.oldChildShadowView.tag);
    } else if (mutation.type == ShadowViewMutation::Create && deletedTags.contains(mutation.newChildShadowView.tag)) {
      // Moving deletes to the end would delete this tag's new native view.
      return true;
    }
  }
  return false;
}

} // namespace
} // namespace facebook::react
