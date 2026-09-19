import os
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score

from model.preprocessing import (
    fit_preprocessors,
    transform_data,
    save_preprocessors
)

from utils.feature_schema import (
    DROP_FEATURES,
    TARGET,
    RAW_INPUT_COLUMNS,
    NUMERICAL_FEATURES
)

from utils.constants import (
    RANDOM_STATE
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "land_acquisition_india_200k_minimal",
    "land_acquisition_india_200k.csv"
)

PICKLE_DIR = os.path.join(
    BASE_DIR,
    "model",
    "pickles"
)

os.makedirs(PICKLE_DIR, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("Loading dataset...")

df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)


# ============================================================
# TARGET ENCODING
# ============================================================

df[TARGET] = df[TARGET].map({
    "On Time": 0,
    "Delayed": 1
})


if df[TARGET].isna().any():
    raise ValueError(
        "Unknown values found in delay_status."
    )


# ============================================================
# CREATE X AND y
# ============================================================

X = df.drop(
    columns=[TARGET] + DROP_FEATURES
)

y = df[TARGET]


print("X shape:", X.shape)
print("y shape:", y.shape)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train_full, X_test, y_train_full, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=RANDOM_STATE,
    stratify=y
)


# ============================================================
# TRAIN / VALIDATION SPLIT
# ============================================================

X_train, X_val, y_train, y_val = train_test_split(
    X_train_full,
    y_train_full,
    test_size=0.20,
    random_state=RANDOM_STATE,
    stratify=y_train_full
)


print("\nSplit sizes:")
print("Train:", X_train.shape)
print("Validation:", X_val.shape)
print("Test:", X_test.shape)


# ============================================================
# FIT PREPROCESSORS ON TRAINING DATA ONLY
# ============================================================

print("\nFitting preprocessors...")

(
    imputer,
    categorical_imputer,
    encoder
) = fit_preprocessors(X_train)


# ============================================================
# CREATE FINAL FEATURE COLUMNS
# ============================================================

categorical_feature_names = (
    encoder.get_feature_names_out()
)

feature_columns = (
    list(
        X_train.columns[
            X_train.columns.isin(
                [
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
            )
        ]
    )
    +
    list(categorical_feature_names)
)



feature_columns = (
    NUMERICAL_FEATURES +
    list(categorical_feature_names)
)


# ============================================================
# TRANSFORM DATA
# ============================================================

X_train_final = transform_data(
    X_train,
    imputer,
    categorical_imputer,
    encoder
)

X_val_final = transform_data(
    X_val,
    imputer,
    categorical_imputer,
    encoder
)

X_test_final = transform_data(
    X_test,
    imputer,
    categorical_imputer,
    encoder
)


print(
    "\nFinal feature count:",
    X_train_final.shape[1]
)


# ============================================================
# RANDOM FOREST
# ============================================================

print("\nTraining Random Forest...")

rf_model = RandomForestClassifier(
    n_estimators=300,
    class_weight="balanced",
    random_state=RANDOM_STATE,
    n_jobs=-1
)

rf_model.fit(
    X_train_final,
    y_train
)


# ============================================================
# VALIDATION PROBABILITIES
# ============================================================

val_prob = rf_model.predict_proba(
    X_val_final
)[:, 1]


# ============================================================
# THRESHOLD SEARCH
# ============================================================

thresholds = np.arange(
    0.10,
    0.91,
    0.05
)

best_threshold = 0.50
best_f1 = -1

print("\nThreshold search:")

for threshold in thresholds:

    val_pred = (
        val_prob >= threshold
    ).astype(int)

    f1 = f1_score(
        y_val,
        val_pred,
        zero_division=0
    )

    print(
        f"Threshold={threshold:.2f} "
        f"F1={f1:.4f}"
    )

    if f1 > best_f1:

        best_f1 = f1
        best_threshold = float(threshold)


print(
    "\nSelected threshold:",
    best_threshold
)

print(
    "Validation F1:",
    best_f1
)


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(
    rf_model,
    os.path.join(
        PICKLE_DIR,
        "model.pkl"
    )
)


# ============================================================
# SAVE THRESHOLD
# ============================================================

joblib.dump(
    best_threshold,
    os.path.join(
        PICKLE_DIR,
        "threshold.pkl"
    )
)


# ============================================================
# SAVE PREPROCESSING ARTIFACTS
# ============================================================

save_preprocessors(
    imputer,
    categorical_imputer,
    encoder,
    feature_columns,
    RAW_INPUT_COLUMNS
)


# ============================================================
# SAVE MODEL METADATA
# ============================================================

model_metadata = {

    "model_type": "Random Forest",

    "target": TARGET,

    "classes": {
        0: "On Time",
        1: "Delayed"
    },

    "threshold": best_threshold,

    "feature_count": len(feature_columns),

    "feature_columns": feature_columns,

    "numerical_features": NUMERICAL_FEATURES,

    "categorical_features": list(
        encoder.get_feature_names_out()
    ),

    "random_state": RANDOM_STATE
}


joblib.dump(
    model_metadata,
    os.path.join(
        PICKLE_DIR,
        "model_metadata.pkl"
    )
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 50)
print("TRAINING COMPLETE")
print("=" * 50)

print(
    "Model:",
    type(rf_model).__name__
)

print(
    "Features:",
    len(feature_columns)
)

print(
    "Threshold:",
    best_threshold
)

print(
    "Model saved:",
    os.path.join(
        PICKLE_DIR,
        "model.pkl"
    )
)