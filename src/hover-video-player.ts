import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

interface VideoSource {
  /**
   * The src URL string to use for a video player source
   */
  src: string;
  /**
   * The media type of the video, ie 'video/mp4'
   */
  type?: string;
}

@customElement("hover-video-player")
export class HoverVideoPlayer extends LitElement {
  @property({
    attribute: "src",
    converter(value): VideoSource[] {
      if (!value) return [];

      let parsedValue;

      try {
        parsedValue = JSON.parse(value);
      } catch (err) {
        parsedValue = value;
      }

      const videoSrcArray = Array.isArray(parsedValue)
        ? parsedValue
        : [parsedValue];

      const formattedVideoSources: VideoSource[] = [];

      videoSrcArray.forEach((source) => {
        if (typeof source === "string") {
          formattedVideoSources.push({
            src: source,
          });
        } else if (typeof source === "object" && source.src) {
          formattedVideoSources.push({
            src: source.src,
            type: source.type,
          });
        } else {
          // Log an error if one of the source values is invalid
          console.error(
            "Error: invalid value provided to hover-video-player attribute 'src':",
            source
          );
        }
      });

      return formattedVideoSources;
    },
  })
  videoSources: VideoSource[] = [];

  @property({
    attribute: "hover-target",
    type: "string",
  })
  hoverTargetSelector: string | null = null;

  @property({
    attribute: "onhoverstart",
    type: "function",
  })
  onHoverStartCallback: (() => void) | null = null;

  @property({
    attribute: "onhoverend",
    type: "function",
  })
  onHoverEndCallback: (() => void) | null = null;

  @property({ attribute: "loading-timeout", type: "number" })
  loadingStateTimeout: number = 200;

  @property({ attribute: "overlay-transition-duration", type: "number" })
  overlayTransitionDuration: number = 400;

  /*
    videoCaptions = null,
    focused = false,
    disableDefaultEventHandling = false,
    hoverTarget = null,
    onHoverStart = null,
    onHoverEnd = null,
    hoverOverlay = null,
    pausedOverlay = null,
    loadingOverlay = null,

    restartOnPaused = false,
    unloadVideoOnPaused = false,
    playbackRangeStart = null,
    playbackRangeEnd = null,
    controlsList = null,
    disableRemotePlayback = true,
    disablePictureInPicture = true,
    className = null,
    style = null,
    hoverOverlayWrapperClassName = null,
    hoverOverlayWrapperStyle = null,
    pausedOverlayWrapperClassName = null,
    pausedOverlayWrapperStyle = null,
    loadingOverlayWrapperClassName = null,
    loadingOverlayWrapperStyle = null,
    videoId = null,
    videoClassName = null,
    videoRef: forwardedVideoRef = null,
    videoStyle = null,
    shouldSuppressPlaybackInterruptedErrors = true,
    */

  @property({
    attribute: "sizing-mode",
    type: "string",
  })
  sizingMode: "video" | "overlay" | "container" | "manual" = "video";

  @property({
    attribute: "muted",
    type: "boolean",
    converter(value): boolean {
      return value !== "false";
    },
  })
  isMuted: boolean = true;

  @property({
    attribute: "volume",
    type: "number",
  })
  volume: number = 1;

  @property({
    attribute: "loop",
    type: "boolean",
    converter(value): boolean {
      return value !== "false";
    },
  })
  shouldLoop: boolean = true;

  @property({
    attribute: "preload",
    type: "string",
  })
  preload: "auto" | "metadata" | "none" | null = null;

  @property({
    attribute: "crossorigin",
    type: "string",
  })
  crossOrigin: "anonymous" | "use-credentials" = "anonymous";

  @property({
    attribute: "controls",
    type: "boolean",
  })
  shouldShowControls: boolean = false;

  @query("[hvp-container]")
  containerElement!: HTMLDivElement;

  @query("video")
  video!: HTMLVideoElement;

  @property()
  hoverTarget: HTMLElement | null = null;

  @state()
  private _isHovering: boolean = false;

  @state()
  private playbackState: "paused" | "loading" | "playing" = "paused";

  private playVideoPromise: Promise<void> | null = null;

  constructor() {
    super();

    this.onHoverStart = this.onHoverStart.bind(this);
    this.onHoverEnd = this.onHoverEnd.bind(this);
    this.onTouchOutsideOfHoverTarget =
      this.onTouchOutsideOfHoverTarget.bind(this);
  }

  private onHoverStart() {
    if (!this._isHovering) {
      this._isHovering = true;
      this.startPlayback();
      if (this.onHoverStartCallback) this.onHoverStartCallback();
    }
  }

  private onHoverEnd() {
    if (this._isHovering) {
      this._isHovering = false;
      this.stopPlayback();
      if (this.onHoverEndCallback) this.onHoverEndCallback();
    }
  }

  private onTouchOutsideOfHoverTarget(event: TouchEvent) {
    // Don't do anything if the user isn't currently hovering over the player
    if (!this._isHovering) return;

    if (
      !this.hoverTarget ||
      !(event.target instanceof Node) ||
      !this.hoverTarget.contains(event.target)
    ) {
      this.onHoverEnd();
    }
  }

  // Note to future self: I'm trying to make it so you can set the hoverTarget programmatically as well as by using a selector
  private updateHoverTarget(){}

  private addListenersToHoverTarget(hoverTarget: HTMLElement) {
    this.cleanUpHoverTargetListeners(hoverTarget);

    if (!this.hoverTarget) {
      console.error(
        "hover-video-player was unable to add event listeners to a hover target. Please check your usage of the `hover-target` attribute."
      );
    } else {
      console.log("Adding listeners to hover target");
      this.hoverTarget.addEventListener("mouseenter", this.onHoverStart);
      this.hoverTarget.addEventListener("mouseleave", this.onHoverEnd);
      this.hoverTarget.addEventListener("focus", this.onHoverStart);
      this.hoverTarget.addEventListener("blur", this.onHoverEnd);
      this.hoverTarget.addEventListener("touchstart", this.onHoverStart, {
        passive: true,
      });
    }
  }

  private cleanUpHoverTargetListeners() {
    if (this.hoverTarget) {
      this.hoverTarget.removeEventListener("mouseenter", this.onHoverStart);
      this.hoverTarget.removeEventListener("mouseleave", this.onHoverEnd);
      this.hoverTarget.removeEventListener("focus", this.onHoverStart);
      this.hoverTarget.removeEventListener("blur", this.onHoverEnd);
      this.hoverTarget.removeEventListener("touchstart", this.onHoverStart);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();

    window.addEventListener("touchstart", this.onTouchOutsideOfHoverTarget, {
      passive: true,
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    this.cleanUpHoverTargetListeners();
    window.removeEventListener("touchstart", this.onTouchOutsideOfHoverTarget);
  }

  protected firstUpdated(): void {
    this.addListenersToHoverTarget();

    this.hoverTarget = this.hoverTargetSelector
    ? document.querySelector(this.hoverTargetSelector)
    : this.containerElement;
  }

  protected updated(changedProperties: PropertyValues<this>): void {
    if (
      changedProperties.has("hoverTargetSelector") ||
      changedProperties.has("hoverTarget")
    ) {
      this.addListenersToHoverTarget();
    }
  }

  pauseTimeoutID: number | undefined;

  async startPlayback() {
    window.clearTimeout(this.pauseTimeoutID);

    this.playbackState = "loading";
    this.playVideoPromise = this.video.play();

    this.playVideoPromise
      .then(() => {
        this.playbackState = "playing";
      })
      .catch((err) => {
        this.playbackState = "paused";

        console.error(err);
      });
  }

  stopPlayback() {
    window.clearTimeout(this.pauseTimeoutID);

    this.playbackState = "paused";
    this.pauseTimeoutID = window.setTimeout(() => {
      this.video.pause();
    }, 200);
  }

  static styles = css`
    [hvp-container] {
      position: relative;
    }

    /* The container is styled as inline-block for "video" and "overlay" sizing modes */
    [sizing-mode="video"],
    [sizing-mode="overlay"] {
      display: inline-block;
    }

    [sizing-mode="video"] video {
      display: block;
      width: 100%;
    }

    [sizing-mode="overlay"] slot[name="paused-overlay"] {
      position: relative;
    }

    [sizing-mode="overlay"] video,
    [sizing-mode="container"] video,
    [sizing-mode="video"] slot[name="paused-overlay"],
    [sizing-mode="container"] slot[name="paused-overlay"],
    slot[name="loading-overlay"],
    slot[name="hover-overlay"] {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }

    slot[name="paused-overlay"],
    slot[name="loading-overlay"],
    slot[name="hover-overlay"] {
      display: block;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--overlay-transition-duration);
    }

    slot[name="paused-overlay"] {
      z-index: 1;
    }

    slot[name="loading-overlay"] {
      z-index: 2;
    }

    [playback-state="paused"] slot[name="paused-overlay"],
    [playback-state="loading"] slot[name="paused-overlay"],
    [playback-state="loading"] slot[name="loading-overlay"] {
      opacity: 1;
      pointer-events: auto;
    }

    [playback-state="loading"] slot[name="loading-overlay"] {
      /* Delay the loading overlay fading in */
      transition-delay: var(--loading-state-timeout);
    }
  `;

  render() {
    return html`
      <div
        hvp-container
        sizing-mode="${this.sizingMode}"
        is-hovering="${this._isHovering}"
        playback-state="${this.playbackState}"
        class="${this.className}"
        style="${this.style.cssText}"
      >
        <slot name="paused-overlay"></slot>
        <slot name="loading-overlay"></slot>
        <slot name="hover-overlay"></slot>
        <video
          .muted=${this.isMuted}
          .volume=${this.volume}
          ?loop=${this.shouldLoop}
          ?controls=${this.shouldShowControls}
          preload=${this.preload}
          crossorigin=${this.crossOrigin}
        >
          ${this.videoSources.map(
            ({ src, type }) => html`<source src="${src}" type="${type}" />`
          )}
        </video>
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
