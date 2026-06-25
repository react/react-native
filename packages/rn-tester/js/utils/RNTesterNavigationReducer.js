/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  ComponentList,
  RNTesterNavigationState,
} from '../types/RNTesterTypes';

export const RNTesterNavigationActionsType = {
  NAVBAR_PRESS: 'NAVBAR_PRESS',
  BACK_BUTTON_PRESS: 'BACK_BUTTON_PRESS',
  MODULE_CARD_PRESS: 'MODULE_CARD_PRESS',
  EXAMPLE_CARD_PRESS: 'EXAMPLE_CARD_PRESS',
  EXAMPLE_OPEN_URL_REQUEST: 'EXAMPLE_OPEN_URL_REQUEST',
  NAVBAR_OPEN_MODULE_PRESS: 'NAVBAR_OPEN_MODULE_PRESS',
} as const;

const getUpdatedRecentlyUsed = ({
  exampleType,
  key,
  recentlyUsed,
}: {
  exampleType: 'apis' | 'components' | null,
  key: string | null,
  recentlyUsed: ComponentList,
}) => {
  const updatedRecentlyUsed = recentlyUsed
    ? {...recentlyUsed}
    : // $FlowFixMe[missing-empty-array-annot]
      {components: [], apis: []};

  if (!exampleType || !key) {
    return updatedRecentlyUsed;
  }

  let existingKeys = updatedRecentlyUsed[exampleType];

  if (existingKeys.includes(key)) {
    existingKeys = existingKeys.filter(k => k !== key);
  }
  // $FlowFixMe[incompatible-type]
  existingKeys.unshift(key);

  updatedRecentlyUsed[exampleType] = existingKeys.slice(0, 5);

  return updatedRecentlyUsed;
};

export const RNTesterNavigationReducer = (
  state: RNTesterNavigationState,
  action: {type: keyof typeof RNTesterNavigationActionsType, data?: any},
): RNTesterNavigationState => {
  const {
    data: {
      key = null,
      title = null,
      exampleKey = null,
      exampleType = null,
      screen = null,
    } = {},
  } = action;

  switch (action.type) {
    case RNTesterNavigationActionsType.NAVBAR_PRESS:
      return {
        ...state,
        activeModuleKey: null,
        activeModuleTitle: null,
        activeModuleExampleKey: null,
        screen,
        hadDeepLink: false,
      };

    case RNTesterNavigationActionsType.NAVBAR_OPEN_MODULE_PRESS:
      return {
        ...state,
        activeModuleKey: key,
        activeModuleTitle: title,
        activeModuleExampleKey: null,
        screen,
        hadDeepLink: false,
      };

    case RNTesterNavigationActionsType.MODULE_CARD_PRESS:
      return {
        ...state,
        activeModuleKey: key,
        activeModuleTitle: title,
        activeModuleExampleKey: null,
        hadDeepLink: false,
        // $FlowFixMe[incompatible-return]
        recentlyUsed: getUpdatedRecentlyUsed({
          exampleType: exampleType,
          key: key,
          recentlyUsed: state.recentlyUsed,
        }),
      };

    case RNTesterNavigationActionsType.EXAMPLE_CARD_PRESS:
      return {
        ...state,
        hadDeepLink: false,
        activeModuleExampleKey: key,
      };

    case RNTesterNavigationActionsType.BACK_BUTTON_PRESS:
      // Go back to module or list.
      return {
        ...state,
        activeModuleExampleKey: null,
        activeModuleKey:
          !state.hadDeepLink && state.activeModuleExampleKey != null
            ? state.activeModuleKey
            : null,
        activeModuleTitle:
          !state.hadDeepLink && state.activeModuleExampleKey != null
            ? state.activeModuleTitle
            : null,
        hadDeepLink: false,
        // If there was a deeplink navigation, pressing Back should bring us back to the root.
        screen: state.hadDeepLink ? 'components' : state.screen,
      };

    case RNTesterNavigationActionsType.EXAMPLE_OPEN_URL_REQUEST:
      return {
        ...state,
        activeModuleKey: key,
        activeModuleTitle: title,
        activeModuleExampleKey: exampleKey,
        hadDeepLink: true,
        screen: 'components',
      };

    default:
      throw new Error(`Invalid action type ${action.type}`);
  }
};
