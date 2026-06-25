/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

#include <functional>
#include <memory>
#include <string>
#include <vector>

#ifndef JSINSPECTOR_EXPORT
#ifdef _MSC_VER
#ifdef CREATE_SHARED_LIBRARY
#define JSINSPECTOR_EXPORT __declspec(dllexport)
#else
#define JSINSPECTOR_EXPORT
#endif // CREATE_SHARED_LIBRARY
#else // _MSC_VER
#define JSINSPECTOR_EXPORT __attribute__((visibility("default")))
#endif // _MSC_VER
#endif // !defined(JSINSPECTOR_EXPORT)

namespace facebook::react::jsinspector_modern {

class IDestructible {
 public:
  virtual ~IDestructible() = 0;
};

struct InspectorTargetCapabilities {
  bool nativePageReloads = false;
  bool nativeSourceCodeFetching = false;
};

folly::dynamic targetCapabilitiesToDynamic(const InspectorTargetCapabilities &capabilities);

struct InspectorPageDescription {
  const int id;
  const std::string description;
  const std::string vm;
  const InspectorTargetCapabilities capabilities;
};

// Alias for backwards compatibility.
using InspectorPage = InspectorPageDescription;

struct InspectorSystemState {
  /** The total count of pages registered during the app lifetime. */
  int registeredHostsCount;
};

/// IRemoteConnection allows the VM to send debugger messages to the client.
/// IRemoteConnection's methods are safe to call from any thread *if*
/// InspectorPackagerConnection.cpp is in use.
class JSINSPECTOR_EXPORT IRemoteConnection : public IDestructible {
 public:
  virtual ~IRemoteConnection() = 0;
  virtual void onMessage(std::string message) = 0;
  virtual void onDisconnect() = 0;
};

/// ILocalConnection allows the client to send debugger messages to the VM.
class JSINSPECTOR_EXPORT ILocalConnection : public IDestructible {
 public:
  virtual ~ILocalConnection() = 0;
  virtual void sendMessage(std::string message) = 0;

  /**
   * Called by the inspector singleton to notify that the connection has been
   * closed, either by the remote party or because the local page/VM is no
   * longer registered with the inspector.
   */
  virtual void disconnect() = 0;
};

class JSINSPECTOR_EXPORT IPageStatusListener : public IDestructible {
 public:
  virtual ~IPageStatusListener() = 0;
  virtual void unstable_onHostTargetAdded() {}
  virtual void onPageRemoved(int /*pageId*/) {}
};

/// IInspector tracks debuggable JavaScript targets (pages).
class JSINSPECTOR_EXPORT IInspector : public IDestructible {
 public:
  using ConnectFunc = std::function<std::unique_ptr<ILocalConnection>(std::unique_ptr<IRemoteConnection>)>;

  virtual ~IInspector() = 0;

  /**
   * Add a page to the list of inspectable pages.
   * Callers are responsible for calling removePage when the page is no longer
   * expecting connections.
   * \param connectFunc a function that will be called to establish a
   * connection. \c connectFunc may return nullptr to reject the connection
   * (e.g. if the page is in the process of shutting down).
   * \returns the ID assigned to the new page.
   */
  virtual int addPage(
      const std::string &description,
      const std::string &vm,
      ConnectFunc connectFunc,
      InspectorTargetCapabilities capabilities = {}) = 0;

  /// removePage is called by the VM to remove a page from the list of
  /// debuggable pages.
  virtual void removePage(int pageId) = 0;

  /**
   * Called by the client to retrieve all debuggable pages.
   * \returns A vector of page descriptions in the order in which they were
   * added with \c addPage.
   */
  virtual std::vector<InspectorPageDescription> getPages() const = 0;

  /**
   * Called by InspectorPackagerConnection to initiate a debugging session with
   * the given page.
   * \returns an ILocalConnection that can be used to send messages to the
   * page, or nullptr if the connection has been rejected.
   */
  virtual std::unique_ptr<ILocalConnection> connect(int pageId, std::unique_ptr<IRemoteConnection> remote) = 0;

  /**
   * registerPageStatusListener registers a listener that will receive events
   * when pages are removed.
   */
  virtual void registerPageStatusListener(std::weak_ptr<IPageStatusListener> listener) = 0;

  /**
   * Get the current \c InspectorSystemState object.
   */
  virtual InspectorSystemState getSystemState() const = 0;
};

class NotImplementedException : public std::exception {
 public:
  explicit NotImplementedException(std::string message) : msg_(std::move(message)) {}

  const char *what() const noexcept override
  {
    return msg_.c_str();
  }

 private:
  std::string msg_;
};

/// getInspectorInstance retrieves the singleton inspector that tracks all
/// debuggable pages in this process.
extern IInspector &getInspectorInstance();

/// makeTestInspectorInstance creates an independent inspector instance that
/// should only be used in tests.
extern std::unique_ptr<IInspector> makeTestInspectorInstance();

/**
 * A callback that can be used to send debugger messages (method responses and
 * events) to the frontend. The message must be a JSON-encoded string.
 * The callback may be called from any thread.
 */
using FrontendChannel = std::function<void(std::string_view messageJson)>;

} // namespace facebook::react::jsinspector_modern
