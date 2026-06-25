/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@interface RCTTestInterface

- (void)normalMethod:(NSString *)name;

- (NSArray *)interfaceDeprecatedMethod:(id)param __attribute__((deprecated("This method is deprecated.")));

@end
