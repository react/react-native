/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTGradientUtils.h>
#import <mach/mach.h>
#import <react/renderer/graphics/RCTPlatformColorUtils.h>

#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <string>

using namespace facebook::react;
using Clock = std::chrono::steady_clock;

#if !RCT_BENCHMARK_KMP
@interface RCTGradientUtilsBaseline : NSObject
+ (std::vector<ProcessedColorStop>)getFixedColorStops:(const std::vector<ColorStop> &)colorStops
                                   gradientLineLength:(CGFloat)gradientLineLength;
@end
#endif

static volatile double checksum = 0;

static void calculate(const std::vector<ColorStop> &input)
{
#if RCT_BENCHMARK_KMP
  auto result = [RCTGradientUtils getFixedColorStops:input gradientLineLength:240];
#else
  auto result = [RCTGradientUtilsBaseline getFixedColorStops:input gradientLineLength:240];
#endif
  // Observe the output without timing another traversal or color conversion.
  checksum = checksum + result.size() + result.front().position.value() + result.back().position.value();
}

static double nanosecondsSince(Clock::time_point start)
{
  return std::chrono::duration<double, std::nano>(Clock::now() - start).count();
}

static NSDictionary *memoryUsage()
{
  task_vm_info_data_t info{};
  mach_msg_type_number_t count = TASK_VM_INFO_COUNT;
  auto status = task_info(mach_task_self(), TASK_VM_INFO, reinterpret_cast<task_info_t>(&info), &count);
  if (status != KERN_SUCCESS) {
    return @{@"taskInfoError" : @(status)};
  }
  return @{@"residentBytes" : @(info.resident_size), @"physicalFootprintBytes" : @(info.phys_footprint)};
}

static std::vector<ColorStop> inputForCase(const std::string &name)
{
  auto red = colorFromRGBA(255, 0, 0, 255);
  auto blue = colorFromRGBA(0, 0, 255, 127);
  if (name == "two_stops") {
    return {{red, {}}, {blue, {}}};
  }
  if (name == "asymmetric_hint") {
    return {{red, {0, UnitType::Percent}}, {{}, {15, UnitType::Percent}}, {blue, {100, UnitType::Percent}}};
  }
  std::vector<ColorStop> result;
  if (name == "implicit_16" || name == "explicit_64") {
    const int count = name == "implicit_16" ? 16 : 64;
    for (int i = 0; i < count; ++i) {
      ValueUnit position = count == 16 ? ValueUnit{} : ValueUnit{100.f * i / (count - 1), UnitType::Percent};
      result.push_back({i % 2 == 0 ? red : blue, position});
    }
    return result;
  }
  if (name == "multiple_hints") {
    for (int i = 0; i < 8; ++i) {
      result.push_back({i % 2 == 0 ? red : blue, {100.f * i / 7, UnitType::Percent}});
      if (i < 7) {
        result.push_back({{}, {100.f * (i + 0.3f) / 7, UnitType::Percent}});
      }
    }
    return result;
  }
  fprintf(stderr, "Unknown gradient benchmark case: %s\n", name.c_str());
  exit(1);
}

int main(int argc, char **argv)
{
  const bool firstCallOnly = argc == 5 && std::string(argv[4]) == "--first-call-only";
  if (argc != 4 && !firstCallOnly) {
    fprintf(stderr, "Usage: AppleGradientBenchmark CASE ITERATIONS SAMPLES [--first-call-only]\n");
    return 1;
  }
  char *iterationsEnd = nullptr;
  char *samplesEnd = nullptr;
  const auto iterations = strtoul(argv[2], &iterationsEnd, 10);
  const auto samples = strtoul(argv[3], &samplesEnd, 10);
  if (*iterationsEnd != '\0' || *samplesEnd != '\0' || iterations == 0 || iterations > 1000000 || samples == 0 ||
      samples > 100) {
    fprintf(stderr, "Iterations must be 1..1000000; samples must be 1..100.\n");
    return 1;
  }
  @autoreleasepool {
    auto input = inputForCase(argv[1]);
    auto beforeFirstCall = memoryUsage();
    auto start = Clock::now();
    @autoreleasepool {
      calculate(input);
    }
    const auto firstCallNanoseconds = nanosecondsSince(start);
    auto afterFirstCall = memoryUsage();
    const int warmupCalls = firstCallOnly ? 0 : 1000;
    for (int i = 0; i < warmupCalls; ++i) {
      @autoreleasepool {
        calculate(input);
      }
    }
    auto afterWarmup = memoryUsage();
    NSMutableArray<NSNumber *> *timings = [NSMutableArray new];
    for (unsigned long sample = 0; sample < (firstCallOnly ? 0 : samples); ++sample) {
      start = Clock::now();
      for (unsigned long iteration = 0; iteration < iterations; ++iteration) {
        @autoreleasepool {
          calculate(input);
        }
      }
      [timings addObject:@(nanosecondsSince(start) / iterations)];
    }
    auto afterMeasurement = memoryUsage();
    NSDictionary *result = @{
      @"variant" : RCT_BENCHMARK_KMP ? @"kmp" : @"native",
      @"case" : @(argv[1]),
      @"iterationsPerSample" : @(iterations),
      @"warmupCalls" : @(warmupCalls),
      @"firstCallNanoseconds" : @(firstCallNanoseconds),
      @"nanosecondsPerCall" : timings,
      @"memoryBeforeFirstCall" : beforeFirstCall,
      @"memoryAfterFirstCall" : afterFirstCall,
      @"memoryAfterWarmup" : afterWarmup,
      @"memoryAfterMeasurement" : afterMeasurement,
      @"checksum" : @(checksum),
    };
    NSError *error = nil;
    NSData *json = [NSJSONSerialization dataWithJSONObject:result options:NSJSONWritingPrettyPrinted error:&error];
    if (json == nil) {
      fprintf(stderr, "Unable to serialize benchmark result: %s\n", error.localizedDescription.UTF8String);
      return 1;
    }
    fwrite(json.bytes, 1, json.length, stdout);
    putchar('\n');
  }
  return 0;
}
