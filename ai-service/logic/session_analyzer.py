from typing import Optional

PAIN_WARNING_THRESHOLD = 8
PAIN_CRITICAL_THRESHOLD = 9
SHARP_INCREASE_DELTA = 3.0  # Pain jumped 3+ points above recent average


def analyze_session(
    pain_level: int,
    effort_level: int,
    completed_exercises: int,
    previous_pain_levels: list,
) -> dict:
    safety_flag = False
    flag_reason: Optional[str] = None
    severity: Optional[str] = None  # "warning" | "critical"

    if pain_level >= PAIN_CRITICAL_THRESHOLD:
        safety_flag = True
        severity = "critical"
        flag_reason = f"CRITICAL: Patient reported very high pain ({pain_level}/10)"

    elif pain_level >= PAIN_WARNING_THRESHOLD:
        safety_flag = True
        severity = "warning"
        flag_reason = f"High pain level reported: {pain_level}/10"

    elif len(previous_pain_levels) >= 2:
        sample = previous_pain_levels[-3:]  # Last 3 sessions
        recent_avg = sum(sample) / len(sample)
        increase = pain_level - recent_avg
        if increase >= SHARP_INCREASE_DELTA:
            safety_flag = True
            severity = "warning"
            flag_reason = (
                f"Sharp pain increase detected: {pain_level}/10 "
                f"(+{increase:.1f} above recent avg {recent_avg:.1f})"
            )

    return {
        "safety_flag": safety_flag,
        "flag_reason": flag_reason,
        "severity": severity,
    }
