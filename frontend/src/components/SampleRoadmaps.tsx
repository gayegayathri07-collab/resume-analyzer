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
  const [expanded, setExpanded] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

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

  const toggleTopic = (i: number) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-base font-semibold text-white">{data.title}</h3>
          <p className="text-xs text-gray-500 mt-1">{data.description}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {data.total_topics} topics · {data.total_subtopics} skills
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2">
          {data.learning_sequence.map((topic, i) => (
            <div key={i} className="border border-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleTopic(i)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-950 hover:bg-gray-900/50 text-left"
              >
                <span className="text-sm font-medium text-gray-200">{topic.topic}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600">{topic.items.length} items</span>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${expandedTopics.has(i) ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {expandedTopics.has(i) && (
                <div className="px-3 py-2 bg-gray-950/50">
                  <div className="flex flex-wrap gap-1.5">
                    {topic.items.map((item, j) => (
                      <span
                        key={j}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="pt-2">
            <a
              href={data.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              View on roadmap.sh →
            </a>
          </div>
        </div>
      )}
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
