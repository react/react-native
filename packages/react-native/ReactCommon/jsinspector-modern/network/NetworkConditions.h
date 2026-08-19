/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react::jsinspector_modern {

/**
 * Simulated network conditions, set via the CDP method
 * `Network.emulateNetworkConditions`. Mirrors Chrome's
 * `network::NetworkConditions` value object.
 *
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-emulateNetworkConditions
 */
struct NetworkConditions {
  /** Whether to emulate a total network outage. */
  bool offline{false};

  /**
   * Minimum request-to-response-headers duration, in milliseconds. NOTE:
   * This is a floor on the observed duration measured from when the request
   * finished sending, not an added delay. 0 = no latency emulation.
   */
  double latencyMs{0};

  /** Maximal aggregated download throughput (bytes/sec). 0 = no limit. */
  double downloadThroughputBps{0};

  /** Maximal aggregated upload throughput (bytes/sec). 0 = no limit. */
  double uploadThroughputBps{0};

  /**
   * Whether any throttling behavior is active under these conditions
   * (excluding the offline state).
   */
  bool isThrottling() const
  {
    return !offline && (latencyMs > 0 || downloadThroughputBps > 0 || uploadThroughputBps > 0);
  }
};

} // namespace facebook::react::jsinspector_modern
