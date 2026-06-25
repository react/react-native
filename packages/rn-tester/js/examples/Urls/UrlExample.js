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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {StyleSheet, View} from 'react-native';

type Props = {
  url: string,
};

function URLComponent(props: Props) {
  const parsedUrl = new URL(props.url);
  return (
    <View style={styles.container}>
      <RNTesterText testID="URL-href">{`href: ${parsedUrl.href}`}</RNTesterText>
      <RNTesterText testID="URL-hash">{`hash: ${parsedUrl.hash}`}</RNTesterText>
      <RNTesterText testID="URL-host">{`host: ${parsedUrl.host}`}</RNTesterText>
      <RNTesterText testID="URL-hostname">{`hostname: ${parsedUrl.hostname}`}</RNTesterText>
      <RNTesterText testID="URL-password">{`password: ${parsedUrl.password}`}</RNTesterText>
      <RNTesterText testID="URL-username">{`username: ${parsedUrl.username}`}</RNTesterText>
      <RNTesterText testID="URL-pathname">{`pathname: ${parsedUrl.pathname}`}</RNTesterText>
      <RNTesterText testID="URL-protocol">{`protocol: ${parsedUrl.protocol}`}</RNTesterText>
      <RNTesterText testID="URL-toString">{`toString: ${parsedUrl.toString()}`}</RNTesterText>
      <RNTesterText testID="URL-port">{`port: ${parsedUrl.port}`}</RNTesterText>
      <RNTesterText testID="URL-search">{`search: ${parsedUrl.search}`}</RNTesterText>
      <RNTesterText testID="URL-search-params">{`searchParams: ${parsedUrl.searchParams.toString()}`}</RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

exports.title = 'URL';
exports.category = 'Basic';
exports.description = 'URL Parameters test';
exports.examples = [
  {
    title: 'completeURL',
    description: 'URL with username,password,port,and queryparams',
    render(): React.Node {
      return (
        <URLComponent
          url={
            'https://username:password@reactnative.dev:8080/docs/path?query=testQuery&key=value#fragment'
          }
        />
      );
    },
  },
  {
    title: 'basicURL',
    description: 'Basic URL without username, password, or port',
    render(): React.Node {
      return <URLComponent url={'https://reactnative.dev/docs/path'} />;
    },
  },
  {
    title: 'queryParamsURL',
    description: 'URL with query parameters',
    render(): React.Node {
      return (
        <URLComponent
          url={'https://reactnative.dev/docs/path?query=testQuery&key=value'}
        />
      );
    },
  },
  {
    title: 'authAndPortURL',
    description: 'URL with username, password, and port',
    render(): React.Node {
      return (
        <URLComponent
          url={'https://username:password@reactnative.dev:8080/docs/path'}
        />
      );
    },
  },
] as Array<RNTesterModuleExample>;
