/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <ReactCommon/RCTTurboModule.h>
#import <hermes/hermes.h>

#import <memory>
#import <string>
#import <vector>

using namespace facebook;
using facebook::react::TurboModuleConvertUtils::convertObjCObjectToJSIValue;

// An NSString subclass that only implements the primitive methods, so
// CoreFoundation can't hand out a pointer to its characters.
@interface RCTTurboModuleStringConversionTestsString : NSString
- (instancetype)initWithCharacters:(std::vector<unichar>)characters;
@end

@implementation RCTTurboModuleStringConversionTestsString {
  std::vector<unichar> _characters;
}

- (instancetype)initWithCharacters:(std::vector<unichar>)characters
{
  if (self = [super init]) {
    _characters = std::move(characters);
  }
  return self;
}

- (NSUInteger)length
{
  return _characters.size();
}

- (unichar)characterAtIndex:(NSUInteger)index
{
  return _characters[index];
}

@end

namespace {

std::u16string utf16FromNSString(NSString *string)
{
  std::u16string utf16(string.length, u'\0');
  [string getCharacters:reinterpret_cast<unichar *>(utf16.data()) range:NSMakeRange(0, string.length)];
  return utf16;
}

// Strings read from data, like the text that `FileReader` returns.
NSString *stringFromUTF8Data(NSString *string)
{
  return [[NSString alloc] initWithData:[string dataUsingEncoding:NSUTF8StringEncoding] encoding:NSUTF8StringEncoding];
}

NSString *stringWithCharacters(std::vector<unichar> characters)
{
  return [NSString stringWithCharacters:characters.data() length:characters.size()];
}

bool hasASCIIPointer(NSString *string)
{
  return CFStringGetCStringPtr((__bridge CFStringRef)string, kCFStringEncodingASCII) != nullptr;
}

bool hasUTF16Pointer(NSString *string)
{
  return CFStringGetCharactersPtr((__bridge CFStringRef)string) != nullptr;
}

} // namespace

@interface RCTTurboModuleStringConversionTests : XCTestCase
@end

@implementation RCTTurboModuleStringConversionTests {
  std::unique_ptr<jsi::Runtime> _runtime;
}

- (void)setUp
{
  [super setUp];
  _runtime = facebook::hermes::makeHermesRuntime();
}

- (void)tearDown
{
  _runtime.reset();
  [super tearDown];
}

- (void)assertConvertsToSameCharacters:(NSString *)string
{
  jsi::Value value = convertObjCObjectToJSIValue(*_runtime, string);
  XCTAssertTrue(value.isString(), @"Expected a JS string for \"%@\"", string);
  XCTAssertTrue(
      value.asString(*_runtime).utf16(*_runtime) == utf16FromNSString(string),
      @"Expected the JS string to have the same characters as \"%@\"",
      string);
}

- (void)testASCIIStringWithASCIIPointer
{
  NSString *string = stringFromUTF8Data(@"com.facebook.react.uiapp");
  XCTAssertTrue(hasASCIIPointer(string), @"Expected the string to expose its ASCII characters");
  [self assertConvertsToSameCharacters:string];
  [self assertConvertsToSameCharacters:@"constant"];
}

- (void)testTaggedPointerString
{
  // Short strings like this one are tagged pointers, which have no character buffer.
  NSString *string = stringWithCharacters({u'i', u'd'});
  XCTAssertFalse(hasASCIIPointer(string), @"Expected the string to have no ASCII pointer");
  XCTAssertFalse(hasUTF16Pointer(string), @"Expected the string to have no UTF-16 pointer");
  [self assertConvertsToSameCharacters:string];
}

- (void)testNonASCIIString
{
  NSString *string = stringFromUTF8Data(@"Zażółć gęślą jaźń");
  XCTAssertTrue(hasUTF16Pointer(string), @"Expected the string to expose its UTF-16 characters");
  [self assertConvertsToSameCharacters:string];
  [self assertConvertsToSameCharacters:stringFromUTF8Data(@"日本語のテキスト")];
}

- (void)testStringWithSurrogatePairs
{
  [self assertConvertsToSameCharacters:stringFromUTF8Data(@"Rocket 🚀 and family 👨‍👩‍👧")];
}

- (void)testEmptyString
{
  [self assertConvertsToSameCharacters:@""];
}

- (void)testLargeString
{
  NSMutableString *string = [NSMutableString new];
  for (int i = 0; i < 20000; i++) {
    [string appendFormat:@"{\"id\":%d,\"name\":\"Zażółć %d 🚀\"},", i, i];
  }
  [self assertConvertsToSameCharacters:stringFromUTF8Data(string)];
}

- (void)testStringSubclass
{
  NSString *string =
      [[RCTTurboModuleStringConversionTestsString alloc] initWithCharacters:{u'a', u'ż', 0xD83D, 0xDE80}];
  XCTAssertFalse(hasASCIIPointer(string), @"Expected the string to have no ASCII pointer");
  XCTAssertFalse(hasUTF16Pointer(string), @"Expected the string to have no UTF-16 pointer");
  [self assertConvertsToSameCharacters:string];
}

- (void)testStringWithNullCharacterIsNotTruncated
{
  NSString *ascii = [[NSString alloc] initWithBytes:"aaaaaaaaaaaaaaaaaaaa\0b" length:22 encoding:NSUTF8StringEncoding];
  XCTAssertTrue(hasASCIIPointer(ascii), @"Expected the string to expose its ASCII characters");
  [self assertConvertsToSameCharacters:ascii];
  [self assertConvertsToSameCharacters:stringWithCharacters({u'a', 0, u'b'})];
  [self assertConvertsToSameCharacters:stringWithCharacters({u'ż', 0, u'b'})];
}

- (void)testStringWithLoneSurrogateIsKept
{
  NSString *string = stringWithCharacters({u'a', 0xD800, u'b'});
  XCTAssertTrue(hasUTF16Pointer(string), @"Expected the string to expose its UTF-16 characters");
  [self assertConvertsToSameCharacters:string];
  [self assertConvertsToSameCharacters:stringWithCharacters({u'a', 0xDC00})];
}

- (void)testStringSubclassWithLoneSurrogateIsKept
{
  NSString *string = [[RCTTurboModuleStringConversionTestsString alloc] initWithCharacters:{u'a', 0xD800, u'b'}];
  XCTAssertFalse(hasUTF16Pointer(string), @"Expected the string to have no UTF-16 pointer");
  [self assertConvertsToSameCharacters:string];
}

@end
