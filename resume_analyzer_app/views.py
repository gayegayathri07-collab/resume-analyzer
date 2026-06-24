from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from .ai_service import get_ai_analysis
import json
from reportlab.pdfgen import canvas
import io
from pypdf import PdfReader

# Home view to render the upload page
def home(request):
    return render(request, 'home.html')

# Resume upload and analysis view (Database removed for Vercel)
def upload_resume(request):
    analysis = None
    error_msg = None
    if request.method == 'POST' and 'resume' in request.FILES:
        try:
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
                error_msg = "AI response parsing failed"
        except Exception as e:
            error_msg = str(e)
            
    return render(request, 'home.html', {'analysis': analysis, 'error': error_msg})

# API Endpoint Placeholder
def analyze_resume_api(request):
    return HttpResponse("API Endpoint Placeholder", status=200)

# PDF Export view
def export_pdf(request):
    # This might fail in Vercel if session is not configured, 
    # but for now keeping it as requested.
    analysis = request.session.get('last_analysis')
    if not analysis:
        return HttpResponse("No analysis found", status=404)
        
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    p.drawString(100, 800, "Resume Analysis Report")
    score = analysis.get('ats_score', 'N/A')
    p.drawString(100, 780, f"ATS Score: {score}")
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return HttpResponse(buffer, content_type='application/pdf')
