/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseViewEventEmitter.h"

namespace facebook::react {

#pragma mark - Accessibility

void BaseViewEventEmitter::onAccessibilityAction(
    const std::string& name) const {
  dispatchEvent("accessibilityAction", [name](jsi::Runtime& runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "actionName", name);
    return payload;
  });
}

void BaseViewEventEmitter::onAccessibilityTap() const {
  dispatchEvent("accessibilityTap");
}

void BaseViewEventEmitter::onAccessibilityMagicTap() const {
  dispatchEvent("magicTap");
}

void BaseViewEventEmitter::onAccessibilityEscape() const {
  dispatchEvent("accessibilityEscape");
}

#pragma mark - Safe area

void BaseViewEventEmitter::onSafeAreaInsetsChange(
    const EdgeInsets& insets,
    const Rect& frame) const {
  // Dispatched synchronously and as a discrete event so that React processes it
  // before the current frame is presented. Both the thread this is called from
  // (the UI thread) and the JavaScript thread are blocked until React has
  // finished rendering.
  experimental_flushSync([this, insets, frame]() {
    dispatchEvent(
        "safeAreaInsetsChange",
        [insets, frame](jsi::Runtime& runtime) {
          auto payload = jsi::Object(runtime);
          {
            auto insetsPayload = jsi::Object(runtime);
            insetsPayload.setProperty(runtime, "top", insets.top);
            insetsPayload.setProperty(runtime, "right", insets.right);
            insetsPayload.setProperty(runtime, "bottom", insets.bottom);
            insetsPayload.setProperty(runtime, "left", insets.left);
            payload.setProperty(runtime, "insets", insetsPayload);
          }
          {
            auto framePayload = jsi::Object(runtime);
            framePayload.setProperty(runtime, "x", frame.origin.x);
            framePayload.setProperty(runtime, "y", frame.origin.y);
            framePayload.setProperty(runtime, "width", frame.size.width);
            framePayload.setProperty(runtime, "height", frame.size.height);
            payload.setProperty(runtime, "frame", framePayload);
          }
          return payload;
        },
        RawEvent::Category::Discrete);
  });
}

#pragma mark - Layout

void BaseViewEventEmitter::onLayout(const LayoutMetrics& layoutMetrics) const {
  // A copy of a shared pointer (`layoutEventState_`) establishes shared
  // ownership that will be captured by lambda.
  auto layoutEventState = layoutEventState_;

  // Dispatched `frame` values to JavaScript thread are throttled here.
  // Basic ideas:
  //  - Scheduling a lambda with some value that already was dispatched, does
  //    nothing.
  //  - If some lambda is already in flight, we don't schedule another;
  //  - When a lambda is being executed on the JavaScript thread, the *most
  //    recent* `frame` value is used (not the value that was current at the
  //    moment of scheduling the lambda).
  //
  // This implies the following caveats:
  //  - Some events can be skipped;
  //  - When values change rapidly, even events with different values
  //    can be skipped (only the very last will be delivered).
  //  - Ordering is preserved.

  {
    std::scoped_lock guard(layoutEventState->mutex);

    // If a *particular* `frame` was already dispatched to the JavaScript side,
    // no other work is required.
    if (layoutEventState->frame == layoutMetrics.frame &&
        layoutEventState->wasDispatched) {
      return;
    }

    // If the *particular* `frame` was not already dispatched *or*
    // some *other* `frame` was dispatched before,
    // we need to schedule the dispatching.
    layoutEventState->wasDispatched = false;
    layoutEventState->frame = layoutMetrics.frame;

    // Something is already in flight, dispatching another event is not
    // required.
    if (layoutEventState->isDispatching) {
      return;
    }

    layoutEventState->isDispatching = true;
  }

  dispatchEvent("layout", [layoutEventState](jsi::Runtime& runtime) {
    auto frame = Rect{};

    {
      std::scoped_lock guard(layoutEventState->mutex);

      layoutEventState->isDispatching = false;

      // If some *particular* `frame` was already dispatched before,
      // and since then there were no other new values of the `frame`
      // observed, do nothing.
      if (layoutEventState->wasDispatched) {
        return jsi::Value::null();
      }

      frame = layoutEventState->frame;

      // If some *particular* `frame` was *not* already dispatched before,
      // it's time to dispatch it and mark as dispatched.
      layoutEventState->wasDispatched = true;
    }

    auto layout = jsi::Object(runtime);
    layout.setProperty(runtime, "x", frame.origin.x);
    layout.setProperty(runtime, "y", frame.origin.y);
    layout.setProperty(runtime, "width", frame.size.width);
    layout.setProperty(runtime, "height", frame.size.height);
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "layout", std::move(layout));
    return jsi::Value(std::move(payload));
  });
}

#pragma mark - Focus
void BaseViewEventEmitter::onFocus() const {
  dispatchEvent("focus");
}

void BaseViewEventEmitter::onBlur() const {
  dispatchEvent("blur");
}

} // namespace facebook::react
