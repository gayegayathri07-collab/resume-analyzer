import sys
sys.path.insert(0, ".")

from app.models.schemas import (
    Skill,
    Experience,
    Education,
    ATSScore,
    MatchBreakdown,
    SemanticMatchResult,
    ResumeAnalysis,
    AnalysisResponse,
    MatchResponse,
)


def test_skill():
    s = Skill(name="Python", category="Technical", proficiency="Advanced")
    assert s.name == "Python"


def test_skill_defaults():
    s = Skill(name="Python", category="Technical")
    assert s.proficiency is None


def test_experience():
    e = Experience(company="Acme", role="Dev", duration="2020-2023", description=["Built stuff"])
    assert e.company == "Acme"
    assert e.description == ["Built stuff"]


def test_education():
    e = Education(institution="MIT", degree="BS", field="CS", year="2020")
    assert e.institution == "MIT"


def test_ats_score():
    a = ATSScore(score=85, breakdown={"a": 80}, suggestions=["Improve"])
    assert a.score == 85


def test_match_breakdown():
    b = MatchBreakdown(overall_similarity=70, keyword_overlap=60, section_alignment=80)
    assert b.overall_similarity == 70


def test_semantic_match_result():
    b = MatchBreakdown(overall_similarity=70, keyword_overlap=60, section_alignment=80)
    r = SemanticMatchResult(score=70, breakdown=b, suggestions=["Good"])
    assert r.score == 70


def test_resume_analysis():
    s = Skill(name="Python", category="Technical")
    e = Experience(company="Acme", role="Dev", duration="2020-2023", description=["Worked"])
    edu = Education(institution="MIT", degree="BS", field="CS")
    a = ATSScore(score=80, breakdown={"k": 80}, suggestions=["Fix"])
    r = ResumeAnalysis(filename="resume.pdf", skills=[s], experience=[e], education=[edu], ats_score=a, suggestions=["Good"])
    assert r.filename == "resume.pdf"
    assert len(r.skills) == 1


def test_analysis_response():
    s = Skill(name="Python", category="Technical")
    e = Experience(company="Acme", role="Dev", duration="2020-2023", description=["Worked"])
    edu = Education(institution="MIT", degree="BS", field="CS")
    a = ATSScore(score=80, breakdown={"k": 80}, suggestions=["Fix"])
    r = ResumeAnalysis(filename="r.pdf", skills=[s], experience=[e], education=[edu], ats_score=a, suggestions=["G"])
    resp = AnalysisResponse(success=True, data=r)
    assert resp.success is True


def test_match_response():
    b = MatchBreakdown(overall_similarity=70, keyword_overlap=60, section_alignment=80)
    r = SemanticMatchResult(score=70, breakdown=b, suggestions=["Good"])
    resp = MatchResponse(success=True, data=r)
    assert resp.success is True
