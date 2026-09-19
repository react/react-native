/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import AppContainer from '../../ReactNative/AppContainer';
import LogBoxInspectorContainer from '../LogBoxInspectorContainer';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';

interface InspectorUI {
  header: ?string;
  title: ?string;
  message: ?string;
  // TODO: We get code frames from Metro,
  // which is not yet implemented in the fantom tests.
  // codeFrames: ?Array<string>,
  componentStackFrames: ?Array<string>;
  stackFrames: ?Array<string>;
  isDismissable: ?boolean;
}

interface NotificationUI {
  count: ?string;
  message: ?string;
}

function findTextByIds(
  node: Element,
  id: string,
  text: Array<string> = [],
): Array<string> {
  if (node.id === id && node.textContent != null) {
    text.push(node.textContent);
    return text;
  }

  for (const child of node.children) {
    findTextByIds(child, id, text);
  }

  return text;
}

// Finds the LogBox notification UI by searching for the text IDs.
function findLogBoxNotificationUI(doc: Document): NotificationUI {
  return {
    count: doc.getElementById('logbox_notification_count_text')?.textContent,
    message: doc.getElementById('logbox_notification_message_text')
      ?.textContent,
  };
}

// Finds the LogBox inspector UI by searching for the text IDs.
function findLogBoxInspectorUI(doc: Document): InspectorUI {
  const documentElement = nullthrows(doc.documentElement);
  return {
    header: doc.getElementById('logbox_header_title_text')?.textContent,
    title: doc.getElementById('logbox_message_title_text')?.textContent,
    message: doc.getElementById('logbox_message_contents_text')?.textContent,
    // codeFrames: undefined,
    componentStackFrames: findTextByIds(
      documentElement,
      'logbox_component_stack_frame_text',
    ),
    stackFrames: getStackFrames(documentElement),
    isDismissable:
      doc.getElementById('logbox_dismissable_text')?.textContent == null,
  };
}

// Return the frames between the mock console and the bottom frame.
// These are the application frames not related to internals.
// For example:
//   _construct
//   Wrapper
//   _callSuper
//   reactConsoleErrorHandler
//   registerError
//   anonymous
//   anonymous
//   MockConsoleErrorForTesting  <-- mockConsoleIndex
//   ManualConsoleError
//   react_stack_bottom_frame       <-- react bottom frame
//   <root>
//
// Becomes:
//   ManualConsoleError
//
// If there are no matches, we return all frames, to prevent false negatives.
function getStackFrames(node: Element): ?Array<string> {
  const text = findTextByIds(node, 'logbox_stack_frame_text');
  const mockConsoleIndex = text.includes('MockConsoleErrorForTesting')
    ? text.indexOf('MockConsoleErrorForTesting') + 1
    : 0;
  let bottomFrameIndex = text.indexOf('react_stack_bottom_frame');
  if (bottomFrameIndex === -1) {
    // react@19.1.0 with @babel/plugin-transform-function-name
    bottomFrameIndex = text.indexOf('reactStackBottomFrame');
  }
  if (bottomFrameIndex === -1) {
    // react@19.1.0 without @babel/plugin-transform-function-name
    bottomFrameIndex = text.indexOf('react-stack-bottom-frame');
  }
  if (bottomFrameIndex === -1) {
    bottomFrameIndex = text.length;
  }

  return text.slice(mockConsoleIndex, bottomFrameIndex);
}

/**
 * renderLogBox is a helper function to render a component, and render LogBox.
 * It returns an object with methods to interact with the LogBox, and assert the UI.
 *
 */
export function renderLogBox(
  children: React.Node,
  options?: {crash: boolean},
): {
  // True if the LogBox inspector is open.
  isOpen: () => boolean,
  // Tap the notification to open the LogBox inspector.
  openNotification: () => void,
  // Tap to close the notification.
  dimissNotification: () => void,
  // Tap the minimize button to collapse the LogBox inspector.
  mimimizeInspector: () => void,
  // Tap the dismiss button to close the LogBox inspector.
  dismissInspector: () => void,
  // Tap the next button to go to the next log.
  nextLog: () => void,
  // Tap the previous button to go to the previous log.
  previousLog: () => void,
  // Returns the LogBox inspector UI as an object.
  getInspectorUI: () => ?InspectorUI,
  // Returns the LogBox notification UI as an object.
  getNotificationUI: () => ?NotificationUI,
} {
  const logBoxRoot = Fantom.createRoot();
  Fantom.runTask(() => {
    logBoxRoot.render(<LogBoxInspectorContainer />);
  });

  expect(logBoxRoot.getRenderedOutput().toJSX()).toBe(null);

  const logBoxDoc = logBoxRoot.document;

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(
      <AppContainer rootTag={root.getRootTag()}>{children}</AppContainer>,
    );
  });

  const appDoc = root.document;

  return {
    isOpen: () => {
      return logBoxRoot.getRenderedOutput().toJSX() != null;
    },
    openNotification: () => {
      const button = nullthrows(
        appDoc.getElementById('logbox_open_button_error'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    dimissNotification: () => {
      const button = nullthrows(
        appDoc.getElementById('logbox_dismiss_button_error'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    mimimizeInspector: () => {
      const button = nullthrows(
        logBoxDoc.getElementById('logbox_footer_button_minimize'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    dismissInspector: () => {
      const button = nullthrows(
        logBoxDoc.getElementById('logbox_footer_button_dismiss'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    nextLog: () => {
      const button = nullthrows(
        logBoxDoc.getElementById('logbox_header_button_next'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    previousLog: () => {
      const button = nullthrows(
        logBoxDoc.getElementById('logbox_header_button_prev'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    getInspectorUI: () => {
      if (logBoxDoc.getElementById('logbox_inspector') == null) {
        return null;
      }
      return findLogBoxInspectorUI(logBoxDoc);
    },
    getNotificationUI: () => {
      if (appDoc.getElementById('logbox_notification') == null) {
        return null;
      }
      return findLogBoxNotificationUI(appDoc);
    },
  };
}
