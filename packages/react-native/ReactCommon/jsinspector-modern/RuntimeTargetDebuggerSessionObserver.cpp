/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/RuntimeTarget.h>
#include <jsinspector-modern/RuntimeTargetGlobalStateObserver.h>

namespace facebook::react::jsinspector_modern {

void RuntimeTarget::installDebuggerSessionObserver() {
  jsExecutor_([](jsi::Runtime& runtime) {
    installGlobalStateObserver(
        runtime,
        "__DEBUGGER_SESSION_OBSERVER__",
        "hasActiveSession",
        "onSessionStatusChange");
  });
}

} // namespace facebook::react::jsinspector_modern
