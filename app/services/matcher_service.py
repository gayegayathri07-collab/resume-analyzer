import math
from app.config import settings
from app.models.schemas import SemanticMatchResult, MatchBreakdown

_openai_client = None
_gemini_client = None


def _get_openai():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def _get_gemini():
    global _gemini_client
    if _gemini_client is None:
        import google.genai as genai
        _gemini_client = genai.Client(api_key=settings.google_api_key)
    return _gemini_client


def get_embedding(text: str) -> list[float]:
    text = text.replace("\n", " ")
    provider = settings.llm_provider

    if provider == "openai":
        client = _get_openai()
        resp = client.embeddings.create(
            input=[text], model=settings.openai_embedding_model
        )
        return resp.data[0].embedding

    elif provider == "gemini":
        client = _get_gemini()
        resp = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
        )
        return resp.embeddings[0].values

    elif provider == "claude":
        client = _get_openai()
        resp = client.embeddings.create(
            input=[text], model=settings.openai_embedding_model
        )
        return resp.data[0].embedding

    raise ValueError(f"Unsupported provider: {provider}")


def _dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def _norm(v: list[float]) -> float:
    return math.sqrt(sum(x * x for x in v))


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = _dot(a, b)
    na = _norm(a)
    nb = _norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _chunk_text(text: str, max_chars: int = 2000) -> list[str]:
    words = text.split()
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for word in words:
        if current_len + len(word) + 1 > max_chars:
            chunks.append(" ".join(current))
            current = [word]
            current_len = len(word)
        else:
            current.append(word)
            current_len += len(word) + 1
    if current:
        chunks.append(" ".join(current))
    return chunks


def compute_semantic_match(
    resume_text: str, job_description: str
) -> SemanticMatchResult:
    resume_emb = get_embedding(resume_text)
    jd_emb = get_embedding(job_description)
    overall_sim = cosine_similarity(resume_emb, jd_emb)
    overall_score = round(overall_sim * 100, 1)

    resume_chunks = _chunk_text(resume_text)
    jd_chunks = _chunk_text(job_description)

    if resume_chunks and jd_chunks:
        resume_embs = [get_embedding(c) for c in resume_chunks]
        jd_embs = [get_embedding(c) for c in jd_chunks]
        chunk_scores = [
            cosine_similarity(re, je) for re in resume_embs for je in jd_embs
        ]
        avg_chunk = round((sum(chunk_scores) / len(chunk_scores)) * 100, 1) if chunk_scores else 0.0
    else:
        avg_chunk = overall_score

    keyword_overlap = _keyword_score(resume_text, job_description)

    breakdown = MatchBreakdown(
        overall_similarity=overall_score,
        keyword_overlap=keyword_overlap,
        section_alignment=avg_chunk,
    )

    suggestions = _generate_suggestions(breakdown)

    return SemanticMatchResult(
        score=overall_score,
        breakdown=breakdown,
        suggestions=suggestions,
    )


def _keyword_score(resume_text: str, job_description: str) -> float:
    resume_lower = resume_text.lower()
    jd_lower = job_description.lower()

    stop_words = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "shall", "can", "need", "dare", "ought",
        "used", "this", "that", "these", "those", "i", "you", "he", "she",
        "it", "we", "they", "me", "him", "her", "us", "them", "my", "your",
        "his", "her", "its", "our", "their", "not", "no", "nor", "so", "very",
    }

    jd_words = set(
        w for w in jd_lower.split() if w.isalpha() and w not in stop_words
    )
    resume_words = set(
        w for w in resume_lower.split() if w.isalpha() and w not in stop_words
    )

    if not jd_words:
        return 100.0

    overlap = len(jd_words & resume_words)
    return round((overlap / len(jd_words)) * 100, 1)


def _generate_suggestions(breakdown: MatchBreakdown) -> list[str]:
    suggestions: list[str] = []
    if breakdown.overall_similarity < 40:
        suggestions.append(
            "Resume has low semantic alignment with the job description. "
            "Consider rewriting key sections to better match the role's requirements."
        )
    if breakdown.keyword_overlap < 50:
        suggestions.append(
            "Missing important keywords from the job description. "
            "Incorporate relevant terms and phrases used in the JD."
        )
    if breakdown.section_alignment < 50:
        suggestions.append(
            "Section-level alignment is low. Ensure your experience and "
            "skills sections directly address the job's requirements."
        )
    if not suggestions:
        suggestions.append("Resume matches the job description well.")
    return suggestions
