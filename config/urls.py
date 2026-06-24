from django.urls import path, include

urlpatterns = [
    path('', include('resume_analyzer_app.urls')),
]
