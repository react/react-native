/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterJsStallsState} from '../types/RNTesterTypes';

import {useCallback, useEffect, useState} from 'react';

const INITIAL_STATE: RNTesterJsStallsState = {
  stallIntervalId: null,
  busyTime: null,
  filteredStall: 0,
  tracking: false,
};

const FILTERED_STALL_MULTIPLIER = 0.97;
const BUSY_TIME_MULTIPLIER = 1 - FILTERED_STALL_MULTIPLIER;

const useJsStalls = (): ({
  onDisableForceJsStalls: () => void,
  onDisableJsStallsTracking: () => void,
  onEnableForceJsStalls: () => void,
  onEnableJsStallsTracking: () => void,
  state: RNTesterJsStallsState,
}) => {
  const [stallsState, setStallsState] =
    useState<RNTesterJsStallsState>(INITIAL_STATE);

  const {stallIntervalId} = stallsState;

  useEffect(() => {
    // $FlowFixMe[incompatible-type]
    return () => clearInterval(stallIntervalId);
  }, [stallIntervalId]);

  const onDisableForceJsStalls = useCallback(
    () => setStallsState(state => ({...state, stallIntervalId: null})),
    [],
  );

  const onEnableForceJsStalls = useCallback(() => {
    const intervalId = setInterval(() => {
      const start = Date.now();

      console.warn('burn CPU');

      while (Date.now() - start < 100) {}
    }, 300);

    setStallsState(state => ({...state, stallIntervalId: intervalId}));
  }, []);

  const onEnableJsStallsTracking = useCallback(() => {
    const JSEventLoopWatchdog = require('./JSEventLoopWatchdog').default;

    JSEventLoopWatchdog.install({thresholdMS: 25});

    setStallsState(state => ({...state, tracking: true}));

    JSEventLoopWatchdog.addHandler({
      onStall: ({busyTime}) =>
        setStallsState(state => {
          // If previous interval was cleared
          // $FlowFixMe[sketchy-null-number]
          if (!state.stallIntervalId) {
            return state;
          }

          return {
            ...state,
            busyTime: busyTime || state.busyTime,
            filteredStall:
              state.filteredStall * FILTERED_STALL_MULTIPLIER +
              (busyTime || 0) * BUSY_TIME_MULTIPLIER,
          };
        }),
    });
  }, []);

  const onDisableJsStallsTracking = useCallback(() => {
    console.warn('Cannot disable yet...');
  }, []);

  return {
    state: stallsState,
    onDisableForceJsStalls,
    onEnableForceJsStalls,
    onEnableJsStallsTracking,
    onDisableJsStallsTracking,
  };
};

export default useJsStalls;
