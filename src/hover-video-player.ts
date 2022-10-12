import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

@customElement("hover-video-player")
export class HoverVideoPlayer extends LitElement {
  @property({
    attribute: "hover-target",
    type: String,
  })
  hoverTargetSelector: string | null = null;

  @property({ attribute: "loading-timeout", type: Number })
  loadingStateTimeout: number = 200;

  @property({ attribute: "overlay-transition-duration", type: Number })
  overlayTransitionDuration: number = 400;

  @property({ attribute: "restart-on-pause", type: Boolean })
  restartOnPause: boolean = false;

  @property({ attribute: "unload-on-pause", type: Boolean })
  unloadOnPause: boolean = false;

  @property({
    attribute: "sizing-mode",
    type: String,
  })
  sizingMode: "video" | "overlay" | "container" | "manual" = "video";

  @query("[part='container']")
  containerElement!: HTMLDivElement;

  @property()
  video: HTMLVideoElement | null = null;

  @property()
  hoverTarget: HTMLElement | null = null;

  private _hasPausedOverlay: boolean = false;

  @state()
  private _isHovering: boolean = false;

  @state()
  private playbackState: "paused" | "loading" | "playing" = "paused";

  constructor() {
    super();

    this._onHoverStart = this._onHoverStart.bind(this);
    this._onHoverEnd = this._onHoverEnd.bind(this);
    this._onTouchOutsideOfHoverTarget =
      this._onTouchOutsideOfHoverTarget.bind(this);
  }

  /**
   * Handler updates state and starts video playback when the user hovers over the hover target.
   */
  private _onHoverStart() {
    if (!this._isHovering) {
      this._isHovering = true;
      this._startPlayback();

      this.dispatchEvent(new CustomEvent("hoverstart"));
    }
  }

  /**
   * Handler updates state and pauses video playback when the user stops hovering over the hover target.
   */
  private _onHoverEnd() {
    if (this._isHovering) {
      this._isHovering = false;
      this._stopPlayback();

      this.dispatchEvent(new CustomEvent("hoverend"));
    }
  }

  /**
   * Handler checks touch events and pauses playback if the user touches outside of the hover target.
   */
  private _onTouchOutsideOfHoverTarget(event: TouchEvent) {
    // Don't do anything if the user isn't currently hovering over the player
    if (!this._isHovering) return;

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
  private _addHoverTargetListeners(hoverTarget: HTMLElement) {
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
  private _removeHoverTargetListeners(hoverTarget: HTMLElement | null) {
    if (hoverTarget) {
      hoverTarget.removeEventListener("mouseenter", this._onHoverStart);
      hoverTarget.removeEventListener("mouseleave", this._onHoverEnd);
      hoverTarget.removeEventListener("focus", this._onHoverStart);
      hoverTarget.removeEventListener("blur", this._onHoverEnd);
      hoverTarget.removeEventListener("touchstart", this._onHoverStart);
    }
  }

  private _pauseTimeoutID: number | undefined;

  /**
   * Starts video playback and updates the component's
   * playback state as the video loads and plays.
   */
  private _startPlayback() {
    if (!this.video) return;

    window.clearTimeout(this._pauseTimeoutID);

    this.playbackState = "loading";

    this.video.play().then(() => {
      this.playbackState = "playing";
    }).catch((err) => {
      this.playbackState = "paused";

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

    this.playbackState = "paused";
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
    }, this._hasPausedOverlay ? this.overlayTransitionDuration : 0);
  }

  /**
   * Grabs the video element when the video slot changes so we can control it.
   */
  private _onVideoSlotChanged(event: Event) {
    const target = event?.target as HTMLSlotElement;
    const childNodes = target.assignedNodes({ flatten: true });

    if (childNodes[0] instanceof HTMLVideoElement) {
      this.video = childNodes[0];

      if (this.unloadOnPause && !this.video.hasAttribute("preload")) {
        // If the unloadOnPause property is set and no preload attribute is set on the video, default it to
        // "metadata" so the video doesn't auto-load and defeat the purpose of unloading the video.
        this.video.setAttribute("preload", "metadata");
      }
    } else {
      this.video = null;
    }
  }

  /**
   * Tracks whether this component has a paused overlay when the paused-overlay slot updates.
   * This informs whether we should delay pausing the video if we have a paused overlay that needs to fade in first.
   */
  private _onPausedOverlaySlotChange(event: Event) {
    const target = event?.target as HTMLSlotElement;
    const childNodes = target.assignedNodes({ flatten: true });

    this._hasPausedOverlay = childNodes.length > 0;
  }

  /**
   * LitElement lifecycle method that fires when the component is connected to the DOM.
   */
  connectedCallback() {
    super.connectedCallback();

    window.addEventListener("touchstart", this._onTouchOutsideOfHoverTarget, {
      passive: true,
    });
  }

  /**
   * LitElement lifecycle method that fires when the component is disconnected from the DOM.
   */
  disconnectedCallback() {
    super.disconnectedCallback();

    this._removeHoverTargetListeners(this.hoverTarget);
    window.removeEventListener("touchstart", this._onTouchOutsideOfHoverTarget);
  }

  /**
   * LitElement lifecycle method that fires when the component's properties change.
   *
   * @param {PropertyValues} changedProperties - Map with the names of the changed properties as keys and the previous property values as the values.
   */
  protected updated(changedProperties: PropertyValues<this>): void {
    if (
      changedProperties.has("hoverTargetSelector")
    ) {
      // If the hover target selector changed, get the element for that selector and update our hoverTarget property
      // If no selector is provided, we'll default to using this component's container element as the hover target
      this.hoverTarget = this.hoverTargetSelector
        ? document.querySelector(this.hoverTargetSelector)
        : this.containerElement;

      if (!this.hoverTarget) {
        console.error("hover-video-player failed to find hover target with selector", this.hoverTargetSelector);
      }
    }

    if (changedProperties.has("hoverTarget")) {
      // Clean up listeners on any previous hover target
      const previousHoverTarget = changedProperties.get("hoverTarget");
      if (previousHoverTarget) {
        this._removeHoverTargetListeners(previousHoverTarget);
      }

      // Add listeners to the new hover target
      if (this.hoverTarget) {
        this._addHoverTargetListeners(this.hoverTarget);
      }
    }
  }

  static styles = css`
    :host::part(container) {
      position: relative;
    }

    /* The container is styled as inline-block for "video" and "overlay" sizing modes */
    [data-sizing-mode="video"],
    [data-sizing-mode="overlay"] {
      display: inline-block;
    }

    [data-sizing-mode="video"] ::slotted(video) {
      display: block;
      width: 100%;
    }

    [data-sizing-mode="overlay"] ::slotted([slot="paused-overlay"]) {
      position: relative;
    }

    [data-sizing-mode="overlay"] ::slotted(video),
    [data-sizing-mode="container"] ::slotted(video),
    [data-sizing-mode="video"] ::slotted([slot="paused-overlay"]),
    [data-sizing-mode="container"] ::slotted([slot="paused-overlay"]),
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

    [data-playback-state="paused"] ::slotted([slot="paused-overlay"]),
    [data-playback-state="loading"] ::slotted([slot="paused-overlay"]),
    [data-playback-state="loading"] ::slotted([slot="loading-overlay"]),
    [data-is-hovering="true"] ::slotted([slot="hover-overlay"]) {
      opacity: 1;
      pointer-events: auto;
    }

    [data-playback-state="loading"] ::slotted([slot="loading-overlay"]) {
      /* Delay the loading overlay fading in */
      transition-delay: var(--loading-state-timeout);
    }
  `;

  render() {
    return html`
      <div
        part="container"
        data-sizing-mode="${this.sizingMode}"
        data-is-hovering="${this._isHovering}"
        data-playback-state="${this.playbackState}"
      >
        <slot name="video" @slotchange=${this._onVideoSlotChanged}></slot>
        <slot name="paused-overlay" @slotchange=${this._onPausedOverlaySlotChange}></slot>
        <slot name="loading-overlay"></slot>
        <slot name="hover-overlay"></slot>
      </div>
      <style>
        :host {
          --overlay-transition-duration: ${this.overlayTransitionDuration}ms;
          --loading-state-timeout: ${this.loadingStateTimeout}ms;
        }
      </style>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hover-video-player": HoverVideoPlayer;
  }
}
