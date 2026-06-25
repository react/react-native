/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@interface RCTInterfaceWithMethod

- (void)doSomething;
- (NSString *)getTitle;
- (void)processValue:(int)value withName:(NSString *)name;

@end
