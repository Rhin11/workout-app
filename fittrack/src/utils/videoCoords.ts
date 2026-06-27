/** Where the video picture sits inside a container when using object-contain. */
export interface ContentRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getVideoContentRect(
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number,
): ContentRect {
  if (!containerWidth || !containerHeight || !videoWidth || !videoHeight) {
    return { left: 0, top: 0, width: containerWidth, height: containerHeight };
  }
  const videoAR = videoWidth / videoHeight;
  const containerAR = containerWidth / containerHeight;
  if (videoAR > containerAR) {
    const width = containerWidth;
    const height = width / videoAR;
    return { left: 0, top: (containerHeight - height) / 2, width, height };
  }
  const height = containerHeight;
  const width = height * videoAR;
  return { left: (containerWidth - width) / 2, top: 0, width, height };
}

/** Map a click on a container to native video pixel coordinates (object-contain). */
export function clientToVideoPixels(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  videoWidth: number,
  videoHeight: number,
): { x: number; y: number } | null {
  const cr = getVideoContentRect(containerRect.width, containerRect.height, videoWidth, videoHeight);
  const localX = clientX - containerRect.left - cr.left;
  const localY = clientY - containerRect.top - cr.top;
  if (localX < 0 || localY < 0 || localX > cr.width || localY > cr.height) return null;
  return {
    x: (localX / cr.width) * videoWidth,
    y: (localY / cr.height) * videoHeight,
  };
}

/** Fractional position (0–1) within the video picture for marker placement. */
export function videoPixelsToFraction(
  x: number,
  y: number,
  videoWidth: number,
  videoHeight: number,
): { fx: number; fy: number } {
  return { fx: x / videoWidth, fy: y / videoHeight };
}
