import os
import sys
import joblib
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from model.preprocessing import (
    transform_data,
    load_preprocessors
)

from utils.risk_mapper import (
    probability_to_risk
)


# ============================================================
# PATHS
# ============================================================

PICKLE_DIR = os.path.join(
    BASE_DIR,
    "model",
    "pickles"
)


# ============================================================
# LOAD MODEL
# ============================================================

model = joblib.load(
    os.path.join(
        PICKLE_DIR,
        "model.pkl"
    )
)

threshold = joblib.load(
    os.path.join(
        PICKLE_DIR,
        "threshold.pkl"
    )
)


# ============================================================
# LOAD PREPROCESSORS
# ============================================================

(
    imputer,
    categorical_imputer,
    encoder,
    feature_columns,
    raw_input_columns
) = load_preprocessors()


# ============================================================
# PREDICT PROJECT
# ============================================================

def predict_project(data):

    # --------------------------------------------------------
    # Convert input to DataFrame
    # --------------------------------------------------------

    if isinstance(data, dict):

        data = pd.DataFrame([data])

    elif not isinstance(data, pd.DataFrame):

        raise TypeError(
            "Input must be a dictionary or pandas DataFrame."
        )


    # --------------------------------------------------------
    # Check required columns
    # --------------------------------------------------------

    missing_columns = [
        column
        for column in raw_input_columns
        if column not in data.columns
    ]

    if missing_columns:

        raise ValueError(
            f"Missing input columns: {missing_columns}"
        )


    # --------------------------------------------------------
    # Preprocess
    # --------------------------------------------------------

    X_processed = transform_data(
        data,
        imputer,
        categorical_imputer,
        encoder
    )


    # --------------------------------------------------------
    # Predict probability
    # --------------------------------------------------------

    probability = model.predict_proba(
        X_processed
    )[0, 1]


    # --------------------------------------------------------
    # Classification
    # --------------------------------------------------------

    prediction = (
        "Delayed"
        if probability >= threshold
        else "On Time"
    )


    # --------------------------------------------------------
    # Risk
    # --------------------------------------------------------

    risk = probability_to_risk(
        probability
    )


    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "prediction": prediction,

        "probability": float(
            probability
        ),

        "risk_score": risk[
            "risk_score"
        ],

        "risk_level": risk[
            "risk_level"
        ],

        "threshold": float(
            threshold
        )
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    sample_project = {

        "land_area_hectares": 120,

        "number_of_affected_families": 85,

        "compensation_status": "Paid in Full",

        "approval_timeline_days": 180,

        "legal_disputes_count": 5,

        "possession_status": "Pending",

        "rehabilitation_progress_pct": 40,

        "stakeholder_responsiveness": "Low",

        "historical_performance_score": 55,

        "altitude_m": 250,

        "latitude": 20.2961,

        "longitude": 85.8245,

        "project_type": "Highway"
    }


    result = predict_project(
        sample_project
    )

    print("\nPrediction:")
    print(result)