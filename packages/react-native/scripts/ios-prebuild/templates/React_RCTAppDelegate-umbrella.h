/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "RCTAppDelegate.h"
#import "RCTAppSetupUtils.h"
#import "RCTDefaultReactNativeFactoryDelegate.h"
#import "RCTDependencyProvider.h"
#import "RCTJSRuntimeConfiguratorProtocol.h"
#import "RCTReactNativeFactory.h"
#import "RCTRootViewFactory.h"
#import "RCTUIConfiguratorProtocol.h"

FOUNDATION_EXPORT double React_RCTAppDelegateVersionNumber;
FOUNDATION_EXPORT const unsigned char React_RCTAppDelegateVersionString[];
