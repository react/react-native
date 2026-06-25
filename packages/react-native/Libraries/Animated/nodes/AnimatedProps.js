/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../../Types/RootTagTypes';
import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type {AnimatedNodeConfig} from './AnimatedNode';
import type {AnimatedStyleAllowlist} from './AnimatedStyle';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import {getFabricUIManager} from '../../ReactNative/FabricUIManager';
import {findNodeHandle} from '../../ReactNative/RendererProxy';
import {getNodeFromPublicInstance} from '../../ReactPrivate/ReactNativePrivateInterface';
import flattenStyle from '../../StyleSheet/flattenStyle';
import {AnimatedEvent} from '../AnimatedEvent';
import AnimatedNode from './AnimatedNode';
import AnimatedObject from './AnimatedObject';
import AnimatedStyle from './AnimatedStyle';
import invariant from 'invariant';

export type AnimatedPropsAllowlist = Readonly<{
  style?: ?AnimatedStyleAllowlist,
  [key: string]: true | AnimatedStyleAllowlist,
}>;

type TargetView = {
  readonly instance: TargetViewInstance,
  connectedViewTag: ?number,
};
type TargetViewInstance = React.ElementRef<React.ElementType>;

function createAnimatedProps(
  inputProps: {[string]: unknown},
  allowlist: ?AnimatedPropsAllowlist,
): [ReadonlyArray<string>, ReadonlyArray<AnimatedNode>, {[string]: unknown}] {
  const nodeKeys: Array<string> = [];
  const nodes: Array<AnimatedNode> = [];
  const props: {[string]: unknown} = {};

  const keys = Object.keys(inputProps);
  for (let ii = 0, length = keys.length; ii < length; ii++) {
    const key = keys[ii];
    const value = inputProps[key];
    let staticValue = value;

    if (allowlist == null || hasOwn(allowlist, key)) {
      let node;
      if (key === 'style') {
        // Ignore `style` if it is not an object (or array).
        if (typeof value === 'object' && value != null) {
          // Even if we do not find any `AnimatedNode` values in `style`, we
          // still need to use the flattened `style` object because static
          // values can shadow `AnimatedNode` values. We need to make sure that
          // we propagate the flattened `style` object to the `props` object.
          const flatStyle = flattenStyle(value as $FlowFixMe);
          node = AnimatedStyle.from(flatStyle, allowlist?.style, value);
          staticValue = flatStyle;
        }
      } else if (value instanceof AnimatedNode) {
        node = value;
      } else {
        node = AnimatedObject.from(value);
      }
      if (node == null) {
        props[key] = staticValue;
      } else {
        nodeKeys.push(key);
        nodes.push(node);
        props[key] = node;
      }
    } else {
      if (__DEV__) {
        // WARNING: This is a potentially expensive check that we should only
        // do in development. Without this check in development, it might be
        // difficult to identify which props need to be allowlisted.
        if (AnimatedObject.from(inputProps[key]) != null) {
          console.error(
            `AnimatedProps: ${key} is not allowlisted for animation, but it ` +
              'contains AnimatedNode values; props allowing animation: ',
            allowlist,
          );
        }
      }
      props[key] = value;
    }
  }

  return [nodeKeys, nodes, props];
}

export default class AnimatedProps extends AnimatedNode {
  _callback: () => void;
  _nodeKeys: ReadonlyArray<string>;
  _nodes: ReadonlyArray<AnimatedNode>;
  _props: {[string]: unknown};
  _target: ?TargetView = null;
  _rootTag: ?RootTag = undefined;

  constructor(
    inputProps: {[string]: unknown},
    callback: () => void,
    allowlist?: ?AnimatedPropsAllowlist,
    rootTag?: RootTag,
    config?: ?AnimatedNodeConfig,
  ) {
    super(config);
    const [nodeKeys, nodes, props] = createAnimatedProps(inputProps, allowlist);
    this._nodeKeys = nodeKeys;
    this._nodes = nodes;
    this._props = props;
    this._callback = callback;
    this._rootTag = rootTag;
  }

  __getValue(): Object {
    const props: {[string]: unknown} = {};

    const keys = Object.keys(this._props);
    for (let ii = 0, length = keys.length; ii < length; ii++) {
      const key = keys[ii];
      const value = this._props[key];

      if (value instanceof AnimatedNode) {
        props[key] = value.__getValue();
      } else if (value instanceof AnimatedEvent) {
        props[key] = value.__getHandler();
      } else {
        props[key] = value;
      }
    }

    return props;
  }

  /**
   * Creates a new `props` object that contains the same props as the supplied
   * `staticProps` object, except with animated nodes for any props that were
   * created by this `AnimatedProps` instance.
   */
  __getValueWithStaticProps(staticProps: Object): Object {
    const props: {[string]: unknown} = {...staticProps};

    const keys = Object.keys(staticProps);
    for (let ii = 0, length = keys.length; ii < length; ii++) {
      const key = keys[ii];
      const maybeNode = this._props[key];

      if (key === 'style') {
        const staticStyle = staticProps.style;
        const flatStaticStyle = flattenStyle(staticStyle);
        if (maybeNode instanceof AnimatedStyle) {
          const mutableStyle: {[string]: unknown} =
            flatStaticStyle == null
              ? {}
              : flatStaticStyle === staticStyle
                ? // Copy the input style, since we'll mutate it below.
                  {...flatStaticStyle}
                : // Reuse `flatStaticStyle` if it is a newly created object.
                  flatStaticStyle;

          maybeNode.__replaceAnimatedNodeWithValues(mutableStyle);
          props[key] = maybeNode.__getValueForStyle(mutableStyle);
        } else {
          props[key] = flatStaticStyle;
        }
      } else if (maybeNode instanceof AnimatedNode) {
        props[key] = maybeNode.__getValue();
      } else if (maybeNode instanceof AnimatedEvent) {
        props[key] = maybeNode.__getHandler();
      }
    }

    return props;
  }

  __getNativeAnimatedEventTuples(): ReadonlyArray<[string, AnimatedEvent]> {
    const tuples = [];

    const keys = Object.keys(this._props);
    for (let ii = 0, length = keys.length; ii < length; ii++) {
      const key = keys[ii];
      const value = this._props[key];

      if (value instanceof AnimatedEvent && value.__isNative) {
        tuples.push([key, value]);
      }
    }

    return tuples;
  }

  __getAnimatedValue(): Object {
    const props: {[string]: unknown} = {};

    const nodeKeys = this._nodeKeys;
    const nodes = this._nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const key = nodeKeys[ii];
      const node = nodes[ii];
      props[key] = node.__getAnimatedValue();
    }

    return props;
  }

  __attach(): void {
    const nodes = this._nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__addChild(this);
    }
    super.__attach();
  }

  __detach(): void {
    if (this.__isNative && this._target != null) {
      this.#disconnectAnimatedView(this._target);
    }
    this._target = null;

    const nodes = this._nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__removeChild(this);
    }

    super.__detach();
  }

  update(): void {
    this._callback();
  }

  __makeNative(platformConfig: ?PlatformConfig): void {
    const nodes = this._nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__makeNative(platformConfig);
    }

    if (!this.__isNative) {
      this.__isNative = true;

      // Since this does not call the super.__makeNative, we need to store the
      // supplied platformConfig here, before calling #connectAnimatedView
      // where it will be needed to traverse the graph of attached values.
      super.__setPlatformConfig(platformConfig);

      if (this._target != null) {
        const target = this._target;
        this.#connectAnimatedView(target);
        this.#connectShadowNode(target);
      }
    }
  }

  setNativeView(instance: TargetViewInstance): void {
    if (this._target?.instance === instance) {
      return;
    }
    const target = (this._target = {instance, connectedViewTag: null});
    if (this.__isNative) {
      this.#connectAnimatedView(target);
      this.#connectShadowNode(target);
    }
  }

  #connectAnimatedView(target: TargetView): void {
    invariant(this.__isNative, 'Expected node to be marked as "native"');
    let viewTag: ?number = findNodeHandle(target.instance);
    if (viewTag == null) {
      if (process.env.NODE_ENV === 'test') {
        viewTag = -1;
      } else {
        throw new Error('Unable to locate attached view in the native tree');
      }
    }
    NativeAnimatedHelper.API.connectAnimatedNodeToView(
      this.__getNativeTag(),
      viewTag,
    );
    target.connectedViewTag = viewTag;
  }

  #connectShadowNode(target: TargetView): void {
    if (
      !ReactNativeFeatureFlags.cxxNativeAnimatedEnabled() ||
      //eslint-disable-next-line
      !ReactNativeFeatureFlags.useSharedAnimatedBackend()
    ) {
      return;
    }

    invariant(this.__isNative, 'Expected node to be marked as "native"');
    // Host components and ScrollView (whose ref is the host instance) resolve a
    // shadow node directly; FlatList/SectionList are class composites that expose
    // the host via getNativeScrollRef().
    // $FlowFixMe[unclear-type] - Legacy instance assumptions.
    const instance: any = target.instance;
    const candidates = [instance, instance?.getNativeScrollRef?.()];
    let shadowNode = null;
    for (const candidate of candidates) {
      if (candidate == null) {
        continue;
      }
      shadowNode = getNodeFromPublicInstance(candidate);
      if (shadowNode != null) {
        break;
      }
    }
    // Any other class composite: resolve from the host tag #connectAnimatedView
    // already found via findNodeHandle (the lookup runs on the native side).
    const connectedViewTag = target.connectedViewTag;
    if (shadowNode == null && connectedViewTag != null) {
      shadowNode =
        getFabricUIManager()?.findShadowNodeByTag_DEPRECATED?.(
          connectedViewTag,
        );
    }
    if (shadowNode == null) {
      return;
    }
    NativeAnimatedHelper.API.connectAnimatedNodeToShadowNodeFamily(
      this.__getNativeTag(),
      shadowNode,
    );
  }

  #disconnectAnimatedView(target: TargetView): void {
    invariant(this.__isNative, 'Expected node to be marked as "native"');
    const viewTag = target.connectedViewTag;
    if (viewTag == null) {
      return;
    }
    NativeAnimatedHelper.API.disconnectAnimatedNodeFromView(
      this.__getNativeTag(),
      viewTag,
    );
    target.connectedViewTag = null;
  }

  __restoreDefaultValues(): void {
    // When using the native driver, view properties need to be restored to
    // their default values manually since react no longer tracks them. This
    // is needed to handle cases where a prop driven by native animated is removed
    // after having been changed natively by an animation.
    if (this.__isNative) {
      NativeAnimatedHelper.API.restoreDefaultValues(this.__getNativeTag());
    }
  }

  __getNativeConfig(): Object {
    const platformConfig = this.__getPlatformConfig();
    const propsConfig: {[string]: number} = {};

    const nodeKeys = this._nodeKeys;
    const nodes = this._nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const key = nodeKeys[ii];
      const node = nodes[ii];
      node.__makeNative(platformConfig);
      propsConfig[key] = node.__getNativeTag();
    }

    return {
      type: 'props',
      props: propsConfig,
      rootTag: this._rootTag ?? undefined,
      debugID: this.__getDebugID(),
    };
  }
}

// Supported versions of JSC do not implement the newer Object.hasOwn. Remove
// this shim when they do.
// $FlowFixMe[method-unbinding]
const _hasOwnProp = Object.prototype.hasOwnProperty;
const hasOwn: (obj: Readonly<{...}>, prop: string) => boolean =
  // $FlowFixMe[method-unbinding]
  Object.hasOwn ?? ((obj, prop) => _hasOwnProp.call(obj, prop));
