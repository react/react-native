/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BlobCollector.h"

#include <fbjni/fbjni.h>
#include <gtest/gtest.h>

#include <array>
#include <memory>
#include <string>

namespace facebook::react {
namespace {

class JContext : public jni::JavaClass<JContext> {
 public:
  static constexpr auto kJavaDescriptor = "Landroid/content/Context;";
};

class JInstrumentation : public jni::JavaClass<JInstrumentation> {
 public:
  static constexpr auto kJavaDescriptor = "Landroid/app/Instrumentation;";

  jni::local_ref<JContext> getTargetContext() {
    static const auto method =
        javaClassStatic()->getMethod<JContext::javaobject()>(
            "getTargetContext");
    return method(self());
  }
};

class JInstrumentationRegistry
    : public jni::JavaClass<JInstrumentationRegistry> {
 public:
  static constexpr auto kJavaDescriptor =
      "Landroidx/test/platform/app/InstrumentationRegistry;";

  static jni::local_ref<JInstrumentation> getInstrumentation() {
    static const auto method =
        javaClassStatic()->getStaticMethod<JInstrumentation::javaobject()>(
            "getInstrumentation");
    return method(javaClassStatic());
  }
};

class JReactApplicationContext
    : public jni::JavaClass<JReactApplicationContext> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/ReactApplicationContext;";
};

class JBridgeReactContext
    : public jni::JavaClass<JBridgeReactContext, JReactApplicationContext> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/BridgeReactContext;";

  static jni::local_ref<JReactApplicationContext> create(
      jni::alias_ref<JContext> context) {
    static const auto constructor =
        javaClassStatic()
            ->getConstructor<JBridgeReactContext::javaobject(
                JContext::javaobject)>();
    return jni::static_ref_cast<JReactApplicationContext>(
        javaClassStatic()->newObject(constructor, context.get()));
  }
};

class JBlobModule : public jni::JavaClass<JBlobModule> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/modules/blob/BlobModule;";

  static jni::local_ref<JBlobModule> create(
      jni::alias_ref<JReactApplicationContext> reactContext) {
    static const auto constructor =
        javaClassStatic()
            ->getConstructor<JBlobModule::javaobject(
                JReactApplicationContext::javaobject)>();
    return javaClassStatic()->newObject(constructor, reactContext.get());
  }

  void store(jni::alias_ref<jni::JArrayByte> data, const std::string& blobId) {
    static const auto method =
        javaClassStatic()->getMethod<void(jbyteArray, jstring)>("store");
    method(self(), data.get(), jni::make_jstring(blobId).get());
  }

  jlong getLengthOfBlob(const std::string& blobId) {
    static const auto method =
        javaClassStatic()->getMethod<jlong(jstring)>("getLengthOfBlob");
    return method(self(), jni::make_jstring(blobId).get());
  }
};

jni::local_ref<jni::JArrayByte> makeByteArray(const jbyte* bytes, jsize size) {
  auto javaBytes = jni::JArrayByte::newArray(size);
  javaBytes->setRegion(0, size, bytes);
  return javaBytes;
}

class BlobCollectorTest : public ::testing::Test {
 protected:
  void SetUp() override {
    jni::ThreadScope::WithClassLoader([&] {
      auto instrumentation = JInstrumentationRegistry::getInstrumentation();
      auto context =
          JBridgeReactContext::create(instrumentation->getTargetContext());
      blobModule_ = jni::make_global(JBlobModule::create(context));
    });
  }

  jni::global_ref<JBlobModule> blobModule_;
};

/*
 * Bug this catches: the collector must ask Java for the blob's actual byte
 * length and must release the same blob id when the JS host object is
 * collected. A mismatch in method names, descriptor, object lifetime, or blob
 * id plumbing would either report the wrong external-memory pressure to Hermes
 * or leak blob storage after GC.
 */
TEST_F(
    BlobCollectorTest,
    testBlobCollectorReportsStoredLengthAndRemovesBlobOnDestruction) {
  const std::string blobId{"native-collector-test"};
  constexpr jsize blobLength = 7;
  const std::array<jbyte, blobLength> bytes{0, 1, 1, 2, 3, 5, 8};

  jni::ThreadScope::WithClassLoader([&] {
    blobModule_->store(makeByteArray(bytes.data(), blobLength), blobId);
    ASSERT_EQ(blobModule_->getLengthOfBlob(blobId), blobLength);

    {
      BlobCollector collector{blobModule_, blobId};

      EXPECT_EQ(collector.getBlobLength(), blobLength);
    }

    EXPECT_EQ(blobModule_->getLengthOfBlob(blobId), 0);
  });
}

} // namespace
} // namespace facebook::react
