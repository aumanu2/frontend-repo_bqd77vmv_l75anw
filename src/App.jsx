import { useEffect, useMemo, useState } from 'react'
import MapPharmacies from './components/MapPharmacies'

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')
  const [barcode, setBarcode] = useState('')

  return (
    <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="grid sm:grid-cols-3 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou DCI"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Code-barres (EAN)"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => onSearch({ q: query || undefined, barcode: barcode || undefined })}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2"
        >
          Rechercher
        </button>
      </div>
    </div>
  )
}

function ResultItem({ item, onAdd }) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <div className="font-semibold text-gray-800">{item.medicine_name}</div>
        <div className="text-sm text-gray-600">{item.dci || '—'} {item.barcode ? `• ${item.barcode}` : ''}</div>
        <div className="text-sm text-gray-600 mt-1">{item.pharmacy_name} — {item.pharmacy_address}</div>
        {item.distance_km != null && (
          <div className="text-xs text-gray-500">{item.distance_km} km</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-blue-700 font-semibold">{item.price.toFixed(2)} CFA</div>
        <button onClick={() => onAdd(item)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2 text-sm">Ajouter</button>
      </div>
    </div>
  )
}

function Cart({ items, onUpdateQty, onCheckout }) {
  const total = useMemo(() => items.reduce((s, it) => s + it.price * it.quantity, 0), [items])
  return (
    <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="font-semibold mb-3">Panier</div>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500">Votre panier est vide.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div>
                <div className="text-gray-800">{it.medicine_name}</div>
                <div className="text-xs text-gray-500">{it.pharmacy_name}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onUpdateQty(idx, Math.max(1, it.quantity - 1))} className="px-2 py-1 border rounded">-</button>
                <div className="w-8 text-center">{it.quantity}</div>
                <button onClick={() => onUpdateQty(idx, it.quantity + 1)} className="px-2 py-1 border rounded">+</button>
              </div>
              <div className="w-24 text-right">{(it.price * it.quantity).toFixed(2)}</div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="font-semibold">Total</div>
            <div className="font-semibold">{total.toFixed(2)} CFA</div>
          </div>
          <button onClick={onCheckout} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2">Commander</button>
        </div>
      )}
    </div>
  )
}

function CheckoutModal({ open, onClose, items, onSubmit }) {
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [method, setMethod] = useState('delivery')
  const [address, setAddress] = useState('')
  const [prescriptionUrl, setPrescriptionUrl] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Finaliser la commande</div>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={userName} onChange={(e)=>setUserName(e.target.value)} placeholder="Nom complet" className="border rounded-lg px-3 py-2" />
          <input value={userPhone} onChange={(e)=>setUserPhone(e.target.value)} placeholder="Téléphone" className="border rounded-lg px-3 py-2" />
          <select value={method} onChange={(e)=>setMethod(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="delivery">Livraison</option>
            <option value="click_collect">Click & Collect</option>
          </select>
          {method === 'delivery' && (
            <input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="Adresse de livraison" className="border rounded-lg px-3 py-2" />
          )}
          <input value={prescriptionUrl} onChange={(e)=>setPrescriptionUrl(e.target.value)} placeholder="Lien vers l'ordonnance (si requis)" className="border rounded-lg px-3 py-2 col-span-full" />
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">Pour les médicaments sur ordonnance, vous devez présenter l'original lors de la livraison ou du retrait.</p>

        <button
          onClick={() => onSubmit({ userName, userPhone, method, address, prescriptionUrl })}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2"
        >
          Confirmer
        </button>
      </div>
    </div>
  )
}

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [results, setResults] = useState([])
  const [cart, setCart] = useState([])
  const [coords, setCoords] = useState(null)
  const [openCheckout, setOpenCheckout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null)
      )
    }
  }, [])

  const handleSearch = async ({ q, barcode }) => {
    setLoading(true)
    setMessage('')
    try {
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (barcode) params.append('barcode', barcode)
      if (coords) {
        params.append('latitude', coords.lat)
        params.append('longitude', coords.lng)
      }
      const res = await fetch(`${baseUrl}/api/search?${params.toString()}`)
      const data = await res.json()
      setResults(data)
      if (data.length === 0) setMessage('Aucun résultat')
    } catch (e) {
      setMessage("Erreur lors de la recherche")
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (item) => {
    setCart((prev) => {
      const foundIdx = prev.findIndex((p) => p.inventory_id === item.inventory_id)
      if (foundIdx >= 0) {
        const next = [...prev]
        next[foundIdx].quantity += 1
        return next
      }
      return [...prev, { ...item, quantity: 1, requires_prescription: false }]
    })
  }

  const updateQty = (idx, qty) => {
    setCart((prev) => {
      const next = [...prev]
      next[idx].quantity = qty
      return next
    })
  }

  const checkout = async ({ userName, userPhone, method, address, prescriptionUrl }) => {
    if (!userName || !userPhone) {
      setMessage('Veuillez entrer votre nom et téléphone')
      return
    }
    try {
      setLoading(true)
      const payload = {
        user_name: userName,
        user_phone: userPhone,
        pharmacy_id: cart[0]?.pharmacy_id || '',
        items: cart.map((c) => ({
          inventory_id: c.inventory_id,
          medicine_name: c.medicine_name,
          price: c.price,
          quantity: c.quantity,
          requires_prescription: c.requires_prescription || false,
        })),
        delivery_method: method,
        delivery_address: method === 'delivery' ? address : undefined,
        prescription_url: prescriptionUrl || undefined,
      }
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(()=>({detail:'Erreur'}))
        throw new Error(err.detail || 'Erreur lors de la commande')
      }
      const data = await res.json()
      setMessage(`Commande créée. Statut: ${data.status}. Total: ${data.total_amount} CFA`)
      setCart([])
      setOpenCheckout(false)
    } catch (e) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <header className="py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">FASO TiiM Roogo</h1>
          <p className="text-gray-600">Recherche de médicaments, commande et livraison rapide</p>
        </header>

        <MapPharmacies city="Ouagadougou" />

        <SearchBar onSearch={handleSearch} />

        {loading && <div className="text-sm text-gray-600">Chargement...</div>}
        {message && <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">{message}</div>}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {results.map((r) => (
              <ResultItem key={r.inventory_id} item={r} onAdd={addToCart} />
            ))}
            {results.length === 0 && !loading && (
              <div className="text-sm text-gray-500">Commencez par une recherche.</div>
            )}
          </div>
          <div className="lg:col-span-1">
            <Cart items={cart} onUpdateQty={updateQty} onCheckout={() => setOpenCheckout(true)} />
          </div>
        </div>

        <CheckoutModal open={openCheckout} onClose={() => setOpenCheckout(false)} items={cart} onSubmit={checkout} />

        <div className="text-center pt-8 text-xs text-gray-500">
          Pour les ordonnances: l'original est requis lors de la livraison ou du retrait.
        </div>
      </div>
    </div>
  )
}

export default App
