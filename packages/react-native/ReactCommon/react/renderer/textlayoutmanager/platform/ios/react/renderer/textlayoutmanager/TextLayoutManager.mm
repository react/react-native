/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "TextLayoutManager.h"
#import "RCTTextLayoutManager.h"

#import <react/renderer/attributedstring/PlaceholderAttributedString.h>
#import <react/renderer/telemetry/TransactionTelemetry.h>
#import <react/utils/ManagedObjectWrapper.h>

namespace facebook::react {

TextLayoutManager::TextLayoutManager(const std::shared_ptr<const ContextContainer> & /*contextContainer*/)
{
  nativeTextLayoutManager_ = wrapManagedObject([RCTTextLayoutManager new]);
}

std::shared_ptr<void> TextLayoutManager::getNativeTextLayoutManager() const
{
  assert(nativeTextLayoutManager_ && "Stored NativeTextLayoutManager must not be null.");
  return nativeTextLayoutManager_;
}

TextMeasurement TextLayoutManager::measure(
    const AttributedStringBox &attributedStringBox,
    const ParagraphAttributes &paragraphAttributes,
    const TextLayoutContext &layoutContext,
    const LayoutConstraints &layoutConstraints) const
{
  RCTTextLayoutManager *textLayoutManager = (RCTTextLayoutManager *)unwrapManagedObject(nativeTextLayoutManager_);

  auto measurement = TextMeasurement{};

  switch (attributedStringBox.getMode()) {
    case AttributedStringBox::Mode::Value: {
      auto originalAtributedString = attributedStringBox.getValue();
      auto attributedString = ensurePlaceholderIfEmpty_DO_NOT_USE(originalAtributedString);

      measurement = textMeasureCache_.get(
          {.attributedString = attributedString,
           .paragraphAttributes = paragraphAttributes,
           .layoutConstraints = layoutConstraints,
           .pointScaleFactor = layoutContext.pointScaleFactor},
          [&]() {
            auto telemetry = TransactionTelemetry::threadLocalTelemetry();
            if (telemetry) {
              telemetry->willMeasureText();
            }

            auto measurement = [textLayoutManager measureAttributedString:attributedString
                                                      paragraphAttributes:paragraphAttributes
                                                            layoutContext:layoutContext
                                                        layoutConstraints:layoutConstraints];

            // TODO(D63303709): We compensate for the placeholder character
            // being used to represent empty string. iOS TextLayoutManager
            // should instead measure using `baseTextAttributes` of the
            // `AttributedString`.
            if (originalAtributedString.isEmpty()) {
              measurement.size.width = 0;
            }

            if (telemetry) {
              telemetry->didMeasureText();
            }

            return measurement;
          });
      break;
    }

    case AttributedStringBox::Mode::OpaquePointer: {
      NSAttributedString *nsAttributedString =
          (NSAttributedString *)unwrapManagedObject(attributedStringBox.getOpaquePointer());

      auto telemetry = TransactionTelemetry::threadLocalTelemetry();
      if (telemetry != nullptr) {
        telemetry->willMeasureText();
      }

      measurement = [textLayoutManager measureNSAttributedString:nsAttributedString
                                             paragraphAttributes:paragraphAttributes
                                                   layoutContext:layoutContext
                                               layoutConstraints:layoutConstraints];

      if (telemetry != nullptr) {
        telemetry->didMeasureText();
      }

      break;
    }
  }

  measurement.size = layoutConstraints.clamp(measurement.size);

  return measurement;
}

LinesMeasurements TextLayoutManager::measureLines(
    const AttributedStringBox &attributedStringBox,
    const ParagraphAttributes &paragraphAttributes,
    const Size &size) const
{
  react_native_assert(attributedStringBox.getMode() == AttributedStringBox::Mode::Value);
  auto attributedString = ensurePlaceholderIfEmpty_DO_NOT_USE(attributedStringBox.getValue());

  RCTTextLayoutManager *textLayoutManager = (RCTTextLayoutManager *)unwrapManagedObject(nativeTextLayoutManager_);

  auto measurement = lineMeasureCache_.get(
      {.attributedString = attributedString, .paragraphAttributes = paragraphAttributes, .size = size}, [&]() {
        auto measurement = [textLayoutManager getLinesForAttributedString:attributedString
                                                      paragraphAttributes:paragraphAttributes
                                                                     size:{size.width, size.height}];
        return measurement;
      });

  return measurement;
}

} // namespace facebook::react
