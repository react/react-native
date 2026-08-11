/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <memory>
#include <string>

namespace facebook::react {

using AppStateConstants = NativeAppStateAppStateConstants<std::string>;

template <>
struct Bridging<AppStateConstants>
    : NativeAppStateAppStateConstantsBridging<AppStateConstants> {};

using AppState = NativeAppStateAppState<std::string>;

template <>
struct Bridging<AppState> : NativeAppStateAppStateBridging<AppState> {};

class AppStateModule : public NativeAppStateCxxSpec<AppStateModule> {
 public:
  explicit AppStateModule(std::shared_ptr<CallInvoker> jsInvoker)
      : NativeAppStateCxxSpec(jsInvoker) {}

  AppStateConstants getConstants(jsi::Runtime& rt);

  void getCurrentAppState(
      jsi::Runtime& rt,
      const AsyncCallback<AppState>& success,
      jsi::Function error);
  void addListener(jsi::Runtime& rt, const std::string& eventName);

  void removeListeners(jsi::Runtime& rt, double count);
};

} // namespace facebook::react
