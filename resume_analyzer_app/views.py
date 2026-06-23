from django.shortcuts import render
from .ai_service import get_ai_analysis
from pypdf import PdfReader
import json

def upload_resume(request):
    analysis = None
    if request.method == 'POST' and 'resume' in request.FILES:
        resume = request.FILES['resume']
        
        # Real PDF Parsing
        reader = PdfReader(resume)
        resume_text = ""
        for page in reader.pages:
            resume_text += page.extract_text() + "\n"
            
        # Call AI
        ai_response = get_ai_analysis(resume_text)
        
        # Parse JSON from AI
        try:
            analysis = json.loads(ai_response.replace('```json', '').replace('```', ''))
        except:
            analysis = {"error": "AI response parsing failed"}
        
        # Save to session
        request.session['last_analysis'] = analysis
            
    return render(request, 'resume_analyzer_app/upload.html', {'analysis': analysis})

def analyze_resume_api(request):
    return HttpResponse("API Endpoint Placeholder", status=200)

def export_pdf(request):
    # ... (existing export logic) ...
