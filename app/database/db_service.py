import json
from app.database.models import SessionLocal, AnalysisRecord, init_db
from app.models.schemas import ResumeAnalysis, SemanticMatchResult

init_db()


def save_analysis(
    analysis: ResumeAnalysis,
    job_description: str | None = None,
    match_result: SemanticMatchResult | None = None,
) -> int:
    session = SessionLocal()
    try:
        record = AnalysisRecord(
            filename=analysis.filename,
            skills_json=json.dumps([s.model_dump() for s in analysis.skills]),
            experience_json=json.dumps([e.model_dump() for e in analysis.experience]),
            education_json=json.dumps([e.model_dump() for e in analysis.education]),
            ats_score=analysis.ats_score.score,
            ats_breakdown_json=json.dumps(analysis.ats_score.breakdown),
            ats_suggestions_json=json.dumps(analysis.ats_score.suggestions),
            suggestions_json=json.dumps(analysis.suggestions),
            job_description=job_description,
        )
        if match_result:
            record.match_score = match_result.score
            record.match_breakdown_json = json.dumps(match_result.breakdown.model_dump())
            record.match_suggestions_json = json.dumps(match_result.suggestions)

        session.add(record)
        session.commit()
        return record.id
    finally:
        session.close()


def get_history(limit: int = 20, offset: int = 0) -> list[dict]:
    session = SessionLocal()
    try:
        records = (
            session.query(AnalysisRecord)
            .order_by(AnalysisRecord.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return [r.to_analysis_dict() for r in records]
    finally:
        session.close()


def get_analysis_by_id(analysis_id: int) -> dict | None:
    session = SessionLocal()
    try:
        record = session.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
        return record.to_analysis_dict() if record else None
    finally:
        session.close()


def get_comparison(ids: list[int]) -> list[dict]:
    session = SessionLocal()
    try:
        records = session.query(AnalysisRecord).filter(AnalysisRecord.id.in_(ids)).all()
        return [r.to_analysis_dict() for r in records]
    finally:
        session.close()
