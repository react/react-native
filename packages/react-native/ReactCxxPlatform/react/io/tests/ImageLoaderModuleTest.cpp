/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/TestCallInvoker.h>
#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/bridging/LongLivedObject.h>
#include <react/io/IImageLoader.h>
#include <react/io/ImageLoaderModule.h>
#include <memory>
#include <optional>
#include <string>
#include <unordered_map>

namespace facebook::react {
namespace {

class FakeImageLoader final : public IImageLoader {
 public:
  void loadImage(
      const std::string& uri,
      const IImageLoaderOnLoadCallback&& onLoad) override {
    loadedUri = uri;
    onLoad(width, height, error ? error->c_str() : nullptr);
  }

  CacheStatus getCacheStatus(const std::string& uri) override {
    auto status = cacheStatuses.find(uri);
    return status == cacheStatuses.end() ? CacheStatus::None : status->second;
  }

  std::string loadedUri;
  double width{0};
  double height{0};
  std::optional<std::string> error;
  std::unordered_map<std::string, CacheStatus> cacheStatuses;
};

class ImageLoaderModuleTest : public testing::Test {
 protected:
  ImageLoaderModuleTest()
      : runtime_(hermes::makeHermesRuntime(
            ::hermes::vm::RuntimeConfig::Builder()
                .withMicrotaskQueue(true)
                .build())),
        rt_(*runtime_),
        jsInvoker_(std::make_shared<TestCallInvoker>(*runtime_)) {}

  ~ImageLoaderModuleTest() override {
    LongLivedObjectCollection::get(rt_).clear();
  }

  void TearDown() override {
    jsInvoker_->flushQueue();
    EXPECT_EQ(0, LongLivedObjectCollection::get(rt_).size());
  }

  jsi::Object observePromise(jsi::Object promise) {
    auto observer =
        rt_.global().getPropertyAsFunction(rt_, "eval").call(
            rt_,
            "((promise, output) => promise.then("
            "value => { output.value = value; },"
            "error => { output.error = error; }))")
            .getObject(rt_)
            .getFunction(rt_);
    auto output = jsi::Object(rt_);
    observer.call(rt_, std::move(promise), output);
    return output;
  }

  std::shared_ptr<jsi::Runtime> runtime_;
  jsi::Runtime& rt_;
  std::shared_ptr<TestCallInvoker> jsInvoker_;
};

TEST_F(
    ImageLoaderModuleTest,
    testGetSizeWithHeadersResolvesDimensionsAndForwardsUri) {
  auto imageLoader = std::make_shared<FakeImageLoader>();
  imageLoader->width = 640.5;
  imageLoader->height = 480.25;
  ImageLoaderModule module(jsInvoker_, imageLoader);
  auto headers = jsi::Object(rt_);
  headers.setProperty(rt_, "Authorization", "token");

  auto promise = module.getSizeWithHeaders(
      rt_, "https://example.com/image.png", std::move(headers));
  auto output = observePromise(promise.get(rt_));
  jsInvoker_->flushQueue();

  EXPECT_EQ("https://example.com/image.png", imageLoader->loadedUri);
  ASSERT_TRUE(output.hasProperty(rt_, "value"));
  EXPECT_FALSE(output.hasProperty(rt_, "error"));
  auto dimensions = output.getProperty(rt_, "value").asObject(rt_);
  EXPECT_DOUBLE_EQ(640.5, dimensions.getProperty(rt_, "width").asNumber());
  EXPECT_DOUBLE_EQ(480.25, dimensions.getProperty(rt_, "height").asNumber());
}

TEST_F(ImageLoaderModuleTest, testGetSizeRejectsLoaderError) {
  auto imageLoader = std::make_shared<FakeImageLoader>();
  imageLoader->error = "decoder failed";
  ImageLoaderModule module(jsInvoker_, imageLoader);

  auto promise = module.getSize(rt_, "invalid-image");
  auto output = observePromise(promise.get(rt_));
  jsInvoker_->flushQueue();

  EXPECT_EQ("invalid-image", imageLoader->loadedUri);
  EXPECT_FALSE(output.hasProperty(rt_, "value"));
  ASSERT_TRUE(output.hasProperty(rt_, "error"));
  auto error = output.getProperty(rt_, "error").asObject(rt_);
  EXPECT_EQ(
      "decoder failed",
      error.getProperty(rt_, "message").asString(rt_).utf8(rt_));
}

TEST_F(ImageLoaderModuleTest, testPrefetchImageSettlesFromLoaderResult) {
  auto imageLoader = std::make_shared<FakeImageLoader>();
  ImageLoaderModule module(jsInvoker_, imageLoader);

  auto successPromise = module.prefetchImage(rt_, "cached-image", 17);
  auto successOutput = observePromise(successPromise.get(rt_));
  jsInvoker_->flushQueue();

  EXPECT_EQ("cached-image", imageLoader->loadedUri);
  ASSERT_TRUE(successOutput.hasProperty(rt_, "value"));
  EXPECT_TRUE(successOutput.getProperty(rt_, "value").getBool());
  EXPECT_FALSE(successOutput.hasProperty(rt_, "error"));

  imageLoader->error = "prefetch failed";
  auto failurePromise = module.prefetchImage(rt_, "uncacheable-image", 23);
  auto failureOutput = observePromise(failurePromise.get(rt_));
  jsInvoker_->flushQueue();

  EXPECT_EQ("uncacheable-image", imageLoader->loadedUri);
  EXPECT_FALSE(failureOutput.hasProperty(rt_, "value"));
  ASSERT_TRUE(failureOutput.hasProperty(rt_, "error"));
  auto error = failureOutput.getProperty(rt_, "error").asObject(rt_);
  EXPECT_EQ(
      "prefetch failed",
      error.getProperty(rt_, "message").asString(rt_).utf8(rt_));
}

TEST_F(ImageLoaderModuleTest, testGetSizeRejectsWithoutImageLoader) {
  ImageLoaderModule module(jsInvoker_);

  auto promise = module.getSize(rt_, "unreachable-image");
  auto output = observePromise(promise.get(rt_));
  jsInvoker_->flushQueue();

  EXPECT_FALSE(output.hasProperty(rt_, "value"));
  ASSERT_TRUE(output.hasProperty(rt_, "error"));
  auto error = output.getProperty(rt_, "error").asObject(rt_);
  EXPECT_EQ(
      "Failed to get image size: image loader is not available.",
      error.getProperty(rt_, "message").asString(rt_).utf8(rt_));
}

TEST_F(ImageLoaderModuleTest, testQueryCacheReportsTiersAndOmitsMisses) {
  auto imageLoader = std::make_shared<FakeImageLoader>();
  imageLoader->cacheStatuses = {
      {"disk-image", IImageLoader::CacheStatus::Disk},
      {"memory-image", IImageLoader::CacheStatus::Memory},
      {"two-tier-image",
       static_cast<IImageLoader::CacheStatus>(
           static_cast<int>(IImageLoader::CacheStatus::Disk) |
           static_cast<int>(IImageLoader::CacheStatus::Memory))},
  };
  ImageLoaderModule module(jsInvoker_, imageLoader);

  auto result = module.queryCache(
      rt_, {"missing-image", "disk-image", "memory-image", "two-tier-image"});

  EXPECT_EQ(3, result.getPropertyNames(rt_).size(rt_));
  EXPECT_FALSE(result.hasProperty(rt_, "missing-image"));
  EXPECT_EQ(
      "disk",
      result.getProperty(rt_, "disk-image").asString(rt_).utf8(rt_));
  EXPECT_EQ(
      "memory",
      result.getProperty(rt_, "memory-image").asString(rt_).utf8(rt_));
  EXPECT_EQ(
      "disk/memory",
      result.getProperty(rt_, "two-tier-image").asString(rt_).utf8(rt_));
}

} // namespace
} // namespace facebook::react
