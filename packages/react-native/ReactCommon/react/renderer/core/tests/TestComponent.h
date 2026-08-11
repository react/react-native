/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/ShadowNode.h>

/**
 * This defines a set of TestComponent classes: Props, ShadowNode,
 * ComponentDescriptor. To be used for testing purpose.
 */

namespace facebook::react {

struct TestState {
  TestState() = default;

#ifdef ANDROID
  TestState(const TestState& previousState, folly::dynamic&& data){};

  folly::dynamic getDynamic() const {
    return {};
  }
#endif
};

// NOLINTNEXTLINE(modernize-avoid-c-arrays)
static const char TestComponentName[] = "Test";

class TestProps : public ViewProps {
 public:
  TestProps() = default;

  TestProps(
      const PropsParserContext& context,
      const TestProps& sourceProps,
      const RawProps& rawProps)
      : ViewProps(context, sourceProps, rawProps) {}
};

using SharedTestProps = std::shared_ptr<const TestProps>;

class TestShadowNode;

using SharedTestShadowNode = std::shared_ptr<const TestShadowNode>;

class TestShadowNode final : public ConcreteViewShadowNode<
                                 TestComponentName,
                                 TestProps,
                                 ViewEventEmitter,
                                 TestState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  Transform _transform{Transform::Identity()};

  Transform getTransform() const override {
    return _transform;
  }

  facebook::react::Point _contentOriginOffset{};

  facebook::react::Point getContentOriginOffset(
      bool /*includeTransform*/) const override {
    return _contentOriginOffset;
  }
};

class TestComponentDescriptor
    : public ConcreteComponentDescriptor<TestShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace facebook::react
