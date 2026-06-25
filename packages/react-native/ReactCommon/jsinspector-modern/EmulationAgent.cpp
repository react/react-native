/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EmulationAgent.h"

#include <jsinspector-modern/cdp/CdpJson.h>

namespace facebook::react::jsinspector_modern {

EmulationAgent::EmulationAgent(
    FrontendChannel frontendChannel,
    HostTargetController& hostTargetController)
    : frontendChannel_(std::move(frontendChannel)),
      hostTargetController_(hostTargetController) {}

bool EmulationAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Emulation.setEmulatedMedia") {
    handleSetEmulatedMedia(req);
    return true;
  }

  return false;
}

void EmulationAgent::handleSetEmulatedMedia(const cdp::PreparsedRequest& req) {
  if (req.params.isObject() && req.params.count("media") != 0u &&
      !req.params.at("media").empty()) {
    frontendChannel_(
        cdp::jsonError(
            req.id,
            cdp::ErrorCode::MethodNotFound,
            "Emulation.setEmulatedMedia: media type emulation is not supported"));
    return;
  }

  if (!req.params.isObject() || req.params.count("features") == 0u ||
      !req.params.at("features").isArray()) {
    frontendChannel_(cdp::jsonResult(req.id));
    return;
  }

  const auto& features = req.params.at("features");

  std::string colorSchemeValue;
  bool hasColorScheme = false;

  for (const auto& feature : features) {
    if (!feature.isObject() || feature.count("name") == 0u) {
      continue;
    }

    const auto& name = feature.at("name").asString();
    const auto value =
        feature.count("value") != 0u ? feature.at("value").asString() : "";

    if (name == "prefers-color-scheme") {
      hasColorScheme = true;
      colorSchemeValue = value;
      continue;
    }

    // Unsupported features are OK if their value is empty (reset).
    // DevTools sends all features on every update, with empty values for
    // features that aren't being emulated.
    if (!value.empty()) {
      frontendChannel_(
          cdp::jsonError(
              req.id,
              cdp::ErrorCode::MethodNotFound,
              "Emulation.setEmulatedMedia: unsupported media feature '" + name +
                  "'"));
      return;
    }
  }

  if (hasColorScheme && !colorSchemeValue.empty() &&
      colorSchemeValue != "light" && colorSchemeValue != "dark") {
    frontendChannel_(
        cdp::jsonError(
            req.id,
            cdp::ErrorCode::InvalidParams,
            "Emulation.setEmulatedMedia: invalid value '" + colorSchemeValue +
                "' for prefers-color-scheme (expected 'light', 'dark', or '')"));
    return;
  }

  if (hasColorScheme) {
    bool success = hostTargetController_.getDelegate().onSetEmulatedMedia(
        {.colorScheme = colorSchemeValue});

    if (!success) {
      frontendChannel_(
          cdp::jsonError(
              req.id,
              cdp::ErrorCode::InternalError,
              "Emulation.setEmulatedMedia: failed to apply color scheme override"));
      return;
    }
  }

  frontendChannel_(cdp::jsonResult(req.id));
}

} // namespace facebook::react::jsinspector_modern
