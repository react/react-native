/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

// TODO: Use proper enum types.
export type PermissionStatus = string;
export type PermissionType = string;

/*
export type PermissionStatus = 'granted' | 'denied' | 'never_ask_again';
export type PermissionType =
  | 'android.permission.READ_CALENDAR'
  | 'android.permission.WRITE_CALENDAR'
  | 'android.permission.CAMERA'
  | 'android.permission.READ_CONTACTS'
  | 'android.permission.WRITE_CONTACTS'
  | 'android.permission.GET_ACCOUNTS'
  | 'android.permission.ACCESS_BACKGROUND_LOCATION'
  | 'android.permission.ACCESS_FINE_LOCATION'
  | 'android.permission.ACCESS_COARSE_LOCATION'
  | 'android.permission.RECORD_AUDIO'
  | 'android.permission.READ_PHONE_STATE'
  | 'android.permission.CALL_PHONE'
  | 'android.permission.READ_CALL_LOG'
  | 'android.permission.WRITE_CALL_LOG'
  | 'com.android.voicemail.permission.ADD_VOICEMAIL'
  | 'com.android.voicemail.permission.READ_VOICEMAIL'
  | 'com.android.voicemail.permission.WRITE_VOICEMAIL'
  | 'android.permission.USE_SIP'
  | 'android.permission.PROCESS_OUTGOING_CALLS'
  | 'android.permission.BODY_SENSORS'
  | 'android.permission.BODY_SENSORS_BACKGROUND'
  | 'android.permission.SEND_SMS'
  | 'android.permission.RECEIVE_SMS'
  | 'android.permission.READ_SMS'
  | 'android.permission.RECEIVE_WAP_PUSH'
  | 'android.permission.RECEIVE_MMS'
  | 'android.permission.READ_EXTERNAL_STORAGE'
  | 'android.permission.READ_MEDIA_IMAGES'
  | 'android.permission.READ_MEDIA_VIDEO'
  | 'android.permission.READ_MEDIA_AUDIO'
  | 'android.permission.READ_MEDIA_VISUAL_USER_SELECTED'
  | 'android.permission.WRITE_EXTERNAL_STORAGE'
  | 'android.permission.BLUETOOTH_CONNECT'
  | 'android.permission.BLUETOOTH_SCAN'
  | 'android.permission.BLUETOOTH_ADVERTISE'
  | 'android.permission.ACCESS_MEDIA_LOCATION'
  | 'android.permission.ACCEPT_HANDOVER'
  | 'android.permission.ACTIVITY_RECOGNITION'
  | 'android.permission.ANSWER_PHONE_CALLS'
  | 'android.permission.READ_PHONE_NUMBERS'
  | 'android.permission.UWB_RANGING'
  | 'android.permission.POST_NOTIFICATIONS'
  | 'android.permission.NEARBY_WIFI_DEVICES';
  */

export interface Spec extends TurboModule {
  readonly checkPermission: (permission: PermissionType) => Promise<boolean>;
  readonly requestPermission: (
    permission: PermissionType,
  ) => Promise<PermissionStatus>;
  readonly shouldShowRequestPermissionRationale: (
    permission: string,
  ) => Promise<boolean>;
  readonly requestMultiplePermissions: (
    permissions: Array<PermissionType>,
  ) => Promise<{[permission: PermissionType]: PermissionStatus, ...}>;
}

export default TurboModuleRegistry.get<Spec>('PermissionsAndroid') as ?Spec;
