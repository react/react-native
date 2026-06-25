/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import invariant from 'invariant';
import * as React from 'react';

/**
 * `setState` is called asynchronously, and should not rely on the value of
 * `this.props` or `this.state`:
 * https://react.dev/docs/state-and-lifecycle.html#state-updates-may-be-asynchronous
 *
 * SafePureComponent adds runtime enforcement, to catch cases where these
 * variables are read in a state updater function, instead of the ones passed
 * in.
 */
export default class StateSafePureComponent<
  Props,
  State extends interface {},
> extends React.PureComponent<Props, State> {
  _inAsyncStateUpdate = false;

  constructor(props: Props) {
    super(props);
    this._installSetStateHooks();
  }

  // $FlowFixMe[incompatible-type]
  setState<K extends keyof State>(
    partialState: ?(Pick<State, K> | ((State, Props) => ?Pick<State, K>)),
    callback?: () => unknown,
  ): void {
    if (typeof partialState === 'function') {
      super.setState((state, props) => {
        this._inAsyncStateUpdate = true;
        let ret;
        try {
          ret = partialState(state, props);
        } catch (err) {
          throw err;
        } finally {
          this._inAsyncStateUpdate = false;
        }
        return ret;
      }, callback);
    } else {
      super.setState(partialState, callback);
    }
  }

  _installSetStateHooks() {
    const that = this;
    let {props, state} = this;

    Object.defineProperty(this, 'props', {
      get() {
        invariant(
          !that._inAsyncStateUpdate,
          '"this.props" should not be accessed during state updates',
        );
        return props;
      },
      set(newProps: Props) {
        props = newProps;
      },
    });
    Object.defineProperty(this, 'state', {
      get() {
        invariant(
          !that._inAsyncStateUpdate,
          '"this.state" should not be acceessed during state updates',
        );
        return state;
      },
      set(newState: State) {
        state = newState;
      },
    });
  }
}
