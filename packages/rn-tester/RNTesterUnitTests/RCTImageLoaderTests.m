/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTBridge.h>
#import <React/RCTImageLoader.h>

#import "RCTImageLoaderHelpers.h"

unsigned char blackGIF[] = {0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
                            0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x2c, 0x00, 0x00, 0x00, 0x00,
                            0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b};

RCTDefineImageURLLoader(RCTImageLoaderTestsURLLoader1) RCTDefineImageURLLoader(RCTImageLoaderTestsURLLoader2)
    RCTDefineImageDecoder(RCTImageLoaderTestsDecoder1) RCTDefineImageDecoder(RCTImageLoaderTestsDecoder2)

        @interface RCTImageLoaderTestsImageCache : NSObject<RCTImageCache>

@property (nonatomic, strong) UIImage *image;
@property (nonatomic, copy) NSString *URLString;
@property (nonatomic, assign) CGSize requestedSize;
@property (nonatomic, assign) BOOL didMissRequestedSize;
@property (nonatomic, assign) BOOL didHitOriginalSize;

@end

@implementation RCTImageLoaderTestsImageCache

- (UIImage *)imageForUrl:(NSString *)url size:(CGSize)size scale:(CGFloat)scale resizeMode:(RCTResizeMode)resizeMode
{
  if (![url isEqualToString:self.URLString] || scale != 1 || resizeMode != RCTResizeModeStretch) {
    return nil;
  }
  if (CGSizeEqualToSize(size, self.requestedSize)) {
    self.didMissRequestedSize = YES;
    return nil;
  }
  if (CGSizeEqualToSize(size, CGSizeZero)) {
    self.didHitOriginalSize = YES;
    return self.image;
  }
  return nil;
}

- (void)addImageToCache:(__unused UIImage *)image
                    URL:(__unused NSString *)url
                   size:(__unused CGSize)size
                  scale:(__unused CGFloat)scale
             resizeMode:(__unused RCTResizeMode)resizeMode
               response:(__unused NSURLResponse *)response
{
}

@end

@interface RCTImageLoaderCacheTests : XCTestCase

@end

@implementation RCTImageLoaderCacheTests

- (void)testCachedImagePreservesNaturalSizeWhenNotClipped
{
  CGSize imageSize = CGSizeMake(200, 100);
  UIGraphicsBeginImageContextWithOptions(imageSize, YES, 1);
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();

  RCTImageLoaderTestsImageCache *imageCache = [RCTImageLoaderTestsImageCache new];
  imageCache.image = image;
  imageCache.URLString = @"https://reactnative.dev/img/opengraph.png";
  imageCache.requestedSize = CGSizeMake(100, 100);

  NS_VALID_UNTIL_END_OF_SCOPE RCTImageLoader *imageLoader = [[RCTImageLoader alloc] initWithRedirectDelegate:nil
      loadersProvider:^NSArray<id<RCTImageURLLoader>> *(__unused RCTModuleRegistry *moduleRegistry) {
        return @[];
      }
      decodersProvider:^NSArray<id<RCTImageDataDecoder>> *(__unused RCTModuleRegistry *moduleRegistry) {
        return @[];
      }];
  [imageLoader setImageCache:imageCache];

  XCTestExpectation *expectation = [self expectationWithDescription:@"Image loaded from cache"];
  NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:imageCache.URLString]];
  [imageLoader loadImageWithURLRequest:request
                                  size:imageCache.requestedSize
                                 scale:1
                               clipped:NO
                            resizeMode:RCTResizeModeStretch
                         progressBlock:nil
                      partialLoadBlock:nil
                       completionBlock:^(NSError *error, UIImage *loadedImage) {
                         XCTAssertNil(error);
                         XCTAssertEqualObjects(loadedImage, image);
                         [expectation fulfill];
                       }];
  [self waitForExpectations:@[ expectation ] timeout:1];
  XCTAssertTrue(imageCache.didMissRequestedSize);
  XCTAssertTrue(imageCache.didHitOriginalSize);
}

@end

@interface RCTImageLoaderTests : XCTestCase

@end

@implementation RCTImageLoaderTests {
  NSURL *_bundleURL;
}

- (void)setUp
{
  XCTSkip(@"Skipping RCTImageLoaderTests since they rely on deprecated RCTBridge functionality.");

  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  _bundleURL = [bundle URLForResource:@"RNTesterUnitTestsBundle" withExtension:@"js"];
}

- (void)testImageLoading
{
  UIImage *image = [UIImage new];

  id<RCTImageURLLoader> loader = [[RCTImageLoaderTestsURLLoader1 alloc] initWithPriority:1.0
      canLoadImageURLHandler:^BOOL(__unused NSURL *requestURL) {
        return YES;
      }
      loadImageURLHandler:^RCTImageLoaderCancellationBlock(
          __unused NSURL *imageURL,
          __unused CGSize size,
          __unused CGFloat scale,
          __unused RCTResizeMode resizeMode,
          RCTImageLoaderProgressBlock progressHandler,
          RCTImageLoaderCompletionBlock completionHandler) {
        progressHandler(1, 1);
        completionHandler(nil, image);
        return nil;
      }];

  NS_VALID_UNTIL_END_OF_SCOPE RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                                                        moduleProvider:^{
                                                                          return @[ loader ];
                                                                        }
                                                                         launchOptions:nil];

  NSURLRequest *urlRequest =
      [NSURLRequest requestWithURL:[NSURL URLWithString:@"https://reactnative.dev/img/opengraph.png"]];
  [[bridge moduleForClass:[RCTImageLoader class]] loadImageWithURLRequest:urlRequest
      size:CGSizeMake(100, 100)
      scale:1.0
      clipped:YES
      resizeMode:RCTResizeModeContain
      progressBlock:^(int64_t progress, int64_t total) {
        XCTAssertEqual(progress, 1);
        XCTAssertEqual(total, 1);
      }
      partialLoadBlock:^(UIImage *loadedImage) {
      }
      completionBlock:^(NSError *loadError, id loadedImage) {
        XCTAssertEqualObjects(loadedImage, image);
        XCTAssertNil(loadError);
      }];
}

- (void)testImageLoaderUsesImageURLLoaderWithHighestPriority
{
  UIImage *image = [UIImage new];

  id<RCTImageURLLoader> loader1 = [[RCTImageLoaderTestsURLLoader1 alloc] initWithPriority:1.0
      canLoadImageURLHandler:^BOOL(__unused NSURL *requestURL) {
        return YES;
      }
      loadImageURLHandler:^RCTImageLoaderCancellationBlock(
          __unused NSURL *imageURL,
          __unused CGSize size,
          __unused CGFloat scale,
          __unused RCTResizeMode resizeMode,
          RCTImageLoaderProgressBlock progressHandler,
          RCTImageLoaderCompletionBlock completionHandler) {
        progressHandler(1, 1);
        completionHandler(nil, image);
        return nil;
      }];

  id<RCTImageURLLoader> loader2 = [[RCTImageLoaderTestsURLLoader2 alloc] initWithPriority:0.5
      canLoadImageURLHandler:^BOOL(__unused NSURL *requestURL) {
        return YES;
      }
      loadImageURLHandler:^RCTImageLoaderCancellationBlock(
          __unused NSURL *imageURL,
          __unused CGSize size,
          __unused CGFloat scale,
          __unused RCTResizeMode resizeMode,
          __unused RCTImageLoaderProgressBlock progressHandler,
          __unused RCTImageLoaderCompletionBlock completionHandler) {
        XCTFail(@"Should not have used loader2");
        return nil;
      }];

  NS_VALID_UNTIL_END_OF_SCOPE RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                                                        moduleProvider:^{
                                                                          return @[ loader1, loader2 ];
                                                                        }
                                                                         launchOptions:nil];

  NSURLRequest *urlRequest =
      [NSURLRequest requestWithURL:[NSURL URLWithString:@"https://reactnative.dev/img/opengraph.png"]];
  [[bridge moduleForClass:[RCTImageLoader class]] loadImageWithURLRequest:urlRequest
      size:CGSizeMake(100, 100)
      scale:1.0
      clipped:YES
      resizeMode:RCTResizeModeContain
      progressBlock:^(int64_t progress, int64_t total) {
        XCTAssertEqual(progress, 1);
        XCTAssertEqual(total, 1);
      }
      partialLoadBlock:^(UIImage *loadedImage) {
      }
      completionBlock:^(NSError *loadError, id loadedImage) {
        XCTAssertEqualObjects(loadedImage, image);
        XCTAssertNil(loadError);
      }];
}

- (void)testImageDecoding
{
  NSData *data = [NSData dataWithBytesNoCopy:blackGIF length:sizeof(blackGIF) freeWhenDone:NO];
  UIImage *image = [[UIImage alloc] initWithData:data];

  id<RCTImageDataDecoder> decoder = [[RCTImageLoaderTestsDecoder1 alloc] initWithPriority:1.0
      canDecodeImageDataHandler:^BOOL(__unused NSData *imageData) {
        return YES;
      }
      decodeImageDataHandler:^RCTImageLoaderCancellationBlock(
          NSData *imageData,
          __unused CGSize size,
          __unused CGFloat scale,
          __unused RCTResizeMode resizeMode,
          RCTImageLoaderCompletionBlock completionHandler) {
        XCTAssertEqualObjects(imageData, data);
        completionHandler(nil, image);
        return nil;
      }];

  NS_VALID_UNTIL_END_OF_SCOPE RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                                                        moduleProvider:^{
                                                                          return @[ decoder ];
                                                                        }
                                                                         launchOptions:nil];

  RCTImageLoaderCancellationBlock cancelBlock =
      [[bridge moduleForClass:[RCTImageLoader class]] decodeImageData:data
                                                                 size:CGSizeMake(1, 1)
                                                                scale:1.0
                                                              clipped:NO
                                                           resizeMode:RCTResizeModeStretch
                                                      completionBlock:^(NSError *decodeError, id decodedImage) {
                                                        XCTAssertEqualObjects(decodedImage, image);
                                                        XCTAssertNil(decodeError);
                                                      }];
  XCTAssertNotNil(cancelBlock);
}

- (void)testImageLoaderUsesImageDecoderWithHighestPriority
{
  NSData *data = [NSData dataWithBytesNoCopy:blackGIF length:sizeof(blackGIF) freeWhenDone:NO];
  UIImage *image = [[UIImage alloc] initWithData:data];

  id<RCTImageDataDecoder> decoder1 = [[RCTImageLoaderTestsDecoder1 alloc] initWithPriority:1.0
      canDecodeImageDataHandler:^BOOL(__unused NSData *imageData) {
        return YES;
      }
      decodeImageDataHandler:^RCTImageLoaderCancellationBlock(
          NSData *imageData,
          __unused CGSize size,
          __unused CGFloat scale,
          __unused RCTResizeMode resizeMode,
          RCTImageLoaderCompletionBlock completionHandler) {
        XCTAssertEqualObjects(imageData, data);
        completionHandler(nil, image);
        return nil;
      }];

  id<RCTImageDataDecoder> decoder2 = [[RCTImageLoaderTestsDecoder2 alloc] initWithPriority:0.5
      canDecodeImageDataHandler:^BOOL(__unused NSData *imageData) {
        return YES;
      }
      decodeImageDataHandler:^RCTImageLoaderCancellationBlock(
          __unused NSData *imageData,
          __unused CGSize size,
          __unused CGFloat scale,
          __unused RCTResizeMode resizeMode,
          __unused RCTImageLoaderCompletionBlock completionHandler) {
        XCTFail(@"Should not have used decoder2");
        return nil;
      }];

  NS_VALID_UNTIL_END_OF_SCOPE RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                                                        moduleProvider:^{
                                                                          return @[ decoder1, decoder2 ];
                                                                        }
                                                                         launchOptions:nil];

  RCTImageLoaderCancellationBlock cancelBlock =
      [[bridge moduleForClass:[RCTImageLoader class]] decodeImageData:data
                                                                 size:CGSizeMake(1, 1)
                                                                scale:1.0
                                                              clipped:NO
                                                           resizeMode:RCTResizeModeStretch
                                                      completionBlock:^(NSError *decodeError, id decodedImage) {
                                                        XCTAssertEqualObjects(decodedImage, image);
                                                        XCTAssertNil(decodeError);
                                                      }];
  XCTAssertNotNil(cancelBlock);
}

@end
