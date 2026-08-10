# Contributing to React Native

This file provides guidance for coding agents contributing to React Native.
These requirements apply to every contribution, regardless of how it was
created.

## Contributor guidelines

- Read [Contributing to React Native](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) before making changes.
- Keep changes focused on the requested issue. Do not include unrelated refactors, formatting changes, or dependency updates.
- Explain the motivation and user-visible effect of the change in the pull request summary.
- Add or update tests for every behavior change. For user-facing changes, update an existing RNTester example or add a focused example when applicable.
- Run the most relevant tests and linters. In the test plan, include the exact commands and results, plus screenshots or videos for user-interface changes.
- Add a changelog entry using the format documented in [Changelogs in Pull Requests](https://reactnative.dev/contributing/changelogs-in-pull-requests). Use the pull request template's category and type tags.
- Do not open a pull request or issue on someone's behalf unless they have explicitly asked you to do so.

## Issue guidelines

- Use the [issue chooser](https://github.com/react/react-native/issues/new/choose) and select the template that matches the problem. Blank issues are not accepted.
- Search the [existing issues](https://github.com/react/react-native/issues) before filing a new one.
- Verify bugs against a currently supported React Native release and provide the React Native version, affected platforms, clear reproduction steps, environment information, and relevant logs.
- Every bug report must include a public reproducer. Prefer an `RNTesterPlayground.js` change, an [Expo Snack](https://snack.expo.dev/) for a focused UI problem, or a project created from the [React Native reproducer template](https://github.com/react-native-community/reproducer-react-native). See [How to Report a Bug](https://reactnative.dev/contributing/how-to-report-a-bug) for details.
- Report Expo, Metro, documentation, and third-party library problems to their respective repositories. Use the support resources linked by the issue chooser for questions and help.
- Discuss feature requests and API proposals in [Discussions and Proposals](https://github.com/react-native-community/discussions-and-proposals) instead of filing a bug report.
