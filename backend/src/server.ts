import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mammoth from 'mammoth';
const pdfParse = require('pdf-parse');
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SAMPLES_DIR = path.resolve(__dirname, '..', '..', 'samples');

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));
app.use('/api/samples', express.static(SAMPLES_DIR));

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

const ACTION_VERBS = [
  'achieved', 'implemented', 'developed', 'managed', 'led', 'created',
  'designed', 'launched', 'optimized', 'delivered', 'drove', 'established',
  'generated', 'improved', 'increased', 'initiated', 'introduced', 'negotiated',
  'performed', 'reduced', 'resolved', 'spearheaded', 'strengthened', 'transformed',
  'built', 'coordinated', 'executed', 'facilitated', 'mentored', 'organized',
  'pioneered', 'produced', 'streamlined', 'trained', 'architected', 'authored',
  'consolidated', 'demonstrated', 'directed', 'engineered', 'forged', 'guided',
  'influenced', 'innovated', 'integrated', 'orchestrated', 'oversaw', 'proposed',
  'rebuilt', 'reorganized', 'restructured', 'revamped', 'revitalized', 'solved',
];

const REQUIRED_SECTIONS = [
  'experience', 'work experience', 'employment',
  'education', 'academic',
  'skills', 'technical skills', 'core competencies',
  'projects',
  'certifications', 'certificates',
  'summary', 'professional summary', 'objective', 'profile',
];

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s#+.-]/g, ' ').split(/\s+/);
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'this',
    'that', 'these', 'those', 'it', 'its', 'my', 'your', 'our', 'their',
    'we', 'you', 'they', 'he', 'she', 'him', 'her', 'all', 'each', 'every',
    'some', 'any', 'no', 'not', 'very', 'just', 'about', 'up', 'if', 'than',
    'into', 'over', 'after', 'before', 'between', 'under', 'above', 'below',
  ]);
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length > 2 && !stopWords.has(w)) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([k]) => k);
}

function findSections(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const section of REQUIRED_SECTIONS) {
    if (lower.includes(section)) {
      found.push(section);
    }
  }
  return found;
}

function countActionVerbs(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const verb of ACTION_VERBS) {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

function calculateATSScore(
  resumeText: string,
  jobDescription: string
): {
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  breakdown: Record<string, number>;
  suggestions: string[];
} {
  const resumeKeywords = extractKeywords(resumeText);
  const jdKeywords = extractKeywords(jobDescription);

  const matchedKeywords = jdKeywords.filter((k) => resumeKeywords.includes(k));
  const missingKeywords = jdKeywords.filter((k) => !resumeKeywords.includes(k));

  const maxKeywordPoints = 40;
  const keywordScore =
    jdKeywords.length > 0
      ? Math.round((matchedKeywords.length / jdKeywords.length) * maxKeywordPoints)
      : 0;

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex =
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const linkedinRegex =
    /linkedin\.com\/in\/[a-zA-Z0-9_-]+/;
  const hasEmail = emailRegex.test(resumeText);
  const hasPhone = phoneRegex.test(resumeText);
  const hasLinkedin = linkedinRegex.test(resumeText);
  let contactInfoScore = 0;
  if (hasEmail) contactInfoScore += 4;
  if (hasPhone) contactInfoScore += 3;
  if (hasLinkedin) contactInfoScore += 3;

  const foundSections = findSections(resumeText);
  const sectionScore = Math.min(
    Math.round((foundSections.length / REQUIRED_SECTIONS.length) * 15),
    15
  );

  const bulletPoints = (resumeText.match(/^[\s]*[-•*]\s/gm) || []).length;
  const hasConsistentFormat =
    bulletPoints > 3 &&
    (resumeText.split('\n').filter((l) => l.trim().length > 0).length > 15);
  const formattingScore = hasConsistentFormat ? 10 : 4;

  const wordCount = resumeText.split(/\s+/).length;
  let lengthScore = 0;
  if (wordCount >= 250 && wordCount <= 800) {
    lengthScore = 10;
  } else if (wordCount >= 200 && wordCount <= 1000) {
    lengthScore = 7;
  } else if (wordCount >= 150 && wordCount <= 1200) {
    lengthScore = 4;
  }

  const actionVerbCount = countActionVerbs(resumeText);
  const actionVerbScore = Math.min(Math.round((actionVerbCount / 10) * 15), 15);

  const totalScore = Math.min(
    keywordScore + contactInfoScore + sectionScore + formattingScore + lengthScore + actionVerbScore,
    100
  );

  const breakdown: Record<string, number> = {
    keywords: keywordScore,
    contactInfo: contactInfoScore,
    sections: sectionScore,
    formatting: formattingScore,
    length: lengthScore,
    actionVerbs: actionVerbScore,
  };

  const suggestions: string[] = [];

  if (missingKeywords.length > 5) {
    suggestions.push(
      `Add these important keywords to your resume: ${missingKeywords.slice(0, 10).join(', ')}`
    );
  }
  if (!hasEmail) {
    suggestions.push('Add your email address to the top of your resume');
  }
  if (!hasPhone) {
    suggestions.push('Include your phone number for recruiters to reach you');
  }
  if (!hasLinkedin) {
    suggestions.push('Add your LinkedIn profile URL');
  }
  if (foundSections.length < 4) {
    suggestions.push(
      `Add missing sections: ${REQUIRED_SECTIONS.filter((s) => !foundSections.includes(s)).slice(0, 4).join(', ')}`
    );
  }
  if (!hasConsistentFormat) {
    suggestions.push('Use consistent bullet points and formatting throughout');
  }
  if (wordCount < 250) {
    suggestions.push('Your resume is too short. Aim for 350-600 words');
  } else if (wordCount > 800) {
    suggestions.push('Your resume is too long. Consider trimming to under 800 words');
  }
  if (actionVerbCount < 5) {
    suggestions.push(
      'Use more action verbs (e.g., achieved, implemented, developed) to strengthen bullet points'
    );
  }
  if (keywordScore < 20) {
    suggestions.push('Tailor your resume to match more keywords from the job description');
  }

  return {
    atsScore: totalScore,
    matchedKeywords,
    missingKeywords: missingKeywords.slice(0, 20),
    breakdown,
    suggestions,
  };
}

interface SkillCategory {
  id: string;
  name: string;
  emoji: string;
  keywords: string[];
  approach: string;
  prereqFor: string[];
}

const SKILL_TAXONOMY: SkillCategory[] = [
  {
    id: 'languages', name: 'Programming Languages', emoji: '💻',
    keywords: ['python', 'java', 'javascript', 'typescript', 'c\\+\\+', 'cpp', 'c#', 'csharp', 'golang', 'go\\b', 'rust', 'swift', 'kotlin', 'ruby', 'php', 'scala', 'r\\b', 'matlab', 'perl', 'bash', 'shell', 'powershell', 'html', 'css'],
    approach: 'Learn syntax, core concepts, data structures, and idiomatic patterns',
    prereqFor: ['react', 'angular', 'vue', 'django', 'spring', 'node', 'express', 'next', 'pytorch'],
  },
  {
    id: 'frameworks', name: 'Frameworks & Libraries', emoji: '🛠️',
    keywords: ['react', 'react\\.?js', 'angular', 'vue', 'vue\\.?js', 'svelte', 'django', 'flask', 'fastapi', 'spring', 'spring\\s*boot', 'node\\.?js', 'express', 'next\\.?js', 'nuxt', 'pytorch', 'tensorflow', 'keras', 'jquery', 'bootstrap', 'tailwind', 'laravel', 'asp\\.?net', '\\.net', 'rails', 'nestjs'],
    approach: 'Understand architecture patterns, build sample projects, learn conventions',
    prereqFor: [],
  },
  {
    id: 'databases', name: 'Databases & Storage', emoji: '🗄️',
    keywords: ['mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'oracle', 'sqlite', 'mariadb', 'sql\\s*server', 'cosmosdb', 'bigquery', 'redshift', 'snowflake'],
    approach: 'Learn data modeling, query optimization, indexing, and schema design',
    prereqFor: [],
  },
  {
    id: 'cloud_devops', name: 'Cloud & DevOps', emoji: '☁️',
    keywords: ['aws', 'azure', 'gcp', 'google\\s*cloud', 'docker', 'kubernetes', 'k8s', 'jenkins', 'terraform', 'ansible', 'pulumi', 'github\\s*actions', 'gitlab\\s*ci', 'circleci', 'argocd', 'helm', 'istio', 'prometheus', 'grafana'],
    approach: 'Practice infrastructure-as-code, CI/CD pipelines, and container orchestration',
    prereqFor: [],
  },
  {
    id: 'data_ai', name: 'Data Science & AI', emoji: '🤖',
    keywords: ['machine\\s*learning', 'deep\\s*learning', 'data\\s*science', 'nlp', 'natural\\s*language', 'computer\\s*vision', 'llm', 'artificial\\s*intelligence', 'data\\s*analytics', 'tableau', 'power\\s*bi', 'pandas', 'numpy', 'scikit\\s*learn', 'jupyter', 'spark', 'pyspark', 'hadoop', 'airflow', 'dbt', 'mlops', 'gen\\s*ai', 'langchain'],
    approach: 'Study theory, implement algorithms, work with real datasets and models',
    prereqFor: [],
  },
  {
    id: 'tools', name: 'Tools & Platforms', emoji: '🔧',
    keywords: ['git', 'jira', 'confluence', 'postman', 'swagger', 'openapi', 'kafka', 'rabbitmq', 'nginx', 'webpack', 'babel', 'eslint', 'prettier', 'graphql', 'grpc', 'selenium', 'cypress', 'jest', 'mocha', 'pytest', 'junit'],
    approach: 'Practice with real workflows, learn CLI usage and configuration management',
    prereqFor: [],
  },
  {
    id: 'concepts', name: 'Core Concepts', emoji: '📐',
    keywords: ['rest', 'restful', 'graphql', 'microservices', 'design\\s*patterns', 'agile', 'scrum', 'tdd', 'ci/cd', 'oop', 'solid', 'algorithms', 'data\\s*structures', 'system\\s*design', 'architecture', 'api\\s*design', 'testing', 'deployment', 'security', 'authentication', 'authorization', 'oauth', 'jwt'],
    approach: 'Study fundamentals, apply through practice projects and system design exercises',
    prereqFor: [],
  },
];

const SKILL_PREREQUISITES: Record<string, string[]> = {
  'react': ['javascript', 'html', 'css'],
  'react.js': ['javascript', 'html', 'css'],
  'angular': ['typescript', 'javascript'],
  'vue': ['javascript', 'html', 'css'],
  'vue.js': ['javascript', 'html', 'css'],
  'django': ['python'],
  'flask': ['python'],
  'fastapi': ['python'],
  'spring': ['java'],
  'spring boot': ['java', 'spring'],
  'node': ['javascript'],
  'node.js': ['javascript'],
  'express': ['javascript', 'node.js'],
  'next': ['javascript', 'react'],
  'next.js': ['javascript', 'react'],
  'pytorch': ['python'],
  'tensorflow': ['python'],
  'docker': ['bash', 'linux'],
  'kubernetes': ['docker', 'bash'],
  'typescript': ['javascript'],
  'pandas': ['python'],
  'numpy': ['python'],
  'scikit-learn': ['python'],
  'machine learning': ['python', 'statistics'],
  'deep learning': ['python', 'machine learning'],
  'nlp': ['python', 'machine learning'],
  'computer vision': ['python', 'machine learning'],
  'aws': ['bash', 'linux'],
  'azure': ['bash', 'linux'],
  'gcp': ['bash', 'linux'],
  'terraform': ['bash', 'cloud'],
  'ansible': ['bash'],
  'kafka': ['java'],
  'spark': ['python', 'scala'],
  'pyspark': ['python', 'spark'],
  'airflow': ['python'],
  'dbt': ['sql'],
  'graphql': ['javascript', 'rest'],
  'microservices': ['docker', 'rest', 'design patterns'],
  'redux': ['react', 'javascript'],
  'jest': ['javascript'],
  'pytest': ['python'],
};

function categorizeSkill(skill: string): SkillCategory {
  const lower = skill.toLowerCase();
  for (const cat of SKILL_TAXONOMY) {
    for (const kw of cat.keywords) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(lower)) {
        return cat;
      }
    }
  }
  return {
    id: 'other', name: 'Other Skills', emoji: '📌',
    keywords: [], approach: 'Learn fundamentals through tutorials, documentation, and hands-on practice',
    prereqFor: [],
  };
}

function getPrereqs(skill: string): string[] {
  return SKILL_PREREQUISITES[skill.toLowerCase()] || [];
}

function getDefaultRoadmap(): any[] {
  return [
    { month: 'Month 1', title: 'Foundations', items: ['Your resume already matches the job description well!', 'Focus on deepening existing skills and interview preparation'] },
    { month: 'Month 2', title: 'Hands-on Practice', items: ['Practice with mock interviews and coding challenges', 'Review system design principles and behavioral questions'] },
    { month: 'Month 3', title: 'Apply & Showcase', items: ['Apply to target companies and roles that match your profile', 'Network with professionals in your field on LinkedIn'] },
  ];
}

function algorithmicRoadmap(missingKeywords: string[]): any[] {
  const uniqueSkills = [...new Set(missingKeywords)].slice(0, 12);

  const enriched = uniqueSkills.map((skill) => {
    const cat = categorizeSkill(skill);
    const prereqs = getPrereqs(skill);
    const missingPrereqs = prereqs.filter((p) =>
      uniqueSkills.some((s) => s.toLowerCase() === p.toLowerCase())
    );
    return { skill, category: cat, prerequisites: prereqs, missingPrereqs };
  });

  enriched.sort((a, b) => {
    const aScore = a.missingPrereqs.length;
    const bScore = b.missingPrereqs.length;
    const aIsPrereq = enriched.some((other) =>
      a.skill !== other.skill &&
      other.prerequisites.some((p) => p.toLowerCase() === a.skill.toLowerCase())
    ) ? -1 : 0;
    const bIsPrereq = enriched.some((other) =>
      b.skill !== other.skill &&
      other.prerequisites.some((p) => p.toLowerCase() === b.skill.toLowerCase())
    ) ? -1 : 0;
    return (aScore - bScore) || (aIsPrereq - bIsPrereq);
  });

  const months = [
    { month: 'Month 1', title: 'Foundations & Core Learning', items: [] as string[] },
    { month: 'Month 2', title: 'Hands-on Project Practice', items: [] as string[] },
    { month: 'Month 3', title: 'Advanced Application & Showcase', items: [] as string[] },
  ];

  const n = enriched.length;
  enriched.forEach((item, i) => {
    const { skill, category: cat, missingPrereqs } = item;
    const emoji = cat.emoji;
    const catName = cat.name;
    const approach = cat.approach;
    const hasPrereqs = missingPrereqs.length > 0;

    if (hasPrereqs || i < Math.floor(n / 3)) {
      const prereqHint = hasPrereqs ? ` (first master: ${missingPrereqs.join(', ')})` : '';
      months[0].items.push(`[${emoji} ${catName}] Learn ${skill}${prereqHint}: ${approach}`);
    } else if (i < Math.floor(2 * n / 3)) {
      months[1].items.push(`[${emoji} ${catName}] Build a project using ${skill} – apply concepts in a real scenario`);
    } else {
      months[2].items.push(`[${emoji} ${catName}] Add ${skill} to portfolio – showcase mastery through projects`);
    }
  });

  if (months[0].items.length === 0) months[0].items.push('Review job description and identify key skills to prioritize');
  if (months[1].items.length === 0) months[1].items.push('Build a comprehensive project incorporating multiple technologies');
  if (months[2].items.length === 0) months[2].items.push('Optimize resume, practice interviews, and apply to target roles');

  return months;
}

async function generateAiRoadmap(missingKeywords: string[], resumeText?: string, jobDescription?: string): Promise<any[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const skillsJson = JSON.stringify(missingKeywords.slice(0, 15));
    const prompt = `You are a career coach and tech mentor. Generate a personalized 3-month learning roadmap based on these missing skills.

Missing Skills: ${skillsJson}

The user's resume lacks these skills compared to their target job description.
Generate a JSON response with this exact structure:
{
  "roadmap": [
    {
      "month": "Month 1",
      "title": "Foundations & Core Learning",
      "items": ["string – actionable learning item with category and specific focus"]
    },
    {
      "month": "Month 2",
      "title": "Hands-on Project Practice",
      "items": ["..."]
    },
    {
      "month": "Month 3",
      "title": "Advanced Application & Showcase",
      "items": ["..."]
    }
  ]
}

Rules:
- Month 1: Focus on fundamentals, prerequisites, and theory
- Month 2: Project-based learning, building real applications
- Month 3: Advanced topics, portfolio work, interview prep
- Each item should start with a category emoji and be specific and actionable
- Generate 3-6 items per month
- Consider skill dependencies (e.g., learn Python before Django)
- Only use the skills listed above; don't introduce new skills`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

    const data = await response.json() as any;
    const content = JSON.parse(data.choices[0].message.content);
    const roadmap = content.roadmap;
    if (roadmap && roadmap.length === 3) return roadmap;
  } catch (err) {
    console.warn('AI roadmap generation failed:', err);
  }

  return null;
}

async function generateRoadmap(missingKeywords: string[], resumeText?: string, jobDescription?: string): Promise<any[]> {
  if (!missingKeywords || missingKeywords.length === 0) return getDefaultRoadmap();

  const aiRoadmap = await generateAiRoadmap(missingKeywords, resumeText, jobDescription);
  if (aiRoadmap) return aiRoadmap;

  return algorithmicRoadmap(missingKeywords);
}

async function loadSampleRoadmaps(): Promise<{ name: string; filename: string; url: string }[]> {
  const roadmaps: { name: string; filename: string; url: string }[] = [];
  if (!fs.existsSync(SAMPLES_DIR)) return roadmaps;

  const allowedFiles = ['data-analyst.pdf', 'frontend.pdf'];

  for (const f of allowedFiles) {
    const filePath = path.join(SAMPLES_DIR, f);
    if (!fs.existsSync(filePath)) continue;
    const name = path.parse(f).name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    roadmaps.push({ name, filename: f, url: `/api/samples/${f}` });
  }
  return roadmaps;
}

app.post('/api/upload', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds 5MB limit' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    if (req.file.mimetype === 'application/pdf') {
      const buffer = fs.readFileSync(filePath);
      pdfParse(buffer)
        .then((data: any) => {
          fs.unlinkSync(filePath);
          res.json({ text: data.text, filename: req.file!.originalname });
        })
        .catch(() => {
          fs.unlinkSync(filePath);
          res.status(500).json({ error: 'Failed to parse PDF' });
        });
    } else {
      mammoth
        .extractRawText({ path: filePath })
        .then((result) => {
          fs.unlinkSync(filePath);
          res.json({ text: result.value, filename: req.file!.originalname });
        })
        .catch(() => {
          fs.unlinkSync(filePath);
          res.status(500).json({ error: 'Failed to parse DOCX' });
        });
    }
  });
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { resumeText, jobDescription, userEmail, resumeName } = req.body;

    if (!resumeText || !jobDescription) {
      return res
        .status(400)
        .json({ error: 'resumeText and jobDescription are required' });
    }

    const result = calculateATSScore(resumeText, jobDescription);
    const roadmap = await generateRoadmap(result.missingKeywords, resumeText, jobDescription);

    const analysis = {
      id: uuidv4(),
      user_email: userEmail || 'anonymous@example.com',
      resume_name: resumeName || 'resume.pdf',
      ats_score: result.atsScore,
      job_description: jobDescription,
      matched_keywords: result.matchedKeywords,
      missing_keywords: result.missingKeywords,
      suggestions: result.suggestions,
      breakdown: result.breakdown,
      roadmap,
      skill_improvement: { resume_skills: [], improvement_plan: [] },
      sample_roadmaps: await loadSampleRoadmaps(),
      created_at: new Date().toISOString(),
    };

    try {
      const { error: dbError } = await supabase
        .from('analyses')
        .insert({
          id: analysis.id,
          user_email: analysis.user_email,
          resume_name: analysis.resume_name,
          ats_score: analysis.ats_score,
          job_description: analysis.job_description,
          matched_keywords: analysis.matched_keywords,
          missing_keywords: analysis.missing_keywords,
          suggestions: analysis.suggestions,
          created_at: analysis.created_at,
        });

      if (dbError) {
        console.warn('Supabase insert warning:', dbError.message);
      }
    } catch (dbErr) {
      console.warn('Supabase not configured, saving without database');
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
