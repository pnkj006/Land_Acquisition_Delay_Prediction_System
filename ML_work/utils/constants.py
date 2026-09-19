# ============================================================
# TARGET / CLASS CONSTANTS
# ============================================================

TARGET_COLUMN = "delay_status"

ON_TIME = 0
DELAYED = 1


# ============================================================
# CLASS LABELS
# ============================================================

CLASS_LABELS = {
    ON_TIME: "On Time",
    DELAYED: "Delayed"
}


# ============================================================
# MODEL SETTINGS
# ============================================================

RANDOM_STATE = 42


# ============================================================
# RISK LEVELS
# ============================================================

LOW_RISK = "LOW"
MEDIUM_RISK = "MEDIUM"
HIGH_RISK = "HIGH"


# ============================================================
# RISK SCORE THRESHOLDS
# ============================================================

# These are application-level thresholds.
# They are separate from the ML classification threshold.

LOW_RISK_MAX = 40
MEDIUM_RISK_MAX = 70