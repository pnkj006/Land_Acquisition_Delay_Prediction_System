from fastapi.testclient import TestClient
import os

# Set dummy token before importing app
os.environ["X_INTERNAL_TOKEN"] = "dummy_token"

from app import app

client = TestClient(app)

def test_missing_token_returns_403():
    response = client.post("/predict", json={})
    assert response.status_code == 403 # Missing token should be rejected as 403

def test_wrong_token_returns_403():
    response = client.post(
        "/predict",
        json={},
        headers={"x-internal-token": "wrong_token"}
    )
    assert response.status_code == 403

def test_correct_token_passes_auth():
    response = client.post(
        "/predict",
        json={"land_area_hectares": 10},
        headers={"x-internal-token": "dummy_token"}
    )
    # Could be 200 or 500 depending on model loading, but not 403
    assert response.status_code != 403
