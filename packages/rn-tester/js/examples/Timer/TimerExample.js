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

import RNTesterButton from '../../components/RNTesterButton';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Alert, Platform, ToastAndroid, View} from 'react-native';

function burnCPU(milliseconds: number) {
  const start = global.performance.now();
  while (global.performance.now() < start + milliseconds) {}
}

type RequestIdleCallbackTesterProps = Readonly<{}>;
type RequestIdleCallbackTesterState = {message: string};

class RequestIdleCallbackTester extends React.Component<
  RequestIdleCallbackTesterProps,
  RequestIdleCallbackTesterState,
> {
  state: RequestIdleCallbackTesterState = {
    message: '-',
  };

  _idleTimer: ?IdleCallbackID = null;
  _iters = 0;

  componentWillUnmount() {
    if (this._idleTimer != null) {
      cancelIdleCallback(this._idleTimer);
      this._idleTimer = null;
    }
  }

  render(): React.Node {
    return (
      <View>
        {/* $FlowFixMe[method-unbinding] added when improving typing for this
         * parameters */}
        <RNTesterButton onPress={this._run.bind(this, false)}>
          Run requestIdleCallback
        </RNTesterButton>

        {/* $FlowFixMe[method-unbinding] added when improving typing for this
         * parameters */}
        <RNTesterButton onPress={this._run.bind(this, true)}>
          Burn CPU inside of requestIdleCallback
        </RNTesterButton>

        <RNTesterButton onPress={this._runWithTimeout}>
          Run requestIdleCallback with timeout option
        </RNTesterButton>

        <RNTesterButton onPress={this._runBackground}>
          Run background task
        </RNTesterButton>

        <RNTesterButton onPress={this._stopBackground}>
          Stop background task
        </RNTesterButton>

        <RNTesterText>{this.state.message}</RNTesterText>
      </View>
    );
  }

  _run(shouldBurnCPU: boolean) {
    if (this._idleTimer != null) {
      cancelIdleCallback(this._idleTimer);
      this._idleTimer = null;
    }

    this._idleTimer = requestIdleCallback(deadline => {
      let message = '';

      if (shouldBurnCPU) {
        burnCPU(10);
        message = 'Burned CPU for 10ms,';
      }
      this.setState({
        message: `${message} ${deadline.timeRemaining()}ms remaining in frame (timeout: ${String(deadline.didTimeout)})`,
      });
    });
  }

  _runWithTimeout = () => {
    if (this._idleTimer != null) {
      cancelIdleCallback(this._idleTimer);
      this._idleTimer = null;
    }

    this._idleTimer = requestIdleCallback(
      deadline => {
        this.setState({
          message: `${deadline.timeRemaining()}ms remaining in frame, it did timeout: ${
            deadline.didTimeout ? 'yes' : 'no'
          }`,
        });
      },
      {timeout: 100},
    );
    burnCPU(100);
  };

  _runBackground = () => {
    if (this._idleTimer != null) {
      cancelIdleCallback(this._idleTimer);
      this._idleTimer = null;
    }

    const handler = (deadline: {
      didTimeout: boolean,
      timeRemaining: () => number,
      ...
    }) => {
      while (deadline.timeRemaining() > 5) {
        burnCPU(5);
        this.setState({
          message: `Burned CPU for 5ms ${this
            ._iters++} times, ${deadline.timeRemaining()}ms remaining in frame`,
        });
      }

      this._idleTimer = requestIdleCallback(handler);
    };
    this._idleTimer = requestIdleCallback(handler);
  };

  _stopBackground = () => {
    this._iters = 0;
    if (this._idleTimer != null) {
      cancelIdleCallback(this._idleTimer);
      this._idleTimer = null;
    }
  };
}

type TimerTesterProps = Readonly<{
  dt?: any,
  type: string,
}>;

class TimerTester extends React.Component<TimerTesterProps> {
  _ii = 0;
  _iters = 0;
  _start = 0;
  _timerId: ?TimeoutID = null;
  _rafId: ?AnimationFrameID = null;
  _intervalId: ?IntervalID = null;
  _immediateId: ?Object = null;
  _timerFn: ?() => any = null;

  render(): any {
    const args =
      'fn' + (this.props.dt !== undefined ? ', ' + this.props.dt : '');
    return (
      <RNTesterButton onPress={this._run}>
        Measure: {this.props.type}({args}) - {this._ii || 0}
      </RNTesterButton>
    );
  }

  componentWillUnmount() {
    if (this._timerId != null) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }

    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    if (this._immediateId != null) {
      clearImmediate(this._immediateId);
      this._immediateId = null;
    }

    if (this._intervalId != null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  _run = () => {
    if (!this._start) {
      const d = new Date();
      this._start = d.getTime();
      this._iters = 100;
      this._ii = 0;
      if (this.props.type === 'setTimeout') {
        if (this.props.dt !== undefined && this.props.dt < 1) {
          this._iters = 5000;
        } else if (this.props.dt !== undefined && this.props.dt > 20) {
          this._iters = 10;
        }
        this._timerFn = () => {
          this._timerId = setTimeout(this._run, this.props.dt);
        };
      } else if (this.props.type === 'requestAnimationFrame') {
        this._timerFn = () => {
          this._rafId = requestAnimationFrame(this._run);
        };
      } else if (this.props.type === 'setImmediate') {
        this._iters = 5000;
        this._timerFn = () => {
          this._immediateId = setImmediate(this._run);
        };
      } else if (this.props.type === 'setInterval') {
        this._iters = 30; // Only used for forceUpdate periodicity
        this._timerFn = null;
        this._intervalId = setInterval(this._run, this.props.dt);
      }
    }
    if (this._ii >= this._iters && this._intervalId == null) {
      const d = new Date();
      const e = d.getTime() - this._start;
      const msg =
        'Finished ' +
        this._ii +
        ' ' +
        this.props.type +
        ' calls.\n' +
        'Elapsed time: ' +
        e +
        ' ms\n' +
        e / this._ii +
        ' ms / iter';
      console.log(msg);
      if (Platform.OS === 'ios') {
        Alert.alert(msg);
      } else if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      }
      this._start = 0;
      this.forceUpdate(() => {
        this._ii = 0;
      });
      return;
    }
    this._ii++;
    // Only re-render occasionally so we don't slow down timers.
    if (this._ii % (this._iters / 5) === 0) {
      this.forceUpdate();
    }
    if (this._timerFn) {
      this._timerId = this._timerFn();
    }
  };

  clear = () => {
    if (this._intervalId != null) {
      clearInterval(this._intervalId);
      // Configure things so we can do a final run to update UI and reset state.
      this._intervalId = null;
      this._iters = this._ii;
      this._run();
    }
  };
}

class IntervalExample extends React.Component<
  Readonly<{}>,
  {
    showTimer: boolean,
  },
> {
  state: {showTimer: boolean} = {
    showTimer: true,
  };

  _timerTester: ?React.ElementRef<typeof TimerTester>;

  render(): React.Node {
    return (
      <View>
        {this.state.showTimer && this._renderTimer()}
        <RNTesterButton onPress={this._toggleTimer}>
          {this.state.showTimer ? 'Unmount timer' : 'Mount new timer'}
        </RNTesterButton>
      </View>
    );
  }

  _renderTimer = (): React.Node => {
    return (
      <View>
        <TimerTester
          ref={ref => (this._timerTester = ref)}
          dt={25}
          type="setInterval"
        />
        <RNTesterButton
          onPress={() => this._timerTester && this._timerTester.clear()}>
          Clear interval
        </RNTesterButton>
      </View>
    );
  };

  _toggleTimer = () => {
    this.setState({showTimer: !this.state.showTimer});
  };
}

exports.framework = 'React';
exports.title = 'Timers';
exports.category = 'UI';
exports.description = 'A demonstration of Timers in React Native.';

exports.examples = [
  {
    title: 'this.setTimeout(fn, t)',
    description: ('Execute function fn t milliseconds in the future.  If ' +
      't === 0, it will be enqueued immediately in the next event loop.  ' +
      'Larger values will fire on the closest frame.') as string,
    render: function (): React.Node {
      return (
        <View>
          <TimerTester type="setTimeout" dt={0} />
          <TimerTester type="setTimeout" dt={1} />
          <TimerTester type="setTimeout" dt={100} />
          <TimerTester type="setTimeout" dt={{valueOf: () => 200}} />
          <TimerTester type="setTimeout" dt={'500'} />
        </View>
      );
    },
  },
  {
    title: 'this.requestAnimationFrame(fn)',
    description: 'Execute function fn on the next frame.',
    render: function (): React.Node {
      return (
        <View>
          <TimerTester type="requestAnimationFrame" />
        </View>
      );
    },
  },
  {
    title: 'this.requestIdleCallback(fn)',
    description: 'Execute function fn on the next JS frame that has idle time',
    render: function (): React.Node {
      return (
        <View>
          <RequestIdleCallbackTester />
        </View>
      );
    },
  },
  {
    title: 'this.setImmediate(fn)',
    description: 'Execute function fn at the end of the current JS event loop.',
    render: function (): React.Node {
      return (
        <View>
          <TimerTester type="setImmediate" />
        </View>
      );
    },
  },
  {
    title: 'this.setInterval(fn, t)',
    description: ('Execute function fn every t milliseconds until cancelled ' +
      'or component is unmounted.') as string,
    render: function (): React.Node {
      return <IntervalExample />;
    },
  },
] as Array<RNTesterModuleExample>;
