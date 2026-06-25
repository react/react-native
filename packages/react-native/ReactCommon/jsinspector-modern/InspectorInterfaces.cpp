/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InspectorInterfaces.h"

#include "InspectorFlags.h"

#include <cassert>
#include <list>
#include <mutex>
#include <utility>

namespace facebook::react::jsinspector_modern {

// pure destructors in C++ are odd. You would think they don't want an
// implementation, but in fact the linker requires one. Define them to be
// empty so that people don't count on them for any particular behaviour.
IDestructible::~IDestructible() = default;
ILocalConnection::~ILocalConnection() = default;
IRemoteConnection::~IRemoteConnection() = default;
IInspector::~IInspector() = default;
IPageStatusListener::~IPageStatusListener() = default;

folly::dynamic targetCapabilitiesToDynamic(
    const InspectorTargetCapabilities& capabilities) {
  return folly::dynamic::object(
      "nativePageReloads", capabilities.nativePageReloads)(
      "nativeSourceCodeFetching", capabilities.nativeSourceCodeFetching);
}

namespace {

class InspectorImpl : public IInspector {
 public:
  InspectorImpl() {
    systemStateListener_ = std::make_shared<SystemStateListener>(systemState_);
    auto& inspectorFlags = InspectorFlags::getInstance();
    if (inspectorFlags.getAssertSingleHostState()) {
      registerPageStatusListener(systemStateListener_);
    }
  }

  int addPage(
      const std::string& description,
      const std::string& vm,
      ConnectFunc connectFunc,
      InspectorTargetCapabilities capabilities) override;
  void removePage(int pageId) override;

  std::vector<InspectorPageDescription> getPages() const override;
  std::unique_ptr<ILocalConnection> connect(
      int pageId,
      std::unique_ptr<IRemoteConnection> remote) override;

  void registerPageStatusListener(
      std::weak_ptr<IPageStatusListener> listener) override;

  InspectorSystemState getSystemState() const override;

 private:
  class SystemStateListener : public IPageStatusListener {
   public:
    explicit SystemStateListener(InspectorSystemState& state) : state_(state) {}

    void unstable_onHostTargetAdded() override {
      state_.registeredHostsCount++;
    }

   private:
    InspectorSystemState& state_;
  };

  class Page {
   public:
    Page(
        int id,
        std::string description,
        std::string vm,
        ConnectFunc connectFunc,
        InspectorTargetCapabilities capabilities);
    operator InspectorPageDescription() const;

    ConnectFunc getConnectFunc() const;

   private:
    int id_;
    std::string description_;
    std::string vm_;
    ConnectFunc connectFunc_;
    InspectorTargetCapabilities capabilities_;
  };

  mutable std::mutex mutex_;
  int nextPageId_{1};
  std::map<int, Page> pages_;
  std::list<std::weak_ptr<IPageStatusListener>> listeners_;
  InspectorSystemState systemState_{0};
  std::shared_ptr<SystemStateListener> systemStateListener_;
};

InspectorImpl::Page::Page(
    int id,
    std::string description,
    std::string vm,
    ConnectFunc connectFunc,
    InspectorTargetCapabilities capabilities)
    : id_(id),
      description_(std::move(description)),
      vm_(std::move(vm)),
      connectFunc_(std::move(connectFunc)),
      capabilities_(capabilities) {}

InspectorImpl::Page::operator InspectorPageDescription() const {
  return InspectorPageDescription{
      .id = id_,
      .description = description_,
      .vm = vm_,
      .capabilities = capabilities_,
  };
}

InspectorImpl::ConnectFunc InspectorImpl::Page::getConnectFunc() const {
  return connectFunc_;
}

int InspectorImpl::addPage(
    const std::string& description,
    const std::string& vm,
    ConnectFunc connectFunc,
    InspectorTargetCapabilities capabilities) {
  std::scoped_lock lock(mutex_);

  // Note: getPages guarantees insertion/addition order. As an implementation
  // detail, incrementing page IDs takes advantage of std::map's key ordering.
  int pageId = nextPageId_++;
  assert(pages_.count(pageId) == 0 && "Unexpected duplicate page ID");
  pages_.emplace(
      pageId,
      Page{pageId, description, vm, std::move(connectFunc), capabilities});

  for (const auto& listenerWeak : listeners_) {
    if (auto listener = listenerWeak.lock()) {
      listener->unstable_onHostTargetAdded();
    }
  }

  return pageId;
}

void InspectorImpl::removePage(int pageId) {
  std::scoped_lock lock(mutex_);

  if (pages_.erase(pageId) != 0) {
    for (const auto& listenerWeak : listeners_) {
      if (auto listener = listenerWeak.lock()) {
        listener->onPageRemoved(pageId);
      }
    }
  }
}

std::vector<InspectorPageDescription> InspectorImpl::getPages() const {
  std::scoped_lock lock(mutex_);

  std::vector<InspectorPageDescription> inspectorPages;
  // pages_ is a std::map keyed on an incremental id, so this is insertion
  // ordered.
  inspectorPages.reserve(pages_.size());
  for (auto& it : pages_) {
    inspectorPages.push_back(InspectorPageDescription(it.second));
  }

  return inspectorPages;
}

std::unique_ptr<ILocalConnection> InspectorImpl::connect(
    int pageId,
    std::unique_ptr<IRemoteConnection> remote) {
  IInspector::ConnectFunc connectFunc;

  {
    std::scoped_lock lock(mutex_);

    auto it = pages_.find(pageId);
    if (it != pages_.end()) {
      connectFunc = it->second.getConnectFunc();
    }
  }

  return connectFunc ? connectFunc(std::move(remote)) : nullptr;
}

void InspectorImpl::registerPageStatusListener(
    std::weak_ptr<IPageStatusListener> listener) {
  std::scoped_lock lock(mutex_);
  // Remove expired listeners
  for (auto it = listeners_.begin(); it != listeners_.end();) {
    if (it->expired()) {
      it = listeners_.erase(it);
    } else {
      ++it;
    }
  }
  listeners_.push_back(listener);
}

InspectorSystemState InspectorImpl::getSystemState() const {
  std::scoped_lock lock(mutex_);
  return systemState_;
}
} // namespace

IInspector& getInspectorInstance() {
  static InspectorImpl instance;
  return instance;
}

std::unique_ptr<IInspector> makeTestInspectorInstance() {
  return std::make_unique<InspectorImpl>();
}

} // namespace facebook::react::jsinspector_modern
