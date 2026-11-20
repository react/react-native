/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "TransformAnimatedNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>
#include <utility>

namespace facebook::react {

static constexpr std::string_view sTransformsName{"transforms"};
static constexpr std::string_view sPropertyName{"property"};
static constexpr std::string_view sTypeName{"type"};
static constexpr std::string_view sAnimatedName{"animated"};
static constexpr std::string_view sNodeTagName{"nodeTag"};
static constexpr std::string_view sValueName{"value"};
static constexpr std::string_view sTransformPropName{"transform"};

TransformAnimatedNode::TransformAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : AnimatedNode(tag, config, manager, AnimatedNodeType::Transform) {}

void TransformAnimatedNode::collectViewUpdates(folly::dynamic& props) {
  folly::dynamic transforms = folly::dynamic::array();
  auto transformsArray = getConfig()[sTransformsName];
  react_native_assert(transformsArray.type() == folly::dynamic::ARRAY);
  for (const auto& transform : transformsArray) {
    std::optional<double> value;
    if (transform[sTypeName].asString() == sAnimatedName) {
      const auto inputTag = static_cast<Tag>(transform[sNodeTagName].asInt());
      if (const auto node =
              manager_->getAnimatedNode<ValueAnimatedNode>(inputTag)) {
        value = node->getValue();
      }
    } else if (const auto* staticValue = transform.get_ptr(sValueName);
               staticValue != nullptr && staticValue->isNumber()) {
      // JS omits the key when the static value is `undefined`; throwing here
      // would escape the noexcept callers and abort the app.
      value = staticValue->asDouble();
    }
    if (value) {
      const auto property = transform[sPropertyName].asString();
      transforms.push_back(folly::dynamic::object(property, value.value()));
    }
  }
  props[sTransformPropName] = std::move(transforms);
}

} // namespace facebook::react
