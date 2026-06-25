/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBlobCollector.h"

#import <React/RCTBlobManager.h>

namespace facebook::react {

RCTBlobCollector::RCTBlobCollector(RCTBlobManager *blobManager, const std::string &blobId)
    : blobId_(blobId), blobManager_(blobManager)
{
}

RCTBlobCollector::~RCTBlobCollector()
{
  RCTBlobManager *blobManager = blobManager_;
  NSString *blobId = [NSString stringWithUTF8String:blobId_.c_str()];
  dispatch_async(blobManager_.methodQueue, ^{
    [blobManager remove:blobId];
  });
}

void RCTBlobCollector::install(jsi::Runtime &runtime, RCTBlobManager *blobManager)
{
  auto provider = jsi::Function::createFromHostFunction(
      runtime,
      jsi::PropNameID::forAscii(runtime, "__blobCollectorProvider"),
      1,
      [blobManager](jsi::Runtime &rt, const jsi::Value & /*thisVal*/, const jsi::Value *args, size_t /*count*/) {
        auto blobId = args[0].asString(rt).utf8(rt);
        auto blobCollector = std::make_shared<RCTBlobCollector>(blobManager, blobId);
        auto blobCollectorJsObject = jsi::Object::createFromHostObject(rt, blobCollector);
        blobCollectorJsObject.setExternalMemoryPressure(
            rt, [blobManager lengthOfBlobWithId:[NSString stringWithUTF8String:blobId.c_str()]]);
        return blobCollectorJsObject;
      });
  runtime.global().setProperty(runtime, "__blobCollectorProvider", std::move(provider));
}

} // namespace facebook::react
