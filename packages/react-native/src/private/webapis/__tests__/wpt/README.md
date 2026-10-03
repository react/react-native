# Web Platform Tests for Fetch and Streams

These tests run the shell-compatible portions of the upstream Web Platform
Tests (WPT) `fetch/` and `streams/` suites inside React Native's Fantom runtime.
The committed `wpt-baseline.json` results are an expectation baseline: both an
unexpected failure and an unexpected pass fail CI until the baseline is
deliberately updated.

The fixtures are generated on demand and are not committed. They are pinned to
the WPT revision named by `WPT_REVISION` in
`scripts/web-platform-tests/sync.js` and contain byte-for-byte copies of the
upstream test sources, their `// META: script` dependencies, and WPT's
`testharness.js`. WPT is distributed under the
[3-Clause BSD License](https://github.com/web-platform-tests/wpt/blob/master/LICENSE.md).
The runner recognizes a `test(() => {}, ...)` registration without changing
its source so that assertion-free markers remain excluded from conformance
counts. The current expected results live in `wpt-baseline.json`; the generated
fixture also records every test file excluded by the environment boundary and
its reason.

Selection is derived from WPT's `MANIFEST.json`, not from a file allowlist. A
source is runnable when the manifest classifies it as a `testharness` `.any.js`
test with a dedicated-worker variant and its declared scripts and reachable
host APIs are available in Fantom. Unsupported records include the manifest
type, generated URLs, declared globals/scripts, and the detected requirement.

## Running the suites

From the React Native repository root:

```shell
yarn test-wpt
```

Fantom `-itest.js` files are part of the existing Fantom CI job, so the GitHub
Actions job checks out the pinned WPT revision, generates the fixture, and then
runs these suites. The CI tests execute the files in a deterministic shuffled
order and compare them with a baseline captured in manifest order. This makes
an order-dependent result fail the suite.

An expected result can be changed to `FLAKY` in the baseline when it is known to
be intermittent. A flaky result accepts either a pass or a failure in CI, and
the baseline updater carries the `FLAKY` status forward by file, test name, and
duplicate-name occurrence. It must be removed manually once the test is stable.

When a suite has no conformance passes and every ordinary subtest failure names
a runtime global that is actually absent, the result is reported as `BLOCKED`.
The baseline records the dominant missing global, all missing globals, and the
number of gated files and subtests instead of retaining hundreds of equivalent
failure rows. Harness-generated failures such as file-evaluation errors remain
visible separately.

## Updating WPT and the baseline

1. Obtain a checkout of
   [web-platform-tests/wpt](https://github.com/web-platform-tests/wpt) at the
   revision named by `WPT_REVISION` in
   `scripts/web-platform-tests/sync.js`. To move to a newer upstream revision,
   update that constant first.
2. Generate WPT's manifest at that revision:

   ```shell
   ./wpt manifest --no-download --rebuild fetch streams
   ```

3. Regenerate the local fixture:

   ```shell
   yarn sync-wpt --wpt-root=/absolute/path/to/wpt
   ```

   The fixture is ignored by Git. The generator verifies the checkout revision
   and every selected or excluded test source against its manifest Git-blob
   hash.
4. Review the manifest-derived runnable and unsupported inventory in the
   generated fixture. If the environment capability rules have changed, update
   the classifier in `sync.js`.
5. Record current React Native behavior and verify the new baseline:

   ```shell
   yarn update-wpt-baseline
   ```

6. Review every changed result before accepting the new baseline. The update
   command preserves existing `FLAKY` statuses and reruns `yarn test-wpt`
   against the newly written baseline.

## Environment limitations

Fantom supplies React Native's real JavaScript globals and Hermes runtime, but
its HTTP client is intentionally a non-completing stub. Fetch tests that require
the WPT HTTP(S) server therefore cannot run without changing the Fantom native
test environment. Browser-only tests also cannot run because Fantom has no DOM,
navigation, Window, service worker, or shared worker environment.

The Streams suite runs `.any.js` tests that are compatible with a JavaScript
shell. WebIDL harness tests, explicit garbage-collection tests, and tests that
require browser transferables such as `MessagePort` or `VideoFrame` are recorded
as unsupported in the generated fixture.

The adapter processes direct `// META: script=` dependencies. Other WPT
execution metadata, nested dependency metadata, and browser or worker realm
creation are not implemented.
