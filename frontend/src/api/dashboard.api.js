import { fetchClient } from './fetchClient'

export async function getDashboardSummary({ signal } = {}) {
  const res = await fetchClient('/dashboard', { signal })
  // The backend returns:
  // { success: true, data: { summary, riskDistribution, recentAlerts, attentionProjects } }
  // We need to map the backend 'summary' snake_case / camelCase structure 
  // to match what the UI expects, and rename avgRiskScore.
  
  const data = res?.data || {}
  const summary = data.summary || {}
  
  return {
    data: {
      myProjects: summary.totalProjects || 0,
      highRisk: summary.highRiskProjects || 0,
      mediumRisk: summary.mediumRiskProjects || 0,
      lowRisk: summary.lowRiskProjects || 0,
      avgRiskScore: summary.avgRiskScore || 0,
      pendingActions: summary.unreadAlerts || 0, // unreadAlerts maps to pendingActions
      lastUpdated: new Date().toISOString(), // Or from backend if available
    },
    riskDistribution: data.riskDistribution || [],
    recentAlerts: data.recentAlerts || [],
    attentionProjects: data.attentionProjects || [],
  }
}
