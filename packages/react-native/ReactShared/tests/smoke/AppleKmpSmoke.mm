/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactNativeShared/ReactNativeShared.h>

#include <cstdint>
#include <cstdio>

int main()
{
  @autoreleasepool {
    struct Case {
      int32_t left;
      int32_t right;
      int32_t expected;
    };
    const Case cases[] = {{19, 23, 42}, {-7, 4, -3}, {0, 0, 0}, {INT32_MAX, 0, INT32_MAX}, {INT32_MIN, 0, INT32_MIN}};
    for (const auto &test : cases) {
      if ([RNSKmpSmoke.shared addLeft:test.left right:test.right] != test.expected) {
        fprintf(stderr, "Kotlin Objective-C integer interop failed\n");
        return 1;
      }
    }
    puts("Kotlin Objective-C smoke passed: 5 cases");
  }
  return 0;
}
