/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// Declarations for functionality exposed by the Hermes VM.
//
// For backwards-compatibility, code that uses such functionality must also
// check explicitly at run-time whether the object(s) and method(s) exist, and
// fail safely if not.

/**
 * HermesInternalType is an object containing functions used to interact with
 * the VM in a way that is not standardized by the JS spec.
 * There are limited guarantees about these functions, and they should not be
 * widely used. Consult with the Hermes team before using any of these.
 * There may be other visible properties on this object; however, those are
 * only exposed for testing purposes: do not use them.
 */
declare type $HermesInternalType = {
  // All members are optional because they may not exist when OTA'd to older
  // VMs.

  +getNumGCs?: () => number,
  +getGCTime?: () => number,
  +getNativeCallTime?: () => number,
  +getNativeCallCount?: () => number,
  +getGCCPUTime?: () => number,

  /**
   * Hermes can embed an "epilogue" to the bytecode file with arbitrary bytes.
   * At most one epilogue will exist per bytecode module (which can be
   * different than a JS module).
   * Calling this function will return all such epilogues and convert the
   * bytes to numbers in the range of 0-255.
   */
  +getEpilogues?: () => Array<Array<number>>,

  /**
   * Query the VM for various statistics about performance.
   * There are no guarantees about what keys exist in it, but they can be
   * printed for informational purposes.
   * @return An object that maps strings to various types of performance
   *    statistics.
   */
  +getInstrumentedStats?: () => {[string]: number | string, ...},

  /**
   * Query the VM for any sort of runtime properties that it wants to report.
   * There are no guarantees about what keys exist in it, but they can be
   * printed for informational purposes.
   * @return An object that maps strings to various types of runtime properties.
   */
  +getRuntimeProperties?: () => {
    'OSS Release Version': string,
    Build: string,
    [string]: unknown,
  },

  /**
   * Tell Hermes that at this point the surface has transitioned from TTI to
   * post-TTI. The VM can change some of its internal behavior to optimize for
   * post-TTI scenarios.
   * This can be called several times but will have no effect after the first
   * call.
   */
  +ttiReached?: () => void,

  /**
   * Tell Hermes that at this point the surface has transitioned from TTRC to
   * post-TTRC. The VM can change some of its internal behavior to optimize for
   * post-TTRC scenarios.
   * This can be called several times but will have no effect after the first
   * call.
   */
  +ttrcReached?: () => void,

  /**
   * Query the VM to see whether or not it enabled Promise.
   */
  +hasPromise?: () => boolean,

  /**
   * Enable promise rejection tracking with the given options.
   * The API mirrored the `promise` npm package, therefore it's typed same as
   * the `enable` function of module `promise/setimmediate/rejection-tracking`
   * declared in ./flow-typed/npm/promise_v8.x.x.js.
   */
  +enablePromiseRejectionTracker?: (
    options: ?{
      whitelist?: ?Array<unknown>,
      allRejections?: ?boolean,
      onUnhandled?: ?(number, unknown) => void,
      onHandled?: ?(number, unknown) => void,
    },
  ) => void,

  /**
   * Query the VM to see whether or not it use the engine Job queue.
   */
  +useEngineQueue?: () => boolean,

  /**
   * Enqueue a JavaScript callback function as a Job into the engine Job queue.
   */
  +enqueueJob?: <TArguments extends Array<unknown>>(
    jobCallback: (...args: TArguments) => unknown,
  ) => void,
};
