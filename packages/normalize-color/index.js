/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

/* eslint no-bitwise: 0 */

'use strict';

const cachedColors = new Map();

function normalizeColor(color) {
  if (typeof color === 'number') {
    if (color >>> 0 === color && color >= 0 && color <= 0xffffffff) {
      return color;
    }
    return null;
  }

  if (typeof color !== 'string') {
    return null;
  }

  if (cachedColors.has(color)) {
    // Map iteration order follows insertion order, so re-inserting on every
    // hit keeps the least-recently-used entry first.
    const cachedColor = cachedColors.get(color);
    cachedColors.delete(color);
    cachedColors.set(color, cachedColor);
    return cachedColor;
  }
  const normalizedColor = parseColorString(color);
  if (cachedColors.size >= 1024) {
    cachedColors.delete(cachedColors.keys().next().value);
  }
  cachedColors.set(color, normalizedColor);
  return normalizedColor;
}

function parseColorString(color) {
  const matchers = getMatchers();
  let match;

  // Ordered based on occurrences on Facebook codebase
  if ((match = matchers.hex6.exec(color))) {
    return parseInt(match[1] + 'ff', 16) >>> 0;
  }

  const colorFromKeyword = normalizeKeyword(color);
  if (colorFromKeyword != null) {
    return colorFromKeyword;
  }

  if ((match = matchers.rgba.exec(color) || matchers.rgb.exec(color))) {
    // rgb(R G B / A) / rgba(R G B / A) notation
    if (match[9] !== undefined) {
      return (
        ((parse255(match[9]) << 24) | // r
          (parse255(match[10]) << 16) | // g
          (parse255(match[11]) << 8) | // b
          parse1(match[12])) >>> // a
        0
      );
    }
    // rgb(R, G, B, A) / rgba(R, G, B, A) notation
    else if (match[5] !== undefined) {
      return (
        ((parse255(match[5]) << 24) | // r
          (parse255(match[6]) << 16) | // g
          (parse255(match[7]) << 8) | // b
          parse1(match[8])) >>> // a
        0
      );
    }
    // rgb(R, G, B) / rgba(R, G, B) notation
    return (
      ((parse255(match[2]) << 24) | // r
        (parse255(match[3]) << 16) | // g
        (parse255(match[4]) << 8) | // b
        0x000000ff) >>> // a
      0
    );
  }

  if ((match = matchers.hex3.exec(color))) {
    return (
      parseInt(
        match[1] +
          match[1] + // r
          match[2] +
          match[2] + // g
          match[3] +
          match[3] + // b
          'ff', // a
        16,
      ) >>> 0
    );
  }

  // https://drafts.csswg.org/css-color-4/#hex-notation
  if ((match = matchers.hex8.exec(color))) {
    return parseInt(match[1], 16) >>> 0;
  }

  if ((match = matchers.hex4.exec(color))) {
    return (
      parseInt(
        match[1] +
          match[1] + // r
          match[2] +
          match[2] + // g
          match[3] +
          match[3] + // b
          match[4] +
          match[4], // a
        16,
      ) >>> 0
    );
  }

  if ((match = matchers.hsl.exec(color))) {
    return (
      (hslToRgb(
        parse360(match[1]), // h
        parsePercentage(match[2]), // s
        parsePercentage(match[3]), // l
      ) |
        0x000000ff) >>> // a
      0
    );
  }

  if ((match = matchers.hsla.exec(color))) {
    // hsla(H S L / A) notation
    if (match[6] !== undefined) {
      return (
        (hslToRgb(
          parse360(match[6]), // h
          parsePercentage(match[7]), // s
          parsePercentage(match[8]), // l
        ) |
          parse1(match[9])) >>> // a
        0
      );
    }

    // hsla(H, S, L, A) notation
    return (
      (hslToRgb(
        parse360(match[2]), // h
        parsePercentage(match[3]), // s
        parsePercentage(match[4]), // l
      ) |
        parse1(match[5])) >>> // a
      0
    );
  }

  if ((match = matchers.hwb.exec(color))) {
    if (match[5] !== undefined) {
      // hwb(H W B / A) notation
      return (
        (hwbToRgb(
          parse360(match[5]), // h
          parsePercentage(match[6]), // w
          parsePercentage(match[7]), // b
        ) |
          parse1(match[8])) >>> // a
        0
      );
    }
    // hwb(H W B) notation
    return (
      (hwbToRgb(
        parse360(match[2]), // h
        parsePercentage(match[3]), // w
        parsePercentage(match[4]), // b
      ) |
        0x000000ff) >>> // a
      0
    );
  }

  return null;
}

function hue2rgb(p, q, t) {
  if (t < 0) {
    t += 1;
  }
  if (t > 1) {
    t -= 1;
  }
  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }
  if (t < 1 / 2) {
    return q;
  }
  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }
  return p;
}

function hslToRgb(h, s, l) {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return (
    (Math.round(r * 255) << 24) |
    (Math.round(g * 255) << 16) |
    (Math.round(b * 255) << 8)
  );
}

function hwbToRgb(h, w, b) {
  if (w + b >= 1) {
    const gray = Math.round((w * 255) / (w + b));

    return (gray << 24) | (gray << 16) | (gray << 8);
  }

  const red = hue2rgb(0, 1, h + 1 / 3) * (1 - w - b) + w;
  const green = hue2rgb(0, 1, h) * (1 - w - b) + w;
  const blue = hue2rgb(0, 1, h - 1 / 3) * (1 - w - b) + w;

  return (
    (Math.round(red * 255) << 24) |
    (Math.round(green * 255) << 16) |
    (Math.round(blue * 255) << 8)
  );
}

const NUMBER = '[-+]?\\d*\\.?\\d+';
const PERCENTAGE = NUMBER + '%';

function call(...args) {
  return '\\(\\s*(' + args.join(')\\s*,?\\s*(') + ')\\s*\\)';
}

function callModern(...args) {
  return '\\(\\s*(' + args.join(')\\s*(') + ')\\s*\\)';
}

function callWithSlashSeparator(...args) {
  return (
    '\\(\\s*(' +
    args.slice(0, args.length - 1).join(')\\s*,?\\s*(') +
    ')\\s*/\\s*(' +
    args[args.length - 1] +
    ')\\s*\\)'
  );
}

function commaSeparatedCall(...args) {
  return '\\(\\s*(' + args.join(')\\s*,\\s*(') + ')\\s*\\)';
}

let cachedMatchers;

function getMatchers() {
  if (cachedMatchers === undefined) {
    const rgbRegexPattern =
      call(NUMBER, NUMBER, NUMBER) +
      '|' +
      commaSeparatedCall(NUMBER, NUMBER, NUMBER, NUMBER) +
      '|' +
      callWithSlashSeparator(NUMBER, NUMBER, NUMBER, NUMBER);

    cachedMatchers = {
      rgb: new RegExp('rgb(' + rgbRegexPattern + ')'),
      rgba: new RegExp('rgba(' + rgbRegexPattern + ')'),
      hsl: new RegExp('hsl' + call(NUMBER, PERCENTAGE, PERCENTAGE)),
      hsla: new RegExp(
        'hsla(' +
          commaSeparatedCall(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER) +
          '|' +
          callWithSlashSeparator(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER) +
          ')',
      ),
      hwb: new RegExp(
        'hwb(' +
          callModern(NUMBER, PERCENTAGE, PERCENTAGE) +
          '|' +
          callWithSlashSeparator(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER) +
          ')',
      ),
      hex3: /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
      hex4: /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
      hex6: /^#([0-9a-fA-F]{6})$/,
      hex8: /^#([0-9a-fA-F]{8})$/,
    };
  }
  return cachedMatchers;
}

function parse255(str) {
  const int = parseInt(str, 10);
  if (int < 0) {
    return 0;
  }
  if (int > 255) {
    return 255;
  }
  return int;
}

function parse360(str) {
  const int = parseFloat(str);
  return (((int % 360) + 360) % 360) / 360;
}

function parse1(str) {
  const num = parseFloat(str);
  if (num < 0) {
    return 0;
  }
  if (num > 1) {
    return 255;
  }
  return Math.round(num * 255);
}

function parsePercentage(str) {
  // parseFloat conveniently ignores the final %
  const int = parseFloat(str);
  if (int < 0) {
    return 0;
  }
  if (int > 100) {
    return 1;
  }
  return int / 100;
}

function normalizeKeyword(name) {
  // prettier-ignore
  switch (name) {
    case 'transparent': return 0x00000000;
    // http://www.w3.org/TR/css3-color/#svg-color
    case 'aliceblue': return 0xf0f8ffff;
    case 'antiquewhite': return 0xfaebd7ff;
    case 'aqua': return 0x00ffffff;
    case 'aquamarine': return 0x7fffd4ff;
    case 'azure': return 0xf0ffffff;
    case 'beige': return 0xf5f5dcff;
    case 'bisque': return 0xffe4c4ff;
    case 'black': return 0x000000ff;
    case 'blanchedalmond': return 0xffebcdff;
    case 'blue': return 0x0000ffff;
    case 'blueviolet': return 0x8a2be2ff;
    case 'brown': return 0xa52a2aff;
    case 'burlywood': return 0xdeb887ff;
    case 'burntsienna': return 0xea7e5dff;
    case 'cadetblue': return 0x5f9ea0ff;
    case 'chartreuse': return 0x7fff00ff;
    case 'chocolate': return 0xd2691eff;
    case 'coral': return 0xff7f50ff;
    case 'cornflowerblue': return 0x6495edff;
    case 'cornsilk': return 0xfff8dcff;
    case 'crimson': return 0xdc143cff;
    case 'cyan': return 0x00ffffff;
    case 'darkblue': return 0x00008bff;
    case 'darkcyan': return 0x008b8bff;
    case 'darkgoldenrod': return 0xb8860bff;
    case 'darkgray': return 0xa9a9a9ff;
    case 'darkgreen': return 0x006400ff;
    case 'darkgrey': return 0xa9a9a9ff;
    case 'darkkhaki': return 0xbdb76bff;
    case 'darkmagenta': return 0x8b008bff;
    case 'darkolivegreen': return 0x556b2fff;
    case 'darkorange': return 0xff8c00ff;
    case 'darkorchid': return 0x9932ccff;
    case 'darkred': return 0x8b0000ff;
    case 'darksalmon': return 0xe9967aff;
    case 'darkseagreen': return 0x8fbc8fff;
    case 'darkslateblue': return 0x483d8bff;
    case 'darkslategray': return 0x2f4f4fff;
    case 'darkslategrey': return 0x2f4f4fff;
    case 'darkturquoise': return 0x00ced1ff;
    case 'darkviolet': return 0x9400d3ff;
    case 'deeppink': return 0xff1493ff;
    case 'deepskyblue': return 0x00bfffff;
    case 'dimgray': return 0x696969ff;
    case 'dimgrey': return 0x696969ff;
    case 'dodgerblue': return 0x1e90ffff;
    case 'firebrick': return 0xb22222ff;
    case 'floralwhite': return 0xfffaf0ff;
    case 'forestgreen': return 0x228b22ff;
    case 'fuchsia': return 0xff00ffff;
    case 'gainsboro': return 0xdcdcdcff;
    case 'ghostwhite': return 0xf8f8ffff;
    case 'gold': return 0xffd700ff;
    case 'goldenrod': return 0xdaa520ff;
    case 'gray': return 0x808080ff;
    case 'green': return 0x008000ff;
    case 'greenyellow': return 0xadff2fff;
    case 'grey': return 0x808080ff;
    case 'honeydew': return 0xf0fff0ff;
    case 'hotpink': return 0xff69b4ff;
    case 'indianred': return 0xcd5c5cff;
    case 'indigo': return 0x4b0082ff;
    case 'ivory': return 0xfffff0ff;
    case 'khaki': return 0xf0e68cff;
    case 'lavender': return 0xe6e6faff;
    case 'lavenderblush': return 0xfff0f5ff;
    case 'lawngreen': return 0x7cfc00ff;
    case 'lemonchiffon': return 0xfffacdff;
    case 'lightblue': return 0xadd8e6ff;
    case 'lightcoral': return 0xf08080ff;
    case 'lightcyan': return 0xe0ffffff;
    case 'lightgoldenrodyellow': return 0xfafad2ff;
    case 'lightgray': return 0xd3d3d3ff;
    case 'lightgreen': return 0x90ee90ff;
    case 'lightgrey': return 0xd3d3d3ff;
    case 'lightpink': return 0xffb6c1ff;
    case 'lightsalmon': return 0xffa07aff;
    case 'lightseagreen': return 0x20b2aaff;
    case 'lightskyblue': return 0x87cefaff;
    case 'lightslategray': return 0x778899ff;
    case 'lightslategrey': return 0x778899ff;
    case 'lightsteelblue': return 0xb0c4deff;
    case 'lightyellow': return 0xffffe0ff;
    case 'lime': return 0x00ff00ff;
    case 'limegreen': return 0x32cd32ff;
    case 'linen': return 0xfaf0e6ff;
    case 'magenta': return 0xff00ffff;
    case 'maroon': return 0x800000ff;
    case 'mediumaquamarine': return 0x66cdaaff;
    case 'mediumblue': return 0x0000cdff;
    case 'mediumorchid': return 0xba55d3ff;
    case 'mediumpurple': return 0x9370dbff;
    case 'mediumseagreen': return 0x3cb371ff;
    case 'mediumslateblue': return 0x7b68eeff;
    case 'mediumspringgreen': return 0x00fa9aff;
    case 'mediumturquoise': return 0x48d1ccff;
    case 'mediumvioletred': return 0xc71585ff;
    case 'midnightblue': return 0x191970ff;
    case 'mintcream': return 0xf5fffaff;
    case 'mistyrose': return 0xffe4e1ff;
    case 'moccasin': return 0xffe4b5ff;
    case 'navajowhite': return 0xffdeadff;
    case 'navy': return 0x000080ff;
    case 'oldlace': return 0xfdf5e6ff;
    case 'olive': return 0x808000ff;
    case 'olivedrab': return 0x6b8e23ff;
    case 'orange': return 0xffa500ff;
    case 'orangered': return 0xff4500ff;
    case 'orchid': return 0xda70d6ff;
    case 'palegoldenrod': return 0xeee8aaff;
    case 'palegreen': return 0x98fb98ff;
    case 'paleturquoise': return 0xafeeeeff;
    case 'palevioletred': return 0xdb7093ff;
    case 'papayawhip': return 0xffefd5ff;
    case 'peachpuff': return 0xffdab9ff;
    case 'peru': return 0xcd853fff;
    case 'pink': return 0xffc0cbff;
    case 'plum': return 0xdda0ddff;
    case 'powderblue': return 0xb0e0e6ff;
    case 'purple': return 0x800080ff;
    case 'rebeccapurple': return 0x663399ff;
    case 'red': return 0xff0000ff;
    case 'rosybrown': return 0xbc8f8fff;
    case 'royalblue': return 0x4169e1ff;
    case 'saddlebrown': return 0x8b4513ff;
    case 'salmon': return 0xfa8072ff;
    case 'sandybrown': return 0xf4a460ff;
    case 'seagreen': return 0x2e8b57ff;
    case 'seashell': return 0xfff5eeff;
    case 'sienna': return 0xa0522dff;
    case 'silver': return 0xc0c0c0ff;
    case 'skyblue': return 0x87ceebff;
    case 'slateblue': return 0x6a5acdff;
    case 'slategray': return 0x708090ff;
    case 'slategrey': return 0x708090ff;
    case 'snow': return 0xfffafaff;
    case 'springgreen': return 0x00ff7fff;
    case 'steelblue': return 0x4682b4ff;
    case 'tan': return 0xd2b48cff;
    case 'teal': return 0x008080ff;
    case 'thistle': return 0xd8bfd8ff;
    case 'tomato': return 0xff6347ff;
    case 'turquoise': return 0x40e0d0ff;
    case 'violet': return 0xee82eeff;
    case 'wheat': return 0xf5deb3ff;
    case 'white': return 0xffffffff;
    case 'whitesmoke': return 0xf5f5f5ff;
    case 'yellow': return 0xffff00ff;
    case 'yellowgreen': return 0x9acd32ff;
  }
  return null;
}

module.exports = normalizeColor;
