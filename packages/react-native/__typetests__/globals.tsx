/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const noop = () => { };

const domException = new DOMException('message', 'DataCloneError');
const domExceptionCode: number = domException.code;
const dataCloneErrorCode: 25 = DOMException.DATA_CLONE_ERR;
const clonedValue: {nested: {value: number}} = structuredClone({
    nested: {value: 1},
});
console.log(domExceptionCode, dataCloneErrorCode, clonedValue.nested.value);

function testPerformance() {
    const start: number = performance.now();
    const timeOrigin: number = performance.timeOrigin;

    const mark: PerformanceMark = performance.mark('start', {
        detail: {foo: 'bar'},
        startTime: start,
    });
    const markDetail: unknown = mark.detail;
    performance.mark('end');

    const measure: PerformanceMeasure = performance.measure('duration', 'start', 'end');
    const measureDetail: unknown = measure.detail;
    performance.measure('withOptions', {start: 'start', end: 'end', detail: 1});
    performance.measure('withDuration', {start, duration: 10});

    const entries: ReadonlyArray<PerformanceEntry> = performance.getEntries();
    const marks: ReadonlyArray<PerformanceEntry> = performance.getEntriesByType('mark');
    const named: ReadonlyArray<PerformanceEntry> = performance.getEntriesByName('start', 'mark');
    const entry = entries[0];
    const name: string = entry.name;
    const entryType: PerformanceEntryType = entry.entryType;
    const startTime: number = entry.startTime;
    const duration: number = entry.duration;
    const json: {name: string; entryType: PerformanceEntryType; startTime: number; duration: number} = entry.toJSON();

    performance.clearMarks();
    performance.clearMarks('start');
    performance.clearMeasures();
    performance.clearMeasures('duration');

    const customMark: PerformanceMark = new PerformanceMark('custom', {startTime: 1});
    const isPerformance: boolean = performance instanceof Performance;

    console.log(timeOrigin, markDetail, measureDetail, marks, named, name, startTime, duration, json, customMark, isPerformance);

    // @ts-expect-error
    performance.mark();

    // @ts-expect-error
    performance.getEntriesByType('wrong-type');
}

function testInterval() {
    clearInterval(null);
    clearInterval(undefined);

    let handle = setInterval(noop, 0);
    clearInterval(handle);

    handle = setInterval((arg1: number, arg2: string) => {
        console.log('arg1', arg1);
        console.log('arg2', arg2);
    }, 0, 100, '200');
    clearInterval(handle);

    handle = setInterval((arg1: number, arg2: string) => {
        console.log('arg1', arg1);
        console.log('arg2', arg2);
    // @ts-expect-error
    }, 0, 'wrong-type', '200');
    clearInterval(handle);

    // @ts-expect-error
    handle = setInterval((missingArg: any) => {
        console.log('missingArg', missingArg);
    }, 0);
    clearInterval(handle);

    handle = setInterval((arg1: number) => {
        console.log('arg1', arg1);
    // @ts-expect-error
    }, 0, 100, 'missing-arg');
    clearInterval(handle);
}

function testTimeout() {
    clearTimeout(null);
    clearTimeout(undefined);

    let handle = setTimeout(noop, 0);
    clearTimeout(handle);

    handle = setTimeout((arg1: number, arg2: string) => {
        console.log('arg1', arg1);
        console.log('arg2', arg2);
    }, 0, 100, '200');
    clearTimeout(handle);

    handle = setTimeout((arg1: number, arg2: string) => {
        console.log('arg1', arg1);
        console.log('arg2', arg2);
    // @ts-expect-error
    }, 0, 'wrong-type', '200');
    clearTimeout(handle);

    // @ts-expect-error
    handle = setTimeout((missingArg: any) => {
        console.log('missingArg', missingArg);
    }, 0);
    clearTimeout(handle);

    handle = setTimeout((arg1: number) => {
        console.log('arg1', arg1);
    // @ts-expect-error
    }, 0, 100, 'missing-arg');
    clearTimeout(handle);
}

function testImmediate() {
    clearImmediate(null);
    clearImmediate(undefined);

    let handle = setImmediate(noop);
    clearImmediate(handle);

    handle = setImmediate((arg1: number, arg2: string) => {
        console.log('arg1', arg1);
        console.log('arg2', arg2);
    }, 100, '200');
    clearImmediate(handle);

    handle = setImmediate((arg1: number, arg2: string) => {
        console.log('arg1', arg1);
        console.log('arg2', arg2);
    // @ts-expect-error
    }, 'wrong-type', '200');
    clearImmediate(handle);

    // @ts-expect-error
    handle = setImmediate((missingArg: any) => {
        console.log('missingArg', missingArg);
    });
    clearImmediate(handle);

    handle = setImmediate((arg1: number) => {
        console.log('arg1', arg1);
    // @ts-expect-error
    }, 100, 'missing-arg');
    clearImmediate(handle);
}

function testRequestAnimationFrame(){
    cancelAnimationFrame(null);
    cancelAnimationFrame(undefined);

    let handle = requestAnimationFrame((time: number) => {
        console.log('time', time);
    });
    cancelAnimationFrame(handle);

    handle = requestAnimationFrame(() => {
      console.log('no time');
    });
    cancelAnimationFrame(handle);

    handle = requestAnimationFrame(
      // @ts-expect-error
      (notTime: string) => {
      console.log('argument have to be number', notTime);
    });
    cancelAnimationFrame(handle);

    // @ts-expect-error
    const resultHaveToBeNum: string = requestAnimationFrame(() => {
      console.log('result have to be number');
    });
    cancelAnimationFrame(
      // @ts-expect-error
      resultHaveToBeNum
    );
}

function testRequestIdleCallback() {
    cancelIdleCallback(null);
    cancelIdleCallback(undefined);

    let handle = requestIdleCallback(deadline => {
        const didTimeout: boolean = deadline.didTimeout;
        const remaining: number = deadline.timeRemaining();
        console.log(didTimeout, remaining);
    });
    cancelIdleCallback(handle);

    handle = requestIdleCallback(noop, { timeout: 100 });
    cancelIdleCallback(handle);

    handle = requestIdleCallback(noop, {});
    cancelIdleCallback(handle);

    // @ts-expect-error
    requestIdleCallback(noop, { timeout: 'wrong-type' });

    // @ts-expect-error
    cancelIdleCallback('wrong-type');
}

const fetchCopy: WindowOrWorkerGlobalScope['fetch'] = fetch;

const myHeaders = new Headers();
myHeaders.append('Content-Type', 'image/jpeg');

const controller = new AbortController();

const myInit: RequestInit = {
    method: 'GET',
    headers: myHeaders,
    mode: 'cors',
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
};

const myRequest = new Request('flowers.jpg');

fetch(myRequest, myInit)
    .then(response => {
        console.log(response.type);
        console.log(response.url);
        console.log(response.status);
        console.log(response.ok);
        console.log(response.statusText);
        console.log(response.headers);

        return response.blob();
    })
    .then(blob => {
        const init = { status: 200, statusText: 'SuperSmashingGreat!' };
        const myResponse = new Response(blob, init);
    });

const xmlRequest = new XMLHttpRequest();

xmlRequest.addEventListener('load', ev => {
    console.log(ev.lengthComputable);
    console.log(ev.loaded);
    console.log(ev.total);
});

const test = new URLSearchParams();

const url = new URL('path', 'http://localhost/');

const blobA = new Blob();
const textA = 'i \u2665 dogs';

const blob = new Blob([blobA, textA]);

const reader = new FileReader();

reader.onloadend = ev => {
    console.log(ev.target);
    console.log(ev.loaded);
};

reader.readAsText(new Blob());

fetch('https://example.org/post-image', {
    body: { uri: 'file:///data/tmp/qwerad3.jpg' },
    headers: {
        'Content-Type': 'type',
    },
    method: 'POST',
});

const socket = new WebSocket('wss://echo.websocket.org');
socket.send('hello world');
socket.addEventListener('open', () => console.log('open'));
socket.onopen = () => console.log('open');
socket.addEventListener('close', e => console.log(e.code));
socket.onclose = e => console.log(e.code);
socket.addEventListener('message', e => console.log(e.data));
socket.onmessage = e => console.log(e.data);
socket.addEventListener('error', e => console.log(e.message));
socket.onerror = e => console.log(e.message);

const formData = new FormData();
formData.append('file', { fileName: 'example' });
console.log(formData.getParts());
console.log(formData.getAll('username'));
