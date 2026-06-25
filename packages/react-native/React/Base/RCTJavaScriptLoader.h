/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>

extern NSString *const RCTJavaScriptLoaderErrorDomain;

NS_ENUM(NSInteger){
    RCTJavaScriptLoaderErrorNoScriptURL = 1,
    RCTJavaScriptLoaderErrorFailedOpeningFile = 2,
    RCTJavaScriptLoaderErrorFailedReadingFile = 3,
    RCTJavaScriptLoaderErrorFailedStatingFile = 3,
    RCTJavaScriptLoaderErrorURLLoadFailed = 3,
    RCTJavaScriptLoaderErrorBCVersion = 4,
    RCTJavaScriptLoaderErrorBCNotSupported = 4,

    RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously = 1000,
};

NS_ENUM(NSInteger){
    RCTSourceFilesChangedCountNotBuiltByBundler = -2,
    RCTSourceFilesChangedCountRebuiltFromScratch = -1,
};

@interface RCTLoadingProgress : NSObject

@property (nonatomic, copy) NSString *status;
@property (strong, nonatomic) NSNumber *done;
@property (strong, nonatomic) NSNumber *total;
@property (strong, nonatomic) NSNumber *percent;

@end

@interface RCTSource : NSObject

/**
 * URL of the source object.
 */
@property (strong, nonatomic, readonly) NSURL *url;

/**
 * JS source (or simply the binary header in the case of a RAM bundle).
 */
@property (strong, nonatomic, readonly) NSData *data;

/**
 * Length of the entire JS bundle. Note that self.length != self.data.length in the case of certain bundle formats. For
 * instance, when using RAM bundles:
 *
 *  - self.data will point to the bundle header
 *  - self.data.length is the length of the bundle header, i.e. sizeof(facebook::react::BundleHeader)
 *  - self.length is the length of the entire bundle file (header + contents)
 */
@property (nonatomic, readonly) NSUInteger length;

/**
 * Returns number of files changed when building this bundle:
 *
 *  - RCTSourceFilesChangedCountNotBuiltByBundler if the source wasn't built by the bundler (e.g. read from disk)
 *  - RCTSourceFilesChangedCountRebuiltFromScratch if the source was rebuilt from scratch by the bundler
 *  - Otherwise, the number of files changed when incrementally rebuilding the source
 */
@property (nonatomic, readonly) NSInteger filesChangedCount;

@end

typedef void (^RCTSourceLoadProgressBlock)(RCTLoadingProgress *progressData);
typedef void (^RCTSourceLoadBlock)(NSError *error, RCTSource *source);

@interface RCTJavaScriptLoader : NSObject

+ (void)loadBundleAtURL:(NSURL *)scriptURL
             onProgress:(RCTSourceLoadProgressBlock)onProgress
             onComplete:(RCTSourceLoadBlock)onComplete;

/**
 * @experimental
 * Attempts to synchronously load the script at the given URL. The following two conditions must be met:
 *   1. It must be a file URL.
 *   2. It must not point to a text/javascript file.
 * If the URL does not meet those conditions, this method will return nil and supply an error with the domain
 * RCTJavaScriptLoaderErrorDomain and the code RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously.
 */
+ (NSData *)attemptSynchronousLoadOfBundleAtURL:(NSURL *)scriptURL
                                   sourceLength:(int64_t *)sourceLength
                                          error:(NSError **)error;

@end
