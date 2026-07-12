/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <glog/logging.h>
#include <react/debug/flags.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDynamicProvider.h>
#include <chrono>
#include <memory>
#include <thread>
#include "AppSettings.h"
#include "TesterAppDelegate.h"

using namespace facebook::react;

static void setUpLogging() {
  google::InitGoogleLogging("react-native-fantom");
  FLAGS_logtostderr = true;
  FLAGS_minloglevel = AppSettings::minLogLevel;
}

static void setUpFeatureFlags() {
  folly::dynamic dynamicFeatureFlags = folly::dynamic::object();

  dynamicFeatureFlags["enableBridgelessArchitecture"] = true;
  dynamicFeatureFlags["cxxNativeAnimatedEnabled"] = true;

  if (AppSettings::dynamicFeatureFlags.has_value()) {
    dynamicFeatureFlags.update(AppSettings::dynamicFeatureFlags.value());
  }

  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsDynamicProvider>(
          dynamicFeatureFlags));
}

int main(int argc, char* argv[]) {
  AppSettings::init(argc, argv);

  setUpLogging();

  setUpFeatureFlags();

  auto config = ReactInstanceConfig{
      .appId = "com.meta.reactnative.fantom",
      .deviceName = "RN Fantom",
  };

  if (AppSettings::inspectorPort.has_value()) {
    config.enableInspector = true;
    config.devServerPort = AppSettings::inspectorPort.value();
  }

  auto appDelegate = TesterAppDelegate(config);

  if (AppSettings::inspectorPort.has_value()) {
    // FIXME(T234306362): Replace this logic with a call to
    // `appDelegate.waitForDebugger()` that handles orchestration properly.

    // Wait for inspector websocket to connect.
    std::this_thread::sleep_for(std::chrono::seconds(2));

    appDelegate.openDebugger();

    // Wait for debugger UI to open and start a debugging session.
    std::this_thread::sleep_for(std::chrono::seconds(2));
  }

  if (AppSettings::interactive) {
    appDelegate.loadScript(AppSettings::defaultBundlePath, "");
    appDelegate.runInteractiveLoop();
    return 0;
  }

  appDelegate.loadScriptAndRunTests(AppSettings::defaultBundlePath, "");

  return 0;
}
