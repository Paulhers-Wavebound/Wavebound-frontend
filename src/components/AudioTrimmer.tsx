import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Scissors, RotateCcw, ZoomIn } from 'lucide-react';
import { getWaveformPeaks, extractAudioSegment, formatTime } from '@/utils/audioTrimUtils';

interface AudioTrimmerProps {
  file: File;
  open: boolean;
  onConfirm: (trimmedFile: File) => void;
  onCancel: () => void;
}

const MAX_DURATION = 60;
const NUM_BARS = 200;
const CANVAS_HEIGHT = 120;
const MINIMAP_HEIGHT = 24;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function AudioTrimmer({ file, open, onConfirm, onCancel }: AudioTrimmerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(MAX_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDecoding, setIsDecoding] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewCenter, setViewCenter] = useState(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const draggingRef = useRef<'start' | 'end' | null>(null);
  const minimapDragging = useRef(false);

  // Derived zoom values
  const getView = useCallback(() => {
    if (!audioBuffer) return { viewStart: 0, viewEnd: 0, viewDuration: 0 };
    const duration = audioBuffer.duration;
    const viewDuration = duration / zoomLevel;
    const viewStart = clamp(viewCenter - viewDuration / 2, 0, duration - viewDuration);
    const viewEnd = viewStart + viewDuration;
    return { viewStart, viewEnd, viewDuration };
  }, [audioBuffer, zoomLevel, viewCenter]);

  // Decode audio on mount
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsDecoding(true);

    (async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const ctx = new AudioContext();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        await ctx.close();

        if (cancelled) return;

        if (buffer.duration <= MAX_DURATION) {
          onConfirm(file);
          return;
        }

        setAudioBuffer(buffer);
        setPeaks(getWaveformPeaks(buffer, NUM_BARS));
        setStartTime(0);
        setEndTime(Math.min(MAX_DURATION, buffer.duration));
        setZoomLevel(1);
        setViewCenter(Math.min(MAX_DURATION, buffer.duration) / 2);
        setIsDecoding(false);
      } catch (err) {
        console.error('Failed to decode audio:', err);
        onConfirm(file);
      }
    })();

    return () => { cancelled = true; };
  }, [file, open]);

  // Auto-center on zoom change
  useEffect(() => {
    if (!audioBuffer) return;
    setViewCenter((startTime + endTime) / 2);
  }, [zoomLevel]);

  // Draw main waveform
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = CANVAS_HEIGHT;
    const duration = audioBuffer.duration;
    const { viewStart, viewDuration } = getView();
    const barWidth = w / NUM_BARS;

    // Background
    ctx.fillStyle = 'hsl(0 0% 8%)';
    ctx.fillRect(0, 0, w, h);

    const selStartX = ((startTime - viewStart) / viewDuration) * w;
    const selEndX = ((endTime - viewStart) / viewDuration) * w;

    // Bars
    const maxPeak = Math.max(...peaks, 0.01);
    for (let i = 0; i < peaks.length; i++) {
      const barTime = (i / NUM_BARS) * duration;
      const x = ((barTime - viewStart) / viewDuration) * w;
      if (x + barWidth < 0 || x > w) continue;
      const barH = (peaks[i] / maxPeak) * (h * 0.8);
      const inSelection = x >= selStartX && x <= selEndX;
      ctx.fillStyle = inSelection ? 'hsl(var(--primary) / 0.85)' : 'hsl(0 0% 100% / 0.12)';
      ctx.fillRect(x + 1, h / 2 - barH / 2, Math.max(barWidth * (duration / viewDuration / NUM_BARS) * (w / (w / NUM_BARS)) > 0 ? barWidth : 1, 1), barH);
    }

    // Selection overlay
    ctx.fillStyle = 'hsl(var(--primary) / 0.06)';
    const oLeft = clamp(selStartX, 0, w);
    const oRight = clamp(selEndX, 0, w);
    ctx.fillRect(oLeft, 0, oRight - oLeft, h);

    // Handle lines
    [selStartX, selEndX].forEach((x) => {
      if (x < -10 || x > w + 10) return;
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fillRect(x - 1.5, 0, 3, h);
      ctx.beginPath();
      ctx.arc(x, h / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [peaks, startTime, endTime, audioBuffer, getView]);

  // Draw minimap
  const drawMinimap = useCallback(() => {
    const canvas = minimapRef.current;
    if (!canvas || !audioBuffer || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = MINIMAP_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = MINIMAP_HEIGHT;
    const duration = audioBuffer.duration;
    const barWidth = w / NUM_BARS;

    ctx.fillStyle = 'hsl(0 0% 6%)';
    ctx.fillRect(0, 0, w, h);

    const maxPeak = Math.max(...peaks, 0.01);
    const selStartX = (startTime / duration) * w;
    const selEndX = (endTime / duration) * w;

    for (let i = 0; i < peaks.length; i++) {
      const x = i * barWidth;
      const barH = (peaks[i] / maxPeak) * (h * 0.7);
      const inSel = x >= selStartX && x <= selEndX;
      ctx.fillStyle = inSel ? 'hsl(var(--primary) / 0.6)' : 'hsl(0 0% 100% / 0.1)';
      ctx.fillRect(x + 0.5, h / 2 - barH / 2, Math.max(barWidth - 1, 1), barH);
    }

    // Viewport highlight
    const { viewStart, viewDuration } = getView();
    const vpLeft = (viewStart / duration) * w;
    const vpWidth = (viewDuration / duration) * w;
    ctx.strokeStyle = 'hsl(var(--primary) / 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vpLeft, 1, vpWidth, h - 2);
    ctx.fillStyle = 'hsl(var(--primary) / 0.08)';
    ctx.fillRect(vpLeft, 1, vpWidth, h - 2);
  }, [peaks, startTime, endTime, audioBuffer, getView]);

  useEffect(() => { draw(); drawMinimap(); }, [draw, drawMinimap]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => { draw(); drawMinimap(); });
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw, drawMinimap]);

  // Mouse/touch interaction for main canvas
  const getTimeFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const { viewStart, viewDuration } = getView();
    return viewStart + fraction * viewDuration;
  }, [audioBuffer, getView]);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const time = getTimeFromEvent(e);
    if (time === null || !audioBuffer) return;

    const { viewStart, viewDuration } = getView();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;

    const startX = ((startTime - viewStart) / viewDuration) * w;
    const endX = ((endTime - viewStart) / viewDuration) * w;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const px = clientX - rect.left;

    const distStart = Math.abs(px - startX);
    const distEnd = Math.abs(px - endX);

    draggingRef.current = distStart < distEnd ? 'start' : 'end';
  }, [audioBuffer, startTime, endTime, getTimeFromEvent, getView]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingRef.current || !audioBuffer) return;
    const time = getTimeFromEvent(e);
    if (time === null) return;

    const duration = audioBuffer.duration;

    if (draggingRef.current === 'start') {
      const newStart = Math.max(0, Math.min(time, duration - 1));
      const newEnd = Math.min(duration, Math.max(newStart + 1, Math.min(endTime, newStart + MAX_DURATION)));
      setStartTime(newStart);
      setEndTime(newEnd);
    } else {
      const newEnd = Math.min(duration, Math.max(time, 1));
      const newStart = Math.max(0, Math.min(startTime, Math.max(newEnd - MAX_DURATION, 0)));
      setEndTime(newEnd);
      setStartTime(newStart);
    }

    // Auto-pan when dragging near edges
    const { viewStart, viewDuration } = getView();
    const edgeThreshold = viewDuration * 0.1;
    if (draggingRef.current === 'end' && time > viewStart + viewDuration - edgeThreshold) {
      setViewCenter(vc => clamp(vc + edgeThreshold * 0.5, 0, duration));
    } else if (draggingRef.current === 'start' && time < viewStart + edgeThreshold) {
      setViewCenter(vc => clamp(vc - edgeThreshold * 0.5, 0, duration));
    }
  }, [audioBuffer, startTime, endTime, getTimeFromEvent, getView]);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // Minimap interaction
  const handleMinimapPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!audioBuffer || !minimapRef.current) return;
    minimapDragging.current = true;
    const rect = minimapRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const fraction = clamp((clientX - rect.left) / rect.width, 0, 1);
    setViewCenter(fraction * audioBuffer.duration);
  }, [audioBuffer]);

  const handleMinimapPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!minimapDragging.current || !audioBuffer || !minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const fraction = clamp((clientX - rect.left) / rect.width, 0, 1);
    setViewCenter(fraction * audioBuffer.duration);
  }, [audioBuffer]);

  const handleMinimapPointerUp = useCallback(() => {
    minimapDragging.current = false;
  }, []);

  // Playback
  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (!audioBuffer) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0, startTime, endTime - startTime);
    sourceRef.current = source;
    setIsPlaying(true);
  }, [isPlaying, audioBuffer, startTime, endTime, stopPlayback]);

  useEffect(() => {
    if (!open) stopPlayback();
  }, [open, stopPlayback]);

  const handleConfirm = useCallback(() => {
    if (!audioBuffer) return;
    stopPlayback();
    const trimmedFile = extractAudioSegment(audioBuffer, startTime, endTime, file.name);
    onConfirm(trimmedFile);
  }, [audioBuffer, startTime, endTime, file.name, onConfirm, stopPlayback]);

  const handleCancel = useCallback(() => {
    stopPlayback();
    onCancel();
  }, [onCancel, stopPlayback]);

  if (isDecoding && open) {
    return (
      <Dialog open={open} onOpenChange={() => handleCancel()}>
        <DialogContent className="sm:max-w-xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              Loading audio...
            </DialogTitle>
            <DialogDescription>Decoding your track for trimming</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open && !!audioBuffer} onOpenChange={() => handleCancel()}>
      <DialogContent className="sm:max-w-xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Trim Your Track
          </DialogTitle>
          <DialogDescription>
            Select up to 60 seconds for analysis. Drag the handles to adjust.
          </DialogDescription>
        </DialogHeader>

        {/* Minimap */}
        {zoomLevel > 1 && (
          <div
            className="rounded-md overflow-hidden cursor-pointer select-none touch-none"
            onMouseDown={handleMinimapPointerDown}
            onMouseMove={handleMinimapPointerMove}
            onMouseUp={handleMinimapPointerUp}
            onMouseLeave={handleMinimapPointerUp}
            onTouchStart={handleMinimapPointerDown}
            onTouchMove={handleMinimapPointerMove}
            onTouchEnd={handleMinimapPointerUp}
          >
            <canvas
              ref={minimapRef}
              className="w-full"
              style={{ height: MINIMAP_HEIGHT }}
            />
          </div>
        )}

        {/* Waveform canvas */}
        <div
          ref={containerRef}
          className="rounded-lg overflow-hidden cursor-col-resize select-none touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: CANVAS_HEIGHT }}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider
            value={[zoomLevel]}
            onValueChange={([v]) => setZoomLevel(v)}
            min={1}
            max={10}
            step={0.5}
            className="flex-1"
          />
          <span className="text-xs font-mono text-muted-foreground w-8 text-right">{zoomLevel}x</span>
          {zoomLevel > 1 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setZoomLevel(1)}>
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Timestamp and playback */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-mono text-muted-foreground">
            {formatTime(startTime)} — {formatTime(endTime)}
            <span className="ml-2 text-xs text-muted-foreground/60">
              ({Math.round(endTime - startTime)}s)
            </span>
          </p>
          <Button variant="ghost" size="sm" onClick={togglePlay}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="ml-1.5">{isPlaying ? 'Stop' : 'Preview'}</span>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm Selection</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
