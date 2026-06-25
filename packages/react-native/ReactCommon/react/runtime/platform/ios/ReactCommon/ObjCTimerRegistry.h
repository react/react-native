/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTTiming.h>
#import <react/runtime/PlatformTimerRegistry.h>
#import <react/runtime/TimerManager.h>

@interface RCTJSTimerExecutor : NSObject <RCTTimingDelegate>

- (void)setTimerManager:(std::weak_ptr<facebook::react::TimerManager>)timerManager;

@end

class ObjCTimerRegistry : public facebook::react::PlatformTimerRegistry {
 public:
  ObjCTimerRegistry();
  void createTimer(uint32_t timerID, double delayMS) override;
  void deleteTimer(uint32_t timerID) override;
  void createRecurringTimer(uint32_t timerID, double delayMS) override;
  void setTimerManager(std::weak_ptr<facebook::react::TimerManager> timerManager) override;
  RCTTiming *_Null_unspecified timing;

 private:
  RCTJSTimerExecutor *_Null_unspecified jsTimerExecutor_;
  double toSeconds(double ms);
};
