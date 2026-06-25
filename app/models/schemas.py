from pydantic import BaseModel
from typing import Optional


class Skill(BaseModel):
    name: str
    category: str
    proficiency: Optional[str] = None


class Experience(BaseModel):
    company: str
    role: str
    duration: str
    description: list[str]


class Education(BaseModel):
    institution: str
    degree: str
    field: str
    year: Optional[str] = None


class ATSScore(BaseModel):
    score: float
    breakdown: dict[str, float]
    suggestions: list[str]


class MatchBreakdown(BaseModel):
    overall_similarity: float
    keyword_overlap: float
    section_alignment: float


class SemanticMatchResult(BaseModel):
    score: float
    breakdown: MatchBreakdown
    suggestions: list[str]


class ResumeAnalysis(BaseModel):
    filename: str
    skills: list[Skill]
    experience: list[Experience]
    education: list[Education]
    ats_score: ATSScore
    suggestions: list[str]


class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[ResumeAnalysis] = None
    analysis_id: Optional[int] = None
    error: Optional[str] = None


class MatchResponse(BaseModel):
    success: bool
    data: Optional[SemanticMatchResult] = None
    error: Optional[str] = None


class HistoryResponse(BaseModel):
    success: bool
    analyses: list[dict]


class ComparisonResponse(BaseModel):
    success: bool
    analyses: list[dict]


class JobDescriptionRequest(BaseModel):
    job_description: str
