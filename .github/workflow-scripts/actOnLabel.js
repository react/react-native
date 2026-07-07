/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = async (github, context, labelWithContext) => {
  const closeIssue = async () => {
    await github.rest.issues.update({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'closed',
    });
  };

  const addComment = async comment => {
    await github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: comment,
    });
  };

  const requestAuthorFeedback = async () => {
    // Remove the triage label if it exists (ignore the 404 if not; it's not expected to always be there)
    try {
      await github.rest.issues.removeLabel({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: 'Needs: Triage :mag:',
      });
    } catch {}

    await github.rest.issues.addLabels({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: ['Needs: Author Feedback'],
    });
  };

  switch (labelWithContext.label) {
    case 'Type: Invalid':
      await addComment(
        `> [!CAUTION]\n` +
          `> **Invalid issue**: This issue is not valid, either is not a bug in React Native, it doesn't match any of the issue template, or we can't help further with this.`,
      );
      await closeIssue();
      return;
    case 'Type: Question':
      await addComment(
        `> [!NOTE]\n` +
          `> **Not a bug report**: This issue looks like a question. We are using GitHub issues exclusively to track bugs in React Native. GitHub may not be the ideal place to ask a question, but you can try asking over on [Stack Overflow](http://stackoverflow.com/questions/tagged/react-native), or on [Reactiflux](https://www.reactiflux.com/).`,
      );
      await closeIssue();
      return;
    case 'Resolution: For Stack Overflow':
      await addComment(
        `> [!NOTE]\n` +
          `> **Not a bug report**: This issue looks like a question. We are using GitHub issues exclusively to track bugs in React Native. GitHub may not be the ideal place to ask a question, but you can try asking over on [Stack Overflow](http://stackoverflow.com/questions/tagged/react-native), or on [Reactiflux](https://www.reactiflux.com/).`,
      );
      await closeIssue();
      return;
    case 'Type: Docs':
      await addComment(
        `> [!NOTE]\n` +
          `> **Docs issue**: This issue looks like an issue related to our docs. Please report documentation issues in the [react-native-website](https://github.com/facebook/react-native-website/issues) repository.`,
      );
      await closeIssue();
      return;
    case 'Type: Expo':
      await addComment(
        `> [!NOTE]\n` +
          `> **Expo related**: It looks like your issue is related to Expo and not React Native core. Please open your issue in [Expo's repository](https://github.com/expo/expo/issues/new). If you are able to create a repro that showcases that this issue is also happening in React Native vanilla, we will be happy to re-open.`,
      );
      await closeIssue();
      return;
    case 'Needs: Issue Template':
      await addComment(
        `> [!WARNING]\n` +
          `> **Missing issue template**: It looks like your issue may be missing some necessary information. GitHub provides an example template whenever a [new issue is created](https://github.com/react/react-native/issues/new?assignees=&labels=Needs%3A+Triage+%3Amag%3A&projects=&template=bug_report.yml). Could you go back and make sure to fill out the template? You may edit this issue, or close it and open a new one.`,
      );
      await requestAuthorFeedback();
      return;
    case 'Needs: Environment Info':
      await addComment(
        `> [!WARNING]\n` +
          `> **Missing info**: It looks like your issue may be missing information about your development environment. You can obtain the missing information by running <code>react-native info</code> in a console.`,
      );
      await requestAuthorFeedback();
      return;
    case 'Needs: Version Info':
      await addComment(
        `> [!WARNING]\n` +
          `> **Could not parse version**: We could not find or parse the version number of React Native in your issue report. Please use the template, and report your version including major, minor, and patch numbers - e.g. 0.76.2.`,
      );
      await requestAuthorFeedback();
      return;
    case 'Needs: Repro':
      await addComment(
        `> [!WARNING]\n` +
          `> **Missing reproducer**: We could not detect a reproducible example in your issue report. Reproducers are **mandatory** and we can accept only one of those as a valid reproducer: <br/><ul><li>For majority of bugs: send us a Pull Request with the [RNTesterPlayground.js](https://github.com/react/react-native/blob/main/packages/rn-tester/js/examples/Playground/RNTesterPlayground.js) edited to reproduce your bug.</li><li>If your bug is UI related: a [Snack](https://snack.expo.dev)</li><li> If your bug is build/upgrade related: a project using our [Reproducer Template](https://github.com/react-native-community/reproducer-react-native/generate)</li></ul><br/>You can read more about about it on our website: [How to report a bug](https://reactnative.dev/contributing/how-to-report-a-bug).`,
      );
      await requestAuthorFeedback();
      return;
    case 'Type: Unsupported Version':
      await addComment(
        `> [!WARNING]\n` +
          `> **Unsupported version**: It looks like your issue or the example you provided uses an [unsupported version of React Native](https://github.com/reactwg/react-native-releases/blob/main/docs/support.md).<br/><br/>Due to the number of issues we receive, we're currently only accepting new issues against one of the supported versions. Please [upgrade](https://reactnative.dev/docs/upgrading) to latest and verify if the issue persists (alternatively, create a new project and repro the issue in it). If you cannot upgrade, please open your issue on [StackOverflow](https://stackoverflow.com/questions/tagged/react-native) to get further community support.`,
      );
      await requestAuthorFeedback();
      return;
    case 'Type: Too Old Version':
      await addComment(
        `> [!CAUTION]\n` +
          `> **Too old version**: It looks like your issue or the example you provided uses a [**Too Old Version of React Native**](https://github.com/reactwg/react-native-releases/blob/main/docs/support.md).<br/><br/>Due to the number of issues we receive, we're currently only accepting new issues against one of the supported versions. Please [upgrade](https://reactnative.dev/docs/upgrading) to latest and verify if the issue persists (alternatively, create a new project and repro the issue in it). If you cannot upgrade, please open your issue on [StackOverflow](https://stackoverflow.com/questions/tagged/react-native) to get further community support.`,
      );
      await closeIssue();
      return;
    default:
      // No action needed
      return;
  }
};
