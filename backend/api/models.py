import uuid
from django.db import models


class Analysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_email = models.EmailField(default='anonymous@example.com')
    resume_name = models.CharField(max_length=255, default='resume.pdf')
    ats_score = models.IntegerField()
    job_description = models.TextField()
    matched_keywords = models.JSONField(default=list, blank=True)
    missing_keywords = models.JSONField(default=list, blank=True)
    suggestions = models.JSONField(default=list, blank=True)
    breakdown = models.JSONField(default=dict, blank=True)
    roadmap = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analyses'
        ordering = ['-created_at']
