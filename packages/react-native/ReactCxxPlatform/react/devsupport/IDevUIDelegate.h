/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Color.h>
#include <functional>
#include <string>

namespace facebook::react {

struct IDevUIDelegate {
  virtual ~IDevUIDelegate() noexcept = default;

  virtual void showDownloadBundleProgress() = 0;

  virtual void hideDownloadBundleProgress() = 0;

  virtual void showLoadingView(
      const std::string& message,
      SharedColor textColor,
      SharedColor backgroundColor) = 0;

  virtual void hideLoadingView() = 0;

  virtual void showDebuggerOverlay(
      std::function<void()>&& resumeDebuggerFn) = 0;

  virtual void hideDebuggerOverlay() = 0;
};

} // namespace facebook::react
