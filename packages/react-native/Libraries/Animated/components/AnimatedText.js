/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AnimatedComponentType} from '../createAnimatedComponent';

import Text, {type TextProps} from '../../Text/Text';
import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';

export default createAnimatedComponent<
  $FlowFixMe,
  React.ElementRef<typeof Text>,
>(Text as $FlowFixMe) as AnimatedComponentType<
  TextProps,
  React.ElementRef<typeof Text>,
>;
