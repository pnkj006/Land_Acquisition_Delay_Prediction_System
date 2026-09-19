import os
import joblib
import numpy as np
import pandas as pd

from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder

from utils.feature_schema import (
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES
)


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

os.makedirs(PICKLE_DIR, exist_ok=True)


# ============================================================
# FIT PREPROCESSORS
# ============================================================

def fit_preprocessors(X_train):

    # Numerical imputer
    imputer = SimpleImputer(
        strategy="median"
    )

    imputer.fit(
        X_train[NUMERICAL_FEATURES]
    )

    # Categorical imputer
    categorical_imputer = SimpleImputer(
        strategy="most_frequent"
    )

    categorical_imputer.fit(
        X_train[CATEGORICAL_FEATURES]
    )

    # One-hot encoder
    encoder = OneHotEncoder(
        handle_unknown="ignore",
        sparse_output=False
    )

    categorical_train = categorical_imputer.transform(
        X_train[CATEGORICAL_FEATURES]
    )

    categorical_train = pd.DataFrame(
        categorical_train,
        columns=CATEGORICAL_FEATURES
    )

    encoder.fit(
        categorical_train
    )

    return (
        imputer,
        categorical_imputer,
        encoder
    )


# ============================================================
# TRANSFORM DATA
# ============================================================

def transform_data(
    X,
    imputer,
    categorical_imputer,
    encoder
):

    numerical_data = imputer.transform(
        X[NUMERICAL_FEATURES]
    )

    categorical_data = categorical_imputer.transform(
        X[CATEGORICAL_FEATURES]
    )

    categorical_data = pd.DataFrame(
        categorical_data,
        columns=CATEGORICAL_FEATURES
    )

    categorical_encoded = encoder.transform(
        categorical_data
    )

    X_final = np.hstack([
        numerical_data,
        categorical_encoded
    ])

    return X_final


# ============================================================
# SAVE PREPROCESSING ARTIFACTS
# ============================================================

def save_preprocessors(
    imputer,
    categorical_imputer,
    encoder,
    feature_columns,
    raw_input_columns
):

    joblib.dump(
        imputer,
        os.path.join(
            PICKLE_DIR,
            "imputer.pkl"
        )
    )

    joblib.dump(
        categorical_imputer,
        os.path.join(
            PICKLE_DIR,
            "categorical_imputer.pkl"
        )
    )

    joblib.dump(
        encoder,
        os.path.join(
            PICKLE_DIR,
            "encoder.pkl"
        )
    )

    joblib.dump(
        feature_columns,
        os.path.join(
            PICKLE_DIR,
            "featurecolumn.pkl"
        )
    )

    joblib.dump(
        raw_input_columns,
        os.path.join(
            PICKLE_DIR,
            "raw_input_columns.pkl"
        )
    )


# ============================================================
# LOAD PREPROCESSING ARTIFACTS
# ============================================================

def load_preprocessors():

    imputer = joblib.load(
        os.path.join(
            PICKLE_DIR,
            "imputer.pkl"
        )
    )

    categorical_imputer = joblib.load(
        os.path.join(
            PICKLE_DIR,
            "categorical_imputer.pkl"
        )
    )

    encoder = joblib.load(
        os.path.join(
            PICKLE_DIR,
            "encoder.pkl"
        )
    )

    feature_columns = joblib.load(
        os.path.join(
            PICKLE_DIR,
            "featurecolumn.pkl"
        )
    )

    raw_input_columns = joblib.load(
        os.path.join(
            PICKLE_DIR,
            "raw_input_columns.pkl"
        )
    )

    return (
        imputer,
        categorical_imputer,
        encoder,
        feature_columns,
        raw_input_columns
    )