/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/components/view/ViewEventEmitter.h>

namespace facebook::react {

class TextInputEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  struct Metrics {
    std::string text;
    AttributedString::Range selectionRange;
    // ScrollView-like metrics
    Size contentSize;
    Point contentOffset;
    EdgeInsets contentInset;
    Size containerSize;
    int eventCount;
    Size layoutMeasurement;
    Float zoomScale;
    Tag target;
  };

  struct KeyPressMetrics {
    std::string text;
    int eventCount;
  };

  void onFocus(const Metrics& textInputMetrics) const;
  void onBlur(const Metrics& textInputMetrics) const;
  void onChange(const Metrics& textInputMetrics) const;
  void onContentSizeChange(const Metrics& textInputMetrics) const;
  void onSelectionChange(const Metrics& textInputMetrics) const;
  void onEndEditing(const Metrics& textInputMetrics) const;
  void onSubmitEditing(const Metrics& textInputMetrics) const;
  void onKeyPress(const KeyPressMetrics& keyPressMetrics) const;
  void onScroll(const Metrics& textInputMetrics) const;

 private:
  void dispatchTextInputEvent(
      const std::string& name,
      const Metrics& textInputMetrics,
      bool includeSelectionState = false) const;

  void dispatchTextInputContentSizeChangeEvent(
      const std::string& name,
      const Metrics& textInputMetrics) const;
};

} // namespace facebook::react
