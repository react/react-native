/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TracingTest.h"
#include "engines/JsiIntegrationTestHermesEngineAdapter.h"

#include <folly/executors/QueuedImmediateExecutor.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/networking/NetworkReporter.h>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

namespace {

struct NetworkReporterTestParams {
  bool enableNetworkEventReporting;
};

} // namespace

/**
 * A test fixture for the way the internal NetworkReporter API interacts with
 * the CDP Network and Tracing domains.
 */
template <typename Params>
  requires std::convertible_to<Params, NetworkReporterTestParams>
class NetworkReporterTestBase : public TracingTestBase<
                                    JsiIntegrationTestHermesEngineAdapter,
                                    folly::QueuedImmediateExecutor>,
                                public WithParamInterface<Params> {
 protected:
  NetworkReporterTestBase()
      : TracingTestBase({
            .enableNetworkEventReporting =
                WithParamInterface<Params>::GetParam()
                    .enableNetworkEventReporting,
            .networkInspectionEnabled = true,
        }) {}

  void SetUp() override {
    JsiIntegrationPortableTestBase::SetUp();
    connect();
    EXPECT_CALL(
        fromPage(),
        onMessage(
            JsonParsed(AllOf(AtJsonPtr("/method", "Debugger.scriptParsed")))))
        .Times(AnyNumber())
        .WillRepeatedly(Invoke<>([this](const std::string& message) {
          auto params = folly::parseJson(message);
          // Store the script ID and URL for later use.
          scriptUrlsById_.emplace(
              params.at("params").at("scriptId").getString(),
              params.at("params").at("url").getString());
        }));
  }

  template <typename InnerMatcher>
  Matcher<folly::dynamic> ScriptIdMapsTo(InnerMatcher urlMatcher) {
    return ResultOf(
        [this](const auto& id) { return getScriptUrlById(id.getString()); },
        urlMatcher);
  }

 private:
  std::optional<std::string> getScriptUrlById(const std::string& scriptId) {
    auto it = scriptUrlsById_.find(scriptId);
    if (it == scriptUrlsById_.end()) {
      return std::nullopt;
    }
    return it->second;
  }

  std::unordered_map<std::string, std::string> scriptUrlsById_;
};

using NetworkReporterTest = NetworkReporterTestBase<NetworkReporterTestParams>;

TEST_P(NetworkReporterTest, testNetworkEnableDisable) {
  InSequence s;

  EXPECT_FALSE(NetworkReporter::getInstance().isDebuggingEnabled());
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  EXPECT_TRUE(NetworkReporter::getInstance().isDebuggingEnabled());

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");

  EXPECT_FALSE(NetworkReporter::getInstance().isDebuggingEnabled());
}

TEST_P(NetworkReporterTest, testGetMissingResponseBody) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/error/code", (int)cdp::ErrorCode::InternalError),
      AtJsonPtr("/id", 2))));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.getResponseBody",
                                  "params": {
                                    "requestId": "1234567890-no-such-request"
                                  }
                                })");
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 3,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 3,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testRequestWillBeSentWithRedirect) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSent"),
      AtJsonPtr("/params/requestId", "test-request-1"),
      AtJsonPtr("/params/loaderId", ""),
      AtJsonPtr("/params/documentURL", "mobile"),
      AtJsonPtr("/params/request/url", "https://example.com/redirected"),
      AtJsonPtr("/params/request/method", "POST"),
      AtJsonPtr("/params/request/headers/Content-Type", "application/json"),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/wallTime", Gt(0)),
      AtJsonPtr("/params/initiator/type", "script"),
      AtJsonPtr("/params/redirectHasExtraInfo", true),
      AtJsonPtr("/params/redirectResponse", Not(IsEmpty())),
      AtJsonPtr("/params/redirectResponse/url", "https://example.com/original"),
      AtJsonPtr("/params/redirectResponse/status", 302),
      AtJsonPtr(
          "/params/redirectResponse/headers/Location",
          "https://example.com/redirected"))));

  RequestInfo requestInfo;
  requestInfo.url = "https://example.com/redirected";
  requestInfo.httpMethod = "POST";
  requestInfo.headers = Headers{{"Content-Type", "application/json"}};

  ResponseInfo redirectResponse;
  redirectResponse.url = "https://example.com/original";
  redirectResponse.statusCode = 302;
  redirectResponse.headers =
      Headers{{"Location", "https://example.com/redirected"}};

  NetworkReporter::getInstance().reportRequestStart(
      "test-request-1", requestInfo, 1024, redirectResponse);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testRequestWillBeSentExtraInfoParameters) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSentExtraInfo"),
      AtJsonPtr("/params/requestId", "test-extra-info"),
      AtJsonPtr("/params/headers/User-Agent", "TestAgent"),
      AtJsonPtr("/params/headers/Accept-Language", "en-US"),
      AtJsonPtr("/params/connectTiming/requestTime", Gt(0)))));

  Headers extraHeaders = {
      {"User-Agent", "TestAgent"}, {"Accept-Language", "en-US"}};

  NetworkReporter::getInstance().reportConnectionTiming(
      "test-extra-info", extraHeaders);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testLoadingFailedCancelled) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.loadingFailed"),
      AtJsonPtr("/params/requestId", "test-request-1"),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/type", "Other"),
      AtJsonPtr("/params/errorText", "net::ERR_ABORTED"),
      AtJsonPtr("/params/canceled", true))));

  NetworkReporter::getInstance().reportRequestFailed("test-request-1", true);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testLoadingFailedError) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.loadingFailed"),
      AtJsonPtr("/params/requestId", "test-request-1"),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/type", "Other"),
      AtJsonPtr("/params/errorText", "net::ERR_FAILED"),
      AtJsonPtr("/params/canceled", false))));

  NetworkReporter::getInstance().reportRequestFailed("test-request-1", false);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testCompleteNetworkFlow) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  const std::string requestId = "complete-flow-request";

  // Step 1: Request will be sent
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSent"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/loaderId", ""),
      AtJsonPtr("/params/documentURL", "mobile"),
      AtJsonPtr("/params/request/url", "https://api.example.com/users"),
      AtJsonPtr("/params/request/method", "GET"),
      AtJsonPtr("/params/request/headers/Accept", "application/json"),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/wallTime", Gt(0)),
      AtJsonPtr("/params/initiator/type", "script"),
      AtJsonPtr("/params/redirectHasExtraInfo", false))));

  RequestInfo requestInfo;
  requestInfo.url = "https://api.example.com/users";
  requestInfo.httpMethod = "GET";
  requestInfo.headers = Headers{{"Accept", "application/json"}};

  NetworkReporter::getInstance().reportRequestStart(
      requestId, requestInfo, 0, std::nullopt);

  // Step 2: Connection timing
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSentExtraInfo"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/headers/Accept", "application/json"),
      AtJsonPtr("/params/connectTiming/requestTime", Gt(0)))));

  NetworkReporter::getInstance().reportConnectionTiming(
      requestId, requestInfo.headers);

  // Step 3: Response received
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.responseReceived"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/loaderId", ""),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/type", "XHR"),
      AtJsonPtr("/params/response/url", "https://api.example.com/users"),
      AtJsonPtr("/params/response/status", 200),
      AtJsonPtr("/params/response/statusText", "OK"),
      AtJsonPtr("/params/response/headers/Content-Type", "application/json"),
      AtJsonPtr("/params/response/headers/Content-Length", "1024"),
      AtJsonPtr("/params/response/mimeType", "application/json"),
      AtJsonPtr("/params/response/encodedDataLength", 1024),
      AtJsonPtr("/params/hasExtraInfo", false))));

  ResponseInfo responseInfo;
  responseInfo.url = "https://api.example.com/users";
  responseInfo.statusCode = 200;
  responseInfo.headers =
      Headers{{"Content-Type", "application/json"}, {"Content-Length", "1024"}};

  NetworkReporter::getInstance().reportResponseStart(
      requestId, responseInfo, 1024);

  // Step 4: Data received (multiple chunks)
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.dataReceived"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/dataLength", 512),
      AtJsonPtr("/params/encodedDataLength", 512))));

  NetworkReporter::getInstance().reportDataReceived(requestId, 512, 512);

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.dataReceived"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/dataLength", 512),
      AtJsonPtr("/params/encodedDataLength", 512))));

  NetworkReporter::getInstance().reportDataReceived(requestId, 512, 512);

  // Step 5: Loading finished
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.loadingFinished"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/timestamp", Gt(0)),
      AtJsonPtr("/params/encodedDataLength", 1024))));

  NetworkReporter::getInstance().reportResponseEnd(requestId, 1024);

  // Store and retrieve response body
  NetworkReporter::getInstance().storeResponseBody(
      requestId, R"({"users": [{"id": 1, "name": "John"}]})", false);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {
                                            "body": "{\"users\": [{\"id\": 1, \"name\": \"John\"}]}",
                                            "base64Encoded": false
                                          }
                                        })"));
  this->toPage_->sendMessage(
      fmt::format(
          R"({{
          "id": 2,
          "method": "Network.getResponseBody",
          "params": {{
            "requestId": {0}
          }}
        }})",
          folly::toJson(requestId)));

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 3,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 3,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testGetResponseBodyWithBase64) {
  InSequence s;
  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

  const std::string requestId = "base64-response-test";

  // Store base64-encoded response body
  NetworkReporter::getInstance().storeResponseBody(
      requestId, "SGVsbG8gV29ybGQ=", true);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {
                                            "body": "SGVsbG8gV29ybGQ=",
                                            "base64Encoded": true
                                          }
                                        })"));
  this->toPage_->sendMessage(
      fmt::format(
          R"({{
          "id": 2,
          "method": "Network.getResponseBody",
          "params": {{
            "requestId": {0}
          }}
        }})",
          folly::toJson(requestId)));

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 3,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 3,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testNetworkEventsWhenDisabled) {
  EXPECT_FALSE(NetworkReporter::getInstance().isDebuggingEnabled());

  // NOTE: The test will automatically fail if any unexpected CDP messages are
  // received as a result of the following calls.

  RequestInfo requestInfo;
  requestInfo.url = "https://example.com/disabled";
  requestInfo.httpMethod = "GET";

  NetworkReporter::getInstance().reportRequestStart(
      "disabled-request", requestInfo, 0, std::nullopt);

  ResponseInfo responseInfo;
  responseInfo.url = "https://example.com/disabled";
  responseInfo.statusCode = 200;

  NetworkReporter::getInstance().reportConnectionTiming("disabled-request", {});
  NetworkReporter::getInstance().reportResponseStart(
      "disabled-request", responseInfo, 1024);
  NetworkReporter::getInstance().reportDataReceived(
      "disabled-request", 512, 512);
  NetworkReporter::getInstance().reportResponseEnd("disabled-request", 1024);
  NetworkReporter::getInstance().reportRequestFailed("disabled-request", false);
}

TEST_P(NetworkReporterTest, testRequestWillBeSentWithInitiator) {
  InSequence s;

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 0,
                                          "result": {}
                                      })"));
  this->toPage_->sendMessage(R"({
                                  "id": 0,
                                  "method": "Debugger.enable"
                              })");

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");
  RequestInfo requestInfo;
  requestInfo.url = "https://example.com/initiator";
  requestInfo.httpMethod = "GET";

  auto& runtime = engineAdapter_->getRuntime();

  auto requestId = this->eval(R"( // line 0
    function inner() { // line 1
      return globalThis.__NETWORK_REPORTER__.createDevToolsRequestId(); // line 2
    } // line 3
    function outer() { // line 4
      return inner(); // line 5
    } // line 6
    outer(); // line 7

    //# sourceURL=initiatorTest.js
  )")
                       .asString(runtime)
                       .utf8(runtime);

  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSent"),
      AtJsonPtr("/params/requestId", requestId),
      AtJsonPtr("/params/initiator/type", "script"),
      AtJsonPtr(
          "/params/initiator/stack/callFrames",
          AllOf(
              Each(AllOf(
                  AtJsonPtr("/url", "initiatorTest.js"),
                  AtJsonPtr(
                      "/scriptId", this->ScriptIdMapsTo("initiatorTest.js")))),
              ElementsAre(
                  AllOf(
                      AtJsonPtr("/functionName", "inner"),
                      AtJsonPtr("/lineNumber", 2)),
                  AllOf(
                      AtJsonPtr("/functionName", "outer"),
                      AtJsonPtr("/lineNumber", 5)),
                  AllOf(
                      AtJsonPtr("/functionName", "global"),
                      AtJsonPtr("/lineNumber", 7))))))));

  NetworkReporter::getInstance().reportRequestStart(
      requestId, requestInfo, 0, std::nullopt);

  this->expectMessageFromPage(JsonEq(R"({
                                          "id": 2,
                                          "result": {}
                                        })"));
  this->toPage_->sendMessage(R"({
                                  "id": 2,
                                  "method": "Network.disable"
                                })");
}

TEST_P(NetworkReporterTest, testCreateRequestIdWithoutNetworkDomain) {
  InSequence s;

  auto& runtime = engineAdapter_->getRuntime();

  auto id1 = this->eval(R"(
    globalThis.__NETWORK_REPORTER__.createDevToolsRequestId();
  )")
                 .asString(runtime)
                 .utf8(runtime);
  EXPECT_NE(id1, "");

  auto id2 = this->eval(R"(
    globalThis.__NETWORK_REPORTER__.createDevToolsRequestId();
  )")
                 .asString(runtime)
                 .utf8(runtime);

  EXPECT_NE(id2, "");

  EXPECT_NE(id1, id2);
}

TEST_P(NetworkReporterTest, testTwoSessionsReceiveNetworkEvents) {
  auto secondary = this->connectSecondary();

  this->expectMessageFromPage(JsonEq(R"({"id": 1, "result": {}})"));
  this->toPage_->sendMessage(R"({"id": 1, "method": "Network.enable"})");

  EXPECT_CALL(
      secondary.fromPage(), onMessage(JsonEq(R"({"id": 2, "result": {}})")));
  secondary.toPage().sendMessage(R"({"id": 2, "method": "Network.enable"})");

  // Both sessions should receive the network event
  this->expectMessageFromPage(JsonParsed(AllOf(
      AtJsonPtr("/method", "Network.requestWillBeSent"),
      AtJsonPtr("/params/requestId", "multi-session-request"))));
  EXPECT_CALL(
      secondary.fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", "Network.requestWillBeSent"),
          AtJsonPtr("/params/requestId", "multi-session-request")))));

  RequestInfo requestInfo;
  requestInfo.url = "https://example.com/test";
  requestInfo.httpMethod = "GET";
  NetworkReporter::getInstance().reportRequestStart(
      "multi-session-request", requestInfo, 0, std::nullopt);

  this->expectMessageFromPage(JsonEq(R"({"id": 3, "result": {}})"));
  this->toPage_->sendMessage(R"({"id": 3, "method": "Network.disable"})");

  EXPECT_CALL(
      secondary.fromPage(), onMessage(JsonEq(R"({"id": 4, "result": {}})")));
  secondary.toPage().sendMessage(R"({"id": 4, "method": "Network.disable"})");
}

struct NetworkReporterTracingTestParams {
  bool enableNetworkEventReporting;
  bool enableNetworkDomain;

  operator NetworkReporterTestParams() const {
    return NetworkReporterTestParams{
        .enableNetworkEventReporting = enableNetworkEventReporting,
    };
  }
};

using NetworkReporterTracingTest =
    NetworkReporterTestBase<NetworkReporterTracingTestParams>;

TEST_P(
    NetworkReporterTracingTest,
    testReportsToTracingDomainPlusNetworkDomain) {
  InSequence s;

  this->startTracing();

  if (GetParam().enableNetworkDomain) {
    this->expectMessageFromPage(JsonEq(R"({
                                        "id": 1,
                                        "result": {}
                                      })"));
    this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Network.enable"
                                })");

    this->expectMessageFromPage(JsonParsed(AllOf(
        AtJsonPtr("/method", "Network.requestWillBeSent"),
        AtJsonPtr("/params/requestId", "trace-events-request"),
        AtJsonPtr("/params/loaderId", ""),
        AtJsonPtr("/params/documentURL", "mobile"),
        AtJsonPtr("/params/request/url", "https://trace.example.com/events"),
        AtJsonPtr("/params/request/method", "GET"),
        AtJsonPtr("/params/request/headers/Accept", "application/json"),
        AtJsonPtr("/params/timestamp", Gt(0)),
        AtJsonPtr("/params/wallTime", Gt(0)),
        AtJsonPtr("/params/initiator/type", "script"),
        AtJsonPtr("/params/redirectHasExtraInfo", false))));

    this->expectMessageFromPage(JsonParsed(AllOf(
        AtJsonPtr("/method", "Network.requestWillBeSentExtraInfo"),
        AtJsonPtr("/params/requestId", "trace-events-request"),
        AtJsonPtr("/params/associatedCookies", "[]"_json),
        AtJsonPtr("/params/headers", "{}"_json),
        AtJsonPtr("/params/connectTiming/requestTime", Gt(0)))));

    this->expectMessageFromPage(JsonParsed(AllOf(
        AtJsonPtr("/method", "Network.responseReceived"),
        AtJsonPtr("/params/requestId", "trace-events-request"),
        AtJsonPtr("/params/loaderId", ""),
        AtJsonPtr("/params/timestamp", Gt(0)),
        AtJsonPtr("/params/type", "XHR"),
        AtJsonPtr("/params/response/url", "https://trace.example.com/events"),
        AtJsonPtr("/params/response/status", 200),
        AtJsonPtr("/params/response/statusText", "OK"),
        AtJsonPtr("/params/response/headers/Content-Type", "application/json"),
        AtJsonPtr("/params/response/mimeType", "application/json"),
        AtJsonPtr("/params/response/encodedDataLength", 1024),
        AtJsonPtr("/params/hasExtraInfo", false))));

    this->expectMessageFromPage(JsonParsed(AllOf(
        AtJsonPtr("/method", "Network.dataReceived"),
        AtJsonPtr("/params/requestId", "trace-events-request"),
        AtJsonPtr("/params/timestamp", Gt(0)),
        AtJsonPtr("/params/dataLength", 512),
        AtJsonPtr("/params/encodedDataLength", 512))));

    this->expectMessageFromPage(JsonParsed(AllOf(
        AtJsonPtr("/method", "Network.loadingFinished"),
        AtJsonPtr("/params/requestId", "trace-events-request"),
        AtJsonPtr("/params/timestamp", Gt(0)),
        AtJsonPtr("/params/encodedDataLength", 1024))));
  }

  NetworkReporter::getInstance().reportRequestStart(
      "trace-events-request",
      {
          .url = "https://trace.example.com/events",
          .httpMethod = "GET",
          .headers = Headers{{"Accept", "application/json"}},
      },
      0,
      std::nullopt);

  NetworkReporter::getInstance().reportConnectionTiming(
      "trace-events-request", std::nullopt);

  NetworkReporter::getInstance().reportResponseStart(
      "trace-events-request",
      {
          .url = "https://trace.example.com/events",
          .statusCode = 200,
          .headers = Headers{{"Content-Type", "application/json"}},
      },
      1024);

  NetworkReporter::getInstance().reportDataReceived(
      "trace-events-request", 512, 512);

  NetworkReporter::getInstance().reportResponseEnd(
      "trace-events-request", 1024);

  auto allTraceEvents = endTracingAndCollectEvents();

  EXPECT_THAT(
      allTraceEvents,
      Contains(AllOf(
          AtJsonPtr("/name", "ResourceSendRequest"),
          AtJsonPtr("/cat", "devtools.timeline"),
          AtJsonPtr("/ph", "I"),
          AtJsonPtr("/s", "t"),
          AtJsonPtr("/tid", oscompat::getCurrentThreadId()),
          AtJsonPtr("/pid", oscompat::getCurrentProcessId()),
          AtJsonPtr("/args/data/initiator", "{}"_json),
          AtJsonPtr("/args/data/requestId", "trace-events-request"),
          AtJsonPtr("/args/data/url", "https://trace.example.com/events"),
          AtJsonPtr("/args/data/requestMethod", "GET"),
          AtJsonPtr("/args/data/priority", "VeryHigh"),
          AtJsonPtr("/args/data/renderBlocking", "non_blocking"),
          AtJsonPtr("/args/data/resourceType", "Other"))));

  EXPECT_THAT(
      allTraceEvents,
      Contains(AllOf(
          AtJsonPtr("/name", "ResourceReceiveResponse"),
          AtJsonPtr("/cat", "devtools.timeline"),
          AtJsonPtr("/ph", "I"),
          AtJsonPtr("/s", "t"),
          AtJsonPtr("/tid", oscompat::getCurrentThreadId()),
          AtJsonPtr("/pid", oscompat::getCurrentProcessId()),
          AtJsonPtr("/ts", Gt(0)),
          AtJsonPtr("/args/data/requestId", "trace-events-request"),
          AtJsonPtr("/args/data/statusCode", 200),
          AtJsonPtr("/args/data/mimeType", "application/json"),
          AtJsonPtr("/args/data/protocol", "h2"),
          AtJsonPtr("/args/data/encodedDataLength", 1024),
          AtJsonPtr(
              "/args/data/headers",
              R"([{ "name": "Content-Type", "value": "application/json" }])"_json),
          AtJsonPtr(
              "/args/data/timing",
              AllOf(
                  AtJsonPtr("/requestTime", Ge(0)),
                  AtJsonPtr("/sendStart", Ge(0)),
                  AtJsonPtr("/sendEnd", Ge(0)),
                  AtJsonPtr("/receiveHeadersStart", Ge(0)),
                  AtJsonPtr("/receiveHeadersEnd", Ge(0)))))));

  EXPECT_THAT(
      allTraceEvents,
      Contains(AllOf(
          AtJsonPtr("/name", "ResourceReceivedData"),
          AtJsonPtr("/cat", "devtools.timeline"),
          AtJsonPtr("/ph", "I"),
          AtJsonPtr("/s", "t"),
          AtJsonPtr("/tid", oscompat::getCurrentThreadId()),
          AtJsonPtr("/pid", oscompat::getCurrentProcessId()),
          AtJsonPtr("/args/data/requestId", "trace-events-request"),
          AtJsonPtr("/args/data/encodedDataLength", 512))));

  EXPECT_THAT(
      allTraceEvents,
      Contains(AllOf(
          AtJsonPtr("/name", "ResourceFinish"),
          AtJsonPtr("/cat", "devtools.timeline"),
          AtJsonPtr("/ph", "I"),
          AtJsonPtr("/s", "t"),
          AtJsonPtr("/tid", oscompat::getCurrentThreadId()),
          AtJsonPtr("/pid", oscompat::getCurrentProcessId()),
          AtJsonPtr("/args/data/requestId", "trace-events-request"),
          AtJsonPtr("/args/data/encodedDataLength", 1024),
          AtJsonPtr("/args/data/decodedBodyLength", 0),
          AtJsonPtr("/args/data/didFail", false))));
}

static const auto networkReporterTestParamValues = testing::Values(
    NetworkReporterTestParams{.enableNetworkEventReporting = true},
    NetworkReporterTestParams{
        .enableNetworkEventReporting = false,
    });

static const auto networkReporterTracingTestParamValues = testing::Values(
    NetworkReporterTracingTestParams{
        .enableNetworkEventReporting = true,
        .enableNetworkDomain = true},
    NetworkReporterTracingTestParams{
        .enableNetworkEventReporting = true,
        .enableNetworkDomain = false});

INSTANTIATE_TEST_SUITE_P(
    NetworkReporterTest,
    NetworkReporterTest,
    networkReporterTestParamValues);

INSTANTIATE_TEST_SUITE_P(
    NetworkReporterTracingTest,
    NetworkReporterTracingTest,
    networkReporterTracingTestParamValues);

} // namespace facebook::react::jsinspector_modern
