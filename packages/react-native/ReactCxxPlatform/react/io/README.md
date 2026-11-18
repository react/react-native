# C++ blob I/O

`BlobModule`, `FileReaderModule`, and `BlobNetworkingResponseHandler` provide
in-memory blob storage and response-body reading for C++ hosts.

## Registration

Create one `BlobStore` per JavaScript runtime, and share it between the modules:

```cpp
auto store = std::make_shared<BlobStore>();
auto blobModule = std::make_shared<BlobModule>(jsInvoker, store);
auto fileReaderModule = std::make_shared<FileReaderModule>(jsInvoker, store);
auto networkingModule = std::make_shared<NetworkingModule>(
    jsInvoker,
    httpClientFactory,
    std::make_shared<BlobNetworkingResponseHandler>(store));
```

Register them under their normal module names through `TurboModuleBinding`.
`BlobModule` implements `TurboModuleWithJSIBindings`, which installs the
`__blobCollectorProvider` used by JavaScript `BlobManager` when the module is
bound. Do not install that global separately or share a store between runtimes.

`addNetworkingHandler()` is a compatibility no-op: the response handler must be
provided when constructing `NetworkingModule`, as shown above. Networking
without a response handler retains its existing response representation.

## Supported behaviour

- `createFromParts` combines strings and stored blob slices; `release` removes
  stored blobs. Blob descriptors use `{blobId, offset, size}` with byte offsets.
- Networking responses requested as `blob` are stored without text decoding and
  delivered as blob descriptors.
- `readAsText` uses Folly's UTF-8 decoding and drops a leading UTF-8 byte-order
  mark. Malformed sequences advance one byte at a time, producing U+FFFD for
  each rejected byte. This intentionally differs from WHATWG maximal-subpart
  replacement for truncated sequences.
- `readAsDataURL` produces base64 data URLs. React Native's JavaScript
  `FileReader.readAsArrayBuffer` also uses this method.
- Offsets and sizes must be finite non-negative whole numbers with valid ranges.
  Missing, released, or out-of-range blobs reject through the normal module
  error path.

The store uses `std::vector<uint8_t>` for binary bytes. Networking copies the
`IOBuf` chain directly into this vector, which the response handler moves into
storage without an intermediate string. Embedded null bytes and non-UTF-8 bytes
are preserved. Text and base64 readers use temporary string views over owned
byte slices; only text decoding interprets the bytes as UTF-8.

## Limits

- Text decoding currently uses UTF-8 for every encoding label. Other character
  sets are not implemented; this is not full encoding parity with the Android
  and Apple modules.
- WebSocket blob registration and sending throw as unsupported. Ordinary
  non-blob WebSocket operations are unaffected by these modules.
- This response handler does not add blob request-body encoding or a resolver
  for `blob:` URLs.
