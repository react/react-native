/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTDefines.h>
#import <React/RCTDevMenu.h>

#if RCT_DEV_MENU

@interface RCTDevMenuTests : XCTestCase
@end

@implementation RCTDevMenuTests

- (void)assertBundlerForBundleURL:(NSURL *)bundleURL
                       jsLocation:(NSString *)jsLocation
                       ipFileHost:(NSString *)ipFileHost
                             host:(NSString *)expectedHost
                             port:(NSNumber *)expectedPort
{
  NSString *host = nil;
  NSNumber *port = nil;
  RCTDevMenuGetCurrentBundler(bundleURL, jsLocation, @"http", ipFileHost, &host, &port);
  XCTAssertEqualObjects(host, expectedHost);
  XCTAssertEqualObjects(port, expectedPort);
}

- (void)testBundleURLHostAndPort
{
  [self assertBundlerForBundleURL:[NSURL URLWithString:@"http://192.168.1.5:8082/index.bundle?platform=ios"]
                       jsLocation:@"10.0.0.1:9000"
                       ipFileHost:@"10.0.0.2"
                             host:@"192.168.1.5"
                             port:@8082];
}

- (void)testBundleURLWithoutPortUsesDefaultPort
{
  [self assertBundlerForBundleURL:[NSURL URLWithString:@"https://bundler.example.com/index.bundle?platform=ios"]
                       jsLocation:nil
                       ipFileHost:nil
                             host:@"bundler.example.com"
                             port:@(RCT_METRO_PORT)];
}

- (void)testJSLocationHostAndPortWhenBundleURLHasNoHost
{
  [self assertBundlerForBundleURL:[NSURL fileURLWithPath:@"/tmp/main.jsbundle"]
                       jsLocation:@"192.168.1.5:8082"
                       ipFileHost:@"10.0.0.2"
                             host:@"192.168.1.5"
                             port:@8082];
}

- (void)testJSLocationWithoutPortDoesNotUseBundleURLPort
{
  // A bundle URL with a port but no host must not lend its port to a jsLocation without one.
  [self assertBundlerForBundleURL:[NSURL URLWithString:@"file://:8082/main.jsbundle"]
                       jsLocation:@"192.168.1.5"
                       ipFileHost:nil
                             host:@"192.168.1.5"
                             port:@(RCT_METRO_PORT)];
}

- (void)testJSLocationWithScheme
{
  [self assertBundlerForBundleURL:nil
                       jsLocation:@"https://bundler.example.com:8443"
                       ipFileHost:nil
                             host:@"bundler.example.com"
                             port:@8443];
}

- (void)testJSLocationIPv6
{
  [self assertBundlerForBundleURL:nil jsLocation:@"[::1]:8082" ipFileHost:nil host:@"[::1]" port:@8082];
}

- (void)testIPFileHostWhenNoBundleURLOrJSLocation
{
  [self assertBundlerForBundleURL:nil
                       jsLocation:nil
                       ipFileHost:@"192.168.1.5\n"
                             host:@"192.168.1.5"
                             port:@(RCT_METRO_PORT)];
}

- (void)testLocalhostByDefault
{
  [self assertBundlerForBundleURL:nil jsLocation:@"" ipFileHost:nil host:@"localhost" port:@(RCT_METRO_PORT)];
}

@end

#endif
