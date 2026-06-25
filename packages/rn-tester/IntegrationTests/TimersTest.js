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

const React = require('react');
const ReactNative = require('react-native');

const {StyleSheet, Text, View} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

type Props = Readonly<{}>;

type State = {
  count: number,
  done: boolean,
};

type ImmediateID = Object;

class TimersTest extends React.Component<Props, State> {
  _nextTest = () => {};
  _interval: ?IntervalID = null;

  _timeoutIDs: Set<TimeoutID> = new Set();
  _intervalIDs: Set<IntervalID> = new Set();
  _immediateIDs: Set<ImmediateID> = new Set();
  _animationFrameIDs: Set<AnimationFrameID> = new Set();

  state: State = {
    count: 0,
    done: false,
  };

  setTimeout(fn: () => void, time: number): TimeoutID {
    const id: TimeoutID = setTimeout(() => {
      this._timeoutIDs.delete(id);
      fn();
    }, time);

    this._timeoutIDs.add(id);

    return id;
  }

  clearTimeout(id: TimeoutID) {
    this._timeoutIDs.delete(id);
    clearTimeout(id);
  }

  setInterval(fn: () => void, time: number): IntervalID {
    const id = setInterval(() => {
      fn();
    }, time);

    this._intervalIDs.add(id);

    return id;
  }

  clearInterval(id: IntervalID) {
    this._intervalIDs.delete(id);
    clearInterval(id);
  }

  setImmediate(fn: () => void): ImmediateID {
    const id: any = setImmediate(() => {
      this._immediateIDs.delete(id);
      fn();
    });

    this._immediateIDs.add(id);

    return id;
  }

  requestAnimationFrame(fn: () => void): AnimationFrameID {
    const id: AnimationFrameID = requestAnimationFrame(() => {
      this._animationFrameIDs.delete(id);
      fn();
    });

    this._animationFrameIDs.add(id);

    return id;
  }

  cancelAnimationFrame(id: AnimationFrameID): void {
    this._animationFrameIDs.delete(id);
    cancelAnimationFrame(id);
  }

  componentDidMount() {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.setTimeout(this.testSetTimeout0, 1000);
  }

  testSetTimeout0() {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.setTimeout(this.testSetTimeout1, 0);
  }

  testSetTimeout1() {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.setTimeout(this.testSetTimeout50, 1);
  }

  testSetTimeout50() {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.setTimeout(this.testRequestAnimationFrame, 50);
  }

  testRequestAnimationFrame() {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.requestAnimationFrame(this.testSetInterval0);
  }

  testSetInterval0() {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this._nextTest = this.testSetInterval20;
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this._interval = this.setInterval(this._incrementInterval, 0);
  }

  testSetInterval20() {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this._nextTest = this.testSetImmediate;
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this._interval = this.setInterval(this._incrementInterval, 20);
  }

  testSetImmediate() {
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.setImmediate(this.testClearTimeout0);
  }

  testClearTimeout0() {
    const timeout = this.setTimeout(() => this._fail('testClearTimeout0'), 0);
    this.clearTimeout(timeout);
    this.testClearTimeout30();
  }

  testClearTimeout30() {
    const timeout = this.setTimeout(() => this._fail('testClearTimeout30'), 30);
    this.clearTimeout(timeout);
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.setTimeout(this.testClearMulti, 50);
  }

  testClearMulti() {
    const fails = [];
    fails.push(this.setTimeout(() => this._fail('testClearMulti-1'), 20));
    fails.push(this.setTimeout(() => this._fail('testClearMulti-2'), 50));
    const delayClear = this.setTimeout(
      () => this._fail('testClearMulti-3'),
      50,
    );
    fails.push(this.setTimeout(() => this._fail('testClearMulti-4'), 0));
    fails.push(this.setTimeout(() => this._fail('testClearMulti-5'), 10));

    fails.forEach(timeout => this.clearTimeout(timeout));
    this.setTimeout(() => this.clearTimeout(delayClear), 20);

    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.setTimeout(this.testOrdering, 50);
  }

  testOrdering() {
    // Clear timers are set first because it's more likely to uncover bugs.
    let fail0;
    this.setImmediate(() => this.clearTimeout(fail0));
    fail0 = this.setTimeout(
      () =>
        this._fail(
          'testOrdering-t0, setImmediate should happen before ' +
            'setTimeout 0',
        ),
      0,
    );
    let failAnim; // This should fail without the t=0 fastpath feature.
    this.setTimeout(() => this.cancelAnimationFrame(failAnim), 0);
    failAnim = this.requestAnimationFrame(() =>
      this._fail(
        'testOrdering-Anim, setTimeout 0 should happen before ' +
          'requestAnimationFrame',
      ),
    );
    let fail25;
    this.setTimeout(() => {
      this.clearTimeout(fail25);
    }, 20);
    fail25 = this.setTimeout(
      () =>
        this._fail(
          'testOrdering-t25, setTimeout 20 should happen before ' +
            'setTimeout 25',
        ),
      25,
    );
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.setTimeout(this.done, 50);
  }

  done() {
    this.setState({done: true}, () => {
      TestModule.markTestCompleted();
    });
  }

  componentWillUnmount() {
    for (const timeoutID of this._timeoutIDs) {
      clearTimeout(timeoutID);
    }

    for (const intervalID of this._intervalIDs) {
      clearInterval(intervalID);
    }

    for (const requestAnimationFrameID of this._animationFrameIDs) {
      cancelAnimationFrame(requestAnimationFrameID);
    }

    for (const immediateID of this._immediateIDs) {
      clearImmediate(immediateID);
    }

    this._timeoutIDs = new Set();
    this._intervalIDs = new Set();
    this._animationFrameIDs = new Set();
    this._immediateIDs = new Set();

    if (this._interval != null) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  render(): React.Node {
    return (
      <View style={styles.container}>
        <Text>
          {this.constructor.name + ': \n'}
          Intervals: {this.state.count + '\n'}
          {this.state.done ? 'Done' : 'Testing...'}
        </Text>
      </View>
    );
  }

  _incrementInterval(): void {
    if (this.state.count > 3) {
      throw new Error('interval incremented past end.');
    }
    if (this.state.count === 3) {
      if (this._interval != null) {
        this.clearInterval(this._interval);
        this._interval = null;
      }
      // $FlowFixMe[method-unbinding]
      this.setState({count: 0}, this._nextTest);
      return;
    }
    this.setState({count: this.state.count + 1});
  }

  _fail(caller: string): void {
    throw new Error('_fail called by ' + caller);
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 40,
  },
});

TimersTest.displayName = 'TimersTest';
export default TimersTest;
