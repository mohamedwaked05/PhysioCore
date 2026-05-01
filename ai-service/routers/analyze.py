import os
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from logic.session_analyzer import analyze_session
from logic.progress_analyzer import analyze_progress


async def verify_api_key(x_api_key: str = Header(default="")):
    expected = os.getenv("AI_API_KEY", "")
    if expected and x_api_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


router = APIRouter(dependencies=[Depends(verify_api_key)])


# ── Request / Response models ──────────────────────────────────

class SessionRequest(BaseModel):
    client_id: int
    clinic_id: int
    pain_level: int = Field(ge=0, le=10)
    effort_level: int = Field(ge=0, le=10)
    completed_exercises: int = Field(ge=0)
    previous_pain_levels: list[float] = []


class SessionResponse(BaseModel):
    safety_flag: bool
    flag_reason: Optional[str]
    severity: Optional[str]  # "warning" | "critical" | null


class PainLog(BaseModel):
    date: str
    pain_level: Optional[float] = None


class ExerciseLog(BaseModel):
    date: str
    completed_count: int = 0
    assigned_count: int = 0


class ProgressRequest(BaseModel):
    client_id: int
    clinic_id: int
    pain_logs: list[PainLog] = []
    exercise_logs: list[ExerciseLog] = []


class ProgressResponse(BaseModel):
    adherence_score: int
    pain_trend: str   # "improving" | "stable" | "worsening"
    recovery_status: str  # "good" | "moderate" | "poor"


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/analyze-session", response_model=SessionResponse)
def analyze_session_endpoint(req: SessionRequest):
    return analyze_session(
        pain_level=req.pain_level,
        effort_level=req.effort_level,
        completed_exercises=req.completed_exercises,
        previous_pain_levels=req.previous_pain_levels,
    )


@router.post("/analyze-progress", response_model=ProgressResponse)
def analyze_progress_endpoint(req: ProgressRequest):
    return analyze_progress(
        pain_logs=[p.model_dump() for p in req.pain_logs],
        exercise_logs=[e.model_dump() for e in req.exercise_logs],
    )
