/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "fb/glog_init.h"

#include <iostream>
#include <mutex>
#include <stdexcept>

#include <glog/logging.h>

#ifdef __ANDROID__

#include <android/log.h>

static int toAndroidLevel(google::LogSeverity severity) {
  switch (severity) {
    case google::GLOG_INFO:
      return ANDROID_LOG_INFO;
    case google::GLOG_WARNING:
      return ANDROID_LOG_WARN;
    case google::GLOG_ERROR:
      return ANDROID_LOG_ERROR;
    case google::GLOG_FATAL:
      return ANDROID_LOG_FATAL;
    default:
      return ANDROID_LOG_FATAL;
  }
}

/**
 * Sends GLog output to adb logcat.
 */
class LogcatSink : public google::LogSink {
 public:
  void send(
      google::LogSeverity severity,
      const char* full_filename,
      const char* base_filename,
      int line,
      const struct ::tm* tm_time,
      const char* message,
      size_t message_len) override {
    auto level = toAndroidLevel(severity);
    __android_log_print(
        level, base_filename, "%.*s", (int)message_len, message);
  }
};

/**
 * Sends GLog output to adb logcat.
 */
class TaggedLogcatSink : public google::LogSink {
  const std::string tag_;

 public:
  TaggedLogcatSink(const std::string& tag) : tag_{tag} {}

  void send(
      google::LogSeverity severity,
      const char* full_filename,
      const char* base_filename,
      int line,
      const struct ::tm* tm_time,
      const char* message,
      size_t message_len) override {
    auto level = toAndroidLevel(severity);
    __android_log_print(level, tag_.c_str(), "%.*s", (int)message_len, message);
  }
};

static google::LogSink* make_sink(const std::string& tag) {
  if (tag.empty()) {
    return new LogcatSink{};
  } else {
    return new TaggedLogcatSink{tag};
  }
}

static void sendGlogOutputToLogcat(const char* tag) {
  google::AddLogSink(make_sink(tag));

  // Disable logging to files
  for (auto i = 0; i < google::NUM_SEVERITIES; ++i) {
    google::SetLogDestination(i, "");
  }
}

#endif // __ANDROID__

static void
lastResort(const char* tag, const char* msg, const char* arg = nullptr) {
#ifdef __ANDROID__
  if (!arg) {
    __android_log_write(ANDROID_LOG_ERROR, tag, msg);
  } else {
    __android_log_print(ANDROID_LOG_ERROR, tag, "%s: %s", msg, arg);
  }
#else
  std::cerr << msg;
  if (arg != nullptr) {
    std::cerr << ": " << arg;
  }
  std::cerr << std::endl;
#endif
}

namespace facebook::gloginit {

void initialize(const char* tag) {
  static constinit std::once_flag flag{};
  static auto failed = false;

  std::call_once(flag, [tag] {
    try {
      google::InitGoogleLogging(tag);

#ifdef __ANDROID__
      sendGlogOutputToLogcat(tag);
#endif
    } catch (std::exception& ex) {
      lastResort(tag, "Failed to initialize glog", ex.what());
      failed = true;
    } catch (...) {
      lastResort(tag, "Failed to initialize glog");
      failed = true;
    }
  });

  if (failed) {
    throw std::runtime_error{"Failed to initialize glog"};
  }
}

} // namespace facebook::gloginit
