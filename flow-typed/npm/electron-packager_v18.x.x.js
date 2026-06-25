/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

declare module '@electron/packager' {
  declare export type AsarOptions = $FlowFixMe;

  declare export type ElectronDownloadRequestOptions = $FlowFixMe;

  declare export type TargetDefinition = {
    arch: TargetArch,
    platform: TargetPlatform,
  };

  declare export type FinalizePackageTargetsHookFunction = (
    targets: TargetDefinition[],
    callback: HookFunctionErrorCallback,
  ) => void;

  declare export type HookFunction = (
    buildPath: string,
    electronVersion: string,
    platform: TargetPlatform,
    arch: TargetArch,
    callback: HookFunctionErrorCallback,
  ) => void;

  declare export type IgnoreFunction = (path: string) => boolean;

  declare export type HookFunctionErrorCallback = (err?: Error | null) => void;

  declare export interface MacOSProtocol {
    name: string;
    schemes: string[];
  }

  declare export type NotaryToolCredentials = $FlowFixMe;

  declare export type OsxSignOptions = $FlowFixMe;

  declare export type OsxUniversalOptions = $FlowFixMe;

  declare export type Win32MetadataOptions = Readonly<{
    CompanyName?: string,
    FileDescription?: string,
    OriginalFilename?: string,
    ProductName?: string,
    InternalName?: string,
    'requested-execution-level'?:
      | 'asInvoker'
      | 'highestAvailable'
      | 'requireAdministrator',
    'application-manifest'?: string,
  }>;

  declare export type WindowsSignOptions = $FlowFixMe;

  declare export type OfficialArch =
    | 'ia32'
    | 'x64'
    | 'armv7l'
    | 'arm64'
    | 'mips64el'
    | 'universal';

  declare export type OfficialPlatform = 'linux' | 'win32' | 'darwin' | 'mas';

  declare export type TargetArch = OfficialArch | string;

  declare export type TargetPlatform = OfficialPlatform | string;

  declare export type ArchOption = TargetArch | 'all';

  declare export type PlatformOption = TargetPlatform | 'all';

  declare export interface Options {
    dir: string;
    afterAsar?: HookFunction[];
    afterComplete?: HookFunction[];
    afterCopy?: HookFunction[];
    afterCopyExtraResources?: HookFunction[];
    afterExtract?: HookFunction[];
    afterFinalizePackageTargets?: FinalizePackageTargetsHookFunction[];
    afterInitialize?: HookFunction[];
    afterPrune?: HookFunction[];
    all?: boolean;
    appBundleId?: string;
    appCategoryType?: string;
    appCopyright?: string;
    appVersion?: string;
    arch?: ArchOption | ArchOption[];
    asar?: boolean | AsarOptions;
    beforeAsar?: HookFunction[];
    beforeCopy?: HookFunction[];
    beforeCopyExtraResources?: HookFunction[];
    buildVersion?: string;
    darwinDarkModeSupport?: boolean;
    derefSymlinks?: boolean;
    download?: ElectronDownloadRequestOptions;
    electronVersion?: string;
    electronZipDir?: string;
    executableName?: string;
    extendHelperInfo?:
      | string
      | {
          [property: string]: any,
        };
    extendInfo?:
      | string
      | {
          [property: string]: any,
        };
    extraResource?: string | string[];
    helperBundleId?: string;
    icon?: string;
    ignore?: RegExp | (string | RegExp)[] | IgnoreFunction;
    junk?: boolean;
    name?: string;
    osxNotarize?: NotaryToolCredentials;
    osxSign?: true | OsxSignOptions;
    osxUniversal?: OsxUniversalOptions;
    out?: string;
    overwrite?: boolean;
    platform?: TargetPlatform | 'all' | Array<TargetPlatform | 'all'>;
    prebuiltAsar?: string;
    protocols?: MacOSProtocol[];
    prune?: boolean;
    quiet?: boolean;
    tmpdir?: string | false;
    usageDescription?: {
      [property: string]: string,
    };
    win32metadata?: Win32MetadataOptions;
    windowsSign?: true | WindowsSignOptions;
  }

  declare function packager(options: Options): Promise<string[]>;

  declare module.exports: typeof packager & {
    packager: typeof packager,
    default: typeof packager,
  };
}
