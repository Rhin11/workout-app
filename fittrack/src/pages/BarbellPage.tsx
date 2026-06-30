import { useEffect, useRef, useState } from 'react';
import AnalysisHistory from '../components/barbell/AnalysisHistory';
import CameraView, { type CapturedVideo } from '../components/barbell/CameraView';
import BarPathResult from '../components/barbell/BarPathResult';
import SeedPicker from '../components/barbell/SeedPicker';
import StatsRow from '../components/barbell/StatsRow';
import StickingPointsCard from '../components/barbell/StickingPointsCard';
import TagAnalysisCard, { type AnalysisTag } from '../components/barbell/TagAnalysisCard';
import TagAnalysisModal from '../components/barbell/TagAnalysisModal';
import { useBarbellStore, type BarbellSession } from '../store/barbellStore';
import { getAnalysis, type Analysis, type SeedPoint } from '../utils/barbellAnalysis';
import { sessionDate } from '../utils/barbellTrends';

function formatMetaDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BarbellPage() {
  const addSession = useBarbellStore((s) => s.addSession);
  const updateSession = useBarbellStore((s) => s.updateSession);

  const [captured, setCaptured] = useState<CapturedVideo | null>(null);
  const [seed, setSeed] = useState<SeedPoint | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  // Object URL of the video backing the CURRENT analysis (enables the Replay
  // view). Only set for a just-analyzed lift — saved sessions store no video.
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  // The saved session currently being viewed. Null while a fresh analysis is
  // still untagged/unsaved (the tag form is shown instead).
  const [viewedSession, setViewedSession] = useState<BarbellSession | null>(null);
  // Whether the re-tag modal is open for the viewed session.
  const [editingViewed, setEditingViewed] = useState(false);

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
    setViewedSession(null);
    setEditingViewed(false);
    setBackground(video.firstFrameDataUrl || null);
    setResultVideoUrl(null);
  };

  const handleReset = () => {
    if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
    lastObjectUrl.current = null;
    setCaptured(null);
    setSeed(null);
    setAnalysis(null);
    setAnalyzeError(null);
    setBackground(null);
    setViewedSession(null);
    setResultVideoUrl(null);
  };

  const handleAnalyze = async () => {
    if (!captured) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      // getAnalysis() is the single data source — it POSTs to the CV service.
      // Results are shown unsaved; the user tags + saves them via TagAnalysisCard.
      const result = await getAnalysis(captured.blob, seed);
      setAnalysis(result);
      setViewedSession(null);
      // The captured video matches this analysis — enable the Replay view.
      setResultVideoUrl(captured.videoUrl ?? null);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveTag = (tag: AnalysisTag) => {
    if (!analysis) return;
    const session = addSession({
      thumbnail: captured?.firstFrameDataUrl ?? background ?? '',
      analysis,
      exerciseName: tag.exerciseName,
      date: tag.date,
      weight: tag.weight,
      weightUnit: tag.weightUnit,
    });
    setViewedSession(session);
  };

  const handleSelectSession = (session: BarbellSession) => {
    setAnalysis(session.analysis);
    setBackground(session.thumbnail || null);
    setViewedSession(session);
    setEditingViewed(false);
    // Saved sessions don't store the video, so only the static view is available.
    setResultVideoUrl(null);
    // Keep any in-progress capture; just show the chosen historical result.
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleEditViewedTag = (tag: AnalysisTag) => {
    if (!viewedSession) return;
    updateSession(viewedSession.id, tag);
    setViewedSession({ ...viewedSession, ...tag });
    setEditingViewed(false);
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
          {viewedSession && (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
              {viewedSession.exerciseName ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-gray-100">{viewedSession.exerciseName}</span>
                    <span className="text-gray-500">· {formatMetaDate(sessionDate(viewedSession))}</span>
                    {viewedSession.weight != null && (
                      <span className="text-gray-500">
                        · {viewedSession.weight} {viewedSession.weightUnit ?? 'lbs'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingViewed(true)}
                    className="shrink-0 text-xs font-medium text-gray-500 transition-colors hover:text-[#6C63FF]"
                  >
                    Edit tag
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingViewed(true)}
                  className="rounded-lg border border-[#6C63FF]/40 bg-[#6C63FF]/10 px-4 py-2 text-sm font-semibold text-[#6C63FF] transition-colors hover:bg-[#6C63FF]/20"
                >
                  Assign lift
                </button>
              )}
            </div>
          )}

          <section className={card}>
            <h2 className="mb-4 text-sm font-semibold text-gray-100">Bar path</h2>
            <BarPathResult
              path={analysis.path}
              stickingPoints={analysis.sticking_points}
              backgroundUrl={background}
              videoWidth={analysis.video_width}
              videoHeight={analysis.video_height}
              videoUrl={resultVideoUrl}
            />
          </section>

          <StatsRow analysis={analysis} />

          <StickingPointsCard
            stickingPoints={analysis.sticking_points}
            exerciseName={viewedSession?.exerciseName}
          />

          {/* Tag step: only for a fresh, not-yet-saved analysis. */}
          {!viewedSession && <TagAnalysisCard onSave={handleSaveTag} />}
        </>
      )}

      {/* 5. History */}
      <AnalysisHistory onSelect={handleSelectSession} activeId={viewedSession?.id ?? null} />

      {editingViewed && viewedSession && (
        <TagAnalysisModal
          initial={{
            exerciseName: viewedSession.exerciseName,
            date: viewedSession.date ?? viewedSession.createdAt,
            weight: viewedSession.weight,
            weightUnit: viewedSession.weightUnit,
          }}
          isEdit={Boolean(viewedSession.exerciseName)}
          onSave={handleEditViewedTag}
          onClose={() => setEditingViewed(false)}
        />
      )}
    </div>
  );
}
