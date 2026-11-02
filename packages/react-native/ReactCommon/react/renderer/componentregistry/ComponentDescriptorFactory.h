/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <memory>

#include <React/RendererCore.h>
#include <React/Utils.h>

#include <React/ComponentRegistry.h>

namespace facebook::react {

/**
 * A factory to provide hosting app specific set of ComponentDescriptor's.
 * Each app must provide an implementation of the static class method which
 * should register its specific set of supported components.
 */
using ComponentRegistryFactory = std::function<SharedComponentDescriptorRegistry(
    const EventDispatcher::Weak &eventDispatcher,
    const std::shared_ptr<const ContextContainer> &contextContainer)>;

ComponentRegistryFactory getDefaultComponentRegistryFactory();

} // namespace facebook::react
