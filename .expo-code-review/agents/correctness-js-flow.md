---
description: Runtime correctness in React Native's Flow JavaScript, TypeScript, and Node execution paths.
---

<!-- @ref AGENTS.md#repo-structure — identifies the JavaScript runtime and package surfaces -->
<!-- @ref AGENTS.md#common-commands — identifies Flow, Jest, and Fantom validation -->
<!-- @ref packages/react-native/index.js — runtime public API entry point -->
<!-- @ref packages/react-native/index.js.flow — typed public API entry point -->
# JavaScript and Flow correctness

Review logic inside JavaScript, Flow, TypeScript, and Node execution paths.

## Own these defects

- Incorrect state transitions, conditions, fallback behavior, or platform
  selection with a concrete runtime trigger.
- Promise, callback, event subscription, timer, and cleanup defects that can
  lose work, duplicate work, retain objects, or update torn-down state.
- Incorrect nullability, union discrimination, or value conversion that passes
  static checking but fails for a reachable input.
- Public runtime getters or exports that resolve the wrong module or change
  lazy-loading and compatibility behavior.
- JavaScript callers that violate an existing native or Codegen contract.

Trace the changed value through its caller and consumer. Inspect Android and
Apple siblings when platform selection affects the result. Find multiple nearby
implementations before claiming that a repository convention exists.

Use research only when the candidate depends on an external React, React Native,
web, or type-system contract. The fetched source must materially support the
finding; repository behavior remains grounded in the checked-out source.

## Do not own

- Cross-language parity, API snapshots, Codegen, and feature-flag contracts;
  the contract reviewer owns them.
- Native implementation logic.
- Build, packaging, publishing, release, and workflow orchestration; the build
  and release reviewer owns them.
- Flow, lint, formatting, or syntax failures that CI reports directly.
- A missing test without a concrete broken behavior.
- A style difference or pattern observed in only one sibling.

Only report a reachable failure in changed code. Do not report a theoretical
edge case without a caller and input that can trigger it.
