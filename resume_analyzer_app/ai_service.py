import os
import google.generativeai as genai

# Setup Google AI - Graceful handling if key is missing
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def get_ai_analysis(resume_text, job_description=""):
    if not os.environ.get("GEMINI_API_KEY"):
        return '{"error": "GEMINI_API_KEY is not configured in Environment Variables"}'
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    Analyze the following resume and return ONLY a JSON object with these exact keys:
    {{
        "ats_score": int,
        "skills": list,
        "suggestions": list,
        "improvements": list,
        "roadmap": list,
        "feedback": str,
        "skills_gap": {{"missing": list, "gap_analysis": str}},
        "predictive_analytics": {{"hiring_probability": str, "market_competitiveness": str}},
        "portfolio_generated": str,
        "code_snippet": str
    }}
    Resume: {resume_text}
    Job Description: {job_description}
    """
    
    response = model.generate_content(prompt)
    return response.text
