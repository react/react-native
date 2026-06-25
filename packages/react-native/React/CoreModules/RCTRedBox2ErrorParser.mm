/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBox2ErrorParser+Internal.h"

#import <React/RCTDefines.h>
#import <react/debug/redbox/RedBoxErrorParser.h>

#if RCT_DEV_MENU

using facebook::react::unstable_redbox::ParsedError;
using facebook::react::unstable_redbox::parseErrorMessage;

static RCTRedBox2ErrorData *RCTRedBox2ErrorDataFromParsedError(const ParsedError &parsed)
{
  RCTRedBox2ErrorData *data = [[RCTRedBox2ErrorData alloc] init];
  data.title = [NSString stringWithUTF8String:parsed.title.c_str()];
  data.message = [NSString stringWithUTF8String:parsed.message.c_str()];
  data.isCompileError = parsed.isCompileError;
  data.isRetryable = parsed.isRetryable;

  if (parsed.codeFrame.has_value()) {
    const auto &cf = *parsed.codeFrame;
    data.codeFrame = [NSString stringWithUTF8String:cf.content.c_str()];
    data.codeFrameFileName = [NSString stringWithUTF8String:cf.fileName.c_str()];
    data.codeFrameRow = cf.row;
    data.codeFrameColumn = cf.column;
  }

  return data;
}

@implementation RCTRedBox2ErrorData
@end

@implementation RCTRedBox2ErrorParser

+ (RCTRedBox2ErrorData *)parseErrorMessage:(NSString *)message
                                      name:(nullable NSString *)name
                            componentStack:(nullable NSString *)componentStack
                                   isFatal:(BOOL)isFatal
{
  auto parsed = parseErrorMessage(
      (message != nullptr) ? std::string(message.UTF8String) : std::string(),
      (name != nullptr) ? std::string(name.UTF8String) : std::string(),
      (componentStack != nullptr) ? std::string(componentStack.UTF8String) : std::string(),
      isFatal);
  return RCTRedBox2ErrorDataFromParsedError(parsed);
}

@end

#endif
