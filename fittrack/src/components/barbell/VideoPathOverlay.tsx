import { useEffect, useState, type ReactNode, type RefObject } from 'react';

interface Props {
  /** The displayed media (video or first-frame image) the overlay aligns to. */
  mediaRef: RefObject<HTMLVideoElement | HTMLImageElement | null>;
  /** Native pixel dimensions the path coordinates are expressed in (analysis dims). */
  videoWidth: number;
  videoHeight: number;
  children: ReactNode;
  className?: string;
}

/**
 * SVG overlay that aligns path data (in the video's native pixel coordinates) to
 * the media as it's ACTUALLY displayed.
 *
 * The media uses `object-fit: contain`, so when its intrinsic aspect ratio
 * doesn't match the element box it's letterboxed/pillarboxed — the visible frame
 * is a centered sub-rectangle of the element, not the whole element. Drawing the
 * path across the full element box would offset it from the real bar position.
 *
 * We measure the element's rendered size and its intrinsic media size, recompute
 * the contained frame rect, and bake the letterbox padding into the viewBox. The
 * SVG still covers the full element (so no per-pixel positioning/border math),
 * but native coordinates now map exactly onto the displayed video frame. The
 * same component backs both the static "Path" and animated "Replay" views.
 */
export default function VideoPathOverlay({
  mediaRef,
  videoWidth,
  videoHeight,
  children,
  className,
}: Props) {
  const [viewBox, setViewBox] = useState(`0 0 ${videoWidth} ${videoHeight}`);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    const measure = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!cw || !ch) return;

      // The media's true intrinsic size (post-rotation, as the browser displays
      // it). Falls back to the native dims until metadata loads.
      const iw = (el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth) || videoWidth;
      const ih = (el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight) || videoHeight;

      // object-contain: uniform scale to fit, centered → letterbox padding.
      const fit = Math.min(cw / iw, ch / ih);
      const dispW = iw * fit;
      const dispH = ih * fit;
      const padX = (cw - dispW) / 2;
      const padY = (ch - dispH) / 2;

      // Native units → displayed-frame pixels.
      const sx = dispW / videoWidth;
      const sy = dispH / videoHeight;
      if (!(sx > 0) || !(sy > 0)) return;

      // viewBox describes the FULL element box in native units, with the letterbox
      // baked in, so (0,0)→top-left of the visible frame and (W,H)→bottom-right.
      setViewBox(`${-padX / sx} ${-padY / sy} ${cw / sx} ${ch / sy}`);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener('loadedmetadata', measure);
    el.addEventListener('loadeddata', measure);
    el.addEventListener('load', measure); // <img>
    window.addEventListener('resize', measure);
    document.addEventListener('fullscreenchange', measure);

    return () => {
      ro.disconnect();
      el.removeEventListener('loadedmetadata', measure);
      el.removeEventListener('loadeddata', measure);
      el.removeEventListener('load', measure);
      window.removeEventListener('resize', measure);
      document.removeEventListener('fullscreenchange', measure);
    };
  }, [mediaRef, videoWidth, videoHeight]);

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ''}`}
    >
      {children}
    </svg>
  );
}
