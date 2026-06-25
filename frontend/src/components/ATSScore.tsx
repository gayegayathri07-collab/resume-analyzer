import { useState, useEffect } from 'react';

interface ATSScoreProps {
  score: number;
  breakdown: Record<string, number>;
}

function CircularProgress({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    const interval = setInterval(() => {
      setAnimatedScore((prev) => {
        if (prev >= score) {
          clearInterval(interval);
          return score;
        }
        return prev + 1;
      });
    }, 20);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;
  const color = animatedScore >= 80 ? '#22d3ee' : animatedScore >= 60 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" className="transform -rotate-90">
        <circle cx="90" cy="90" r={radius} stroke="#1f2937" strokeWidth="10" fill="none" />
        <circle
          cx="90" cy="90" r={radius} stroke={color} strokeWidth="10" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-white transition-all duration-200">{animatedScore}</span>
        <span className="text-sm text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

const breakdownLabels: Record<string, string> = {
  keywords: 'Keywords Match', contactInfo: 'Contact Info', sections: 'Sections',
  formatting: 'Formatting', length: 'Length', actionVerbs: 'Action Verbs',
};

const maxValues: Record<string, number> = {
  keywords: 40, contactInfo: 10, sections: 15, formatting: 10, length: 10, actionVerbs: 15,
};

export default function ATSScore({ score, breakdown }: ATSScoreProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold text-white mb-6">ATS Score</h2>
      <CircularProgress score={score} />
      <div className="mt-6 space-y-2">
        {Object.entries(breakdown).map(([key, val]) => {
          const max = maxValues[key] || 40;
          return (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{breakdownLabels[key] || key}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(val / max) * 100}%` }}
                  />
                </div>
                <span className="text-gray-300 w-6 text-right">{val}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
