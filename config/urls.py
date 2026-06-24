"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from resume_analyzer_app import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('resume_analyzer_app.urls')),
]
