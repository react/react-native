/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <react/renderer/components/view/ViewEventEmitter.h>

namespace facebook::react {

// This emitter exists only as a placeholder and is not used for communication
// with JS.
//
// See:
// - EventEmitterWrapper::invokeEvent for the Android event emitter dispatch
// - ReactTextInputManager.java for the text input events used on Android
class AndroidTextInputEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;
};

} // namespace facebook::react
