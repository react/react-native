/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "WebSocketClient.h"

#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <folly/Synchronized.h>
#include <folly/Uri.h>
#include <folly/system/ThreadName.h>
#include <react/debug/react_native_assert.h>
#include <atomic>
#include <mutex>
#include <queue>

namespace facebook::react {

struct WebSocketClient::Impl final : public std::enable_shared_from_this<Impl> {
  void onResolveCompleted(
      boost::system::error_code ec,
      const boost::asio::ip::tcp::resolver::results_type& results);

  void onConnectionCompleted(boost::system::error_code ec);

  void onHandshakeCompleted(boost::system::error_code ec);

  void listen();

  void write();

  void onConnectCallback(bool connected, const std::string& error);

  // Callbacks and Uri
  OnConnectCallback onConnectCallback_;
  OnClosedCallback onClosedCallback_;
  OnMessageCallback onMessageCallback_;
  std::optional<folly::Uri> uri_;

  // Boost Beast WebSocket Client
  boost::asio::io_context ioContext_;
  boost::asio::ip::tcp::resolver resolver_{ioContext_};
  boost::beast::multi_buffer buffer_;
  folly::Synchronized<
      boost::beast::websocket::stream<boost::asio::ip::tcp::socket>>
      ws_{boost::beast::websocket::stream<boost::asio::ip::tcp::socket>{
          ioContext_}};

  // Input and Output handling
  std::mutex mutexOut_;
  std::queue<std::string> messagesOut_;
  std::atomic<bool> isWriting_{false};
  std::atomic<bool> isConnected_{false};
  std::atomic<bool> isClosing_{false};
};

WebSocketClient::WebSocketClient() noexcept
    : impl_(std::make_shared<WebSocketClient::Impl>()) {}

WebSocketClient::~WebSocketClient() {
  WebSocketClient::close("Force close as WebSocketClient being destroyed");
}

void WebSocketClient::setOnClosedCallback(
    OnClosedCallback&& callback) noexcept {
  impl_->onClosedCallback_ = std::move(callback);
}

void WebSocketClient::setOnMessageCallback(
    OnMessageCallback&& callback) noexcept {
  impl_->onMessageCallback_ = std::move(callback);
}

void WebSocketClient::connect(
    const std::string& url,
    OnConnectCallback&& callback) {
  if (thread_) {
    react_native_assert(false && "WebSocketClient::connect() called twice");
    return;
  }

  impl_->onConnectCallback_ = std::move(callback);
  impl_->uri_ = folly::Uri{url};

  // Resolve the domain name
  impl_->resolver_.async_resolve(
      impl_->uri_->hostname(),
      std::to_string(impl_->uri_->port()),
      [weakImpl = std::weak_ptr(impl_)](
          boost::system::error_code ec,
          const boost::asio::ip::tcp::resolver::results_type& results) {
        if (auto impl = weakImpl.lock()) {
          impl->onResolveCompleted(ec, results);
        }
      });

  // Start the I/O thread
  static int32_t s_threadId = 0;
  thread_ = std::make_unique<std::thread>(
      [weakImpl = std::weak_ptr(impl_), tid = s_threadId++]() {
        folly::setThreadName("WebSocket" + std::to_string(tid));
        if (auto impl = weakImpl.lock()) {
          impl->ioContext_.run();
        }
      });
}

void WebSocketClient::close(const std::string& reason) {
  if (!impl_->isClosing_.exchange(true)) {
    if (impl_->onClosedCallback_) {
      impl_->onClosedCallback_(reason);
    }
    auto ws = impl_->ws_.wlock();
    if (ws->is_open()) {
      ws->async_close(
          boost::beast::websocket::close_reason(reason), [](auto&&) {});
    } else {
      ws->next_layer().close();
    }
    if (thread_) {
      thread_->join();
    }
  }
  thread_ = nullptr;
}

void WebSocketClient::send(const std::string& message) {
  {
    std::lock_guard<std::mutex> lock(impl_->mutexOut_);
    impl_->messagesOut_.emplace(message);
  }
  impl_->write();
}

void WebSocketClient::ping() {
  auto ws = impl_->ws_.wlock();
  // Send a ping message
  ws->async_ping(
      {}, [weakImpl = std::weak_ptr(impl_)](boost::beast::error_code ec) {
        auto impl = weakImpl.lock();
        if (!impl || impl->isClosing_) {
          return;
        }
        if (ec) {
          LOG(ERROR) << "Error pinging websocket: " << ec.message();
          return;
        }
      });
}

void WebSocketClient::Impl::onResolveCompleted(
    boost::system::error_code ec,
    const boost::asio::ip::tcp::resolver::results_type& results) {
  if (ec) {
    // TODO: Handle retry logic here
    onConnectCallback(false, "Failed to resolve host");
    return;
  }

  auto ws = ws_.wlock();
  // Make the connection on the IP address we get from a lookup
  boost::asio::async_connect(
      ws->next_layer(),
      results.begin(),
      results.end(),
      [weakImpl = weak_from_this()](
          boost::system::error_code ec, const auto& /*ep*/) {
        if (auto impl = weakImpl.lock()) {
          impl->onConnectionCompleted(ec);
        }
      });
}

void WebSocketClient::Impl::onConnectionCompleted(
    boost::system::error_code ec) {
  if (ec) {
    // TODO: Handle retry logic here
    onConnectCallback(false, "Failed to connect");
    return;
  }

  auto ws = ws_.wlock();
  // https://datatracker.ietf.org/doc/html/rfc6455#section-3:
  // > The "resource-name" (also known as /resource name/ in
  // > https://datatracker.ietf.org/doc/html/rfc6455#section-4.1)
  // > can be constructed by concatenating the following:
  // >
  // > o  "/" if the path component is empty
  // >
  // > o  the path component
  // >
  // > o  "?" if the query component is non-empty
  // >
  // > o  the query component
  auto resourceName = (uri_->path().empty() ? "/" : uri_->path()) +
      (uri_->query().empty() ? "" : "?" + uri_->query());
  // Perform the websocket handshake
  ws->async_handshake(
      uri_->host() +
          (uri_->port() == 0 ? "" : ":" + std::to_string(uri_->port())),
      resourceName,
      [weakImpl = weak_from_this()](boost::system::error_code ec) {
        if (auto impl = weakImpl.lock()) {
          impl->onHandshakeCompleted(ec);
        }
      });
}

void WebSocketClient::Impl::onHandshakeCompleted(boost::system::error_code ec) {
  if (ec) {
    // TODO: Handle retry logic here
    onConnectCallback(false, "Failed to handshake");
    return;
  }

  isConnected_ = true;
  onConnectCallback(true, "Connected");

  // Listen for any messages from the server
  listen();

  // Start writing any buffered messages
  write();
}

void WebSocketClient::Impl::listen() {
  if (isClosing_) {
    return;
  }
  auto ws = ws_.wlock();
  ws->async_read(
      buffer_,
      [weakImpl = weak_from_this()](
          boost::beast::error_code ec, std::size_t bytes_transferred) {
        auto impl = weakImpl.lock();
        if (!impl || impl->isClosing_) {
          return;
        }
        if (ec) {
          LOG(ERROR) << "Error reading from websocket: " << ec.message();
          return;
        }
        std::string message(
            boost::beast::buffers_to_string(impl->buffer_.data()));
        if (impl->onMessageCallback_) {
          impl->onMessageCallback_(message);
        }
        impl->buffer_.consume(bytes_transferred);
        impl->listen();
      });
}

void WebSocketClient::Impl::write() {
  if (isClosing_ || !isConnected_) {
    return;
  }
  if (isWriting_.exchange(true)) {
    return;
  }

  std::shared_ptr<std::string> message;
  {
    std::lock_guard<std::mutex> lock(mutexOut_);
    if (messagesOut_.empty()) {
      isWriting_ = false;
      return;
    }
    message = std::make_shared<std::string>(messagesOut_.front());
    messagesOut_.pop();
  }

  auto ws = ws_.wlock();
  ws->async_write(
      boost::beast::net::buffer(*message),
      [message, weakImpl = weak_from_this()](
          boost::beast::error_code ec,
          std::size_t /*bytes_transferred*/) mutable {
        auto impl = weakImpl.lock();
        if (!impl) {
          return;
        }
        impl->isWriting_ = false;
        if (impl->isClosing_) {
          return;
        }
        if (ec) {
          LOG(ERROR) << "Error writing to websocket: " << ec.message();
          return;
        }
        impl->write();
        message.reset(); // Release the message after it's been sent
      });
}

void WebSocketClient::Impl::onConnectCallback(
    bool connected,
    const std::string& error) {
  if (onConnectCallback_) {
    onConnectCallback_(connected, error);
  }
}

WebSocketClientFactory getWebSocketClientFactory() {
  return []() { return std::make_unique<WebSocketClient>(); };
}

} // namespace facebook::react
