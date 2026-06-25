const CATEGORY_COLORS: Record<string, string> = {
  'Programming Languages': 'bg-blue-950/50 text-blue-400 border-blue-800',
  'Frameworks & Libraries': 'bg-purple-950/50 text-purple-400 border-purple-800',
  'Databases & Storage': 'bg-emerald-950/50 text-emerald-400 border-emerald-800',
  'Cloud & DevOps': 'bg-cyan-950/50 text-cyan-400 border-cyan-800',
  'Data Science & AI': 'bg-orange-950/50 text-orange-400 border-orange-800',
  'Tools & Platforms': 'bg-yellow-950/50 text-yellow-400 border-yellow-800',
  'Core Concepts': 'bg-pink-950/50 text-pink-400 border-pink-800',
  'Other Skills': 'bg-gray-800/50 text-gray-400 border-gray-700',
};

interface RoadmapItem {
  month: string;
  title: string;
  items: string[];
}

interface RoadmapProps {
  roadmap: RoadmapItem[];
}

function parseItem(item: string): { category: string | null; emoji: string; text: string } {
  const match = item.match(/^\[(.+?)\]\s*(.*)$/);
  if (!match) return { category: null, emoji: '', text: item };

  const categoryTag = match[1];
  const rest = match[2];

  const firstChar = categoryTag.charCodeAt(0);
  const isEmoji = firstChar > 0x2000;
  const emoji = isEmoji ? categoryTag.charAt(0) : '';
  const category = isEmoji ? categoryTag.substring(1).trim() : categoryTag;

  return { category, emoji, text: rest };
}

export default function Roadmap({ roadmap }: RoadmapProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold text-white mb-6">
        3-Month Learning Roadmap
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roadmap.map((phase, idx) => (
          <div
            key={idx}
            className="relative bg-gray-950 rounded-xl p-5 border border-gray-800"
          >
            {idx < roadmap.length - 1 && (
              <div className="hidden md:block absolute top-8 -right-3 text-gray-700 text-xl z-10">
                →
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  idx === 0
                    ? 'bg-cyan-950/50 text-cyan-400'
                    : idx === 1
                    ? 'bg-purple-950/50 text-purple-400'
                    : 'bg-emerald-950/50 text-emerald-400'
                }`}
              >
                {idx + 1}
              </span>
              <div>
                <p className="text-xs text-gray-500">{phase.month}</p>
                <p className="text-sm font-semibold text-white">{phase.title}</p>
              </div>
            </div>
            <ul className="space-y-3">
              {phase.items.map((item, i) => {
                const parsed = parseItem(item);
                const colorClass = CATEGORY_COLORS[parsed.category || ''] || 'bg-gray-800/50 text-gray-400 border-gray-700';

                return (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-700 mt-2 flex-shrink-0" />
                    <div className="flex flex-col gap-1 min-w-0">
                      {parsed.category && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${colorClass} self-start`}>
                          {parsed.emoji && <span>{parsed.emoji}</span>}
                          <span>{parsed.category}</span>
                        </span>
                      )}
                      <span className="text-xs text-gray-400 leading-relaxed">{parsed.text}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
