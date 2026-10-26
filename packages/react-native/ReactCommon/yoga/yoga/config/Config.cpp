/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/config/Config.h>
#include <yoga/debug/Log.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

bool configUpdateInvalidatesLayout(
    const Config& oldConfig,
    const Config& newConfig) {
  return oldConfig.getErrata() != newConfig.getErrata() ||
      oldConfig.getEnabledExperiments() != newConfig.getEnabledExperiments() ||
      oldConfig.getPointScaleFactor() != newConfig.getPointScaleFactor() ||
      oldConfig.useWebDefaults() != newConfig.useWebDefaults();
}

void Config::setUseWebDefaults(bool useWebDefaults) {
  useWebDefaults_ = useWebDefaults;
}

bool Config::useWebDefaults() const {
  return useWebDefaults_;
}

void Config::setExperimentalFeatureEnabled(
    ExperimentalFeature feature,
    bool enabled) {
  if (isExperimentalFeatureEnabled(feature) != enabled) {
    experimentalFeatures_.set(static_cast<size_t>(feature), enabled);
    version_++;
  }
}

bool Config::isExperimentalFeatureEnabled(ExperimentalFeature feature) const {
  return experimentalFeatures_.test(static_cast<size_t>(feature));
}

ExperimentalFeatureSet Config::getEnabledExperiments() const {
  return experimentalFeatures_;
}

void Config::setErrata(Errata errata) {
  if (errata_ != errata) {
    errata_ = errata;
    version_++;
  }
}

void Config::addErrata(Errata errata) {
  if (!hasErrata(errata)) {
    errata_ |= errata;
    version_++;
  }
}

void Config::removeErrata(Errata errata) {
  if (hasErrata(errata)) {
    errata_ &= (~errata);
    version_++;
  }
}

Errata Config::getErrata() const {
  return errata_;
}

bool Config::hasErrata(Errata errata) const {
  return (errata_ & errata) != Errata::None;
}

void Config::setPointScaleFactor(float pointScaleFactor) {
  if (pointScaleFactor_ != pointScaleFactor) {
    pointScaleFactor_ = pointScaleFactor;
    version_++;
  }
}

float Config::getPointScaleFactor() const {
  return pointScaleFactor_;
}

void Config::setContext(void* context) {
  context_ = context;
}

void* Config::getContext() const {
  return context_;
}

uint32_t Config::getVersion() const noexcept {
  return version_;
}

void Config::setLogger(YGLogger logger) {
  logger_ = logger;
}

void Config::log(
    const yoga::Node* node,
    LogLevel logLevel,
    const char* format,
    va_list args) const {
  const auto logger = logger_ != nullptr ? logger_ : getDefaultLogger();
  logger(this, node, unscopedEnum(logLevel), format, args);
}

void Config::setCloneNodeCallback(YGCloneNodeFunc cloneNode) {
  cloneNodeCallback_ = cloneNode;
}

YGNodeRef Config::cloneNode(
    YGNodeConstRef node,
    YGNodeConstRef owner,
    size_t childIndex) const {
  YGNodeRef clone = nullptr;
  if (cloneNodeCallback_ != nullptr) {
    clone = cloneNodeCallback_(node, owner, childIndex);
  }
  if (clone == nullptr) {
    clone = YGNodeClone(node);
  }
  return clone;
}

#if defined(_WIN32)
/*static*/ const Config& Config::getDefault() {
  static constexpr Config config{nullptr};
  return config;
}
#endif

} // namespace facebook::yoga
