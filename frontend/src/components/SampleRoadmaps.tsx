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
    <div>
      {roadmaps.map((rm, idx) => (
        <PdfViewer key={idx} url={rm.url || ''} title={rm.name} />
      ))}
    </div>
  );
}

const API_BASE = 'https://gayi.pythonanywhere.com';

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

        const pdf = await pdfjsLib.getDocument(url).promise;
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

        await page.render({ canvasContext: ctx, viewport: scaled }).promise;
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
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-1">
        <p className="text-sm text-gray-400">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">{title} Roadmap</a>
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full mb-0.5">
      <canvas ref={canvasRef} className="w-full" style={{ display: 'block' }} />
    </div>
  );
}
