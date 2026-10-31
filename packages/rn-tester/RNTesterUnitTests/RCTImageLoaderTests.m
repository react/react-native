/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTImageLoader.h>

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
