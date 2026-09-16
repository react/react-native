---
description: Exploitable security, secret, native-boundary, workflow, and supply-chain defects.
alwaysRun: true
---

<!-- @ref glob:packages/dev-middleware/** — development server and middleware trust boundaries -->
<!-- @ref glob:packages/react-native/ReactCommon/jsinspector-modern/** — debugger protocol and runtime boundary -->
<!-- @ref glob:packages/react-native/Libraries/Network/** — JavaScript networking surface -->
<!-- @ref glob:packages/react-native/ReactAndroid/** — JNI and Android native boundary -->
<!-- @ref glob:packages/react-native/React/** — Apple native boundary -->
<!-- @ref glob:.github/workflows/** — workflow supply-chain surface -->
# Security and secrets

Review only defects with a concrete attacker-controlled path or credential
impact. Lower volume is correct for this role.

## React Native trust boundaries

- For server, middleware, inspector, network, and developer-tool changes, trace
  URL, path, header, protocol-message, and filesystem inputs to their sink.
  Flag concrete command injection, path traversal, unsafe binding, origin or
  authorization bypass, or unintended file disclosure.
- For JavaScript-to-native changes, trace attacker-controlled sizes, indexes,
  strings, enums, and nullable values through JSI or JNI into native memory.
  Classify memory corruption or controllable unsafe access here. Leave accidental
  crashes without an attacker path to the native correctness reviewer.
- For scripts and native build logic, trace archive paths, subprocess arguments,
  environment values, downloaded artifacts, and generated file destinations.
- Flag credentials or sensitive environment values that reach logs, exceptions,
  artifacts, generated source, or subprocesses that do not require them.

## CI and workflow supply chain

Treat any changed workflow as high-risk and reason about the trigger, not only
the changed commands. Flag:

- Untrusted code and secrets in the same job. A workflow that checks out or
  builds PR-controlled code and also exposes secrets or a write-scoped token can
  give a fork author code execution with those credentials.
- Incorrect fork assumptions. Fork `pull_request` jobs receive no repository
  secrets and a read-only token. Base-context comment and target workflows do
  not have that protection. A maintainer gate controls who starts a run; it does
  not make checked-out PR code trusted.
- Over-broad permissions, actions pinned only to a floating tag, or untrusted
  expression values interpolated directly into a shell command instead of
  entering through a fixed environment variable.

## Do not report

- Theoretical risks without a reachable attacker input and sink.
- Defense-in-depth suggestions when a primary defense already contains the input.
- Accidental native crashes with no attacker control.
- Generic requests for more validation, tests, or hardening.
- Issues in unchanged code that the pull request does not affect.

A single substantiated exploit or secret leak is enough. If you cannot state the
attacker input, the sink, and the missing boundary, do not report it.
