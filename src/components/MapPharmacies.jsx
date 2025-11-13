import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Create a simple blue dot icon using DivIcon to avoid asset issues
const dotIcon = (color = '#047857') =>
  L.divIcon({
    className: 'custom-dot-icon',
    html: `<div style="width:12px;height:12px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px ${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })

export default function MapPharmacies({ city = 'Ouagadougou' }) {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [pharmacies, setPharmacies] = useState([])
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Default center: Ouagadougou
  const defaultCenter = useMemo(() => ({ lat: 12.3714, lng: -1.5197 }), [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null)
      )
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const params = new URLSearchParams()
        if (city) params.append('city', city)
        const res = await fetch(`${baseUrl}/api/pharmacies?${params.toString()}`)
        if (!res.ok) throw new Error('Erreur de chargement des pharmacies')
        const data = await res.json()
        setPharmacies(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [baseUrl, city])

  const center = coords || defaultCenter

  return (
    <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-800">Pharmacies sur la carte {city ? `– ${city}` : ''}</div>
        {loading && <div className="text-xs text-gray-500">Chargement…</div>}
      </div>
      {error && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2">{error}</div>
      )}
      <div className="h-80 w-full overflow-hidden rounded-lg">
        <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {coords && (
            <CircleMarker center={[coords.lat, coords.lng]} radius={8} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.7 }}>
              <Popup>Vous êtes ici</Popup>
            </CircleMarker>
          )}
          {pharmacies
            .filter(p => p.latitude != null && p.longitude != null)
            .map((p) => (
              <Marker key={p._id || p.id || `${p.name}-${p.latitude}`} position={[p.latitude, p.longitude]} icon={dotIcon('#047857')}>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{p.name || p.pharmacy_name}</div>
                    {p.address && <div className="text-sm text-gray-600">{p.address}</div>}
                    {p.phone && <div className="text-sm">📞 {p.phone}</div>}
                    <a
                      className="text-sm text-blue-600 underline"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((p.latitude||'') + ',' + (p.longitude||''))}`}
                      target="_blank" rel="noreferrer"
                    >
                      Itinéraire
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
      {!loading && pharmacies.filter(p => p.latitude != null && p.longitude != null).length === 0 && (
        <div className="text-xs text-gray-500 mt-2">Aucune pharmacie géolocalisée trouvée pour le moment.</div>
      )}
    </div>
  )
}
