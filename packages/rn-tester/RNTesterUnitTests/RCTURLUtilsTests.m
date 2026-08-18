/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTUtils.h>

@interface RCTURLUtilsTests : XCTestCase

@end

@implementation RCTURLUtilsTests

- (void)testGetQueryParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=bar&bar=foo"];
  NSString *foo = RCTGetURLQueryParam(URL, @"foo");
  NSString *bar = RCTGetURLQueryParam(URL, @"bar");
  XCTAssertEqualObjects(foo, @"bar");
  XCTAssertEqualObjects(bar, @"foo");
}

- (void)testGetEncodedParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=You%20%26%20Me"];
  NSString *foo = RCTGetURLQueryParam(URL, @"foo");
  XCTAssertEqualObjects(foo, @"You & Me");
}

- (void)testQueryParamNotFound
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=bar"];
  NSString *bar = RCTGetURLQueryParam(URL, @"bar");
  XCTAssertNil(bar);
}

- (void)testDuplicateParamTakesLatter
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=bar&foo=foo"];
  NSString *foo = RCTGetURLQueryParam(URL, @"foo");
  XCTAssertEqualObjects(foo, @"foo");
}

- (void)testNilURLGetQueryParam
{
  NSURL *URL = nil;
  NSString *foo = RCTGetURLQueryParam(URL, @"foo");
  XCTAssertNil(foo);
}

- (void)testReplaceParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=bar&bar=foo"];
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"foo", @"foo");
  XCTAssertEqualObjects(result.absoluteString, @"http://example.com?foo=foo&bar=foo");
}

- (void)testReplaceEncodedParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=You%20%26%20Me"];
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"foo", @"Me & You");
  XCTAssertEqualObjects(result.absoluteString, @"http://example.com?foo=Me%20%26%20You");
}

- (void)testAppendParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?bar=foo"];
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"foo", @"bar");
  XCTAssertEqualObjects(result.absoluteString, @"http://example.com?bar=foo&foo=bar");
}

- (void)testRemoveParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?bar=foo&foo=bar"];
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"bar", nil);
  XCTAssertEqualObjects(result.absoluteString, @"http://example.com?foo=bar");
}

- (void)testNilURLAppendQueryParam
{
  NSURL *URL = nil;
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"foo", @"bar");
  XCTAssertNil(result);
}

- (void)testIsLocalAssetsURLParam
{
  NSString *libraryAssetsPath = [RCTLibraryPath() stringByAppendingPathComponent:@"assets/foo.png"];
  NSURL *libraryAssetsURL = [NSURL fileURLWithPath:libraryAssetsPath];
  XCTAssertTrue(RCTIsLocalAssetURL(libraryAssetsURL));
  NSString *bundleAssetsPath = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:@"assets/foo.png"];
  NSURL *bundleAssetsURL = [NSURL fileURLWithPath:bundleAssetsPath];
  XCTAssertTrue(RCTIsLocalAssetURL(bundleAssetsURL));
  NSString *otherAssetsPath = @"/assets/foo.png";
  NSURL *otherAssetsURL = [NSURL fileURLWithPath:otherAssetsPath];
  XCTAssertFalse(RCTIsLocalAssetURL(otherAssetsURL));
}

- (void)testAssetCatalogNameForURL
{
  NSString *resourcePath = [[NSBundle mainBundle] resourcePath];

  // Nested folder + "@2x" scale suffix: folders are encoded into the name, the
  // scale suffix and extension are stripped, and the "assets_" prefix removed.
  NSURL *scaledURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/icon@2x.png"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(scaledURL), @"awesomemodule_icon");

  // Same asset without a scale suffix resolves to the same name.
  NSURL *unscaledURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/icon.png"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(unscaledURL), @"awesomemodule_icon");

  // Illegal characters (e.g. "-") are stripped, matching the CLI identifier.
  NSURL *illegalCharsURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/my-module/my-icon@3x.png"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(illegalCharsURL), @"mymodule_myicon");

  // Non-integer scale suffixes are also stripped.
  NSURL *fractionalScaleURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/icon@1.5x.png"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(fractionalScaleURL), @"awesomemodule_icon");

  // Fractional scale with a leading zero (the packager emits e.g. "@0.5x").
  NSURL *zeroFractionalScaleURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/icon@0.5x.png"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(zeroFractionalScaleURL), @"awesomemodule_icon");

  // An uppercase "X" is not a scale suffix (the packager's scale format is
  // case-sensitive), so it stays in the name like any other character.
  NSURL *uppercaseScaleURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/icon@2X.png"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(uppercaseScaleURL), @"awesomemodule_icon2x");

  // Only the extension is stripped from a name containing dots; the inner dot
  // is an illegal identifier character and is removed.
  NSURL *multiDotURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/photo.small.png"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(multiDotURL), @"awesomemodule_photosmall");

  // Non-ASCII characters are not valid identifier characters and are removed.
  // File system paths are decomposed (NFD), so this also verifies the name is
  // normalized back to the precomposed form the CLI derived the identifier
  // from ("ü" must not leave a stray "u" behind).
  NSURL *unicodeURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/ünïcode.png"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(unicodeURL), @"awesomemodule_ncode");

  // Uppercase extensions are not catalog assets: the CLI's isCatalogAsset
  // check is case-sensitive, so these are copied as plain files.
  NSURL *uppercaseExtensionURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/Icon.PNG"]];
  XCTAssertNil(RCTAssetCatalogNameForURL(uppercaseExtensionURL));

  // A packager asset without an image extension is not a catalog asset.
  NSURL *noExtensionURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/data"]];
  XCTAssertNil(RCTAssetCatalogNameForURL(noExtensionURL));

  // ".jpeg" is a catalog image type (matching the CLI's isCatalogAsset).
  NSURL *jpegURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/photo@2x.jpeg"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(jpegURL), @"awesomemodule_photo");

  // Non-catalog image types (the CLI only emits png/jpg/jpeg into the catalog)
  // are not catalog assets and use the regular loader.
  NSURL *gifURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/AwesomeModule/anim.gif"]];
  XCTAssertNil(RCTAssetCatalogNameForURL(gifURL));

  // Assets outside the project root are encoded with "_" by the packager
  // (e.g. "assets/../../shared" -> "assets/__shared") and resolve to the same
  // identifier the CLI generates.
  NSURL *outOfRootURL =
      [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"assets/__shared/icon@2x.png"]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(outOfRootURL), @"__shared_icon");

  // Query strings are ignored, same as the legacy loader.
  NSURL *queryURL = [NSURL
      URLWithString:[NSString stringWithFormat:@"file://%@/assets/AwesomeModule/icon@2x.png?platform=ios&hash=abc",
                                               resourcePath]];
  XCTAssertEqualObjects(RCTAssetCatalogNameForURL(queryURL), @"awesomemodule_icon");

  // A non-packager path (not under "assets/") is not a catalog asset.
  NSURL *notPackagerURL = [NSURL fileURLWithPath:[resourcePath stringByAppendingPathComponent:@"icon.png"]];
  XCTAssertNil(RCTAssetCatalogNameForURL(notPackagerURL));

  // A nil URL is handled gracefully.
  XCTAssertNil(RCTAssetCatalogNameForURL(nil));
}

@end
