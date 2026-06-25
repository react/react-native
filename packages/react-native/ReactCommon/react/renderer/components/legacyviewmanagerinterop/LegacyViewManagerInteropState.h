/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#import <memory>

namespace facebook::react {

/*
 * State for <LegacyViewManagerInterop> component.
 */
class LegacyViewManagerInteropState final {
 public:
  std::shared_ptr<void> coordinator;
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
