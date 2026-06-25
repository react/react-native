# 👻 React Native Fantom

[🏠 Home](../../../__docs__/README.md)

> [!WARNING]
>
> This is experimental!
>
> We are limiting the scope of the project to just React Native internals for
> now, so we can iterate on it quickly and keep the maintenance costs at bay.
>
> In the future, we might explore providing it for testing library/product code
> internally and externally.
>
> This means tests must live in `packages/react-native`.

Fantom is the new **integration testing and benchmarking tool for React
Native**.

Its main goal is to allow running JavaScript code as close as possible to a real
React Native application, using its cross-platform architecture (Hermes, Fabric,
C++ TurboModules, Bridgeless, etc.) in a fast headless environment that can run
on CI.

Removing the need for real devices and simulators makes this faster and more
stable than existing e2e testing solutions, while still allowing us to test the
integration between JavaScript and native without the need for mocks.

When compared against Jest, layout is calculated and can be inspected in tests:

```javascript
const root = Fantom.createRoot({viewportWidth: 200, viewportHeight: 600});
let viewElement;

Fantom.runTask(() => {
  root.render(
    <View
      ref={node => {
        viewElement = node;
      }}
      style={{width: '50%', height: '10%'}}
    />,
  );
});

// Without Fantom, getBoundingClientRect would have to be mocked.
const boundingClientRect = viewElement.getBoundingClientRect();
expect(boundingClientRect.height).toBe(60);
expect(boundingClientRect.width).toBe(100);
```

Fantom is designed to make it possible to test the integration between
JavaScript, React and React Native core - platform agnostic parts. When you are
making a change to any of these parts, you should consider writing a Fantom test
for it. It is geared towards engineers working on React Native.

With Fantom you can create scenarios close to those how a real product will
interact with React Native and observe what effects it has on a mock host
platform. It exposes fine grained controls over scheduling, making it possible
to test cases that are hard to reproduce manually.

## 🚀 Usage

Create a file with the `-itest.js` suffix anywhere you would normally create a
Jest unit test file.

The high level structure of Fantom tests is similar to Jest unit tests. However,
only a subset of Jest's Global API is currently available. For example,
`test.each` is not yet implemented in Fantom. We are working on adding more Jest
APIs. If you are blocked by the lack of a specific API, please reach out to us.

Most of the interesting APIs are available via the `@react-native/fantom`
package. Test files should also import `setUpDefaultReactNativeEnvironment` at
the top to set up the React Native environment. **Do not import
`InitializeCore`** — it installs LogBox, which interferes with Fantom's error
handling.

```javascript
import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import * as Fantom from '@react-native/fantom';

describe('My feature', () => {
  it('should do something interesting', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(/* ... */);
    });

    /* some checks */
  });
});
```

For a full API reference, please see the [inline documentation](../src/index.js)
defined for the methods in the `@react-native/fantom` [module](../src/index.js).

You can check out existing files with the `-itest.js` suffix (e.g.:
[`View-itest`](../../../packages/react-native/Libraries/Components/View/__tests__/View-itest.js))
for code examples.

Run the test using the following command from the root of the React Native
repository:

```shell
yarn fantom <regexForTestFiles>
```

Similar to Jest, you can also run Fantom in watch mode using `--watch`:

```shell
yarn fantom <regexForTestFiles> --watch
```

### Conventions

- Place test files in `__tests__` directories alongside the code being tested.
- Benchmark tests use the `-benchmark-itest.js` suffix.
- Use `Fantom.runTask()` to render and run synchronous operations; it ensures
  the React work is flushed before assertions.
- Access elements through refs and use the
  [`ensureInstance`](../../../packages/react-native/src/private/__tests__/utilities/ensureInstance.js)
  helper for type-safe access to the underlying instance:

  ```javascript
  import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';

  const element = ensureInstance(elementRef.current, ReactNativeElement);
  ```

- Prefer component-specific instance types (`TextInputInstance`,
  `ScrollViewInstance`, etc.) over the generic `HostInstance` when available.
- For components with imperative APIs (`focus`, `blur`, `clear`, etc.), test:
  - Each method's behaviour and edge cases (e.g. `blur` when not focused).
  - Method timing — that it works when called from refs, `useLayoutEffect`, and
    `useEffect`.
- Verify that native commands are dispatched with
  `root.takeMountingManagerLogs()`.
- Don't write tests with only trivial assertions like
  `expect(element).toBeDefined()` when more complex behaviour is under test.
  When a test fails, understand what should render rather than weakening the
  assertion to make it pass.

### Assertions

Prefer evaluating rendered output inline with `.toEqual()` and inline JSX over
`.toMatchSnapshot()` or weak numeric assertions like
`element.childNodes.length`.

```javascript
// Get JSX representation
expect(root.getRenderedOutput().toJSX()).toEqual(
  <rn-view width="100" height="50" />,
);

// Include layout metrics
expect(root.getRenderedOutput({includeLayoutMetrics: true}).toJSX()).toEqual(
  <rn-view
    layoutMetrics-frame="{x:0,y:0,width:100,height:50}"
    layoutMetrics-displayType="Flex"
  />,
);

// Filter to specific props for minimal assertions
expect(root.getRenderedOutput({props: ['backgroundColor']}).toJSX()).toEqual(
  <rn-view backgroundColor="rgba(255, 0, 0, 1)" />,
);
```

For element-level assertions, get a typed reference and inspect tag names,
layout metrics, or children:

```javascript
const elementRef = createRef<HostInstance>();

Fantom.runTask(() => {
  root.render(
    <View ref={elementRef}>
      <Text>the quick brown fox</Text>
    </View>,
  );
});

const element = ensureInstance(elementRef.current, ReactNativeElement);
expect(element.tagName).toBe('RN:View');

const bounds = element.getBoundingClientRect();
expect(bounds.width).toBe(100);
expect(bounds.height).toBe(50);

expect(root.getRenderedOutput().toJSX()).toEqual(
  <rn-view>
    <rn-paragraph>the quick brown fox</rn-paragraph>
  </rn-view>,
);
```

### Limitations

- `Fantom.runTask()` calls cannot be nested — doing so will throw.
- Only a subset of Jest's Global API is available (e.g. `test.each` is not
  implemented). Reach out if you're blocked by a specific missing API.
- Tests must live within `packages/react-native`; Fantom is not currently
  intended for application-specific code.

### Test configuration

You can configure certain aspects of the test execution using pragmas in the
docblock at the top of the file. E.g.:

```javascript
/**
 * @fantom_flags jsOnlyTestFlag:true
 * @fantom_mode opt
 */
```

Available pragmas:

- `@fantom_flags`: used to set overrides for
  [`ReactNativeFeatureFlags`](../../../packages/react-native/src/private/featureflags/__docs__/README.md).
  - Example: `@fantom_flags name:value`.
  - Multiple flags can be defined in different lines or in the same line
    separated by spaces (e.g.: `@fantom_flags name:value otherName:otherValue`).
- `@fantom_mode`: used to define the compilation mode for the bundle.
  - Example: `@fantom_mode opt`
  - Possible values:
    - `dev`: development, default for tests.
    - `opt`: optimized and using Hermes bytecode, default for benchmarks.
- `@fantom_native_opt`: used to define the compilation mode for native code.
  - Example: `@fantom_native_opt true`
  - Possible values:
    - `true`: optimized native code
    - `false`: development native code
- `@fantom_js_opt`: used to define the compilation mode for the JS bundle.
  - Example: `@fantom_js_opt true`
  - Possible values:
    - `true`: optimized JS bundle
    - `false`: development JS bundle
- `@fantom_js_bytecode`: used to define if the JS bundle should use bytecode.
  - Example: `@fantom_js_bytecode true`
  - Possible values:
    - `true`: using Hermes bytecode
    - `false`: not using Hermes bytecode
- `@fantom_disable_coverage`: used to disable coverage collection for the test.
  - Example: `@fantom_disable_coverage`
  - Does not require a value.
- `@fantom_react_fb_flags`: used to set overrides for internal React flags set
  in ReactNativeInternalFeatureFlags (Meta use only)

Setting `@fantom_mode` is mutually exclusive with setting any of
`@fantom_native_opt`, `@fantom_js_opt`, and `@fantom_js_bytecode`.

For all pragmas, except non-boolean feature flags, you can use a wildcard (`*`)
as value to run the test with all possible values for that pragma. For example,
this test:

```javascript
/**
 * @fantom_flags jsOnlyTestFlag:*
 * @fantom_mode *
 */
```

Would be executed with these combinations of options:

| `jsOnlyTestFlag` | `mode` |
| ---------------- | ------ |
| `false`          | `dev`  |
| `true`           | `dev`  |
| `false`          | `opt`  |
| `true`           | `opt`  |

With an output such as:

```text
  Test (jsOnlyTestFlag 🛑)
    [...]
  Test (jsOnlyTestFlag ✅)
    [...]
  Test (mode 🐛🔢, jsOnlyTestFlag 🛑)
    [...]
  Test (mode 🐛🔢, jsOnlyTestFlag ✅)
    [...]
  Test (mode 🚀, jsOnlyTestFlag 🛑)
    [...]
  Test (mode 🚀, jsOnlyTestFlag ✅)
    [...]
```

### Debugging

> [!WARNING] Meta-only: debugging only works on Meta's internal infrastructure
> at the moment.

You can use environment variables to enable debugging for your tests. These
options can be combined to debug JS and C++ at the same time.

#### Debugging JS

To debug JavaScript, run your fantom test with the flag `FANTOM_DEBUG_JS`:

```shell
FANTOM_DEBUG_JS=1 yarn fantom <regexForTestFiles>
```

This would open React Native DevTools, which would stop at a breakpoint at the
beginning of your test so you can debug it.

#### Debugging C++

To debug C++, run your fantom test with the flag `FANTOM_DEBUG_CPP`:

```shell
FANTOM_DEBUG_CPP=1 yarn fantom <regexForTestFiles>
```

This would start a debugging session in VS Code with an initial breakpoint in
the Fantom CLI binary.

#### Address and thread sanitizer for C++

It's also possible to run the C++ side with the thread or address sanitizer
enabled, which can help with debugging memory and threading issues.

To enable the address sanitizer, run your fantom test with the flag
`FANTOM_ENABLE_ASAN`:

```shell
FANTOM_ENABLE_ASAN=1 yarn fantom <regexForTestFiles>
```

For thread sanitizer, correspondingly, use flag `FANTOM_ENABLE_TSAN`:

```shell
FANTOM_ENABLE_TSAN=1 yarn fantom <regexForTestFiles>
```

### Profiling

#### JS sampling profiler

You can automatically record JS sampling profiler traces with the flag
`FANTOM_PROFILE_JS`:

```shell
FANTOM_PROFILE_JS=1 yarn fantom <regexForTestFiles>
```

As part of the test results, you will see a message indicating where the traces
where saved, e.g.:

```text
🔥 JS sampling profiler trace saved to /path/to/react-native/private/react-native-fantom/.out/js-traces/View-itest.js-2025-08-12T14:08:31.580Z.cpuprofile
```

If your test has multiple variants (when using wildcards in Fantom pragmas), a
trace will be created for each variant.

You can analyze the traces loading them in Chrome DevTools directly. You can
also open them in VS Code, which provides a built-in extension for analysis.

#### JS memory profiler

You can manually take JS memory heap snapshots during test execution using
`Fantom.takeJSMemoryHeapSnapshot()`. E.g.:

```javascript
// Using the 3 snapshot method to detect memory leaks:

// Warm up
renderView();
destroyView();

// #1
Fantom.takeJSMemoryHeapSnapshot();

renderView();

// #2
Fantom.takeJSMemoryHeapSnapshot();

destroyView();

// #3
Fantom.takeJSMemoryHeapSnapshot();

// See the objects allocated between #1 and #2 that still exist in #3.
```

This function will force a garbage collection pass, take a snapshot of the JS
memory heap and print a message indicating where it was saved. E.g.:

```text
💾 JS heap snapshot saved to /path/to/react-native/private/react-native-fantom/.out/js-heap-snapshots/View-itest.js-2025-08-12T14:29:25.987Z.heapsnapshot
```

You can have multiple calls to `Fantom.takeJSMemoryHeapSnapshot()` in your test,
and each one will create a different file.

#### C++ sampling profiler

You can automatically record C++ sampling profiler traces (with DWARF call
graphs) by wrapping the Fantom tester binary with Linux `perf record`. Run your
fantom test with the flag `FANTOM_PROFILE_CPP`:

```shell
FANTOM_PROFILE_CPP=1 yarn fantom <regexForTestFiles>
```

Output is saved to `.out/cpp-traces/perf-<timestamp>.data`. Analyze it with:

```shell
perf report -i .out/cpp-traces/perf-<timestamp>.data
```

This is not available on CI (the runner will throw an error if attempted) and
requires `perf` to be installed on the host.

### Running the full suite locally

When running the entire suite locally, set `FANTOM_FORCE_CI_MODE=1`:

```shell
FANTOM_FORCE_CI_MODE=1 yarn fantom
```

In CI mode, `globalSetup` pre-builds the entire
`(hermesVariant × enableOptimized)` binary matrix once up-front (see
[`global-setup/build.js`](../runner/global-setup/build.js)) and per-test buck2
invocations are skipped. This eliminates buck2 daemon contention from the worker
pool, which can otherwise cause sporadic build failures when many workers race
to build different binary variants at the same time.

CI environments (`SANDCASTLE`, `GITHUB_ACTIONS`) auto-detect this mode — see
[`runner/EnvironmentOptions.js`](../runner/EnvironmentOptions.js).

### FAQ

#### How is this different from Jest tests?

Fantom runs C++ part of React Native, as well as JavaScript on Hermes VM -
unlike Jest tests that run on V8. This makes it possible to test things related
to shadow nodes, layout, events, scheduling, C++ state updates to name a few.
The results of Fabric are mounted in a mock UI tree that can be asserted against
and individual mounting instructions can be inspected.

You can even test your C++ code. For example, we have
[Fantom tests for the new View Culling optimization](../../../packages/react-native/Libraries/Components/ScrollView/__tests__/ScrollView-viewCulling-itest.js),
which is written in C++.

#### How can I test logic related to &lt;ScrollView /> scrolling?

Fantom exposes the method `Fantom.scrollTo`. This method will trigger an
onScroll event and configure the shadow tree to reflect the new content offset:

```javascript
Fantom.scrollTo(scrollViewElement, {
  x: 0,
  y: 1,
});

expect(scrollViewElement.scrollTop).toBe(1);
```

#### How can I test logic that relies on timers (`setTimeout`/`setInterval`)?

Install a deterministic timer mock with `Fantom.installTimerMock()`. While
installed, `setTimeout`/`setInterval` callbacks do not fire on their own; you
advance a virtual clock to fire them, similar to `jest.useFakeTimers()`:

```javascript
const timers = Fantom.installTimerMock();

const callback = jest.fn();
setTimeout(callback, 100);

timers.advanceTimersByTime(50);
expect(callback).toHaveBeenCalledTimes(0);

timers.advanceTimersByTime(50);
expect(callback).toHaveBeenCalledTimes(1);

timers.uninstall();
```

`advanceTimersByTime`/`runAllTimers` run the work loop internally, so callbacks
have executed by the time they return. Use `getPendingTimerCount()` to inspect
how many timers are still scheduled, and `uninstall()` (typically in
`afterEach`) to restore the default behavior.

#### What can be tested with Fantom?

Fantom was designed to make it possible to test integration between React and
Fabric with the Jest API that many people are familiar with. You can write code
to simulate any kind of input into React and assert what the output is from
React Native core to the host platform. Fantom controls the app's message queue,
which gives complete control over scheduling. This makes it possible to write
tests that simulate scenarios where an event interrupts React rendering in a
deterministic fashion.

Even JavaScript only code can be tested with Fantom. We are considering fully
deprecating "vanilla" Jest in favor of Fantom for all JavaScript tests in React
Native.

#### Is Fantom ready for production use cases?

Fantom is a stable and reliable testing framework that is here to stay. If
you're planning to make changes to React or React Native internals, we highly
recommend using Fantom as your go-to testing solution.

**Important Note:** While Fantom is ideal for testing React and React Native
internals, it is not currently supported for testing application-specific code
in React Native apps. We'll keep you updated on any future developments that may
change this.

#### Where can I find examples of tests?

Look for files with the `-itest.js` suffix to find existing tests. The Fantom
test for its public API ([`Fantom-itest.js`](../src/__tests__/Fantom-itest.js))
has simple examples you can learn from.

#### Are tests executed on Github CI?

Fantom tests are currently tied to Meta's infrastructure and do not run outside
of Meta's CI. We are working on migrating Fantom to Github CI. If you submit a
PR, the tests will run as part of the PR import process.

#### Can I gate individual tests within a suite to only run, or not run, with a specific feature flag?

Yes, you can use the `@fantom_flags` pragma to customize the flags that are
going to be used for the entire test suite, and conditionally define or exclude
the test in the suite depending on the flag value for that run. E.g.:

```javascript
/**
 * @fantom_flags commonTestFlag:*
 */

import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

// The entire suite will be run with commonTestFlag set to true and false.
describe('MyTest', () => {
  it('should run with all values of the flag', () => {
    // ...
  });

  if (ReactNativeFeatureFlags.commonTestFlag()) {
    it('should only run when the flag is true', () => {
      // ...
    });
  }

  if (!ReactNativeFeatureFlags.commonTestFlag()) {
    it('should only run when the flag is false', () => {
      // ...
    });
  }
});
```

And the result would look like this:

```text
 PASS  MyTest-itest.js
  MyTest (commonTestFlag ❌)
    ✓ should run with all values of the flag
    ✓ should only run when the flag is false
  MyTest (commonTestFlag ✅)
    ✓ should run with all values of the flag
    ✓ should only run when the flag is true
```

---

If you have any questions not answered here, please reach out to us.

## 📐 Design

![Diagram of the architecture of Fantom in React Native](./architecture.excalidraw.svg)

Fantom tests are meant to be written, executed and reported as regular Jests
tests. To accomplish that, **Fantom is implemented as a Jest test runner**.

Fantom provides a [Jest configuration](../config/jest.config.js) to use
[its runner](../runner/runner.js) for any tests matching the `-itest.js` suffix
within the repository.

When Jest runs, for every file that matches that configuration, it calls into
the Fantom runner, which receives the path to the test file along with different
configuration objects.

The runner then follows these steps:

1. It creates a single "executable" JavaScript file using Metro (with this
   [configuration](../config/metro.config.js)), containing the test itself, its
   dependencies and some glue code to run the test at runtime and report its
   results. Depending on the configured "mode" for the test, the runner might
   compile that JavaScript file into Hermes bytecode.
2. It calls into the Fantom CLI passing the path to the executable JavaScript
   code (or Hermes bytecode) and the configured feature flags for the test. The
   Fantom CLI evaluates that code in the context of a React Native C++
   application and prints the results as JSON via its standard output.
3. The runner receives the output from the Fantom CLI and reports the provided
   results back to Jest in the correct format.

## 🔗 Relationship with other systems

### Part of this

- The Fantom runner, which provides the integration point with Jest.
- The Fantom CLI, which provides the execution environment for the Fantom
  JavaScript tests.
- The Fantom benchmarking system, which is just a library and some automatic
  configuration on top of Fantom.

### Used by this

- Metro, to compile the test code into a single file consumable by the Fantom
  CLI.
- Hermes Compiler, to compile the JavaScript test code into Hermes bytecode.
- The
  [React Native Feature Flags](../../../packages/react-native/src/private/featureflags/__docs__/README.md)
  system, via the `@fantom_flags` pragmas defined in the docblock for test
  files.
