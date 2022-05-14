"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoverVideoPlayer = void 0;
const lit_element_1 = require("lit-element");
let HoverVideoPlayer = class HoverVideoPlayer extends lit_element_1.LitElement {
    constructor() {
        super(...arguments);
        this.videoSources = [];
        this.hoverTargetSelector = null;
        this.onHoverStartCallback = null;
        this.onHoverEndCallback = null;
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
          loadingStateTimeout = 200,
          overlayTransitionDuration = 400,
          restartOnPaused = false,
          unloadVideoOnPaused = false,
          playbackRangeStart = null,
          playbackRangeEnd = null,
          muted = true,
          volume = 1,
          loop = true,
          preload = null,
          crossOrigin = 'anonymous',
          controls = false,
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
          sizingMode = 'video',
          shouldSuppressPlaybackInterruptedErrors = true,
          */
        this.sizingMode = "video";
        this.hoverTarget = null;
        this.isHovering = false;
        this.playbackState = "paused";
        this.playVideoPromise = null;
    }
    onHoverStart() {
        if (!this.isHovering) {
            this.isHovering = true;
            if (this.onHoverStartCallback)
                this.onHoverStartCallback();
        }
    }
    onHoverEnd() {
        if (this.isHovering) {
            this.isHovering = false;
            if (this.onHoverEndCallback)
                this.onHoverEndCallback();
        }
    }
    onTouchOutsideOfHoverTarget(event) {
        // Don't do anything if the user isn't currently hovering over the player
        if (!this.isHovering)
            return;
        if (!this.hoverTarget ||
            !(event.target instanceof Node) ||
            !this.hoverTarget.contains(event.target)) {
            this.onHoverEnd();
        }
    }
    addListenersToHoverTarget() {
        this.cleanUpHoverTargetListeners();
        this.hoverTarget = this.hoverTargetSelector
            ? document.querySelector(this.hoverTargetSelector)
            : this.containerElement;
        if (!this.hoverTarget) {
            console.error("hover-video-player was unable to add event listeners to a hover target. Please check your usage of the `hover-target` attribute.");
        }
        else {
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
        this.addListenersToHoverTarget();
        window.addEventListener("touchstart", this.onTouchOutsideOfHoverTarget, {
            passive: true,
        });
    }
    disconnectedCallback() {
        window.removeEventListener("touchstart", this.onTouchOutsideOfHoverTarget);
    }
    attributeChangedCallback(name, _old
    // value: string | null
    ) {
        switch (name) {
            case "hover-target":
                this.addListenersToHoverTarget();
                break;
            default:
        }
    }
    updated(_changedProperties) {
        if (_changedProperties.has("isHovering")) {
            if (this.isHovering) {
                this.startPlayback();
            }
            else {
                this.stopPlayback();
            }
        }
    }
    startPlayback() {
        return __awaiter(this, void 0, void 0, function* () {
            clearTimeout(this.pauseTimeoutID);
            this.playbackState = "loading";
            this.playVideoPromise = this.videoElement.play();
            this.playVideoPromise
                .then(() => {
                this.playbackState = "playing";
            })
                .catch((err) => {
                this.playbackState = "paused";
                console.error(err);
            });
        });
    }
    stopPlayback() {
        clearTimeout(this.pauseTimeoutID);
        this.playbackState = "paused";
        this.pauseTimeoutID = setTimeout(() => {
            this.videoElement.pause();
        }, 200);
    }
    render() {
        return (0, lit_element_1.html) `
      <div
        hvp-container
        sizing-mode="${this.sizingMode}"
        is-hovering="${this.isHovering}"
        playback-state="${this.playbackState}"
      >
        <slot name="paused-overlay"></slot>
        <slot name="loading-overlay"></slot>
        <video>
          ${this.videoSources.map(({ src, type }) => (0, lit_element_1.html) `<source src="${src}" type="${type}" />`)}
        </video>
      </div>
    `;
    }
};
HoverVideoPlayer.styles = (0, lit_element_1.css) `
    /* The container is styled as inline-block for "video" and "overlay" sizing modes */
    [sizing-mode="video"],
    [sizing-mode="overlay"] {
      display: inline-block;
    }

    [sizing-mode="video"] video {
      display: block;
      width: 100%;
    }

    [sizing-mode="overlay"] [name="paused-overlay"] {
      position: relative;
    }

    [sizing-mode="overlay"] video,
    [sizing-mode="container"] video,
    [sizing-mode="video"] [name="paused-overlay"],
    [sizing-mode="container"] [name="paused-overlay"],
    ::slotted([name="loading-overlay"]) {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }

    [name="paused-overlay"],
    [name="loading-overlay"] {
      opacity: 0;
      pointer-events: none;
      transition: opacity;
      /* TEMPORARY */
      transition-duration: 0.2s;
    }

    [playback-state="paused"],
    [playback-state="loading"] {
      [name="paused-overlay"] {
        opacity: 1;
        pointer-events: auto;
      }
    }

    [playback-state="loading"] {
      [name="loading-overlay"] {
        opacity: 1;
        pointer-events: auto;
      }
    }
  `;
__decorate([
    (0, lit_element_1.property)({
        attribute: "src",
        converter(value) {
            if (!value)
                return [];
            const parsedValue = JSON.parse(value);
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
    (0, lit_element_1.property)({
        attribute: "hover-target",
        type: "string",
    })
], HoverVideoPlayer.prototype, "hoverTargetSelector", void 0);
__decorate([
    (0, lit_element_1.property)({
        attribute: "onhoverstart",
        type: "function",
    })
], HoverVideoPlayer.prototype, "onHoverStartCallback", void 0);
__decorate([
    (0, lit_element_1.property)({
        attribute: "onhoverend",
        type: "function",
    })
], HoverVideoPlayer.prototype, "onHoverEndCallback", void 0);
__decorate([
    (0, lit_element_1.query)("[hvp-container]")
], HoverVideoPlayer.prototype, "containerElement", void 0);
__decorate([
    (0, lit_element_1.query)("video")
], HoverVideoPlayer.prototype, "videoElement", void 0);
__decorate([
    (0, lit_element_1.state)()
], HoverVideoPlayer.prototype, "isHovering", void 0);
__decorate([
    (0, lit_element_1.state)()
], HoverVideoPlayer.prototype, "playbackState", void 0);
HoverVideoPlayer = __decorate([
    (0, lit_element_1.customElement)("hover-video-player")
], HoverVideoPlayer);
exports.HoverVideoPlayer = HoverVideoPlayer;
