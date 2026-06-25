/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@interface RCTGenericDelegateSplitter<DelegateT> : NSObject

@property (nonatomic, copy, nullable) void (^delegateUpdateBlock)(DelegateT _Nullable delegate);
- (void)addDelegate:(DelegateT)delegate;
- (void)removeDelegate:(DelegateT)delegate;

@end
