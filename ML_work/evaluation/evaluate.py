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



from sklearn.model_selection import train_test_split

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report
)

from model.preprocessing import (
    transform_data,
    load_preprocessors
)

from utils.feature_schema import (
    DROP_FEATURES,
    TARGET
)

from utils.constants import (
    RANDOM_STATE
)


# ============================================================
# PATHS
# ============================================================

# BASE_DIR = os.path.dirname(
#     os.path.dirname(
#         os.path.abspath(__file__)
#     )
# )

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
# LOAD DATA
# ============================================================

df = pd.read_csv(
    DATA_PATH
)

df[TARGET] = df[TARGET].map({
    "On Time": 0,
    "Delayed": 1
})


X = df.drop(
    columns=[TARGET] + DROP_FEATURES
)

y = df[TARGET]


# ============================================================
# RECREATE TEST SPLIT
# ============================================================

X_train_full, X_test, y_train_full, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=RANDOM_STATE,
    stratify=y
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
# TRANSFORM TEST DATA
# ============================================================

X_test_final = transform_data(
    X_test,
    imputer,
    categorical_imputer,
    encoder
)


# ============================================================
# PREDICTION
# ============================================================

y_prob = model.predict_proba(
    X_test_final
)[:, 1]

y_pred = (
    y_prob >= threshold
).astype(int)


# ============================================================
# METRICS
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

roc_auc = roc_auc_score(
    y_test,
    y_prob
)

pr_auc = average_precision_score(
    y_test,
    y_prob
)


# ============================================================
# OUTPUT
# ============================================================

print("=" * 60)
print("RANDOM FOREST EVALUATION")
print("=" * 60)

print(
    f"Threshold : {threshold:.2f}"
)

print(
    f"Accuracy  : {accuracy:.6f}"
)

print(
    f"Precision : {precision:.6f}"
)

print(
    f"Recall    : {recall:.6f}"
)

print(
    f"F1 Score  : {f1:.6f}"
)

print(
    f"ROC-AUC   : {roc_auc:.6f}"
)

print(
    f"PR-AUC    : {pr_auc:.6f}"
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        y_pred
    )
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        labels=[0, 1],
        target_names=[
            "On Time",
            "Delayed"
        ],
        zero_division=0
    )
)
