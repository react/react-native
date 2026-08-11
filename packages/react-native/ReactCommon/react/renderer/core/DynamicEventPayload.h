/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/EventPayload.h>

namespace facebook::react {

/*
 * EventPayload sent from android native via JNI.
 */
struct DynamicEventPayload : public EventPayload {
  explicit DynamicEventPayload(folly::dynamic&& payload);

  static SharedEventPayload create(folly::dynamic&& payload);

  /*
   * EventPayload implementations
   */
  jsi::Value asJSIValue(jsi::Runtime& runtime) const override;
  EventPayloadType getType() const override;
  std::optional<double> extractValue(
      const std::vector<std::string>& path) const override;

 protected:
  folly::dynamic payload_;
};

} // namespace facebook::react
