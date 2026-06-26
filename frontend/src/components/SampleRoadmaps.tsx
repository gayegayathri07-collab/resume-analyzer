import { useEffect, useRef, useState } from 'react';

interface SampleRoadmap {
  name: string;
  filename: string;
  url?: string;
}

interface SampleRoadmapsProps {
  roadmaps: SampleRoadmap[];
}

export default function SampleRoadmaps({ roadmaps }: SampleRoadmapsProps) {
  if (!roadmaps || roadmaps.length === 0) return null;

  return (
    <div className="space-y-3">
      {roadmaps.map((rm, idx) => (
        rm.filename.endsWith('.json')
          ? <JsonRoadmapViewer key={idx} url={rm.url || ''} title={rm.name} />
          : <PdfViewer key={idx} url={rm.url || ''} title={rm.name} />
      ))}
    </div>
  );
}

const API_BASE = 'https://gayi.pythonanywhere.com';

interface RoadmapData {
  slug: string;
  title: string;
  description: string;
  type: string;
  total_topics: number;
  total_subtopics: number;
  learning_sequence: { topic: string; items: { label: string; id: string }[] }[];
  subtopics_list: string[];
  source: string;
}

function JsonRoadmapViewer({ url: propUrl, title }: { url: string; title: string }) {
  const url = propUrl.startsWith('/') ? `${API_BASE}${propUrl}` : propUrl;
  const [data, setData] = useState<RoadmapData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {});
  }, [url]);

  if (!data) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-400">Loading {title} Roadmap...</p>
      </div>
    );
  }

  const hasContent = data.learning_sequence && data.learning_sequence.length > 0;

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">{data.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{data.description}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {data.total_topics} stages · {data.total_subtopics} skills
          </p>
        </div>
        <a
          href={data.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-cyan-400 hover:text-cyan-300 underline shrink-0 ml-3"
        >
          Full →
        </a>
      </div>

      {hasContent && (
        <div ref={scrollRef} className="overflow-x-auto pb-2">
          <Flowchart data={data.learning_sequence} />
        </div>
      )}
    </div>
  );
}

const GRADIENT_COLORS = [
  { dot: 'bg-cyan-400', line: 'bg-cyan-600/30', border: 'border-cyan-700/40', glow: 'shadow-cyan-500/10', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-700/40' },
  { dot: 'bg-blue-400', line: 'bg-blue-600/30', border: 'border-blue-700/40', glow: 'shadow-blue-500/10', badge: 'bg-blue-500/10 text-blue-300 border-blue-700/40' },
  { dot: 'bg-violet-400', line: 'bg-violet-600/30', border: 'border-violet-700/40', glow: 'shadow-violet-500/10', badge: 'bg-violet-500/10 text-violet-300 border-violet-700/40' },
  { dot: 'bg-purple-400', line: 'bg-purple-600/30', border: 'border-purple-700/40', glow: 'shadow-purple-500/10', badge: 'bg-purple-500/10 text-purple-300 border-purple-700/40' },
  { dot: 'bg-pink-400', line: 'bg-pink-600/30', border: 'border-pink-700/40', glow: 'shadow-pink-500/10', badge: 'bg-pink-500/10 text-pink-300 border-pink-700/40' },
  { dot: 'bg-emerald-400', line: 'bg-emerald-600/30', border: 'border-emerald-700/40', glow: 'shadow-emerald-500/10', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-700/40' },
  { dot: 'bg-orange-400', line: 'bg-orange-600/30', border: 'border-orange-700/40', glow: 'shadow-orange-500/10', badge: 'bg-orange-500/10 text-orange-300 border-orange-700/40' },
  { dot: 'bg-rose-400', line: 'bg-rose-600/30', border: 'border-rose-700/40', glow: 'shadow-rose-500/10', badge: 'bg-rose-500/10 text-rose-300 border-rose-700/40' },
  { dot: 'bg-teal-400', line: 'bg-teal-600/30', border: 'border-teal-700/40', glow: 'shadow-teal-500/10', badge: 'bg-teal-500/10 text-teal-300 border-teal-700/40' },
  { dot: 'bg-amber-400', line: 'bg-amber-600/30', border: 'border-amber-700/40', glow: 'shadow-amber-500/10', badge: 'bg-amber-500/10 text-amber-300 border-amber-700/40' },
];

function Flowchart({ data }: { data: { topic: string; items: { label: string }[] }[] }) {
  return (
    <div className="relative">
      {data.map((topic, idx) => {
        const color = GRADIENT_COLORS[idx % GRADIENT_COLORS.length];
        return (
          <div key={idx} className="relative flex">
            <div className="flex flex-col items-center mr-4 shrink-0">
              <div className={`w-3.5 h-3.5 rounded-full ${color.dot} ring-2 ring-gray-900 z-10 shadow-lg ${color.glow}`} />
              {idx < data.length - 1 && (
                <div className={`w-0.5 h-full min-h-[20px] ${color.line}`} />
              )}
            </div>
            <div className={`flex-1 pb-6 ${idx === data.length - 1 ? '' : 'mb-1'}`}>
              <div className={`bg-gray-900/80 border ${color.border} rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color.badge}`}>
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{topic.topic}</h4>
                </div>
                {topic.items.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {topic.items.slice(0, 10).map((item, j) => (
                      <span
                        key={j}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/70 text-gray-400 border border-gray-700/50"
                      >
                        {item.label}
                      </span>
                    ))}
                    {topic.items.length > 10 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-gray-600">
                        +{topic.items.length - 10}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PdfViewer({ url: propUrl, title }: { url: string; title: string }) {
  const url = propUrl.startsWith('/') ? `${API_BASE}${propUrl}` : propUrl;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://unpkg.com/pdfjs-dist@6.0.227/build/pdf.worker.min.mjs';

        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaled = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = scaled.width;
        canvas.height = scaled.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cropTop = 0.08;
        const cropBottom = 0.08;
        const cropHeight = scaled.height * (1 - cropTop - cropBottom);

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, scaled.height * cropTop, scaled.width, cropHeight);
        ctx.clip();
        ctx.translate(0, -scaled.height * cropTop);

        await page.render({ canvas: canvas, canvasContext: ctx, viewport: scaled }).promise;
        ctx.restore();
      } catch (e) {
        console.error('PDF render error:', e);
        if (!cancelled) setError('Could not render PDF');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [url]);

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-400">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">{title} Roadmap</a>
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full" style={{ display: 'block' }} />
    </div>
  );
}
