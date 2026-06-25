/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorInterfaces.h"
#include "InspectorPackagerConnection.h"

#include <folly/dynamic.h>
#include <unordered_map>

namespace facebook::react::jsinspector_modern {

/**
 * Internals of InspectorPackagerConnection.
 */
class InspectorPackagerConnection::Impl : public IWebSocketDelegate,
                                          public IPageStatusListener,
                                          // Used to generate `weak_ptr`s we can pass around.
                                          public std::enable_shared_from_this<InspectorPackagerConnection::Impl> {
 public:
  using SessionId = uint32_t;

  /**
   * Implements InspectorPackagerConnection's constructor.
   */
  static std::shared_ptr<Impl> create(
      std::string url,
      std::string deviceName,
      std::string appName,
      std::unique_ptr<InspectorPackagerConnectionDelegate> delegate);

  // InspectorPackagerConnection's public API
  bool isConnected() const;
  void connect();
  void closeQuietly();
  void sendEventToAllConnections(const std::string &event);

  /**
   * Send a message to the packager as soon as possible. This method is safe
   * to call from any thread. The connection may be closed before the message
   * is sent, in which case the message will be dropped. The message is also
   * dropped if the session is no longer valid.
   */
  void scheduleSendToPackager(
      folly::dynamic message,
      SessionId sourceSessionId,
      const std::string &sourcePageId,
      const std::string &sourceProxySessionId);

 private:
  struct Session {
    std::unique_ptr<ILocalConnection> localConnection;
    SessionId sessionId;
    std::string proxySessionId; // Session ID assigned by the proxy
  };
  class RemoteConnection;
  using PageSessions = std::unordered_map<std::string /* proxySessionId */, Session>;
  using InspectorSessionsByPage = std::unordered_map<std::string /* pageId */, PageSessions>;

  Impl(
      std::string url,
      std::string deviceName,
      std::string appName,
      std::unique_ptr<InspectorPackagerConnectionDelegate> delegate);
  Impl(const Impl &) = delete;
  Impl &operator=(const Impl &) = delete;

  void handleDisconnect(const folly::const_dynamic_view &payload);
  void handleConnect(const folly::const_dynamic_view &payload);
  void handleWrappedEvent(const folly::const_dynamic_view &payload);
  void handleProxyMessage(const folly::const_dynamic_view &message);

  /**
   * Finds the page and session and referenced by the given message payload.
   * Returns a pair of valid (dereferenceable) iterators if found, or nullopt otherwise.
   * Supports both legacy single-session mode (proxySessionId == missing or empty) and multi-session mode
   * (proxySessionId == some unique identifier assigned by the proxy).
   */
  std::optional<std::pair<InspectorSessionsByPage::iterator, PageSessions::iterator>> findPageAndSession(
      const folly::const_dynamic_view &payload,
      std::string_view caller);

  /**
   * Given a pair of (dereferenceable) iterators as returned by findPageAndSession, disconnects the
   * given session. Invalidates the session iterator and may invalidate the page iterator. Returns
   * the page iterator if still valid, or the corresponding end() iterator otherwise - this is
   * useful when disconnecting multiple sessions in a loop.
   */
  InspectorSessionsByPage::iterator disconnectSession(
      std::pair<InspectorSessionsByPage::iterator, PageSessions::iterator> sessionIterators);

  /**
   * Switch to legacy single-session mode.
   */
  void disconnectNonLegacySessions(const std::string &pageId);

  folly::dynamic pages();
  void reconnect();
  void closeAllConnections();
  void disposeWebSocket();
  void sendToPackager(const folly::dynamic &message);

  void abort(std::optional<int> posixCode, const std::string &message, const std::string &cause);

  // IWebSocketDelegate methods
  virtual void didFailWithError(std::optional<int> posixCode, std::string error) override;
  virtual void didReceiveMessage(std::string_view message) override;
  virtual void didOpen() override;
  virtual void didClose() override;

  // IPageStatusListener methods
  virtual void onPageRemoved(int pageId) override;

  const std::string url_;
  const std::string deviceName_;
  const std::string appName_;
  const std::unique_ptr<InspectorPackagerConnectionDelegate> delegate_;

  // Nested map: pageId → (proxySessionId → Session)
  // Supports multiple concurrent debugger sessions per page
  InspectorSessionsByPage inspectorSessionsByPage_;
  std::unique_ptr<IWebSocket> webSocket_;
  bool connected_{false};
  bool closed_{false};
  bool suppressConnectionErrors_{false};

  // Whether a reconnection is currently pending.
  bool reconnectPending_{false};

  // Current reconnect delay in milliseconds, used for exponential backoff.
  std::chrono::milliseconds reconnectDelayMs_{2000};

  SessionId nextSessionId_{1};
};

class InspectorPackagerConnection::Impl::RemoteConnection : public IRemoteConnection {
 public:
  RemoteConnection(
      std::weak_ptr<InspectorPackagerConnection::Impl> owningPackagerConnection,
      std::string pageId,
      SessionId sessionId,
      std::string proxySessionId);

  // IRemoteConnection methods
  void onMessage(std::string message) override;
  void onDisconnect() override;

 private:
  const std::weak_ptr<InspectorPackagerConnection::Impl> owningPackagerConnection_;
  const std::string pageId_;
  const SessionId sessionId_;
  const std::string proxySessionId_;
};

} // namespace facebook::react::jsinspector_modern
