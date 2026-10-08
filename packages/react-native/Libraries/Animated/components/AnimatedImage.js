/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ImageProps} from '../../Image/ImageProps';
import type {AnimatedComponentType} from '../createAnimatedComponent';

import Image from '../../Image/Image';
import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';

export default createAnimatedComponent<
  $FlowFixMe,
  React.ElementRef<typeof Image>,
>(Image as $FlowFixMe) as AnimatedComponentType<
  ImageProps,
  React.ElementRef<typeof Image>,
>;
