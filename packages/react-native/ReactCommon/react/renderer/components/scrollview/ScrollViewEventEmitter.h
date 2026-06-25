/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/components/scrollview/ScrollEvent.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/core/EventEmitter.h>

namespace facebook::react {

class ScrollViewEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  using Metrics = ScrollEvent;
  using EndDragMetrics = ScrollEndDragEvent;

  void onScroll(const ScrollEvent &scrollEvent) const;
  void onScrollBeginDrag(const ScrollEvent &scrollEvent) const;
  void onScrollEndDrag(const ScrollEndDragEvent &scrollEvent) const;
  void onMomentumScrollBegin(const ScrollEvent &scrollEvent) const;
  void onMomentumScrollEnd(const ScrollEvent &scrollEvent) const;
  void onScrollToTop(const ScrollEvent &scrollEvent) const;

 private:
  void dispatchScrollViewEvent(std::string name, const ScrollEvent &scrollEvent) const;
};

} // namespace facebook::react
