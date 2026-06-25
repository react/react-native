/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@interface RCTBridgeProxy : NSObject

@end

@interface RCTBridgeProxy (Cxx)

#ifdef __cplusplus
@property (nonatomic, readwrite) int cxxOnlyProperty;
#endif

@end
