/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/DynamicEventPayload.h>
#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/ReactPrimitives.h>

namespace facebook::react {

/*
 * Payload of PointerEvent sent from android native via JNI.
 */
struct DynamicPointerEvent : public DynamicEventPayload {
  explicit DynamicPointerEvent(folly::dynamic&& payload);

  const std::optional<std::vector<Tag>>& getHitPathForEventListener() const;

 private:
  std::optional<std::vector<Tag>> hitPathForEventListener_;
};

} // namespace facebook::react
