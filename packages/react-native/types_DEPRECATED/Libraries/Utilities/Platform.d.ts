/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * @see https://reactnative.dev/docs/platform-specific-code#content
 */
export type PlatformOSType =
  'ios' | 'android' | 'macos' | 'windows' | 'web' | 'native';
type PlatformConstants = {
  isTesting: boolean;
  isDisableAnimations?: boolean | undefined;
  reactNativeVersion: {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string | null | undefined;
  };
};
interface PlatformStatic {
  isTV: boolean;
  isTesting: boolean;
  Version: number | string;
  constants: PlatformConstants;

  /**
   * @see https://reactnative.dev/docs/platform-specific-code#content
   */
  select<T>(
    specifics:
      | ({[platform in PlatformOSType]?: T} & {default: T})
      | {[platform in PlatformOSType]: T},
  ): T;
  select<T>(specifics: {[platform in PlatformOSType]?: T}): T | undefined;
}

interface PlatformIOSStatic extends PlatformStatic {
  constants: PlatformConstants & {
    forceTouchAvailable: boolean;
    interfaceIdiom: string;
    osVersion: string;
    systemName: string;
    isMacCatalyst?: boolean | undefined;
  };
  OS: 'ios';
  isPad: boolean;
  isTV: boolean;
  isVision: boolean;
  isMacCatalyst?: boolean | undefined;
  Version: string;
}

interface PlatformAndroidStatic extends PlatformStatic {
  constants: PlatformConstants & {
    Version: number;
    Release: string;
    Serial: string;
    Fingerprint: string;
    Model: string;
    Brand: string;
    Manufacturer: string;
    ServerHost?: string | undefined;
    uiMode: 'car' | 'desk' | 'normal' | 'tv' | 'watch' | 'unknown';
  };
  OS: 'android';
  Version: number;
}

interface PlatformMacOSStatic extends PlatformStatic {
  OS: 'macos';
  Version: string;
  constants: PlatformConstants & {
    osVersion: string;
  };
}

interface PlatformWindowsOSStatic extends PlatformStatic {
  OS: 'windows';
  Version: number;
  constants: PlatformConstants & {
    osVersion: number;
  };
}

interface PlatformWebStatic extends PlatformStatic {
  OS: 'web';
  Version: string;
}

export type Platform =
  | PlatformIOSStatic
  | PlatformAndroidStatic
  | PlatformWindowsOSStatic
  | PlatformMacOSStatic
  | PlatformWebStatic;

export const Platform: Platform;
