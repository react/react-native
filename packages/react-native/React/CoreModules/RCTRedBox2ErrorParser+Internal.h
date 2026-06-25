/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

/**
 * Structured error data extracted from a raw error message.
 * Mirrors LogBoxLog.js / parseLogBoxLog.js data model.
 */
@interface RCTRedBox2ErrorData : NSObject

/// Display title, e.g. "Syntax Error", "Render Error", "Uncaught Error"
@property (nonatomic, copy) NSString *title;
/// The error message body (code frame stripped out)
@property (nonatomic, copy) NSString *message;
/// Raw code frame text with ANSI escape codes preserved (nil if not a syntax/transform error)
@property (nonatomic, copy, nullable) NSString *codeFrame;
/// Source file path for the code frame
@property (nonatomic, copy, nullable) NSString *codeFrameFileName;
/// Line number in the source file
@property (nonatomic, assign) NSInteger codeFrameRow;
/// Column number in the source file
@property (nonatomic, assign) NSInteger codeFrameColumn;
/// Whether this is a compile-time error (syntax, transform, resolution) vs a runtime error
@property (nonatomic, assign) BOOL isCompileError;
/// Whether auto-retry is appropriate (compile errors, connectivity failures, etc.)
@property (nonatomic, assign) BOOL isRetryable;

@end

/**
 * Parses raw error messages into structured RCTRedBox2ErrorData.
 * ObjC port of parseLogBoxLog.js / parseLogBoxException.
 */
@interface RCTRedBox2ErrorParser : NSObject

+ (RCTRedBox2ErrorData *)parseErrorMessage:(NSString *)message
                                      name:(nullable NSString *)name
                            componentStack:(nullable NSString *)componentStack
                                   isFatal:(BOOL)isFatal;

@end
