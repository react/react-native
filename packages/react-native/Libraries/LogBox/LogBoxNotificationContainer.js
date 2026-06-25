/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import SafeAreaView from '../../src/private/components/safeareaview/SafeAreaView_INTERNAL_DO_NOT_USE';
import View from '../Components/View/View';
import StyleSheet from '../StyleSheet/StyleSheet';
import BackHandler from '../Utilities/BackHandler';
import * as LogBoxData from './Data/LogBoxData';
import LogBoxLog from './Data/LogBoxLog';
import LogBoxLogNotification from './UI/LogBoxNotification';
import * as React from 'react';

type Props = Readonly<{
  logs: ReadonlyArray<LogBoxLog>,
  selectedLogIndex: number,
  isDisabled?: ?boolean,
}>;

function useLogBoxBackHandler(focused: boolean, logCount: number): void {
  React.useEffect(() => {
    if (!focused || logCount === 0) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        LogBoxData.clearWarnings();
        LogBoxData.clearErrors();
        return true;
      },
    );
    return () => subscription.remove();
  }, [focused, logCount]);
}

export function LogBoxNotificationContainer(props: Props): React.Node {
  const {logs} = props;
  const [focused, setFocused] = React.useState(false);

  useLogBoxBackHandler(focused, logs.length);

  const onDismissWarns = () => {
    LogBoxData.clearWarnings();
  };
  const onDismissErrors = () => {
    LogBoxData.clearErrors();
  };

  const setSelectedLog = (index: number): void => {
    LogBoxData.setSelectedLog(index);
  };

  function openLog(log: LogBoxLog) {
    if (log.onNotificationPress) {
      log.onNotificationPress();
      return;
    }
    let index = logs.length - 1;

    // Stop at zero because if we don't find any log, we'll open the first log.
    while (index > 0 && logs[index] !== log) {
      index -= 1;
    }
    setSelectedLog(index);
  }

  if (logs.length === 0 || props.isDisabled === true) {
    return null;
  }

  const warnings = logs.filter(log => log.level === 'warn');
  const errors = logs.filter(
    log => log.level === 'error' || log.level === 'fatal',
  );
  return (
    <SafeAreaView style={styles.list}>
      {warnings.length > 0 && (
        <View style={styles.toast}>
          <LogBoxLogNotification
            log={warnings[warnings.length - 1]}
            level="warn"
            totalLogCount={warnings.length}
            onPressOpen={() => openLog(warnings[warnings.length - 1])}
            onPressDismiss={onDismissWarns}
            onFocusChange={setFocused}
          />
        </View>
      )}
      {errors.length > 0 && (
        <View style={styles.toast}>
          <LogBoxLogNotification
            log={errors[errors.length - 1]}
            level="error"
            totalLogCount={errors.length}
            onPressOpen={() => openLog(errors[errors.length - 1])}
            onPressDismiss={onDismissErrors}
            onFocusChange={setFocused}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: {
    bottom: 20,
    left: 10,
    right: 10,
    position: 'absolute',
  },
  toast: {
    borderRadius: 8,
    marginBottom: 5,
    overflow: 'hidden',
  },
});

export default LogBoxData.withSubscription(
  LogBoxNotificationContainer,
) as React.ComponentType<{}>;
