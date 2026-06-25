/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Button, Dimensions, View, useWindowDimensions} from 'react-native';

type Props = {dim: string};

function DimensionsSubscription(props: Props) {
  const [dims, setDims] = useState(() => Dimensions.get(props.dim));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', dimensions => {
      setDims(dimensions[props.dim]);
    });

    return () => subscription.remove();
  }, [props.dim]);

  return (
    <RNTesterText variant="label">{JSON.stringify(dims, null, 2)}</RNTesterText>
  );
}

const DimensionsViaHook = () => {
  const dims = useWindowDimensions();
  return (
    <RNTesterText variant="label">{JSON.stringify(dims, null, 2)}</RNTesterText>
  );
};

const DimensionsViaCall = ({dim}: Props) => {
  const [info, setInfo] = useState(() => Dimensions.get(dim));
  return (
    <View>
      <Button
        onPress={() => setInfo(Dimensions.get(dim))}
        title={`Invoke get('${dim}')`}
      />

      <RNTesterText variant="label">
        {JSON.stringify(info, null, 2)}
      </RNTesterText>
    </View>
  );
};

exports.title = 'Dimensions';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/dimensions';
exports.description = 'Dimensions of the viewport';
exports.examples = [
  {
    title: 'useWindowDimensions hook',
    render(): React.Node {
      return <DimensionsViaHook />;
    },
  },
  {
    title: 'Non-component `get` API (subscription): window',
    render(): React.MixedElement {
      return <DimensionsSubscription dim="window" />;
    },
  },
  {
    title: 'Non-component `get` API (subscription): screen',
    render(): React.MixedElement {
      return <DimensionsSubscription dim="screen" />;
    },
  },
  {
    title: 'Non-component `get` API (manual call): window',
    render(): React.MixedElement {
      return <DimensionsViaCall dim="window" />;
    },
  },
  {
    title: 'Non-component `get` API (manual call): screen',
    render(): React.MixedElement {
      return <DimensionsViaCall dim="screen" />;
    },
  },
] as Array<RNTesterModuleExample>;
