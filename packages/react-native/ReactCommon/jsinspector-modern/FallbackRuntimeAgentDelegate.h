/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "SessionState.h"

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/RuntimeAgent.h>

namespace facebook::react::jsinspector_modern {

/**
 * A RuntimeAgentDelegate that handles requests from the Chrome DevTools
 * Protocol for a JavaScript runtime that does not support debugging.
 */
class FallbackRuntimeAgentDelegate : public RuntimeAgentDelegate {
 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param sessionState The state of the current debugger session.
   * \param engineDescription A description of the JavaScript engine being
   * debugged. This string will be used in messages sent to the frontend.
   */
  FallbackRuntimeAgentDelegate(
      FrontendChannel frontendChannel,
      const SessionState& sessionState,
      std::string engineDescription);

  /**
   * Handle a CDP request.  The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   * \returns true if this agent has responded, or will respond asynchronously,
   * to the request (with either a success or error message). False if the
   * agent expects another agent to respond to the request instead.
   */
  bool handleRequest(const cdp::PreparsedRequest& req) override;

 private:
  /**
   * Send a user-facing message explaining that this is not a debuggable
   * runtime. You must ensure that the frontend has enabled Log notifications
   * (using Log.enable) prior to calling this function.
   */
  void sendFallbackRuntimeWarning();

  /**
   * Send a simple Log.entryAdded notification with the given text.
   * You must ensure that the frontend has enabled Log notifications (using
   * Log.enable) prior to calling this function. In Chrome DevTools, the message
   * will appear in the Console tab along with regular console messages.
   * \param text The text to send.
   */
  void sendWarningLogEntry(std::string_view text);

  FrontendChannel frontendChannel_;
  std::string engineDescription_;
};

} // namespace facebook::react::jsinspector_modern
