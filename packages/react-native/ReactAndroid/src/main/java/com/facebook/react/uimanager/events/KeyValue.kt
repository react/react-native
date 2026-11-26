/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.view.KeyCharacterMap
import android.view.KeyEvent as AndroidKeyEvent

/**
 * The [UI Events key value](https://www.w3.org/TR/uievents-key/) of an Android key event, with key
 * codes paired to key values as Firefox for Android pairs them
 * ([NativeKeyToDOMKeyName.h](https://searchfox.org/mozilla-central/source/widget/NativeKeyToDOMKeyName.h)).
 */
internal object KeyValue {

  fun of(event: AndroidKeyEvent): String = of(event.keyCode, typedCharacter(event))

  /** The key value of the key [keyCode] when it types [character], as [typedCharacter] reads it. */
  fun of(keyCode: Int, character: Int): String =
      when {
        isDeadKey(character) -> DEAD
        character != 0 && !Character.isISOControl(character) -> String(Character.toChars(character))
        else -> NAMED_KEYS[keyCode] ?: UNIDENTIFIED
      }

  /**
   * The character [event] types with Control and Meta released, and with Alt released too when Alt
   * types nothing on the layout, because the key value of a shortcut such as Ctrl+Z or Alt+E is the
   * character of its key.
   */
  fun typedCharacter(event: AndroidKeyEvent): Int {
    val character = event.getUnicodeChar(event.metaState and SHORTCUT_MODIFIERS.inv())
    return if (character != 0 || !event.isAltPressed) {
      character
    } else {
      event.getUnicodeChar(event.metaState and (SHORTCUT_MODIFIERS or ALT_MODIFIERS).inv())
    }
  }

  fun isDeadKey(character: Int): Boolean = (character and KeyCharacterMap.COMBINING_ACCENT) != 0

  private const val SHORTCUT_MODIFIERS: Int =
      AndroidKeyEvent.META_CTRL_MASK or AndroidKeyEvent.META_META_MASK
  private const val ALT_MODIFIERS: Int = AndroidKeyEvent.META_ALT_MASK
  private const val DEAD: String = "Dead"
  private const val UNIDENTIFIED: String = "Unidentified"

  private val NAMED_KEYS: Map<Int, String> by
      lazy(LazyThreadSafetyMode.PUBLICATION) {
        mapOf(
            AndroidKeyEvent.KEYCODE_ALT_LEFT to "Alt",
            AndroidKeyEvent.KEYCODE_ALT_RIGHT to "Alt",
            AndroidKeyEvent.KEYCODE_CAPS_LOCK to "CapsLock",
            AndroidKeyEvent.KEYCODE_CTRL_LEFT to "Control",
            AndroidKeyEvent.KEYCODE_CTRL_RIGHT to "Control",
            AndroidKeyEvent.KEYCODE_FUNCTION to "Fn",
            AndroidKeyEvent.KEYCODE_META_LEFT to "Meta",
            AndroidKeyEvent.KEYCODE_META_RIGHT to "Meta",
            AndroidKeyEvent.KEYCODE_NUM_LOCK to "NumLock",
            AndroidKeyEvent.KEYCODE_SCROLL_LOCK to "ScrollLock",
            AndroidKeyEvent.KEYCODE_SHIFT_LEFT to "Shift",
            AndroidKeyEvent.KEYCODE_SHIFT_RIGHT to "Shift",
            AndroidKeyEvent.KEYCODE_SYM to "Symbol",
            AndroidKeyEvent.KEYCODE_DPAD_CENTER to "Enter",
            AndroidKeyEvent.KEYCODE_ENTER to "Enter",
            AndroidKeyEvent.KEYCODE_NUMPAD_ENTER to "Enter",
            AndroidKeyEvent.KEYCODE_TAB to "Tab",
            AndroidKeyEvent.KEYCODE_DPAD_DOWN to "ArrowDown",
            AndroidKeyEvent.KEYCODE_DPAD_LEFT to "ArrowLeft",
            AndroidKeyEvent.KEYCODE_DPAD_RIGHT to "ArrowRight",
            AndroidKeyEvent.KEYCODE_DPAD_UP to "ArrowUp",
            AndroidKeyEvent.KEYCODE_MOVE_END to "End",
            AndroidKeyEvent.KEYCODE_MOVE_HOME to "Home",
            AndroidKeyEvent.KEYCODE_PAGE_DOWN to "PageDown",
            AndroidKeyEvent.KEYCODE_PAGE_UP to "PageUp",
            AndroidKeyEvent.KEYCODE_DEL to "Backspace",
            AndroidKeyEvent.KEYCODE_CLEAR to "Clear",
            AndroidKeyEvent.KEYCODE_COPY to "Copy",
            AndroidKeyEvent.KEYCODE_CUT to "Cut",
            AndroidKeyEvent.KEYCODE_FORWARD_DEL to "Delete",
            AndroidKeyEvent.KEYCODE_INSERT to "Insert",
            AndroidKeyEvent.KEYCODE_PASTE to "Paste",
            AndroidKeyEvent.KEYCODE_MENU to "ContextMenu",
            AndroidKeyEvent.KEYCODE_ESCAPE to "Escape",
            AndroidKeyEvent.KEYCODE_HELP to "Help",
            AndroidKeyEvent.KEYCODE_BREAK to "Pause",
            AndroidKeyEvent.KEYCODE_ZOOM_IN to "ZoomIn",
            AndroidKeyEvent.KEYCODE_ZOOM_OUT to "ZoomOut",
            AndroidKeyEvent.KEYCODE_BRIGHTNESS_DOWN to "BrightnessDown",
            AndroidKeyEvent.KEYCODE_BRIGHTNESS_UP to "BrightnessUp",
            AndroidKeyEvent.KEYCODE_MEDIA_EJECT to "Eject",
            AndroidKeyEvent.KEYCODE_POWER to "Power",
            AndroidKeyEvent.KEYCODE_SYSRQ to "PrintScreen",
            AndroidKeyEvent.KEYCODE_SLEEP to "Standby",
            AndroidKeyEvent.KEYCODE_WAKEUP to "WakeUp",
            AndroidKeyEvent.KEYCODE_HENKAN to "Convert",
            AndroidKeyEvent.KEYCODE_LANGUAGE_SWITCH to "GroupNext",
            AndroidKeyEvent.KEYCODE_SWITCH_CHARSET to "ModeChange",
            AndroidKeyEvent.KEYCODE_MUHENKAN to "NonConvert",
            AndroidKeyEvent.KEYCODE_EISU to "Eisu",
            AndroidKeyEvent.KEYCODE_KATAKANA_HIRAGANA to "HiraganaKatakana",
            AndroidKeyEvent.KEYCODE_KANA to "KanjiMode",
            AndroidKeyEvent.KEYCODE_ZENKAKU_HANKAKU to "ZenkakuHankaku",
            AndroidKeyEvent.KEYCODE_F1 to "F1",
            AndroidKeyEvent.KEYCODE_F2 to "F2",
            AndroidKeyEvent.KEYCODE_F3 to "F3",
            AndroidKeyEvent.KEYCODE_F4 to "F4",
            AndroidKeyEvent.KEYCODE_F5 to "F5",
            AndroidKeyEvent.KEYCODE_F6 to "F6",
            AndroidKeyEvent.KEYCODE_F7 to "F7",
            AndroidKeyEvent.KEYCODE_F8 to "F8",
            AndroidKeyEvent.KEYCODE_F9 to "F9",
            AndroidKeyEvent.KEYCODE_F10 to "F10",
            AndroidKeyEvent.KEYCODE_F11 to "F11",
            AndroidKeyEvent.KEYCODE_F12 to "F12",
            AndroidKeyEvent.KEYCODE_CHANNEL_DOWN to "ChannelDown",
            AndroidKeyEvent.KEYCODE_CHANNEL_UP to "ChannelUp",
            AndroidKeyEvent.KEYCODE_MEDIA_FAST_FORWARD to "MediaFastForward",
            AndroidKeyEvent.KEYCODE_MEDIA_PAUSE to "MediaPause",
            AndroidKeyEvent.KEYCODE_MEDIA_PLAY to "MediaPlay",
            AndroidKeyEvent.KEYCODE_MEDIA_PLAY_PAUSE to "MediaPlayPause",
            AndroidKeyEvent.KEYCODE_MEDIA_RECORD to "MediaRecord",
            AndroidKeyEvent.KEYCODE_MEDIA_REWIND to "MediaRewind",
            AndroidKeyEvent.KEYCODE_MEDIA_STOP to "MediaStop",
            AndroidKeyEvent.KEYCODE_MEDIA_NEXT to "MediaTrackNext",
            AndroidKeyEvent.KEYCODE_MEDIA_PREVIOUS to "MediaTrackPrevious",
            AndroidKeyEvent.KEYCODE_VOLUME_DOWN to "AudioVolumeDown",
            AndroidKeyEvent.KEYCODE_VOLUME_UP to "AudioVolumeUp",
            AndroidKeyEvent.KEYCODE_VOLUME_MUTE to "AudioVolumeMute",
            AndroidKeyEvent.KEYCODE_MUTE to "MicrophoneVolumeMute",
            AndroidKeyEvent.KEYCODE_CALCULATOR to "LaunchCalculator",
            AndroidKeyEvent.KEYCODE_CALENDAR to "LaunchCalendar",
            AndroidKeyEvent.KEYCODE_CONTACTS to "LaunchContacts",
            AndroidKeyEvent.KEYCODE_ENVELOPE to "LaunchMail",
            AndroidKeyEvent.KEYCODE_MUSIC to "LaunchMusicPlayer",
            AndroidKeyEvent.KEYCODE_EXPLORER to "LaunchWebBrowser",
            AndroidKeyEvent.KEYCODE_BOOKMARK to "BrowserFavorites",
            AndroidKeyEvent.KEYCODE_FORWARD to "BrowserForward",
            AndroidKeyEvent.KEYCODE_SEARCH to "BrowserSearch",
            AndroidKeyEvent.KEYCODE_APP_SWITCH to "AppSwitch",
            AndroidKeyEvent.KEYCODE_CALL to "Call",
            AndroidKeyEvent.KEYCODE_CAMERA to "Camera",
            AndroidKeyEvent.KEYCODE_FOCUS to "CameraFocus",
            AndroidKeyEvent.KEYCODE_ENDCALL to "EndCall",
            AndroidKeyEvent.KEYCODE_BACK to "GoBack",
            AndroidKeyEvent.KEYCODE_HOME to "GoHome",
            AndroidKeyEvent.KEYCODE_HEADSETHOOK to "HeadsetHook",
            AndroidKeyEvent.KEYCODE_NOTIFICATION to "Notification",
            AndroidKeyEvent.KEYCODE_MANNER_MODE to "MannerMode",
            AndroidKeyEvent.KEYCODE_TV to "TV",
            AndroidKeyEvent.KEYCODE_3D_MODE to "TV3DMode",
            AndroidKeyEvent.KEYCODE_TV_ANTENNA_CABLE to "TVAntennaCable",
            AndroidKeyEvent.KEYCODE_TV_AUDIO_DESCRIPTION to "TVAudioDescription",
            AndroidKeyEvent.KEYCODE_TV_AUDIO_DESCRIPTION_MIX_DOWN to "TVAudioDescriptionMixDown",
            AndroidKeyEvent.KEYCODE_TV_AUDIO_DESCRIPTION_MIX_UP to "TVAudioDescriptionMixUp",
            AndroidKeyEvent.KEYCODE_TV_CONTENTS_MENU to "TVContentsMenu",
            AndroidKeyEvent.KEYCODE_TV_DATA_SERVICE to "TVDataService",
            AndroidKeyEvent.KEYCODE_TV_INPUT to "TVInput",
            AndroidKeyEvent.KEYCODE_TV_INPUT_COMPONENT_1 to "TVInputComponent1",
            AndroidKeyEvent.KEYCODE_TV_INPUT_COMPONENT_2 to "TVInputComponent2",
            AndroidKeyEvent.KEYCODE_TV_INPUT_COMPOSITE_1 to "TVInputComposite1",
            AndroidKeyEvent.KEYCODE_TV_INPUT_COMPOSITE_2 to "TVInputComposite2",
            AndroidKeyEvent.KEYCODE_TV_INPUT_HDMI_1 to "TVInputHDMI1",
            AndroidKeyEvent.KEYCODE_TV_INPUT_HDMI_2 to "TVInputHDMI2",
            AndroidKeyEvent.KEYCODE_TV_INPUT_HDMI_3 to "TVInputHDMI3",
            AndroidKeyEvent.KEYCODE_TV_INPUT_HDMI_4 to "TVInputHDMI4",
            AndroidKeyEvent.KEYCODE_TV_INPUT_VGA_1 to "TVInputVGA1",
            AndroidKeyEvent.KEYCODE_TV_NETWORK to "TVNetwork",
            AndroidKeyEvent.KEYCODE_TV_NUMBER_ENTRY to "TVNumberEntry",
            AndroidKeyEvent.KEYCODE_TV_POWER to "TVPower",
            AndroidKeyEvent.KEYCODE_TV_RADIO_SERVICE to "TVRadioService",
            AndroidKeyEvent.KEYCODE_TV_SATELLITE to "TVSatellite",
            AndroidKeyEvent.KEYCODE_TV_SATELLITE_BS to "TVSatelliteBS",
            AndroidKeyEvent.KEYCODE_TV_SATELLITE_CS to "TVSatelliteCS",
            AndroidKeyEvent.KEYCODE_TV_SATELLITE_SERVICE to "TVSatelliteToggle",
            AndroidKeyEvent.KEYCODE_TV_TERRESTRIAL_ANALOG to "TVTerrestrialAnalog",
            AndroidKeyEvent.KEYCODE_TV_TERRESTRIAL_DIGITAL to "TVTerrestrialDigital",
            AndroidKeyEvent.KEYCODE_TV_TIMER_PROGRAMMING to "TVTimer",
            AndroidKeyEvent.KEYCODE_AVR_INPUT to "AVRInput",
            AndroidKeyEvent.KEYCODE_AVR_POWER to "AVRPower",
            AndroidKeyEvent.KEYCODE_PROG_RED to "ColorF0Red",
            AndroidKeyEvent.KEYCODE_PROG_GREEN to "ColorF1Green",
            AndroidKeyEvent.KEYCODE_PROG_YELLOW to "ColorF2Yellow",
            AndroidKeyEvent.KEYCODE_PROG_BLUE to "ColorF3Blue",
            AndroidKeyEvent.KEYCODE_CAPTIONS to "ClosedCaptionToggle",
            AndroidKeyEvent.KEYCODE_DVR to "DVR",
            AndroidKeyEvent.KEYCODE_GUIDE to "Guide",
            AndroidKeyEvent.KEYCODE_INFO to "Info",
            AndroidKeyEvent.KEYCODE_MEDIA_AUDIO_TRACK to "MediaAudioTrack",
            AndroidKeyEvent.KEYCODE_LAST_CHANNEL to "MediaLast",
            AndroidKeyEvent.KEYCODE_MEDIA_TOP_MENU to "MediaTopMenu",
            AndroidKeyEvent.KEYCODE_MEDIA_SKIP_BACKWARD to "MediaSkipBackward",
            AndroidKeyEvent.KEYCODE_MEDIA_SKIP_FORWARD to "MediaSkipForward",
            AndroidKeyEvent.KEYCODE_MEDIA_STEP_BACKWARD to "MediaStepBackward",
            AndroidKeyEvent.KEYCODE_MEDIA_STEP_FORWARD to "MediaStepForward",
            AndroidKeyEvent.KEYCODE_NAVIGATE_IN to "NavigateIn",
            AndroidKeyEvent.KEYCODE_NAVIGATE_NEXT to "NavigateNext",
            AndroidKeyEvent.KEYCODE_NAVIGATE_OUT to "NavigateOut",
            AndroidKeyEvent.KEYCODE_NAVIGATE_PREVIOUS to "NavigatePrevious",
            AndroidKeyEvent.KEYCODE_PAIRING to "Pairing",
            AndroidKeyEvent.KEYCODE_WINDOW to "PinPToggle",
            AndroidKeyEvent.KEYCODE_SETTINGS to "Settings",
            AndroidKeyEvent.KEYCODE_STB_INPUT to "STBInput",
            AndroidKeyEvent.KEYCODE_STB_POWER to "STBPower",
            AndroidKeyEvent.KEYCODE_TV_TELETEXT to "Teletext",
            AndroidKeyEvent.KEYCODE_TV_ZOOM_MODE to "ZoomToggle",
            AndroidKeyEvent.KEYCODE_SOFT_LEFT to "SoftLeft",
            AndroidKeyEvent.KEYCODE_SOFT_RIGHT to "SoftRight",
        )
      }
}
