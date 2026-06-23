from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Query
from fastapi.responses import Response
from app.utils.file_utils import save_upload, cleanup_file
from app.services.parser_service import extract_text
from app.services.analyzer_service import analyze_resume, score_against_jd
from app.services.pdf_service import generate_analysis_pdf
from app.services.logger import log
from app.database.db_service import save_analysis, get_history, get_analysis_by_id, get_comparison
from app.models.schemas import (
    AnalysisResponse,
    ResumeAnalysis,
    MatchResponse,
    HistoryResponse,
    ComparisonResponse,
)
from app.config import settings

router = APIRouter(prefix="/api", tags=["resume"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)):
    filepath = None
    try:
        filepath = await save_upload(file, settings.upload_dir)
        log.info("Processing file: %s", file.filename)
        text = extract_text(filepath)
        result = analyze_resume(text, file.filename)
        analysis_id = save_analysis(result)
        log.info("Analysis complete: %s (id=%d, score=%.1f)", file.filename, analysis_id, result.ats_score.score)
        return AnalysisResponse(success=True, data=result, analysis_id=analysis_id)
    except ValueError as e:
        log.warning("Validation error for %s: %s", file.filename, e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log.error("Analysis failed for %s: %s", file.filename, e)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if filepath:
            cleanup_file(filepath)


@router.post("/analyze-with-jd", response_model=AnalysisResponse)
async def analyze_with_jd(
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    filepath = None
    try:
        filepath = await save_upload(file, settings.upload_dir)
        log.info("Analyzing with JD: %s", file.filename)
        text = extract_text(filepath)
        result = analyze_resume(text, file.filename)

        match_result = score_against_jd(text, job_description)
        result.ats_score.score = match_result.score
        result.ats_score.suggestions = match_result.suggestions

        analysis_id = save_analysis(result, job_description=job_description, match_result=match_result)
        log.info("JD analysis complete: %s (id=%d, match=%.1f)", file.filename, analysis_id, match_result.score)
        return AnalysisResponse(success=True, data=result, analysis_id=analysis_id)
    except ValueError as e:
        log.warning("Validation error: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log.error("JD analysis failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if filepath:
            cleanup_file(filepath)


@router.post("/match", response_model=MatchResponse)
async def match_resume_with_jd(
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    filepath = None
    try:
        filepath = await save_upload(file, settings.upload_dir)
        log.info("Matching resume vs JD: %s", file.filename)
        text = extract_text(filepath)
        result = score_against_jd(text, job_description)
        log.info("Match complete: %s (score: %.1f)", file.filename, result.score)
        return MatchResponse(success=True, data=result)
    except ValueError as e:
        log.warning("Validation error: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log.error("Matching failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")
    finally:
        if filepath:
            cleanup_file(filepath)


@router.post("/match-text", response_model=MatchResponse)
async def match_text(
    resume_text: str = Form(...),
    job_description: str = Form(...),
):
    try:
        result = score_against_jd(resume_text, job_description)
        return MatchResponse(success=True, data=result)
    except Exception as e:
        log.error("Text matching failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")


@router.post("/analyze-batch", response_model=dict)
async def analyze_batch(
    files: list[UploadFile] = File(...),
    job_description: str = Form(default=""),
):
    results: list[dict] = []
    errors: list[dict] = []
    for file in files:
        filepath = None
        try:
            filepath = await save_upload(file, settings.upload_dir)
            text = extract_text(filepath)
            result = analyze_resume(text, file.filename)
            match_result = score_against_jd(text, job_description) if job_description else None
            if match_result:
                result.ats_score.score = match_result.score
                result.ats_score.suggestions = match_result.suggestions
            analysis_id = save_analysis(result, job_description=job_description or None, match_result=match_result)
            results.append({"id": analysis_id, "filename": file.filename, "score": result.ats_score.score})
        except Exception as e:
            log.error("Batch item failed: %s - %s", file.filename, e)
            errors.append({"filename": file.filename, "error": str(e)})
        finally:
            if filepath:
                cleanup_file(filepath)
    return {"success": True, "results": results, "errors": errors}


@router.get("/history", response_model=HistoryResponse)
async def history(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    items = get_history(limit=limit, offset=offset)
    return HistoryResponse(success=True, analyses=items)


@router.get("/analyses/{analysis_id}", response_model=dict)
async def get_analysis(analysis_id: int):
    item = get_analysis_by_id(analysis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"success": True, "data": item}


@router.post("/compare", response_model=ComparisonResponse)
async def compare(ids: list[int] = Query(...)):
    if len(ids) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 analysis IDs to compare")
    if len(ids) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 analyses to compare")
    items = get_comparison(ids)
    if len(items) < 2:
        raise HTTPException(status_code=404, detail=f"Only found {len(items)} of {len(ids)} analyses")
    return ComparisonResponse(success=True, analyses=items)


@router.post("/export-pdf")
async def export_pdf(request: Request):
    try:
        body = await request.json()
        data = body.get("data")
        if not data:
            raise HTTPException(status_code=400, detail="No analysis data provided")
        analysis = ResumeAnalysis(**data)
        buf = generate_analysis_pdf(analysis)
        log.info("PDF exported for: %s", analysis.filename)
        return Response(
            content=buf.read(),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume-analysis.pdf"},
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error("PDF generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.get("/health")
async def health():
    return {"status": "ok"}
