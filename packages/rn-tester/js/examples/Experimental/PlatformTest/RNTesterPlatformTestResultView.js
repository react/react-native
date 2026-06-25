/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  PlatformTestResult,
  PlatformTestResultStatus,
} from './RNTesterPlatformTestTypes';
import type {ListRenderItemInfo, TextStyle} from 'react-native';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import RNTesterPlatformTestMinimizedResultView from './RNTesterPlatformTestMinimizedResultView';
import RNTesterPlatformTestResultsText from './RNTesterPlatformTestResultsText';
import * as React from 'react';
import {memo, useCallback, useMemo, useState} from 'react';
import {
  Button,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const DISPLAY_STATUS_MAPPING: {[PlatformTestResultStatus]: string} = {
  PASS: 'Pass',
  FAIL: 'Fail',
  ERROR: 'Error',
  SKIPPED: 'Skipped',
};

type FilterModalProps = Readonly<{
  filterText: string,
  setFilterText: (newFilterText: string) => void,
  filterFail: boolean,
  setFilterFail: (newFilterFail: boolean) => void,
}>;
function FilterModalButton(props: FilterModalProps) {
  const {filterText, setFilterText, filterFail, setFilterFail} = props;

  const [modalVisible, setModalVisible] = useState(false);
  const [pendingFilterText, setPendingFilterText] = useState(filterText);

  const onFilterButtonPress = useCallback(() => {
    setPendingFilterText(filterText);
    setModalVisible(true);
  }, [filterText]);

  const onFilterSubmit = useCallback(() => {
    setFilterText(pendingFilterText);
    setModalVisible(false);
  }, [pendingFilterText, setFilterText]);

  const onFilterCancel = useCallback(() => {
    setModalVisible(false);
  }, []);

  const onFilterFailStatus = useCallback(
    (value: boolean) => {
      setFilterFail(value);
    },
    [setFilterFail],
  );

  const onPendingTextChange = useCallback((newText: string) => {
    setPendingFilterText(newText);
  }, []);

  return (
    <>
      <Button title="Filter" onPress={onFilterButtonPress} />
      <Modal
        visible={modalVisible}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent={true}>
        <SafeAreaView style={styles.filterModalRoot}>
          <KeyboardAvoidingView
            style={styles.filterModalKeyboardAvoidingRoot}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.filterModalContainer}>
              <View style={styles.filterModalContentContainer}>
                <View style={styles.filterModalPromptContainer}>
                  <Text style={styles.filterModalPromptText}>
                    Enter a test name filter
                  </Text>
                </View>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                  style={styles.filterModalPendingTextInput}
                  value={pendingFilterText}
                  onChangeText={onPendingTextChange}
                  onSubmitEditing={onFilterSubmit}
                />
                <View style={styles.filterFail}>
                  <Text>
                    {filterFail ? 'Filter All Status' : 'Filter Only Failed'}
                  </Text>
                  <Switch
                    value={filterFail}
                    onValueChange={onFilterFailStatus}
                  />
                </View>
              </View>
              <View style={styles.filterModalActionsContainer}>
                <Button title="Cancel" onPress={onFilterCancel} />
                <Button title="Submit" onPress={onFilterSubmit} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function TableHeader() {
  return (
    <View style={styles.tableRow}>
      <View style={[styles.tableHeaderColumn, styles.tableResultColumn]}>
        <Text style={styles.tableHeader}>Result</Text>
      </View>
      <View style={[styles.tableHeaderColumn, styles.tableTestNameColumn]}>
        <Text style={styles.tableHeader}>Test Name</Text>
      </View>
      <View style={[styles.tableHeaderColumn, styles.tableMessageColumn]}>
        <Text style={styles.tableHeader}>Message</Text>
      </View>
    </View>
  );
}

const TableRow = memo(({testResult}: {testResult: PlatformTestResult}) => {
  return (
    <View style={styles.tableRow}>
      <View style={styles.tableResultColumn}>
        <Text style={STATUS_TEXT_STYLE_MAPPING[testResult.status]}>
          {DISPLAY_STATUS_MAPPING[testResult.status]}
        </Text>
      </View>
      <View style={styles.tableTestNameColumn}>
        <Text>{testResult.name}</Text>
      </View>
      <View style={styles.tableMessageColumn}>
        {testResult.assertions.map((assertion, assertionIdx) => {
          if (assertion.passing) {
            return null;
          }
          return (
            <Text key={assertionIdx}>
              {assertion.name}: {assertion.description}{' '}
              {assertion.failureMessage}
            </Text>
          );
        })}
      </View>
    </View>
  );
});

function renderTableRow({item}: ListRenderItemInfo<PlatformTestResult>) {
  return <TableRow testResult={item} />;
}

type Props = Readonly<{
  numPending: number,
  reset: () => void,
  results: ReadonlyArray<PlatformTestResult>,
  style?: ?ViewStyleProp,
}>;
export default function RNTesterPlatformTestResultView(
  props: Props,
): React.MixedElement {
  const {numPending, reset, results, style} = props;

  const [filterText, setFilterText] = useState('');
  const [filterFailStatus, setFilterFailStatus] = useState(false);

  const filteredResults = useMemo(() => {
    const statusFiltered = filterFailStatus
      ? results.filter(result => result.status === 'FAIL')
      : results;

    if (filterText === '') {
      return statusFiltered;
    }
    return statusFiltered.filter(result =>
      result.name.toLowerCase().includes(filterText.toLowerCase()),
    );
  }, [filterFailStatus, filterText, results]);

  const {numPass, numFail, numError, numSkipped} = useMemo(
    () =>
      filteredResults.reduce(
        (acc, result) => {
          switch (result.status) {
            case 'PASS':
              return {...acc, numPass: acc.numPass + 1};
            case 'FAIL':
              return {...acc, numFail: acc.numFail + 1};
            case 'ERROR':
              return {...acc, numError: acc.numError + 1};
            case 'SKIPPED':
              return {...acc, numSkipped: acc.numSkipped + 1};
          }
        },
        {
          numPass: 0,
          numFail: 0,
          numError: 0,
          numSkipped: 0,
        },
      ),
    [filteredResults],
  );

  const [resultsExpanded, setResultsExpanded] = useState(false);

  const handleReset = useCallback(() => {
    setFilterFailStatus(false);
    setFilterText('');
    reset();
    setResultsExpanded(false);
  }, [reset]);

  const handleMinimizedPress = useCallback(() => {
    setResultsExpanded(true);
  }, []);

  const handleMaximizedPress = useCallback(() => {
    setResultsExpanded(false);
  }, []);

  const filteredNotice = `Filtered${filterFailStatus ? ' (Failed)' : ''}${
    filterText !== '' ? `: ${filterText}` : ''
  }
  `;

  return (
    <>
      <RNTesterPlatformTestMinimizedResultView
        numFail={numFail}
        numError={numError}
        numPass={numPass}
        numPending={numPending}
        numSkipped={numSkipped}
        onPress={handleMinimizedPress}
        style={style}
      />
      <Modal
        animationType="slide"
        onRequestClose={handleMaximizedPress}
        visible={resultsExpanded}>
        <SafeAreaView
          style={{
            width: '100%',
            height: '100%',
            flexDirection: 'column',
          }}>
          <View style={styles.resultsHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Results</Text>
              <Text style={styles.filteredText}>{filteredNotice}</Text>
              <View style={styles.summaryContainer}>
                <RNTesterPlatformTestResultsText
                  numError={numError}
                  numFail={numFail}
                  numPass={numPass}
                  numPending={numPending}
                  numSkipped={numSkipped}
                />
              </View>
            </View>
            <View style={styles.actionsContainer}>
              <FilterModalButton
                filterText={filterText}
                setFilterText={setFilterText}
                filterFail={filterFailStatus}
                setFilterFail={setFilterFailStatus}
              />
              <View style={styles.buttonSpacer} />
              <Button title="Reset" onPress={handleReset} />
            </View>
            <TouchableOpacity
              hitSlop={{bottom: 10, left: 10, right: 10, top: 10}}
              onPress={handleMaximizedPress}
              style={styles.closeButton}>
              <Text style={styles.closeButtonIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.table}>
            <TableHeader />
            <FlatList data={filteredResults} renderItem={renderTableRow} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
  },
  buttonSpacer: {
    width: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 16,
    backgroundColor: 'lightgray',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  errorText: {
    color: 'orange',
  },
  failText: {
    color: 'red',
  },
  filteredText: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: 'normal',
    opacity: 0.5,
  },
  filterModalActionButton: {
    flex: 1,
  },
  filterModalActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 50,
  },
  filterModalContainer: {
    minWidth: 250,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  filterModalContentContainer: {
    paddingHorizontal: 12,
  },
  filterModalPromptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  filterModalPromptText: {
    paddingVertical: 12,
    fontSize: 16,
  },
  filterModalPendingTextInput: {
    // height: 40,
    padding: 6,
    backgroundColor: 'white',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgb(171, 171, 171)',
    borderRadius: 8,
  },
  filterModalKeyboardAvoidingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterFail: {
    alignItems: 'center',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passText: {
    color: 'green',
  },
  pendingText: {
    color: 'gray',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    flex: 0,
  },
  skippedText: {
    color: 'blue',
  },
  table: {
    flex: 1,
  },
  tableHeader: {
    fontSize: 16,
    fontWeight: '700',
  },
  tableHeaderColumn: {
    alignItems: 'center',
  },
  tableMessageColumn: {
    flex: 2.5,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  tableResultColumn: {
    flex: 0.5,
    minWidth: 40,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  tableTestNameColumn: {
    flex: 2,
    justifyContent: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  titleContainer: {
    flexDirection: 'column',
  },
});

const STATUS_TEXT_STYLE_MAPPING: {[PlatformTestResultStatus]: TextStyle} = {
  PASS: styles.passText,
  FAIL: styles.failText,
  ERROR: styles.errorText,
  SKIPPED: styles.skippedText,
};
