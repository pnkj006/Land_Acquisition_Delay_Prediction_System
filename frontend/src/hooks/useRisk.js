import { useCallback, useEffect, useState } from 'react'
import { getRiskPrediction } from '../api/risk.api'
import { RISK_LEVELS } from '../utils/constants'
export function useRisk(projectId) {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPrediction = useCallback(async () => {
    if (!projectId) {
      setPrediction(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setPrediction(null)

    try {
      console.log('Fetching risk prediction for:', projectId)

      const data = await getRiskPrediction(projectId)

      console.log('Risk prediction data:', data)

      if (!data) {
        throw new Error('Risk API returned no prediction data')
      }

  const riskScore = Number(
  Number(data.riskScore ?? 0).toFixed(2)
)

const probabilityPercent = Number(
  (Number(data.probability ?? 0) * 100).toFixed(2)
)

      const riskLevel =
  riskScore >= 70
    ? RISK_LEVELS.HIGH
    : riskScore >= 40
      ? RISK_LEVELS.MEDIUM
      : RISK_LEVELS.LOW

setPrediction({
  ...data,
  riskScore,
  riskLevel,
  delayProbability: probabilityPercent,

  shapFactors: (data.riskFactors || []).map((factor) => ({
    factor: factor.feature,
    weight: factor.shap_value,
    absoluteImpact: factor.absolute_impact,
    impact: factor.impact,
  })),

  summary: data.prediction
    ? `${data.prediction} prediction with ${probabilityPercent.toFixed(1)}% delay probability.`
    : '',

  warningMessage:
    riskLevel === 'HIGH'
      ? 'High risk of delay detected.'
      : riskLevel === 'MEDIUM'
        ? 'Moderate risk of delay. Regular monitoring is recommended.'
        : 'Low risk of delay.',
})
    } catch (err) {
      console.error('Failed to load risk prediction:', err)

      setError(
        err?.info?.message ||
        err?.message ||
        'Failed to load risk prediction'
      )

      setPrediction(null)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchPrediction()
  }, [fetchPrediction])

  return {
    prediction,
    loading,
    error,
    refetch: fetchPrediction,
  }
}