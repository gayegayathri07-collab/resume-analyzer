import { useState, useEffect, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import JobDescription from './components/JobDescription';
import ATSScore from './components/ATSScore';
import Keywords from './components/Keywords';
import Suggestions from './components/Suggestions';
import Roadmap from './components/Roadmap';
import SkillRoadmap from './components/SkillRoadmap';
import SampleRoadmaps from './components/SampleRoadmaps';
import HistoryPanel from './components/HistoryPanel';
import { jsPDF } from 'jspdf';

interface AnalysisResult {
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  breakdown: Record<string, number>;
  roadmap: { month: string; title: string; items: string[] }[];
  skill_improvement: {
    resume_skills: { skill: string; category: string; category_id: string; emoji: string; mentions: number; level: string; score: number; evidence: string[] }[];
    improvement_plan: { month: string; title: string; items: string[] }[];
  };
  sample_roadmaps?: { name: string; filename: string; url: string }[];
  resumeName?: string;
  jobDescription?: string;
  resumeText?: string;
}

function App() {
  const [resumeText, setResumeText] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('resume_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveToHistory = useCallback((res: AnalysisResult) => {
    const updated = [res, ...history].slice(0, 20);
    setHistory(updated);
    try {
      localStorage.setItem('resume_history', JSON.stringify(updated));
    } catch {}
  }, [history]);

  const handleAnalyze = async () => {
    if (!resumeText) {
      setError('Please upload a resume first');
      return;
    }
    if (!jobDescription) {
      setError('Please enter a job description');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://gayi.pythonanywhere.com/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          resumeName,
          userEmail: '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const analysis: AnalysisResult = {
        atsScore: data.ats_score,
        matchedKeywords: data.matched_keywords || [],
        missingKeywords: data.missing_keywords || [],
        suggestions: data.suggestions || [],
        breakdown: data.breakdown || {},
        roadmap: data.roadmap || [],
        skill_improvement: data.skill_improvement || { resume_skills: [], improvement_plan: [] },
        sample_roadmaps: data.sample_roadmaps || [],
        resumeName: resumeName || 'resume.pdf',
        jobDescription: jobDescription,
        resumeText: resumeText,
      };
      setResult(analysis);
      saveToHistory(analysis);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setResumeText('');
    setResumeName('');
    setJobDescription('');
    setError('');
    setShowPreview(false);
  };

  const handleCopyResults = () => {
    if (!result) return;
    const text = [
      `ATS Score: ${result.atsScore}/100`,
      '',
      'Matched Keywords:',
      result.matchedKeywords.join(', '),
      '',
      'Missing Keywords:',
      result.missingKeywords.join(', '),
      '',
      'Suggestions:',
      ...result.suggestions.map((s, i) => `${i + 1}. ${s}`),
      '',
      '3-Month Roadmap:',
      ...result.roadmap.map((p) => `${p.month} - ${p.title}\n  ${p.items.join('\n  ')}`),
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert('Results copied to clipboard!');
    });
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(20);
    doc.text('AI Resume Analyzer - Report', pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(10);
    doc.text(`Resume: ${result.resumeName || 'N/A'}`, 14, y);
    y += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
    y += 10;

    doc.setFontSize(16);
    doc.text(`ATS Score: ${result.atsScore}/100`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text('Breakdown:', 14, y);
    y += 7;
    doc.setFontSize(10);
    const labels: Record<string, string> = {
      keywords: 'Keywords Match (40)', contactInfo: 'Contact Info (10)',
      sections: 'Sections (15)', formatting: 'Formatting (10)',
      length: 'Length (10)', actionVerbs: 'Action Verbs (15)',
    };
    for (const [k, v] of Object.entries(result.breakdown)) {
      doc.text(`${labels[k] || k}: ${v}`, 20, y);
      y += 5;
    }
    y += 5;

    doc.setFontSize(12);
    doc.text('Matched Keywords:', 14, y);
    y += 7;
    doc.setFontSize(10);
    const matchedText = result.matchedKeywords.join(', ') || 'None';
    const splitMatched = doc.splitTextToSize(matchedText, pageWidth - 28);
    doc.text(splitMatched, 20, y);
    y += splitMatched.length * 5 + 5;

    doc.setFontSize(12);
    doc.text('Missing Keywords:', 14, y);
    y += 7;
    doc.setFontSize(10);
    const missingText = result.missingKeywords.join(', ') || 'None';
    const splitMissing = doc.splitTextToSize(missingText, pageWidth - 28);
    doc.text(splitMissing, 20, y);
    y += splitMissing.length * 5 + 5;

    doc.setFontSize(12);
    doc.text('Suggestions:', 14, y);
    y += 7;
    doc.setFontSize(10);
    for (let i = 0; i < result.suggestions.length; i++) {
      if (y > 270) { doc.addPage(); y = 20; }
      const lines = doc.splitTextToSize(`${i + 1}. ${result.suggestions[i]}`, pageWidth - 28);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 2;
    }

    doc.save(`resume-analysis-${Date.now()}.pdf`);
  };

  const loadFromHistory = (item: AnalysisResult) => {
    setResult(null);
    setResumeText(item.resumeText || '');
    setResumeName(item.resumeName || '');
    setJobDescription(item.jobDescription || '');
    setShowPreview(true);
  };

  const resumeWords = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;
  const jdWords = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">AI</div>
            <h1 className="text-xl font-semibold text-white">Resume Analyzer</h1>
          </div>
          <div className="flex items-center gap-3">
            <HistoryPanel history={history} onSelect={loadFromHistory} />
            {result && (
              <>
                <button onClick={handleCopyResults} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy
                </button>
                <button onClick={handleDownloadPDF} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF
                </button>
                <button onClick={handleReset} className="text-sm text-gray-400 hover:text-white transition-colors">New Analysis</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {!result ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileUpload
              onTextExtracted={(text, name) => {
                setResumeText(text);
                setResumeName(name);
                setShowPreview(true);
              }}
            />
            <JobDescription value={jobDescription} onChange={setJobDescription} wordCount={jdWords} />
            
            {showPreview && resumeText && (
              <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white">Resume Text Preview</h2>
                  <span className="text-sm text-gray-500">{resumeWords} words</span>
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full h-48 bg-gray-950 border border-gray-700 rounded-xl p-4 text-gray-100 placeholder-gray-600 resize-y focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                />
              </div>
            )}

            <div className="lg:col-span-2 flex flex-col items-center gap-3">
              {error && (
                <p className="text-red-400 text-sm bg-red-950/50 px-4 py-2 rounded-lg border border-red-900">{error}</p>
              )}
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="px-10 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Resume'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ATSScore score={result.atsScore} breakdown={result.breakdown} />
              </div>
              <div className="lg:col-span-2">
                <Keywords matched={result.matchedKeywords} missing={result.missingKeywords} />
              </div>
            </div>
            <Suggestions suggestions={result.suggestions} />
            <Roadmap roadmap={result.roadmap} />
            <SkillRoadmap skill_improvement={result.skill_improvement} />
            <SampleRoadmaps roadmaps={result.sample_roadmaps || []} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
