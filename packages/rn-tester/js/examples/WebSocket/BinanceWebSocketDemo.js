/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {FlatList, Pressable, StyleSheet, View} from 'react-native';

const STREAM_URL = 'wss://stream.binance.com:9443/ws';
const MAX_LOG_ENTRIES = 30;

type TradeSymbol = 'btcusdt' | 'ethusdt' | 'solusdt';
type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed';
type FrameLogEntry = Readonly<{
  id: string,
  direction: 'sent' | 'received',
  time: string,
  summary: string,
}>;

const SYMBOLS: ReadonlyArray<TradeSymbol> = ['btcusdt', 'ethusdt', 'solusdt'];

const STATE_COLOR = {
  idle: '#999999',
  connecting: '#e6a700',
  open: '#2e7d32',
  closed: '#c62828',
};

function nowTime(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

component BinanceWebSocketDemo() {
  const [state, setState] = useState<ConnectionState>('idle');
  const [symbol, setSymbol] = useState<TradeSymbol>('btcusdt');
  const [price, setPrice] = useState<?string>(null);
  const [log, setLog] = useState<Array<FrameLogEntry>>([]);
  const wsRef = useRef<?WebSocket>(null);
  const idRef = useRef<number>(0);

  const appendLog = useCallback(
    (direction: 'sent' | 'received', summary: string) => {
      idRef.current += 1;
      const entry: FrameLogEntry = {
        id: String(idRef.current),
        direction,
        time: nowTime(),
        summary,
      };
      setLog(prev => [entry, ...prev].slice(0, MAX_LOG_ENTRIES));
    },
    [],
  );

  const send = useCallback(
    (method: 'SUBSCRIBE' | 'UNSUBSCRIBE', target: TradeSymbol) => {
      const ws = wsRef.current;
      if (ws == null || ws.readyState !== WebSocket.OPEN) {
        return;
      }
      idRef.current += 1;
      ws.send(
        JSON.stringify({
          method,
          params: [`${target}@trade`],
          id: idRef.current,
        }),
      );
      appendLog('sent', `${method} ${target}@trade`);
    },
    [appendLog],
  );

  const connect = useCallback(() => {
    if (wsRef.current != null) {
      return;
    }
    setState('connecting');
    setLog([]);
    const ws = new WebSocket(STREAM_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setState('open');
      send('SUBSCRIBE', symbol);
    };

    ws.onmessage = event => {
      try {
        const data: {e?: string, s?: string, p?: string} = JSON.parse(
          String(event.data),
        );
        const tradePrice = data.p;
        if (data.e === 'trade' && tradePrice != null) {
          setPrice(tradePrice);
          appendLog('received', `trade ${data.s ?? ''} @ ${tradePrice}`);
        } else {
          appendLog('received', String(event.data).slice(0, 80));
        }
      } catch (error: unknown) {
        appendLog('received', String(event.data).slice(0, 80));
      }
    };

    ws.onerror = () => {
      appendLog('received', 'error event');
    };

    ws.onclose = () => {
      setState('closed');
      wsRef.current = null;
    };
  }, [appendLog, send, symbol]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  const changeSymbol = useCallback(
    (next: TradeSymbol) => {
      if (next === symbol) {
        return;
      }
      send('UNSUBSCRIBE', symbol);
      send('SUBSCRIBE', next);
      setSymbol(next);
      setPrice(null);
    },
    [send, symbol],
  );

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const busy = state === 'connecting' || state === 'open';

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View
          style={[styles.statusDot, {backgroundColor: STATE_COLOR[state]}]}
        />
        <RNTesterText style={styles.statusText}>
          {state.toUpperCase()}
        </RNTesterText>
      </View>

      <RNTesterText variant="label" style={styles.symbolLabel}>
        {symbol.toUpperCase()}
      </RNTesterText>
      <RNTesterText style={styles.price}>
        {price != null ? `$${Number(price).toFixed(6)}` : '—'}
      </RNTesterText>

      <View style={styles.symbolRow}>
        {SYMBOLS.map(s => (
          <Pressable
            key={s}
            onPress={() => changeSymbol(s)}
            style={[
              styles.symbolButton,
              s === symbol && styles.symbolButtonActive,
            ]}>
            <RNTesterText
              style={[
                styles.symbolButtonText,
                s === symbol && styles.symbolButtonTextActive,
              ]}>
              {s.replace('usdt', '').toUpperCase()}
            </RNTesterText>
          </Pressable>
        ))}
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          style={[styles.controlButton, busy && styles.controlButtonDisabled]}
          disabled={busy}
          onPress={connect}>
          <RNTesterText style={styles.controlButtonText}>Connect</RNTesterText>
        </Pressable>
        <Pressable
          style={[
            styles.controlButton,
            state !== 'open' && styles.controlButtonDisabled,
          ]}
          disabled={state !== 'open'}
          onPress={disconnect}>
          <RNTesterText style={styles.controlButtonText}>
            Disconnect
          </RNTesterText>
        </Pressable>
      </View>

      <RNTesterText variant="label" style={styles.logHeader}>
        Frame log ({log.length})
      </RNTesterText>
      <FlatList
        style={styles.log}
        data={log}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <RNTesterText style={styles.logLine}>
            <RNTesterText
              style={item.direction === 'sent' ? styles.sent : styles.received}>
              {item.direction === 'sent' ? '↑ ' : '↓ '}
            </RNTesterText>
            {item.time} — {item.summary}
          </RNTesterText>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  symbolLabel: {
    fontSize: 14,
  },
  price: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 16,
  },
  symbolRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  symbolButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cccccc',
    marginRight: 8,
  },
  symbolButtonActive: {
    backgroundColor: '#1e88e5',
    borderColor: '#1e88e5',
  },
  symbolButtonText: {
    fontSize: 13,
  },
  symbolButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginRight: 8,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  logHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  log: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    padding: 8,
  },
  logLine: {
    fontSize: 12,
    fontFamily: 'Menlo',
    marginBottom: 4,
    color: '#333333',
  },
  sent: {
    color: '#1e88e5',
    fontWeight: '700',
  },
  received: {
    color: '#2e7d32',
    fontWeight: '700',
  },
});

exports.title = 'WebSocket (Binance demo)';
exports.category = 'Basic';
exports.description =
  'Live Binance trade ticker over a public WebSocket stream.';
exports.examples = [
  {
    title: 'Binance live trade ticker',
    render(): React.Node {
      return <BinanceWebSocketDemo />;
    },
  },
] as Array<RNTesterModuleExample>;
