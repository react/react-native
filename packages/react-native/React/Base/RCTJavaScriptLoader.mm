/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTJavaScriptLoader.h"

#import <sys/stat.h>

#import <cxxreact/JSBundleType.h>

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTMultipartDataTask.h"
#import "RCTPerformanceLogger.h"
#import "RCTUtils.h"

NSString *const RCTJavaScriptLoaderErrorDomain = @"RCTJavaScriptLoaderErrorDomain";

@interface RCTSource () {
 @public
  NSURL *_url;
  NSData *_data;
  NSUInteger _length;
  NSInteger _filesChangedCount;
}

@end

@implementation RCTSource

static RCTSource *RCTSourceCreate(NSURL *url, NSData *data, int64_t length) NS_RETURNS_RETAINED
{
  using facebook::react::ScriptTag;
  facebook::react::BundleHeader header;
  [data getBytes:&header length:sizeof(header)];

  RCTSource *source = [RCTSource new];
  source->_url = url;
  source->_data = data;
  source->_length = length;
  source->_filesChangedCount = RCTSourceFilesChangedCountNotBuiltByBundler;
  return source;
}

@end

@implementation RCTLoadingProgress

- (NSString *)description
{
  NSMutableString *desc = [NSMutableString new];
  [desc appendString:_status ?: @"Bundling"];
  if (_percent != nil) {
    [desc appendFormat:@" %ld%%", (long)[_percent integerValue]];
  } else if ([_total integerValue] > 0 && [_done integerValue] > [_total integerValue]) {
    [desc appendFormat:@" %ld%%", (long)100];
  } else if ([_total integerValue] > 0) {
    [desc appendFormat:@" %ld%%", (long)(100 * [_done integerValue] / [_total integerValue])];
  } else {
    [desc appendFormat:@" %ld%%", (long)0];
  }
  [desc appendString:@"\u2026"];
  return desc;
}

@end

@implementation RCTJavaScriptLoader

RCT_NOT_IMPLEMENTED(-(instancetype)init)

+ (void)loadBundleAtURL:(NSURL *)scriptURL
             onProgress:(RCTSourceLoadProgressBlock)onProgress
             onComplete:(RCTSourceLoadBlock)onComplete
{
  int64_t sourceLength;
  NSError *error;
  NSData *data = [self attemptSynchronousLoadOfBundleAtURL:scriptURL sourceLength:&sourceLength error:&error];
  if (data) {
    onComplete(nil, RCTSourceCreate(scriptURL, data, sourceLength));
    return;
  }

  const BOOL isCannotLoadSyncError = [error.domain isEqualToString:RCTJavaScriptLoaderErrorDomain] &&
      error.code == RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously;

  if (isCannotLoadSyncError) {
    attemptAsynchronousLoadOfBundleAtURL(scriptURL, onProgress, onComplete);
  } else {
    onComplete(error, nil);
  }
}

+ (NSData *)attemptSynchronousLoadOfBundleAtURL:(NSURL *)scriptURL
                                   sourceLength:(int64_t *)sourceLength
                                          error:(NSError **)error
{
  NSString *unsanitizedScriptURLString = scriptURL.absoluteString;
  // Sanitize the script URL
  scriptURL = sanitizeURL(scriptURL);

  if (!scriptURL) {
    if (error) {
      *error = [NSError
          errorWithDomain:RCTJavaScriptLoaderErrorDomain
                     code:RCTJavaScriptLoaderErrorNoScriptURL
                 userInfo:@{
                   NSLocalizedDescriptionKey : [NSString
                       stringWithFormat:@"No script URL provided. Make sure the packager is "
                                        @"running or you have embedded a JS bundle in your application bundle.\n\n"
                                        @"unsanitizedScriptURLString = %@",
                                        unsanitizedScriptURLString]
                 }];
    }
    return nil;
  }

  // Load local script file
  if (!scriptURL.fileURL) {
    if (error) {
      *error = [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                   code:RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously
                               userInfo:@{
                                 NSLocalizedDescriptionKey :
                                     [NSString stringWithFormat:@"Cannot load %@ URLs synchronously", scriptURL.scheme]
                               }];
    }
    return nil;
  }

  // Load the first 4 bytes to check if the bundle is regular or RAM ("Random Access Modules" bundle).
  // The RAM bundle has a magic number in the 4 first bytes `(0xFB0BD1E5)`.
  // The benefit of RAM bundle over a regular bundle is that we can lazily inject
  // modules into JSC as they're required.
  FILE *bundle = fopen(scriptURL.path.UTF8String, "r");
  if (!bundle) {
    if (error) {
      *error = [NSError
          errorWithDomain:RCTJavaScriptLoaderErrorDomain
                     code:RCTJavaScriptLoaderErrorFailedOpeningFile
                 userInfo:@{
                   NSLocalizedDescriptionKey : [NSString stringWithFormat:@"Error opening bundle %@", scriptURL.path]
                 }];
    }
    return nil;
  }

  facebook::react::BundleHeader header;
  size_t readResult = fread(&header, sizeof(header), 1, bundle);
  fclose(bundle);
  if (readResult != 1) {
    if (error) {
      *error = [NSError
          errorWithDomain:RCTJavaScriptLoaderErrorDomain
                     code:RCTJavaScriptLoaderErrorFailedReadingFile
                 userInfo:@{
                   NSLocalizedDescriptionKey : [NSString stringWithFormat:@"Error reading bundle %@", scriptURL.path]
                 }];
    }
    return nil;
  }

  facebook::react::ScriptTag tag = facebook::react::parseTypeFromHeader(header);
  switch (tag) {
    case facebook::react::ScriptTag::RAMBundle:
      break;

    case facebook::react::ScriptTag::String: {
#if RCT_ENABLE_INSPECTOR
      NSData *source = [NSData dataWithContentsOfFile:scriptURL.path options:NSDataReadingMappedIfSafe error:error];
      if (sourceLength && source != nil) {
        *sourceLength = source.length;
      }
      return source;
#else
      if (error) {
        *error =
            [NSError errorWithDomain:RCTJavaScriptLoaderErrorDomain
                                code:RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously
                            userInfo:@{NSLocalizedDescriptionKey : @"Cannot load text/javascript files synchronously"}];
      }
      return nil;
#endif
    }
  }

  struct stat statInfo;
  if (stat(scriptURL.path.UTF8String, &statInfo) != 0) {
    if (error) {
      *error = [NSError
          errorWithDomain:RCTJavaScriptLoaderErrorDomain
                     code:RCTJavaScriptLoaderErrorFailedStatingFile
                 userInfo:@{
                   NSLocalizedDescriptionKey : [NSString stringWithFormat:@"Error stating bundle %@", scriptURL.path]
                 }];
    }
    return nil;
  }
  if (sourceLength) {
    *sourceLength = statInfo.st_size;
  }
  return [NSData dataWithBytes:&header length:sizeof(header)];
}

static void parseHeaders(NSDictionary *headers, RCTSource *source)
{
  source->_filesChangedCount = [headers[@"X-Metro-Files-Changed-Count"] integerValue];
}

static void attemptAsynchronousLoadOfBundleAtURL(
    NSURL *scriptURL,
    RCTSourceLoadProgressBlock onProgress,
    RCTSourceLoadBlock onComplete)
{
  scriptURL = sanitizeURL(scriptURL);

  if (scriptURL.fileURL) {
    // Reading in a large bundle can be slow. Dispatch to the background queue to do it.
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      NSError *error = nil;
      NSData *source = [NSData dataWithContentsOfFile:scriptURL.path options:NSDataReadingMappedIfSafe error:&error];
      onComplete(error, RCTSourceCreate(scriptURL, source, source.length));
    });
    return;
  }

  RCTMultipartDataTask *task = [[RCTMultipartDataTask alloc] initWithURL:scriptURL
      partHandler:^(NSInteger statusCode, NSDictionary *headers, NSData *data, NSError *error, BOOL done) {
        if (!done) {
          if (onProgress) {
            onProgress(progressEventFromData(data));
          }
          return;
        }

        // Handle general request errors
        if (error) {
          if ([error.domain isEqualToString:NSURLErrorDomain]) {
            error = [NSError
                errorWithDomain:RCTJavaScriptLoaderErrorDomain
                           code:RCTJavaScriptLoaderErrorURLLoadFailed
                       userInfo:@{
                         NSLocalizedDescriptionKey :
                             [@"Could not connect to development server.\n\n"
                               "Ensure the following:\n"
                               "- Node server is running and available on the same network - run 'npm start' from react-native root\n"
                               "- Node server URL is correctly set in AppDelegate\n"
                               "- WiFi is enabled and connected to the same network as the Node Server\n\n"
                               "URL: " stringByAppendingString:scriptURL.absoluteString],
                         NSLocalizedFailureReasonErrorKey : error.localizedDescription,
                         NSUnderlyingErrorKey : error,
                       }];
          }
          onComplete(error, nil);
          return;
        }

        // For multipart responses packager sets X-Http-Status header in case HTTP status code
        // is different from 200 OK
        NSString *statusCodeHeader = headers[@"X-Http-Status"];
        if (statusCodeHeader) {
          statusCode = [statusCodeHeader integerValue];
        }

        if (statusCode != 200) {
          error =
              [NSError errorWithDomain:@"JSServer"
                                  code:statusCode
                              userInfo:userInfoForRawResponse([[NSString alloc] initWithData:data
                                                                                    encoding:NSUTF8StringEncoding])];
          onComplete(error, nil);
          return;
        }

        // Validate that the packager actually returned javascript.
        NSString *contentType = headers[@"Content-Type"];
        NSString *mimeType = [[contentType componentsSeparatedByString:@";"] firstObject];
        if (![mimeType isEqualToString:@"application/javascript"] && ![mimeType isEqualToString:@"text/javascript"]) {
          NSString *description;
          if ([mimeType isEqualToString:@"application/json"]) {
            NSError *parseError;
            NSDictionary *jsonError = [NSJSONSerialization JSONObjectWithData:data options:0 error:&parseError];
            if (!parseError && [jsonError isKindOfClass:[NSDictionary class]] &&
                [[jsonError objectForKey:@"message"] isKindOfClass:[NSString class]] &&
                [[jsonError objectForKey:@"message"] length]) {
              description = [jsonError objectForKey:@"message"];
            } else {
              description = [NSString stringWithFormat:@"Unknown error fetching '%@'.", scriptURL.absoluteString];
            }
          } else {
            description = [NSString
                stringWithFormat:
                    @"Expected MIME-Type to be 'application/javascript' or 'text/javascript', but got '%@'.", mimeType];
          }

          error = [NSError
              errorWithDomain:@"JSServer"
                         code:NSURLErrorCannotParseResponse
                     userInfo:@{NSLocalizedDescriptionKey : description, @"headers" : headers, @"data" : data}];
          onComplete(error, nil);
          return;
        }

        // Prefer `Content-Location` as the canonical source URL, if given, or fall back to scriptURL.
        NSURL *sourceURL = scriptURL;
        NSString *contentLocationHeader = headers[@"Content-Location"];
        if (contentLocationHeader) {
          NSURL *contentLocationURL = [NSURL URLWithString:contentLocationHeader relativeToURL:scriptURL];
          if (contentLocationURL) {
            sourceURL = contentLocationURL;
          }
        }

        RCTSource *source = RCTSourceCreate(sourceURL, data, data.length);
        parseHeaders(headers, source);
        onComplete(nil, source);
      }
      progressHandler:^(NSDictionary *headers, NSNumber *loaded, NSNumber *total) {
        NSString *contentType = headers[@"Content-Type"];
        NSString *mimeType = [[contentType componentsSeparatedByString:@";"] firstObject];
        // Only care about download progress events for the javascript bundle part.
        if ([mimeType isEqualToString:@"application/javascript"] ||
            [mimeType isEqualToString:@"application/x-metro-bytecode-bundle"]) {
          onProgress(progressEventFromDownloadProgress(loaded, total));
        }
      }];

  [task startTask];
}

static NSURL *sanitizeURL(NSURL *url)
{
  // Why we do this is lost to time. We probably shouldn't; passing a valid URL is the caller's responsibility not ours.
  return [RCTConvert NSURL:url.absoluteString];
}

static RCTLoadingProgress *progressEventFromData(NSData *rawData)
{
  NSString *text = [[NSString alloc] initWithData:rawData encoding:NSUTF8StringEncoding];
  id info = RCTJSONParse(text, nil);
  if (!info || ![info isKindOfClass:[NSDictionary class]]) {
    return nil;
  }

  RCTLoadingProgress *progress = [RCTLoadingProgress new];
  progress.status = info[@"status"];
  progress.done = info[@"done"];
  progress.total = info[@"total"];
  if (info[@"percent"] != nil) {
    progress.percent = info[@"percent"];
  }
  return progress;
}

static RCTLoadingProgress *progressEventFromDownloadProgress(NSNumber *total, NSNumber *done)
{
  RCTLoadingProgress *progress = [RCTLoadingProgress new];
  progress.status = @"Downloading";
  // Progress values are in bytes transform them to kilobytes for smaller numbers.
  progress.done = done != nil ? @([done integerValue] / 1024) : nil;
  progress.total = total != nil ? @([total integerValue] / 1024) : nil;
  return progress;
}

static NSDictionary *userInfoForRawResponse(NSString *rawText)
{
  NSDictionary *parsedResponse = RCTJSONParse(rawText, nil);
  if (![parsedResponse isKindOfClass:[NSDictionary class]]) {
    return @{NSLocalizedDescriptionKey : rawText};
  }
  NSArray *errors = parsedResponse[@"errors"];
  if (![errors isKindOfClass:[NSArray class]]) {
    return @{NSLocalizedDescriptionKey : rawText};
  }
  NSMutableArray<NSDictionary *> *fakeStack = [NSMutableArray new];
  for (NSDictionary *err in errors) {
    [fakeStack addObject:@{
      @"methodName" : err[@"description"] ?: @"",
      @"file" : err[@"filename"] ?: @"",
      @"lineNumber" : err[@"lineNumber"] ?: @0
    }];
  }
  return
      @{NSLocalizedDescriptionKey : parsedResponse[@"message"] ?: @"No message provided", @"stack" : [fakeStack copy]};
}

@end
