/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/image/ImageProps.h>
#include <react/renderer/components/image/conversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

ImageProps::ImageProps(
    const PropsParserContext& context,
    const ImageProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps),
      sources(
          convertRawProp(context, rawProps, "source", sourceProps.sources, {})),
      defaultSource(convertRawProp(
          context,
          rawProps,
          "defaultSource",
          sourceProps.defaultSource,
          {})),
      loadingIndicatorSource(convertRawProp(
          context,
          rawProps,
          "loadingIndicatorSource",
          sourceProps.loadingIndicatorSource,
          {})),
      resizeMode(convertRawProp(
          context,
          rawProps,
          "resizeMode",
          sourceProps.resizeMode,
          ImageResizeMode::Stretch)),
      blurRadius(convertRawProp(
          context,
          rawProps,
          "blurRadius",
          sourceProps.blurRadius,
          {})),
      capInsets(convertRawProp(
          context,
          rawProps,
          "capInsets",
          sourceProps.capInsets,
          {})),
      tintColor(convertRawProp(
          context,
          rawProps,
          "tintColor",
          sourceProps.tintColor,
          {})),
      internal_analyticTag(convertRawProp(
          context,
          rawProps,
          "internal_analyticTag",
          sourceProps.internal_analyticTag,
          {})),
      resizeMethod(convertRawProp(
          context,
          rawProps,
          "resizeMethod",
          sourceProps.resizeMethod,
          {"auto"})),
      resizeMultiplier(convertRawProp(
          context,
          rawProps,
          "resizeMultiplier",
          sourceProps.resizeMultiplier,
          1)),
      shouldNotifyLoadEvents(convertRawProp(
          context,
          rawProps,
          "shouldNotifyLoadEvents",
          sourceProps.shouldNotifyLoadEvents,
          {})),
      overlayColor(convertRawProp(
          context,
          rawProps,
          "overlayColor",
          sourceProps.overlayColor,
          {})),
      fadeDuration(convertRawProp(
          context,
          rawProps,
          "fadeDuration",
          sourceProps.fadeDuration,
          {})),
      progressiveRenderingEnabled(convertRawProp(
          context,
          rawProps,
          "progressiveRenderingEnabled",
          sourceProps.progressiveRenderingEnabled,
          {})) {}

void ImageProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  ViewProps::setProp(context, hash, propName, value);

  static auto defaults = ImageProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE(sources, "source");
    RAW_SET_PROP_SWITCH_CASE(defaultSource, "defaultSource");
    RAW_SET_PROP_SWITCH_CASE(loadingIndicatorSource, "loadingIndicatorSource");
    RAW_SET_PROP_SWITCH_CASE_BASIC(resizeMode);
    RAW_SET_PROP_SWITCH_CASE_BASIC(blurRadius);
    RAW_SET_PROP_SWITCH_CASE_BASIC(capInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(tintColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(internal_analyticTag);
    RAW_SET_PROP_SWITCH_CASE_BASIC(resizeMethod);
    RAW_SET_PROP_SWITCH_CASE_BASIC(resizeMultiplier);
    RAW_SET_PROP_SWITCH_CASE_BASIC(shouldNotifyLoadEvents);
    RAW_SET_PROP_SWITCH_CASE_BASIC(overlayColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fadeDuration);
    RAW_SET_PROP_SWITCH_CASE_BASIC(progressiveRenderingEnabled);
  }
}

#ifdef RN_SERIALIZABLE_STATE

static folly::dynamic convertEdgeInsets(const EdgeInsets& edgeInsets) {
  folly::dynamic edgeInsetsResult = folly::dynamic::object();
  edgeInsetsResult["left"] = edgeInsets.left;
  edgeInsetsResult["top"] = edgeInsets.top;
  edgeInsetsResult["right"] = edgeInsets.right;
  edgeInsetsResult["bottom"] = edgeInsets.bottom;
  return edgeInsetsResult;
}

ComponentName ImageProps::getDiffPropsImplementationTarget() const {
  return "Image";
}

folly::dynamic ImageProps::getDiffProps(const Props* prevProps) const {
  static const auto defaultProps = ImageProps();

  const ImageProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const ImageProps*>(prevProps);

  folly::dynamic result = ViewProps::getDiffProps(oldProps);

  if (sources != oldProps->sources) {
    auto sourcesArray = folly::dynamic::array();
    for (const auto& source : sources) {
      sourcesArray.push_back(toDynamic(source));
    }
    result["source"] = sourcesArray;
  }

  if (defaultSource != oldProps->defaultSource) {
    result["defaultSource"] = toDynamic(defaultSource);
  }

  if (loadingIndicatorSource != oldProps->loadingIndicatorSource) {
    result["loadingIndicatorSource"] = toDynamic(loadingIndicatorSource);
  }

  if (resizeMode != oldProps->resizeMode) {
    switch (resizeMode) {
      case ImageResizeMode::Cover:
        result["resizeMode"] = "cover";
        break;
      case ImageResizeMode::Contain:
        result["resizeMode"] = "contain";
        break;
      case ImageResizeMode::Stretch:
        result["resizeMode"] = "stretch";
        break;
      case ImageResizeMode::Center:
        result["resizeMode"] = "center";
        break;
      case ImageResizeMode::Repeat:
        result["resizeMode"] = "repeat";
        break;
      case ImageResizeMode::None:
        result["resizeMode"] = "none";
        break;
    }
  }

  if (blurRadius != oldProps->blurRadius) {
    result["blurRadius"] = blurRadius;
  }

  if (capInsets != oldProps->capInsets) {
    result["capInsets"] = convertEdgeInsets(capInsets);
  }

  if (tintColor != oldProps->tintColor) {
    result["tintColor"] = *tintColor;
  }

  if (internal_analyticTag != oldProps->internal_analyticTag) {
    result["internal_analyticTag"] = internal_analyticTag;
  }

  if (resizeMethod != oldProps->resizeMethod) {
    result["resizeMethod"] = resizeMethod;
  }

  if (resizeMultiplier != oldProps->resizeMultiplier) {
    result["resizeMultiplier"] = resizeMultiplier;
  }

  if (shouldNotifyLoadEvents != oldProps->shouldNotifyLoadEvents) {
    result["shouldNotifyLoadEvents"] = shouldNotifyLoadEvents;
  }

  if (overlayColor != oldProps->overlayColor) {
    result["overlayColor"] = *overlayColor;
  }

  if (fadeDuration != oldProps->fadeDuration) {
    result["fadeDuration"] = fadeDuration;
  }

  if (progressiveRenderingEnabled != oldProps->progressiveRenderingEnabled) {
    result["progressiveRenderingEnabled"] = progressiveRenderingEnabled;
  }

  return result;
}

#endif

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ImageProps::getDebugProps() const {
  const auto& imageProps = ImageProps();

  auto sourcesList = SharedDebugStringConvertibleList{};
  if (sources.size() == 1) {
    sourcesList = sources[0].getDebugProps("source");
  } else if (sources.size() > 1) {
    for (const auto& source : sources) {
      std::string sourceName = "source-" + react::toString(source.scale) + "x";
      auto debugProps = source.getDebugProps(sourceName);
      sourcesList.insert(
          sourcesList.end(), debugProps.begin(), debugProps.end());
    }
  }

  return ViewProps::getDebugProps() +
      defaultSource.getDebugProps("defaultSource") + sourcesList +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              "blurRadius", blurRadius, imageProps.blurRadius),
          debugStringConvertibleItem(
              "resizeMode",
              toString(resizeMode),
              toString(imageProps.resizeMode)),
          debugStringConvertibleItem(
              "tintColor", toString(tintColor), toString(imageProps.tintColor)),
      };
}

inline std::string toString(ImageResizeMode resizeMode) {
  switch (resizeMode) {
    case ImageResizeMode::Cover:
      return "cover";
    case ImageResizeMode::Contain:
      return "contain";
    case ImageResizeMode::Stretch:
      return "stretch";
    case ImageResizeMode::Center:
      return "center";
    case ImageResizeMode::Repeat:
      return "repeat";
    case ImageResizeMode::None:
      return "none";
  }
}

#endif

} // namespace facebook::react
