/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "TextLayoutManager.h"
#import "RCTTextLayoutManager.h"

#import <optional>

#import <react/renderer/attributedstring/PlaceholderAttributedString.h>
#import <react/renderer/telemetry/TransactionTelemetry.h>
#import <react/utils/ManagedObjectWrapper.h>

namespace facebook::react {

// `ensurePlaceholderIfEmpty_DO_NOT_USE` returns a copy, so only call it for an empty string that needs one.
static std::optional<AttributedString> placeholderIfEmpty(const AttributedString &attributedString)
{
  if (attributedString.isEmpty()) {
    return ensurePlaceholderIfEmpty_DO_NOT_USE(attributedString);
  }
  return std::nullopt;
}

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
      const auto &originalAttributedString = attributedStringBox.getValue();
      auto placeholderAttributedString = placeholderIfEmpty(originalAttributedString);
      const auto &attributedString =
          placeholderAttributedString ? *placeholderAttributedString : originalAttributedString;

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

            if (telemetry) {
              telemetry->didMeasureText();
            }

            return measurement;
          });

      // TODO(D63303709): We compensate for the placeholder character
      // being used to represent empty string. iOS TextLayoutManager
      // should instead measure using `baseTextAttributes` of the
      // `AttributedString`.
      //
      // This must happen outside of the cached value: the cache key is built
      // from the placeholder, so an empty string shares its entry with a real
      // string equal to the placeholder.
      if (originalAttributedString.isEmpty()) {
        measurement.size.width = 0;
      }
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
  const auto &originalAttributedString = attributedStringBox.getValue();
  auto placeholderAttributedString = placeholderIfEmpty(originalAttributedString);
  const auto &attributedString = placeholderAttributedString ? *placeholderAttributedString : originalAttributedString;

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
