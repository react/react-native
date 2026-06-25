/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawEvent.h"

namespace facebook::react {

RawEvent::RawEvent(
    std::string type,
    SharedEventPayload eventPayload,
    SharedEventTarget eventTarget,
    std::weak_ptr<const ShadowNodeFamily> shadowNodeFamily,
    Category category,
    bool isUnique,
    HighResTimeStamp eventStartTimeStamp)
    : type(std::move(type)),
      eventPayload(std::move(eventPayload)),
      eventTarget(std::move(eventTarget)),
      shadowNodeFamily(std::move(shadowNodeFamily)),
      category(category),
      isUnique(isUnique),
      eventStartTimeStamp(eventStartTimeStamp) {}

} // namespace facebook::react
