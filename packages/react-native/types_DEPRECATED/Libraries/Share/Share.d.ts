/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {ColorValue} from '../StyleSheet/StyleSheet';

export type ShareContent =
  | {
      title?: string | undefined;
      url: string;
      message?: string | undefined;
    }
  | {
      title?: string | undefined;
      url?: string | undefined;
      message: string;
    };

export type ShareOptions = {
  dialogTitle?: string | undefined;
  excludedActivityTypes?: Array<string> | undefined;
  tintColor?: ColorValue | undefined;
  subject?: string | undefined;
  anchor?: number | undefined;
};

export type ShareAction = {
  action: 'sharedAction' | 'dismissedAction';
  activityType?: string | null | undefined;
};

export interface ShareStatic {
  /**
   * Open a dialog to share text content.
   *
   * In iOS, Returns a Promise which will be invoked an object containing `action`, `activityType`.
   * If the user dismissed the dialog, the Promise will still be resolved with action being `Share.dismissedAction`
   * and all the other keys being undefined.
   *
   * In Android, Returns a Promise which always resolves with action being `Share.sharedAction`.
   *
   * ### Content
   *
   * #### iOS
   *
   *  - `url` - a URL to share
   *  - `message` - a message to share
   *
   * At least one of `URL` or `message` is required.
   *
   * #### Android
   *
   * - `title` - title of the message (optional)
   * - `message` - a message to share (often will include a URL).
   *
   * ### Options
   *
   * #### iOS
   *
   *  - `subject` - a subject to share via email
   *  - `excludedActivityTypes`
   *  - `tintColor`
   *
   * #### Android
   *
   *  - `dialogTitle`
   *
   */
  share(content: ShareContent, options?: ShareOptions): Promise<ShareAction>;
  sharedAction: 'sharedAction';
  dismissedAction: 'dismissedAction';
}

export const Share: ShareStatic;
export type Share = ShareStatic;
