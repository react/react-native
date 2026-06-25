/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {AppState, Platform} from 'react-native';

type Props = {
  detectEvents?: boolean,
  showCurrentOnly?: boolean,
  showMemoryWarnings?: boolean,
};

function AppStateSubscription(props: Props) {
  const [currentAppState, setCurrentAppState] = useState<?string>(
    AppState.currentState,
  );
  const [previousAppStates, setPreviousAppStates] = useState<string[]>([]);
  const [memoryWarnings, setMemoryWarnings] = useState<number>(0);
  const [eventsDetected, setEventsDetected] = useState<string[]>([]);

  useEffect(() => {
    const subscriptions = [
      AppState.addEventListener('change', handleAppStateChange),
      AppState.addEventListener('memoryWarning', handleMemoryWarning),
    ];

    if (Platform.OS === 'android') {
      subscriptions.push(
        AppState.addEventListener('focus', handleFocus),
        AppState.addEventListener('blur', handleBlur),
      );
    }

    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }, []);

  const handleMemoryWarning = () => {
    setMemoryWarnings(prev => prev + 1);
  };

  const handleBlur = () => {
    setEventsDetected(prev => [...prev, 'blur']);
  };

  const handleFocus = () => {
    setEventsDetected(prev => [...prev, 'focus']);
  };

  const handleAppStateChange = (appState: string) => {
    setPreviousAppStates(prev => [...prev, appState]);
    setCurrentAppState(appState);
  };

  if (props.showMemoryWarnings) {
    return <RNTesterText>{memoryWarnings}</RNTesterText>;
  }

  if (props.showCurrentOnly) {
    return (
      <RNTesterText testID="current-state">{currentAppState}</RNTesterText>
    );
  }

  if (props.detectEvents) {
    return <RNTesterText>{JSON.stringify(eventsDetected)}</RNTesterText>;
  }

  return (
    <RNTesterText testID="previous-states">
      {previousAppStates.join(', ')}
    </RNTesterText>
  );
}

exports.title = 'AppState';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/appstate';
exports.description = 'app background status';
exports.examples = [
  {
    title: 'AppState.currentState',
    description: 'Can be null on app initialization',
    render(): React.Node {
      return (
        <RNTesterText testID="initial-state">
          {AppState.currentState}
        </RNTesterText>
      );
    },
  },
  {
    title: 'Subscribed AppState:',
    description:
      'This changes according to the current state, so you can only ever see it rendered as "active"',
    render(): React.MixedElement {
      return <AppStateSubscription showCurrentOnly={true} />;
    },
  },
  {
    title: 'Previous states:',
    render(): React.MixedElement {
      return <AppStateSubscription showCurrentOnly={false} />;
    },
  },
  {
    platform: 'ios',
    title: 'Memory Warnings',
    description:
      'In the IOS simulator, hit Shift+Command+M to simulate a memory warning.',
    render(): React.MixedElement {
      return <AppStateSubscription showMemoryWarnings={true} />;
    },
  },
  {
    platform: 'android',
    title: 'Focus/Blur Events',
    description:
      'In the Android simulator, toggle the notification drawer to fire events.',
    render(): React.MixedElement {
      return <AppStateSubscription detectEvents={true} />;
    },
  },
] as Array<RNTesterModuleExample>;
