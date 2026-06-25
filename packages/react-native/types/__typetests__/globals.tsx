/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const noop = () => { };

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

const fetchCopy: WindowOrWorkerGlobalScope['fetch'] = fetch;

const myHeaders = new Headers();
myHeaders.append('Content-Type', 'image/jpeg');

const myInit: RequestInit = {
    method: 'GET',
    headers: myHeaders,
    mode: 'cors',
    signal: new AbortSignal(),
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
