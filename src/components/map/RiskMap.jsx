import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup as LeafletPopup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Loader from '../common/Loader.jsx'
import ErrorState from '../common/ErrorState.jsx'
import EmptyState from '../common/EmptyState.jsx'
import MapPopup from './MapPopup.jsx'
import createRiskMarkerIcon from './MapMarker.jsx'
import FilterDropdown from '../common/FilterDropdown.jsx'
import { getProjectMapMarkers, CUTTACK_CENTER } from '../../api/map.api'
import { DISTRICT_NAME, RISK_LEVELS } from '../../utils/constants'

// District options are aligned with the existing data source (projects carry a
// single district today); the "All Districts" option resets the filter.
const DISTRICT_OPTIONS = [DISTRICT_NAME]

export default function RiskMap({ onViewDetails, className = '' }) {
  const [markers, setMarkers] = useState([])
  const [center, setCenter] = useState(CUTTACK_CENTER)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [districtFilter, setDistrictFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    getProjectMapMarkers({ riskLevel: riskFilter, stage: stageFilter, district: districtFilter })
      .then((res) => {
        if (isMounted) {
          setMarkers(res.data)
          setCenter(res.center)
        }
      })
      .catch((err) => {
        if (isMounted) setError(err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [riskFilter, stageFilter, districtFilter])

  // Decorative stage legend derived from the marker set on screen.
  const stageLegend = useMemo(() => {
    const legend = []
    markers.forEach((m) => {
      if (!legend.find((l) => l.key === m.stage)) {
        legend.push({ key: m.stage, stage: m.stage })
      }
    })
    return legend
  }, [markers])

  const resetFilters = () => {
    setDistrictFilter('')
    setRiskFilter('')
    setStageFilter('')
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Filters: District · Risk Level · Stage */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          options={DISTRICT_OPTIONS.map((d) => ({ value: d, label: d }))}
          value={districtFilter}
          onChange={setDistrictFilter}
          allLabel="All Districts"
          className="min-w-[150px]"
        />
        <FilterDropdown
          options={[RISK_LEVELS.HIGH, RISK_LEVELS.MEDIUM, RISK_LEVELS.LOW].map((r) => ({ value: r, label: r }))}
          value={riskFilter}
          onChange={setRiskFilter}
          allLabel="All Risk Levels"
        />
        <FilterDropdown
          options={stageLegend.map((l) => ({ value: l.key, label: l.key }))}
          value={stageFilter}
          onChange={setStageFilter}
          allLabel="All Stages"
        />
        <span className="ml-auto text-[11px] font-medium text-gray-500">
          {loading
            ? 'Loading…'
            : `${markers.length} project${markers.length === 1 ? '' : 's'} shown${
                riskFilter || stageFilter || districtFilter ? ' (filtered)' : ''
              }`}
        </span>
      </div>

      {/* Map — existing Leaflet implementation (OpenStreetMap tiles) kept;
          risk-colored markers, popups and zoom controls */}
      {loading ? (
        <Loader fullPage label="Loading district map…" />
      ) : error ? (
        <ErrorState message="Failed to load map data." onRetry={resetFilters} />
      ) : markers.length === 0 ? (
        <EmptyState title="No Projects on Map" message="No projects match the selected filters." />
      ) : (
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={11}
          scrollWheelZoom
          zoomControl
          className="z-0 h-[420px] w-full rounded-xl border border-gray-200"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker) => (
            <LeafletMarker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={createRiskMarkerIcon(marker)}
            >
              <LeafletPopup>
                <MapPopup marker={marker} onViewDetails={() => onViewDetails && onViewDetails(marker)} />
              </LeafletPopup>
            </LeafletMarker>
          ))}
        </MapContainer>
      )}

      {/* Legend — High = red · Medium = amber · Low = green */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 text-[11px] text-gray-600">
        <span className="font-semibold text-gray-700">Risk Level:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> High
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Low
        </span>
        {stageLegend.length > 0 ? (
          <>
            <span className="ml-2 font-semibold text-gray-700">Stages:</span>
            {stageLegend.map((l) => (
              <span key={l.key} className="rounded-full border border-gray-100 bg-white px-2 py-0.5">
                {l.key}
              </span>
            ))}
          </>
        ) : null}
      </div>
    </div>
  )
}
