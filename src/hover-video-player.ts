export default class HoverVideoPlayer extends HTMLElement {
  // CSS stylesheet string which we'll use to style each component
  private static _styles: string = require("./styles.css");
  private static _stylesheet: CSSStyleSheet | null;

  // Template HTML string which we'll use to create the component's shadow DOM
  private static _templateHTML: string = require("./template.html");
  private static _templateElement: HTMLTemplateElement | null = null;

  private static _observedAttributes = [
    "hover-target",
    "restart-on-pause",
    "unload-on-pause",
    "playback-start-delay",
    "controlled",
    "data-playback-state",
  ] as const;

  static get observedAttributes() {
    return HoverVideoPlayer._observedAttributes;
  }

  // Property which maps to the value of the "restart-on-pause" attribute
  // Determines whether the video should reset to the beginning when it is paused
  // after the user stops hovering
  private _restartOnPause: boolean = false;
  public set restartOnPause(newValue: boolean) {
    this._restartOnPause = newValue;

    if (this.hasAttribute("restart-on-pause")) {
      // If the attribute is set, update it with the new value
      this.setAttribute("restart-on-pause", newValue.toString());
    }
  }
  public get restartOnPause() {
    return this._restartOnPause;
  }

  // Property which maps to the value of the "unload-on-pause" attribute
  // Determines whether the video's source(s) should be unloaded when the video is paused
  private _unloadOnPause: boolean = false;
  public set unloadOnPause(newValue: boolean) {
    this._unloadOnPause = newValue;

    if (this.hasAttribute("unload-on-pause")) {
      // If the attribute is set, update it with the new value;
      this.setAttribute("unload-on-pause", newValue.toString());
    }
  }
  public get unloadOnPause() {
    return this._unloadOnPause;
  }

  // Property which maps to the value of the "playback-start-delay" attribute
  // Determines whether/how long the video should wait before starting playback
  // after the user starts hovering
  private _playbackStartDelay: number = 0;
  public set playbackStartDelay(newValue: number) {
    this._playbackStartDelay = newValue;

    if (this.hasAttribute("playback-start-delay")) {
      this.setAttribute("playback-start-delay", newValue.toString());
    }
  }
  public get playbackStartDelay() {
    return this._playbackStartDelay;
  }

  // The video element which this player component is controling
  public video: HTMLVideoElement | null = null;
  // The element which we will watch for hover events to start and stop video playback.
  // This maps to the element with the selector set in the "hover-target" attribute if applicable,
  // or else will just be this component's host element.
  private _hoverTarget: Element | Iterable<Element> = this;
  /**
   * hoverTarget setter allows you to change the hover target element programmatically if you don't
   * want to deal with the `hover-target` selector attribute.
   * You can set a single element, a NodeList returned from querySelectorAll, or an array of elements.
   *
   * @example
   * const player = document.querySelector('hover-video-player');
   * player.hoverTarget = document.querySelectorAll('.my-hover-target');
   */
  public set hoverTarget(newHoverTarget: Element | Iterable<Element> | null) {
    // Remove any `hover-target` attribute to reduce confusion after setting the hover target programmatically
    this.removeAttribute("hover-target");
    this._setHoverTarget(newHoverTarget || this);
  }
  /**
   * hoverTarget getter returns the current hover target element that the player is using.
   */
  public get hoverTarget(): Element | Iterable<Element> {
    return this._hoverTarget;
  }

  /**
   * Whether the player is being controlled by manual calls to hover() and blur() in JS instead of
   * using hover events on the hover target element.
   */
  public get controlled() {
    const controlledAttribute = this.getAttribute("controlled");
    return controlledAttribute !== null && controlledAttribute !== "false";
  }

  /**
   * Sets whether the player is being controlled by manual calls to hover() and blur() in JS instead of
   * using hover events on the hover target element.
   */
  public set controlled(newValue: boolean) {
    if (!newValue) {
      this.removeAttribute("controlled");
    } else {
      this.setAttribute("controlled", "");
    }
  }

  // The current playback state of the player.
  private _playbackState: "paused" | "loading" | "playing" = "paused";

  public get playbackState() {
    return this._playbackState;
  }

  // The element which the user is currently hovering over. Null if the user is not hovering over a target.
  private _activeHoverTarget: EventTarget | null = null;

  // Whether the user is currently hovering over the hover target.
  public isHovering: boolean = false;
  // Whether this component has a paused overlay; this will determine whether we should
  // delay pausing the video to ensure the overlay has time to finish fading in.
  private _hasPausedOverlay: boolean = false;

  // Regex to test if a string is a time string in seconds (ie, "1.5s")
  private static _secondsTimeStringRegex = /[0-9]+(\.[0-9]+)?s/;

  /**
   * Extracts a time in milliseconds from a string which can be in the format
   * of a number of seconds (ie, "1.5s") or a number of milliseconds (ie, "1500ms", "500").
   *
   * @param {string} timeString
   */
  private static _getMillisecondsFromTimeString(timeString: string): number {
    if (HoverVideoPlayer._secondsTimeStringRegex.test(timeString)) {
      return parseFloat(timeString) * 1000;
    } else {
      return parseInt(timeString, 10);
    }
  }

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
    this.hover = this.hover.bind(this);
    this.blur = this.blur.bind(this);
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

    if (!this.controlled && !this.hasAttribute("hover-target")) {
      this._addHoverTargetListeners();
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
    this._cleanupTimeoutIDs();

    this.removeEventListener("slotchange", this._onSlotChange);
    this._removeHoverTargetListeners();
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
      case "hover-target":
        this._setHoverTargetForSelector(newValue);
        break;
      case "restart-on-pause":
        // If the new value for restart-on-pause is a string, the value should be considered truthy unless it's "false",
        // otherwise we'll assume it's null/undefined meaning the attribute isn't set, so the value should be false.
        this._restartOnPause = typeof newValue === "string" ? newValue !== "false" : false;
        break;
      case "unload-on-pause":
        this._unloadOnPause = typeof newValue === "string" ? newValue !== "false" : false;
        break;
      case "playback-start-delay":
        this._playbackStartDelay = newValue ? HoverVideoPlayer._getMillisecondsFromTimeString(newValue) : 0;
        break;
      case "controlled":
        if (newValue !== null && newValue !== "false") {
          this._removeHoverTargetListeners();
        } else {
          this._addHoverTargetListeners();
        }
        break;
      case "data-playback-state":
        // If the data-playback-state attribute was externally manipulated
        // and is now out of sync with the internal playback state, update the internal state
        if (newValue !== this._playbackState) {
          this._updatePlaybackState(newValue as typeof this._playbackState);
        }
        break;
      default:
    }
  }

  private _updatePlaybackState(newPlaybackState: typeof this._playbackState) {
    const previousPlaybackState = this._playbackState;

    this._playbackState = newPlaybackState;
    this.setAttribute("data-playback-state", newPlaybackState);

    switch (newPlaybackState) {
      case "playing":
        if (previousPlaybackState === "paused") {
          // We can't jump directly from "paused" to "playing"; step back to "loading" state first
          this._updatePlaybackState("loading");
        }
        break;
      case "loading":
        this._startPlayback();
        break;
      case "paused":
        this._stopPlayback();
        break;
      default:
        this._updatePlaybackState("paused");
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
   * Updates state and starts video playback. Triggered when the user hovers over the hover target,
   * but can be called programmatically for controlled playback.
   */
  hover(event?: Event) {
    this._activeHoverTarget = event?.currentTarget ?? null;
    if (!this.isHovering) {
      this._cleanupTimeoutIDs();

      this._updateIsHovering(true);
      this.dispatchEvent(new CustomEvent("hoverstart"));

      this._updatePlaybackState("loading");
    }
  }

  /**
   * Updates state and pauses video playback. Triggered when the user stops hovering over the hover target,
   * but can be called programmatically for controlled playback.
   */
  blur() {
    this._activeHoverTarget = null;
    if (this.isHovering) {
      this._cleanupTimeoutIDs();

      this._updateIsHovering(false);
      this._updatePlaybackState("paused");

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
      !(this._activeHoverTarget instanceof Node) ||
      !(event.target instanceof Node) ||
      !this._activeHoverTarget.contains(event.target)
    ) {
      this.blur();
    }
  }

  /**
   * Hooks up event listeners to the hover target so it can start listening for hover events that will trigger playback.
   */
  private _addHoverTargetListeners() {
    const hoverTargets = Symbol.iterator in this._hoverTarget ? this._hoverTarget : [this._hoverTarget];

    for (const hoverTarget of hoverTargets) {
      hoverTarget.addEventListener("mouseenter", this.hover);
      hoverTarget.addEventListener("mouseleave", this.blur);
      hoverTarget.addEventListener("focus", this.hover);
      hoverTarget.addEventListener("blur", this.blur);
      hoverTarget.addEventListener("touchstart", this.hover, {
        passive: true,
      });
    }
  }

  /**
   * Cleans up event listeners from a hover target element if the hover target has changed or the component has been disconnected.
   *
   * @param {HTMLElement} hoverTarget   The hover target element to remove event listeners from.
   */
  private _removeHoverTargetListeners() {
    const hoverTargets = Symbol.iterator in this._hoverTarget ? this._hoverTarget : [this._hoverTarget];

    for (const hoverTarget of hoverTargets) {
      hoverTarget.removeEventListener("mouseenter", this.hover);
      hoverTarget.removeEventListener("mouseleave", this.blur);
      hoverTarget.removeEventListener("focus", this.hover);
      hoverTarget.removeEventListener("blur", this.blur);
      hoverTarget.removeEventListener("touchstart", this.hover);
    }
  }

  private _pauseTimeoutID: number | undefined;
  private _playbackStartTimeoutID: number | undefined;

  private _cleanupTimeoutIDs() {
    window.clearTimeout(this._pauseTimeoutID);
    window.clearTimeout(this._playbackStartTimeoutID);
  }

  /**
   * Starts video playback and updates the component's
   * playback state as the video loads and plays.
   */
  private _startPlayback() {
    const video = this.video;
    if (!video) return;

    // Cancel any existing playback start timeout
    window.clearTimeout(this._playbackStartTimeoutID);

    this._playbackStartTimeoutID = window.setTimeout(() => {
      video.play().then(() => {
        this._updatePlaybackState("playing");
      }).catch((error: DOMException) => {
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
          video.play();

          // When the user clicks on the document, unmute the video since we should now
          // be free to play audio
          document.addEventListener('click', () => {
            video.muted = false;
          }, { once: true });
        } else {
          // Log any other playback errors with console.error
          console.error(`hover-video-player: ${error.message}`);
          this._updatePlaybackState("paused");
        }
      });
    }, this._playbackStartDelay || 0);
  }

  /**
   * Stops video playback.
   * If there is a paused overlay, the video will wait to pause until the overlay has finished fading in.
   * If `restartOnPause` is true, the video will be reset to the beginning.
   * If `unloadOnPause` is true, the video's sources will be unloaded.
   */
  private _stopPlayback() {
    const videoElement = this.video;
    if (!videoElement) return;

    let overlayTransitionDuration = 0;

    if (this._hasPausedOverlay) {
      const transitionDurationCSSVarValue = getComputedStyle(this).getPropertyValue("--overlay-transition-duration");
      overlayTransitionDuration = HoverVideoPlayer._getMillisecondsFromTimeString(transitionDurationCSSVarValue);
    }

    // Set a timeout to make sure we don't pause the video before the paused overlay transition
    // has had time to finish (if there is no paused overlay, the timeout will be 0)
    this._pauseTimeoutID = window.setTimeout(() => {
      if (!videoElement) return;

      videoElement.pause();

      // If the video should restart when paused, reset the video's time to 0
      if (this.restartOnPause) {
        videoElement.currentTime = 0;
      }

      // If the video's sources should be unloaded after pausing,
      // we will need to remove them from the video, force the video to manually load
      // with the sources removed, and then restore the sources so the video will be able to
      // load and play them again when the user hovers over the player again.
      if (this.unloadOnPause) {
        // Hang onto the current time the video is at so we can restore to there after unloading
        const currentTime = videoElement.currentTime;

        // If there's an `src` attribute on the video, we'll temporarily remove it
        const previousSrcAttribute = videoElement.getAttribute("src");
        videoElement.removeAttribute("src");

        // We should also grab all <source> elements in the video and remove them
        const sourceElements = videoElement.querySelectorAll("source");
        const sourceElementCount = sourceElements.length;
        for (let i = 0; i < sourceElementCount; ++i) {
          sourceElements[i].remove();
        }

        // Wait until the video's sources are successfully emptied before restoring the sources
        // to make sure things really do get fully unloaded.
        videoElement.addEventListener("emptied", () => {
          // Restore the `src` attribute and/or source elements
          if (previousSrcAttribute) {
            videoElement.src = previousSrcAttribute;
          }
          for (let i = 0; i < sourceElementCount; ++i) {
            videoElement.appendChild(sourceElements[i]);
          }

          videoElement.currentTime = currentTime;
        }, {
          once: true,
        });

        // Re-load the video with the sources removed so we unload everything from memory
        videoElement.load();

      }
    }, overlayTransitionDuration);
  }

  /**
   * Grabs the video element when the video slot changes so we can control it.
   */
  private _onDefaultSlotChange(target: HTMLSlotElement) {
    const defaultSlotNodes = target.assignedNodes({ flatten: true });

    const videoElement = defaultSlotNodes.find((node): node is HTMLVideoElement => node instanceof HTMLVideoElement);
    if (videoElement) {
      if (this.unloadOnPause && (!videoElement.preload || videoElement.preload === "auto")) {
        // If the unloadOnPause property is set and the video's preload property is set to "auto",
        // we need to change it to "metadata"; otherwise, the browser will start pre-loading the entire
        // video and defeat the whole purpose of unloading the video when it's paused.
        videoElement.preload = "metadata";
      }

      this.video = videoElement;
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
    const target = event.target;
    if (!(target instanceof HTMLSlotElement)) {
      return;
    }

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
   * Updates the component's hover target element, cleans up event listeners on the
   * old hover target, and sets up new listeners on the new hover target.
   *
   * @param {Element} newHoverTarget
   */
  private _setHoverTarget(newHoverTarget: Iterable<Element> | Element) {
    if (newHoverTarget === this._hoverTarget) return;

    this._removeHoverTargetListeners();
    this._hoverTarget = newHoverTarget;
    if (!this.controlled) {
      this._addHoverTargetListeners();
    }
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

    const hoverTarget = document.querySelectorAll(selector);
    if (hoverTarget.length === 0) {
      console.error(`hover-video-player failed to find a hover target element with the selector "${selector}".`);
      this._setHoverTarget(this);
    } else {
      this._setHoverTarget(hoverTarget);
    }
  }
}

if (!customElements.get('hover-video-player')) {
  // Only define the element if it isn't already defined; this can happen due to
  // HMR keeping the browser state the same but re-loading and re-running this script
  customElements.define("hover-video-player", HoverVideoPlayer);
}

declare global {
  interface HTMLElementTagNameMap {
    "hover-video-player": HoverVideoPlayer;
  }
}
