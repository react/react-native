/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <React/RCTDefines.h>
#include "RCTMacros.h"

#if RCT_PROFILE && defined(__x86_64__)

  .globl SYMBOL_NAME(RCTProfileTrampoline)
SYMBOL_NAME(RCTProfileTrampoline):

  /**
   * Saves all the state so we can restore it before calling the functions being
   * profiled. Registers have the same value at the point of the function call,
   * the only thing we can change is the return value, so we return to
   * `RCTProfileTrampoline` rather than to its caller.
   *
   * Save all the parameters registers (%rdi, %rsi, %rdx, %rcx, %r8, %r9), they
   * have the 6 first arguments of the function call, and %rax which in special
   * cases might be a pointer used for struct returns.
   *
   * We have to save %r12 since its value should be preserved across function
   * calls and we'll use it to keep the stack pointer
   */
  subq $0x80+8, %rsp // 8 x 16-bytes xmm registers + 8-bytes alignment
  movdqa  %xmm0, 0x70(%rsp)
  movdqa  %xmm1, 0x60(%rsp)
  movdqa  %xmm2, 0x50(%rsp)
  movdqa  %xmm3, 0x40(%rsp)
  movdqa  %xmm4, 0x30(%rsp)
  movdqa  %xmm5, 0x20(%rsp)
  movdqa  %xmm6, 0x10(%rsp)
  movdqa  %xmm7, 0x00(%rsp)
  pushq %rdi
  pushq %rsi
  pushq %rdx
  pushq %rcx
  pushq %r8
  pushq %r9
  pushq %rax
  pushq %r12

  /**
   * Store the stack pointer in the callee saved register %r12 and align the
   * stack - it has to 16-byte aligned at the point of the function call
   */
  movq %rsp, %r12
  andq $-0x10, %rsp

  /**
   * void RCTProfileGetImplementation(id object, SEL selector)
   *
   * This is a C function defined in `RCTProfile.m`, the object and the selector
   * already have to be on %rdi and %rsi respectively, as in any ObjC call.
   */
  callq SYMBOL_NAME_PIC(RCTProfileGetImplementation)

  // Restore/unalign the stack pointer, so we can access the registers we stored
  movq %r12, %rsp

  /**
   * pop %r12 before pushing %rax, which contains the address of the actual
   * function we have to call, than we keep %r12 at the bottom of the stack to
   * reference the stack pointer
   */
  popq %r12
  pushq %rax
  pushq %r12

  // align stack
  movq %rsp, %r12
  andq $-0x10, %rsp

  /**
   * Allocate memory to save parent before start profiling: the address is put
   * at the bottom of the stack at the function call, so ret can actually return
   * to the caller. In this case it has the address of RCTProfileTrampoline's
   * caller where we'll have to return to after we're finished.
   *
   * We can't store it on the stack or in any register, since we have to be in
   * the exact same state we were at the moment we were called, so the solution
   * is to allocate a tiny bit of memory to save this address
   */

  // allocate 16 bytes
  movq $0x10, %rdi
  callq SYMBOL_NAME_PIC(RCTProfileMalloc)

  // store the initial value of caller saved registers %r13 and %r14
  movq %r13, 0x0(%rax)
  movq %r14, 0x8(%rax)

  // mov the pointers we need to the callee saved registers
  movq 0xd8(%rsp), %r13 // caller of RCTProfileTrampoline (0xd8 is stack top)
  movq %rax, %r14 // allocated memory's address

  /**
   * Move self and cmd back to the registers and call start profile: it uses
   * the object and the selector to label the call in the profile.
   */
  movq 0x40(%r12), %rdi // object
  movq 0x38(%r12), %rsi // selector

  // void RCTProfileTrampolineStart(id, SEL) in RCTProfile.m
  callq SYMBOL_NAME_PIC(RCTProfileTrampolineStart)

  // unalign the stack and restore %r12
  movq %r12, %rsp
  popq %r12

  // Restore registers for actual function call
  popq %r11
  popq %rax
  popq %r9
  popq %r8
  popq %rcx
  popq %rdx
  popq %rsi
  popq %rdi
  movdqa 0x00(%rsp), %xmm7
  movdqa 0x10(%rsp), %xmm6
  movdqa 0x20(%rsp), %xmm5
  movdqa 0x30(%rsp), %xmm4
  movdqa 0x40(%rsp), %xmm3
  movdqa 0x50(%rsp), %xmm2
  movdqa 0x60(%rsp), %xmm1
  movdqa 0x70(%rsp), %xmm0
  addq $0x80+8, %rsp

  /**
   * delete parent caller (saved in %r13) `call` will add the new address so
   * we return to RCTProfileTrampoline rather than to its caller
   */
  addq $0x8, %rsp

  // call the actual function and save the return value
  callq *%r11
  pushq %rax
  pushq %rdx
  subq $0x20, %rsp // 2 16-bytes xmm register
  movdqa %xmm0, 0x00(%rsp)
  movdqa %xmm1, 0x10(%rsp)

  // void RCTProfileTrampolineEnd(void) in RCTProfile.m - just ends this profile
  callq SYMBOL_NAME_PIC(RCTProfileTrampolineEnd)

  /**
   * Restore the initial value of the callee saved registers, saved in the
   * memory allocated.
   */
  movq %r13, %rcx
  movq %r14, %rdi
  movq 0x0(%r14), %r13
  movq 0x8(%r14), %r14

  /**
   * save caller address and actual function return (previously in the allocated
   * memory) and align the stack
   */
  pushq %rcx
  pushq %r12
  movq %rsp, %r12
  andq $-0x10, %rsp

  // Free the memory allocated to stash callee saved registers
  callq SYMBOL_NAME_PIC(RCTProfileFree)

  // unalign  stack and restore %r12
  movq %r12, %rsp
  popq %r12

  /**
   * pop the caller address to %rcx and the actual function return value(s)
   * so it's the return value of RCTProfileTrampoline
   */
  popq %rcx
  movdqa 0x00(%rsp), %xmm0
  movdqa 0x10(%rsp), %xmm1
  addq $0x20, %rsp
  popq %rdx
  popq %rax

  // jump to caller
  jmpq *%rcx

#endif
