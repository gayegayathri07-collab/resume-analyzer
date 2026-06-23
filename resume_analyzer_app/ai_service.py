import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env
load_dotenv()

# Setup Google AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_ai_analysis(resume_text, job_description=""):
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    Analyze the following resume and return ONLY a JSON object with these exact keys:
    {
        "ats_score": int,
        "skills": list,
        "suggestions": list,
        "improvements": list,
        "roadmap": list,
        "feedback": str,
        "skills_gap": {"missing": list, "gap_analysis": str},
        "predictive_analytics": {"hiring_probability": str, "market_competitiveness": str},
        "portfolio_generated": str,
        "code_snippet": str
    }
    Resume: {resume_text}
    Job Description: {job_description}
    """
    
    response = model.generate_content(prompt)
    return response.text
