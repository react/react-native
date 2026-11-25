/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {createAndConnectTarget} from './InspectorProtocolUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {baseUrlForServer, createServer} from './ServerUtils';
import until from 'wait-for-expect';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

describe('inspector proxy device message middleware', () => {
  const autoCleanup = withAbortSignalForEachTest();
  const page = {
    id: 'page1',
    app: 'bar-app',
    title: 'bar-title',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('middleware is created with device, debugger, and page information', async () => {
    const createCustomMessageHandler = jest.fn().mockImplementation(() => null);
    const {server} = await createServer({
      logger: undefined,
      unstable_customInspectorMessageHandler: createCustomMessageHandler,
    });

    let device, debugger_;
    try {
      ({device, debugger_} = await createAndConnectTarget(
        serverRefUrls(server),
        autoCleanup.signal,
        page,
      ));

      // Ensure the middleware was created with the device information
      await until(() =>
        expect(createCustomMessageHandler).toBeCalledWith(
          expect.objectContaining({
            page: expect.objectContaining({
              ...page,
              capabilities: expect.any(Object),
            }),
            device: expect.objectContaining({
              appId: expect.any(String),
              id: expect.any(String),
              name: expect.any(String),
              sendMessage: expect.any(Function),
            }),
            debugger: expect.objectContaining({
              userAgent: null,
              sendMessage: expect.any(Function),
            }),
          }),
        ),
      );
    } finally {
      device?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });

  test('send message functions are passing messages to sockets', async () => {
    const handleDebuggerMessage = jest.fn();
    const handleDeviceMessage = jest.fn();
    const createCustomMessageHandler = jest.fn().mockImplementation(() => ({
      handleDebuggerMessage,
      handleDeviceMessage,
    }));

    const {server} = await createServer({
      logger: undefined,
      unstable_customInspectorMessageHandler: createCustomMessageHandler,
    });

    let device, debugger_;
    try {
      ({device, debugger_} = await createAndConnectTarget(
        serverRefUrls(server),
        autoCleanup.signal,
        page,
      ));

      // Ensure the middleware was created with the send message methods
      await until(() =>
        expect(createCustomMessageHandler).toBeCalledWith(
          expect.objectContaining({
            device: expect.objectContaining({
              sendMessage: expect.any(Function),
            }),
            debugger: expect.objectContaining({
              sendMessage: expect.any(Function),
            }),
          }),
        ),
      );

      // Send a message to the device
      createCustomMessageHandler.mock.calls[0][0].device.sendMessage({
        id: 1,
      });
      // Ensure the device received the message
      await until(() =>
        expect(device.wrappedEvent).toBeCalledWith({
          event: 'wrappedEvent',
          payload: {
            pageId: page.id,
            sessionId: expect.any(String),
            wrappedEvent: JSON.stringify({id: 1}),
          },
        }),
      );

      // Send a message to the debugger
      createCustomMessageHandler.mock.calls[0][0].debugger.sendMessage({
        id: 2,
      });
      // Ensure the debugger received the message
      await until(() =>
        expect(debugger_.handle).toBeCalledWith({
          id: 2,
        }),
      );
    } finally {
      device?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });

  test('device message is passed to message middleware', async () => {
    const handleDeviceMessage = jest.fn();
    const {server} = await createServer({
      logger: undefined,
      unstable_customInspectorMessageHandler: () => ({
        handleDeviceMessage,
        handleDebuggerMessage() {},
      }),
    });

    let device, debugger_;
    try {
      ({device, debugger_} = await createAndConnectTarget(
        serverRefUrls(server),
        autoCleanup.signal,
        page,
      ));

      // Send a message from the device, and ensure the middleware received it
      device.sendWrappedEvent(page.id, {id: 1337});

      // Ensure the debugger received the message
      await until(() => expect(debugger_.handle).toBeCalledWith({id: 1337}));
      // Ensure the middleware received the message
      await until(() => expect(handleDeviceMessage).toBeCalled());
    } finally {
      device?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });

  test('device message stops propagating when handled by middleware', async () => {
    const handleDeviceMessage = jest.fn();
    const {server} = await createServer({
      logger: undefined,
      unstable_customInspectorMessageHandler: () => ({
        handleDeviceMessage,
        handleDebuggerMessage() {},
      }),
    });

    let device, debugger_;
    try {
      ({device, debugger_} = await createAndConnectTarget(
        serverRefUrls(server),
        autoCleanup.signal,
        page,
      ));

      // Stop the first message from propagating by returning true (once) from middleware
      handleDeviceMessage.mockReturnValueOnce(true);

      // Send the first message which should NOT be received by the debugger
      device.sendWrappedEvent(page.id, {id: -1});
      await until(() => expect(handleDeviceMessage).toBeCalled());

      // Send the second message which should be received by the debugger
      device.sendWrappedEvent(page.id, {id: 1337});

      // Ensure only the last message was received by the debugger
      await until(() => expect(debugger_.handle).toBeCalledWith({id: 1337}));
      // Ensure the first message was not received by the debugger
      expect(debugger_.handle).not.toBeCalledWith({id: -1});
    } finally {
      device?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });

  test('debugger message is passed to message middleware', async () => {
    const handleDebuggerMessage = jest.fn();
    const {server} = await createServer({
      logger: undefined,
      unstable_customInspectorMessageHandler: () => ({
        handleDeviceMessage() {},
        handleDebuggerMessage,
      }),
    });

    let device, debugger_;
    try {
      ({device, debugger_} = await createAndConnectTarget(
        serverRefUrls(server),
        autoCleanup.signal,
        page,
      ));

      // Send a message from the debugger
      const message = {
        method: 'Runtime.enable',
        id: 1337,
      };
      debugger_.send(message);

      // Ensure the device received the message
      await until(() => expect(device.wrappedEvent).toBeCalled());
      // Ensure the middleware received the message
      await until(() => expect(handleDebuggerMessage).toBeCalledWith(message));
    } finally {
      device?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });

  test('debugger message stops propagating when handled by middleware', async () => {
    const handleDebuggerMessage = jest.fn();
    const {server} = await createServer({
      logger: undefined,
      unstable_customInspectorMessageHandler: () => ({
        handleDeviceMessage() {},
        handleDebuggerMessage,
      }),
    });

    let device, debugger_;
    try {
      ({device, debugger_} = await createAndConnectTarget(
        serverRefUrls(server),
        autoCleanup.signal,
        page,
      ));

      // Stop the first message from propagating by returning true (once) from middleware
      handleDebuggerMessage.mockReturnValueOnce(true);

      // Send the first emssage which should not be received by the device
      debugger_.send({id: -1});
      // Send the second message which should be received by the device
      debugger_.send({id: 1337});

      // Ensure only the last message was received by the device
      await until(() =>
        expect(device.wrappedEvent).toBeCalledWith({
          event: 'wrappedEvent',
          payload: {
            pageId: page.id,
            sessionId: expect.any(String),
            wrappedEvent: JSON.stringify({id: 1337}),
          },
        }),
      );
      // Ensure the first message was not received by the device
      expect(device.wrappedEvent).not.toBeCalledWith({id: -1});
    } finally {
      device?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });
});

function serverRefUrls(server: http$Server | https$Server) {
  return {
    serverBaseUrl: baseUrlForServer(server, 'http'),
    serverBaseWsUrl: baseUrlForServer(server, 'ws'),
  };
}

async function closeServer(server: http$Server | https$Server): Promise<void> {
  return new Promise(resolve => server.close(() => resolve()));
}
