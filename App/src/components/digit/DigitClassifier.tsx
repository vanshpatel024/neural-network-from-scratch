import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import {
  Trash2,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RotateCcw,
  AlertCircle,
  Layers,
  Cpu,
} from 'lucide-react';
import { useDigitModelStore } from '@/store/digitModelStore';
import { useDigitModel } from '@/hooks/useDigitModel';
import { ModelStatusBadge } from '@/components/layout/ModelStatusBadge';
import { extract20x20Features } from '@/lib/digit/preprocessing';
import { predict } from '@/lib/digit/predict';
import digitSamplesRaw from '@/data/digitSamples.json';
import { Tooltip } from '@/components/ui/Tooltip';

interface SampleItem {
  label: number;
  pixels: number[];
}

const SAMPLES = digitSamplesRaw as Record<string, SampleItem>;

export function DigitClassifier(): JSX.Element {
  useDigitModel();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isDrawingRef = useRef<boolean>(false);
  const lastXRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  const model = useDigitModelStore((s) => s.model);
  const status = useDigitModelStore((s) => s.status);
  const sourceName = useDigitModelStore((s) => s.sourceName);
  const errorMessage = useDigitModelStore((s) => s.errorMessage);
  const brushSize = useDigitModelStore((s) => s.brushSize);
  const autoCenter = useDigitModelStore((s) => s.autoCenter);
  const canvasSnapshot = useDigitModelStore((s) => s.canvasSnapshot);
  const activePresetKey = useDigitModelStore((s) => s.activePresetKey);
  const predictionResult = useDigitModelStore((s) => s.predictionResult);

  const setBrushSize = useDigitModelStore((s) => s.setBrushSize);
  const setAutoCenter = useDigitModelStore((s) => s.setAutoCenter);
  const setCanvasSnapshot = useDigitModelStore((s) => s.setCanvasSnapshot);
  const setActivePresetKey = useDigitModelStore((s) => s.setActivePresetKey);
  const setPredictionResult = useDigitModelStore((s) => s.setPredictionResult);
  const loadCustomWeights = useDigitModelStore((s) => s.loadCustomWeights);
  const restoreDefaultModel = useDigitModelStore((s) => s.restoreDefaultModel);
  const clearError = useDigitModelStore((s) => s.clearError);

  // Initialize offscreen canvas once
  useEffect(() => {
    if (!offscreenCanvasRef.current) {
      const off = document.createElement('canvas');
      off.width = 20;
      off.height = 20;
      offscreenCanvasRef.current = off;
    }
  }, []);

  const renderPreviewFromOffscreen = useCallback(() => {
    const preview = previewCanvasRef.current;
    const off = offscreenCanvasRef.current;
    if (!preview || !off) return;
    const pCtx = preview.getContext('2d');
    if (!pCtx) return;
    pCtx.imageSmoothingEnabled = false;
    pCtx.clearRect(0, 0, 20, 20);
    pCtx.drawImage(off, 0, 0);
  }, []);

  const runPredictionOnCurrentCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!offscreenCanvasRef.current) {
      const off = document.createElement('canvas');
      off.width = 20;
      off.height = 20;
      offscreenCanvasRef.current = off;
    }

    const { features, hasInk } = extract20x20Features(
      canvas,
      autoCenter,
      offscreenCanvasRef.current
    );
    renderPreviewFromOffscreen();

    if (!hasInk) {
      setPredictionResult(null);
      return;
    }

    if (model) {
      const result = predict(model.layers, features, true);
      setPredictionResult(result);
    }
  }, [autoCenter, model, renderPreviewFromOffscreen, setPredictionResult]);

  const schedulePrediction = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      runPredictionOnCurrentCanvas();
    });
  }, [runPredictionOnCurrentCanvas]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const off = offscreenCanvasRef.current;
    if (off) {
      const offCtx = off.getContext('2d');
      if (offCtx) {
        offCtx.fillStyle = '#000000';
        offCtx.fillRect(0, 0, 20, 20);
      }
    }
    renderPreviewFromOffscreen();

    setActivePresetKey(null);
    setPredictionResult(null);
    setCanvasSnapshot(null);
    setLiveAnnouncement('Canvas cleared.');
  }, [renderPreviewFromOffscreen, setActivePresetKey, setCanvasSnapshot, setPredictionResult]);

  // Restore snapshot on mount, save snapshot on unmount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvasSnapshot) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        if (!useDigitModelStore.getState().activePresetKey) {
          runPredictionOnCurrentCanvas();
        }
      };
      img.src = canvasSnapshot;
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (canvas) {
        try {
          const snapshot = canvas.toDataURL();
          setCanvasSnapshot(snapshot);
        } catch {
          // Canvas snapshot capture may fail if tainted
        }
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run inference if model or autoCenter changes
  useEffect(() => {
    if (activePresetKey && SAMPLES[activePresetKey] && model) {
      const sample = SAMPLES[activePresetKey]!;
      const features = new Float32Array(sample.pixels);
      const res = predict(model.layers, features, true);
      setPredictionResult(res);
    } else {
      runPredictionOnCurrentCanvas();
    }
  }, [model, autoCenter, activePresetKey, runPredictionOnCurrentCanvas, setPredictionResult]);

  // Global "C" shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        e.preventDefault();
        clearCanvas();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearCanvas]);

  const getCanvasCoords = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture might not be supported in some environments
    }

    isDrawingRef.current = true;
    setActivePresetKey(null);

    const { x, y } = getCanvasCoords(e);
    lastXRef.current = x;
    lastYRef.current = y;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    schedulePrediction();
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastXRef.current = x;
    lastYRef.current = y;

    schedulePrediction();
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Pointer capture release fallback
    }

    runPredictionOnCurrentCanvas();

    // Announce to polite aria-live region on stroke end only
    const res = useDigitModelStore.getState().predictionResult;
    if (res && res.hasInk) {
      setLiveAnnouncement(
        `Predicted digit ${res.predictedClass} with ${res.confidence.toFixed(1)} percent confidence.`
      );
    }
  };

  const handleSampleClick = (key: string) => {
    const sample = SAMPLES[key];
    const canvas = canvasRef.current;
    if (!sample || !canvas) return;

    const off = offscreenCanvasRef.current ?? document.createElement('canvas');
    off.width = 20;
    off.height = 20;
    offscreenCanvasRef.current = off;
    const offCtx = off.getContext('2d');
    if (!offCtx) return;

    const imgData = offCtx.createImageData(20, 20);
    for (let i = 0; i < 400; i++) {
      const val = Math.min(255, Math.max(0, Math.round((sample.pixels[i] ?? 0) * 255)));
      imgData.data[i * 4] = val;
      imgData.data[i * 4 + 1] = val;
      imgData.data[i * 4 + 2] = val;
      imgData.data[i * 4 + 3] = 255;
    }
    offCtx.putImageData(imgData, 0, 0);
    renderPreviewFromOffscreen();

    // Scale up onto drawing canvas without smoothing
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    }

    setActivePresetKey(key);

    if (model) {
      const features = new Float32Array(sample.pixels);
      const res = predict(model.layers, features, true);
      setPredictionResult(res);
      setLiveAnnouncement(
        `Sample loaded. True label: ${sample.label}. Predicted: ${res.predictedClass}.`
      );
    }
  };

  // Custom weights JSON handling
  const handleFile = (file: File) => {
    clearError();
    if (!file.name.endsWith('.json')) {
      useDigitModelStore.setState({
        errorMessage: 'Please upload a .json file containing network weights.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        loadCustomWeights(data, file.name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON file.';
        useDigitModelStore.setState({
          errorMessage: `Could not parse JSON: ${msg}`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) handleFile(file);
    }
  };

  // Prediction calculations
  const hasInk = predictionResult !== null && predictionResult.hasInk;
  const p0 = hasInk ? predictionResult.prob0 : 0;
  const p1 = hasInk ? predictionResult.prob1 : 0;
  const p0Pct = (p0 * 100).toFixed(1);
  const p1Pct = (p1 * 100).toFixed(1);

  const predictedClass = hasInk ? predictionResult.predictedClass : null;
  const confidence = hasInk ? predictionResult.confidence : 0;
  const rawOutput = hasInk ? predictionResult.rawOutput.toFixed(4) : null;
  const latency = hasInk ? `${predictionResult.latencyMs} ms` : null;

  let dynamicMessage = 'Draw a 0 or a 1 to start.';
  if (hasInk) {
    if (confidence >= 65) {
      dynamicMessage = `The network is ${Math.round(confidence)}% sure this is a ${predictedClass}.`;
    } else {
      dynamicMessage = 'The network is unsure. Try a clearer shape.';
    }
  }

  const activeSample = activePresetKey ? SAMPLES[activePresetKey] : null;
  const isSampleMatch =
    activeSample && predictionResult
      ? activeSample.label === predictionResult.predictedClass
      : null;

  // Render prediction hero block (shared between desktop card and mobile compact placement)
  const renderPredictionHero = (isCompactMobile = false) => (
    <div className={`flex flex-col ${isCompactMobile ? 'p-3 bg-base/50 rounded-lg border border-border-subtle my-3 lg:hidden' : ''}`}>
      <div className="flex flex-col items-center justify-center py-5 px-4 rounded-xl border border-border-subtle bg-base mb-5 text-center">
        <span className="text-label text-text-muted uppercase tracking-wider mb-1 font-semibold">
          Predicted Digit
        </span>

        <div
          className={`text-[72px] sm:text-[88px] font-extrabold leading-none tracking-tight my-1 select-none transition-transform ${
            hasInk ? 'text-accent scale-100' : 'text-text-muted scale-95'
          }`}
          aria-label={hasInk ? `Predicted digit: ${predictedClass}` : 'No digit drawn yet'}
        >
          {hasInk ? predictedClass : '—'}
        </div>

        <div className="mt-1 text-h3 font-semibold text-text-primary">
          {hasInk ? `${confidence.toFixed(1)}%` : '0.0%'}
        </div>

        <span className="text-caption text-text-muted font-mono mt-0.5">
          {rawOutput !== null ? `Raw output: ${rawOutput}` : 'Draw a shape to run inference'}
        </span>
      </div>

      {/* Two probability rows */}
      <div className="space-y-2.5 mb-5">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-caption font-medium">
            <span className={hasInk && predictedClass === 0 ? 'text-accent font-semibold' : 'text-text-secondary'}>
              Digit 0
            </span>
            <span className={hasInk && predictedClass === 0 ? 'text-accent font-mono font-semibold' : 'text-text-muted font-mono'}>
              {hasInk ? `${p0Pct}%` : '—'}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-border-subtle overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                hasInk && predictedClass === 0 ? 'bg-accent' : 'bg-text-muted/40'
              }`}
              style={{ width: `${hasInk ? p0Pct : '0'}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-caption font-medium">
            <span className={hasInk && predictedClass === 1 ? 'text-accent font-semibold' : 'text-text-secondary'}>
              Digit 1
            </span>
            <span className={hasInk && predictedClass === 1 ? 'text-accent font-mono font-semibold' : 'text-text-muted font-mono'}>
              {hasInk ? `${p1Pct}%` : '—'}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-border-subtle overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                hasInk && predictedClass === 1 ? 'bg-accent' : 'bg-text-muted/40'
              }`}
              style={{ width: `${hasInk ? p1Pct : '0'}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dynamic State Message */}
      <div className="rounded-lg border border-border-subtle bg-base/60 p-3 space-y-1 mb-4">
        <p className="text-body font-medium text-text-primary leading-snug">
          {dynamicMessage}
        </p>
        <p className="text-caption text-text-muted leading-relaxed">
          This model only knows 0 and 1. Any other digit will be pushed into one of them.
        </p>
      </div>
    </div>
  );

  return (
    <div className="@container w-full space-y-6">
      {/* Accessible polite announcement */}
      <div
        id="digit-classifier-live-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* Dual Cards Grid: Equal height on 960px+, responsive on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CARD 1: DRAW */}
        <div className="flex flex-col rounded-xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-sm">
          {/* Header & Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-h3 text-text-primary font-bold tracking-tight">Draw</h2>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-caption text-text-secondary select-none">
                <input
                  id="chk-auto-center"
                  type="checkbox"
                  checked={autoCenter}
                  onChange={(e) => setAutoCenter(e.target.checked)}
                  className="h-4 w-4 rounded border-border-subtle bg-base text-accent focus:ring-1 focus:ring-accent cursor-pointer"
                />
                <label htmlFor="chk-auto-center" className="cursor-pointer">
                  Smart centering
                </label>
                <Tooltip
                  content="Centers and fits your drawing into the 20 by 20 input box, matching the training data."
                  placement="top"
                >
                  <button
                    type="button"
                    aria-label="Smart centering explanation"
                    className="text-text-muted hover:text-text-primary p-0.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>

              <Tooltip content="Clear canvas (Shortcut: C)" placement="top">
                <button
                  type="button"
                  onClick={clearCanvas}
                  aria-label="Clear drawing canvas"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border-subtle bg-base px-3 py-1.5 text-caption font-medium text-text-secondary hover:text-text-primary hover:border-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <Trash2 className="w-4 h-4 text-text-muted" />
                  <span>Clear</span>
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="flex flex-col items-center justify-center w-full mb-4">
            <div className="relative w-full max-w-[420px] aspect-square rounded-lg border border-border-subtle overflow-hidden bg-black shadow-inner flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                aria-label="Interactive drawing pad. Click or drag to draw digit 0 or 1."
                role="img"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full max-h-[45dvh] lg:max-h-none touch-none cursor-crosshair select-none block"
                style={{ touchAction: 'none' }}
              />
            </div>

            {/* Brush Width Slider */}
            <div className="w-full max-w-[420px] mt-2.5 flex items-center justify-between gap-3 text-caption text-text-secondary">
              <label htmlFor="brush-size-slider" className="font-medium whitespace-nowrap">
                Brush: {brushSize}px
              </label>
              <input
                id="brush-size-slider"
                type="range"
                min={12}
                max={34}
                step={1}
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                aria-label="Brush stroke width"
                className="w-full accent-accent cursor-pointer"
              />
            </div>
          </div>

          {/* On mobile screens (<lg): Compact prediction directly under canvas so user sees prediction without scrolling! */}
          <div className="lg:hidden">
            {renderPredictionHero(true)}
          </div>
        </div>

        {/* CARD 2: PREDICTION */}
        <div className="flex flex-col rounded-xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4 w-full">
            <h2 className="text-h3 text-text-primary font-bold tracking-tight text-left">Prediction</h2>
            <div className="flex items-center gap-2.5 shrink-0 ml-auto justify-end">
              {latency && (
                <span className="text-caption text-text-muted font-mono">{latency}</span>
              )}
              <ModelStatusBadge />
            </div>
          </div>

          {/* Desktop Hero Prediction (hidden on mobile to avoid duplication) */}
          <div className="hidden lg:block">
            {renderPredictionHero(false)}
          </div>
        </div>
      </div>

      {/* ROW 2: WHAT THE NETWORK SEES & TRY REAL EXAMPLES */}
      <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: 20x20 Resampled Preview */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="shrink-0 flex flex-col items-center">
              <canvas
                ref={previewCanvasRef}
                width={20}
                height={20}
                aria-label="20 by 20 pixel representation fed into the neural network"
                className="w-[140px] h-[140px] rounded border border-border-subtle bg-black block"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-label text-accent font-semibold block">
                What the network sees
              </span>
              <p className="text-caption text-text-secondary">
                400 numbers from 0 (black) to 1 (white).
              </p>
              <p className="text-caption text-text-muted leading-relaxed">
                Every drawn stroke is converted into this tiny 20 by 20 grayscale grid before running through the layers.
              </p>
            </div>
          </div>

          {/* Right Column: Real Samples 2x2 Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-primary font-medium">Try real examples</span>
              {activeSample && predictionResult && (
                <span
                  className={`inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full border ${
                    isSampleMatch
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-danger/30 bg-danger/10 text-danger'
                  }`}
                >
                  {isSampleMatch ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span>
                    True label: {activeSample.label}. The model said: {predictionResult.predictedClass}.
                  </span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSampleClick('sample-0a')}
                aria-pressed={activePresetKey === 'sample-0a'}
                className={`min-h-[40px] px-3 py-2 rounded-lg border text-caption font-medium transition-colors cursor-pointer text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  activePresetKey === 'sample-0a'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-subtle bg-base text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                True 0 (Sample A)
              </button>
              <button
                type="button"
                onClick={() => handleSampleClick('sample-0b')}
                aria-pressed={activePresetKey === 'sample-0b'}
                className={`min-h-[40px] px-3 py-2 rounded-lg border text-caption font-medium transition-colors cursor-pointer text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  activePresetKey === 'sample-0b'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-subtle bg-base text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                True 0 (Sample B)
              </button>
              <button
                type="button"
                onClick={() => handleSampleClick('sample-1a')}
                aria-pressed={activePresetKey === 'sample-1a'}
                className={`min-h-[40px] px-3 py-2 rounded-lg border text-caption font-medium transition-colors cursor-pointer text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  activePresetKey === 'sample-1a'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-subtle bg-base text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                True 1 (Sample A)
              </button>
              <button
                type="button"
                onClick={() => handleSampleClick('sample-1b')}
                aria-pressed={activePresetKey === 'sample-1b'}
                className={`min-h-[40px] px-3 py-2 rounded-lg border text-caption font-medium transition-colors cursor-pointer text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  activePresetKey === 'sample-1b'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-subtle bg-base text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                True 1 (Sample B)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: INSIDE THE MODEL */}
      <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent" />
          <h2 className="text-body font-semibold text-text-primary">Inside the model</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Architecture details */}
          <div className="flex flex-col justify-between rounded-lg border border-border-subtle bg-base p-4 space-y-4 h-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-caption text-text-secondary">
                <span className="text-label text-text-primary font-medium">Layers & Activations</span>
                <span className="font-mono text-accent">{model?.architectureSummary ?? '400 → 25 → 15 → 1'}</span>
              </div>

              <div className="space-y-1.5">
                {model ? (
                  model.layers.map((layer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border border-border-subtle bg-surface px-3 py-2 text-caption"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-text-muted" />
                        <span className="font-medium text-text-primary">
                          {idx === (model.layers.length - 1) ? 'Output' : `Dense ${idx + 1}`}
                        </span>
                        <span className="text-text-muted font-mono text-[11px]">
                          [{layer.nIn} &times; {layer.nOut}]
                        </span>
                      </div>
                      <span className="rounded bg-base px-1.5 py-0.5 text-[10px] font-semibold text-accent uppercase">
                        {layer.activation}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="space-y-1.5 animate-pulse" aria-busy="true">
                    <div className="h-9 rounded-md bg-surface border border-border-subtle" />
                    <div className="h-9 rounded-md bg-surface border border-border-subtle" />
                    <div className="h-9 rounded-md bg-surface border border-border-subtle" />
                  </div>
                )}
              </div>
            </div>

            <p className="text-caption text-text-muted leading-relaxed">
              Trained on 20 by 20 handwritten digits using forward and backpropagation.
            </p>
          </div>

          {/* Custom weights upload panel */}
          <div className="flex flex-col justify-between rounded-lg border border-border-subtle bg-base p-4 space-y-3 h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-label text-text-primary font-medium">Use your own weights</span>
                {status === 'custom' && (
                  <button
                    type="button"
                    onClick={restoreDefaultModel}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Back to default model</span>
                  </button>
                )}
              </div>

              <p className="text-caption text-text-muted leading-relaxed mt-1">
                Upload a JSON export with NumPy weights matching this architecture.
              </p>
            </div>

            {/* Inline Error Message */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 p-2.5 text-caption text-danger"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors min-h-[110px] ${
                isDragOver
                  ? 'border-accent bg-accent/10'
                  : 'border-border-subtle hover:border-border-strong bg-surface/50'
              }`}
            >
              <input
                id="custom-weights-input"
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleInputChange}
                className="hidden"
                aria-label="Upload custom model weights JSON file"
              />
              <Upload className="w-5 h-5 text-text-muted mb-1.5" />
              <span className="text-caption font-medium text-text-secondary">
                Click to browse or drop .json file here
              </span>
              <span className="text-[11px] text-text-muted mt-0.5">
                Current model: {sourceName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DigitClassifier;
