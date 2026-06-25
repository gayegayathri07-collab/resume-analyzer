interface JobDescriptionProps {
  value: string;
  onChange: (val: string) => void;
  wordCount?: number;
}

export default function JobDescription({ value, onChange, wordCount }: JobDescriptionProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Job Description</h2>
        {wordCount !== undefined && (
          <span className="text-sm text-gray-500">{wordCount} words</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the job description here..."
        className="w-full h-64 bg-gray-950 border border-gray-700 rounded-xl p-4 text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-500 transition-colors"
      />
    </div>
  );
}
