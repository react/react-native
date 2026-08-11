/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jni.h>
#include <stddef.h>

#ifdef JNI_MERGE_PRINT_ONLOAD
#ifdef __ANDROID__
#include <android/log.h>
#define JNI_MERGE_PRINT(...) \
  __android_log_print(ANDROID_LOG_DEBUG, "jni_lib_merge", __VA_ARGS__)
#else
#include <stdio.h>
#define JNI_MERGE_PRINT(...) fprintf(stderr, __VA_ARGS__);
#endif
#else
#define JNI_MERGE_PRINT(...) \
  do {                       \
  } while (0)
#endif

#ifdef __cplusplus
#define JNI_MERGE_GET_JAVA_VM(env, vm) (env->GetJavaVM(&vm))
#else
#define JNI_MERGE_GET_JAVA_VM(env, vm) ((*env)->GetJavaVM(env, &vm))
#endif

#if __has_attribute(__retain__)
#define ATTRIBUTE_RETAIN __attribute__((__retain__))
#else
#define ATTRIBUTE_RETAIN
#endif

struct pre_merge_jni_library {
  const char* name;
  int (*onload_func)(JNIEnv*, jclass);
};

#ifdef __cplusplus
extern "C" {
#endif
JNIEXPORT jint JNICALL JNI_OnLoad_Weak(JavaVM* vm, void* reserved);
#ifdef __cplusplus
}
#endif

#define JNI_OnLoad                                                             \
  /* Need to make JNI_OnLoad weak, which requires splitting it into */         \
  /* a declaration and definition, which is a little risky. */                 \
  /* Hopefully they didn't use 'extern "C"'. */                                \
  JNI_OnLoad_Weak(JavaVM* vm, void* reserved) __attribute__((weak));           \
                                                                               \
  /* We rename the declared JNI_OnLoad to this so we can call it */            \
  /* from either our weak JNI_OnLoad or our merge-friendly init function. */   \
  static jint pre_merge_original_JNI_OnLoad(JavaVM* vm, void* reserved);       \
                                                                               \
  /* Merge-friendly wrapper for the original JNI_OnLoad, called by JNI. */     \
  /* Return non-zero to indicate failure. */                                   \
  static inline jint pre_merge_jni_library_wrapper_for_JNI_OnLoad(             \
      JNIEnv* env, jclass clazz) {                                             \
    (void)clazz;                                                               \
    JNI_MERGE_PRINT("In JNI_OnLoad wrapper for %s", ORIGINAL_SONAME);          \
    /* Note: relying on SoLoader's synchronization for thread-safety. */       \
    static char already_loaded = 0;                                            \
    if (already_loaded) {                                                      \
      return 0;                                                                \
    }                                                                          \
    already_loaded = 1;                                                        \
    JavaVM* vm;                                                                \
    jint ret = JNI_MERGE_GET_JAVA_VM(env, vm);                                 \
    if (ret < 0) {                                                             \
      /* Exception already thrown. */                                          \
      return -1;                                                               \
    }                                                                          \
    JNI_MERGE_PRINT("Calling original JNI_OnLoad for %s", ORIGINAL_SONAME);    \
    ret = pre_merge_original_JNI_OnLoad(vm, NULL);                             \
    if (!(ret == JNI_VERSION_1_2 || ret == JNI_VERSION_1_4 ||                  \
          ret == JNI_VERSION_1_6)) {                                           \
      return -1;                                                               \
    }                                                                          \
    return 0;                                                                  \
  }                                                                            \
                                                                               \
  jint JNI_OnLoad_Weak(JavaVM* vm, void* reserved) {                           \
    /* This path will be taken if we're not merged. */                         \
    /* Just call the original JNI_OnLoad. */                                   \
    JNI_MERGE_PRINT(                                                           \
        "Calling original (unmerged) JNI_OnLoad for %s", ORIGINAL_SONAME);     \
    return pre_merge_original_JNI_OnLoad(vm, reserved);                        \
  }                                                                            \
                                                                               \
  /* Register our name and wrapper in the proper section. */                   \
  static struct pre_merge_jni_library pre_merge_jni_library_register_object    \
      ATTRIBUTE_RETAIN __attribute__((__section__("pre_merge_jni_libraries"))) \
      __attribute__((no_sanitize("address"))) __attribute__((__used__)) = {    \
          .name = ORIGINAL_SONAME,                                             \
          .onload_func = pre_merge_jni_library_wrapper_for_JNI_OnLoad,         \
  };                                                                           \
                                                                               \
  /* Re-start the JNI_OnLoad prototype to capture the body. */                 \
  static jint pre_merge_original_JNI_OnLoad
