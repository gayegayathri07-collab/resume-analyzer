import os
from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import render

# Home view to render the upload page
def home(request):
    return render(request, 'home.html')

def index(request):
    # Serve the index.html file directly from the static folder
    index_path = os.path.join(settings.BASE_DIR, 'app', 'static', 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        return HttpResponse(f.read())

def upload_resume(request):
    return HttpResponse("Upload placeholder", status=200)

def analyze_resume_api(request):
    return HttpResponse("API Endpoint Placeholder", status=200)

def export_pdf(request):
    return HttpResponse("PDF export temporarily disabled", status=501)
