/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorPackagerConnection.h"
#include "InspectorInterfaces.h"
#include "InspectorPackagerConnectionImpl.h"

#include <folly/dynamic.h>
#include <folly/json.h>
#include <glog/logging.h>
#include <cerrno>
#include <chrono>
#include <exception>
#include <utility>

using namespace std::literals;

namespace facebook::react::jsinspector_modern {

static constexpr const std::chrono::duration RECONNECT_DELAY =
    std::chrono::milliseconds{2000};
static constexpr const std::chrono::milliseconds MAX_RECONNECT_DELAY{120000};
static constexpr const char* INVALID = "<invalid>";

// InspectorPackagerConnection::Impl method definitions

std::shared_ptr<InspectorPackagerConnection::Impl>
InspectorPackagerConnection::Impl::create(
    std::string url,
    std::string deviceName,
    std::string appName,
    std::unique_ptr<InspectorPackagerConnectionDelegate> delegate) {
  // No make_shared because the constructor is private
  std::shared_ptr<InspectorPackagerConnection::Impl> impl(
      new InspectorPackagerConnection::Impl(
          std::move(url),
          std::move(deviceName),
          std::move(appName),
          std::move(delegate)));
  getInspectorInstance().registerPageStatusListener(impl);
  return impl;
}

InspectorPackagerConnection::Impl::Impl(
    std::string url,
    std::string deviceName,
    std::string appName,
    std::unique_ptr<InspectorPackagerConnectionDelegate> delegate)
    : url_(std::move(url)),
      deviceName_(std::move(deviceName)),
      appName_(std::move(appName)),
      delegate_(std::move(delegate)) {}

void InspectorPackagerConnection::Impl::handleProxyMessage(
    const folly::const_dynamic_view& message) {
  std::string event = message.descend("event").string_or(INVALID);
  if (event == "getPages") {
    sendToPackager(
        folly::dynamic::object("event", "getPages")("payload", pages()));
  } else if (event == "wrappedEvent") {
    handleWrappedEvent(message.descend("payload"));
  } else if (event == "connect") {
    handleConnect(message.descend("payload"));
  } else if (event == "disconnect") {
    handleDisconnect(message.descend("payload"));
  } else {
    LOG(ERROR) << "Unknown event: " << event;
  }
}

void InspectorPackagerConnection::Impl::sendEventToAllConnections(
    const std::string& event) {
  for (auto& pageEntry : inspectorSessionsByPage_) {
    for (auto& sessionEntry : pageEntry.second) {
      sessionEntry.second.localConnection->sendMessage(event);
    }
  }
}

void InspectorPackagerConnection::Impl::closeAllConnections() {
  while (!inspectorSessionsByPage_.empty()) {
    auto pageIt = inspectorSessionsByPage_.begin();
    while (pageIt != inspectorSessionsByPage_.end() &&
           !pageIt->second.empty()) {
      pageIt = disconnectSession({
          pageIt,
          pageIt->second.begin(),
      });
    }
  }
}

std::optional<std::pair<
    InspectorPackagerConnection::Impl::InspectorSessionsByPage::iterator,
    InspectorPackagerConnection::Impl::PageSessions::iterator>>
InspectorPackagerConnection::Impl::findPageAndSession(
    const folly::const_dynamic_view& payload,
    std::string_view caller) {
  std::string pageId = payload.descend("pageId").string_or(INVALID);
  auto proxySessionId = payload.descend("sessionId").string_or("");

  auto pageIt = inspectorSessionsByPage_.find(pageId);
  if (pageIt == inspectorSessionsByPage_.end()) {
    LOG(WARNING) << caller << ": page not found (pageId=" << pageId << ")";
    return std::nullopt;
  }

  auto& pageSessions = pageIt->second;
  auto sessionIt = pageSessions.find(proxySessionId);
  if (sessionIt == pageSessions.end()) {
    LOG(WARNING) << caller << ": session not found (pageId=" << pageId
                 << ", sessionId=" << proxySessionId << ")";
    return std::nullopt;
  }

  return std::make_pair(pageIt, sessionIt);
}

void InspectorPackagerConnection::Impl::handleConnect(
    const folly::const_dynamic_view& payload) {
  std::string pageId = payload.descend("pageId").string_or(INVALID);
  auto proxySessionId = payload.descend("sessionId").string_or("");

  // An empty or missing proxySessionId switches us to legacy single-session
  // mode.
  if (proxySessionId.empty()) {
    disconnectNonLegacySessions(pageId);
  }

  auto pageIt = inspectorSessionsByPage_.try_emplace(pageId).first;

  auto sessionIt = pageIt->second.find(proxySessionId);
  if (sessionIt != pageIt->second.end()) {
    LOG(WARNING) << "Duplicate session, disconnecting (pageId=" << pageId
                 << ", sessionId=" << proxySessionId << ")";
    disconnectSession({pageIt, sessionIt});
    // NOTE: At least as far back as D52134592, receiving a second
    // `connect` message for the same page (and more specifically
    // since D90174642, for the same proxySessionId) has been handled by
    // disconnecting the previous session and returning *without* creating a new
    // one. This seems like a bug and requires more investigation.
    return;
  }

  int pageIdInt = 0;
  try {
    pageIdInt = std::stoi(pageId);
  } catch (...) {
    LOG(ERROR) << "Invalid page id: " << pageId;
    return;
  }
  auto sessionId = nextSessionId_++;
  auto remoteConnection =
      std::make_unique<InspectorPackagerConnection::Impl::RemoteConnection>(
          weak_from_this(), pageId, sessionId, proxySessionId);
  auto& inspector = getInspectorInstance();
  auto inspectorConnection =
      inspector.connect(pageIdInt, std::move(remoteConnection));
  if (!inspectorConnection) {
    LOG(INFO) << "Connection to page " << pageId << " rejected";

    // RemoteConnection::onDisconnect(), if the connection even calls it, will
    // be a no op (because the session is not added to
    // `inspectorSessionsByPage_`), so let's always notify the remote client
    // of the disconnection ourselves.
    folly::dynamic disconnectPayload =
        folly::dynamic::object("pageId", pageId)("sessionId", proxySessionId);
    sendToPackager(
        folly::dynamic::object("event", "disconnect")(
            "payload", std::move(disconnectPayload)));
    return;
  }
  pageIt->second.emplace(
      proxySessionId,
      Session{
          .localConnection = std::move(inspectorConnection),
          .sessionId = sessionId,
          .proxySessionId = proxySessionId});
}

void InspectorPackagerConnection::Impl::handleDisconnect(
    const folly::const_dynamic_view& payload) {
  if (auto sessionIterators = findPageAndSession(payload, "disconnect")) {
    disconnectSession(*sessionIterators);
  }
}

InspectorPackagerConnection::Impl::InspectorSessionsByPage::iterator
InspectorPackagerConnection::Impl::disconnectSession(
    std::pair<InspectorSessionsByPage::iterator, PageSessions::iterator>
        sessionIterators) {
  auto [pageIt, sessionIt] = sessionIterators;
  auto& pageSessions = pageIt->second;
  auto connection = std::move(sessionIt->second.localConnection);
  pageSessions.erase(sessionIt);

  // Clean up empty page entry
  if (pageSessions.empty()) {
    inspectorSessionsByPage_.erase(pageIt);
    pageIt = inspectorSessionsByPage_.end();
  }

  if (connection) {
    connection->disconnect();
  }

  return pageIt;
}

void InspectorPackagerConnection::Impl::disconnectNonLegacySessions(
    const std::string& pageId) {
  auto pageIt = inspectorSessionsByPage_.find(pageId);
  if (pageIt == inspectorSessionsByPage_.end() || pageIt->second.empty()) {
    return;
  }

  bool logged = false;
  while (pageIt != inspectorSessionsByPage_.end()) {
    // Find first non-legacy session (non-empty proxySessionId)
    auto sessionIt = std::find_if(
        pageIt->second.begin(), pageIt->second.end(), [](const auto& entry) {
          return !entry.first.empty();
        });

    if (sessionIt == pageIt->second.end()) {
      break;
    }

    if (!logged) {
      LOG(WARNING)
          << "Switching to legacy single-session mode, disconnecting non-legacy "
             "sessions (pageId="
          << pageId << ")";
      logged = true;
    }

    pageIt = disconnectSession({pageIt, sessionIt});
  }
}

void InspectorPackagerConnection::Impl::handleWrappedEvent(
    const folly::const_dynamic_view& payload) {
  std::string wrappedEvent = payload.descend("wrappedEvent").string_or(INVALID);

  auto maybeSession = findPageAndSession(payload, "wrappedEvent");
  if (!maybeSession) {
    return;
  }
  auto [pageIt, sessionIt] = *maybeSession;
  sessionIt->second.localConnection->sendMessage(wrappedEvent);
}

folly::dynamic InspectorPackagerConnection::Impl::pages() {
  auto& inspector = getInspectorInstance();
  auto pages = inspector.getPages();
  folly::dynamic array = folly::dynamic::array();

  for (const auto& page : pages) {
    folly::dynamic pageDescription = folly::dynamic::object;
    pageDescription["id"] = std::to_string(page.id);
    pageDescription["title"] = appName_ + " (" + deviceName_ + ")";
    pageDescription["description"] = page.description + " [C++ connection]";
    pageDescription["app"] = appName_;

    folly::dynamic capabilities =
        targetCapabilitiesToDynamic(page.capabilities);
    // Report device-level multi-debugger support capability
    capabilities["supportsMultipleDebuggers"] = true;
    pageDescription["capabilities"] = std::move(capabilities);

    array.push_back(pageDescription);
  }
  return array;
}

void InspectorPackagerConnection::Impl::didFailWithError(
    std::optional<int> posixCode,
    std::string error) {
  if (webSocket_) {
    abort(posixCode, "WebSocket exception", error);
  }
  if (!closed_) {
    reconnect();
  }
}

void InspectorPackagerConnection::Impl::didReceiveMessage(
    std::string_view message) {
  folly::dynamic parsedJSON;
  try {
    parsedJSON = folly::parseJson(message);
  } catch (const folly::json::parse_error& e) {
    LOG(ERROR) << "Unrecognized inspector message, string was not valid JSON: "
               << e.what();
    return;
  }
  handleProxyMessage(parsedJSON);
}

void InspectorPackagerConnection::Impl::didOpen() {
  connected_ = true;
  reconnectDelayMs_ = RECONNECT_DELAY;
  suppressConnectionErrors_ = false;
}

void InspectorPackagerConnection::Impl::didClose() {
  connected_ = false;
  webSocket_.reset();
  closeAllConnections();
  if (!closed_) {
    reconnect();
  }
}

void InspectorPackagerConnection::Impl::onPageRemoved(int pageId) {
  auto pageIt = inspectorSessionsByPage_.find(std::to_string(pageId));

  while (pageIt != inspectorSessionsByPage_.end() && !pageIt->second.empty()) {
    pageIt = disconnectSession({
        pageIt,
        pageIt->second.begin(),
    });
  }
}

bool InspectorPackagerConnection::Impl::isConnected() const {
  return webSocket_ != nullptr && connected_;
}

void InspectorPackagerConnection::Impl::connect() {
  if (closed_) {
    LOG(ERROR)
        << "Illegal state: Can't connect after having previously been closed.";
    return;
  }
  try {
    webSocket_ = delegate_->connectWebSocket(url_, weak_from_this());
  } catch (const std::exception& e) {
    LOG(ERROR) << "Failed to create WebSocket connection: " << e.what();
    webSocket_.reset();
  } catch (...) {
    LOG(ERROR) << "Failed to create WebSocket connection: unknown error";
    webSocket_.reset();
  }
  if (!webSocket_ && !closed_) {
    reconnect();
  }
}

void InspectorPackagerConnection::Impl::reconnect() {
  if (reconnectPending_) {
    return;
  }
  if (closed_) {
    LOG(ERROR)
        << "Illegal state: Can't reconnect after having previously been closed.";
    return;
  }

  if (!suppressConnectionErrors_) {
    LOG(WARNING) << "Couldn't connect to packager, will silently retry";
    suppressConnectionErrors_ = true;
  }

  if (isConnected()) {
    return;
  }

  reconnectPending_ = true;

  auto currentDelay = reconnectDelayMs_;

  // Exponential backoff: double the delay for next time, up to the max.
  reconnectDelayMs_ = std::min(reconnectDelayMs_ * 2, MAX_RECONNECT_DELAY);

  delegate_->scheduleCallback(
      [weakSelf = weak_from_this()] {
        auto strongSelf = weakSelf.lock();
        if (strongSelf && !strongSelf->closed_) {
          strongSelf->reconnectPending_ = false;

          if (strongSelf->isConnected()) {
            return;
          }

          strongSelf->connect();
        }
      },
      currentDelay);
}

void InspectorPackagerConnection::Impl::closeQuietly() {
  closed_ = true;
  disposeWebSocket();
}

void InspectorPackagerConnection::Impl::sendToPackager(
    const folly::dynamic& message) {
  if (!webSocket_) {
    return;
  }

  webSocket_->send(folly::toJson(message));
}

void InspectorPackagerConnection::Impl::scheduleSendToPackager(
    folly::dynamic message,
    SessionId sourceSessionId,
    const std::string& sourcePageId,
    const std::string& sourceProxySessionId) {
  delegate_->scheduleCallback(
      [weakSelf = weak_from_this(),
       message = std::move(message),
       sourceSessionId,
       sourcePageId,
       sourceProxySessionId]() mutable {
        auto strongSelf = weakSelf.lock();
        if (!strongSelf) {
          return;
        }
        auto pageIt = strongSelf->inspectorSessionsByPage_.find(sourcePageId);
        if (pageIt == strongSelf->inspectorSessionsByPage_.end()) {
          return;
        }
        auto sessionIt = pageIt->second.find(sourceProxySessionId);
        if (sessionIt != pageIt->second.end() &&
            sessionIt->second.sessionId == sourceSessionId) {
          strongSelf->sendToPackager(std::move(message));
        }
      },
      0ms);
}

void InspectorPackagerConnection::Impl::abort(
    std::optional<int> posixCode,
    const std::string& message,
    const std::string& cause) {
  // Don't log ECONNREFUSED at all; it's expected in cases where the server
  // isn't listening.
  if (posixCode != ECONNREFUSED) {
    LOG(INFO) << "Error occurred, shutting down websocket connection: "
              << message << " " << cause;
  }
  closeAllConnections();
  disposeWebSocket();
}

void InspectorPackagerConnection::Impl::disposeWebSocket() {
  webSocket_.reset();
}

// InspectorPackagerConnection::Impl::RemoteConnection method definitions

InspectorPackagerConnection::Impl::RemoteConnection::RemoteConnection(
    std::weak_ptr<InspectorPackagerConnection::Impl> owningPackagerConnection,
    std::string pageId,
    SessionId sessionId,
    std::string proxySessionId)
    : owningPackagerConnection_(std::move(owningPackagerConnection)),
      pageId_(std::move(pageId)),
      sessionId_(sessionId),
      proxySessionId_(std::move(proxySessionId)) {}

void InspectorPackagerConnection::Impl::RemoteConnection::onMessage(
    std::string message) {
  auto owningPackagerConnectionStrong = owningPackagerConnection_.lock();
  if (!owningPackagerConnectionStrong) {
    return;
  }
  folly::dynamic payload = folly::dynamic::object("pageId", pageId_)(
      "wrappedEvent", message)("sessionId", proxySessionId_);
  owningPackagerConnectionStrong->scheduleSendToPackager(
      folly::dynamic::object("event", "wrappedEvent")("payload", payload),
      sessionId_,
      pageId_,
      proxySessionId_);
}

void InspectorPackagerConnection::Impl::RemoteConnection::onDisconnect() {
  auto owningPackagerConnectionStrong = owningPackagerConnection_.lock();
  if (owningPackagerConnectionStrong) {
    folly::dynamic payload =
        folly::dynamic::object("pageId", pageId_)("sessionId", proxySessionId_);
    owningPackagerConnectionStrong->scheduleSendToPackager(
        folly::dynamic::object("event", "disconnect")("payload", payload),
        sessionId_,
        pageId_,
        proxySessionId_);
  }
}

// InspectorPackagerConnection method definitions

InspectorPackagerConnection::InspectorPackagerConnection(
    std::string url,
    std::string deviceName,
    std::string appName,
    std::unique_ptr<InspectorPackagerConnectionDelegate> delegate)
    : impl_(
          Impl::create(
              std::move(url),
              std::move(deviceName),
              std::move(appName),
              std::move(delegate))) {}

bool InspectorPackagerConnection::isConnected() const {
  return impl_->isConnected();
}

void InspectorPackagerConnection::connect() {
  impl_->connect();
}

void InspectorPackagerConnection::closeQuietly() {
  impl_->closeQuietly();
}

void InspectorPackagerConnection::sendEventToAllConnections(std::string event) {
  impl_->sendEventToAllConnections(event);
}

} // namespace facebook::react::jsinspector_modern
