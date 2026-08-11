/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <optional>

namespace facebook::react {

using DisplayMetrics =
    NativeDeviceInfoDisplayMetrics<double, double, double, double>;

using DisplayMetricsAndroid = NativeDeviceInfoDisplayMetricsAndroid<
    double,
    double,
    double,
    double,
    double>;

using DimensionsPayload = NativeDeviceInfoDimensionsPayload<
    std::optional<DisplayMetrics>,
    std::optional<DisplayMetrics>,
    std::optional<DisplayMetricsAndroid>,
    std::optional<DisplayMetricsAndroid>>;

using DeviceInfoConstants = NativeDeviceInfoDeviceInfoConstants<
    DimensionsPayload,
    std::optional<bool>,
    std::optional<bool>>;

template <>
struct Bridging<DisplayMetrics>
    : NativeDeviceInfoDisplayMetricsBridging<DisplayMetrics> {};

template <>
struct Bridging<DisplayMetricsAndroid>
    : NativeDeviceInfoDisplayMetricsAndroidBridging<DisplayMetricsAndroid> {};

template <>
struct Bridging<DimensionsPayload>
    : NativeDeviceInfoDimensionsPayloadBridging<DimensionsPayload> {};

template <>
struct Bridging<DeviceInfoConstants>
    : NativeDeviceInfoDeviceInfoConstantsBridging<DeviceInfoConstants> {};

class DeviceInfoModule : public NativeDeviceInfoCxxSpec<DeviceInfoModule> {
 public:
  explicit DeviceInfoModule(std::shared_ptr<CallInvoker> jsInvoker)
      : NativeDeviceInfoCxxSpec(jsInvoker) {}

  DeviceInfoConstants getConstants(jsi::Runtime& rt);
};

} // namespace facebook::react
