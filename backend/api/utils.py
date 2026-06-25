import json
import os
import re
from collections import Counter, defaultdict

SKILL_TAXONOMY = [
    {
        'id': 'languages',
        'name': 'Programming Languages',
        'emoji': '💻',
        'keywords': [
            'python', 'java', 'javascript', 'typescript', 'c\\+\\+', 'cpp',
            'c#', 'csharp', 'golang', 'go\b', 'rust', 'swift', 'kotlin',
            'ruby', 'php', 'scala', 'r\b', 'matlab', 'perl', 'bash',
            'shell', 'powershell', 'html', 'css', 'sass', 'less',
        ],
        'approach': 'Learn syntax, core concepts, data structures, and idiomatic patterns',
        'prereq_for': ['react', 'angular', 'vue', 'django', 'spring', 'node', 'express', 'next', 'pytorch'],
    },
    {
        'id': 'frameworks',
        'name': 'Frameworks & Libraries',
        'emoji': '🛠️',
        'keywords': [
            'react', 'react\\.?js', 'angular', 'vue', 'vue\\.?js', 'svelte',
            'django', 'flask', 'fastapi', 'spring', 'spring\\s*boot',
            'node\\.?js', 'express', 'next\\.?js', 'nuxt', 'nuxt\\.?js',
            'pytorch', 'tensorflow', 'keras', 'jquery', 'bootstrap',
            'tailwind', 'laravel', 'asp\\.?net', '\\.net', 'rails',
            'nestjs', 'redux', 'jpa', 'hibernate',
        ],
        'approach': 'Understand architecture patterns, build sample projects, learn conventions',
        'prereq_for': [],
    },
    {
        'id': 'databases',
        'name': 'Databases & Storage',
        'emoji': '🗄️',
        'keywords': [
            'mysql', 'postgresql', 'postgres', 'mongodb', 'redis',
            'elasticsearch', 'cassandra', 'dynamodb', 'firebase',
            'oracle', 'sqlite', 'mariadb', 'sql\\s*server', 'cosmosdb',
            'bigquery', 'redshift', 'snowflake', 'supabase',
        ],
        'approach': 'Learn data modeling, query optimization, indexing, and schema design',
        'prereq_for': [],
    },
    {
        'id': 'cloud_devops',
        'name': 'Cloud & DevOps',
        'emoji': '☁️',
        'keywords': [
            'aws', 'azure', 'gcp', 'google\\s*cloud', 'docker',
            'kubernetes', 'k8s', 'jenkins', 'terraform', 'ansible',
            'pulumi', 'github\\s*actions', 'gitlab\\s*ci', 'circleci',
            'argocd', 'helm', 'istio', 'prometheus', 'grafana',
            'datadog', 'new\\s*relic', 'cloudflare',
        ],
        'approach': 'Practice infrastructure-as-code, CI/CD pipelines, and container orchestration',
        'prereq_for': [],
    },
    {
        'id': 'data_ai',
        'name': 'Data Science & AI',
        'emoji': '🤖',
        'keywords': [
            'machine\\s*learning', 'deep\\s*learning', 'data\\s*science',
            'nlp', 'natural\\s*language', 'computer\\s*vision', 'llm',
            'artificial\\s*intelligence', 'data\\s*analytics', 'tableau',
            'power\\s*bi', 'pandas', 'numpy', 'scikit\\s*learn',
            'jupyter', 'spark', 'pyspark', 'hadoop', 'airflow', 'dbt',
            'mlops', 'gen\\s*ai', 'generative\\s*ai', 'langchain',
        ],
        'approach': 'Study theory, implement algorithms, work with real datasets and models',
        'prereq_for': [],
    },
    {
        'id': 'tools',
        'name': 'Tools & Platforms',
        'emoji': '🔧',
        'keywords': [
            'git', 'jira', 'confluence', 'postman', 'swagger',
            'openapi', 'kafka', 'rabbitmq', 'nginx', 'webpack',
            'babel', 'eslint', 'prettier', 'graphql', 'grpc',
            'selenium', 'cypress', 'jest', 'mocha', 'pytest',
            'junit', 'docker\\s*compose', 'vagrant', 'gradle', 'maven',
        ],
        'approach': 'Practice with real workflows, learn CLI usage and configuration management',
        'prereq_for': [],
    },
    {
        'id': 'concepts',
        'name': 'Core Concepts',
        'emoji': '📐',
        'keywords': [
            'rest', 'restful', 'graphql', 'microservices',
            'design\\s*patterns', 'agile', 'scrum', 'tdd',
            'ci/cd', 'oop', 'solid', 'algorithms', 'data\\s*structures',
            'system\\s*design', 'architecture', 'api\\s*design',
            'testing', 'deployment', 'security', 'authentication',
            'authorization', 'oauth', 'jwt',
        ],
        'approach': 'Study fundamentals, apply through practice projects and system design exercises',
        'prereq_for': [],
    },
]

SKILL_PREREQUISITES = {
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
    'jpa': ['java', 'spring'],
    'hibernate': ['java', 'jpa'],
    'jest': ['javascript'],
    'pytest': ['python'],
    'selenium': ['python', 'java'],
    'cypress': ['javascript'],
}

ACTION_VERBS = [
    'achieved', 'implemented', 'developed', 'managed', 'led', 'created',
    'designed', 'launched', 'optimized', 'delivered', 'drove', 'established',
    'generated', 'improved', 'increased', 'initiated', 'introduced', 'negotiated',
    'performed', 'reduced', 'resolved', 'spearheaded', 'strengthened', 'transformed',
    'built', 'coordinated', 'executed', 'facilitated', 'mentored', 'organized',
    'pioneered', 'produced', 'streamlined', 'trained', 'architected', 'authored',
    'consolidated', 'demonstrated', 'directed', 'engineered', 'forged', 'guided',
    'influenced', 'innovated', 'integrated', 'orchestrated', 'oversaw', 'proposed',
    'rebuilt', 'reorganized', 'restructured', 'revamped', 'revitalized', 'solved',
]

REQUIRED_SECTIONS = [
    'experience', 'work experience', 'employment',
    'education', 'academic',
    'skills', 'technical skills', 'core competencies',
    'projects',
    'certifications', 'certificates',
    'summary', 'professional summary', 'objective', 'profile',
]

STOP_WORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'this',
    'that', 'these', 'those', 'it', 'its', 'my', 'your', 'our', 'their',
    'we', 'you', 'they', 'he', 'she', 'him', 'her', 'all', 'each', 'every',
    'some', 'any', 'no', 'not', 'very', 'just', 'about', 'up', 'if', 'than',
    'into', 'over', 'after', 'before', 'between', 'under', 'above', 'below',
}


def extract_keywords(text):
    words = re.sub(r'[^a-z0-9\s#+.-]', ' ', text.lower()).split()
    freq = Counter()
    for w in words:
        if len(w) > 2 and w not in STOP_WORDS:
            freq[w] += 1
    return [w for w, _ in freq.most_common(100)]


def find_sections(text):
    lower = text.lower()
    return [s for s in REQUIRED_SECTIONS if s in lower]


def count_action_verbs(text):
    lower = text.lower()
    count = 0
    for verb in ACTION_VERBS:
        count += len(re.findall(rf'\b{verb}\b', lower))
    return count


def calculate_ats_score(resume_text, job_description):
    resume_keywords = extract_keywords(resume_text)
    jd_keywords = extract_keywords(job_description)

    matched_keywords = [k for k in jd_keywords if k in resume_keywords]
    missing_keywords = [k for k in jd_keywords if k not in resume_keywords]

    max_keyword_points = 40
    keyword_score = round(len(matched_keywords) / max(len(jd_keywords), 1) * max_keyword_points)

    email_regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    phone_regex = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    linkedin_regex = r'linkedin\.com/in/[a-zA-Z0-9_-]+'

    has_email = bool(re.search(email_regex, resume_text))
    has_phone = bool(re.search(phone_regex, resume_text))
    has_linkedin = bool(re.search(linkedin_regex, resume_text))

    contact_info_score = 0
    if has_email:
        contact_info_score += 4
    if has_phone:
        contact_info_score += 3
    if has_linkedin:
        contact_info_score += 3

    found_sections = find_sections(resume_text)
    section_score = min(round(len(found_sections) / len(REQUIRED_SECTIONS) * 15), 15)

    bullet_points = len(re.findall(r'^[\s]*[-•*]\s', resume_text, re.MULTILINE))
    lines = [l for l in resume_text.split('\n') if l.strip()]
    has_consistent_format = bullet_points > 3 and len(lines) > 15
    formatting_score = 10 if has_consistent_format else 4

    word_count = len(resume_text.split())
    length_score = 0
    if 250 <= word_count <= 800:
        length_score = 10
    elif 200 <= word_count <= 1000:
        length_score = 7
    elif 150 <= word_count <= 1200:
        length_score = 4

    action_verb_count = count_action_verbs(resume_text)
    action_verb_score = min(round(action_verb_count / 10 * 15), 15)

    total_score = min(
        keyword_score + contact_info_score + section_score + formatting_score + length_score + action_verb_score,
        100
    )

    breakdown = {
        'keywords': keyword_score,
        'contactInfo': contact_info_score,
        'sections': section_score,
        'formatting': formatting_score,
        'length': length_score,
        'actionVerbs': action_verb_score,
    }

    suggestions = []
    if len(missing_keywords) > 5:
        suggestions.append(
            f'Add these important keywords to your resume: {", ".join(missing_keywords[:10])}'
        )
    if not has_email:
        suggestions.append('Add your email address to the top of your resume')
    if not has_phone:
        suggestions.append('Include your phone number for recruiters to reach you')
    if not has_linkedin:
        suggestions.append('Add your LinkedIn profile URL')
    if len(found_sections) < 4:
        missing_sections = [s for s in REQUIRED_SECTIONS if s not in found_sections]
        suggestions.append(
            f'Add missing sections: {", ".join(missing_sections[:4])}'
        )
    if not has_consistent_format:
        suggestions.append('Use consistent bullet points and formatting throughout')
    if word_count < 250:
        suggestions.append('Your resume is too short. Aim for 350-600 words')
    elif word_count > 800:
        suggestions.append('Your resume is too long. Consider trimming to under 800 words')
    if action_verb_count < 5:
        suggestions.append(
            'Use more action verbs (e.g., achieved, implemented, developed) to strengthen bullet points'
        )
    if keyword_score < 20:
        suggestions.append('Tailor your resume to match more keywords from the job description')

    return {
        'ats_score': total_score,
        'matched_keywords': matched_keywords,
        'missing_keywords': missing_keywords[:20],
        'breakdown': breakdown,
        'suggestions': suggestions,
    }


def _categorize_skill(skill):
    skill_lower = skill.lower()
    for cat in SKILL_TAXONOMY:
        for kw in cat['keywords']:
            if re.search(r'\b' + kw + r'\b', skill_lower):
                return cat
    return {
        'id': 'other',
        'name': 'Other Skills',
        'emoji': '📌',
        'approach': 'Learn fundamentals through tutorials, documentation, and hands-on practice',
    }


def _get_prereqs(skill):
    return SKILL_PREREQUISITES.get(skill.lower(), [])


def _get_default_roadmap():
    return [
        {
            'month': 'Month 1',
            'title': 'Foundations',
            'items': [
                'Your resume already matches the job description well!',
                'Focus on deepening existing skills and interview preparation',
            ],
        },
        {
            'month': 'Month 2',
            'title': 'Hands-on Practice',
            'items': [
                'Practice with mock interviews and coding challenges',
                'Review system design principles and behavioral questions',
            ],
        },
        {
            'month': 'Month 3',
            'title': 'Apply & Showcase',
            'items': [
                'Apply to target companies and roles that match your profile',
                'Network with professionals in your field on LinkedIn',
            ],
        },
    ]


def _algorithmic_roadmap(missing_keywords):
    unique_skills = list(dict.fromkeys(missing_keywords))[:12]

    enriched = []
    for skill in unique_skills:
        cat = _categorize_skill(skill)
        prereqs = _get_prereqs(skill)
        missing_prereqs = [p for p in prereqs if p.lower() in [s.lower() for s in unique_skills]]
        enriched.append({
            'skill': skill,
            'category': cat,
            'prerequisites': prereqs,
            'missing_prereqs': missing_prereqs,
        })

    def sort_key(item):
        prereq_score = len(item['missing_prereqs'])
        is_prereq_for_others = 0
        skill_lower = item['skill'].lower()
        for other in enriched:
            if skill_lower in [p.lower() for p in other['prerequisites']]:
                is_prereq_for_others = -1
                break
        return (prereq_score, is_prereq_for_others)

    enriched.sort(key=sort_key)

    months = [
        {'month': 'Month 1', 'title': 'Foundations & Core Learning', 'items': []},
        {'month': 'Month 2', 'title': 'Hands-on Project Practice', 'items': []},
        {'month': 'Month 3', 'title': 'Advanced Application & Showcase', 'items': []},
    ]

    n = len(enriched)
    for i, item in enumerate(enriched):
        skill = item['skill']
        cat = item['category']
        emoji = cat['emoji']
        cat_name = cat['name']
        approach = cat['approach']
        has_prereqs = len(item['missing_prereqs']) > 0

        if has_prereqs or i < n // 3:
            prereq_hint = ''
            if has_prereqs:
                prereq_hint = f" (first master: {', '.join(item['missing_prereqs'])})"
            months[0]['items'].append(
                f"[{emoji} {cat_name}] Learn {skill}{prereq_hint}: {approach}"
            )
        elif i < 2 * n // 3:
            months[1]['items'].append(
                f"[{emoji} {cat_name}] Build a project using {skill} – apply concepts in a real scenario"
            )
        else:
            months[2]['items'].append(
                f"[{emoji} {cat_name}] Add {skill} to portfolio – showcase mastery through projects"
            )

    if not months[0]['items']:
        months[0]['items'].append('Review job description and identify key skills to prioritize')
    if not months[1]['items']:
        months[1]['items'].append('Build a comprehensive project incorporating multiple technologies')
    if not months[2]['items']:
        months[2]['items'].append('Optimize resume, practice interviews, and apply to target roles')

    return months


def _generate_ai_roadmap(missing_keywords, resume_text='', job_description=''):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None

    skills_json = json.dumps(missing_keywords[:15])

    prompt = f'''You are a career coach和技术 mentor. Generate a personalized 3-month learning roadmap based on these missing skills.

Missing Skills: {skills_json}

The user's resume lacks these skills compared to their target job description.
Generate a JSON response with this exact structure:
{{
  "roadmap": [
    {{
      "month": "Month 1",
      "title": "Foundations & Core Learning",
      "items": [
        "string – actionable learning item with category and specific focus",
        "..."
      ]
    }},
    {{
      "month": "Month 2",
      "title": "Hands-on Project Practice",
      "items": ["..."]
    }},
    {{
      "month": "Month 3",
      "title": "Advanced Application & Showcase",
      "items": ["..."]
    }}
  ]
}}

Rules:
- Month 1: Focus on fundamentals, prerequisites, and theory
- Month 2: Project-based learning, building real applications
- Month 3: Advanced topics, portfolio work, interview prep
- Each item should start with a category emoji and be specific and actionable
- Generate 3-6 items per month
- Consider skill dependencies (e.g., learn Python before Django)
- Only use the skills listed above; don't introduce new skills'''

    try:
        import requests
        resp = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': 'gpt-4o-mini',
                'messages': [{'role': 'user', 'content': prompt}],
                'response_format': {'type': 'json_object'},
                'temperature': 0.7,
                'max_tokens': 1500,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        content = json.loads(data['choices'][0]['message']['content'])
        roadmap = content.get('roadmap', [])
        if roadmap and len(roadmap) == 3:
            return roadmap
    except Exception as e:
        print(f'AI roadmap generation failed: {e}')

    return None


def generate_roadmap(missing_keywords, resume_text='', job_description=''):
    if not missing_keywords:
        return _get_default_roadmap()

    ai_roadmap = _generate_ai_roadmap(missing_keywords, resume_text, job_description)
    if ai_roadmap:
        return ai_roadmap

    return _algorithmic_roadmap(missing_keywords)


def extract_resume_skills(resume_text):
    found_skills = []
    skill_mentions = defaultdict(int)
    lower_text = resume_text.lower()

    for cat in SKILL_TAXONOMY:
        for kw in cat['keywords']:
            pattern = kw.replace(r'\b', '').replace('\\+', '+').replace('\\.', '.')
            if re.search(r'\b' + kw + r'\b', lower_text):
                skill_mentions[pattern] += 1

    for cat in SKILL_TAXONOMY:
        for kw in cat['keywords']:
            clean = kw.replace(r'\b', '').replace('\\+', '+').replace('\\.', '.')
            if skill_mentions.get(clean, 0) > 0:
                found_skills.append({
                    'skill': clean.title() if clean.isalpha() else clean,
                    'category': cat['name'],
                    'category_id': cat['id'],
                    'emoji': cat['emoji'],
                    'mentions': skill_mentions[clean],
                })

    return found_skills


def assess_skill_depth(resume_text, skill_name):
    lower = resume_text.lower()
    depth = {'level': 'Beginner', 'score': 0, 'evidence': []}

    skill_variations = [
        skill_name.lower(),
        skill_name.lower().replace(' ', ''),
        skill_name.lower().replace('.', ''),
    ]
    base = skill_variations[0]

    patterns = [
        (r'(\d+)\+?\s*years?\s*(?:of)?\s*(?:experience\s+)?(?:with|in|using)?\s*' + re.escape(base), 3),
        (r'(?:proficient|expert|advanced|senior)\s*(?:in|with)?\s*' + re.escape(base), 3),
        (r'certified\s*(?:in)?\s*' + re.escape(base), 3),
        (r'(?:strong|extensive|deep)\s*(?:knowledge|experience|expertise|understanding)\s*(?:of|in)?\s*' + re.escape(base), 2),
        (r'(?:worked|built|developed|created|implemented|designed|led|managed|architected)\s*(?:with|using|in)?\s*' + re.escape(base), 2),
        (r'intermediate\s*(?:in|with)?\s*' + re.escape(base), 1),
        (r'(?:familiar|basic|beginner|learning|exposed)\s*(?:with|to|in)?\s*' + re.escape(base), 0),
    ]

    total_score = 0
    for pattern, score in patterns:
        matches = re.findall(pattern, lower)
        if matches:
            total_score += score * len(matches)
            depth['evidence'].append(matches[0] if isinstance(matches[0], str) else base)

    if total_score >= 6:
        depth['level'] = 'Expert'
        depth['score'] = 3
    elif total_score >= 3:
        depth['level'] = 'Advanced'
        depth['score'] = 2
    elif total_score >= 1:
        depth['level'] = 'Intermediate'
        depth['score'] = 1

    return depth


def generate_skill_improvement_plan(resume_text, missing_keywords):
    skills = extract_resume_skills(resume_text)

    assessed = []
    for s in skills:
        depth = assess_skill_depth(resume_text, s['skill'])
        assessed.append({**s, **depth})

    by_level = {'Beginner': [], 'Intermediate': [], 'Advanced': [], 'Expert': []}
    for s in assessed:
        by_level[s['level']].append(s)

    tips = {
        'Beginner': 'Learn fundamentals through tutorials, build small projects, and practice daily',
        'Intermediate': 'Build real-world projects, study advanced patterns, and contribute to open source',
        'Advanced': 'Mentor others, dive into internals, optimize performance, and write production-grade code',
        'Expert': 'Author content, speak at conferences, design systems, and push the technology forward',
    }

    plan = [
        {
            'month': 'Month 1',
            'title': 'Strengthen Your Core Skills',
            'items': [],
        },
        {
            'month': 'Month 2',
            'title': 'Deepen Expertise & Build Projects',
            'items': [],
        },
        {
            'month': 'Month 3',
            'title': 'Mastery & Portfolio Enhancement',
            'items': [],
        },
    ]

    beginner_skills = by_level['Beginner']
    intermediate_skills = by_level['Intermediate']
    advanced_skills = by_level['Advanced'] + by_level['Expert']

    for s in beginner_skills:
        plan[0]['items'].append(
            f"[{s['emoji']} {s['category']}] Strengthen {s['skill']}: {tips['Beginner']} ({s['mentions']} mention{'s' if s['mentions'] > 1 else ''} in resume)"
        )

    if missing_keywords:
        missing_cats = set()
        for mk in missing_keywords[:5]:
            cat = _categorize_skill(mk)
            missing_cats.add(cat['name'])
        plan[0]['items'].append(
            f"[📌 Other Skills] Bridge skill gaps: focus on {', '.join(missing_cats)} to match job requirements better"
        )

    for s in intermediate_skills:
        plan[1]['items'].append(
            f"[{s['emoji']} {s['category']}] Advance {s['skill']}: {tips['Intermediate']}"
        )

    for s in beginner_skills[:2]:
        plan[1]['items'].append(
            f"[{s['emoji']} {s['category']}] Apply {s['skill']} in a real project – build something tangible to reinforce learning"
        )

    for s in advanced_skills:
        plan[2]['items'].append(
            f"[{s['emoji']} {s['category']}] Master {s['skill']}: {tips['Advanced']}"
        )

    for s in intermediate_skills[:2]:
        plan[2]['items'].append(
            f"[{s['emoji']} {s['category']}] Showcase {s['skill']} – add a portfolio project or case study demonstrating expertise"
        )

    if not plan[0]['items']:
        plan[0]['items'].append('Start building your skill set – focus on one technology at a time')
    if not plan[1]['items']:
        plan[1]['items'].append('Apply your skills by building real projects and contributing to open source')
    if not plan[2]['items']:
        plan[2]['items'].append('Prepare for interviews and showcase your work in a strong portfolio')

    return {
        'resume_skills': assessed,
        'improvement_plan': plan,
    }
