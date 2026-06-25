const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-yellow-950/50 text-yellow-400 border-yellow-800',
  Intermediate: 'bg-blue-950/50 text-blue-400 border-blue-800',
  Advanced: 'bg-purple-950/50 text-purple-400 border-purple-800',
  Expert: 'bg-emerald-950/50 text-emerald-400 border-emerald-800',
};

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

interface ResumeSkill {
  skill: string;
  category: string;
  category_id: string;
  emoji: string;
  mentions: number;
  level: string;
  score: number;
  evidence: string[];
}

interface SkillImprovementPlan {
  resume_skills: ResumeSkill[];
  improvement_plan: { month: string; title: string; items: string[] }[];
}

interface SkillRoadmapProps {
  skill_improvement: SkillImprovementPlan;
}

function parseItem(item: string): { emoji: string; text: string } {
  const match = item.match(/^\[(.+?)\]\s*(.*)$/);
  if (!match) return { emoji: '', text: item };
  return { emoji: match[1], text: match[2] };
}

export default function SkillRoadmap({ skill_improvement }: SkillRoadmapProps) {
  const { resume_skills, improvement_plan } = skill_improvement;

  if (!resume_skills || resume_skills.length === 0) return null;

  const byLevel: Record<string, ResumeSkill[]> = {};
  for (const s of resume_skills) {
    if (!byLevel[s.level]) byLevel[s.level] = [];
    byLevel[s.level].push(s);
  }

  const levels = ['Expert', 'Advanced', 'Intermediate', 'Beginner'];

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-2">
          Skill Assessment
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Skills detected in your resume with estimated proficiency levels
        </p>
        <div className="space-y-4">
          {levels.map((level) => {
            const skills = byLevel[level];
            if (!skills || skills.length === 0) return null;
            return (
              <div key={level}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LEVEL_COLORS[level]}`}>
                    {level}
                  </span>
                  <span className="text-xs text-gray-600">{skills.length} skill{skills.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => {
                    const catColor = CATEGORY_COLORS[s.category] || 'bg-gray-800/50 text-gray-400 border-gray-700';
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs"
                      >
                        <span>{s.emoji}</span>
                        <span className="text-gray-200 font-medium">{s.skill}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${catColor} ml-1`}>
                          {s.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-6">
          Skill Improvement Roadmap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {improvement_plan.map((phase, idx) => (
            <div
              key={idx}
              className="relative bg-gray-950 rounded-xl p-5 border border-gray-800"
            >
              {idx < improvement_plan.length - 1 && (
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
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-700 mt-2 flex-shrink-0" />
                      <div className="flex flex-col gap-1 min-w-0">
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
    </div>
  );
}
