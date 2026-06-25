/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AppSettings.h"
#include <folly/json/json.h>
#include <gflags/gflags.h>
#include <glog/logging.h>

static constexpr int DEFAULT_WINDOW_WIDTH = 1280;
static constexpr int DEFAULT_WINDOW_HEIGHT = 720;

DEFINE_uint32(windowWidth, DEFAULT_WINDOW_WIDTH, "Application window width");
DEFINE_uint32(windowHeight, DEFAULT_WINDOW_HEIGHT, "Application window height");
DEFINE_string(bundlePath, "", "Default path to the application's bundle");
DEFINE_uint32(inspectorPort, 0, "React Native inspector port");
DEFINE_string(
    featureFlags,
    "",
    "JSON representation of the common feature flags to set for the app");
DEFINE_string(
    minLogLevel,
    "",
    "Minimum log level to be used by the app. One of: [info, warning, error, fatal]");

namespace facebook::react {

unsigned int AppSettings::windowWidth{DEFAULT_WINDOW_WIDTH};
unsigned int AppSettings::windowHeight{DEFAULT_WINDOW_HEIGHT};
std::string AppSettings::defaultBundlePath{};
std::optional<uint32_t> AppSettings::inspectorPort{};
std::optional<folly::dynamic> AppSettings::dynamicFeatureFlags;
int AppSettings::minLogLevel{google::GLOG_INFO};

void AppSettings::init(int argc, char** argv) {
  if (argc > 0 && argv != nullptr) {
    // Don't exit app on unknown flags, as some of those may be provided when
    // debugging via XCode:
    gflags::AllowCommandLineReparsing();
    gflags::ParseCommandLineFlags(&argc, &argv, false);
  }
  initInternal();
}

void AppSettings::initInternal() {
  windowWidth = FLAGS_windowWidth;
  windowHeight = FLAGS_windowHeight;

  if (!FLAGS_featureFlags.empty()) {
    dynamicFeatureFlags = folly::parseJson(FLAGS_featureFlags);
  }

  if (!FLAGS_bundlePath.empty()) {
    defaultBundlePath = FLAGS_bundlePath;
  }

  if (FLAGS_inspectorPort != 0) {
    inspectorPort = FLAGS_inspectorPort;
  }

  if (!FLAGS_minLogLevel.empty()) {
    if (FLAGS_minLogLevel == "info") {
      minLogLevel = google::GLOG_INFO;
    } else if (FLAGS_minLogLevel == "warning") {
      minLogLevel = google::GLOG_WARNING;
    } else if (FLAGS_minLogLevel == "error") {
      minLogLevel = google::GLOG_ERROR;
    } else if (FLAGS_minLogLevel == "fatal") {
      minLogLevel = google::GLOG_FATAL;
    } else {
      LOG(ERROR) << "Invalid min log level: " << FLAGS_minLogLevel;
    }
  }
}

} // namespace facebook::react
