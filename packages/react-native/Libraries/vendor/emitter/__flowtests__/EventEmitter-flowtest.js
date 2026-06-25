/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import EventEmitter from '../EventEmitter';

const emitter = new EventEmitter<{
  void: [],
  string: [string],
  strings: [string, string],
  error: [Error],
}>();

const subscription = emitter.addListener('void', unknown => {
  unknown as void;
});
subscription.remove();

emitter.addListener('string', foo => {
  foo as string;
});
emitter.addListener('strings', (foo, bar) => {
  foo as string;
  bar as string;
});
emitter.addListener('error', error => {
  error as Error;
});

emitter.emit('void');
emitter.emit('string', 'foo');
emitter.emit('strings', 'foo', 'bar');
emitter.emit('error', new Error());

emitter.removeAllListeners('void');
emitter.removeAllListeners('string');
emitter.removeAllListeners('strings');
emitter.removeAllListeners('error');
emitter.removeAllListeners();

emitter.listenerCount('void');
emitter.listenerCount('string');
emitter.listenerCount('strings');
emitter.listenerCount('error');

// $FlowExpectedError[prop-missing]
emitter.addListener('does-not-exist', () => {
  // ...
});

// $FlowExpectedError[prop-missing]
subscription.context;
// $FlowExpectedError[prop-missing]
subscription.listener;
// $FlowExpectedError[prop-missing]
subscription.once;

// $FlowExpectedError[invalid-tuple-arity]
emitter.emit('void', undefined);
// $FlowExpectedError[incompatible-type]
emitter.emit('string', 123);
// $FlowExpectedError[invalid-tuple-arity]
emitter.emit('strings', 'foo');
// $FlowExpectedError[invalid-tuple-arity]
emitter.emit('strings', 'foo', 'bar', 'baz');
// $FlowExpectedError[invalid-tuple-arity]
emitter.emit('error');
// $FlowExpectedError[prop-missing]
emitter.emit('does-not-exist');

// $FlowExpectedError[prop-missing]
emitter.removeAllListeners('does-not-exist');

// $FlowExpectedError[prop-missing]
emitter.listenerCount('does-not-exist');
