/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * [Experimental] A per-request delivery gate applying simulated network
 * throttling for CDP debugging (`Network.emulateNetworkConditions`).
 *
 * Events (response headers, body chunks, completion) are enqueued in order
 * and delivered on the given serial queue once the shared throttling engine
 * releases them. Response bodies are re-chunked into packet-sized (1500 byte)
 * increments while download throttling is active.
 *
 * This is a helper class wrapping
 * `facebook::react::jsinspector_modern::NetworkThrottler`. In a production
 * (non dev or profiling) build, throttling is never active.
 */
@interface RCTInspectorNetworkEmulationGate : NSObject

/**
 * Whether new requests should be routed through a throttle gate: requires
 * the `fuseboxNetworkThrottlingEnabled` feature flag and active emulated
 * network conditions.
 */
+ (BOOL)isActive;

/**
 * Whether offline network emulation is currently active. Callers should fail
 * new requests with `NSURLErrorNotConnectedToInternet` without touching the
 * network.
 */
+ (BOOL)isOffline;

/**
 * \param deliveryQueue The serial queue on which delivery and failure blocks
 * are invoked.
 * \param onDisconnected Invoked at most once if the request is failed by
 * offline emulation mid-flight. Enqueued and undelivered events are dropped.
 */
- (instancetype)initWithDeliveryQueue:(dispatch_queue_t)deliveryQueue onDisconnected:(dispatch_block_t)onDisconnected;

/**
 * Record that the request has finished sending. The emulated latency floor
 * for the response stage is measured from this point.
 */
- (void)noteRequestSent;

/** Enqueue the response-headers event, subject to the emulated latency floor. */
- (void)throttleResponseDelivery:(dispatch_block_t)deliver;

/**
 * Enqueue a body data event, subject to download throughput emulation.
 * `deliver` may be invoked multiple times with successive subranges of
 * `data`.
 */
- (void)throttleDataDelivery:(NSData *)data deliver:(void (^)(NSData *chunk))deliver;

/** Enqueue the completion event, delivered after all preceding events. */
- (void)throttleCompletionDelivery:(dispatch_block_t)deliver;

/**
 * Cancel the gate: drop all queued events and detach from the throttling
 * engine. No further blocks are invoked.
 */
- (void)cancel;

@end

NS_ASSUME_NONNULL_END
