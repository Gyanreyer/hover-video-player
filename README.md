# hover-video-player

A web component that helps make it easy to set up videos which play when the user hovers over them.

This is particularly useful for the common user experience pattern where a page may have a thumbnail which plays a video preview when the user hovers over it.

This is a port of the [react-hover-video-player library](https://github.com/Gyanreyer/react-hover-video-player) which should be broadly compatible with Svelte, Vue, vanilla HTML, or any other library/framework which supports web components!

**[Play with a real working example on CodeSandbox.](https://codesandbox.io/s/hover-video-player-example-pcw27m?file=/index.html)**

## Features

- Support for mouse, touchscreen, and keyboard focus interactions
- Built-in support for thumbnails and loading states
- Adds handling for weird edge cases that can arise when managing video playback, such as gracefully falling back to playing the video without sound if the browser's autoplay policy blocks un-muted playback
- Supports HTMLMediaElement API-compliant custom elements, allowing for use of other media sources like YouTube, Vimeo, and HLS

## Installation

### package managers

- `npm install hover-video-player`
- `yarn add hover-video-player`

### cdn

- esm build (recommended): `<script type="module" src="https://unpkg.com/hover-video-player" />`
- iife build: `<script src="https://unpkg.com/hover-video-player/dist/index.client.js" />`

## Usage

All you need to do is import this library into your site/app and it will register a `hover-video-player` custom element which you can now use.

### Examples

<details open>
  <summary>Vanilla HTML</summary>

  ```html
  <!-- index.html -->
  <html>
    <head>
      <style>
        hover-video-player:not(:defined) {
          /* Hide the hover-video-player element until the component is loaded and defined
              so we can avoid getting a flash of unstyled content */
          display: none;
        }

        hover-video-player img[slot="paused-overlay"] {
          object-fit: cover;
        }
      </style>
      <script type="module" src="https://unpkg.com/hover-video-player"></script>
    </head>
    <body>
      <hover-video-player>
        <video src="path/to/video.mp4" muted loop playsinline></video>
        <img
          src="path/to/thumbnail.jpg"
          slot="paused-overlay"
        />
      </hover-video-player>
    </body>
  </html>
  ```

</details>

<details>
  <summary>WebC</summary>

  ```js
  // .eleventy.js
  eleventyConfig.addPlugin(pluginWebc, {
    components: [
      "npm:hover-video-player/**/*.webc",
    ],
  });
  ```

  ```html
  <!-- component.webc -->
  <hover-video-player>
    <video src="path/to/video.mp4" muted loop playsinline />
    <img
      src="path/to/thumbnail.jpg"
      class="paused-overlay"
      slot="paused-overlay"
    />
  </hover-video-player>
  ```

</details>

<details>
  <summary>Svelte</summary>

  ```html
  <!-- component.svelte -->
  <script>
    import "hover-video-player";
  </script>

  <hover-video-player>
    <video src="path/to/video.mp4" muted loop playsinline />
    <img
      src="path/to/thumbnail.jpg"
      class="paused-overlay"
      slot="paused-overlay"
    />
  </hover-video-player>

  <style>
    hover-video-player:not(:defined) {
      /* Hide the hover-video-player element until the component is loaded and defined
          so we can avoid getting a flash of unstyled content */
      display: none;
    }

    hover-video-player img[slot="paused-overlay"] {
      object-fit: cover;
    }
  </style>

  ```

</details>

<details>
  <summary>Vue</summary>

  See Vue's _["Using custom elements in Vue"](https://vuejs.org/guide/extras/web-components.html#using-custom-elements-in-vue)_ documentation for details on how to set up your vue/vite config to support using custom elements.

  ```html
  <!-- component.vue -->
  <script>
    import "hover-video-player";
  </script>

  <template>
    <hover-video-player>
      <video src="path/to/video.mp4" muted loop playsinline />
      <img
        src="path/to/thumbnail.jpg"
        class="paused-overlay"
        slot="paused-overlay"
      />
    </hover-video-player>
  </template>

  <style>
    hover-video-player:not(:defined) {
      /* Hide the hover-video-player element until the component is loaded and defined
          so we can avoid getting a flash of unstyled content */
      display: none;
    }

    hover-video-player img[slot="paused-overlay"] {
      object-fit: cover;
    }
  </style>
  ```

</details>

### Slots

Custom elements accept slots which can then be displayed as children of the component. `hover-video-player` has 4 slots:

- **Default slot** (REQUIRED): The default unnamed slot requires a [video element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement) which the component will control. This provides a lot of flexibility so that you can configure the video however you see fit.

  Recommended video attributes:
  - `loop`: Makes the video loop back to the beginning and keep playing if it reaches the end
  - `muted`: Makes sure the video will play without audio. Browsers may block playback with audio, so this can help prevent that from happening from the start
  - `playsinline`: Makes sure that the video will be played where it is displayed on the page rather than being opened in fullscreen on iOS Safari
  - `preload`: Makes sure that the browser doesn't attempt to aggressively pre-load the video until the user actually starts playing it. You should usually use `preload="metadata"` as this will still load basic metadata such as the video's dimensions, which can be helpful for displaying the player with the right aspect ratio

  ```html
  <hover-video-player>
    <!-- A video element is required for the component's default slot -->
    <video
      src="/path/to/video.mp4"
      loop
      muted
      playsinline
      preload="metadata"
    ></video>
  </hover-video-player>
  ```

- **"paused-overlay"**: The "paused-overlay" slot is an optional named slot. It accepts contents which you want to display over the video while it is in a paused or loading state; when the video starts playing, this content will be faded out.

  A common use case for this would be displaying a thumbnail image over the video while it is paused.

  ```html
  <hover-video-player>
    <video src="/path/to/video.mp4" />
    <img src="/video-thumbnail.jpg" slot="paused-overlay" />
  </hover-video-player>
  ```

- **"loading-overlay"**: The "loading-overlay" slot is an optional named slot. It accepts contents which you want to display over the video if it in a loading state, meaning the user is attempting to play the video and it has taken too long to start.

  This is useful if you want to show a loading state while the user is waiting for the video to play.

  Note that the "paused-overlay" slot will still be displayed while the video is in a loading state; this overlay will simply be displayed on top of that one.

  The exact loading state timeout duration can be set on a `--loading-timeout-duration` CSS variable. See [Loading State Timeouts](#loading-state-timeouts) for details.

  ```html
  <style>
    hover-video-player {
      /* The loading overlay should fade in if the video takes longer than 400ms to start
          after the user hovers over the player */
      --loading-timeout-duration: 400ms;
    }
  </style>

  <hover-video-player>
    <video src="/path/to/video.mp4" />
    <div slot="loading-overlay">
      <div class="loading-spinner" />
    </div>
  </hover-video-player>
  ```

- **"hover-overlay"**: The "hover-overlay" slot is an optional named slot. It accepts contents which you wnat to display over the video while the user is hovering on the player's hover target.

  This is useful if you want to reveal content to the user when the user is hovering on the player's hover target while still allowing the video to play underneath.

  Note that this overlay takes highest ordering priority and will be displayed on top of both the "paused-overlay" and "loading-overlay" slots if they are set.

  ```html
  <hover-video-player>
    <video src="/path/to/video.mp4" />
    <div slot="hover-overlay">The user is hovering!</div>
  </hover-video-player>
  ```

#### Overlay customization

##### Overlay transition durations

The time it takes for the component's overlays to fade in/out is dictated by the `--overlay-transition-duration` CSS variable. By default, its value is `0.4s`.

If you wish, you may customize the transition duration by setting your own value for this CSS variable.

You may set it on the root `hover-video-player` element's level to set the transition duration for all overlays, or you can target a specific overlay slot if you wish to have different transition durations for different overlays.

```html
<style>
  hover-video-player {
    /* All overlays should take 500ms to fade in and out */
    --overlay-transition-duration: 500ms;
  }

  hover-video-player img[slot="paused-overlay"] {
    /* The paused overlay img element should take 1.5s to fade in and out */
    --overlay-transition-duration: 1.5s;
  }
</style>

<hover-video-player>
  <video src="/path/to/video.mp4" />
  <img src="/video-thumbnail.jpg" slot="paused-overlay" />
  <div slot="loading-overlay">Loading...</div>
</hover-video-player>
```

###### Loading state timeouts

The time that the component will wait before fading in the loading overlay if the video is taking a while to start is dictated by the `--loading-timeout-duration` CSS variable. By default, its value is `0.2s`.

If you wish, you may customize this timeout duration by setting your own value for this CSS variable either on the root `hover-video-player` element's level or directly on the loading overlay slot element.

```html
<style>
  hover-video-player {
    /* We should only wait 100ms before fading in the loading overlay */
    --loading-timeout-duration: 100ms;
  }
</style>

<hover-video-player>
  <video src="/path/to/video.mp4" />
  <div slot="loading-overlay">Loading...</div>
</hover-video-player>
```

### Element API

#### hover-target

The optional `"hover-target"` attribute can be used to provide a selector string for element(s) which the component should watch for hover interactions. If a hover target is not set, the component will use its root element as the hover target.

Note that if you provide a selector which matches multiple elements in the document, they will all be added as hover targets.

The component's hover target can also be accessed and updated in JS with the `hoverTarget` property.
This property may be a single `Element` instance, or an iterable of `Element` instances; a manually constructed array, a `NodeList` returned by `querySelectorAll`, or an HTMLCollection returned by `getElementsByClassName` are all acceptable.

```html
<!-- A single hover target -->
<div id="hover-on-me">Hover on me to start playing!</div>
<hover-video-player hover-target="#hover-on-me">
  <video src="video.mp4" />
</hover-video-player>

<!-- Multiple hover targets -->
<div class="hover-target">You can hover on me to play</div>
<div class="hover-target">You can also hover on me!</div>
<hover-video-player hover-target=".hover-target">
  <video src="video.mp4" />
</hover-video-player>
```

Setting with JS:

```js
const player = document.querySelector("hover-video-player");
// Setting a single hover target element
player.hoverTarget = document.getElementById("hover-on-me");

// Setting multiple hover targets
player.hoverTarget = document.querySelectorAll(".hover-target");
```

#### restart-on-pause

The optional boolean `"restart-on-pause"` attribute will cause the component to reset the video to the beginning when the user ends their hover interaction. Otherwise, the video will remain at whatever time it was at when the user stopped hovering, and start from there if they hover to play it again.

This can also be accessed and updated in JS with the `restartOnPause` property.

```html
<hover-video-player restart-on-pause>
  <video src="video.mp4" />
</hover-video-player>
```

Setting with JS:

```js
const player = document.querySelector("hover-video-player");
player.restartOnPause = true;
```

#### sizing-mode

The optional `"sizing-mode"` attribute has no effects on the component's behavior, but it provides a set of helpful style presets which can be applied to the player.

Valid sizing mode options are:

- `"video"` (default): Everything should be sized based on the video element's dimensions; overlays will expand to cover the video.
  - Note that this mode comes with a caveat: The video element may briefly display with different dimensions until it finishes loading the metadata containing the video's actual dimensions. This is usually fine when the metadata is loaded immediately, so it is recommended that you avoid using this mode in combination with the [unload-on-pause](#unload-on-pause) setting described below, as it will cause the video's metadata to be unloaded frequently.
- `"overlay"`: Everything should be sized relative to the paused overlay slot's dimensions and the video will expand to fill that space.
- `"container"`: The video and all overlays should be sized to cover the dimensions of the outermost `<hover-video-player>` host element.
- `"manual"`: All preset sizing mode styles are disabled, leaving it up to you.

```html
<hover-video-player sizing-mode="overlay">
  <video src="video.mp4" />
  <!-- The hover-video-player component will be sized relative to this thumbnail image's dimensions -->
  <img src="thumbnail.jpg" slot="paused-overlay" />
</hover-video-player>

<!-- The host element has a set 16:9 aspect ratio which the video and overlays should expand to cover -->
<hover-video-player sizing-mode="container" style="aspect-ratio: 16 / 9;">
  <video src="video.mp4" />
  <img src="thumbnail.jpg" slot="paused-overlay" />
</hover-video-player>
```

#### playback-start-delay

The optional `"playback-start-delay"` attribute can be used to apply a delay between when the user starts hovering and when the video starts playing.

This can be useful as an optimization if you have a page with a large number of `hover-video-player` instances and want to avoid making unnecessary requests to load video assets which may occur as the user browses arund the page and passes their mouse over videos that they don't intend to watch.

This attribute accepts times in the format of seconds like "0.5s", or milliseconds like "100ms" or simply "100".

This can also be accessed and updated in JS with the `playbackStartDelay` property.

```html
<hover-video-player playback-start-delay="100">
  <video src="video.mp4" />
</hover-video-player>
```

Setting with JS:

```js
const player = document.querySelector("hover-video-player");
player.playbackStartDelay = 500;
```

#### unload-on-pause

`hover-video-player` accepts an optional boolean `"unload-on-pause"` attribute which, if present, will cause the component to fully unload the video's sources when the video is not playing in an effort to reduce the amount of memory and network usage on the page.

This setting is necessary because when you pause a video after playing it for the first time, it remains loaded in memory and browsers will often continue loading more of the video in case the user goes back to play more of it. This is fine on a small scale, but in cases where you have a page with a very large number of `hover-video-player` instances, it may become necessary in order to prevent all of the videos on the page from eating up a ton of network bandwidth and memory all at once, causing significant performance degradation for the user.

Although this setting can provide some performance benefits, it also has notable drawbacks:

The video's metadata will be (at least temporarily) fully unloaded when the video is paused, which could cause content jumps to occur when the video starts/stops playing.

As a result, it is recommended that you set the [`"sizing-mode"`](#sizing-mode) attribute to "overlay" or "container", or provide your own custom styles to set a fixed dimensions for the component.

Additionally, the video may not show a thumbnail/first frame, or if it does, it may flash in ways that are undesired. As a result, it is recommended to provide overlay contents for the "paused-overlay" slot which will hide the video element while it is paused and unloaded.

This setting must be paired with setting either `preload="metadata"` or `preload="none"` on the video element to make sure that the browser does not try to preload every video asset while it isn't playing. If a `preload` attribute is not set on the video, the component will set `preload="metadata"` on it automatically.

This can also be accessed and updated in JS with the `unloadOnPause` property.

```html
<hover-video-player unload-on-pause sizing-mode="overlay">
  <video src="video.mp4" preload="none" />
  <img src="thumbnail.jpg" />
</hover-video-player>
```

Setting with JS:

```js
const player = document.querySelector("hover-video-player");
player.unloadOnPause = true;
```

#### controlled

The optional boolean `"controlled"` attribute will disable standard event handling on the hover target so playback can be fully manually managed programmatically for more complex custom behavior.

You can programmatically start and stop playback on a controlled component by using the `.hover()` and `.blur()` methods, or manipulating the [`"data-playback-state"`](#data-playback-state) attribute.

This option is essentially a shorthand for calling `event.preventDefault()` on both [`"hoverstart"`](#hoverstart) and [`"hoverend"`](#hoverend) events.

This can also be accessed and updated in JS with the `controlled` property.

```html
<hover-video-player controlled>
  <video src="video.mp4" />
</hover-video-player>
```

Setting with JS:

```js
const player = document.querySelector("hover-video-player");
player.controlled = true;
```

Programmatically starting/stopping playback:

```js
const player = document.querySelector("hover-video-player");
// Start playback
player.hover();
// Stop playback
player.blur();

// Start playback
player.dataset.playbackState = "playing";
```

### Data attributes

The component sets some data attributes on its element which expose some of the component's internal state for custom styling.

It is recommended that you do not tamper with these attributes by manually modifying them yourself, as the component
will likely overwrite your changes and these attributes are used internally for the component's styling.

#### data-is-hovering

`data-is-hovering` is a boolean data attribute which is present when the player is hovered, meaning it is actively playing or trying to play.

It will look like this in the DOM:

```html
<!-- State while the user is not hovering -->
<hover-video-player>
  <video src="video.mp4" />
</hover-video-player>

<!-- State when the user is hovering -->
<hover-video-player data-is-hovering>
  <video src="video.mp4" />
</hover-video-player>
```

```css
hover-video-player[data-is-hovering] {
  /* When the player is being hovered, add custom styles to shift it up and add a box shadow */
  transform: translateY(-5%);
  box-shadow: 0px 0px 10px black;
}
```

#### `data-playback-state`

`data-playback-state` is an enum data attribute which reflects the video's internal playback state. The attribute can have one of the following values:

- `"paused"`: The video is paused and not attempting to play
- `"loading"`: The video is attempting to play, but still loading
- `"playing"`: The video is playing

If you manipulate the value of the attribute, the component will attempt to transition to that playback state.

It will look like this in the DOM:

```html
<!-- Initial state before the component has mounted -->
<hover-video-player>
  <video src="video.mp4" />
</hover-video-player>

<!-- State after the component has mounted but is not playing -->
<hover-video-player data-playback-state="paused">
  <video src="video.mp4" />
</hover-video-player>

<!-- State when the user is hovering and the video is playing -->
<hover-video-player data-is-hovering data-playback-state="playing">
  <video src="video.mp4" />
</hover-video-player>
```

```css
hover-video-player[data-playback-state="paused"] {
  /* Red background when the player is paused */
  background: red;
}

hover-video-player[data-playback-state="loading"] {
  /* Yellow background when the player is loading */
  background: yellow;
}

hover-video-player[data-playback-state="playing"] {
  /* Green background when the player is playing */
  background: green;
}
```

The attribute can be manipulated to trigger playback state updates. This could be combined with the `controlled` attribute
as another way to manually control playback state via JavaScript.

```js
const player = document.querySelector("hover-video-player");
console.log(player.dataset.playbackState); // "paused"
// The player will attempt to play; it will revert back to a "loading" state until playback succeeds
player.dataset.playbackState = "playing";
console.log(player.dataset.playbackState); // "loading"
// Once the video starts playing...
console.log(player.dataset.playbackState); // "playing"

// Removing the attribute or setting it to an invalid value will reset the player to "paused" state
player.removeAttribute("data-playback-state");
console.log(player.dataset.playbackState); // "paused"
```

### Events

#### `hoverstart`

The player component will emit a `"hoverstart"` event when a user hovers over the player's hover target to start playback. `"hoverstart"` events are cancelable `CustomEvents`.

Each event will include the `Event` object from the originating hover target event on `event.detail`.

If you wish to intercept a `"hoverstart"` event and prevent the component from proceeding to start playback,
you can call `event.preventDefault()` in a `hoverend` listener. If the component is [controlled](#controlled),
both `"hoverstart"` and `"hoverend"` events will automatically be canceled without requiring any further action from you.

```js
const player = document.querySelector("hover-video-player");
player.addEventListener("hoverstart", (evt) => {
  console.log("The user hovered!");
  if (shouldPreventPlay) {
    // Call preventDefault to prevent the component from proceeding to start playback in response to this `hoverstart` event
    evt.preventDefault();
  }

  console.log("The hoverstart interaction originated on this element:", evt.detail.currentTarget);
});
```

#### `hoverend`

The player component will emit a `"hoverend"` event when a user stops hovering over the player's hover target to stop playback. `"hoverend"` events are cancelable `CustomEvents`.

Each event will include the `Event` object from the originating hover target event on `event.detail`.

If you wish to intercept a `"hoverend"` event and prevent the component from proceeding to pause playback,
you can call `event.preventDefault()` in a `hoverend` listener. If the component is [controlled](#controlled),
both `"hoverstart"` and `"hoverend"` events will automatically be canceled without requiring any further action from you.

```js
const player = document.querySelector("hover-video-player");
player.addEventListener("hoverend", (evt) => {
  console.log("The user is no longer hovering!");

  if (shouldPreventPause) {
    // Call preventDefault to prevent the component from proceeding to pause playback in response to this `hoverend` event
    evt.preventDefault();
  }

  console.log("The hoverend interaction originated on this element:", evt.detail.currentTarget);
});
```

#### `playbackstatechange`

The player component will emit a custom `"playbackstatechange"` event when the player's playback state changes.
This is a `CustomEvent` where the `detail` will be the new playback state, matching the [`data-playback-state`](#data-playback-state) attribute.

```js
const player = document.querySelector("hover-video-player");
player.addEventListener("playbackstatechange", (evt) => {
  console.log("The new playback state is...", evt.detail);
});
```


### Alternative media sources

The native `<video>` element is mostly oriented toward playing statically hosted video files,
but you may wish to use a different media source such as a YouTube video, Vimeo video, or even an m3u8 HLS video stream.

This component will support any custom video player element which implements core HTMLMediaElement APIs.
[Mux maintains an incredibly good collection of media elements](https://github.com/muxinc/media-elements/tree/main) which do exactly that. Any of these custom elements should be able to be used in place of a `<video>` and work as expected.

> [!WARNING]
>
> Some of `hover-video-player`'s APIs are not designed to be used
> with custom elements and may have unexpected interactions.
>
> In particular, be careful with [`unload-on-pause`](#unload-on-pause),
> as it most likely will not be able to unload the video's source as expected.
>
> It is also worth noting that some of these custom elements may have issues with playback with audio. For instance, `youtube-element`
> may fail to play without the `muted` attribute unless you perform a click interaction on the element to play it first.

#### Example: controlling a YouTube video

Using Mux's [`youtube-video`](https://github.com/muxinc/media-elements/tree/main/packages/youtube-video-element) custom element.

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/youtube-video-element@1"
></script>

<hover-video-player>
  <youtube-video
    src="https://www.youtube.com/watch?v=aqz-KE-bpKQ"
    playsinline
    muted
  ></youtube-video>
</hover-video-player>
```

#### Example: controlling a Vimeo video

Using Mux's [`vimeo-video`](https://github.com/muxinc/media-elements/tree/main/packages/vimeo-video-element) custom element.

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/vimeo-video-element@1.0/+esm"
></script>

<hover-video-player>
  <vimeo-video
    src="https://vimeo.com/648359100"
  ></vimeo-video>
</hover-video-player>
```

#### Example: controlling an m3u8 HLS stream

Using Mux's [`hls-video`](https://github.com/muxinc/media-elements/tree/main/packages/hls-video-element) custom element.

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/hls-video-element@1.1/+esm"
></script>

<hover-video-player>
  <hls-video
    src="https://stream.mux.com/r4rOE02cc95tbe3I00302nlrHfT023Q3IedFJW029w018KxZA.m3u8"
  ></hls-video>
</hover-video-player>
```