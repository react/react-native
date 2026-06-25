/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {JSONSerializable} from '../inspector-proxy/types';
import type {HandleFunction} from 'connect';

import {createDevMiddleware} from '../';
import connect from 'connect';
import http from 'http';
import https from 'https';
import * as selfsigned from 'selfsigned';

type CreateDevMiddlewareOptions = Parameters<typeof createDevMiddleware>[0];
type CreateServerOptions = {
  ...Omit<CreateDevMiddlewareOptions, 'serverBaseUrl'>,
  secure?: boolean,
};
type ConnectApp = ReturnType<typeof connect>;

jest.mock('../utils/DefaultToolLauncher');

export function withServerForEachTest(options: CreateServerOptions): Readonly<{
  serverBaseUrl: string,
  serverBaseWsUrl: string,
  app: ConnectApp,
  port: number,
}> {
  const EAGER_ACCESS_ERROR_MESSAGE =
    'The return value of withServerForEachTest is lazily initialized and can only be accessed in tests.';
  const ref: {
    serverBaseUrl: string,
    serverBaseWsUrl: string,
    app: ConnectApp,
    port: number,
  } = {
    // $FlowFixMe[unsafe-getters-setters]
    get serverBaseUrl() {
      throw new Error(EAGER_ACCESS_ERROR_MESSAGE);
    },
    // $FlowFixMe[unsafe-getters-setters]
    get serverBaseWsUrl() {
      throw new Error(EAGER_ACCESS_ERROR_MESSAGE);
    },
    // $FlowFixMe[unsafe-getters-setters]
    get app() {
      throw new Error(EAGER_ACCESS_ERROR_MESSAGE);
    },
    // $FlowFixMe[unsafe-getters-setters]
    get port() {
      throw new Error(EAGER_ACCESS_ERROR_MESSAGE);
    },
  };
  let server: http$Server | https$Server;
  let app: ConnectApp;
  beforeEach(async () => {
    ({server, app} = await createServer(options));
    const serverBaseUrl = baseUrlForServer(
      server,
      (options.secure ?? false) ? 'https' : 'http',
    );
    const serverBaseWsUrl = baseUrlForServer(
      server,
      (options.secure ?? false) ? 'wss' : 'ws',
    );
    Object.defineProperty(ref, 'serverBaseUrl', {value: serverBaseUrl});
    Object.defineProperty(ref, 'serverBaseWsUrl', {value: serverBaseWsUrl});
    Object.defineProperty(ref, 'app', {value: app});
    Object.defineProperty(ref, 'port', {value: server.address().port});
  });
  afterEach(done => {
    server.close(() => done());
  });
  return ref;
}

export async function createServer(options: CreateServerOptions): Promise<{
  server: http$Server | https$Server,
  app: ReturnType<typeof connect>,
}> {
  const app = connect();
  const {secure = false, ...devMiddlewareOptions} = options;
  let httpServer;
  if (secure) {
    const {cert, private: key} = await selfsigned.generate(
      [{name: 'commonName', value: 'localhost'}],
      {days: 1},
    );
    httpServer = https.createServer(
      {cert, key},
      // $FlowFixMe[incompatible-type] The types for `connect` and `https` are subtly incompatible as written.
      app,
    );
  } else {
    httpServer = http.createServer(app);
  }

  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(() => {
      const {middleware, websocketEndpoints} = createDevMiddleware({
        ...devMiddlewareOptions,
        serverBaseUrl: baseUrlForServer(httpServer, secure ? 'https' : 'http'),
      });
      app.use(middleware);
      httpServer.on('upgrade', (request, socket, head) => {
        const {pathname} = new URL(request.url, 'http://example.com');
        if (pathname != null && websocketEndpoints[pathname]) {
          websocketEndpoints[pathname].handleUpgrade(
            request,
            socket,
            head,
            ws => {
              websocketEndpoints[pathname].emit('connection', ws, request);
            },
          );
        } else {
          socket.destroy();
        }
      });
      resolve({server: httpServer, app});
    });
  });
}

export function baseUrlForServer(
  server: http$Server | https$Server,
  scheme: string,
): string {
  const address = server.address();
  // Assumption: `server` is local and listening on `localhost`. We can't use
  // the IP address because HTTPS requires a hostname.
  return `${scheme}://localhost:${address.port}`;
}

export function serveStaticJson(json: JSONSerializable): HandleFunction {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(json));
  };
}

export function serveStaticText(text: string): HandleFunction {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(text);
  };
}
