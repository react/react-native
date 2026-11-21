/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <ReactCommon/TestCallInvoker.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleWithJSIBindings.h>
#include <folly/io/IOBuf.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>
#include <react/io/BlobModule.h>
#include <react/io/BlobStore.h>
#include <react/io/FileReaderModule.h>
#include <react/io/NetworkingModule.h>
#include <memory>
#include <string>

namespace facebook::react {

namespace {

// UTF-8 text containing non-ASCII punctuation and emoji.
constexpr std::string_view kCaptionUtf8 =
    "He\xE2\x80\x99s my coworker now \xF0\x9F\x98\xBA #cat \xF0\x9F\x98\x8D\xF0\x9F\x98\x82";
constexpr std::string_view kCaptionJsLiteral =
    R"("He’s my coworker now 😺 #cat 😍😂")";

class FakeHttpClient : public IHttpClient {
 public:
  explicit FakeHttpClient(std::shared_ptr<std::string> responseBody)
      : responseBody_(std::move(responseBody)) {}

  std::unique_ptr<http::IRequestToken> sendRequest(
      http::NetworkCallbacks&& callbacks,
      const std::string& /*method*/,
      const std::string& /*url*/,
      const http::Headers& /*headers*/,
      const http::Body& /*body*/,
      uint32_t /*timeout*/,
      std::optional<std::string> /*loggingId*/) override {
    callbacks.onResponse(
        200, {{"content-type", "application/json; charset=utf-8"}});
    callbacks.onBody(folly::IOBuf::copyBuffer(*responseBody_));
    callbacks.onResponseComplete("", false);
    return nullptr;
  }

 private:
  std::shared_ptr<std::string> responseBody_;
};

class FileReaderTest : public ::testing::Test {
 protected:
  void SetUp() override {
    runtime_ = facebook::hermes::makeHermesRuntime();
    jsInvoker_ = std::make_shared<TestCallInvoker>(*runtime_);
    responseBody_ = std::make_shared<std::string>();
    // Hermes' Promise implementation schedules reactions with setImmediate.
    auto setImmediateName =
        jsi::PropNameID::forAscii(*runtime_, "setImmediate");
    runtime_->global().setProperty(
        *runtime_,
        setImmediateName,
        jsi::Function::createFromHostFunction(
            *runtime_,
            setImmediateName,
            1,
            [jsInvoker = jsInvoker_](
                jsi::Runtime& rt,
                const jsi::Value& /*thisVal*/,
                const jsi::Value* args,
                size_t /*count*/) {
              jsInvoker->invokeAsync([callback = std::make_shared<jsi::Value>(
                                          rt, *args)](jsi::Runtime& rt) {
                callback->asObject(rt).asFunction(rt).call(rt);
              });
              return jsi::Value::undefined();
            }));
    auto store = std::make_shared<BlobStore>();
    registerModule(
        "BlobModule", std::make_shared<BlobModule>(jsInvoker_, store));
    registerModule(
        "FileReaderModule",
        std::make_shared<FileReaderModule>(jsInvoker_, store));
    registerModule(
        "Networking",
        std::make_shared<NetworkingModule>(
            jsInvoker_,
            [body = responseBody_]() {
              return std::make_unique<FakeHttpClient>(body);
            },
            std::make_shared<BlobNetworkingResponseHandler>(store)));
    eval(R"(
      var events = [];
      globalThis.__rctDeviceEventEmitter = {
        emit: function (name, payload) { events.push([name, payload]); },
      };
      function settle(promise) {
        var state = {};
        promise.then(
          function (value) { state.value = value; },
          function (error) { state.error = error.message; });
        return state;
      }
    )");
  }

  void TearDown() override {
    jsInvoker_->flushQueue();
    LongLivedObjectCollection::get(*runtime_).clear(*runtime_);
    jsInvoker_ = nullptr;
    runtime_ = nullptr;
  }

  jsi::Value eval(const std::string& js) {
    auto result = runtime_->evaluateJavaScript(
        std::make_shared<jsi::StringBuffer>(js), "FileReaderTest.js");
    jsInvoker_->flushQueue();
    return result;
  }

  std::string evalString(const std::string& js) {
    return eval(js).asString(*runtime_).utf8(*runtime_);
  }

  bool evalBool(const std::string& js) {
    return eval(js).getBool();
  }

  void registerModule(const char* name, std::shared_ptr<TurboModule> module) {
    TurboModuleWithJSIBindings::installJSIBindings(module, *runtime_);
    runtime_->global().setProperty(
        *runtime_, name, jsi::Object::createFromHostObject(*runtime_, module));
  }

  std::shared_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::shared_ptr<TestCallInvoker> jsInvoker_;
  std::shared_ptr<std::string> responseBody_;
};

} // namespace

TEST_F(FileReaderTest, StoresAreIndependent) {
  eval(
      "BlobModule.createFromParts([{type: 'string', data: 'abc'}], 'shared-id');");
  auto otherReader = std::make_shared<FileReaderModule>(
      jsInvoker_, std::make_shared<BlobStore>());
  runtime_->global().setProperty(
      *runtime_,
      "otherReader",
      jsi::Object::createFromHostObject(*runtime_, otherReader));
  eval(R"(
    var descriptor = {blobId: 'shared-id', offset: 0, size: 3};
    var original = settle(FileReaderModule.readAsText(descriptor, 'utf-8'));
    var other = settle(otherReader.readAsText(descriptor, 'utf-8'));
  )");
  EXPECT_EQ(evalString("original.value"), "abc");
  EXPECT_EQ(evalString("other.error"), "The specified blob is invalid");
}

// The read path of `fetch(...).then(r => r.text())` once BlobModule exists:
// whatwg-fetch sets responseType 'blob', XMLHttpRequest wraps the native
// BlobData in a Blob, and `text()` calls FileReader.readAsText(blob, 'utf-8').
TEST_F(FileReaderTest, BlobResponseReadAsTextDecodesUtf8) {
  *responseBody_ = R"({"text":")" + std::string(kCaptionUtf8) + R"("})";
  eval(R"(
    BlobModule.addNetworkingHandler();
    Networking.sendRequest(
      'POST', 'https://example.com/text', 1,
      [['Content-Type', 'application/x-www-form-urlencoded']],
      {string: 'message=hello'}, 'blob', false, 0, false);
  )");
  eval(R"(
    var data = events.filter(function (e) { return e[0] === 'didReceiveNetworkData'; })[0][1];
    var blob = data[1];
    var read = settle(FileReaderModule.readAsText(blob, 'utf-8'));
  )");
  EXPECT_TRUE(evalBool("data[0] === 1 && typeof blob === 'object'"));
  EXPECT_TRUE(evalBool(
      "blob.offset === 0 && blob.size === " +
      std::to_string(responseBody_->size())));
  EXPECT_TRUE(evalBool("read.error === undefined"));
  EXPECT_TRUE(evalBool(
      "JSON.parse(read.value).text === " + std::string(kCaptionJsLiteral)));
  EXPECT_EQ(evalString("JSON.parse(read.value).text"), kCaptionUtf8);
  EXPECT_TRUE(evalBool(
      "events.some(function (e) { return e[0] === 'didCompleteNetworkResponse'; })"));
}

TEST_F(FileReaderTest, BinaryResponsePreservesNullAndHighBytes) {
  *responseBody_ = std::string("\0\xFF\x80\0", 4);
  eval(R"(
    Networking.sendRequest('GET', 'https://example.com/binary', 3, [], {}, 'blob', false, 0, false);
  )");
  eval(R"(
    var data = events.filter(function (e) { return e[0] === 'didReceiveNetworkData'; })[0][1][1];
    var whole = settle(FileReaderModule.readAsDataURL(data));
    BlobModule.createFromParts(
      [{type: 'blob', data: {blobId: data.blobId, offset: 1, size: 2}}], 'binary-slice');
    var slice = settle(FileReaderModule.readAsDataURL(
      {blobId: 'binary-slice', offset: 0, size: 2}));
  )");
  EXPECT_EQ(
      evalString("whole.value"),
      "data:application/octet-stream;base64,AP+AAA==");
  EXPECT_EQ(
      evalString("slice.value"), "data:application/octet-stream;base64,/4A=");
  EXPECT_EQ(eval("data.size").getNumber(), 4);
}

TEST_F(FileReaderTest, EmptyBlobReadsAsTextAndDataUrl) {
  eval(R"(
    BlobModule.createFromParts([], 'empty');
    var descriptor = {blobId: 'empty', offset: 0, size: 0};
    var text = settle(FileReaderModule.readAsText(descriptor, 'utf-8'));
    var url = settle(FileReaderModule.readAsDataURL(descriptor));
  )");
  EXPECT_EQ(evalString("text.value"), "");
  EXPECT_EQ(evalString("url.value"), "data:application/octet-stream;base64,");
}

TEST_F(FileReaderTest, TextResponseTypeIsUnchanged) {
  *responseBody_ = std::string(kCaptionUtf8);
  eval(R"(
    Networking.sendRequest('GET', 'https://example.com', 2, [], {}, 'text', false, 0, false);
  )");
  eval(R"(
    var text = events.filter(function (e) { return e[0] === 'didReceiveNetworkData'; })[0][1][1];
  )");
  EXPECT_TRUE(evalBool("typeof text === 'string'"));
  EXPECT_EQ(evalString("text"), kCaptionUtf8);
}

TEST_F(FileReaderTest, CreateFromPartsRoundTripsStringsAndBlobSlices) {
  eval(R"(
    BlobModule.createFromParts([{type: 'string', data: 'café 日本語 😺'}], 'a');
    // 'café ' is 6 bytes and '日本語' is 9: slice the CJK out of blob 'a'.
    BlobModule.createFromParts(
      [{type: 'string', data: '<'}, {type: 'blob', data: {blobId: 'a', offset: 6, size: 9}},
       {type: 'string', data: '>'}],
      'b');
    var whole = settle(FileReaderModule.readAsText({blobId: 'a', offset: 0, size: 20}, 'UTF-8'));
    var slice = settle(FileReaderModule.readAsText({blobId: 'b', offset: 0, size: 11}, 'utf-8'));
  )");
  EXPECT_TRUE(evalBool(
      "whole.value === 'caf\\u00e9 \\u65e5\\u672c\\u8a9e \\ud83d\\ude3a'"));
  EXPECT_TRUE(evalBool("slice.value === '<\\u65e5\\u672c\\u8a9e>'"));
}

TEST_F(FileReaderTest, ReadAsDataUrlEncodesBase64WithType) {
  eval(R"(
    BlobModule.createFromParts([{type: 'string', data: '😺'}], 'cat');
    var typed = settle(FileReaderModule.readAsDataURL(
      {blobId: 'cat', offset: 0, size: 4, type: 'text/plain'}));
    var untyped = settle(FileReaderModule.readAsDataURL({blobId: 'cat', offset: 0, size: 4}));
  )");
  EXPECT_EQ(evalString("typed.value"), "data:text/plain;base64,8J+Yug==");
  EXPECT_EQ(
      evalString("untyped.value"),
      "data:application/octet-stream;base64,8J+Yug==");
}

TEST_F(FileReaderTest, ReleasedAndOutOfRangeBlobsReject) {
  eval(R"(
    BlobModule.createFromParts([{type: 'string', data: 'abc'}], 'r');
    var outOfRange = settle(FileReaderModule.readAsText({blobId: 'r', offset: 1, size: 3}, 'utf-8'));
    BlobModule.release('r');
    var released = settle(FileReaderModule.readAsText({blobId: 'r', offset: 0, size: 3}, 'utf-8'));
  )");
  EXPECT_EQ(evalString("outOfRange.error"), "The specified blob is invalid");
  EXPECT_EQ(evalString("released.error"), "The specified blob is invalid");
}

TEST_F(FileReaderTest, NonIndexOffsetsAndSizesReject) {
  eval(R"(
    BlobModule.createFromParts([{type: 'string', data: 'abcd'}], 'n');
    function read(offset, size) {
      return settle(FileReaderModule.readAsText({blobId: 'n', offset: offset, size: size}, 'utf-8'));
    }
    var bad = [
      [NaN, 1], [0, NaN], [Infinity, 1], [0, Infinity], [1.5, 1], [0, 1.5],
      [-1, 1], [0, -1], [-0.5, 1], [1e30, 1], [0, 1e30], [5, 0], [0, 5],
      [Math.pow(2, 64), 1], [0, Math.pow(2, 64)],
    ].map(function (args) { return read(args[0], args[1]); });
    var valid = read(1, 2);
    var empty = read(4, 0);
  )");
  EXPECT_EQ(eval("bad.length").getNumber(), 15);
  EXPECT_TRUE(evalBool(
      "bad.every(function (r) { return r.error === 'The specified blob is invalid'; })"));
  EXPECT_EQ(evalString("valid.value"), "bc");
  EXPECT_EQ(evalString("empty.value"), "");
  for (const auto* part :
       {"{blobId: 'n', offset: NaN, size: 1}",
        "{blobId: 'n', offset: 0, size: Infinity}",
        "{blobId: 'n', offset: 0.5, size: 1}",
        "{blobId: 'n', offset: 1e30, size: 1}"}) {
    EXPECT_THROW(
        eval(
            "BlobModule.createFromParts([{type: 'blob', data: " +
            std::string(part) + "}], 'x');"),
        jsi::JSError)
        << part;
  }
}

TEST(DecodeUtf8Test, KeepsValidUtf8) {
  EXPECT_EQ(FileReaderModule::decodeUtf8(kCaptionUtf8), kCaptionUtf8);
  EXPECT_EQ(
      FileReaderModule::decodeUtf8(
          "\xE6\x97\xA5\xE6\x9C\xAC\xE8\xAA\x9E \xED\x95\x9C\xEA\xB8\x80"),
      "\xE6\x97\xA5\xE6\x9C\xAC\xE8\xAA\x9E \xED\x95\x9C\xEA\xB8\x80");
  EXPECT_EQ(FileReaderModule::decodeUtf8(std::string_view{}), "");
  EXPECT_EQ(FileReaderModule::decodeUtf8(""), "");
}

TEST(DecodeUtf8Test, StripsLeadingBom) {
  EXPECT_EQ(FileReaderModule::decodeUtf8("\xEF\xBB\xBF"), "");
  EXPECT_EQ(FileReaderModule::decodeUtf8("\xEF\xBB\xBF{}"), "{}");
  EXPECT_EQ(FileReaderModule::decodeUtf8("a\xEF\xBB\xBF"), "a\xEF\xBB\xBF");
}

TEST(DecodeUtf8Test, ReplacesInvalidSequencesWithReplacementCharacter) {
  constexpr std::string_view kFffd = "\xEF\xBF\xBD";
  const std::string fffd(kFffd);
  // Lone continuation byte, and bytes that never appear in UTF-8.
  EXPECT_EQ(FileReaderModule::decodeUtf8("a\x80z"), "a" + fffd + "z");
  EXPECT_EQ(FileReaderModule::decodeUtf8("\xFF\xFE"), fffd + fffd);
  // A lead byte followed by ASCII: the ASCII byte is kept.
  EXPECT_EQ(FileReaderModule::decodeUtf8("\xC3("), fffd + "(");
  // Folly advances one byte on an error, including truncated sequences.
  EXPECT_EQ(FileReaderModule::decodeUtf8("\xE2\x80"), fffd + fffd);
  EXPECT_EQ(
      FileReaderModule::decodeUtf8(std::string("\xF0\x9F\x98") + "A"),
      fffd + fffd + fffd + "A");
  // Overlong encodings, UTF-16 surrogates and code points above U+10FFFF.
  EXPECT_EQ(FileReaderModule::decodeUtf8("\xC0\xAF"), fffd + fffd);
  EXPECT_EQ(FileReaderModule::decodeUtf8("\xE0\x80\xAF"), fffd + fffd + fffd);
  EXPECT_EQ(FileReaderModule::decodeUtf8("\xED\xA0\x80"), fffd + fffd + fffd);
  EXPECT_EQ(
      FileReaderModule::decodeUtf8("\xF4\x90\x80\x80"),
      fffd + fffd + fffd + fffd);
}

} // namespace facebook::react
