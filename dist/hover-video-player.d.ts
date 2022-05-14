import { LitElement, PropertyValues } from "lit";
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
export declare class HoverVideoPlayer extends LitElement {
    videoSources: VideoSource[];
    hoverTargetSelector: string | null;
    onHoverStartCallback: (() => void) | null;
    onHoverEndCallback: (() => void) | null;
    loadingStateTimeout: number;
    overlayTransitionDuration: number;
    sizingMode: "video" | "overlay" | "container" | "manual";
    isMuted: boolean;
    volume: number;
    shouldLoop: boolean;
    preload: "auto" | "metadata" | "none" | null;
    crossOrigin: "anonymous" | "use-credentials";
    shouldShowControls: boolean;
    containerElement: HTMLDivElement;
    video: HTMLVideoElement;
    hoverTarget: HTMLElement | null;
    private _isHovering;
    private playbackState;
    private playVideoPromise;
    constructor();
    private onHoverStart;
    private onHoverEnd;
    private onTouchOutsideOfHoverTarget;
    private updateHoverTarget;
    private addListenersToHoverTarget;
    private cleanUpHoverTargetListeners;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected firstUpdated(): void;
    protected updated(changedProperties: PropertyValues<this>): void;
    pauseTimeoutID: number | undefined;
    startPlayback(): Promise<void>;
    stopPlayback(): void;
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        "hover-video-player": HoverVideoPlayer;
    }
}
export {};
//# sourceMappingURL=hover-video-player.d.ts.map