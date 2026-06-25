/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RenderOutput.h"
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/text/ParagraphState.h>
#include <react/renderer/core/ConcreteState.h>

namespace facebook::react {

std::string RenderOutput::render(
    const StubViewTree& tree,
    const RenderFormatOptions& options) {
  const auto& root = tree.getRootStubView();
  if (options.includeRoot) {
    return folly::toJson(renderView(root, options));
  }

  if (root.children.empty()) {
    return folly::toJson(folly::dynamic::array);
  }

  auto children = root.children;
  if (children.size() == 1) {
    return folly::toJson(renderView(*children.at(0), options));
  }

  folly::dynamic result = folly::dynamic::array;
  for (const auto& child : children) {
    result.push_back(renderView(*child, options));
  }

  treesMutated_.erase(tree.getRootStubView().surfaceId);
  return folly::toJson(result);
}

folly::dynamic RenderOutput::renderView(
    const StubView& view,
    const RenderFormatOptions& options) {
  folly::dynamic element = folly::dynamic::object;
  element["type"] = view.componentName;

#if RN_DEBUG_STRING_CONVERTIBLE
  folly::dynamic props = renderProps(view.props->getDebugProps());
#else
  folly::dynamic props = folly::dynamic::object;
#endif

  if (std::string_view(view.componentName) == "Paragraph") {
    const auto& state =
        static_cast<const ConcreteState<ParagraphState>&>(*view.state);
    element["children"] =
        renderAttributedString(view.tag, state.getData().attributedString);
  } else {
    element["children"] = folly::dynamic::array;
    for (const auto& child : view.children) {
      element["children"].push_back(renderView(*child, options));
    }
  }

#if RN_DEBUG_STRING_CONVERTIBLE
  if (options.includeLayoutMetrics) {
    for (const auto& prop :
         facebook::react::getDebugProps(view.layoutMetrics, {})) {
      props["layoutMetrics-" + prop.name] = prop.value;
    }
  }
#endif
  element["props"] = props;

  return element;
}

#if RN_DEBUG_STRING_CONVERTIBLE
folly::dynamic RenderOutput::renderProps(
    const SharedDebugStringConvertibleList& propsList) {
  folly::dynamic props = folly::dynamic::object;

  for (const auto& prop : propsList) {
    if (!prop) {
      continue;
    }

    props[prop->getDebugName()] = prop->getDebugValue();
  }
  return props;
}
#endif

folly::dynamic RenderOutput::renderAttributedString(
    const Tag& selfTag,
    const AttributedString& string) {
  folly::dynamic result = folly::dynamic::array;

  for (const auto& fragment : string.getFragments()) {
    if (fragment.parentShadowView.tag == selfTag) {
      result.push_back(fragment.string);
      continue;
    }

    folly::dynamic text = folly::dynamic::object;
    text["type"] = "Text";
    text["children"] = fragment.string;
#if RN_DEBUG_STRING_CONVERTIBLE
    text["props"] = renderProps(fragment.textAttributes.getDebugProps());
#else
    text["props"] = folly::dynamic::object;
#endif
    result.push_back(text);
  }
  return result;
}
} // namespace facebook::react
