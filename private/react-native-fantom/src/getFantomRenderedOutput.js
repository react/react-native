/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RootTag} from 'react-native';

import * as React from 'react';
import NativeFantom from 'react-native/src/private/testing/fantom/specs/NativeFantom';

export type RenderOutputConfig = {
  ...FantomRenderedOutputConfig,
  includeRoot?: boolean,
  includeLayoutMetrics?: boolean,
};

type FantomJsonObject = {
  type: string,
  props: {[key: string]: string},
  children: ReadonlyArray<FantomJsonObject | string>,
};

type FantomJson = FantomJsonObject | ReadonlyArray<FantomJsonObject>;

type FantomRenderedOutputConfig = {
  // RegExp patterns to match prop names
  props?: ReadonlyArray<string>,
};

class FantomRenderedOutput {
  #json: FantomJson;

  constructor(json: FantomJson, config: FantomRenderedOutputConfig) {
    this.#json = this.#filterJson(json, config);
  }

  toJSON(): FantomJson {
    return Array.isArray(this.#json) ? [...this.#json] : {...this.#json};
  }

  toJSONObject(): FantomJsonObject {
    if (Array.isArray(this.#json)) {
      throw new Error('Cannot convert array to JSON object');
    }

    return {...this.#json};
  }

  toJSX(): React.Node {
    return convertRawJsonToJSX(this.#json);
  }

  #filterJson(
    json: FantomJson,
    config: FantomRenderedOutputConfig,
  ): FantomJson {
    if (Array.isArray(json)) {
      return json.map(child => this.#filterJsonObject(child, config));
    } else {
      return this.#filterJsonObject(json, config);
    }
  }

  #filterJsonObject(
    json: FantomJsonObject,
    config: FantomRenderedOutputConfig,
  ): FantomJsonObject {
    const root: FantomJsonObject = {
      type: json.type,
      props: this.#filterProps(json.props, config),
      children: [],
    };

    if (Array.isArray(json.children)) {
      root.children = json.children.map(child =>
        typeof child === 'object'
          ? this.#filterJsonObject(child, config)
          : child,
      );
    } else {
      root.children = json.children;
    }

    return root;
  }

  #filterProps(
    props: FantomJsonObject['props'],
    config: FantomRenderedOutputConfig,
  ): FantomJsonObject['props'] {
    const patterns = config.props;
    if (patterns == null) {
      return {...props};
    }

    return Object.keys(props)
      .filter(key => patterns.some(pattern => new RegExp(pattern).test(key)))
      .reduce(
        (acc, name) => {
          acc[name] = props[name];
          return acc;
        },
        {} as FantomJsonObject['props'],
      );
  }
}

export type {FantomRenderedOutput};

export default function getFantomRenderedOutput(
  surfaceId: RootTag,
  config: RenderOutputConfig,
): FantomRenderedOutput {
  const {
    includeRoot = false,
    includeLayoutMetrics = false,
    ...fantomConfig
  } = config;
  return new FantomRenderedOutput(
    JSON.parse(
      NativeFantom.getRenderedOutput(surfaceId, {
        includeRoot,
        includeLayoutMetrics,
      }),
    ),
    fantomConfig,
  );
}

function convertRawJsonToJSX(
  actualJSON: FantomJsonObject | ReadonlyArray<FantomJsonObject>,
): React.Node {
  let actualJSX;
  /* $FlowFixMe[invalid-compare] Error discovered during Constant Condition
   * roll out. See https://fburl.com/workplace/5whu3i34. */
  if (actualJSON === null || typeof actualJSON === 'string') {
    actualJSX = actualJSON;
  } else if (Array.isArray(actualJSON)) {
    if (actualJSON.length === 0) {
      actualJSX = null;
    } else if (actualJSON.length === 1) {
      actualJSX = jsonChildToJSXChild(actualJSON[0]);
    } else {
      const actualJSXChildren = jsonChildrenToJSXChildren(actualJSON);
      if (actualJSXChildren === null || typeof actualJSXChildren === 'string') {
        actualJSX = actualJSXChildren;
      } else {
        actualJSX = <>{actualJSXChildren}</>;
      }
    }
  } else {
    actualJSX = jsonChildToJSXChild(actualJSON);
  }

  return actualJSX;
}

function createJSXElementForTestComparison(
  type: string,
  props: unknown,
  key?: ?string,
): React.Node {
  const Tag = type;
  return <Tag key={key} {...props} />;
}

function rnTypeToTestType(type: string): string {
  return `rn-${type.substring(0, 1).toLowerCase() + type.substring(1)}`;
}

function jsonChildToJSXChild(
  jsonChild: FantomJsonObject | string,
  index?: ?number,
): React.Node {
  if (typeof jsonChild === 'string') {
    return jsonChild;
  } else {
    const jsxChildren = jsonChildrenToJSXChildren(jsonChild.children);
    const type = rnTypeToTestType(jsonChild.type);
    return createJSXElementForTestComparison(
      type,
      jsxChildren == null
        ? jsonChild.props
        : {...jsonChild.props, children: jsxChildren},
      index != null ? String(index) : undefined,
    );
  }
}

function jsonChildrenToJSXChildren(jsonChildren: FantomJsonObject['children']) {
  if (jsonChildren.length === 1) {
    return jsonChildToJSXChild(jsonChildren[0]);
  } else if (jsonChildren.length > 1) {
    const jsxChildren = [];
    let allJSXChildrenAreStrings = true;
    let jsxChildrenString = '';
    for (let i = 0; i < jsonChildren.length; i++) {
      const jsxChild = jsonChildToJSXChild(jsonChildren[i], i);
      jsxChildren.push(jsxChild);
      if (allJSXChildrenAreStrings) {
        if (typeof jsxChild === 'string') {
          jsxChildrenString += jsxChild;
        } else if (jsxChild !== null) {
          allJSXChildrenAreStrings = false;
        }
      }
    }
    return allJSXChildrenAreStrings ? jsxChildrenString : jsxChildren;
  }

  return null;
}
