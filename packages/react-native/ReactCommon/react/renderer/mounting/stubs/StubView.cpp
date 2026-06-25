/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StubView.h"

#ifdef STUB_VIEW_TREE_VERBOSE
#include <glog/logging.h>
#endif

namespace facebook::react {

StubView::operator ShadowView() const {
  auto shadowView = ShadowView{};
  shadowView.componentName = componentName;
  shadowView.componentHandle = componentHandle;
  shadowView.surfaceId = surfaceId;
  shadowView.tag = tag;
  shadowView.props = props;
  shadowView.eventEmitter = eventEmitter;
  shadowView.layoutMetrics = layoutMetrics;
  shadowView.state = state;
  shadowView.traits = traits;
  return shadowView;
}

void StubView::update(const ShadowView& shadowView) {
  componentName = shadowView.componentName;
  componentHandle = shadowView.componentHandle;
  surfaceId = shadowView.surfaceId;
  tag = shadowView.tag;
  props = shadowView.props;
  eventEmitter = shadowView.eventEmitter;
  layoutMetrics = shadowView.layoutMetrics;
  state = shadowView.state;
  traits = shadowView.traits;
}

bool operator==(const StubView& lhs, const StubView& rhs) {
  if (lhs.props != rhs.props) {
#ifdef STUB_VIEW_TREE_VERBOSE
    LOG(ERROR) << "StubView: props do not match. lhs hash: "
               << std::hash<ShadowView>{}((ShadowView)lhs)
               << " rhs hash: " << std::hash<ShadowView>{}((ShadowView)rhs);
#endif
    return false;
  }
  if (lhs.layoutMetrics != rhs.layoutMetrics) {
#ifdef STUB_VIEW_TREE_VERBOSE
    LOG(ERROR) << "StubView: layoutMetrics do not match lhs hash: "
               << std::hash<ShadowView>{}((ShadowView)lhs)
               << " rhs hash: " << std::hash<ShadowView>{}((ShadowView)rhs);
#endif
    return false;
  }
  return true;
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const StubView& stubView) {
  return std::string{"Stub"} +
      std::string{
          stubView.componentHandle != 0 ? stubView.componentName : "[invalid]"};
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const StubView& stubView,
    DebugStringConvertibleOptions options) {
  return {
      {"surfaceId", getDebugDescription(stubView.surfaceId, options)},
      {"tag", getDebugDescription(stubView.tag, options)},
      {"props", getDebugDescription(stubView.props, options)},
      {"eventEmitter", getDebugDescription(stubView.eventEmitter, options)},
      {"layoutMetrics", getDebugDescription(stubView.layoutMetrics, options)},
      {"state", getDebugDescription(stubView.state, options)},
  };
}

std::vector<StubView> getDebugChildren(
    const StubView& stubView,
    DebugStringConvertibleOptions /*options*/) {
  std::vector<StubView> result;
  result.reserve(stubView.children.size());
  for (const auto& child : stubView.children) {
    result.push_back(*child);
  }
  return result;
}

#endif

} // namespace facebook::react
