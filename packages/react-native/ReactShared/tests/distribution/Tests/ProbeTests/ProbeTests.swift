/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Probe
import XCTest

final class ProbeTests: XCTestCase {
  func testPackagedGradientCalculation() {
    XCTAssertEqual(RNSDistributionProbe(), 1)
  }
}
