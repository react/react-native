/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

class ShadowNode {
 public:
  struct Fragment {};
  struct Shared {};
  enum class Traits { None };
};

class ConcreteViewShadowNode : public ShadowNode {
 public:
  ConcreteViewShadowNode(const ShadowNode &source, const Fragment &fragment);
  ConcreteViewShadowNode(const Fragment &fragment, const Shared &family, Traits traits);
};

class BaseTextShadowNode : public ShadowNode {
 public:
  BaseTextShadowNode(const ShadowNode &source, const Fragment &fragment);
  BaseTextShadowNode(const Fragment &fragment, const Shared &family, Traits traits);
};

class ParagraphShadowNode : public ConcreteViewShadowNode, public BaseTextShadowNode {
 public:
  using BaseTextShadowNode::BaseTextShadowNode;
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
};

} // namespace test
