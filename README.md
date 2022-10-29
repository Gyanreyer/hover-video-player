# hover-video-player

A web component which helps make it easy to set up videos which play when the user hovers over them.

This is particularly useful for the common user experience pattern where a page may have a thumbnail which plays a video preview when the user hovers over it.

This is a port of the [react-hover-video-player library](https://github.com/Gyanreyer/react-hover-video-player) which should be broadly compatible with Svelte, Vue, vanilla HTML, or anything other library/framework which supports web components!

**Play with a real working example on CodeSandbox.**

## Features

- Support for mouse, touchscreen, and keyboard focus interactions
- Built-in support for thumbnails and loading states
- Adds handling for weird edge cases that can arise when managing video playback, such as gracefully falling back to playing the video without sound if the browser's autoplay policy blocks un-muted playback

## Get started

### Installation

#### package managers

- `npm install hover-video-player`
- `yarn add hover-video-player`

#### cdn

- esm build (recommended): `<script type="module" src="https://unpkg.com/hover-video-player/index.mjs" />`
- iife build: `<script src="https://unpkg.com/hover-video-player" />`

### Example usage

Web components are broadly compatible with a variety of libraries and frameworks. Here are some examples:

<details open>
  <summary>Vanilla HTML</summary>

  ```html
  <!-- index.html -->
  <html>
    <head>
      <style>
        hover-video-player::slot(paused-overlay) {
            object-fit: cover;
        }
      </style>
      <script type="module" src="https://unpkg.com/hover-video-player/index.mjs" />
    </head>
    <body>
      <hover-video-player>
        <video src="path/to/video.mp4" muted loop />
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
  <summary>Svelte</summary>

  ```html
  <!-- component.svelte -->
  <script>
    import "hover-video-player";
  </script>

  <hover-video-player>
    <video src="path/to/video.mp4" muted loop />
    <img
      src="path/to/thumbnail.jpg"
      class="paused-overlay"
      slot="paused-overlay"
    />
  </hover-video-player>

  <style>
    hover-video-player::slot(paused-overlay) {
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
      <video src="path/to/video.mp4" muted loop />
      <img
        src="path/to/thumbnail.jpg"
        class="paused-overlay"
        slot="paused-overlay"
      />
    </hover-video-player>
  </template>

  <style>
    hover-video-player::slot(paused-overlay) {
      object-fit: cover;
    }
  </style>
  ```

</details>
