/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import RNTesterModuleContainer from './components/RNTesterModuleContainer';
import RNTesterModuleList from './components/RNTesterModuleList';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';
import resolveExampleURL from './utils/resolveExampleURL';
import RNTesterList from './utils/RNTesterList';
import {push, pushFromDeepLink} from './utils/RNTesterNavigator';
import {addRecentlyUsed, useRecentlyUsed} from './utils/RNTesterRecentlyUsed';
import {getExamplesListWithRecentlyUsed} from './utils/testerStateUtils';
import * as React from 'react';
import {useCallback, useEffect, useMemo} from 'react';
import {
  Dimensions,
  Linking,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';

type Props = Readonly<{
  // Set on the root screen of each tab.
  screen?: 'components' | 'apis' | 'playgrounds',
  // Set on screens pushed onto a tab's stack.
  moduleKey?: string,
  exampleKey?: string,
}>;

/**
 * A single screen hosted by the native navigator on iOS. Each tab root and
 * each pushed module or example mounts this as its own surface.
 */
export default function RNTesterScreen({
  screen,
  moduleKey,
  exampleKey,
}: Props): React.Node {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? themes.dark : themes.light;

  let content;
  if (moduleKey != null) {
    content = <ModuleScreen moduleKey={moduleKey} exampleKey={exampleKey} />;
  } else if (screen === 'playgrounds') {
    content = <ModuleScreen moduleKey="PlaygroundExample" />;
  } else {
    content = <ModuleListScreen exampleType={screen ?? 'components'} />;
  }

  return (
    <RNTesterThemeContext.Provider value={theme}>
      <View
        style={StyleSheet.compose(styles.container, {
          backgroundColor: theme.GroupedBackgroundColor,
        })}>
        {content}
      </View>
    </RNTesterThemeContext.Provider>
  );
}

function ModuleListScreen({
  exampleType,
}: {
  exampleType: 'components' | 'apis',
}): React.Node {
  const recentlyUsed = useRecentlyUsed();
  const sections = useMemo(
    () => getExamplesListWithRecentlyUsed({recentlyUsed})?.[exampleType],
    [exampleType, recentlyUsed],
  );

  const handleModuleCardPress = useCallback(
    ({
      exampleType: type,
      key,
      title,
    }: {
      exampleType: 'components' | 'apis',
      key: string,
      title: string,
    }) => {
      addRecentlyUsed(type, key);
      push({
        moduleKey: key,
        title,
        // $FlowFixMe[invalid-computed-prop]
        documentationURL: RNTesterList.Modules[key]?.documentationURL,
      });
    },
    [],
  );

  useEffect(() => {
    // Deep links always land on the Components tab, so only its root listens.
    if (exampleType !== 'components') {
      return;
    }

    const handleOpenUrlRequest = ({url}: {url: string, ...}) => {
      const target = resolveExampleURL(url);
      if (target == null) {
        return;
      }
      pushFromDeepLink({
        moduleKey: target.key,
        title: target.title,
        exampleKey: target.exampleKey,
        // $FlowFixMe[invalid-computed-prop]
        documentationURL: RNTesterList.Modules[target.key]?.documentationURL,
        // Hide chrome if we don't have much screen space and are showing UI
        // for tests
        hidesChrome: Dimensions.get('window').height < 600,
      });
    };

    Linking.getInitialURL()
      .then(url => url != null && handleOpenUrlRequest({url}))
      .catch(_ => {});
    const subscription = Linking.addEventListener('url', handleOpenUrlRequest);
    return () => subscription.remove();
  }, [exampleType]);

  if (sections == null) {
    return null;
  }

  return (
    <RNTesterModuleList
      sections={sections}
      handleModuleCardPress={handleModuleCardPress}
    />
  );
}

function ModuleScreen({
  moduleKey,
  exampleKey,
}: {
  moduleKey: string,
  exampleKey?: string,
}): React.Node {
  // $FlowFixMe[invalid-computed-prop]
  const module = RNTesterList.Modules[moduleKey];
  const example =
    exampleKey != null
      ? module.examples.find(e => e.name === exampleKey)
      : null;

  const handleExampleCardPress = useCallback(
    (exampleName: string) => {
      push({
        moduleKey,
        title: module.title,
        exampleKey: exampleName,
        documentationURL: module.documentationURL,
      });
    },
    [module, moduleKey],
  );

  return (
    <RNTesterModuleContainer
      module={module}
      example={example}
      onExampleCardPress={handleExampleCardPress}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
