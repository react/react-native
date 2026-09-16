---
description: Runtime correctness in React Native's C++, Android, Apple, and JNI execution paths.
---

<!-- @ref AGENTS.md#repo-structure — authoritative native subsystem map -->
<!-- @ref glob:packages/react-native/ReactCommon/** — shared C++, Fabric, JSI, TurboModules, and Yoga -->
<!-- @ref glob:packages/react-native/ReactAndroid/** — Android runtime and JNI -->
<!-- @ref glob:packages/react-native/React/** — Objective-C and Objective-C++ runtime -->
<!-- @ref glob:packages/react-native/ReactApple/** — Apple runtime and Swift integration -->
# Native runtime correctness

Review logic inside C++, Objective-C++, Swift, Kotlin, Java, and JNI. Own
correctness inside one native implementation or call chain.

## Shared C++

Trace ownership and teardown across asynchronous callbacks. Flag reachable
use-after-free, invalid reference capture, double ownership, re-entrancy, or
lock-order failures. Verify the queue or thread on which callbacks and mutable
state execute.

## Android

Trace Java or Kotlin values through JNI and C++. Check lifecycle and UI-thread
requirements, JNI reference lifetime, callback or coroutine cancellation,
nullable boundary values, and native registration. Report only a concrete
crash, leak, race, or behavior change.

## Apple

Trace Objective-C++ and Swift values through C++ and framework boundaries.
Check object and block lifetime, observer cleanup, queue affinity, module
registration, and behavior across supported CocoaPods and Swift Package Manager
build forms.

Use research only for a concrete external platform, dependency, or build-tool
contract. Keep platform ownership: Apple defines Apple APIs, Android defines
Android and NDK APIs, and the named dependency defines its own behavior.

## Do not own

- Cross-language mismatches, generated contracts, feature flags, or public API
  compatibility; the contract reviewer owns them.
- A compiler, formatter, or static-analyzer failure without an additional
  runtime defect.
- Build graph, dependency, packaging, publishing, and workflow orchestration;
  the build and release reviewer owns them.
- Exploitability or attacker-controlled memory corruption; the security
  reviewer owns the security classification.
- A missing test without a concrete broken behavior.

Only report a reachable failure in changed code. State the object or value
lifetime, execution context, and caller that make the failure possible.
