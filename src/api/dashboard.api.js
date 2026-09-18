function simulateRequest(payload, delay = 350) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay)
  })
}

/**
 * Summary metrics shown in the 7 summary cards on the dashboard.
 */
export async function getDashboardSummary() {
  return simulateRequest({
    data: {
      myProjects: 42,
      highRisk: 14,
      mediumRisk: 18,
      lowRisk: 10,
      avgExpectedDelayDays: 68,
      pendingActions: 9,
      lastUpdated: new Date().toISOString(),
    },
  })
}
