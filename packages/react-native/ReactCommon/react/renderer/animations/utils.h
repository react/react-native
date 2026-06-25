/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/animations/primitives.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

namespace facebook::react {

static inline bool shouldFirstComeBeforeSecondRemovesOnly(
    const ShadowViewMutation &lhs,
    const ShadowViewMutation &rhs) noexcept
{
  // Make sure that removes on the same level are sorted - highest indices must
  // come first.
  return (lhs.type == ShadowViewMutation::Type::Remove && lhs.type == rhs.type) && (lhs.parentTag == rhs.parentTag) &&
      (lhs.index > rhs.index);
}

static inline void handleShouldFirstComeBeforeSecondRemovesOnly(ShadowViewMutation::List &list) noexcept
{
  std::unordered_map<std::string, std::vector<ShadowViewMutation>> removeMutationsByTag;
  ShadowViewMutation::List finalList;
  for (auto &mutation : list) {
    if (mutation.type == ShadowViewMutation::Type::Remove) {
      auto key = std::to_string(mutation.parentTag);
      removeMutationsByTag[key].push_back(mutation);
    } else {
      finalList.push_back(mutation);
    }
  }

  if (removeMutationsByTag.empty()) {
    return;
  }

  for (auto &mutationsPair : removeMutationsByTag) {
    if (mutationsPair.second.size() > 1) {
      std::stable_sort(
          mutationsPair.second.begin(), mutationsPair.second.end(), &shouldFirstComeBeforeSecondRemovesOnly);
    }
    finalList.insert(finalList.begin(), mutationsPair.second.begin(), mutationsPair.second.end());
  }

  list = finalList;
}

static inline bool shouldFirstComeBeforeSecondMutation(
    const ShadowViewMutation &lhs,
    const ShadowViewMutation &rhs) noexcept
{
  if (lhs.type != rhs.type) {
    // Deletes always come last
    if (lhs.type == ShadowViewMutation::Type::Delete) {
      return false;
    }
    if (rhs.type == ShadowViewMutation::Type::Delete) {
      return true;
    }

    // Remove comes before insert
    if (lhs.type == ShadowViewMutation::Type::Remove && rhs.type == ShadowViewMutation::Type::Insert) {
      return true;
    }
    if (rhs.type == ShadowViewMutation::Type::Remove && lhs.type == ShadowViewMutation::Type::Insert) {
      return false;
    }

    // Create comes before insert
    if (lhs.type == ShadowViewMutation::Type::Create && rhs.type == ShadowViewMutation::Type::Insert) {
      return true;
    }
    if (rhs.type == ShadowViewMutation::Type::Create && lhs.type == ShadowViewMutation::Type::Insert) {
      return false;
    }

    // Remove comes before Update
    if (lhs.type == ShadowViewMutation::Type::Remove && rhs.type == ShadowViewMutation::Type::Update) {
      return true;
    }
    if (rhs.type == ShadowViewMutation::Type::Remove && lhs.type == ShadowViewMutation::Type::Update) {
      return false;
    }

  } else {
    // Make sure that removes on the same level are sorted - highest indices
    // must come first.
    if (lhs.type == ShadowViewMutation::Type::Remove && lhs.parentTag == rhs.parentTag) {
      return lhs.index > rhs.index;
    }
  }

  // Deterministic fallback: when no type-specific rule applies, order by
  // mutation properties to satisfy strict weak ordering.
  if (lhs.parentTag != rhs.parentTag) {
    return lhs.parentTag < rhs.parentTag;
  }
  if (lhs.newChildShadowView.tag != rhs.newChildShadowView.tag) {
    return lhs.newChildShadowView.tag < rhs.newChildShadowView.tag;
  }
  if (lhs.oldChildShadowView.tag != rhs.oldChildShadowView.tag) {
    return lhs.oldChildShadowView.tag < rhs.oldChildShadowView.tag;
  }
  return false;
}

std::pair<Float, Float>
calculateAnimationProgress(uint64_t now, const LayoutAnimation &animation, const AnimationConfig &mutationConfig);

} // namespace facebook::react
