/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#include <React/JSBigString.h>

namespace facebook::react {

class NSDataBigString : public JSBigString {
 public:
  // The NSData passed in must be be null-terminated.
  NSDataBigString(NSData *data);

  // The ASCII optimization is not enabled on iOS
  bool isAscii() const override
  {
    return false;
  }

  const char *c_str() const override
  {
    return (const char *)[m_data bytes];
  }

  size_t size() const override
  {
    return m_length;
  }

 private:
  NSData *m_data;
  size_t m_length;
};

} // namespace facebook::react
