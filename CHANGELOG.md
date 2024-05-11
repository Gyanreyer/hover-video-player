# Changelog

## v1.2.4

- Fix to ensure components will respect any initial `data-playback-state` attribute value
  - This means autoplay-like behavior can be achieved by setting `data-playback-state="playing"` in your HTML
- Tightens up quirky behavior where duplicate `hoverstart` events could be emitted on mobile

## v1.2.3

- Fix `hoverstart` and `hoverend` events not being emitted when the component is controlled; the events should fire but just be automatically canceled to leave playback state updates to the implementer
- Make `hoverstart` and `hoverend` events include the originating `Event` object on their `detail`

## v1.2.2

- Makes `hoverstart` and `hoverend` events cancelable for more options with controlling playback
- Allows `hoverstart` and `hoverend` events to still be emitted when the component is controlled; the component just won't update playback state in response to these events

## v1.2.1

- Adds `playbackstatechanged` event
- Tightens up internal playback state update logic

## v1.2.0

- Adds `controlled` attribute to enable controlling playback with external JS only
- Adds `hover` and `blur` methods which can be called to programmatically start/stop playback
- Makes component state response to external updates to `data-playback-state` attribute as another means of controlling playback state
