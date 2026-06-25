/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#pragma once

#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

class EventAnimationDriver {
 public:
  EventAnimationDriver(const std::vector<std::string> &eventPath, Tag animatedValueTag);

  ~EventAnimationDriver() = default;

  std::optional<double> getValueFromPayload(const EventPayload &eventPayload);

  Tag getAnimatedNodeTag() const
  {
    return animatedValueTag_;
  }

 protected:
  std::vector<std::string> eventPath_;

  const Tag animatedValueTag_;
};

struct EventAnimationDriverKey {
  Tag viewTag;
  std::string eventName;

  bool operator==(const facebook::react::EventAnimationDriverKey &rhs) const noexcept
  {
    return viewTag == rhs.viewTag && eventName == rhs.eventName;
  }
};

} // namespace facebook::react

namespace std {
template <>
struct hash<facebook::react::EventAnimationDriverKey> {
  size_t operator()(const facebook::react::EventAnimationDriverKey &key) const
  {
    return std::hash<facebook::react::Tag>()(key.viewTag) ^ std::hash<std::string>()(key.eventName);
  }
};
} // namespace std
