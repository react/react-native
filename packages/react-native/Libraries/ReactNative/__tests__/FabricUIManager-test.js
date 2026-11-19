/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

describe('FabricUIManager', () => {
  let getFabricUIManager;

  beforeEach(() => {
    jest.resetModules();
    delete global.nativeFabricUIManager;
    getFabricUIManager = require('../FabricUIManager').getFabricUIManager;
  });

  describe('getFabricUIManager', () => {
    it('should return undefined if the global binding is not set', () => {
      expect(getFabricUIManager()).toBeUndefined();
    });

    it('should return an object with the same properties as the global binding', () => {
      const createNode = jest.fn();
      const customProp = 'some prop';
      global.nativeFabricUIManager = {
        createNode,
        customProp,
      };
      const fabricUIManager = getFabricUIManager();

      expect(fabricUIManager).toEqual(expect.any(Object));
      expect(fabricUIManager?.createNode).toBe(createNode);
      // $FlowExpectedError[prop-missing]
      expect(fabricUIManager?.customProp).toBe(customProp);
    });

    it('should only access the cached properties of global binding once', () => {
      let incrementingProp = 0;
      global.nativeFabricUIManager = {
        // $FlowFixMe[unsafe-getters-setters]
        get createNode() {
          return jest.fn();
        },
        // $FlowFixMe[unsafe-getters-setters]
        get incrementingProp() {
          return incrementingProp++;
        },
      };

      const fabricUIManager = getFabricUIManager();

      expect(fabricUIManager).toEqual(expect.any(Object));
      const firstCreateNode = fabricUIManager?.createNode;
      const secondCreateNode = fabricUIManager?.createNode;
      // In the original object, the getter creates a new function every time.
      expect(firstCreateNode).toBe(secondCreateNode);

      // $FlowExpectedError[prop-missing]
      expect(fabricUIManager?.incrementingProp).toBe(0);
      // $FlowExpectedError[prop-missing]
      expect(fabricUIManager?.incrementingProp).toBe(1);
    });
  });
});
