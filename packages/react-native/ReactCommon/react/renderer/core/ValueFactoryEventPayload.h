/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/ValueFactory.h>

namespace facebook::react {

class ValueFactoryEventPayload : public EventPayload {
 public:
  explicit ValueFactoryEventPayload(ValueFactory factory);
  jsi::Value asJSIValue(jsi::Runtime& runtime) const override;
  EventPayloadType getType() const override;

 private:
  ValueFactory valueFactory_;
};

} // namespace facebook::react
