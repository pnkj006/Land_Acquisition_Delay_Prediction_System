# ============================================================
# TARGET
# ============================================================

TARGET = "delay_status"


# ============================================================
# FEATURES DROPPED FROM MODEL
# ============================================================

DROP_FEATURES = [
    "project_id",
    "administrator_id",
    "manager",
    "location",
    "delay_days",
    "risk_score"
]


# ============================================================
# NUMERICAL FEATURES
# ============================================================

NUMERICAL_FEATURES = [
    "land_area_hectares",
    "number_of_affected_families",
    "approval_timeline_days",
    "legal_disputes_count",
    "rehabilitation_progress_pct",
    "historical_performance_score",
    "altitude_m",
    "latitude",
    "longitude"
]


# ============================================================
# CATEGORICAL FEATURES
# ============================================================

CATEGORICAL_FEATURES = [
    "project_type",
    "compensation_status",
    "possession_status",
    "stakeholder_responsiveness"
]


# ============================================================
# RAW MODEL INPUT FEATURES
# ============================================================

RAW_INPUT_COLUMNS = (
    NUMERICAL_FEATURES +
    CATEGORICAL_FEATURES
)