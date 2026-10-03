/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import processClipPath from '../processClipPath';

describe('processClipPath', () => {
  describe('geometry box', () => {
    it('should parse border-box', () => {
      expect(processClipPath('border-box')).toEqual({
        geometryBox: 'border-box',
      });
    });

    it('should parse padding-box', () => {
      expect(processClipPath('padding-box')).toEqual({
        geometryBox: 'padding-box',
      });
    });

    it('should parse content-box', () => {
      expect(processClipPath('content-box')).toEqual({
        geometryBox: 'content-box',
      });
    });

    it('should parse margin-box', () => {
      expect(processClipPath('margin-box')).toEqual({
        geometryBox: 'margin-box',
      });
    });

    it('should parse fill-box', () => {
      expect(processClipPath('fill-box')).toEqual({
        geometryBox: 'fill-box',
      });
    });

    it('should parse stroke-box', () => {
      expect(processClipPath('stroke-box')).toEqual({
        geometryBox: 'stroke-box',
      });
    });

    it('should parse view-box', () => {
      expect(processClipPath('view-box')).toEqual({
        geometryBox: 'view-box',
      });
    });
  });

  describe('inset() function', () => {
    it('should parse inset with single value', () => {
      expect(processClipPath('inset(10px)')).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
        },
      });
    });

    it('should parse inset with two values', () => {
      expect(processClipPath('inset(10px 20px)')).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          bottom: 10,
          right: 20,
          left: 20,
        },
      });
    });

    it('should parse inset with three values', () => {
      expect(processClipPath('inset(10px 20px 30px)')).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          right: 20,
          left: 20,
          bottom: 30,
        },
      });
    });

    it('should parse inset with four values', () => {
      expect(processClipPath('inset(10px 20px 30px 40px)')).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          right: 20,
          bottom: 30,
          left: 40,
        },
      });
    });

    it('should parse inset with percentage', () => {
      expect(processClipPath('inset(10% 20%)')).toEqual({
        shape: {
          type: 'inset',
          top: '10%',
          bottom: '10%',
          right: '20%',
          left: '20%',
        },
      });
    });

    it('should parse inset with border-radius', () => {
      expect(processClipPath('inset(10px round 5px)')).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
          borderRadius: 5,
        },
      });
    });

    it('should parse inset with geometry box', () => {
      expect(processClipPath('inset(10px) border-box')).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
        },
        geometryBox: 'border-box',
      });
    });
  });

  describe('circle() function', () => {
    it('should parse circle with radius', () => {
      expect(processClipPath('circle(50px)')).toEqual({
        shape: {
          type: 'circle',
          r: 50,
        },
      });
    });

    it('should parse circle with radius and position', () => {
      expect(processClipPath('circle(50px at 100px 100px)')).toEqual({
        shape: {
          type: 'circle',
          r: 50,
          cx: 100,
          cy: 100,
        },
      });
    });

    it('should parse circle with percentage position', () => {
      expect(processClipPath('circle(50px at 25% 75%)')).toEqual({
        shape: {
          type: 'circle',
          r: 50,
          cx: '25%',
          cy: '75%',
        },
      });
    });

    it('should parse circle with percentage radius', () => {
      expect(processClipPath('circle(50%)')).toEqual({
        shape: {
          type: 'circle',
          r: '50%',
        },
      });
    });

    it('should parse empty circle', () => {
      expect(processClipPath('circle()')).toEqual({
        shape: {
          type: 'circle',
        },
      });
    });
  });

  describe('ellipse() function', () => {
    it('should parse ellipse with radii', () => {
      expect(processClipPath('ellipse(50px 25px)')).toEqual({
        shape: {
          type: 'ellipse',
          rx: 50,
          ry: 25,
        },
      });
    });

    it('should parse ellipse with single radius', () => {
      expect(processClipPath('ellipse(50px)')).toEqual({
        shape: {
          type: 'ellipse',
          rx: 50,
          ry: 50,
        },
      });
    });

    it('should parse ellipse with radii and position', () => {
      expect(processClipPath('ellipse(50px 25px at 100px 100px)')).toEqual({
        shape: {
          type: 'ellipse',
          rx: 50,
          ry: 25,
          cx: 100,
          cy: 100,
        },
      });
    });

    it('should parse ellipse with percentage position', () => {
      expect(processClipPath('ellipse(50px 25px at 10% 20%)')).toEqual({
        shape: {
          type: 'ellipse',
          rx: 50,
          ry: 25,
          cx: '10%',
          cy: '20%',
        },
      });
    });

    it('should parse empty ellipse', () => {
      expect(processClipPath('ellipse()')).toEqual({
        shape: {
          type: 'ellipse',
        },
      });
    });
  });

  describe('polygon() function', () => {
    it('should parse polygon with points', () => {
      expect(processClipPath('polygon(0 0, 100px 0, 50px 100px)')).toEqual({
        shape: {
          type: 'polygon',
          points: [
            {x: 0, y: 0},
            {x: 100, y: 0},
            {x: 50, y: 100},
          ],
        },
      });
    });

    it('should parse polygon with fill-rule', () => {
      expect(
        processClipPath('polygon(evenodd, 0 0, 100px 0, 50px 100px)'),
      ).toEqual({
        shape: {
          type: 'polygon',
          fillRule: 'evenodd',
          points: [
            {x: 0, y: 0},
            {x: 100, y: 0},
            {x: 50, y: 100},
          ],
        },
      });
    });

    it('should parse polygon with percentages', () => {
      expect(processClipPath('polygon(0% 0%, 100% 0%, 50% 100%)')).toEqual({
        shape: {
          type: 'polygon',
          points: [
            {x: '0%', y: '0%'},
            {x: '100%', y: '0%'},
            {x: '50%', y: '100%'},
          ],
        },
      });
    });
  });

  describe('rect() function', () => {
    it('should parse rect', () => {
      expect(processClipPath('rect(10px 20px 30px 40px)')).toEqual({
        shape: {
          type: 'rect',
          top: 10,
          right: 20,
          bottom: 30,
          left: 40,
        },
      });
    });

    it('should parse rect with border-radius', () => {
      expect(processClipPath('rect(10px 20px 30px 40px round 5px)')).toEqual({
        shape: {
          type: 'rect',
          top: 10,
          right: 20,
          bottom: 30,
          left: 40,
          borderRadius: 5,
        },
      });
    });

    it('should parse rect with auto keyword - all auto', () => {
      expect(processClipPath('rect(auto auto auto auto)')).toEqual({
        shape: {
          type: 'rect',
          top: '0%',
          right: '100%',
          bottom: '100%',
          left: '0%',
        },
      });
    });

    it('should parse rect with auto keyword - mixed values', () => {
      expect(processClipPath('rect(auto 10px 50% auto)')).toEqual({
        shape: {
          type: 'rect',
          top: '0%',
          right: 10,
          bottom: '50%',
          left: '0%',
        },
      });
    });

    it('should parse rect with auto keyword and border-radius', () => {
      expect(processClipPath('rect(auto auto auto auto round 5px)')).toEqual({
        shape: {
          type: 'rect',
          top: '0%',
          right: '100%',
          bottom: '100%',
          left: '0%',
          borderRadius: 5,
        },
      });
    });
  });

  describe('xywh() function', () => {
    it('should parse xywh', () => {
      expect(processClipPath('xywh(10px 20px 100px 50px)')).toEqual({
        shape: {
          type: 'xywh',
          x: 10,
          y: 20,
          width: 100,
          height: 50,
        },
      });
    });

    it('should parse xywh with border-radius', () => {
      expect(processClipPath('xywh(10px 20px 100px 50px round 5px)')).toEqual({
        shape: {
          type: 'xywh',
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          borderRadius: 5,
        },
      });
    });
  });

  describe('geometry box with basic shape', () => {
    it('should parse geometry box before shape', () => {
      expect(processClipPath('border-box circle(50px)')).toEqual({
        shape: {
          type: 'circle',
          r: 50,
        },
        geometryBox: 'border-box',
      });
    });

    it('should parse geometry box after shape', () => {
      expect(processClipPath('circle(50px) border-box')).toEqual({
        shape: {
          type: 'circle',
          r: 50,
        },
        geometryBox: 'border-box',
      });
    });
  });

  describe('object input', () => {
    it('should process inset shape object', () => {
      expect(
        processClipPath({
          shape: {
            type: 'inset',
            top: '10px',
            right: '20px',
            bottom: '30px',
            left: '40px',
          },
        }),
      ).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          right: 20,
          bottom: 30,
          left: 40,
        },
      });
    });

    it('should process circle shape object', () => {
      expect(
        processClipPath({
          shape: {
            type: 'circle',
            r: 50,
            cx: '50%',
            cy: '50%',
          },
        }),
      ).toEqual({
        shape: {
          type: 'circle',
          r: 50,
          cx: '50%',
          cy: '50%',
        },
      });
    });

    it('should process geometry box', () => {
      expect(
        processClipPath({
          geometryBox: 'padding-box',
        }),
      ).toEqual({
        geometryBox: 'padding-box',
      });
    });

    it('should process shape with geometry box', () => {
      expect(
        processClipPath({
          shape: {
            type: 'circle',
            r: 50,
          },
          geometryBox: 'border-box',
        }),
      ).toEqual({
        shape: {
          type: 'circle',
          r: 50,
        },
        geometryBox: 'border-box',
      });
    });

    it('should process rect shape with auto keyword - all auto', () => {
      expect(
        processClipPath({
          shape: {
            type: 'rect',
            top: 'auto',
            right: 'auto',
            bottom: 'auto',
            left: 'auto',
          },
        }),
      ).toEqual({
        shape: {
          type: 'rect',
          top: '0%',
          right: '100%',
          bottom: '100%',
          left: '0%',
        },
      });
    });

    it('should process rect shape with auto keyword - mixed values', () => {
      expect(
        processClipPath({
          shape: {
            type: 'rect',
            top: 'auto',
            right: 10,
            bottom: '50%',
            left: 'auto',
          },
        }),
      ).toEqual({
        shape: {
          type: 'rect',
          top: '0%',
          right: 10,
          bottom: '50%',
          left: '0%',
        },
      });
    });
  });

  describe('case-insensitive parsing', () => {
    it('should parse case-insensitive inset', () => {
      expect(processClipPath('InSeT(10Px)')).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
        },
      });
    });

    it('should parse case-insensitive circle', () => {
      expect(processClipPath('CiRcLe(50Px)')).toEqual({
        shape: {
          type: 'circle',
          r: 50,
        },
      });
    });

    it('should parse case-insensitive geometry box', () => {
      expect(processClipPath('BoRdEr-BoX')).toEqual({
        geometryBox: 'border-box',
      });
    });
  });

  describe('whitespace handling', () => {
    it('should handle extra whitespace in inset', () => {
      expect(processClipPath('  inset(  10px   20px   )  ')).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          bottom: 10,
          right: 20,
          left: 20,
        },
      });
    });

    it('should handle newlines in input', () => {
      expect(processClipPath('inset(10px\n20px)')).toEqual({
        shape: {
          type: 'inset',
          top: 10,
          bottom: 10,
          right: 20,
          left: 20,
        },
      });
    });
  });

  describe('invalid values', () => {
    it('should return null for null', () => {
      expect(processClipPath(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(processClipPath(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(processClipPath('')).toBeNull();
    });

    it('should return null for invalid string', () => {
      expect(processClipPath('invalid')).toBeNull();
    });

    it('should return null for invalid function', () => {
      expect(processClipPath('unknown(10px)')).toBeNull();
    });

    it('should return null for inset with invalid values', () => {
      expect(processClipPath('inset(invalid)')).toBeNull();
    });

    it('should return null for inset with too many values', () => {
      expect(processClipPath('inset(10px 20px 30px 40px 50px)')).toBeNull();
    });

    it('should return null for circle with invalid radius', () => {
      expect(processClipPath('circle(invalid)')).toBeNull();
    });

    it('should return null for ellipse with invalid radii', () => {
      expect(processClipPath('ellipse(invalid)')).toBeNull();
    });

    it('should return null for polygon with invalid points', () => {
      expect(processClipPath('polygon(0)')).toBeNull();
    });

    it('should return null for polygon with too few points', () => {
      expect(processClipPath('polygon(0px 0px)')).toBeNull();
    });

    it('should return null for rect with invalid values', () => {
      expect(processClipPath('rect(invalid)')).toBeNull();
    });

    it('should return null for rect with wrong number of values', () => {
      expect(processClipPath('rect(10px 20px)')).toBeNull();
    });

    it('should return null for xywh with invalid values', () => {
      expect(processClipPath('xywh(invalid)')).toBeNull();
    });

    it('should return null for xywh with wrong number of values', () => {
      expect(processClipPath('xywh(10px 20px)')).toBeNull();
    });
  });
});
