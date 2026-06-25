/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventTarget.h"

namespace facebook::react {

using Tag = EventTarget::Tag;

EventTarget::EventTarget(
    InstanceHandle::Shared instanceHandle,
    SurfaceId surfaceId)
    : instanceHandle_(std::move(instanceHandle)),
      surfaceId_(surfaceId),
      strongInstanceHandle_(jsi::Value::null()) {}

void EventTarget::setEnabled(bool enabled) {
  enabled_ = enabled;
}

void EventTarget::retain(jsi::Runtime& runtime) {
  if (!enabled_) {
    return;
  }

  if (retainCount_ == 0) {
    strongInstanceHandle_ = instanceHandle_->getInstanceHandle(runtime);
  }
  retainCount_ += 1;

  // Having a `null` or `undefined` object here indicates that
  // `weakInstanceHandle_` was already deallocated. This should *not* happen by
  // design, and if it happens it's a severe problem. This basically means that
  // particular implementation of JSI was able to detect this inconsistency and
  // dealt with it, but some JSI implementation may not support this feature and
  // that case will lead to a crash in those environments.

  // TODO: Replace with mustfix once mustfix is ready in React Native.
  // react_native_assert(!strongInstanceHandle_.isNull());
  // react_native_assert(!strongInstanceHandle_.isUndefined());
}

void EventTarget::release(jsi::Runtime& /*runtime*/) {
  // The method does not use `jsi::Runtime` reference.
  // It takes it only to ensure thread-safety (if the caller has the reference,
  // we are on a proper thread).

  // retainCount_ is unsigned. retain() early-returns when the target is
  // disabled but the matching release() still runs, so we can land here with
  // a zero count; an unconditional decrement would wrap to SIZE_MAX and the
  // strong handle would never be cleared again.
  if (retainCount_ > 0) {
    --retainCount_;
  }
  if (retainCount_ == 0) {
    strongInstanceHandle_ = jsi::Value::null();
  }
}

jsi::Value EventTarget::getInstanceHandle(jsi::Runtime& runtime) const {
  if (strongInstanceHandle_.isNull()) {
    // The `instanceHandle` is not retained.
    return jsi::Value::null();
  }

  return jsi::Value(runtime, strongInstanceHandle_);
}

SurfaceId EventTarget::getSurfaceId() const {
  return surfaceId_;
}

Tag EventTarget::getTag() const {
  return instanceHandle_->getTag();
}

} // namespace facebook::react
