/**
 * Per-frame callback when using {@link startRenderLoop} with animation.
 * @param elapsed - Seconds since the clock started (see THREE.Clock).
 * @param delta - Seconds since the last frame.
 */
export type FrameCallback = (elapsed: number, delta: number) => void;
