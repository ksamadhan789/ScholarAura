"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const VIEWPORT_SIZE = 280;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type DragStart = { pointerX: number; pointerY: number; offsetX: number; offsetY: number };

/** A crop/adjust modal shown before a selected image is uploaded — drag to reposition, zoom to crop tighter, and adjust brightness/contrast/saturation or apply grayscale. Exports a fixed-size square JPEG. */
export function ImageCropModal({
  file,
  onCancel,
  onCropped,
}: {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<DragStart | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [exporting, setExporting] = useState(false);

  // Create and revoke within the same effect run — creating in useState and
  // revoking in a separately-keyed effect breaks under React Strict Mode's
  // dev-only mount/cleanup/remount cycle, which would revoke the URL the
  // <img> still points to right after creating it.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  // "Contain", not "cover" — at zoom 1 the whole photo is visible (any
  // non-square photo gets letterboxed, not auto-cropped), so a photo framed
  // wider than a tight headshot doesn't default to showing only the face.
  // Zooming in from there is how someone chooses a tighter crop themselves.
  const baseScale = useMemo(() => {
    if (!naturalSize) return 1;
    return Math.min(VIEWPORT_SIZE / naturalSize.w, VIEWPORT_SIZE / naturalSize.h);
  }, [naturalSize]);

  const scale = baseScale * zoom;
  const dispW = naturalSize ? naturalSize.w * scale : 0;
  const dispH = naturalSize ? naturalSize.h * scale : 0;
  const baseX = (VIEWPORT_SIZE - dispW) / 2;
  const baseY = (VIEWPORT_SIZE - dispH) / 2;

  // An axis smaller than the viewport (letterboxed) has nothing to pan —
  // the min/max formula below only makes sense once that axis overflows.
  function clampAxis(disp: number, base: number, value: number) {
    if (disp <= VIEWPORT_SIZE) return 0;
    const min = VIEWPORT_SIZE - disp - base;
    const max = -base;
    return Math.min(max, Math.max(min, value));
  }

  function clampOffset(x: number, y: number) {
    return {
      x: clampAxis(dispW, baseX, x),
      y: clampAxis(dispH, baseY, y),
    };
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { pointerX: e.clientX, pointerY: e.clientY, offsetX: offset.x, offsetY: offset.y };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.pointerX;
    const dy = e.clientY - dragStart.current.pointerY;
    setOffset(clampOffset(dragStart.current.offsetX + dx, dragStart.current.offsetY + dy));
  }

  function handlePointerUp() {
    dragStart.current = null;
  }

  function handleZoomChange(next: number) {
    setZoom(next);
    setOffset((prev) => clampOffset(prev.x, prev.y));
  }

  function applyGrayscale() {
    setSaturate(0);
  }

  function resetAdjustments() {
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
  }

  const filterCss = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;

  async function handleConfirm() {
    const img = imgRef.current;
    if (!img || !naturalSize) return;
    setExporting(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const srcX = -(baseX + offset.x) / scale;
      const srcY = -(baseY + offset.y) / scale;
      const srcSize = VIEWPORT_SIZE / scale;

      // At low zoom a letterboxed axis means the source rect can extend past
      // the actual image — canvas leaves that area transparent, which a JPEG
      // export would otherwise turn black. Fill white first instead, since
      // the avatar shows up as a circle across both light and dark pages.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.filter = filterCss;
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      canvas.toBlob(
        (blob) => {
          setExporting(false);
          if (blob) onCropped(blob);
        },
        "image/jpeg",
        0.92
      );
    } catch {
      setExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Adjust your photo</h2>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-lg bg-white"
          style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={imageUrl}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
              }}
              className="absolute max-w-none cursor-move"
              style={{
                left: baseX + offset.x,
                top: baseY + offset.y,
                width: dispW || undefined,
                height: dispH || undefined,
                maxHeight: "none",
                filter: filterCss,
              }}
            />
          )}
          {/* Circular crop mask — darkens everything outside the circle, doesn't block drag events underneath. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65)" }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm">
          <label className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-slate-600 dark:text-slate-400">Zoom</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-slate-600 dark:text-slate-400">Brightness</span>
            <input
              type="range"
              min={50}
              max={150}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-slate-600 dark:text-slate-400">Contrast</span>
            <input
              type="range"
              min={50}
              max={150}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-slate-600 dark:text-slate-400">Saturation</span>
            <input
              type="range"
              min={0}
              max={150}
              value={saturate}
              onChange={(e) => setSaturate(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyGrayscale}
              className="rounded border border-gray-300 px-2.5 py-1 text-xs dark:border-slate-600"
            >
              ⚫️⚪️ Black & white
            </button>
            <button
              type="button"
              onClick={resetAdjustments}
              className="rounded border border-gray-300 px-2.5 py-1 text-xs dark:border-slate-600"
            >
              Reset adjustments
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!naturalSize || exporting}
            className="rounded bg-brand-600 px-4 py-1.5 text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {exporting ? "Saving…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
