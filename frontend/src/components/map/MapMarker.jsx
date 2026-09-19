import { divIcon } from 'leaflet'
import { RISK_LEVELS } from '../../utils/constants'
import { getRiskMeta } from '../../utils/riskUtils'

/**
 * Marker component for the risk map. Builds a Leaflet divIcon whose inner
 * HTML is Tailwind-styled (Tailwind scans this file, so the utility classes
 * are generated). Marker color is derived from the project's risk level:
 * red = High, amber = Medium, green = Low.
 *
 * High-risk markers additionally render a pulsing ring behind the dot.
 *
 * Used by RiskMap.jsx for every project marker.
 */
export default function createRiskMarkerIcon(marker) {
  const color = getRiskMeta(marker.riskLevel).color
  const isHighRisk = marker.riskLevel === RISK_LEVELS.HIGH

  const pulse = isHighRisk
    ? `<span class="absolute inset-0 rounded-full opacity-40 animate-ping" style="background-color:${color};"></span>`
    : ''

  return divIcon({
    className: 'risk-map-div-icon',
    html: `
      ${pulse}
      <span class="relative inline-flex h-4 w-4 rounded-full border-2 border-white shadow-md" style="background-color:${color};"></span>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  })
}

