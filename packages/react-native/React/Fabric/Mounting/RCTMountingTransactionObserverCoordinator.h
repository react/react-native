/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponentViewDescriptor.h>
#import <unordered_map>
#import <unordered_set>

#import "RCTMountingTransactionObserverCoordinator.h"

#include <react/renderer/mounting/MountingTransaction.h>

class RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      const RCTComponentViewDescriptor& componentViewDescriptor,
      facebook::react::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      const RCTComponentViewDescriptor& componentViewDescriptor,
      facebook::react::SurfaceId surfaceId);

  /*
   * To be called from `RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      const facebook::react::MountingTransaction& transaction,
      const facebook::react::SurfaceTelemetry& surfaceTelemetry) const;
  void notifyObserversMountingTransactionDidMount(
      const facebook::react::MountingTransaction& transaction,
      const facebook::react::SurfaceTelemetry& surfaceTelemetry) const;

 private:
  std::unordered_map<
      facebook::react::SurfaceId,
      std::unordered_set<RCTComponentViewDescriptor>>
      registry_;
};
