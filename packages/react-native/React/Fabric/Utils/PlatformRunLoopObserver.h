/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <CoreFoundation/CFRunLoop.h>
#include <CoreFoundation/CoreFoundation.h>

#include <react/utils/RunLoopObserver.h>

namespace facebook::react {

/*
 * Concrete iOS-specific implementation of `RunLoopObserver` using
 * `CFRunLoopObserver` under the hood.
 */
class PlatformRunLoopObserver : public RunLoopObserver {
 public:
  PlatformRunLoopObserver(
      RunLoopObserver::Activity activities,
      RunLoopObserver::WeakOwner owner,
      CFRunLoopRef runLoop);

  ~PlatformRunLoopObserver();

  virtual bool isOnRunLoopThread() const noexcept override;

 private:
  void startObserving() const noexcept override;
  void stopObserving() const noexcept override;

  CFRunLoopRef runLoop_;
  CFRunLoopObserverRef mainRunLoopObserver_;
};

/*
 * Convenience specialization of `PlatformRunLoopObserver` observing the main
 * run loop.
 */
class MainRunLoopObserver final : public PlatformRunLoopObserver {
 public:
  MainRunLoopObserver(
      RunLoopObserver::Activity activities,
      RunLoopObserver::WeakOwner owner)
      : PlatformRunLoopObserver(
            activities,
            std::move(owner),
            CFRunLoopGetMain()) {}
};

} // namespace facebook::react
