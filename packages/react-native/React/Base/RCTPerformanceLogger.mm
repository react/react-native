/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <cxxreact/ReactMarker.h>
#include <unordered_map>

#import "RCTLog.h"
#import "RCTPerformanceLogger.h"
#import "RCTPerformanceLoggerLabels.h"
#import "RCTRootView.h"

using namespace facebook::react;

@interface RCTPerformanceLogger () {
  int64_t _data[RCTPLSize][2];
}

@end

@implementation RCTPerformanceLogger

static const std::unordered_map<RCTPLTag, ReactMarker::ReactMarkerId> &getStartTagToReactMarkerIdMap()
{
  static std::unordered_map<RCTPLTag, ReactMarker::ReactMarkerId> StartTagToReactMarkerIdMap = {
      {RCTPLAppStartup, ReactMarker::APP_STARTUP_START},
      {RCTPLInitReactRuntime, ReactMarker::INIT_REACT_RUNTIME_START},
      {RCTPLScriptExecution, ReactMarker::RUN_JS_BUNDLE_START}};
  return StartTagToReactMarkerIdMap;
}

static const std::unordered_map<RCTPLTag, ReactMarker::ReactMarkerId> &getStopTagToReactMarkerIdMap()
{
  static std::unordered_map<RCTPLTag, ReactMarker::ReactMarkerId> StopTagToReactMarkerIdMap = {
      {RCTPLAppStartup, ReactMarker::APP_STARTUP_STOP},
      {RCTPLInitReactRuntime, ReactMarker::INIT_REACT_RUNTIME_STOP},
      {RCTPLScriptExecution, ReactMarker::RUN_JS_BUNDLE_STOP}};
  return StopTagToReactMarkerIdMap;
}

- (void)markStartForTag:(RCTPLTag)tag
{
  const NSTimeInterval currentTime = CACurrentMediaTime() * 1000;
  _data[tag][0] = currentTime;
  _data[tag][1] = 0;

  // Notify RN ReactMarker when hosting platform log for markers
  const auto &startTagToReactMarkerIdMap = getStartTagToReactMarkerIdMap();
  if (startTagToReactMarkerIdMap.find(tag) != startTagToReactMarkerIdMap.end()) {
    ReactMarker::logMarkerDone(startTagToReactMarkerIdMap.at(tag), currentTime);
  }
}

- (void)markStopForTag:(RCTPLTag)tag
{
  const NSTimeInterval currentTime = CACurrentMediaTime() * 1000;
  if (_data[tag][0] != 0 && _data[tag][1] == 0) {
    _data[tag][1] = currentTime;
  } else {
    RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }

  // Notify RN ReactMarker when hosting platform log for markers
  const auto &stopTagToReactMarkerIdMap = getStopTagToReactMarkerIdMap();
  if (stopTagToReactMarkerIdMap.find(tag) != stopTagToReactMarkerIdMap.end()) {
    ReactMarker::logMarkerDone(stopTagToReactMarkerIdMap.at(tag), currentTime);
  }
}

- (void)setValue:(int64_t)value forTag:(RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] = value;
}

- (void)addValue:(int64_t)value forTag:(RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] += value;
}

- (void)appendStartForTag:(RCTPLTag)tag
{
  _data[tag][0] = CACurrentMediaTime() * 1000;
}

- (void)appendStopForTag:(RCTPLTag)tag
{
  if (_data[tag][0] != 0) {
    _data[tag][1] += CACurrentMediaTime() * 1000 - _data[tag][0];
    _data[tag][0] = 0;
  } else {
    RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (NSArray<NSNumber *> *)valuesForTags
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < RCTPLSize; index++) {
    [result addObject:@(_data[index][0])];
    [result addObject:@(_data[index][1])];
  }
  return result;
}

- (int64_t)durationForTag:(RCTPLTag)tag
{
  return _data[tag][1] - _data[tag][0];
}

- (int64_t)valueForTag:(RCTPLTag)tag
{
  return _data[tag][1];
}

@end
