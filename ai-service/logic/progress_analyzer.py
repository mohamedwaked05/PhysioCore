from typing import Optional

# Thresholds for recovery matrix
ADHERENCE_GOOD = 70
ADHERENCE_POOR = 40
PAIN_CHANGE_THRESHOLD = 0.75  # Meaningful pain change in either direction


def analyze_progress(
    pain_logs: list,       # [{date, pain_level}] ordered oldest→newest
    exercise_logs: list,   # [{date, completed_count, assigned_count}]
) -> dict:

    # ── Adherence ──────────────────────────────────────────────
    total_assigned = sum(log.get("assigned_count", 0) for log in exercise_logs)
    total_completed = sum(log.get("completed_count", 0) for log in exercise_logs)
    adherence_score = (
        round((total_completed / total_assigned) * 100)
        if total_assigned > 0
        else 0
    )
    adherence_score = min(100, max(0, adherence_score))

    # ── Pain Trend ─────────────────────────────────────────────
    valid = [p for p in pain_logs if p.get("pain_level") and p["pain_level"] > 0]

    if len(valid) >= 4:
        mid = len(valid) // 2
        early_avg = sum(p["pain_level"] for p in valid[:mid]) / mid
        recent_avg = sum(p["pain_level"] for p in valid[mid:]) / (len(valid) - mid)
        delta = recent_avg - early_avg
        if delta <= -PAIN_CHANGE_THRESHOLD:
            pain_trend = "improving"
        elif delta >= PAIN_CHANGE_THRESHOLD:
            pain_trend = "worsening"
        else:
            pain_trend = "stable"

    elif len(valid) >= 2:
        delta = valid[-1]["pain_level"] - valid[0]["pain_level"]
        if delta <= -1:
            pain_trend = "improving"
        elif delta >= 1:
            pain_trend = "worsening"
        else:
            pain_trend = "stable"

    else:
        pain_trend = "stable"

    # ── Recovery Status ────────────────────────────────────────
    if adherence_score >= ADHERENCE_GOOD and pain_trend in ("improving", "stable"):
        recovery_status = "good"
    elif adherence_score < ADHERENCE_POOR or pain_trend == "worsening":
        recovery_status = "poor"
    else:
        recovery_status = "moderate"

    return {
        "adherence_score": adherence_score,
        "pain_trend": pain_trend,
        "recovery_status": recovery_status,
    }
