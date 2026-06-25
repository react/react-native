/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import * as React from 'react';
import {createElement} from 'react';

type Modulish<T> = T | Readonly<{default: T}>;
type ModuleDefault<T> = T['default'];

type TComponentType = React.ComponentType<{...}>;

/**
 * WARNING: The `moduleName` must be relative to this file's directory, which is
 * a major footgun. Be careful when using this function!
 */
export default function mockComponent<
  TComponentModule extends Modulish<TComponentType>,
  TIsESModule extends boolean,
>(
  moduleName: string,
  instanceMethods: ?interface {},
  isESModule: TIsESModule,
): TIsESModule extends true // $FlowFixMe[incompatible-use]
  ? ModuleDefault<TComponentModule & typeof instanceMethods>
  : TComponentModule & typeof instanceMethods {
  const RealComponent: TComponentType = isESModule
    ? // $FlowFixMe[prop-missing]
      jest.requireActual<TComponentModule>(moduleName).default
    : // $FlowFixMe[incompatible-type]
      jest.requireActual<TComponentModule>(moduleName);

  const SuperClass: typeof React.Component<{...}> =
    typeof RealComponent === 'function' &&
    RealComponent.prototype?.constructor instanceof React.Component
      ? RealComponent
      : React.Component;

  const name =
    RealComponent.displayName ??
    RealComponent.name ??
    // $FlowFixMe[prop-missing] - Checking for `forwardRef` values.
    (RealComponent.render == null
      ? 'Unknown'
      : // $FlowFixMe[incompatible-use]
        (RealComponent.render.displayName ?? RealComponent.render.name));

  const nameWithoutPrefix = name.replace(/^(RCT|RK)/, '');

  const Component = class extends SuperClass {
    static displayName: ?string = 'Component';

    render(): React.Node {
      // $FlowFixMe[prop-missing]
      const props = {...RealComponent.defaultProps};

      if (this.props) {
        Object.keys(this.props).forEach(prop => {
          // We can't just assign props on top of defaultProps
          // because React treats undefined as special and different from null.
          // If a prop is specified but set to undefined it is ignored and the
          // default prop is used instead. If it is set to null, then the
          // null value overwrites the default value.
          if (this.props[prop] !== undefined) {
            props[prop] = this.props[prop];
          }
        });
      }

      // $FlowFixMe[not-a-function]
      // $FlowFixMe[prop-missing]
      return createElement(nameWithoutPrefix, props, this.props.children);
    }
  };

  Object.defineProperty(Component, 'name', {
    value: name,
    writable: false,
    enumerable: false,
    configurable: true,
  });

  Component.displayName = nameWithoutPrefix;

  // $FlowFixMe[not-an-object]
  Object.keys(RealComponent).forEach(classStatic => {
    Component[classStatic] = RealComponent[classStatic];
  });

  if (instanceMethods != null) {
    // $FlowFixMe[unsafe-object-assign]
    Object.assign(Component.prototype, instanceMethods);
  }

  // $FlowFixMe[incompatible-type]
  return Component;
}
