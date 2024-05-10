# Changelog

## v1.2.1

- Adds `playbackstatechanged` event
- Tightens up internal playback state update logic

## v1.2.0

- Adds `controlled` attribute to enable controlling playback with external JS only
- Adds `hover` and `blur` methods which can be called to programmatically start/stop playback
- Makes component state response to external updates to `data-playback-state` attribute as another means of controlling playback state
