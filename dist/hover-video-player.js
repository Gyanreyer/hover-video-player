var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
let HoverVideoPlayer = class HoverVideoPlayer extends LitElement {
    constructor() {
        super();
        this.videoSources = [];
        this.hoverTargetSelector = null;
        this.onHoverStartCallback = null;
        this.onHoverEndCallback = null;
        this.loadingStateTimeout = 200;
        this.overlayTransitionDuration = 400;
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
        this.sizingMode = "video";
        this.isMuted = true;
        this.volume = 1;
        this.shouldLoop = true;
        this.preload = null;
        this.crossOrigin = "anonymous";
        this.shouldShowControls = false;
        this.hoverTarget = null;
        this._isHovering = false;
        this.playbackState = "paused";
        this.playVideoPromise = null;
        this.onHoverStart = this.onHoverStart.bind(this);
        this.onHoverEnd = this.onHoverEnd.bind(this);
        this.onTouchOutsideOfHoverTarget =
            this.onTouchOutsideOfHoverTarget.bind(this);
    }
    onHoverStart() {
        if (!this._isHovering) {
            this._isHovering = true;
            this.startPlayback();
            if (this.onHoverStartCallback)
                this.onHoverStartCallback();
        }
    }
    onHoverEnd() {
        if (this._isHovering) {
            this._isHovering = false;
            this.stopPlayback();
            if (this.onHoverEndCallback)
                this.onHoverEndCallback();
        }
    }
    onTouchOutsideOfHoverTarget(event) {
        // Don't do anything if the user isn't currently hovering over the player
        if (!this._isHovering)
            return;
        if (!this.hoverTarget ||
            !(event.target instanceof Node) ||
            !this.hoverTarget.contains(event.target)) {
            this.onHoverEnd();
        }
    }
    // Note to future self: I'm trying to make it so you can set the hoverTarget programmatically as well as by using a selector
    updateHoverTarget() { }
    addListenersToHoverTarget(hoverTarget) {
        this.cleanUpHoverTargetListeners(hoverTarget);
        if (!this.hoverTarget) {
            console.error("hover-video-player was unable to add event listeners to a hover target. Please check your usage of the `hover-target` attribute.");
        }
        else {
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
    cleanUpHoverTargetListeners() {
        if (this.hoverTarget) {
            this.hoverTarget.removeEventListener("mouseenter", this.onHoverStart);
            this.hoverTarget.removeEventListener("mouseleave", this.onHoverEnd);
            this.hoverTarget.removeEventListener("focus", this.onHoverStart);
            this.hoverTarget.removeEventListener("blur", this.onHoverEnd);
            this.hoverTarget.removeEventListener("touchstart", this.onHoverStart);
        }
    }
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener("touchstart", this.onTouchOutsideOfHoverTarget, {
            passive: true,
        });
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.cleanUpHoverTargetListeners();
        window.removeEventListener("touchstart", this.onTouchOutsideOfHoverTarget);
    }
    firstUpdated() {
        this.addListenersToHoverTarget();
        this.hoverTarget = this.hoverTargetSelector
            ? document.querySelector(this.hoverTargetSelector)
            : this.containerElement;
    }
    updated(changedProperties) {
        if (changedProperties.has("hoverTargetSelector") ||
            changedProperties.has("hoverTarget")) {
            this.addListenersToHoverTarget();
        }
    }
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
    render() {
        return html `
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
          ${this.videoSources.map(({ src, type }) => html `<source src="${src}" type="${type}" />`)}
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
};
HoverVideoPlayer.styles = css `
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
__decorate([
    property({
        attribute: "src",
        converter(value) {
            if (!value)
                return [];
            let parsedValue;
            try {
                parsedValue = JSON.parse(value);
            }
            catch (err) {
                parsedValue = value;
            }
            const videoSrcArray = Array.isArray(parsedValue)
                ? parsedValue
                : [parsedValue];
            const formattedVideoSources = [];
            videoSrcArray.forEach((source) => {
                if (typeof source === "string") {
                    formattedVideoSources.push({
                        src: source,
                    });
                }
                else if (typeof source === "object" && source.src) {
                    formattedVideoSources.push({
                        src: source.src,
                        type: source.type,
                    });
                }
                else {
                    // Log an error if one of the source values is invalid
                    console.error("Error: invalid value provided to hover-video-player attribute 'src':", source);
                }
            });
            return formattedVideoSources;
        },
    })
], HoverVideoPlayer.prototype, "videoSources", void 0);
__decorate([
    property({
        attribute: "hover-target",
        type: "string",
    })
], HoverVideoPlayer.prototype, "hoverTargetSelector", void 0);
__decorate([
    property({
        attribute: "onhoverstart",
        type: "function",
    })
], HoverVideoPlayer.prototype, "onHoverStartCallback", void 0);
__decorate([
    property({
        attribute: "onhoverend",
        type: "function",
    })
], HoverVideoPlayer.prototype, "onHoverEndCallback", void 0);
__decorate([
    property({ attribute: "loading-timeout", type: "number" })
], HoverVideoPlayer.prototype, "loadingStateTimeout", void 0);
__decorate([
    property({ attribute: "overlay-transition-duration", type: "number" })
], HoverVideoPlayer.prototype, "overlayTransitionDuration", void 0);
__decorate([
    property({
        attribute: "sizing-mode",
        type: "string",
    })
], HoverVideoPlayer.prototype, "sizingMode", void 0);
__decorate([
    property({
        attribute: "muted",
        type: "boolean",
        converter(value) {
            return value !== "false";
        },
    })
], HoverVideoPlayer.prototype, "isMuted", void 0);
__decorate([
    property({
        attribute: "volume",
        type: "number",
    })
], HoverVideoPlayer.prototype, "volume", void 0);
__decorate([
    property({
        attribute: "loop",
        type: "boolean",
        converter(value) {
            return value !== "false";
        },
    })
], HoverVideoPlayer.prototype, "shouldLoop", void 0);
__decorate([
    property({
        attribute: "preload",
        type: "string",
    })
], HoverVideoPlayer.prototype, "preload", void 0);
__decorate([
    property({
        attribute: "crossorigin",
        type: "string",
    })
], HoverVideoPlayer.prototype, "crossOrigin", void 0);
__decorate([
    property({
        attribute: "controls",
        type: "boolean",
    })
], HoverVideoPlayer.prototype, "shouldShowControls", void 0);
__decorate([
    query("[hvp-container]")
], HoverVideoPlayer.prototype, "containerElement", void 0);
__decorate([
    query("video")
], HoverVideoPlayer.prototype, "video", void 0);
__decorate([
    property()
], HoverVideoPlayer.prototype, "hoverTarget", void 0);
__decorate([
    state()
], HoverVideoPlayer.prototype, "_isHovering", void 0);
__decorate([
    state()
], HoverVideoPlayer.prototype, "playbackState", void 0);
HoverVideoPlayer = __decorate([
    customElement("hover-video-player")
], HoverVideoPlayer);
export { HoverVideoPlayer };
//# sourceMappingURL=hover-video-player.js.map