interface SuggestionsProps {
  suggestions: string[];
}

export default function Suggestions({ suggestions }: SuggestionsProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold text-white mb-4">
        Improvement Suggestions
      </h2>
      <ul className="space-y-2">
        {suggestions.map((s, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-gray-300"
          >
            <span className="w-5 h-5 rounded-full bg-cyan-950/50 text-cyan-400 flex items-center justify-center flex-shrink-0 text-xs font-medium">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
        {suggestions.length === 0 && (
          <li className="text-gray-600 text-sm">
            No improvement suggestions. Great resume!
          </li>
        )}
      </ul>
    </div>
  );
}
