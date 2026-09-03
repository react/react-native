/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {SafeAreaInsetsChangeEvent} from 'react-native/Libraries/Types/CoreEventTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {
  Button,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

type Insets = SafeAreaInsetsChangeEvent['nativeEvent']['insets'];
type Frame = SafeAreaInsetsChangeEvent['nativeEvent']['frame'];

function useSafeAreaInsets(): [
  ?Insets,
  ?Frame,
  (SafeAreaInsetsChangeEvent) => void,
] {
  const [state, setState] = useState<?{insets: Insets, frame: Frame}>(null);
  const onSafeAreaInsetsChange = useCallback(
    (event: SafeAreaInsetsChangeEvent) => {
      setState({
        insets: event.nativeEvent.insets,
        frame: event.nativeEvent.frame,
      });
    },
    [],
  );
  return [state?.insets, state?.frame, onSafeAreaInsetsChange];
}

function InsetsReadoutExample(): React.Node {
  const [insets, frame, onSafeAreaInsetsChange] = useSafeAreaInsets();

  return (
    <View
      experimental_onSafeAreaInsetsChange={onSafeAreaInsetsChange}
      style={styles.readout}>
      <RNTesterText>
        {insets == null
          ? 'Waiting for insets…'
          : `insets: {top: ${insets.top}, right: ${insets.right}, bottom: ${insets.bottom}, left: ${insets.left}}`}
      </RNTesterText>
      <RNTesterText>
        {frame == null
          ? ''
          : `frame: {x: ${frame.x}, y: ${frame.y}, width: ${frame.width}, height: ${frame.height}}`}
      </RNTesterText>
      <RNTesterText>
        This view does not reach under the system UI, so its insets are zero.
      </RNTesterText>
    </View>
  );
}

function FullScreenModalContent({onClose}: {onClose: () => void}): React.Node {
  const [insets, , onSafeAreaInsetsChange] = useSafeAreaInsets();
  const [applied, setApplied] = useState(false);

  // The view observes the safe area but no event has been received yet. With
  // synchronous dispatch this state is committed but never displayed: the
  // event fires while this tree is being mounted and the insets are applied
  // before the frame is presented. If a frame ever renders in this state, the
  // dispatch was not synchronous.
  const waitingForInsets = applied && insets == null;

  return (
    <View
      experimental_onSafeAreaInsetsChange={
        applied ? onSafeAreaInsetsChange : undefined
      }
      style={[
        styles.modal,
        insets == null
          ? null
          : {
              paddingTop: insets.top,
              paddingRight: insets.right,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
            },
      ]}>
      <View
        style={[
          styles.modalContent,
          waitingForInsets && styles.waitingForInsets,
        ]}>
        <RNTesterText>
          {insets != null
            ? `top: ${insets.top}, right: ${insets.right}, bottom: ${insets.bottom}, left: ${insets.left}`
            : waitingForInsets
              ? 'Observing the safe area, inset event not received yet — this state should never be visible.'
              : 'Insets not applied: the content extends under the system UI.'}
        </RNTesterText>
        <RNTesterText>
          Applying the insets and rotating the device both update the padding in
          the same frame, without the content jumping.
        </RNTesterText>
        {!applied ? (
          <Button onPress={() => setApplied(true)} title="Apply insets" />
        ) : null}
        <TextInput
          placeholder="Focus to show the keyboard"
          style={styles.keyboardProbe}
        />
        <Button onPress={onClose} title="Close" />
      </View>
    </View>
  );
}

function FullScreenExample(): React.Node {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="slide"
        supportedOrientations={['portrait', 'landscape']}>
        <FullScreenModalContent onClose={() => setModalVisible(false)} />
      </Modal>
      <Button
        onPress={() => setModalVisible(true)}
        title="Present a full screen modal"
      />
    </View>
  );
}

function FeedbackLoopModalContent({
  onClose,
}: {
  onClose: () => void,
}): React.Node {
  const [insets, , onSafeAreaInsetsChange] = useSafeAreaInsets();
  const [eventCount, setEventCount] = useState(0);
  const [looping, setLooping] = useState(false);

  const onLoopingInsetsChange = useCallback(
    (event: SafeAreaInsetsChangeEvent) => {
      setEventCount(count => count + 1);
      onSafeAreaInsetsChange(event);
    },
    [onSafeAreaInsetsChange],
  );

  return (
    <View style={styles.modal}>
      {/*
        The mistake this warns about: the view is *positioned* by the insets it
        reports, instead of padded by them. Offsetting it moves it out from
        under the system UI, which zeroes its insets, which moves it back.
      */}
      <View
        experimental_onSafeAreaInsetsChange={
          looping ? onLoopingInsetsChange : undefined
        }
        style={[styles.loopBox, {marginTop: looping ? (insets?.top ?? 0) : 0}]}>
        <RNTesterText>{`inset events: ${eventCount}`}</RNTesterText>
      </View>
      <View style={styles.modalContent}>
        <RNTesterText>
          Starting the loop should log a development warning after ten events in
          a second, once, while the counter keeps climbing.
        </RNTesterText>
        {!looping ? (
          <Button onPress={() => setLooping(true)} title="Start the loop" />
        ) : null}
        <Button onPress={onClose} title="Close" />
      </View>
    </View>
  );
}

function FeedbackLoopExample(): React.Node {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="slide"
        supportedOrientations={['portrait', 'landscape']}>
        <FeedbackLoopModalContent onClose={() => setModalVisible(false)} />
      </Modal>
      <Button
        onPress={() => setModalVisible(true)}
        title="Present a view that loops"
      />
    </View>
  );
}

let benchEventCount = 0;

function BenchRow({
  observe,
  index,
}: {
  observe: boolean,
  index: number,
}): React.Node {
  const [insets, setInsets] = useState<?Insets>(null);
  const onSafeAreaInsetsChange = useCallback(
    (event: SafeAreaInsetsChangeEvent) => {
      benchEventCount++;
      setInsets(event.nativeEvent.insets);
    },
    [],
  );

  return (
    <View
      experimental_onSafeAreaInsetsChange={
        observe ? onSafeAreaInsetsChange : undefined
      }
      style={styles.benchRow}>
      <RNTesterText>
        {`Row ${index}${observe ? ' (observing)' : ''}${
          insets == null
            ? ''
            : ` — t:${Math.round(insets.top)} b:${Math.round(insets.bottom)}`
        }`}
      </RNTesterText>
    </View>
  );
}

function ScrollBenchmark(): React.Node {
  const [observerCount, setObserverCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  return (
    <View style={styles.bench}>
      <View style={styles.benchControls}>
        {[0, 1, 50].map(count => (
          <Button
            key={count}
            title={`${count} observers`}
            onPress={() => {
              benchEventCount = 0;
              setObserverCount(count);
            }}
          />
        ))}
        <Button
          title="Read counters"
          onPress={() => {
            setEventCount(benchEventCount);
            setRenderCount(c => c + 1);
          }}
        />
      </View>
      <RNTesterText>
        {`observers: ${observerCount}, inset events since change: ${eventCount} (read ${renderCount})`}
      </RNTesterText>
      <View style={styles.benchScrollContainer}>
        <ScrollView>
          {Array.from({length: 60}, (_, i) => (
            <BenchRow key={i} index={i} observe={i < observerCount} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function WindowInsetsExample(): React.Node {
  const {
    width,
    height,
    experimental_safeAreaInsets: safeAreaInsets,
  } = useWindowDimensions();

  return (
    <View style={styles.readout}>
      <RNTesterText>{`window: {width: ${width}, height: ${height}}`}</RNTesterText>
      <RNTesterText>
        {safeAreaInsets == null
          ? 'safeAreaInsets: not available'
          : `safeAreaInsets: {top: ${safeAreaInsets.top}, right: ${safeAreaInsets.right}, bottom: ${safeAreaInsets.bottom}, left: ${safeAreaInsets.left}}`}
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    backgroundColor: '#ffaaaa',
    padding: 8,
    rowGap: 4,
  },
  modal: {
    flex: 1,
    backgroundColor: '#ffaaaa',
  },
  modalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 8,
    backgroundColor: 'white',
  },
  waitingForInsets: {
    backgroundColor: '#ffd54d',
  },
  keyboardProbe: {
    borderWidth: 1,
    borderColor: '#cccccc',
    padding: 8,
    minWidth: 240,
  },
  bench: {
    rowGap: 8,
  },
  benchControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loopBox: {
    backgroundColor: '#ffd7d7',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  benchScrollContainer: {
    height: 300,
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  benchRow: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
});

exports.displayName = undefined as ?string;
exports.framework = 'React';
exports.title = 'Safe area insets';
exports.category = 'UI';
exports.description =
  'The `experimental_onSafeAreaInsetsChange` view prop reports the part of a view that is covered by the system UI.';
exports.examples = [
  {
    title: 'Reading the insets of a view',
    description:
      'The insets are relative to the view they are reported for: a view that is already laid out inside the safe area has no insets.',
    render: (): React.Node => <InsetsReadoutExample />,
  },
  {
    title: 'Applying the insets as padding',
    description:
      'A full screen view that pads itself by its own safe area insets.',
    render: (): React.Node => <FullScreenExample />,
  },
  {
    title: 'A view that reports its insets in a loop',
    description:
      'A view positioned by the insets it reports, which moves it out of the system UI and back. Development builds warn once when a view does this.',
    render: (): React.Node => <FeedbackLoopExample />,
  },
  {
    title: 'Scroll benchmark',
    description:
      'Rows observing their own insets inside a scroll view. Scrolling moves the rows, so observing rows may emit inset events while crossing safe area boundaries.',
    render: (): React.Node => <ScrollBenchmark />,
  },
  {
    title: 'Window safe area insets from Dimensions',
    description:
      'The `Dimensions` module reports the safe area insets of the window, available synchronously at startup.',
    render: (): React.Node => <WindowInsetsExample />,
  },
] as Array<RNTesterModuleExample>;
