/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <React/RCTDefines.h>
#include "RCTMacros.h"

#if RCT_PROFILE && defined(__arm__)

  .thumb
  .thumb_func
  .globl SYMBOL_NAME(RCTProfileTrampoline)
SYMBOL_NAME(RCTProfileTrampoline):
  /**
   * The explanation here is shorter, refer to the x86_64 implementation to a
   * richer explanation
   */

  /**
   * Save the parameter registers (r0-r3), r7 (frame pointer) and lr (link
   * register (contains the address of the caller of RCTProfileTrampoline)
   */
  push {r0-r3, r7, lr}

  /**
   * Allocate memory to store values across function calls: 12-bytes are
   * allocated to store 3 values: the previous value of the callee saved
   * register used to save the pointer to the allocated memory, the caller of
   * RCTProfileTrampoline and the address of the actual function we want to
   * profile
   */
  mov r0, #0xc
  bl SYMBOL_NAME(RCTProfileMalloc)
  /**
   * r4 is the callee saved register we'll use to refer to the allocated memory,
   * store its initial value, so we can restore it later
   */
  str r4, [r0]
  mov r4, r0

  /**
   * void RCTProfileGetImplementation(id object, SEL selector) in RCTProfile.m
   *
   * Load the first 2 argumenters (self and _cmd) used to call
   * RCTProfileTrampoline from the stack and put them on the appropriate registers.
   */
  ldr r0, [sp]
  ldr r1, [sp, #0x4]
  bl SYMBOL_NAME(RCTProfileGetImplementation)
  // store the actual function address in the allocated memory
  str r0, [r4, #0x4]

  /**
   * void RCTProfileGetImplementation(id object, SEL selector) in RCTProfile.m
   *
   * Load the first 2 arguments again to start the profiler
   */
  ldr r0, [sp]
  ldr r1, [sp, #0x4]
  bl SYMBOL_NAME(RCTProfileTrampolineStart)

  /**
   * Restore the state to call the actual function we want to profile: pop
   * all the registers
   */
  pop {r0-r3, r7, lr}

  // store lr (the caller) since it'll be overridden by `blx` (call)
  str lr, [r4, #0x8]
  ldr r12, [r4, #0x4] // load the function address
  blx r12 // call it
  push {r0} // save return value

  // void RCTProfileTrampolineEnd(void) in RCTProfile.m - just ends this profile
  bl SYMBOL_NAME(RCTProfileTrampolineEnd)

  /**
   * Save the value we still need from the allocated memory (caller address),
   * restore r4 and free the allocated memory (put its address in r0)
   */
  mov r0, r4
  ldr r1, [r4, #0x8]
  ldr r4, [r4]
  push {r1} // save the caller on the stack
  bl SYMBOL_NAME(RCTProfileFree)

  pop {lr} // pop the caller
  pop {r0} // pop the return value
  bx lr // jump to the caller

  trap

#endif
