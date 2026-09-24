async function generateRecommendations(projectContext) {
  if (projectContext.risk && projectContext.risk.riskFactors && projectContext.risk.riskFactors.length > 0) {
    return projectContext.risk.riskFactors.map((factor, index) => ({
      recommendation: `Address risk factor: ${factor}`,
      priority: index === 0 ? 'HIGH' : 'MEDIUM'
    }));
  }

  return [
    {
      recommendation: "Conduct stakeholder meetings to resolve any pending disputes.",
      priority: "HIGH"
    },
    {
      recommendation: "Expedite legal review and monitor rehabilitation progress closely.",
      priority: "MEDIUM"
    },
    {
      recommendation: "Regularly update project timeline and resource allocation.",
      priority: "LOW"
    }
  ];
}

module.exports = {
  generateRecommendations,
}