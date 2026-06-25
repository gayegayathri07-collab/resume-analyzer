import sys
sys.path.insert(0, ".")

from app.services.matcher_service import (
    cosine_similarity,
    _dot,
    _norm,
    _keyword_score,
    _chunk_text,
    _generate_suggestions,
)
from app.models.schemas import MatchBreakdown


def test_dot():
    assert _dot([1, 2, 3], [4, 5, 6]) == 32
    assert _dot([], []) == 0


def test_norm():
    assert _norm([3, 4]) == 5.0
    assert _norm([0, 0]) == 0.0


def test_cosine_similarity_identical():
    a = [1, 2, 3]
    assert abs(cosine_similarity(a, a) - 1.0) < 1e-10


def test_cosine_similarity_orthogonal():
    assert abs(cosine_similarity([1, 0], [0, 1])) < 1e-10


def test_cosine_similarity_zero():
    assert cosine_similarity([0, 0], [1, 0]) == 0.0


def test_cosine_similarity_scaled():
    a = [1, 2, 3]
    b = [2, 4, 6]
    assert abs(cosine_similarity(a, b) - 1.0) < 1e-10


def test_keyword_score_full_match():
    resume = "Python developer with Django experience"
    jd = "Python Django developer"
    score = _keyword_score(resume, jd)
    assert score > 0


def test_keyword_score_no_match():
    resume = "I like cooking and painting"
    jd = "We need a Rust systems engineer"
    assert _keyword_score(resume, jd) == 0.0


def test_keyword_score_empty_jd():
    assert _keyword_score("anything", "") == 100.0


def test_chunk_text_small():
    text = "hello world foo bar"
    chunks = _chunk_text(text, max_chars=100)
    assert chunks == ["hello world foo bar"]


def test_chunk_text_large():
    text = "word " * 500
    chunks = _chunk_text(text, max_chars=100)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c) <= 100


def test_generate_suggestions_low_score():
    bd = MatchBreakdown(overall_similarity=20, keyword_overlap=30, section_alignment=25)
    suggestions = _generate_suggestions(bd)
    assert len(suggestions) >= 2
    assert all("low" in s.lower() or "missing" in s.lower() for s in suggestions)


def test_generate_suggestions_high_score():
    bd = MatchBreakdown(overall_similarity=85, keyword_overlap=80, section_alignment=90)
    suggestions = _generate_suggestions(bd)
    assert suggestions == ["Resume matches the job description well."]
