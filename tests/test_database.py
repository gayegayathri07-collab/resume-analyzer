import sys
sys.path.insert(0, ".")

import json
import pytest
from app.database.models import AnalysisRecord, Base, engine, SessionLocal
from app.database.db_service import save_analysis, get_history, get_analysis_by_id, get_comparison
from app.models.schemas import ResumeAnalysis, ATSScore, Skill, Experience, Education, SemanticMatchResult, MatchBreakdown


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        session.query(AnalysisRecord).delete()
        session.commit()
    finally:
        session.close()


def _make_analysis(filename="test.pdf") -> ResumeAnalysis:
    return ResumeAnalysis(
        filename=filename,
        skills=[Skill(name="Python", category="Technical", proficiency="Advanced")],
        experience=[Experience(company="Acme", role="Dev", duration="2020-2023", description=["Built things"])],
        education=[Education(institution="MIT", degree="BS", field="CS", year="2020")],
        ats_score=ATSScore(score=85, breakdown={"formatting": 80, "keywords": 90}, suggestions=["Good"]),
        suggestions=["Overall good"],
    )


def test_save_and_retrieve():
    a = _make_analysis()
    aid = save_analysis(a)
    assert aid > 0
    record = get_analysis_by_id(aid)
    assert record is not None
    assert record["filename"] == "test.pdf"
    assert record["ats_score"]["score"] == 85
    assert len(record["skills"]) == 1


def test_save_with_match():
    a = _make_analysis()
    match = SemanticMatchResult(
        score=72,
        breakdown=MatchBreakdown(overall_similarity=70, keyword_overlap=75, section_alignment=65),
        suggestions=["Add keywords"],
    )
    aid = save_analysis(a, job_description="Looking for Python dev", match_result=match)
    record = get_analysis_by_id(aid)
    assert record["match_score"] == 72
    assert record["job_description"] == "Looking for Python dev"
    assert record["match_breakdown"]["overall_similarity"] == 70


def test_history_empty():
    assert get_history() == []


def test_history_ordering():
    for i in range(3):
        save_analysis(_make_analysis(f"file{i}.pdf"))
    history = get_history(limit=10)
    assert len(history) == 3
    assert history[0]["filename"] == "file2.pdf"


def test_history_limit():
    for i in range(5):
        save_analysis(_make_analysis(f"f{i}.pdf"))
    assert len(get_history(limit=2)) == 2


def test_get_nonexistent():
    assert get_analysis_by_id(9999) is None


def test_comparison():
    ids = []
    for i in range(3):
        ids.append(save_analysis(_make_analysis(f"c{i}.pdf")))
    results = get_comparison(ids)
    assert len(results) == 3
    names = [r["filename"] for r in results]
    assert "c0.pdf" in names


def test_comparison_partial():
    ids = [save_analysis(_make_analysis("a.pdf")), 9999]
    results = get_comparison(ids)
    assert len(results) == 1
