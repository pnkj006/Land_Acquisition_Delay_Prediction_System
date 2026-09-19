from utils.constants import (
    LOW_RISK,
    MEDIUM_RISK,
    HIGH_RISK,
    LOW_RISK_MAX,
    MEDIUM_RISK_MAX
)


def probability_to_risk_score(probability):
    """
    Convert delay probability [0, 1]
    into risk score [0, 100].
    """

    probability = float(probability)

    probability = max(
        0.0,
        min(1.0, probability)
    )

    return probability * 100


def risk_score_to_level(risk_score):
    """
    Convert risk score into LOW / MEDIUM / HIGH.
    """

    risk_score = float(risk_score)

    if risk_score < LOW_RISK_MAX:
        return LOW_RISK

    elif risk_score < MEDIUM_RISK_MAX:
        return MEDIUM_RISK

    else:
        return HIGH_RISK


def probability_to_risk(probability):
    """
    Convert probability directly into
    risk score and risk level.
    """

    risk_score = probability_to_risk_score(
        probability
    )

    risk_level = risk_score_to_level(
        risk_score
    )

    return {
        "probability": float(probability),
        "risk_score": float(risk_score),
        "risk_level": risk_level
    }