from django.db import models

class ResumeAnalysis(models.Model):
    filename = models.CharField(max_length=255)
    ats_score = models.IntegerField()
    skills = models.JSONField()
    suggestions = models.JSONField()
    improvements = models.JSONField()
    roadmap = models.JSONField()
    feedback = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.filename} - {self.ats_score}"
