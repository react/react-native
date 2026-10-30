/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimatedPropsRegistry.h"
#include <react/debug/react_native_assert.h>
#include <react/renderer/core/PropsParserContext.h>
#include <utility>
#include "AnimatedProps.h"
#include "AnimatedPropsSerializer.h"

namespace facebook::react {

void mergeAnimatedRawProps(
    folly::dynamic& target,
    const folly::dynamic& source) {
  if (!target.isObject() || !source.isObject()) {
    target = source;
    return;
  }
  for (const auto& [key, value] : source.items()) {
    target[key] = value;
  }
}

void AnimatedPropsRegistry::update(
    const std::vector<FrontendMutations>& batches) {
  auto lock = std::lock_guard(mutex_);
  for (const auto& [commitDirectProps, mutations] : batches) {
    for (const auto& mutation : mutations.batch) {
      const auto& family = mutation.family;
      react_native_assert(family != nullptr);
      auto contextIt = surfaceContexts_.find(family->getSurfaceId());
      if (contextIt == surfaceContexts_.end()) {
        continue;
      }
      auto& surfaceContext = contextIt->second;
      // Without `commitDirectProps`, only layout values are written into React
      // commits, and the last values of animations by the end-of-animation
      // commit.
      if (!commitDirectProps && !mutation.hasLayoutUpdates) {
        forgetRawProps(surfaceContext, mutation);
        if (mutation.finishesAnimation) {
          auto& finalValues = surfaceContext.finalValues[mutation.tag];
          if (finalValues.props.isNull()) {
            finalValues.props = folly::dynamic::object();
          }
          finalValues.family = family;
          mergeAnimatedRawProps(
              finalValues.props,
              animationbackend::packAnimatedProps(mutation.props));
        }
        continue;
      }
      auto& pendingMap = surfaceContext.pendingMap;
      surfaceContext.pendingFamilies.insert(family);
      const auto tag = mutation.tag;
      const auto& animatedProps = mutation.props;
      auto it = pendingMap.find(tag);
      if (it == pendingMap.end()) {
        it = pendingMap.insert_or_assign(tag, std::make_unique<PropsSnapshot>())
                 .first;
      }
      auto& snapshot = it->second;
      if (animatedProps.rawProps) {
        const auto& newRawProps = *animatedProps.rawProps;
        auto& currentRawProps = snapshot->rawProps;

        if (currentRawProps) {
          if (const auto* dynamic = newRawProps.getDynamic()) {
            mergeAnimatedRawProps(*currentRawProps, *dynamic);
          } else {
            mergeAnimatedRawProps(*currentRawProps, newRawProps.toDynamic());
          }
        } else {
          currentRawProps =
              std::make_unique<folly::dynamic>(newRawProps.toDynamic());
        }
      }
      if (!animatedProps.props.empty() && !snapshot->props) {
        snapshot->props = std::make_unique<BaseViewProps>();
      }
      for (const auto& animatedProp : animatedProps.props) {
        snapshot->propNames.insert(animatedProp->propName);
        cloneProp(*snapshot->props, *animatedProp);
      }
    }
  }
}

void AnimatedPropsRegistry::forgetRawProps(
    SurfaceContext& surfaceContext,
    const AnimationMutation& mutation) {
  const auto& rawProps = mutation.props.rawProps;
  if (!rawProps) {
    return;
  }
  auto pendingIt = surfaceContext.pendingMap.find(mutation.tag);
  auto mapIt = surfaceContext.map.find(mutation.tag);
  if (pendingIt == surfaceContext.pendingMap.end() &&
      mapIt == surfaceContext.map.end()) {
    return;
  }
  folly::dynamic converted;
  const auto* values = rawProps->getDynamic();
  if (values == nullptr) {
    converted = rawProps->toDynamic();
    values = &converted;
  }
  if (pendingIt != surfaceContext.pendingMap.end() &&
      pendingIt->second->rawProps) {
    for (const auto& [key, _] : values->items()) {
      pendingIt->second->rawProps->erase(key);
    }
  }
  if (mapIt != surfaceContext.map.end() && mapIt->second->rawProps) {
    auto& keys = surfaceContext.staleRawKeys[mutation.tag];
    for (const auto& [key, _] : values->items()) {
      if (mapIt->second->rawProps->count(key) != 0) {
        keys.insert(key.asString());
      }
    }
  }
}

void AnimatedPropsRegistry::initializeSurface(SurfaceId surfaceId) {
  auto lock = std::lock_guard(mutex_);
  surfaceContexts_.try_emplace(surfaceId);
}

std::pair<
    std::unordered_set<std::shared_ptr<const ShadowNodeFamily>>&,
    SnapshotMap&>
AnimatedPropsRegistry::getMap(SurfaceId surfaceId) {
  auto lock = std::lock_guard(mutex_);
  auto& [pendingMap, map, pendingFamilies, families, finalValues, staleRawKeys] =
      surfaceContexts_[surfaceId];

  for (const auto& [tag, keys] : staleRawKeys) {
    if (auto it = map.find(tag); it != map.end() && it->second->rawProps) {
      for (const auto& key : keys) {
        it->second->rawProps->erase(key);
      }
    }
  }
  staleRawKeys.clear();

  for (auto& family : pendingFamilies) {
    families.insert(family);
  }
  for (auto& [tag, propsSnapshot] : pendingMap) {
    auto currentIt = map.find(tag);
    if (currentIt == map.end()) {
      map.insert_or_assign(tag, std::move(propsSnapshot));
    } else {
      auto& currentSnapshot = currentIt->second;
      if (propsSnapshot->rawProps) {
        if (currentSnapshot->rawProps) {
          mergeAnimatedRawProps(
              *currentSnapshot->rawProps, *propsSnapshot->rawProps);
        } else {
          currentSnapshot->rawProps = std::move(propsSnapshot->rawProps);
        }
      }
      if (!currentSnapshot->props) {
        currentSnapshot->props = std::move(propsSnapshot->props);
        currentSnapshot->propNames = std::move(propsSnapshot->propNames);
      } else {
        for (auto& propName : propsSnapshot->propNames) {
          currentSnapshot->propNames.insert(propName);
          updateProp(propName, *currentSnapshot->props, *propsSnapshot);
        }
      }
    }
  }
  pendingMap.clear();
  pendingFamilies.clear();

  return {families, map};
}

std::unordered_map<Tag, FinalValues> AnimatedPropsRegistry::takeFinalValues(
    SurfaceId surfaceId) {
  auto lock = std::lock_guard(mutex_);
  if (auto it = surfaceContexts_.find(surfaceId);
      it != surfaceContexts_.end()) {
    return std::exchange(it->second.finalValues, {});
  }
  return {};
}

void AnimatedPropsRegistry::restoreFinalValues(
    SurfaceId surfaceId,
    std::unordered_map<Tag, FinalValues> finalValues) {
  auto lock = std::lock_guard(mutex_);
  auto it = surfaceContexts_.find(surfaceId);
  if (it == surfaceContexts_.end()) {
    return;
  }
  for (auto& [tag, newer] : it->second.finalValues) {
    auto [restored, inserted] = finalValues.try_emplace(tag, std::move(newer));
    if (!inserted) {
      mergeAnimatedRawProps(restored->second.props, newer.props);
    }
  }
  it->second.finalValues = std::move(finalValues);
}

bool AnimatedPropsRegistry::scheduleAsyncFlush(SurfaceId surfaceId) {
  std::lock_guard lock(mutex_);
  return scheduledAsyncFlushSurfaces_.insert(surfaceId).second;
}

void AnimatedPropsRegistry::startAsyncFlush(SurfaceId surfaceId) {
  std::lock_guard lock(mutex_);
  scheduledAsyncFlushSurfaces_.erase(surfaceId);
}

void AnimatedPropsRegistry::clear(SurfaceId surfaceId) {
  auto lock = std::lock_guard(mutex_);
  if (auto it = surfaceContexts_.find(surfaceId);
      it != surfaceContexts_.end()) {
    auto& surfaceContext = it->second;
    surfaceContext.families.clear();
    surfaceContext.map.clear();
    surfaceContext.staleRawKeys.clear();
  }
}

void AnimatedPropsRegistry::clearOnSurfaceStop(SurfaceId surfaceId) {
  auto lock = std::lock_guard(mutex_);
  surfaceContexts_.erase(surfaceId);
}

} // namespace facebook::react
