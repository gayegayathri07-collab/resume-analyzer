import { useState } from 'react';

interface HistoryItem {
  atsScore: number;
  resumeName?: string;
  jobDescription?: string;
  matchedKeywords: string[];
  missingKeywords: string[];
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: any) => void;
}

export default function HistoryPanel({ history, onSelect }: HistoryPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 relative"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        History
        {history.length > 0 && (
          <span className="absolute -top-2 -right-4 w-4 h-4 rounded-full bg-cyan-500 text-[10px] flex items-center justify-center text-white font-bold">
            {history.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[60vh] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Analysis History</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xl">&times;</button>
            </div>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm p-6 text-center">No analyses yet</p>
            ) : (
              <div className="p-2 space-y-1">
                {history.map((item, i) => {
                  const color = item.atsScore >= 80 ? 'text-cyan-400' : item.atsScore >= 60 ? 'text-yellow-400' : 'text-red-400';
                  return (
                    <button
                      key={i}
                      onClick={() => { onSelect(item); setOpen(false); }}
                      className="w-full text-left p-3 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-medium truncate mr-2">
                          {item.resumeName || `Analysis #${i + 1}`}
                        </span>
                        <span className={`text-sm font-bold ${color}`}>{item.atsScore}</span>
                      </div>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {item.matchedKeywords.slice(0, 4).map((kw) => (
                          <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-950/50 text-green-400 border border-green-800">{kw}</span>
                        ))}
                        {item.matchedKeywords.length > 4 && (
                          <span className="text-[10px] text-gray-500">+{item.matchedKeywords.length - 4}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
