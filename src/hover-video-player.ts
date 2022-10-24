export default class HoverVideoPlayer extends HTMLElement {
  // CSS stylesheet string which we'll use to style each component
  private static _styles: string = /* css */`
    :host {
      display: inline-block;
      position: relative;
      --overlay-transition-duration: 0.4s;
      --loading-timeout-duration: 0.2s;
    }

    :host([sizing-mode="video"]) ::slotted(video) {
      display: block;
      width: 100%;
    }

    :host([sizing-mode="overlay"]) ::slotted([slot="paused-overlay"]) {
      position: relative;
    }

    :host(:is([sizing-mode="overlay"], [sizing-mode="container"])) ::slotted(video) {
      object-fit: cover;
    }

    /* Style videos and overlays to cover the container depending on the sizing mode */
    /* The video element should expand to cover the container in all but the "video" sizing mode */
    :host(
      :is(
        [sizing-mode="overlay"],
        [sizing-mode="container"],
      )
    ) ::slotted(video),
    /* The paused overlay should expand to cover the container in all but the "overlay" sizing mode */
    :host(:is([sizing-mode="video"], [sizing-mode="container"])) ::slotted([slot="paused-overlay"]),
    /* The loading and hover overlays should always expand to cover the container */
    ::slotted(:is([slot="loading-overlay"], [slot="hover-overlay"])) {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }

    ::slotted(:is(
      [slot="paused-overlay"],
      [slot="loading-overlay"],
      [slot="hover-overlay"]
    )) {
      display: block;
      opacity: 0;
      visibility: hidden;
      --transition-delay: 0s;
      --visibility-transition-delay: var(--overlay-transition-duration);
      transition: opacity var(--overlay-transition-duration) var(--transition-delay), visibility 0s calc(var(--transition-delay) + var(--visibility-transition-delay));
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

    /* Fade in overlays for their appropriate playback states */
    :host(:is(
      [data-playback-state="paused"],
      [data-playback-state="loading"]
    )) ::slotted([slot="paused-overlay"]),
    :host([data-playback-state="loading"]) ::slotted([slot="loading-overlay"]),
    :host([data-is-hovering]) ::slotted([slot="hover-overlay"]) {
      opacity: 1;
      visibility: visible;
      --visibility-transition-delay: 0s;
    }

    :host([data-playback-state="loading"]) ::slotted([slot="loading-overlay"]) {
      /* Delay the loading overlay fading in */
      --transition-delay: var(--loading-timeout-duration);
    }
  `;
  private static _stylesheet: CSSStyleSheet | null;

  private static _templateHTML: string = /* html */`
    <slot></slot>
    <slot name="paused-overlay"></slot>
    <slot name="loading-overlay"></slot>
    <slot name="hover-overlay"></slot>
  `;
  private static _templateElement: HTMLTemplateElement | null = null;

  private static _observedAttributes = [
    "hover-target",
    "restart-on-pause",
    "unload-on-pause",
  ] as const
  static get observedAttributes() {
    return HoverVideoPlayer._observedAttributes;
  }

  // Property which maps to the value of the "restart-on-pause" attribute
  private _restartOnPause: boolean = false;
  public set restartOnPause(newValue: boolean) {
    // Setter updates the restart-on-pause attribute; updating the internal
    // _restartOnPause property is handled by the attributeChangedCallback
    if (newValue) {
      this.setAttribute("restart-on-pause", "");
    } else {
      this.removeAttribute("restart-on-pause");
    }
  }
  public get restartOnPause() {
    return this._restartOnPause;
  }

  // Property which maps to the value of the "unload-on-pause" attribute
  private _unloadOnPause: boolean = false;
  public set unloadOnPause(newValue: boolean) {
    // Setter updates the unload-on-pause attribute; updating the internal
    // _unloadOnPause property is handled by the attributeChangedCallback
    if (newValue) {
      this.setAttribute("unload-on-pause", "");
    } else {
      this.removeAttribute("unload-on-pause");
    }
  }
  public get unloadOnPause() {
    return this._unloadOnPause;
  }

  // The video element which this player component is controling
  public video: HTMLVideoElement | null = null;
  // The element which we will watch for hover events to start and stop video playback.
  // This maps to the element with the selector set in the "hover-target" attribute if applicable,
  // or else will just be this component's host element.
  private _hoverTarget: Element = this;
  /**
   * hoverTarget setter allows you to change the hover target element programmatically if you don't
   * want to deal with the `hover-target` selector attribute.
   *
   * @example
   * const player = document.querySelector('hover-video-player');
   * player.hoverTarget = document.querySelector('.my-hover-target');
   */
  public set hoverTarget(newHoverTarget: Element | null) {
    // Remove any `hover-target` attribute to reduce confusion after setting the hover target programmatically
    this.removeAttribute("hover-target");
    this._setHoverTarget(newHoverTarget || this);
  }
  /**
   * hoverTarget getter returns the current hover target element that the player is using.
   */
  public get hoverTarget(): Element {
    return this._hoverTarget;
  }

  // Whether the user is currently hovering over the hover target.
  public isHovering: boolean = false;
  // The current playback state of the player.
  public playbackState: "paused" | "loading" | "playing" = "paused";
  // Whether this component has a paused overlay; this will determine whether we should
  // delay pausing the video to ensure the overlay has time to finish fading in.
  private _hasPausedOverlay: boolean = false;

  private static _initializeTemplate() {
    // Don't do anything if the template is already initialized
    if (HoverVideoPlayer._templateElement) return;

    // Create a template element from the template HTML
    const template = document.createElement("template");
    template.innerHTML = HoverVideoPlayer._templateHTML;

    let stylesheet: CSSStyleSheet | null = null;

    // Create a stylesheet from this element's styles
    try {
      stylesheet = new CSSStyleSheet();
      stylesheet.replaceSync(HoverVideoPlayer._styles);
    } catch {
      // If the browser doesn't support constructing a CSSStyleSheet, we'll need to fall back by appending a style element
      // to the template element. This is not as memory-efficient because we will be duplicating the style tag's contents for each
      // instance of the component on the page, but it will still work.
      console.warn("hover-video-player failed to create a CSSStyleSheet, likely because this browser does not support it. Falling back to appending a style tag to the component's shadow dom.")
      const styleElement = document.createElement("style");
      styleElement.textContent = HoverVideoPlayer._styles;
      template.content.appendChild(styleElement);
    }

    // Cache the template element and stylesheet
    HoverVideoPlayer._templateElement = template;
    HoverVideoPlayer._stylesheet = stylesheet;
  }

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    HoverVideoPlayer._initializeTemplate();

    if (!HoverVideoPlayer._templateElement) {
      throw new Error("hover-video-player failed to initialize template element");
    }

    if (HoverVideoPlayer._stylesheet) {
      shadowRoot.adoptedStyleSheets = [HoverVideoPlayer._stylesheet];
    }
    shadowRoot.appendChild(HoverVideoPlayer._templateElement.content.cloneNode(true));

    // Bind `this` for event handlers to make sure nothing weird happens
    this._onHoverStart = this._onHoverStart.bind(this);
    this._onHoverEnd = this._onHoverEnd.bind(this);
    this._onTouchOutsideOfHoverTarget =
      this._onTouchOutsideOfHoverTarget.bind(this);
    this._onSlotChange = this._onSlotChange.bind(this);
  }

  /**
   * Lifecycle method that fires when the component is connected to the DOM; this is the first point
   * where we can get/set attributes on the component.
   */
  connectedCallback() {
    // The player is initially in a paused state
    this._updatePlaybackState("paused");

    this.shadowRoot?.addEventListener("slotchange", this._onSlotChange);

    const hoverTargetSelectorAttribute = this.getAttribute("hover-target");
    if (hoverTargetSelectorAttribute) {
      // If an initial hover-target selector attribute is set,
      // get the element for that selector and use it as the hover target
      this._setHoverTargetForSelector(this.getAttribute("hover-target"));
    } else {
      // Otherwise, make sure we set up event listeners for the default hover target
      this._addHoverTargetListeners(this._hoverTarget);
    }

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
    this._removeHoverTargetListeners(this._hoverTarget);
    window.removeEventListener("touchstart", this._onTouchOutsideOfHoverTarget);
  }

  /**
   * Lifecycle method fires when one of the component's observed attributes changes.
   *
   * @param {string} name - The name of the attribute that changed
   * @param {string | null} _oldValue - The previous value of the attribute (currently unused)
   * @param {string | null} newValue - The new value of the attribute (null if removed)
   */
  attributeChangedCallback(name: typeof HoverVideoPlayer._observedAttributes[number], _oldValue: string | null, newValue: string | null) {
    switch (name) {
      case "hover-target": {
        this._setHoverTargetForSelector(newValue);
        break;
      }
      case "restart-on-pause":
        // If the new value for restart-on-pause is a string, the value should be considered truthy unless it's "false",
        // otherwise we'll assume it's null/undefined meaning the attribute isn't set, so the value should be false.
        this._restartOnPause = typeof newValue === "string" ? newValue !== "false" : false;
        break;
      case "unload-on-pause":
        this._unloadOnPause = typeof newValue === "string" ? newValue !== "false" : false;
        break;
      default:
    }
  }

  /**
   * Updates our state to reflact whether the user is hovering over the hover target and
   * sets a data attribute to allow styling based on this state.
   *
   * @param {boolean} isHovering - The new value for isHovering
   */
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
      !this._hoverTarget ||
      !(event.target instanceof Node) ||
      !this._hoverTarget.contains(event.target)
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
  private _updatePlaybackState(newPlaybackState: typeof this.playbackState) {
    this.playbackState = newPlaybackState;
    this.setAttribute("data-playback-state", newPlaybackState);
  }

  private _pauseTimeoutID: number | undefined;

  /**
   * Starts video playback and updates the component's
   * playback state as the video loads and plays.
   */
  private _startPlayback() {
    const video = this.video;
    if (!video) return;

    window.clearTimeout(this._pauseTimeoutID);

    this._updatePlaybackState("loading");

    video.play().then(() => {
      this._updatePlaybackState("playing");
    }).catch((error: DOMException) => {
      this._updatePlaybackState("paused");

      if (
        // If this was an abort error because the playback promise was interrupted by a load/pause call,
        // let's just ignore it; these errors are perfectly fine and happen frequently in normal usage.
        error.name === 'AbortError'
      ) {
        return;
      }


      // Additional handling for when browsers block playback for unmuted videos.
      // This is unfortunately necessary because most modern browsers do not allow playing videos with audio
      //  until the user has "interacted" with the page by clicking somewhere at least once; mouseenter events
      //  don't count.
      // If the video isn't muted and playback failed with a `NotAllowedError`, this means the browser blocked
      // playing the video because the user hasn't clicked anywhere on the page yet.
      if (!video.muted && error.name === 'NotAllowedError') {
        console.warn(
          'hover-video-player: Playback with sound was blocked by the browser. Attempting to play again with the video muted; audio will be restored if the user clicks on the page.'
        );
        // Mute the video and attempt to play again
        video.muted = true;
        this._startPlayback();

        // When the user clicks on the document, unmute the video since we should now
        // be free to play audio
        document.addEventListener('click', () => {
          video.muted = false;
        }, { once: true });
      } else {
        // Log any other playback errors with console.error
        console.error(`hover-video-player: ${error.message}`);
      }
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

    this._updatePlaybackState("paused");

    let overlayTransitionDuration = 0;

    if (this._hasPausedOverlay) {
      const transitionDurationCSSVarValue = getComputedStyle(this).getPropertyValue("--overlay-transition-duration");
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
        this.video.removeAttribute("src");

        // We should also grab all <source> elements in the video and remove them
        const sourceElements = this.video.querySelectorAll("source");
        const sourceElementCount = sourceElements.length;
        for (let i = 0; i < sourceElementCount; ++i) {
          sourceElements[i].remove();
        }

        // Wait until the video's sources are successfully emptied before restoring the sources
        // to make sure things really do get fully unloaded.
        this.video.addEventListener("emptied", (event) => {
          const video = event.target as HTMLVideoElement;
          // Restore the `src` attribute and/or source elements
          if (previousSrcAttribute) {
            video.src = previousSrcAttribute;
          }
          for (let i = 0; i < sourceElementCount; ++i) {
            video.appendChild(sourceElements[i]);
          }

          video.currentTime = currentTime;
        }, {
          once: true,
        });

        // Re-load the video with the sources removed so we unload everything from memory
        this.video.load();

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

      if (this.unloadOnPause && (!this.video.preload || this.video.preload === "auto")) {
        // If the unloadOnPause property is set and the video's preload property is set to "auto",
        // we need to change it to "metadata"; otherwise, the browser will start pre-loading the entire
        // video and defeat the whole purpose of unloading the video when it's paused.
        this.video.preload = "metadata";
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
    const slotNodes = target.assignedNodes({ flatten: true });
    this._hasPausedOverlay = slotNodes.length > 0;
  }

  /**
   * Handles changes to this component's slots.
   */
  private _onSlotChange(event: Event) {
    const target = event?.target as HTMLSlotElement;

    switch (target.name) {
      case "paused-overlay":
        // If the paused overlay slot changed, update whether we have a paused overlay
        this._onPausedOverlaySlotChange(target);
        break;
      case "":
        // If the default slot changed, get the video element from it which
        // this component should control
        this._onDefaultSlotChange(target);
    }
  }

  /**
   * Updates the componen't shover target element, cleans up event listeners on the
   * old hover target, and sets up new listeners on the new hover target.
   *
   * @param {Element} newHoverTarget
   */
  private _setHoverTarget(newHoverTarget: Element) {
    if (newHoverTarget === this._hoverTarget) return;

    this._removeHoverTargetListeners(this._hoverTarget);
    this._hoverTarget = newHoverTarget;
    this._addHoverTargetListeners(this._hoverTarget);
  }

  /**
   * Gets the element for a given selector string and sets it as the component's hover target.
   *
   * @param {string | null} selector
   */
  private _setHoverTargetForSelector(selector: string | null) {
    if (!selector) {
      // If there's no selector, we'll just use the component's host element as the hover target
      this._setHoverTarget(this);
      return;
    }

    const hoverTarget = document.querySelector(selector);
    if (!hoverTarget) {
      console.error(`hover-video-player failed to find a hover target element with the selector "${selector}".`);
    }
    this._setHoverTarget(hoverTarget || this);
  }

}

customElements.define("hover-video-player", HoverVideoPlayer);

declare global {
  interface HTMLElementTagNameMap {
    "hover-video-player": HoverVideoPlayer;
  }
}
