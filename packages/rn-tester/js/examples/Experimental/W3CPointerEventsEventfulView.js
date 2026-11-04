/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {PointerEvent, ViewProps} from 'react-native';

import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

export default function EventfulView(props: {
  name: string,
  emitByDefault?: boolean,
  onLeave?: boolean,
  onLeaveCapture?: boolean,
  onEnter?: boolean,
  onEnterCapture?: boolean,
  onDown?: boolean,
  onDownCapture?: boolean,
  onUp?: boolean,
  onOver?: boolean,
  onOverCapture?: boolean,
  onOut?: boolean,
  onOutCapture?: boolean,
  onUpCapture?: boolean,
  onMove?: boolean,
  onMoveCapture?: boolean,
  onCancel?: boolean,
  onCancelCapture?: boolean,
  log: (v: string) => void,
  ...ViewProps,
}): React.Node {
  const ref = useRef<?React.ElementRef<typeof View>>();
  useEffect(() => {
    // $FlowFixMe[prop-missing] Using private property
    setTag(ref.current?._nativeTag);
  }, [ref]);

  const {
    log,
    name,
    children,
    emitByDefault,
    onLeave,
    onLeaveCapture,
    onEnter,
    onEnterCapture,
    onDown,
    onDownCapture,
    onUp,
    onUpCapture,
    onMove,
    onMoveCapture,
    onOut,
    onOutCapture,
    onOver,
    onOverCapture,
    onCancel,
    onCancelCapture,
    ...restProps
  } = props;
  const [tag, setTag] = useState<?string>('');

  const eventLog =
    (eventName: string, handler: ?(e: PointerEvent) => void) =>
    (event: PointerEvent) => {
      // $FlowFixMe[incompatible-use]
      // $FlowFixMe[prop-missing] Using private property
      log(`${name} - ${eventName} - target: ${event.target._nativeTag}`);
      handler?.(event);
    };

  const listeners = {
    onPointerUp: onUp ? eventLog('up') : null,
    onPointerUpCapture: onUpCapture ? eventLog('up capture') : null,
    onPointerDown: onDown ? eventLog('down') : null,
    onPointerDownCapture: onDownCapture ? eventLog('down capture') : null,
    onPointerLeave: onLeave ? eventLog('leave') : null,
    onPointerLeaveCapture: onLeaveCapture ? eventLog('leave capture') : null,
    onPointerEnter: onEnter ? eventLog('enter') : null,
    onPointerEnterCapture: onEnterCapture ? eventLog('enter capture') : null,
    onPointerMove: onMove ? eventLog('move') : null,
    onPointerMoveCapture: onMoveCapture ? eventLog('move capture') : null,
    onPointerOut: onOut ? eventLog('out') : null,
    onPointerOutCapture: onOutCapture ? eventLog('out capture') : null,
    onPointerOver: onOver ? eventLog('over') : null,
    onPointerOverCapture: onOverCapture ? eventLog('over capture') : null,
    onPointerCancel: onCancel ? eventLog('cancel') : null,
    onPointerCancelCapture: onCancelCapture ? eventLog('cancel capture') : null,
  };

  const listeningTo = Object.keys(listeners)
    .filter(listenerName => listeners[listenerName] != null)
    .join(', ');

  return (
    <View ref={ref} {...listeners} {...restProps}>
      <View style={styles.row}>
        <Text>
          {props.name}, {tag}, {listeningTo}
        </Text>
      </View>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
