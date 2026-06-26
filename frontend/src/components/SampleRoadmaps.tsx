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

const FLOW_COLORS = [
  { bg: 'from-cyan-600/20 to-cyan-800/10', border: 'border-cyan-700/50', text: 'text-cyan-300', label: 'from-cyan-600 to-cyan-700' },
  { bg: 'from-blue-600/20 to-blue-800/10', border: 'border-blue-700/50', text: 'text-blue-300', label: 'from-blue-600 to-blue-700' },
  { bg: 'from-violet-600/20 to-violet-800/10', border: 'border-violet-700/50', text: 'text-violet-300', label: 'from-violet-600 to-violet-700' },
  { bg: 'from-purple-600/20 to-purple-800/10', border: 'border-purple-700/50', text: 'text-purple-300', label: 'from-purple-600 to-purple-700' },
  { bg: 'from-pink-600/20 to-pink-800/10', border: 'border-pink-700/50', text: 'text-pink-300', label: 'from-pink-600 to-pink-700' },
  { bg: 'from-rose-600/20 to-rose-800/10', border: 'border-rose-700/50', text: 'text-rose-300', label: 'from-rose-600 to-rose-700' },
  { bg: 'from-orange-600/20 to-orange-800/10', border: 'border-orange-700/50', text: 'text-orange-300', label: 'from-orange-600 to-orange-700' },
  { bg: 'from-amber-600/20 to-amber-800/10', border: 'border-amber-700/50', text: 'text-amber-300', label: 'from-amber-600 to-amber-700' },
  { bg: 'from-emerald-600/20 to-emerald-800/10', border: 'border-emerald-700/50', text: 'text-emerald-300', label: 'from-emerald-600 to-emerald-700' },
  { bg: 'from-teal-600/20 to-teal-800/10', border: 'border-teal-700/50', text: 'text-teal-300', label: 'from-teal-600 to-teal-700' },
];

function Flowchart({ data }: { data: { topic: string; items: { label: string }[] }[] }) {
  return (
    <div className="flex gap-0 min-w-max">
      {data.map((topic, idx) => {
        const color = FLOW_COLORS[idx % FLOW_COLORS.length];
        return (
          <div key={idx} className="flex items-start">
            <div className={`w-56 shrink-0 rounded-xl border ${color.border} bg-gradient-to-b ${color.bg} p-3.5`}>
              <div className={`text-[10px] font-semibold uppercase tracking-wider ${color.text} mb-1.5`}>
                <span className={`inline-block px-1.5 py-0.5 rounded bg-gradient-to-r ${color.label} text-white`}>
                  Step {idx + 1}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-2 leading-snug">{topic.topic}</h4>
              {topic.items.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {topic.items.slice(0, 6).map((item, j) => (
                    <span
                      key={j}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-900/60 text-gray-400 border border-gray-700/50"
                    >
                      {item.label}
                    </span>
                  ))}
                  {topic.items.length > 6 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-gray-600">
                      +{topic.items.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>
            {idx < data.length - 1 && (
              <div className="flex items-center mx-2 mt-6">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
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
