from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

from model.predict import predict_project
from explainability.shap_explainer import explain_project


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Land Acquisition Delay Prediction API",
    description="ML API for predicting land acquisition delays",
    version="1.0.0"
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class ProjectInput(BaseModel):

    land_area_hectares: Optional[float] = None
    number_of_affected_families: Optional[float] = None
    approval_timeline_days: Optional[float] = None
    legal_disputes_count: Optional[float] = None
    rehabilitation_progress_pct: Optional[float] = None
    historical_performance_score: Optional[float] = None
    altitude_m: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    project_type: Optional[str] = None
    compensation_status: Optional[str] = None
    possession_status: Optional[str] = None
    stakeholder_responsiveness: Optional[str] = None


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Land Acquisition Delay Prediction API",
        "status": "running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# ============================================================
# PREDICTION + SHAP
# ============================================================

@app.post("/predict")
def predict(project: ProjectInput):

    try:

        # ----------------------------------------------------
        # Convert request to dictionary
        # ----------------------------------------------------

        project_data = project.model_dump()

        # ----------------------------------------------------
        # ML Prediction
        # ----------------------------------------------------

        prediction_result = predict_project(
            project_data
        )

        # ----------------------------------------------------
        # SHAP Explanation
        # ----------------------------------------------------

        risk_factors = explain_project(
            project_data,
            top_n=5
        )

        # ----------------------------------------------------
        # Convert DataFrame to JSON
        # ----------------------------------------------------

        risk_factors = risk_factors.to_dict(
            orient="records"
        )

        # ----------------------------------------------------
        # Final Response
        # ----------------------------------------------------

        return {
            **prediction_result,
            "risk_factors": risk_factors
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )