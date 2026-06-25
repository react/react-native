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

import * as React from 'react';

type Props = Readonly<{
  /**
   * Indicates whether the render function needs to be called again
   */
  shouldUpdate: boolean,
  /**
   * () => renderable
   * A function that returns a renderable component
   */
  render: () => React.Node,
}>;

class StaticRenderer extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props): boolean {
    return nextProps.shouldUpdate;
  }

  render(): React.Node {
    return this.props.render();
  }
}

export default StaticRenderer;
