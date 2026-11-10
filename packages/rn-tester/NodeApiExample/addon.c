/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <node_api.h>
#include <pthread.h>
#include <stdatomic.h>
#include <stdlib.h>

#define CHECK(call)                                     \
  do {                                                  \
    if ((call) != napi_ok) {                            \
      napi_throw_error(env, NULL, #call " failed");     \
      return NULL;                                      \
    }                                                   \
  } while (0)

// Process-global, so they survive a reload and show whether the previous
// runtime's envs were cleaned up.
static atomic_int envsCreated = 0;
static atomic_int envsCleanedUp = 0;

static void onEnvCleanup(void *arg) {
  (void)arg;
  atomic_fetch_add(&envsCleanedUp, 1);
}

static napi_value Hello(napi_env env, napi_callback_info info) {
  (void)info;
  napi_value result;
  CHECK(napi_create_string_utf8(
      env, "Hello from Node-API", NAPI_AUTO_LENGTH, &result));
  return result;
}

static napi_value Add(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL));
  double a = 0;
  double b = 0;
  CHECK(napi_get_value_double(env, argv[0], &a));
  CHECK(napi_get_value_double(env, argv[1], &b));
  napi_value result;
  CHECK(napi_create_double(env, a + b, &result));
  return result;
}

typedef struct {
  double input;
  double output;
  napi_deferred deferred;
  napi_async_work work;
} SquareWork;

static void squareExecute(napi_env env, void *data) {
  (void)env;
  SquareWork *work = data;
  work->output = work->input * work->input;
}

static void squareComplete(napi_env env, napi_status status, void *data) {
  SquareWork *work = data;
  napi_value result;
  if (status == napi_ok &&
      napi_create_double(env, work->output, &result) == napi_ok) {
    napi_resolve_deferred(env, work->deferred, result);
  } else {
    napi_value message;
    napi_value error;
    napi_create_string_utf8(
        env, "Async work failed", NAPI_AUTO_LENGTH, &message);
    napi_create_error(env, NULL, message, &error);
    napi_reject_deferred(env, work->deferred, error);
  }
  napi_delete_async_work(env, work->work);
  free(work);
}

static napi_value SquareAsync(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL));
  SquareWork *work = calloc(1, sizeof(SquareWork));
  CHECK(napi_get_value_double(env, argv[0], &work->input));
  napi_value promise;
  CHECK(napi_create_promise(env, &work->deferred, &promise));
  napi_value name;
  CHECK(napi_create_string_utf8(env, "squareAsync", NAPI_AUTO_LENGTH, &name));
  CHECK(napi_create_async_work(
      env, NULL, name, squareExecute, squareComplete, work, &work->work));
  CHECK(napi_queue_async_work(env, work->work));
  return promise;
}

typedef struct {
  napi_threadsafe_function tsfn;
  int count;
} TickThread;

static void callTick(
    napi_env env,
    napi_value callback,
    void *context,
    void *data) {
  (void)context;
  int *value = data;
  if (env != NULL) {
    napi_value undefined;
    napi_value arg;
    napi_get_undefined(env, &undefined);
    napi_create_int32(env, *value, &arg);
    napi_call_function(env, undefined, callback, 1, &arg, NULL);
  }
  free(value);
}

static void *tickThreadMain(void *arg) {
  TickThread *thread = arg;
  for (int i = 1; i <= thread->count; i++) {
    int *value = malloc(sizeof(int));
    *value = i;
    napi_call_threadsafe_function(thread->tsfn, value, napi_tsfn_blocking);
  }
  napi_release_threadsafe_function(thread->tsfn, napi_tsfn_release);
  free(thread);
  return NULL;
}

// Calls `callback(i)` for i in 1..count from a separate thread.
static napi_value TickFromThread(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  CHECK(napi_get_cb_info(env, info, &argc, argv, NULL, NULL));
  TickThread *thread = calloc(1, sizeof(TickThread));
  CHECK(napi_get_value_int32(env, argv[0], &thread->count));
  napi_value name;
  CHECK(napi_create_string_utf8(
      env, "tickFromThread", NAPI_AUTO_LENGTH, &name));
  CHECK(napi_create_threadsafe_function(
      env,
      argv[1],
      NULL,
      name,
      0,
      1,
      NULL,
      NULL,
      NULL,
      callTick,
      &thread->tsfn));
  pthread_t pthread;
  pthread_create(&pthread, NULL, tickThreadMain, thread);
  pthread_detach(pthread);
  return NULL;
}

static napi_value EnvStats(napi_env env, napi_callback_info info) {
  (void)info;
  napi_value result;
  napi_value created;
  napi_value cleanedUp;
  CHECK(napi_create_object(env, &result));
  CHECK(napi_create_int32(env, atomic_load(&envsCreated), &created));
  CHECK(napi_create_int32(env, atomic_load(&envsCleanedUp), &cleanedUp));
  CHECK(napi_set_named_property(env, result, "created", created));
  CHECK(napi_set_named_property(env, result, "cleanedUp", cleanedUp));
  return result;
}

NAPI_MODULE_INIT() {
  atomic_fetch_add(&envsCreated, 1);
  CHECK(napi_add_env_cleanup_hook(env, onEnvCleanup, NULL));
  napi_property_descriptor properties[] = {
      {"hello", NULL, Hello, NULL, NULL, NULL, napi_default, NULL},
      {"add", NULL, Add, NULL, NULL, NULL, napi_default, NULL},
      {"squareAsync", NULL, SquareAsync, NULL, NULL, NULL, napi_default, NULL},
      {"tickFromThread",
       NULL,
       TickFromThread,
       NULL,
       NULL,
       NULL,
       napi_default,
       NULL},
      {"envStats", NULL, EnvStats, NULL, NULL, NULL, napi_default, NULL},
  };
  CHECK(napi_define_properties(
      env, exports, sizeof(properties) / sizeof(properties[0]), properties));
  return exports;
}
