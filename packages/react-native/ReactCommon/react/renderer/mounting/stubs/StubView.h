/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/State.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/renderer/mounting/ShadowView.h>

namespace facebook::react {

static const int NO_VIEW_TAG = -1;

class StubView final {
 public:
  using Shared = std::shared_ptr<StubView>;

  StubView() = default;
  StubView(const StubView &stubView) = default;

  operator ShadowView() const;

  void update(const ShadowView &shadowView);

  ComponentName componentName;
  ComponentHandle componentHandle;
  SurfaceId surfaceId;
  Tag tag;
  ShadowNodeTraits traits{};
  Props::Shared props;
  SharedEventEmitter eventEmitter;
  LayoutMetrics layoutMetrics;
  State::Shared state;
  std::vector<StubView::Shared> children;
  Tag parentTag{NO_VIEW_TAG};
};

bool operator==(const StubView &lhs, const StubView &rhs);

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const StubView &stubView);

std::vector<DebugStringConvertibleObject> getDebugProps(
    const StubView &stubView,
    DebugStringConvertibleOptions options);
std::vector<StubView> getDebugChildren(const StubView &stubView, DebugStringConvertibleOptions options);

#endif

} // namespace facebook::react
