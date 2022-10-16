const supportsAdoptingStyleSheets =
  ShadowRoot &&
  'adoptedStyleSheets' in ShadowRoot.prototype &&
  'replaceSync' in CSSStyleSheet.prototype;

enum PlaybackState {
  Paused = "paused",
  Loading = "loading",
  Playing = "playing",
}

const hoverVideoPlayerTemplate = document.createElement('template');
hoverVideoPlayerTemplate.innerHTML = /* html */`
  <slot></slot>
  <slot name="paused-overlay"></slot>
  <slot name="loading-overlay"></slot>
  <slot name="hover-overlay"></slot>
`;

const hoverVideoPlayerStyleText = /* css */`
  :host {
    display: inline-block;
    position: relative;
    --overlay-transition-duration: 400ms;
    --loading-state-timeout: 200ms;
  }

  :host([sizing-mode="video"]) ::slotted(video) {
    display: block;
    width: 100%;
  }

  :host([sizing-mode="overlay"]) ::slotted([slot="paused-overlay"]) {
    position: relative;
  }

  :host([sizing-mode="overlay"]) ::slotted(video),
  :host([sizing-mode="container"]) ::slotted(video) {
    object-fit: cover;
  }

  /* Style videos and overlays to cover the container depending on the sizing mode */
  /* The video element should expand to cover the container in all but the "video" sizing mode */
  :host([sizing-mode="overlay"]) ::slotted(video),
  :host([sizing-mode="container"]) ::slotted(video),
  /* The paused overlay should expand to cover the container in all but the "overlay" sizing mode */
  :host([sizing-mode="video"]) ::slotted([slot="paused-overlay"]),
  :host([sizing-mode="container"]) ::slotted([slot="paused-overlay"]),
  /* The loading and hover overlays should always expand to cover the container */
  ::slotted([slot="loading-overlay"]),
  ::slotted([slot="hover-overlay"]) {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  ::slotted([slot="paused-overlay"]),
  ::slotted([slot="loading-overlay"]),
  ::slotted([slot="hover-overlay"]) {
    display: block;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--overlay-transition-duration);
  }

  ::slotted([slot="paused-overlay"]) {
    z-index: 1;
  }

  ::slotted([slot="loading-overlay"]) {
    z-index: 2;
  }

  ::slotted([slot="hover-overlay"]) {
    z-index: 3;
  }

  :host([data-playback-state="paused"]) ::slotted([slot="paused-overlay"]),
  :host([data-playback-state="loading"]) ::slotted([slot="paused-overlay"]),
  :host([data-playback-state="loading"]) ::slotted([slot="loading-overlay"]),
  :host([data-is-hovering="true"]) ::slotted([slot="hover-overlay"]) {
    opacity: 1;
    pointer-events: auto;
  }

  :host([data-playback-state="loading"]) ::slotted([slot="loading-overlay"]) {
    /* Delay the loading overlay fading in */
    transition-delay: var(--loading-state-timeout);
  }
`;

let hoverVideoPlayerStyleSheet: CSSStyleSheet | null = null;
if (supportsAdoptingStyleSheets) {
  hoverVideoPlayerStyleSheet = new CSSStyleSheet();
  hoverVideoPlayerStyleSheet.replaceSync(hoverVideoPlayerStyleText);
} else {
  // If the browser (cough cough Safari) doesn't support adoptedStyleSheets, we'll
  // just append a style element to the template. Not as efficient, but it works.
  const style = document.createElement('style');
  style.textContent = hoverVideoPlayerStyleText;
  hoverVideoPlayerTemplate.content.appendChild(style);
}

const observedAttributes = [
  "hover-target",
  "restart-on-pause",
  "unload-on-pause",
] as const;

export class HoverVideoPlayer extends HTMLElement {
  static get observedAttributes() {
    return observedAttributes;
  }

  // Property which maps to the value of the "restart-on-pause" attribute
  restartOnPause: boolean = false;
  // Property which maps to the value of the "unload-on-pause" attribute
  unloadOnPause: boolean = false;

  // The video element which this player component is controling
  video: HTMLVideoElement | null = null;
  // The element which we will watch for hover events to start and stop video playback.
  // This maps to the element with the selector set in the "hover-target" attribute if applicable,
  // or else will just be this component's host element.
  hoverTarget: Element | null = null;
  // Whether the user is currently hovering over the hover target.
  isHovering: boolean = false;
  // The current playback state of the player.
  playbackState: PlaybackState = PlaybackState.Paused;
  // Whether this component has a paused overlay; this will determine whether we should
  // delay pausing the video to ensure the overlay has time to finish fading in.
  private _hasPausedOverlay: boolean = false;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    if (hoverVideoPlayerStyleSheet) {
      shadowRoot.adoptedStyleSheets = [hoverVideoPlayerStyleSheet];
    }
    shadowRoot.appendChild(hoverVideoPlayerTemplate.content.cloneNode(true));

    this._onHoverStart = this._onHoverStart.bind(this);
    this._onHoverEnd = this._onHoverEnd.bind(this);
    this._onTouchOutsideOfHoverTarget =
      this._onTouchOutsideOfHoverTarget.bind(this);
    this._onSlotChange = this._onSlotChange.bind(this);
  }

  private _updateIsHovering(isHovering: boolean) {
    this.isHovering = isHovering;
    if (isHovering) {
      this.setAttribute("data-is-hovering", "");
    } else {
      this.removeAttribute("data-is-hovering");
    }
  }

  /**
   * Handler updates state and starts video playback when the user hovers over the hover target.
   */
  private _onHoverStart() {
    if (!this.isHovering) {
      this._updateIsHovering(true);
      this._startPlayback();

      this.dispatchEvent(new CustomEvent("hoverstart"));
    }
  }

  /**
   * Handler updates state and pauses video playback when the user stops hovering over the hover target.
   */
  private _onHoverEnd() {
    if (this.isHovering) {
      this._updateIsHovering(false);
      this._stopPlayback();

      this.dispatchEvent(new CustomEvent("hoverend"));
    }
  }

  /**
   * Handler checks touch events and pauses playback if the user touches outside of the hover target.
   */
  private _onTouchOutsideOfHoverTarget(event: TouchEvent) {
    // Don't do anything if the user isn't currently hovering over the player
    if (!this.isHovering) return;

    if (
      !this.hoverTarget ||
      !(event.target instanceof Node) ||
      !this.hoverTarget.contains(event.target)
    ) {
      this._onHoverEnd();
    }
  }

  /**
   * Hooks up event listeners to the hover target so it can start listening for hover events that will trigger playback.
   */
  private _addHoverTargetListeners(hoverTarget: Element) {
    hoverTarget.addEventListener("mouseenter", this._onHoverStart);
    hoverTarget.addEventListener("mouseleave", this._onHoverEnd);
    hoverTarget.addEventListener("focus", this._onHoverStart);
    hoverTarget.addEventListener("blur", this._onHoverEnd);
    hoverTarget.addEventListener("touchstart", this._onHoverStart, {
      passive: true,
    });
  }

  /**
   * Cleans up event listeners from a hover target element if the hover target has changed or the component has been disconnected.
   *
   * @param {HTMLElement} hoverTarget   The hover target element to remove event listeners from.
   */
  private _removeHoverTargetListeners(hoverTarget: Element | null) {
    if (hoverTarget) {
      hoverTarget.removeEventListener("mouseenter", this._onHoverStart);
      hoverTarget.removeEventListener("mouseleave", this._onHoverEnd);
      hoverTarget.removeEventListener("focus", this._onHoverStart);
      hoverTarget.removeEventListener("blur", this._onHoverEnd);
      hoverTarget.removeEventListener("touchstart", this._onHoverStart);
    }
  }

  /**
   * Updates the internal playback state and updates the component's data-playback-state attribute
   * to ensure the styles are updated correctly.
   *
   * @param {PlaybackState} newPlaybackState 
   */
  private _updatePlaybackState(newPlaybackState: PlaybackState) {
    this.playbackState = newPlaybackState;
    this.setAttribute("data-playback-state", newPlaybackState);
  }

  private _pauseTimeoutID: number | undefined;

  /**
   * Starts video playback and updates the component's
   * playback state as the video loads and plays.
   */
  private _startPlayback() {
    if (!this.video) return;

    window.clearTimeout(this._pauseTimeoutID);

    this._updatePlaybackState(PlaybackState.Loading);

    this.video.play().then(() => {
      this._updatePlaybackState(PlaybackState.Playing);
    }).catch((err) => {
      this._updatePlaybackState(PlaybackState.Paused);

      console.error(err);
    });
  }

  /**
   * Stops video playback.
   * If there is a paused overlay, the video will wait to pause until the overlay has finished fading in.
   * If `restartOnPause` is true, the video will be reset to the beginning.
   * If `unloadOnPause` is true, the video's sources will be unloaded.
   */
  private _stopPlayback() {
    if (!this.video) return;

    window.clearTimeout(this._pauseTimeoutID);

    this._updatePlaybackState(PlaybackState.Paused);

    let overlayTransitionDuration = 0;

    if (this._hasPausedOverlay) {
      const transitionDurationCSSVarValue = getComputedStyle(this).getPropertyValue("--overlay-transition-duration");
      console.log(transitionDurationCSSVarValue);
      if (transitionDurationCSSVarValue.endsWith("ms")) {
        overlayTransitionDuration = parseFloat(transitionDurationCSSVarValue);
      } else {
        overlayTransitionDuration = parseFloat(transitionDurationCSSVarValue) * 1000;
      }
    }

    // Set a timeout to make sure we don't pause the video before the paused overlay transition
    // has had time to finish (if there is no paused overlay, the timeout will be 0)
    this._pauseTimeoutID = window.setTimeout(() => {
      if (!this.video) return;

      this.video.pause();

      // If the video should restart when paused, reset the video's time to 0
      if (this.restartOnPause) {
        this.video.currentTime = 0;
      }

      // If the video's sources should be unloaded after pausing,
      // we will need to remove them from the video, force the video to manually load
      // with the sources removed, and then restore the sources so the video will be able to
      // load and play them again when the user hovers over the player again.
      if (this.unloadOnPause) {
        // Hang onto the current time the video is at so we can restore to there after unloading
        const currentTime = this.video.currentTime;

        // If there's an `src` attribute on the video, we'll temporarily remove it
        const previousSrcAttribute = this.video.getAttribute("src");
        // We should also grab all <source> elements in the video and remove them
        const sourceElements = this.video.querySelectorAll("source");
        for (const sourceElement of sourceElements) {
          sourceElement.remove();
        }
        // Re-load the video with the sources removed so we unload everything from memory
        this.video.load();

        // Restore the `src` attribute and/or source elements
        if (previousSrcAttribute) {
          this.video.setAttribute("src", previousSrcAttribute);
        }
        for (const sourceElement of sourceElements) {
          this.video.appendChild(sourceElement);
        }

        this.video.currentTime = currentTime;
      }
    }, overlayTransitionDuration);
  }

  /**
   * Grabs the video element when the video slot changes so we can control it.
   */
  private _onDefaultSlotChange(target: HTMLSlotElement) {
    const defaultSlotNodes = target.assignedNodes({ flatten: true });

    const videoElement = defaultSlotNodes.find((node) => node instanceof HTMLVideoElement) as HTMLVideoElement | undefined;
    if (videoElement) {
      this.video = videoElement;

      if (this.unloadOnPause && !this.video.hasAttribute("preload")) {
        // If the unloadOnPause property is set and no preload attribute is set on the video, default it to
        // "metadata" so the video doesn't auto-load and defeat the purpose of unloading the video.
        this.video.setAttribute("preload", "metadata");
      }
    } else {
      console.error("hover-video-player failed to find a video element in the default slot.");
    }
  }

  /**
   * Tracks whether this component has a paused overlay when the paused-overlay slot updates.
   * This informs whether we should delay pausing the video if we have a paused overlay that needs to fade in first.
   */
  private _onPausedOverlaySlotChange(target: HTMLSlotElement) {
    this._hasPausedOverlay = target.childElementCount > 0;
  }

  private _onSlotChange(event: Event) {
    const target = event?.target as HTMLSlotElement;

    switch (target.name) {
      case "paused-overlay":
        this._onPausedOverlaySlotChange(target);
        break;
      case "":
        this._onDefaultSlotChange(target);
    }
  }

  private _setUpHoverTarget(hoverTargetSelector: string | null) {
    const newHoverTarget = hoverTargetSelector ? document.querySelector(hoverTargetSelector) : this;
    // If the hover target has changed, we need to remove the event listeners from the old hover target
    // and add them to the new hover target
    if (newHoverTarget !== this.hoverTarget) {
      this._removeHoverTargetListeners(this.hoverTarget);
      this.hoverTarget = newHoverTarget;
      if (this.hoverTarget) {
        this._addHoverTargetListeners(this.hoverTarget);
      } else {
        console.error("hover-video-player failed to find hover target with selector", hoverTargetSelector);
      }
    }
  }

  /**
   * Lifecycle method that fires when the component is connected to the DOM.
   */
  connectedCallback() {
    // The player is initially in a paused state
    this._updatePlaybackState(PlaybackState.Paused);

    this.shadowRoot?.addEventListener("slotchange", this._onSlotChange);

    // Set up the hover target for the initial hover-target attribute value
    this._setUpHoverTarget(this.getAttribute("hover-target"));

    if (this.getAttribute("sizing-mode") === null) {
      // If no sizing-mode is set, default to "video"
      this.setAttribute("sizing-mode", "video");
    }

    window.addEventListener("touchstart", this._onTouchOutsideOfHoverTarget, {
      passive: true,
    });
  }

  /**
   * Lifecycle method that fires when the component is disconnected from the DOM.
   */
  disconnectedCallback() {
    this.removeEventListener("slotchange", this._onSlotChange);
    this._removeHoverTargetListeners(this.hoverTarget);
    window.removeEventListener("touchstart", this._onTouchOutsideOfHoverTarget);
  }

  attributeChangedCallback(name: typeof observedAttributes[number], _oldValue: string, newValue: string) {
    switch (name) {
      case "hover-target": {
        this._setUpHoverTarget(newValue);
        break;
      }
      case "restart-on-pause":
        // If the new value for restart-on-pause is a string, the value should be considered truthy unless it's "false",
        // otherwise we'll assume it's null/undefined meaning the attribute isn't set, so the value should be false.
        this.restartOnPause = typeof newValue === "string" ? newValue !== "false" : false;
        break;
      case "unload-on-pause":
        this.unloadOnPause = typeof newValue === "string" ? newValue !== "false" : false;
        break;
      default:
    }
  }
}

customElements.define("hover-video-player", HoverVideoPlayer);

declare global {
  interface HTMLElementTagNameMap {
    "hover-video-player": HoverVideoPlayer;
  }
}
