interface KeywordsProps {
  matched: string[];
  missing: string[];
}

function Tag({ text, type }: { text: string; type: 'match' | 'missing' }) {
  const colors =
    type === 'match'
      ? 'bg-green-950/50 text-green-400 border-green-800'
      : 'bg-red-950/50 text-red-400 border-red-800';

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colors}`}
    >
      {text}
    </span>
  );
}

export default function Keywords({ matched, missing }: KeywordsProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold text-white mb-4">Keyword Analysis</h2>
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm text-gray-300">
              Matched Keywords ({matched.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matched.map((kw) => (
              <Tag key={kw} text={kw} type="match" />
            ))}
            {matched.length === 0 && (
              <span className="text-gray-600 text-sm">No keywords matched</span>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm text-gray-300">
              Missing Keywords ({missing.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((kw) => (
              <Tag key={kw} text={kw} type="missing" />
            ))}
            {missing.length === 0 && (
              <span className="text-gray-600 text-sm">No missing keywords</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
