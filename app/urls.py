from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('analyze/', views.upload_resume, name='analyze_resume'),
    path('upload/', views.upload_resume, name='upload_resume'),
    path('export-pdf/', views.export_pdf, name='export_pdf'),
    path('api/analyze/', views.analyze_resume_api, name='analyze_resume_api'),
]
