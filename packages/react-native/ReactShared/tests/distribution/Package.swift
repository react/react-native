// swift-tools-version: 6.0
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PackageDescription

let package = Package(
  name: "KMPDistributionProbe",
  platforms: [.iOS(.v15), .macCatalyst(.v15)],
  products: [.library(name: "KMPDistributionProbe", type: .dynamic, targets: ["Probe"])],
  targets: [
    .binaryTarget(name: "ReactNativeShared", path: "ReactNativeShared.xcframework"),
    .target(
      name: "Probe",
      dependencies: [.target(name: "ReactNativeShared", condition: .when(platforms: [.iOS]))],
      cSettings: [.unsafeFlags(["-fobjc-arc"])],
      linkerSettings: [.linkedFramework("Foundation")]
    ),
    .testTarget(name: "ProbeTests", dependencies: ["Probe"]),
  ]
)
