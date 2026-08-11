/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <map>
#include <tuple>
#include <vector>

#include <folly/dynamic.h>

namespace facebook::react {

class Instance;

} // namespace facebook::react

namespace facebook::xplat::module {

/**
 * Base class for Catalyst native modules whose implementations are
 * written in C++.  Native methods are represented by instances of the
 * Method struct.  Generally, a derived class will manage an instance
 * which represents the data for the module, and non-Catalyst-specific
 * methods can be wrapped in lambdas which convert between
 * folly::dynamic and native C++ objects.  The Callback arguments will
 * pass through to js functions passed to the analogous javascript
 * methods.  At most two callbacks will be converted.  Results should
 * be passed to the first callback, and errors to the second callback.
 * Exceptions thrown by a method will be converted to platform
 * exceptions, and handled however they are handled on that platform.
 * (TODO mhorowitz #7128529: this exception behavior is not yet
 * implemented.)
 *
 * There are two sets of constructors here.  The first set initializes
 * a Method using a name and anything convertible to a std::function.
 * This is most useful for registering a lambda as a RN method.  There
 * are overloads to support functions which take no arguments,
 * arguments only, and zero, one, or two callbacks.
 *
 * The second set of methods is similar, but instead of taking a
 * function, takes the method name, an object, and a pointer to a
 * method on that object.
 */

class CxxModule {
  class AsyncTagType {};
  class SyncTagType {};

 public:
  using Provider = std::function<std::unique_ptr<CxxModule>()>;

  using Callback = std::function<void(std::vector<folly::dynamic>)>;

  constexpr static AsyncTagType AsyncTag = AsyncTagType();
  constexpr static SyncTagType SyncTag = SyncTagType();

  struct Method {
    std::string name;

    size_t callbacks;
    bool isPromise;
    std::function<void(folly::dynamic, Callback, Callback)> func;

    std::function<folly::dynamic(folly::dynamic)> syncFunc;

    const char* getType() {
      assert(func || syncFunc);
      return func ? (isPromise ? "promise" : "async") : "sync";
    }

    // std::function/lambda ctors

    Method(std::string aname, std::function<void()>&& afunc)
        : name(std::move(aname)),
          callbacks(0),
          isPromise(false),
          func(std::bind(std::move(afunc))) {}

    Method(std::string aname, std::function<void(folly::dynamic)>&& afunc)
        : name(std::move(aname)),
          callbacks(0),
          isPromise(false),
          func(std::bind(std::move(afunc), std::placeholders::_1)) {}

    Method(
        std::string aname,
        std::function<void(folly::dynamic, Callback)>&& afunc)
        : name(std::move(aname)),
          callbacks(1),
          isPromise(false),
          func(std::bind(
              std::move(afunc),
              std::placeholders::_1,
              std::placeholders::_2)) {}

    Method(
        std::string aname,
        std::function<void(folly::dynamic, Callback, Callback)>&& afunc)
        : name(std::move(aname)),
          callbacks(2),
          isPromise(true),
          func(std::move(afunc)) {}

    Method(
        std::string aname,
        std::function<void(folly::dynamic, Callback, Callback)>&& afunc,
        AsyncTagType /*unused*/)
        : name(std::move(aname)),
          callbacks(2),
          isPromise(false),
          func(std::move(afunc)) {}

    // method pointer ctors

    template <typename T>
    Method(std::string aname, T* t, void (T::*method)())
        : name(std::move(aname)),
          callbacks(0),
          isPromise(false),
          func(std::bind(method, t)) {}

    template <typename T>
    Method(std::string aname, T* t, void (T::*method)(folly::dynamic))
        : name(std::move(aname)),
          callbacks(0),
          isPromise(false),
          func(std::bind(method, t, std::placeholders::_1)) {}

    template <typename T>
    Method(std::string aname, T* t, void (T::*method)(folly::dynamic, Callback))
        : name(std::move(aname)),
          callbacks(1),
          isPromise(false),
          func(std::bind(
              method,
              t,
              std::placeholders::_1,
              std::placeholders::_2)) {}

    template <typename T>
    Method(
        std::string aname,
        T* t,
        void (T::*method)(folly::dynamic, Callback, Callback))
        : name(std::move(aname)),
          callbacks(2),
          isPromise(true),
          func(std::bind(
              method,
              t,
              std::placeholders::_1,
              std::placeholders::_2,
              std::placeholders::_3)) {}

    template <typename T>
    Method(
        std::string aname,
        T* t,
        void (T::*method)(folly::dynamic, Callback, Callback),
        AsyncTagType /*unused*/)
        : name(std::move(aname)),
          callbacks(2),
          isPromise(false),
          func(std::bind(
              method,
              t,
              std::placeholders::_1,
              std::placeholders::_2,
              std::placeholders::_3)) {}

    // sync std::function/lambda ctors

    // Overloads for functions returning void give ambiguity errors.
    // I am not sure if this is a runtime/compiler bug, or a
    // limitation I do not understand.

    Method(
        std::string aname,
        std::function<folly::dynamic()>&& afunc,
        SyncTagType /*unused*/)
        : name(std::move(aname)),
          callbacks(0),
          isPromise(false),
          syncFunc([afunc = std::move(afunc)](const folly::dynamic&) {
            return afunc();
          }) {}

    Method(
        std::string aname,
        std::function<folly::dynamic(folly::dynamic)>&& afunc,
        SyncTagType /*unused*/)
        : name(std::move(aname)),
          callbacks(0),
          isPromise(false),
          syncFunc(std::move(afunc)) {}
  };

  /**
   * This may block, if necessary to complete cleanup before the
   * object is destroyed.
   */
  virtual ~CxxModule() = default;

  /**
   * @return the name of this module. This will be the name used to {@code
   * require()} this module from javascript.
   */
  virtual std::string getName() = 0;

  /**
   * Each entry in the map will be exported as a property to JS.  The
   * key is the property name, and the value can be anything.
   */
  virtual auto getConstants() -> std::map<std::string, folly::dynamic> {
    return {};
  };

  /**
   * @return a list of methods this module exports to JS.
   */
  virtual auto getMethods() -> std::vector<Method> = 0;

  /**
   *  Called during the construction of CxxNativeModule.
   */
  void setInstance(std::weak_ptr<react::Instance> instance) {
    instance_ = instance;
  }

  /**
   * @return a weak_ptr to the current instance of the bridge.
   * When used with CxxNativeModule, this gives Cxx modules access to functions
   * such as `callJSFunction`, allowing them to communicate back to JS outside
   * of the regular callbacks.
   */
  std::weak_ptr<react::Instance> getInstance() {
    return instance_;
  }

 private:
  std::weak_ptr<react::Instance> instance_;
};

} // namespace facebook::xplat::module
