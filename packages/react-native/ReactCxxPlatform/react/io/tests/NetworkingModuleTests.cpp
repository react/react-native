/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef _WIN32
#include <folly/portability/Unistd.h>
#include <folly/portability/Windows.h>
#endif

#include <ReactCommon/TestCallInvoker.h>
#include <folly/json.h>
#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <jsi/JSIDynamic.h>
#include <react/bridging/Base.h>
#include <react/io/NetworkingModule.h>
#include <memory>

namespace facebook::react {

namespace {

class FakeHttpClient : public IHttpClient {
 public:
  explicit FakeHttpClient(std::string body = "body bytes")
      : body_(std::move(body)) {}

  std::unique_ptr<http::IRequestToken> sendRequest(
      http::NetworkCallbacks&& callbacks,
      const std::string& /*method*/,
      const std::string& /*url*/,
      const http::Headers& /*headers*/,
      const http::Body& /*body*/,
      uint32_t /*timeout*/,
      std::optional<std::string> /*loggingId*/) override {
    auto body = folly::IOBuf::copyBuffer(body_.substr(0, body_.size() / 2));
    body->appendToChain(
        folly::IOBuf::copyBuffer(body_.substr(body_.size() / 2)));
    callbacks.onBody(std::move(body));
    callbacks.onResponseComplete("", false);
    return nullptr;
  }

 private:
  std::string body_;
};

class FakeResponseHandler : public INetworkingResponseHandler {
 public:
  bool supports(const std::string& responseType) const override {
    return responseType == "blob";
  }

  jsi::Value toResponseData(jsi::Runtime& rt, std::vector<uint8_t> body)
      override {
    auto data = jsi::Object(rt);
    data.setProperty(
        rt,
        "handled",
        jsi::String::createFromUtf8(rt, std::string(body.begin(), body.end())));
    return data;
  }
};

class RecordingResponseHandler : public INetworkingResponseHandler {
 public:
  bool supports(const std::string& responseType) const override {
    return responseType == "blob";
  }

  jsi::Value toResponseData(jsi::Runtime& /*rt*/, std::vector<uint8_t> body)
      override {
    bytes = std::move(body);
    return static_cast<double>(bytes.size());
  }

  std::vector<uint8_t> bytes;
};

} // namespace

class NetworkingModuleTests : public testing::Test {
 protected:
  void SetUp() override {
    rt_ = facebook::hermes::makeHermesRuntime();
    jsInvoker_ = std::make_shared<TestCallInvoker>(*rt_);
  }

  static void verifyFormData(
      const http::FormDataField& formData,
      const std::string& fieldName,
      const std::string& string,
      std::vector<std::string> headerValues) {
    EXPECT_EQ(formData.fieldName, fieldName);
    EXPECT_EQ(formData.string, string);
    for (int i = 0; i * 2 < headerValues.size(); ++i) {
      EXPECT_EQ(formData.headers[i].first, headerValues[i * 2]);
      EXPECT_EQ(formData.headers[i].second, headerValues[i * 2 + 1]);
    }
  }

  std::shared_ptr<facebook::hermes::HermesRuntime> rt_;
  std::shared_ptr<CallInvoker> jsInvoker_;
};

// Test parsing a body with form data
TEST_F(NetworkingModuleTests, formDataTest) {
  auto dynamic = folly::parseJson(
      R"({
          "formData":[
            {
              "fieldName":"field1",
              "headers":[["header1","form-data; name=\"header1\""]],
              "string":"string1"
            },
            {
              "fieldName":"field2",
              "headers":[
                ["header1","form-data; name=\"header1\""],
                ["header2","form-data; name=\"header2\""]
              ],
              "string":"string2"
            }
          ]})");
  auto jsiValue = jsi::valueFromDynamic(*rt_, dynamic);
  auto body = bridging::fromJs<http::Body>(*rt_, jsiValue, jsInvoker_);

  EXPECT_TRUE(body.formData.has_value());

  EXPECT_FALSE(body.base64.has_value());
  EXPECT_FALSE(body.blob.has_value());
  EXPECT_FALSE(body.string.has_value());

  auto formData = body.formData.value();
  EXPECT_EQ(formData.size(), 2);
  verifyFormData(
      formData[0],
      "field1",
      "string1",
      {"header1", "form-data; name=\"header1\""});
  verifyFormData(
      formData[1],
      "field2",
      "string2",
      {"header1",
       "form-data; name=\"header1\"",
       "header2",
       "form-data; name=\"header2\""});
}

// A response handler replaces the body delivered for the response types it
// supports and leaves every other response type alone.
TEST_F(NetworkingModuleTests, responseHandlerTest) {
  auto module = std::make_shared<NetworkingModule>(
      jsInvoker_,
      []() { return std::make_unique<FakeHttpClient>(); },
      std::make_shared<FakeResponseHandler>());
  rt_->evaluateJavaScript(
      std::make_shared<jsi::StringBuffer>(R"(
        var data = {};
        globalThis.__rctDeviceEventEmitter = {
          emit: function (name, payload) {
            if (name === 'didReceiveNetworkData') { data[payload[0]] = payload[1]; }
          },
        };
      )"),
      "responseHandlerTest.js");

  module->sendRequest(
      *rt_, "GET", "https://example.com", 1, {}, {}, "blob", false, 0, false);
  module->sendRequest(
      *rt_, "GET", "https://example.com", 2, {}, {}, "text", false, 0, false);
  std::static_pointer_cast<TestCallInvoker>(jsInvoker_)->flushQueue();

  auto data = rt_->global().getPropertyAsObject(*rt_, "data");
  auto blob = data.getProperty(*rt_, "1");
  ASSERT_TRUE(blob.isObject());
  EXPECT_EQ(
      blob.asObject(*rt_)
          .getProperty(*rt_, "handled")
          .asString(*rt_)
          .utf8(*rt_),
      "body bytes");
  auto text = data.getProperty(*rt_, "2");
  ASSERT_TRUE(text.isString());
  EXPECT_EQ(text.asString(*rt_).utf8(*rt_), "body bytes");
}

TEST_F(NetworkingModuleTests, responseHandlerPreservesBinaryChainBytes) {
  auto handler = std::make_shared<RecordingResponseHandler>();
  auto module = std::make_shared<NetworkingModule>(
      jsInvoker_,
      []() {
        return std::make_unique<FakeHttpClient>(std::string("\0\xFF\x80\0", 4));
      },
      handler);
  rt_->evaluateJavaScript(
      std::make_shared<jsi::StringBuffer>(R"(
        var received;
        globalThis.__rctDeviceEventEmitter = {
          emit: function (name, payload) {
            if (name === 'didReceiveNetworkData') { received = payload[1]; }
          },
        };
      )"),
      "binaryResponseHandlerTest.js");
  module->sendRequest(
      *rt_,
      "GET",
      "https://example.com/binary",
      1,
      {},
      {},
      "blob",
      false,
      0,
      false);
  std::static_pointer_cast<TestCallInvoker>(jsInvoker_)->flushQueue();
  const std::vector<uint8_t> expected{0, 255, 128, 0};
  EXPECT_EQ(handler->bytes, expected);
  EXPECT_EQ(
      rt_->global().getProperty(*rt_, "received").getNumber(), expected.size());
}

// Test parsing a body with string data
TEST_F(NetworkingModuleTests, stringDataTest) {
  auto dynamic = folly::parseJson(
      R"({
          "string": "testString"
        })");
  auto jsiValue = jsi::valueFromDynamic(*rt_, dynamic);
  auto body = bridging::fromJs<http::Body>(*rt_, jsiValue, jsInvoker_);

  EXPECT_TRUE(body.string.has_value());

  EXPECT_FALSE(body.base64.has_value());
  EXPECT_FALSE(body.blob.has_value());
  EXPECT_FALSE(body.formData.has_value());

  auto stringData = body.string.value();
  EXPECT_EQ(stringData, "testString");
}

} // namespace facebook::react
