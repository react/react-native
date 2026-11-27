/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>
#import <objc/runtime.h>

#import <React/RCTJavaScriptLoader.h>

static NSString *const kStubHost = @"rct-javascript-loader-tests.invalid";
static NSString *const kDeltaIdParameter = @"deltaId";

// Answers requests to kStubHost with a JavaScript body. The request's deltaId
// query parameter, when present, is sent back as the X-Metro-Delta-ID header.
@interface RCTJavaScriptLoaderTestsURLProtocol : NSURLProtocol
@end

@implementation RCTJavaScriptLoaderTestsURLProtocol

+ (BOOL)canInitWithRequest:(NSURLRequest *)request
{
  return [request.URL.host isEqualToString:kStubHost];
}

+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request
{
  return request;
}

- (void)startLoading
{
  NSURL *url = self.request.URL;
  if (url == nil) {
    return;
  }
  NSMutableDictionary<NSString *, NSString *> *headers =
      [NSMutableDictionary dictionaryWithObject:@"application/javascript" forKey:@"Content-Type"];
  for (NSURLQueryItem *item in [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:NO].queryItems) {
    if ([item.name isEqualToString:kDeltaIdParameter] && item.value != nil) {
      headers[@"X-Metro-Delta-ID"] = item.value;
    }
  }
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:url
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:headers];
  if (response == nil) {
    return;
  }
  [self.client URLProtocol:self didReceiveResponse:response cacheStoragePolicy:NSURLCacheStorageNotAllowed];
  [self.client URLProtocol:self didLoadData:[NSData dataWithBytes:"var loaded = true;" length:18]];
  [self.client URLProtocolDidFinishLoading:self];
}

- (void)stopLoading
{
}

@end

@implementation NSURLSessionConfiguration (RCTJavaScriptLoaderTests)

// Swapped with +defaultSessionConfiguration while a test runs, so this call reaches the original.
+ (NSURLSessionConfiguration *)rct_javaScriptLoaderTestsDefaultSessionConfiguration
{
  NSURLSessionConfiguration *configuration = [self rct_javaScriptLoaderTestsDefaultSessionConfiguration];
  configuration.protocolClasses = [@[ [RCTJavaScriptLoaderTestsURLProtocol class] ]
      arrayByAddingObjectsFromArray:configuration.protocolClasses ?: @[]];
  return configuration;
}

@end

@interface RCTJavaScriptLoaderTests : XCTestCase
@end

@implementation RCTJavaScriptLoaderTests

+ (void)swapDefaultSessionConfiguration
{
  Class configurationClass = [NSURLSessionConfiguration class];
  Method original = class_getClassMethod(configurationClass, @selector(defaultSessionConfiguration));
  Method replacement =
      class_getClassMethod(configurationClass, @selector(rct_javaScriptLoaderTestsDefaultSessionConfiguration));
  if (original != nullptr && replacement != nullptr) {
    method_exchangeImplementations(original, replacement);
  }
}

- (void)setUp
{
  [super setUp];
  // The loader downloads with a session of its own, which only sees protocol
  // classes listed in its configuration.
  [RCTJavaScriptLoaderTests swapDefaultSessionConfiguration];
}

- (void)tearDown
{
  [RCTJavaScriptLoaderTests swapDefaultSessionConfiguration];
  [super tearDown];
}

// NOLINTBEGIN(cppcoreguidelines-pro-type-vararg, misc-throw-by-value-catch-by-reference)
- (RCTSource *)loadBundleAtURL:(NSURL *)url
{
  XCTestExpectation *loaded = [self expectationWithDescription:@"bundle loaded"];
  __block RCTSource *result;
  [RCTJavaScriptLoader loadBundleAtURL:url
      onProgress:^(RCTLoadingProgress *progressData) {
      }
      onComplete:^(NSError *error, RCTSource *source) {
        XCTAssertNil(error);
        result = source;
        [loaded fulfill];
      }];
  [self waitForExpectations:@[ loaded ] timeout:10];
  return result;
}

- (NSURL *)stubBundleURLWithDeltaId:(NSString *)deltaId
{
  NSURLComponents *components = [NSURLComponents new];
  components.scheme = @"http";
  components.host = kStubHost;
  components.path = @"/index.bundle";
  NSMutableArray<NSURLQueryItem *> *query =
      [NSMutableArray arrayWithObject:[NSURLQueryItem queryItemWithName:@"platform" value:@"ios"]];
  if (deltaId != nil) {
    [query addObject:[NSURLQueryItem queryItemWithName:kDeltaIdParameter value:deltaId]];
  }
  components.queryItems = query;
  return components.URL;
}

- (void)testTakesTheRevisionFromTheServersDeltaIdHeader
{
  RCTSource *source = [self loadBundleAtURL:[self stubBundleURLWithDeltaId:@"4f2c9a1b7e3d5608"]];

  XCTAssertNotNil(source.downloadedBundleFileURL);
  XCTAssertEqualObjects(source.revisionId, @"4f2c9a1b7e3d5608");
}

- (void)testHasNoRevisionWhenTheServerSendsNoDeltaId
{
  XCTAssertNil([self loadBundleAtURL:[self stubBundleURLWithDeltaId:nil]].revisionId);
}

- (void)testHasNoRevisionForAnEmptyDeltaId
{
  XCTAssertNil([self loadBundleAtURL:[self stubBundleURLWithDeltaId:@""]].revisionId);
}

- (void)testHasNoRevisionForABundleReadFromDisk
{
  NSURL *file =
      [NSURL fileURLWithPath:[NSTemporaryDirectory() stringByAppendingPathComponent:[NSUUID UUID].UUIDString]];
  XCTAssertTrue([[@"var loaded = true;" dataUsingEncoding:NSUTF8StringEncoding] writeToURL:file atomically:YES]);

  RCTSource *source = [self loadBundleAtURL:file];

  XCTAssertEqualObjects(source.url, file);
  XCTAssertNil(source.revisionId);
  [[NSFileManager defaultManager] removeItemAtURL:file error:nil];
}
// NOLINTEND(cppcoreguidelines-pro-type-vararg, misc-throw-by-value-catch-by-reference)

@end
