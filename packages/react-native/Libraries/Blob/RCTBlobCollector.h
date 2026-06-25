/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <jsi/jsi.h>

@class RCTBlobManager;

namespace facebook::react {

class JSI_EXPORT RCTBlobCollector : public jsi::HostObject {
 public:
  RCTBlobCollector(RCTBlobManager *blobManager, const std::string &blobId);
  ~RCTBlobCollector();

  static void install(jsi::Runtime &runtime, RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  RCTBlobManager *blobManager_;
};

} // namespace facebook::react
