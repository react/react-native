/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Props.h"

#include <react/renderer/core/propsConversions.h>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include "DynamicPropsUtilities.h"

namespace facebook::react {

Props::Props(
    const PropsParserContext& context,
    const Props& sourceProps,
    const RawProps& rawProps,
    const std::function<bool(const std::string&)>& filterObjectKeys) {
  initialize(context, sourceProps, rawProps, filterObjectKeys);
}

void Props::initialize(
    const PropsParserContext& context,
    const Props& sourceProps,
    const RawProps& rawProps,
    [[maybe_unused]] const std::function<bool(const std::string&)>&
        filterObjectKeys) {
  nativeId = ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
      ? sourceProps.nativeId
      : convertRawProp(context, rawProps, "nativeID", sourceProps.nativeId, {});

#ifdef RN_SERIALIZABLE_STATE
  if (!ReactNativeFeatureFlags::enableExclusivePropsUpdateAndroid()) {
    initializeDynamicProps(sourceProps, rawProps, filterObjectKeys);
  }
#endif
}

void Props::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* /*propName*/,
    const RawValue& value) {
  switch (hash) {
    case CONSTEXPR_RAW_PROPS_KEY_HASH("nativeID"):
      fromRawValue(context, value, nativeId, {});
      return;
  }
}

#ifdef RN_SERIALIZABLE_STATE
void Props::initializeDynamicProps(
    const Props& sourceProps,
    const RawProps& rawProps,
    const std::function<bool(const std::string&)>& filterObjectKeys) {
  if (ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid()) {
    auto& oldRawProps = sourceProps.rawProps;
    auto newRawProps = rawProps.toDynamic(filterObjectKeys);
    auto mergedRawProps = mergeDynamicProps(
        oldRawProps, newRawProps, NullValueStrategy::Override);
    this->rawProps = mergedRawProps;
  } else {
    this->rawProps = rawProps.toDynamic(filterObjectKeys);
  }
}

ComponentName Props::getDiffPropsImplementationTarget() const {
  return "";
}
#endif

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList Props::getDebugProps() const {
  return {debugStringConvertibleItem("nativeID", nativeId)};
}
#endif

} // namespace facebook::react
