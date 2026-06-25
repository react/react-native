/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {RNTesterThemeContext} from '../../../components/RNTesterTheme';
import VCOverlay from './VCOverlayExample';
import VCTracker from './VCTrackerExample';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {useContext, useEffect} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export const name = 'Visual Completion Example';
export const title = name;
export const description =
  'Example of use of MutationObserver and IntersectionObserver together to track rendering performance.';

export function render(): React.Node {
  // We should use the time of the touch up event that lead to this navigation,
  // but we don't have that set up.
  const navigationStartTime = performance.now();
  const vcTracker = new VCTracker(navigationStartTime);
  return <VisualCompletionExample vcTracker={vcTracker} />;
}

/**
 * We are going to track the visual completion of this component, which uses
 * suspense and renders a complex tree in multiple steps.
 */
component VisualCompletionExample(vcTracker: VCTracker) {
  useEffect(() => {
    return () => vcTracker.disconnect();
  }, [vcTracker]);

  return (
    <>
      <VisualCompletionExampleScreen vcTracker={vcTracker} />
      <VCOverlay vcTracker={vcTracker} />
    </>
  );
}

function VisualCompletionExampleScreen(props: {
  vcTracker: VCTracker,
}): React.Node {
  const theme = useContext(RNTesterThemeContext);

  return (
    <View
      id="root-view"
      style={styles.root}
      ref={node => {
        if (node != null) {
          // $FlowExpectedError[incompatible-type]
          const element: Element = node;
          props.vcTracker.addMutationRoot(element);
        }
      }}>
      <View id="header" style={styles.header}>
        <Text style={styles.title} id="header-text">
          Title
        </Text>
      </View>
      <View id="body" style={styles.body}>
        <React.Suspense
          fallback={
            <View id="fallback">
              <ActivityIndicator />
            </View>
          }>
          <ForceSuspense queryID={generateQueryID()} delay={500}>
            <View id="scroll-view-root">
              <ScrollView id="scroll-view">
                <React.Suspense fallback={<ActivityIndicator />}>
                  <ForceSuspense queryID={generateQueryID()} delay={2500}>
                    <Text
                      style={[styles.heading, {color: theme.LabelColor}]}
                      id="scroll-view-heading">
                      Heading
                    </Text>
                  </ForceSuspense>
                </React.Suspense>
                <React.Suspense fallback={<ActivityIndicator />}>
                  <ForceSuspense queryID={generateQueryID()} delay={4500}>
                    <View style={styles.bodyContent} id="scroll-view-content" />
                  </ForceSuspense>
                </React.Suspense>
                <Text id="scroll-view-text" style={{color: theme.LabelColor}}>
                  {LONG_TEXT}
                </Text>
              </ScrollView>
            </View>
          </ForceSuspense>
        </React.Suspense>
      </View>
      <View id="footer" style={styles.footer}>
        <Text id="footer-text">Example copyright footer</Text>
      </View>
    </View>
  );
}

function ForceSuspense(props: {
  queryID: string,
  delay: number,
  children: React.Node,
}): React.Node {
  useForceSuspense(props.queryID, props.delay);
  return props.children;
}

let lastQueryID = 0;
function generateQueryID() {
  lastQueryID++;
  return 'query-id-' + lastQueryID;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    padding: 10,
    backgroundColor: 'gray',
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
  },
  body: {
    flex: 1,
    padding: 10,
  },
  heading: {
    fontSize: 16,
  },
  bodyContent: {
    width: 100,
    height: 100,
    backgroundColor: 'blue',
    margin: 50,
  },
  footer: {
    padding: 10,
    backgroundColor: 'gray',
  },
});

const store: Map<string, {promise: Promise<void>, resolved: boolean}> =
  new Map();

function useForceSuspense(queryID: string, delay: number): void {
  let entry = store.get(queryID);
  if (!entry) {
    entry = {
      resolved: false,
      promise: new Promise(resolve => {
        setTimeout(() => {
          nullthrows(entry).resolved = true;
          resolve();
        }, delay);
      }),
    };
    store.set(queryID, entry);
  }

  if (!entry.resolved) {
    throw entry.promise;
  }
}

const LONG_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas facilisis feugiat ipsum, non placerat nulla. Vestibulum tincidunt eu dui ut bibendum. Cras risus ex, rhoncus auctor velit ut, lobortis convallis turpis. Donec rutrum imperdiet ante, vitae accumsan velit convallis non. Suspendisse feugiat egestas lectus. In eget fringilla ligula, at vehicula orci. Cras laoreet hendrerit urna, sed tincidunt dolor consectetur dapibus.\n'.repeat(
    10,
  );
