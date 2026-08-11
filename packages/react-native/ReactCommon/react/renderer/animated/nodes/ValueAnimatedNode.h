/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#pragma once

#include "AnimatedNode.h"

#include <vector>

namespace facebook::react {

using ValueListenerCallback = std::function<void(double)>;

class ValueAnimatedNode : public AnimatedNode {
 public:
  ValueAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);
  double getValue() const noexcept;
  double getRawValue() const noexcept;
  bool setRawValue(double value) noexcept;
  double getOffset() const noexcept;
  bool setOffset(double offset) noexcept;
  void flattenOffset() noexcept;
  void extractOffset() noexcept;
  void setValueListener(ValueListenerCallback&& callback) noexcept;

  bool getIsColorValue() const noexcept {
    return isColorValue_;
  }

 protected:
  bool isColorValue_{false};

 private:
  void onValueUpdate() noexcept;

  double value_{0.0};
  double offset_{0.0};
  ValueListenerCallback valueListener_{};
};

class OperatorAnimatedNode : public ValueAnimatedNode {
 public:
  OperatorAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);

 protected:
  std::vector<Tag> inputNodes_{};
};

} // namespace facebook::react
