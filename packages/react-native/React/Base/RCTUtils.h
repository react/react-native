/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTAssert.h>
#import <React/RCTDefines.h>

NS_ASSUME_NONNULL_BEGIN

// Whether the New Architecture is enabled or not
RCT_EXTERN BOOL RCTIsNewArchEnabled(void);

// Whether React native should output logs for modules and components used
// through the interop layers
RCT_EXTERN BOOL RCTAreLegacyLogsEnabled(void);

// JSON serialization/deserialization
RCT_EXTERN NSString *__nullable RCTJSONStringify(id __nullable jsonObject, NSError **error);
RCT_EXTERN id __nullable RCTJSONParse(NSString *__nullable jsonString, NSError **error);
RCT_EXTERN id __nullable RCTJSONParseMutable(NSString *__nullable jsonString, NSError **error);

// Sanitize a JSON object by stripping invalid types and/or NaN values
RCT_EXTERN id RCTJSONClean(id object);

// Get MD5 hash of a string
RCT_EXTERN NSString *RCTMD5Hash(NSString *string);

// Check if we are currently on the main queue (not to be confused with
// the main thread, which is not necessarily the same thing)
// https://twitter.com/olebegemann/status/738656134731599872
RCT_EXTERN BOOL RCTIsMainQueue(void);

// Execute the specified block on the main queue. Unlike dispatch_async()
// this will execute immediately if we're already on the main queue.
RCT_EXTERN void RCTExecuteOnMainQueue(dispatch_block_t block);

// Legacy function to execute the specified block on the main queue synchronously.
// Please do not use this unless you know what you're doing.
RCT_EXTERN void RCTUnsafeExecuteOnMainQueueSync(dispatch_block_t block);

// Get screen metrics in a thread-safe way
RCT_EXTERN CGFloat RCTScreenScale(void);
RCT_EXTERN CGFloat RCTFontSizeMultiplier(void);
RCT_EXTERN CGSize RCTScreenSize(void);
RCT_EXTERN CGSize RCTViewportSize(void);
RCT_EXTERN CGSize RCTSwitchSize(void);

// Round float coordinates to nearest whole screen pixel (not point)
RCT_EXTERN CGFloat RCTRoundPixelValue(CGFloat value);
RCT_EXTERN CGFloat RCTCeilPixelValue(CGFloat value);

// Convert a size in points to pixels, rounded up to the nearest integral size
RCT_EXTERN CGSize RCTSizeInPixels(CGSize pointSize, CGFloat scale);

// Method swizzling
RCT_EXTERN void RCTSwapClassMethods(Class cls, SEL original, SEL replacement);
RCT_EXTERN void RCTSwapInstanceMethods(Class cls, SEL original, SEL replacement);
RCT_EXTERN void RCTSwapInstanceMethodWithBlock(Class cls, SEL original, id replacementBlock, SEL replacementSelector);

// Module subclass support
RCT_EXTERN BOOL RCTClassOverridesClassMethod(Class cls, SEL selector);
RCT_EXTERN BOOL RCTClassOverridesInstanceMethod(Class cls, SEL selector);

// Creates a standardized error object to return in callbacks
RCT_EXTERN NSDictionary<NSString *, id> *
RCTMakeError(NSString *message, id __nullable toStringify, NSDictionary<NSString *, id> *__nullable extraData);
RCT_EXTERN NSDictionary<NSString *, id> *
RCTMakeAndLogError(NSString *message, id __nullable toStringify, NSDictionary<NSString *, id> *__nullable extraData);
RCT_EXTERN NSDictionary<NSString *, id> *RCTJSErrorFromNSError(NSError *error);
RCT_EXTERN NSDictionary<NSString *, id> *
RCTJSErrorFromCodeMessageAndNSError(NSString *code, NSString *message, NSError *__nullable error);

// The default error code to use as the `code` property for callback error objects
RCT_EXTERN NSString *const RCTErrorUnspecified;

// Returns YES if React is running in a test environment
RCT_EXTERN BOOL RCTRunningInTestEnvironment(void);

// Returns YES if React is running in an iOS App Extension
RCT_EXTERN BOOL RCTRunningInAppExtension(void);

// Returns the shared UIApplication instance, or nil if running in an App Extension
RCT_EXTERN UIApplication *__nullable RCTSharedApplication(void);

// Returns the current main window, useful if you need to access the root view
// or view controller
RCT_EXTERN UIWindow *__nullable RCTKeyWindow(void);

// Returns the presented view controller, useful if you need
// e.g. to present a modal view controller or alert over it
RCT_EXTERN UIViewController *__nullable RCTPresentedViewController(void);

// Retrieve current window UIStatusBarManager
#if !TARGET_OS_TV
RCT_EXTERN UIStatusBarManager *__nullable RCTUIStatusBarManager(void) API_AVAILABLE(ios(13));
#endif

// Does this device support force touch (aka 3D Touch)?
RCT_EXTERN BOOL RCTForceTouchAvailable(void);

// Create an NSError in the RCTErrorDomain
RCT_EXTERN NSError *RCTErrorWithMessage(NSString *message);

// Creates an NSError from given an NSException
RCT_EXTERN NSError *RCTErrorWithNSException(NSException *exception);

// Convert nil values to NSNull, and vice-versa
#define RCTNullIfNil(value) ((value) ? (value) : (id)kCFNull)
#define RCTNilIfNull(value)                           \
  ({                                                  \
    __typeof__(value) t = (value);                    \
    (id) t == (id)kCFNull ? (__typeof(value))nil : t; \
  })

// Convert NaN or infinite values to zero, as these aren't JSON-safe
RCT_EXTERN double RCTZeroIfNaN(double value);

// Returns `0` and log special warning if value is NaN or INF.
RCT_EXTERN double RCTSanitizeNaNValue(double value, NSString *property);

// Convert data to a Base64-encoded data URL
RCT_EXTERN NSURL *RCTDataURL(NSString *mimeType, NSData *data);

// Gzip functionality - compression level in range 0 - 1 (-1 for default)
RCT_EXTERN NSData *__nullable RCTGzipData(NSData *__nullable data, float level);

// Gzip decompression - maxDecompressedSize of 0 means no limit, returns nil if
// limit exceeded or decompression fails
RCT_EXTERN NSData *__nullable RCTDecompressGzipData(NSData *__nullable data, NSUInteger maxDecompressedSize);

// Returns the relative path within the main bundle for an absolute URL
// (or nil, if the URL does not specify a path within the main bundle)
RCT_EXTERN NSString *__nullable RCTBundlePathForURL(NSURL *__nullable URL);

// Returns the asset catalog image name for a packager asset URL, or nil if the
// URL is not a main-bundle packager asset. The name matches the identifier the
// CLI uses when generating the catalog (see assetPathUtils.getResourceIdentifier).
RCT_EXTERN NSString *__nullable RCTAssetCatalogNameForURL(NSURL *__nullable URL);

// Returns the Path of Library directory
RCT_EXTERN NSString *__nullable RCTLibraryPath(void);

// Returns the relative path within the library for an absolute URL
// (or nil, if the URL does not specify a path within the Library directory)
RCT_EXTERN NSString *__nullable RCTLibraryPathForURL(NSURL *__nullable URL);

// Determines if a given image URL refers to a image in bundle
RCT_EXTERN BOOL RCTIsBundleAssetURL(NSURL *__nullable imageURL);

// Determines if a given image URL refers to a image in library
RCT_EXTERN BOOL RCTIsLibraryAssetURL(NSURL *__nullable imageURL);

// Determines if a given image URL refers to a local image
RCT_EXTERN BOOL RCTIsLocalAssetURL(NSURL *__nullable imageURL);

// Returns an UIImage for a local image asset. Returns nil if the URL
// does not correspond to a local asset.
RCT_EXTERN UIImage *__nullable RCTImageFromLocalAssetURL(NSURL *imageURL);

// Only used in case when RCTImageFromLocalAssetURL fails to get an image
// This method basically checks for the image in the bundle location, instead
// of the CodePush location
RCT_EXTERN UIImage *__nullable RCTImageFromLocalBundleAssetURL(NSURL *imageURL);

// Creates a new, unique temporary file path with the specified extension
RCT_EXTERN NSString *__nullable RCTTempFilePath(NSString *__nullable extension, NSError **error);

// Get RGBA components of CGColor
RCT_EXTERN void RCTGetRGBAColorComponents(CGColorRef color, CGFloat rgba[_Nonnull 4]);

// Converts a CGColor to a hex string
RCT_EXTERN NSString *RCTColorToHexString(CGColorRef color);

// Get standard localized string (if it exists)
RCT_EXTERN NSString *RCTUIKitLocalizedString(NSString *string);

// Get a human readable type string from an NSObject. For example NSString becomes string
RCT_EXTERN NSString *RCTHumanReadableType(NSObject *obj);

// URL manipulation
RCT_EXTERN NSString *__nullable RCTGetURLQueryParam(NSURL *__nullable URL, NSString *param);
RCT_EXTERN NSURL *__nullable
RCTURLByReplacingQueryParam(NSURL *__nullable URL, NSString *param, NSString *__nullable value);

// Given a string, drop common RN prefixes (RCT, RK, etc.)
RCT_EXTERN NSString *RCTDropReactPrefixes(NSString *s);

RCT_EXTERN BOOL RCTUIManagerTypeForTagIsFabric(NSNumber *reactTag);

RCT_EXTERN BOOL RCTValidateTypeOfViewCommandArgument(
    NSObject *obj,
    id expectedClass,
    const NSString *expectedType,
    const NSString *componentName,
    const NSString *commandName,
    const NSString *argPos);

RCT_EXTERN BOOL RCTIsAppActive(void);

NS_ASSUME_NONNULL_END
