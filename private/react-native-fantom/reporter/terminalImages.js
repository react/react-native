/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {getPngDimensions} from '../runner/screenshots/pngUtils';

export type ImageProtocol = 'iterm2' | 'kitty';
export type TerminalEnvironment = {[string]: string | void};

export function getImageProtocol(
  isTTY: ?boolean,
  env: TerminalEnvironment,
  supportsVSCodeImages: boolean = false,
): ?ImageProtocol {
  if (
    isTTY !== true ||
    (env.CI != null && env.CI !== '' && env.CI !== 'false' && env.CI !== '0')
  ) {
    return null;
  }
  if (env.TMUX != null || env.STY != null) {
    return null;
  }
  if (env.TERM_PROGRAM === 'vscode') {
    return supportsVSCodeImages ? 'iterm2' : null;
  }
  if (env.TERM === 'xterm-kitty' || env.KITTY_WINDOW_ID != null) {
    return 'kitty';
  }
  if (
    env.TERM_PROGRAM === 'iTerm.app' ||
    env.TERM_PROGRAM === 'WezTerm' ||
    env.LC_TERMINAL === 'iTerm2'
  ) {
    return 'iterm2';
  }
  return null;
}

export type TerminalImage = Readonly<{sequence: string, columns: number}>;

export function encodeTerminalImage(
  png: Buffer,
  protocol: ImageProtocol,
  options: Readonly<{columns: number, rows: number, tmux: boolean}>,
): ?TerminalImage {
  const dimensions = getPngDimensions(png);
  if (dimensions == null) {
    return null;
  }
  const {width, height} = dimensions;
  const maxColumns = Math.max(1, Math.min(options.columns, 80));
  const maxRows = Math.max(1, Math.min(options.rows, 24));
  const scale = Math.min(1, (maxColumns * 8) / width, (maxRows * 16) / height);
  const imageColumns = Math.ceil((width * scale) / 8);
  const data = png.toString('base64');
  const wrap = (sequence: string): string =>
    options.tmux
      ? '\x1bPtmux;' + sequence.replaceAll('\x1b', '\x1b\x1b') + '\x1b\\'
      : sequence;
  if (protocol === 'iterm2') {
    return {
      columns: imageColumns,
      sequence: wrap(
        `\x1b]1337;File=inline=1;size=${png.length};width=${imageColumns};height=auto;preserveAspectRatio=1:${data}\x07`,
      ),
    };
  }
  let output = '';
  for (let offset = 0; offset < data.length; offset += 4096) {
    const chunk = data.slice(offset, offset + 4096);
    const parameters =
      offset === 0 ? `a=T,f=100,t=d,q=2,c=${imageColumns},` : '';
    output += wrap(
      `\x1b_G${parameters}m=${offset + 4096 < data.length ? 1 : 0};${chunk}\x1b\\`,
    );
  }
  return {sequence: output, columns: imageColumns};
}
