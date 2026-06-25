/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "HostTarget.h"
#include "InspectorInterfaces.h"

#include <jsinspector-modern/cdp/CdpJson.h>

namespace facebook::react::jsinspector_modern {

/**
 * Provides an agent for handling CDP's Emulation domain.
 * Currently supports Emulation.setEmulatedMedia (prefers-color-scheme only).
 */
class EmulationAgent {
 public:
  /**
   * \param frontendChannel A channel used to send responses to the
   * frontend.
   * \param hostTargetController An interface to the HostTarget that this agent
   * is attached to. The caller is responsible for ensuring that the
   * HostTargetDelegate and underlying HostTarget both outlive the agent.
   */
  EmulationAgent(FrontendChannel frontendChannel, HostTargetController &hostTargetController);

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   * \returns true if the request was handled.
   */
  bool handleRequest(const cdp::PreparsedRequest &req);

 private:
  void handleSetEmulatedMedia(const cdp::PreparsedRequest &req);

  FrontendChannel frontendChannel_;
  HostTargetController &hostTargetController_;
};

} // namespace facebook::react::jsinspector_modern
