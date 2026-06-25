/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@interface RCTBaseInterface

- (void)baseMethod;

@end

@interface RCTChildInterface : RCTBaseInterface

- (void)childMethod;

@end
