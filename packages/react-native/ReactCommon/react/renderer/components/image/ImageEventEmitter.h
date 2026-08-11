/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

class ImageEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onLoadStart() const;
  void onLoad(const ImageSource& source) const;
  void onLoadEnd() const;
  void onProgress(double progress, int64_t loaded, int64_t total) const;
  void onError(const ImageErrorInfo& error) const;
  void onPartialLoad() const;
};

} // namespace facebook::react
