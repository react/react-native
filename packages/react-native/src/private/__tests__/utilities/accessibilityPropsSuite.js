/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AccessibilityRole, Role} from '../../../..';
import type {Root} from '@react-native/fantom';
import type {AccessibilityProps} from 'react-native';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';

const ACCESIBILITY_ROLE_VALUES: ReadonlyArray<AccessibilityRole> = [
  'none',
  'button',
  'link',
  'search',
  'image',
  'keyboardkey',
  'text',
  'adjustable',
  'imagebutton',
  'header',
  'summary',
  'alert',
  'checkbox',
  'combobox',
  'menu',
  'menubar',
  'menuitem',
  'progressbar',
  'radio',
  'radiogroup',
  'scrollbar',
  'spinbutton',
  'switch',
  'tab',
  'tablist',
  'timer',
  'toolbar',
];

const ROLE_VALUES: ReadonlyArray<Role> = [
  'alert',
  'alertdialog',
  'application',
  'article',
  'banner',
  'button',
  'cell',
  'checkbox',
  'columnheader',
  'combobox',
  'complementary',
  'contentinfo',
  'definition',
  'dialog',
  'directory',
  'document',
  'feed',
  'figure',
  'form',
  'grid',
  'group',
  'heading',
  'img',
  'link',
  'list',
  'listitem',
  'log',
  'main',
  'marquee',
  'math',
  'menu',
  'menubar',
  'menuitem',
  'meter',
  'navigation',
  'none',
  'note',
  'option',
  'presentation',
  'progressbar',
  'radio',
  'radiogroup',
  'region',
  'row',
  'rowgroup',
  'rowheader',
  'scrollbar',
  'searchbox',
  'separator',
  'slider',
  'spinbutton',
  'status',
  'summary',
  'switch',
  'tab',
  'table',
  'tablist',
  'tabpanel',
  'term',
  'timer',
  'toolbar',
  'tooltip',
  'tree',
  'treegrid',
  'treeitem',
  'treeitem',
];

let root: Root;

function getAccessibilityProp(
  content: React.MixedElement,
  name: keyof AccessibilityProps,
) {
  Fantom.runTask(() => {
    root.render(content);
  });
  return root.getRenderedOutput({props: [name]}).toJSONObject().props[name];
}

function getAccessibilityProps(
  content: React.MixedElement,
  names: ReadonlyArray<keyof AccessibilityProps>,
) {
  Fantom.runTask(() => {
    root.render(content);
  });
  const props = root.getRenderedOutput({props: names}).toJSONObject().props;
  return {...props};
}

export function rolePropSuite(
  Component: component(...AccessibilityProps),
): void {
  describe('role', () => {
    beforeEach(() => {
      root = Fantom.createRoot();
    });

    afterEach(() => {
      root.destroy();
    });

    it(`'role' has none by default`, () => {
      expect(getAccessibilityProps(<Component />, ['role'])).toEqual({});
    });

    it(`'role' maps invalid values to 'none'`, () => {
      expect(
        getAccessibilityProps(
          // $FlowExpectedError[incompatible-type]
          <Component role="__some_invalid_value" />,
          ['role'],
        ),
      ).toEqual({['role']: 'none'});
    });

    describe(`'role' propagation`, () => {
      ROLE_VALUES.forEach(role => {
        it(`can be set to ${role}`, () => {
          expect(
            getAccessibilityProp(<Component role={role} />, 'role'),
          ).toEqual(role);
        });
      });
    });
  });
}

export default function accessibilityPropsSuite(
  Component: component(...AccessibilityProps),
  accessibleByDefault: boolean = true,
): void {
  describe('accessibility', () => {
    beforeEach(() => {
      root = Fantom.createRoot();
    });

    afterEach(() => {
      root.destroy();
    });

    describe('accessible', () => {
      accessibleByDefault &&
        it('is accessible by default', () => {
          expect(getAccessibilityProp(<Component />, 'accessible')).toEqual(
            'true',
          );
        });

      !accessibleByDefault &&
        it('is not accessible by default', () => {
          expect(getAccessibilityProp(<Component />, 'accessible')).toEqual(
            undefined,
          );
        });

      it('can be set to accessible', () => {
        expect(
          getAccessibilityProp(<Component accessible={true} />, 'accessible'),
        ).toEqual('true');
      });

      it('can be set to not accessible', () => {
        expect(
          getAccessibilityProp(<Component accessible={false} />, 'accessible'),
        ).toEqual(undefined);
      });
    });

    describe('accessibilityLabel', () => {
      it('can be set', () => {
        expect(
          getAccessibilityProp(
            <Component accessibilityLabel="Touch" />,
            'accessibilityLabel',
          ),
        ).toEqual('Touch');
      });
    });

    describe('accessibilityHint', () => {
      it('can be set to help users understand what will happen when they perform an action', () => {
        expect(
          getAccessibilityProps(
            <Component
              accessibilityLabel="Touchable"
              accessibilityHint="Can be pressed to interact"
            />,
            ['accessibilityLabel', 'accessibilityHint'],
          ),
        ).toEqual({
          accessibilityLabel: 'Touchable',
          accessibilityHint: 'Can be pressed to interact',
        });
      });
    });

    describe('accessibilityRole', () => {
      describe(`value propagation`, () => {
        ACCESIBILITY_ROLE_VALUES.forEach(role => {
          it(`can be set to ${role}`, () => {
            expect(
              getAccessibilityProp(
                <Component accessibilityRole={role} />,
                'accessibilityRole',
              ),
            ).toEqual(role);
          });
        });
      });

      it(`has 'accessibilityRole' of higher priority than "role"`, () => {
        expect(
          getAccessibilityProp(
            <Component accessibilityRole="button" role="radio" />,
            'accessibilityRole',
          ),
        ).toEqual('button');
      });
    });

    describe('accessibilityState', () => {
      (['disabled', 'selected', 'busy', 'expanded'] as const).forEach(
        stateProp => {
          it(`can be "${stateProp}"`, () => {
            expect(
              getAccessibilityProp(
                <Component accessibilityState={{[stateProp]: true}} />,
                'accessibilityState',
              ).includes(`${stateProp}:true`),
            ).toEqual(true);
          });
        },
      );

      describe('checked', () => {
        it('can be set to true', () => {
          expect(
            getAccessibilityProp(
              <Component accessibilityState={{checked: true}} />,
              'accessibilityState',
            ).includes(`checked:Checked`),
          ).toEqual(true);
        });

        it('can be set to false', () => {
          expect(
            getAccessibilityProp(
              <Component accessibilityState={{checked: false}} />,
              'accessibilityState',
            ).includes(`checked:Unchecked`),
          ).toEqual(true);
        });

        it("can be set to 'mixed'", () => {
          expect(
            getAccessibilityProp(
              <Component accessibilityState={{checked: 'mixed'}} />,
              'accessibilityState',
            ).includes('checked:Mixed'),
          ).toEqual(true);
        });
      });
    });

    describe('accessibilityActions', () => {
      it('can be set to list of actions', () => {
        expect(
          getAccessibilityProp(
            <Component
              accessibilityActions={[
                {name: 'activate'},
                {name: 'spawn', label: 'open a panel'},
                {name: 'escape'},
              ]}
            />,
            'accessibilityActions',
          ),
        ).toEqual("[activate, spawn: 'open a panel', escape]");
      });
    });
  });
}
