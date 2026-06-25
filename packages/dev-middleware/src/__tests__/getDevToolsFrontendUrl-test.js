/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import getDevToolsFrontendUrl from '../utils/getDevToolsFrontendUrl';

describe('getDevToolsFrontendUrl', () => {
  const webSocketDebuggerUrl =
    'ws://localhost:8081/inspector/debug?device=1a9372c&page=-1';
  const devServerUrl = new URL('http://localhost:8081');

  const experiments = {
    enableNetworkInspector: false,
    enableOpenDebuggerRedirect: false,
    enableStandaloneFuseboxShell: false,
  };

  describe('relative: false, launchId: undefined, telemetryInfo: undefined, (default)', () => {
    test('should return a valid url for all experiments off', async () => {
      const actual = getDevToolsFrontendUrl(
        experiments,
        webSocketDebuggerUrl,
        devServerUrl,
      );
      const url = new URL(actual);
      expect(url.host).toBe('localhost:8081');
      expect(url.pathname).toBe('/debugger-frontend/rn_fusebox.html');
      expect(url.searchParams.get('ws')).toBe(
        '/inspector/debug?device=1a9372c&page=-1',
      );
    });

    test('should return a valid url for enableNetworkInspector experiment on', async () => {
      const actual = getDevToolsFrontendUrl(
        {...experiments, enableNetworkInspector: true},
        webSocketDebuggerUrl,
        devServerUrl,
      );
      const url = new URL(actual);
      expect(url.host).toBe('localhost:8081');
      expect(url.pathname).toBe('/debugger-frontend/rn_fusebox.html');
      expect(url.searchParams.get('unstable_enableNetworkPanel')).toBe('true');
      expect(url.searchParams.get('ws')).toBe(
        '/inspector/debug?device=1a9372c&page=-1',
      );
    });

    test('should return a full WS URL if on a different host than the dev server', () => {
      const otherWebSocketDebuggerUrl =
        'ws://localhost:9000/inspector/debug?device=1a9372c&page=-1';
      const actual = getDevToolsFrontendUrl(
        experiments,
        otherWebSocketDebuggerUrl,
        devServerUrl,
      );
      const url = new URL(actual);
      expect(url.searchParams.get('ws')).toBe(
        'localhost:9000/inspector/debug?device=1a9372c&page=-1',
      );
    });
  });

  describe('relative: true', () => {
    function assertValidRelativeURL(relativeURL: string): URL {
      const anyBaseURL = new URL('https://www.example.com');
      try {
        // By definition, a valid relative URL must be valid when combined with any base URL
        return new URL(relativeURL, anyBaseURL);
      } catch (e) {
        throw new Error(`Relative URL is invalid: ${relativeURL}`, {cause: e});
      }
    }

    test('should return a valid url for all experiments off', async () => {
      const actual = getDevToolsFrontendUrl(
        experiments,
        webSocketDebuggerUrl,
        devServerUrl,
        {
          relative: true,
        },
      );
      const url = assertValidRelativeURL(actual);
      expect(url.pathname).toBe('/debugger-frontend/rn_fusebox.html');
      expect(url.searchParams.get('ws')).toBe(
        '/inspector/debug?device=1a9372c&page=-1',
      );
    });

    test('should return a valid url for enableNetworkInspector experiment on', async () => {
      const actual = getDevToolsFrontendUrl(
        {...experiments, enableNetworkInspector: true},
        webSocketDebuggerUrl,
        devServerUrl,
        {
          relative: true,
        },
      );
      const url = assertValidRelativeURL(actual);
      expect(url.pathname).toBe('/debugger-frontend/rn_fusebox.html');
      expect(url.searchParams.get('unstable_enableNetworkPanel')).toBe('true');
      expect(url.searchParams.get('ws')).toBe(
        '/inspector/debug?device=1a9372c&page=-1',
      );
    });

    test('should return a full WS URL if on a different host than the dev server', () => {
      const otherWebSocketDebuggerUrl =
        'ws://localhost:8082/inspector/debug?device=1a9372c&page=-1';
      const actual = getDevToolsFrontendUrl(
        experiments,
        otherWebSocketDebuggerUrl,
        devServerUrl,
        {
          relative: true,
        },
      );
      const url = assertValidRelativeURL(actual);
      expect(url.searchParams.get('ws')).toBe(
        'localhost:8082/inspector/debug?device=1a9372c&page=-1',
      );
    });
  });

  describe('non-null launchId and telemetryInfo', () => {
    const launchId = 'dG8gdGhlIG1vb24h%21';

    const telemetryInfo = JSON.stringify({
      username: 'testuser123',
      reactTechnologiesDeveloper: true,
    });

    test('should return a valid url for all experiments off', async () => {
      const actual = getDevToolsFrontendUrl(
        experiments,
        webSocketDebuggerUrl,
        devServerUrl,
        {
          launchId,
          telemetryInfo,
        },
      );
      const url = new URL(actual);
      expect(url.pathname).toBe('/debugger-frontend/rn_fusebox.html');
      expect(url.searchParams.get('ws')).toBe(
        '/inspector/debug?device=1a9372c&page=-1',
      );
      expect(url.searchParams.get('launchId')).toBe(launchId);
      expect(JSON.parse(url.searchParams.get('telemetryInfo') || '{}')).toEqual(
        JSON.parse(telemetryInfo),
      );
    });

    test('should return a valid url for enableNetworkInspector experiment on', async () => {
      const actual = getDevToolsFrontendUrl(
        {...experiments, enableNetworkInspector: true},
        webSocketDebuggerUrl,
        devServerUrl,
        {
          launchId,
          telemetryInfo,
        },
      );
      const url = new URL(actual);
      expect(url.pathname).toBe('/debugger-frontend/rn_fusebox.html');
      expect(url.searchParams.get('unstable_enableNetworkPanel')).toBe('true');
      expect(url.searchParams.get('ws')).toBe(
        '/inspector/debug?device=1a9372c&page=-1',
      );
      expect(url.searchParams.get('launchId')).toBe(launchId);
      expect(JSON.parse(url.searchParams.get('telemetryInfo') || '{}')).toEqual(
        JSON.parse(telemetryInfo),
      );
    });

    test('should return a full WS URL if on a different host than the dev server', () => {
      const otherWebSocketDebuggerUrl =
        'ws://localhost:8082/inspector/debug?device=1a9372c&page=-1';
      const actual = getDevToolsFrontendUrl(
        experiments,
        otherWebSocketDebuggerUrl,
        devServerUrl,
        {
          launchId,
          telemetryInfo,
        },
      );
      const url = new URL(actual);
      expect(url.searchParams.get('ws')).toBe(
        'localhost:8082/inspector/debug?device=1a9372c&page=-1',
      );
      expect(url.searchParams.get('launchId')).toBe(launchId);
      expect(JSON.parse(url.searchParams.get('telemetryInfo') || '{}')).toEqual(
        JSON.parse(telemetryInfo),
      );
    });
  });
});
