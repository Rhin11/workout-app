import { useEffect, useRef, useState } from 'react';
import AnalysisHistory from '../components/barbell/AnalysisHistory';
import CameraView, { type CapturedVideo } from '../components/barbell/CameraView';
import PathOverlay from '../components/barbell/PathOverlay';
import SeedPicker from '../components/barbell/SeedPicker';
import StatsRow from '../components/barbell/StatsRow';
import StickingPointsCard from '../components/barbell/StickingPointsCard';
import { useBarbellStore, type BarbellSession } from '../store/barbellStore';
import { getAnalysis, type Analysis, type SeedPoint } from '../utils/barbellAnalysis';

export default function BarbellPage() {
  const addSession = useBarbellStore((s) => s.addSession);

  const [captured, setCaptured] = useState<CapturedVideo | null>(null);
  const [seed, setSeed] = useState<SeedPoint | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Revoke object URLs we create for live captures (not history thumbnails).
  const lastObjectUrl = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
    };
  }, []);

  const handleCapture = (video: CapturedVideo) => {
    if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
    lastObjectUrl.current = video.videoUrl;
    setCaptured(video);
    setSeed(null);
    setAnalysis(null);
    setAnalyzeError(null);
    setActiveSessionId(null);
    setBackground(video.firstFrameDataUrl || null);
  };

  const handleReset = () => {
    if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
    lastObjectUrl.current = null;
    setCaptured(null);
    setSeed(null);
    setAnalysis(null);
    setAnalyzeError(null);
    setBackground(null);
    setActiveSessionId(null);
  };

  const handleAnalyze = async () => {
    if (!captured) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      // getAnalysis() is the single data source — it POSTs to the CV service.
      const result = await getAnalysis(captured.blob, seed);
      const session = addSession({
        thumbnail: captured.firstFrameDataUrl ?? '',
        analysis: result,
      });
      setAnalysis(result);
      setActiveSessionId(session.id);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectSession = (session: BarbellSession) => {
    setAnalysis(session.analysis);
    setBackground(session.thumbnail || null);
    setActiveSessionId(session.id);
    // Keep any in-progress capture; just show the chosen historical result.
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const card = 'rounded-xl border border-[#2A2A2A] bg-[#141414] p-5';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      {/* 1. Instruction card */}
      <section className={card}>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-100">
          Barbell Path Analyzer
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          Set your phone to the side so the full barbell is visible. Record your lift, then analyze
          it to see your bar path and sticking points.
        </p>
        <p className="mt-3 flex items-start gap-2 text-sm text-gray-500">
          <span className="text-[#6C63FF]">💡</span>
          <span>Best results with good lighting and a contrasting background behind the bar.</span>
        </p>
      </section>

      {/* 2. Video input */}
      <section className={card}>
        <CameraView
          onCapture={handleCapture}
          onReset={handleReset}
          hasVideo={Boolean(captured)}
          videoUrl={captured?.videoUrl ?? null}
        />

        {/* Seed-point step: tap the bar to improve tracking (optional). */}
        {captured && !analysis && captured.firstFrameDataUrl && (
          <div className="mt-5">
            <SeedPicker
              firstFrameDataUrl={captured.firstFrameDataUrl}
              seed={seed}
              onSeed={setSeed}
            />
          </div>
        )}

        {/* 3. Analyze button */}
        {captured && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full max-w-sm rounded-lg bg-[#6C63FF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5a52e0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analyzing your lift...
                </span>
              ) : (
                'Analyze Lift'
              )}
            </button>
            {analyzeError && (
              <p className="max-w-sm text-center text-sm text-red-400">{analyzeError}</p>
            )}
          </div>
        )}
      </section>

      {/* 4. Results */}
      {analysis && (
        <>
          <section className={card}>
            <h2 className="mb-4 text-sm font-semibold text-gray-100">Bar path</h2>
            <PathOverlay
              path={analysis.path}
              stickingPoints={analysis.sticking_points}
              backgroundUrl={background}
              videoWidth={analysis.video_width}
              videoHeight={analysis.video_height}
            />
          </section>

          <StatsRow analysis={analysis} />

          <StickingPointsCard stickingPoints={analysis.sticking_points} />
        </>
      )}

      {/* 5. History */}
      <AnalysisHistory onSelect={handleSelectSession} activeId={activeSessionId} />
    </div>
  );
}
