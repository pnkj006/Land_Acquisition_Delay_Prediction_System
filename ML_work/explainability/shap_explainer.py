import os
import joblib
import numpy as np
import pandas as pd
import shap


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

PICKLE_DIR = os.path.join(
    BASE_DIR,
    "model",
    "pickles"
)


# ============================================================
# LOAD MODEL ARTIFACTS
# ============================================================

model = joblib.load(
    os.path.join(PICKLE_DIR, "model.pkl")
)

imputer = joblib.load(
    os.path.join(PICKLE_DIR, "imputer.pkl")
)

categorical_imputer = joblib.load(
    os.path.join(PICKLE_DIR, "categorical_imputer.pkl")
)

encoder = joblib.load(
    os.path.join(PICKLE_DIR, "encoder.pkl")
)

feature_columns = joblib.load(
    os.path.join(PICKLE_DIR, "featurecolumn.pkl")
)


# ============================================================
# FEATURE DEFINITIONS
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

CATEGORICAL_FEATURES = [
    "project_type",
    "compensation_status",
    "possession_status",
    "stakeholder_responsiveness"
]


# ============================================================
# SHAP EXPLAINER
# ============================================================

explainer = shap.TreeExplainer(model)


# ============================================================
# PREPROCESS INPUT
# ============================================================

def preprocess_input(data):

    if isinstance(data, dict):

        data = pd.DataFrame([data])

    elif not isinstance(data, pd.DataFrame):

        raise TypeError(
            "Input must be a dictionary or pandas DataFrame."
        )

    # --------------------------------------------------------
    # Numerical preprocessing
    # --------------------------------------------------------

    numerical_data = imputer.transform(
        data[NUMERICAL_FEATURES]
    )

    # --------------------------------------------------------
    # Categorical preprocessing
    # --------------------------------------------------------

    categorical_data = categorical_imputer.transform(
        data[CATEGORICAL_FEATURES]
    )

    # Convert back to DataFrame
    # so encoder receives feature names
    categorical_data = pd.DataFrame(
        categorical_data,
        columns=CATEGORICAL_FEATURES
    )

    categorical_encoded = encoder.transform(
        categorical_data
    )

    # --------------------------------------------------------
    # Combine numerical + categorical features
    # --------------------------------------------------------

    final_data = np.hstack([
        numerical_data,
        categorical_encoded
    ])

    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    if final_data.shape[1] != len(feature_columns):

        raise ValueError(
            f"Feature mismatch: processed data has "
            f"{final_data.shape[1]} features, but "
            f"feature_columns has {len(feature_columns)}."
        )

    return final_data


# ============================================================
# EXPLAIN PROJECT
# ============================================================

# ============================================================
# EXPLAIN PROJECT
# ============================================================

def explain_project(data, top_n=5):

    # --------------------------------------------------------
    # Preprocess input
    # --------------------------------------------------------

    X_processed = preprocess_input(data)

    # --------------------------------------------------------
    # Calculate SHAP values
    # --------------------------------------------------------

    shap_values = explainer.shap_values(
        X_processed
    )

    shap_values = np.asarray(shap_values)

    # --------------------------------------------------------
    # Random Forest binary classification
    #
    # We need class 1 = Delayed
    # --------------------------------------------------------

    if shap_values.ndim == 3:

        values = shap_values[0, :, 1]

    elif shap_values.ndim == 2:

        values = shap_values[0]

    elif shap_values.ndim == 1:

        values = shap_values

    else:

        raise ValueError(
            f"Unexpected SHAP output shape: "
            f"{shap_values.shape}"
        )

    # --------------------------------------------------------
    # Verify feature alignment
    # --------------------------------------------------------

    if len(values) != len(feature_columns):

        raise ValueError(
            f"SHAP returned {len(values)} feature values, "
            f"but feature_columns contains "
            f"{len(feature_columns)} features."
        )

    # --------------------------------------------------------
    # Create SHAP DataFrame
    # --------------------------------------------------------

    shap_df = pd.DataFrame({
        "feature": feature_columns,
        "shap_value": values
    })

    # --------------------------------------------------------
    # Map one-hot encoded features back to original columns
    # --------------------------------------------------------

    def get_original_feature(feature):

        for col in CATEGORICAL_FEATURES:

            if feature.startswith(col + "_"):
                return col

        return feature

    shap_df["original_feature"] = shap_df[
        "feature"
    ].apply(get_original_feature)

    # --------------------------------------------------------
    # Combine one-hot encoded SHAP values
    # --------------------------------------------------------

    grouped = (
        shap_df
        .groupby("original_feature")["shap_value"]
        .sum()
        .reset_index()
    )

    # --------------------------------------------------------
    # Keep ONLY features that increase delay risk
    # --------------------------------------------------------

    grouped = grouped[
        grouped["shap_value"] > 0
    ]

    # --------------------------------------------------------
    # Sort by strongest increase in delay risk
    # --------------------------------------------------------

    grouped = grouped.sort_values(
        by="shap_value",
        ascending=False
    )

    # --------------------------------------------------------
    # Select top risk factors
    # --------------------------------------------------------

    grouped = grouped.head(top_n)

    # --------------------------------------------------------
    # Absolute SHAP impact
    # --------------------------------------------------------

    grouped["absolute_impact"] = (
        grouped["shap_value"].abs()
    )

    # --------------------------------------------------------
    # Direction
    # --------------------------------------------------------

    grouped["impact"] = (
        "increases delay risk"
    )

    # --------------------------------------------------------
    # Final output
    # --------------------------------------------------------

    return grouped[
        [
            "original_feature",
            "shap_value",
            "absolute_impact",
            "impact"
        ]
    ].rename(
        columns={
            "original_feature": "feature"
        }
    ).reset_index(drop=True)

    
# Map one-hot encoded features back to original columns
def get_original_feature(feature):
    for col in CATEGORICAL_FEATURES:
        if feature.startswith(col + "_"):
            return col

    return feature


    shap_df["original_feature"] = shap_df["feature"].apply(
        get_original_feature
    )

    # Combine SHAP values of one-hot encoded columns
    grouped = (
        shap_df
        .groupby("original_feature")["shap_value"]
        .sum()
        .reset_index()
    )

    # Keep only factors increasing delay risk
    grouped = grouped[
        grouped["shap_value"] > 0
    ]

    # Sort by strongest contribution
    grouped = grouped.sort_values(
        by="shap_value",
        ascending=False
    )

    # Keep top factors
    grouped = grouped.head(top_n)

    grouped["absolute_impact"] = grouped["shap_value"].abs()

    grouped["impact"] = "increases delay risk"

    return grouped[
        [
            "original_feature",
            "shap_value",
            "absolute_impact",
            "impact"
        ]
    ].rename(
        columns={
            "original_feature": "feature"
        }
    ).reset_index(drop=True)

    # --------------------------------------------------------
    # Keep ONLY features that increase delay risk
    # --------------------------------------------------------

    explanation = explanation[
        explanation["shap_value"] > 0
    ]

    # --------------------------------------------------------
    # Sort by strongest increase in delay risk
    # --------------------------------------------------------

    explanation = explanation.sort_values(
        by="shap_value",
        ascending=False
    )

    # --------------------------------------------------------
    # Select top risk factors
    # --------------------------------------------------------

    explanation = explanation.head(top_n)

    # --------------------------------------------------------
    # Direction is always increasing
    # --------------------------------------------------------

    explanation["impact"] = "increases delay risk"

    return explanation[
        [
            "feature",
            "shap_value",
            "absolute_impact",
            "impact"
        ]
    ].reset_index(drop=True)

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

    result = explain_project(
        sample_project,
        top_n=5
    )

    print("\nTop Risk Factors:")
    print(result)