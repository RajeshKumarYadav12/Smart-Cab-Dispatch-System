import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiClock, FiHeart, FiPlus, FiChevronDown, FiCrosshair } from 'react-icons/fi';
import { toast } from 'sonner';
import { fetchWithAuth } from '../api/client';

const DEFAULT_LOCATIONS = [
  { id: 'airport_1', label: 'International Airport', geo: { lat: 40.6413, lng: -73.7781 }, sub: 'Terminal 1 Arrivals' },
  { id: 'hotel_a', label: 'Grand Hyatt', geo: { lat: 40.7527, lng: -73.9772 }, sub: 'Accommodation A' },
  { id: 'hotel_b', label: 'Marriott Downtown', geo: { lat: 40.7112, lng: -74.0150 }, sub: 'Accommodation B' },
  { id: 'venue_main', label: 'Convention Center', geo: { lat: 40.7570, lng: -74.0000 }, sub: 'Main Event Venue' }
];

export default function RequestRide() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState(null);
  
  const [activeField, setActiveField] = useState('origin'); 
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');

  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const originAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);

  // 1. Fetch API Key
  useEffect(() => {
    fetchWithAuth('/config/maps')
      .then(data => setMapsApiKey(data.apiKey))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!mapsApiKey) return;

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!window.google) return;
      
      if (originInputRef.current && !originAutocompleteRef.current) {
        originAutocompleteRef.current = new window.google.maps.places.Autocomplete(originInputRef.current, { fields: ['formatted_address', 'geometry', 'name'] });
        originAutocompleteRef.current.addListener('place_changed', () => {
          const place = originAutocompleteRef.current.getPlace();
          if (place.geometry) {
            const loc = {
              id: 'custom_origin',
              label: place.name || place.formatted_address,
              geo: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
            };
            setOrigin(loc);
            setOriginText(loc.label);
            setActiveField('destination');
            if (destinationInputRef.current) destinationInputRef.current.focus();
          }
        });
      }

      if (destinationInputRef.current && !destinationAutocompleteRef.current) {
        destinationAutocompleteRef.current = new window.google.maps.places.Autocomplete(destinationInputRef.current, { fields: ['formatted_address', 'geometry', 'name'] });
        destinationAutocompleteRef.current.addListener('place_changed', () => {
          const place = destinationAutocompleteRef.current.getPlace();
          if (place.geometry) {
            const loc = {
              id: 'custom_dest',
              label: place.name || place.formatted_address,
              geo: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
            };
            setDestination(loc);
            setDestinationText(loc.label);
            setActiveField('origin');
          }
        });
      }
    }
  }, [mapsApiKey]);

  const handleUseCurrentLocation = (e) => {
    e.stopPropagation();
    if (!mapsApiKey) {
      toast.error("Maps API Key not loaded yet.");
      return;
    }
    
    if ('geolocation' in navigator) {
      setGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsApiKey}`);
            const data = await res.json();
            let address = "Current Location";
            if (data.status === "OK" && data.results.length > 0) {
              address = data.results[0].formatted_address; 
            }
            const loc = { id: 'current_location', label: address, geo: { lat, lng } };
            setOrigin(loc);
            setOriginText(address);
            setActiveField('destination');
            if (destinationInputRef.current) destinationInputRef.current.focus();
            toast.success("Location acquired!");
          } catch (err) {
            console.error(err);
            toast.error("Failed to geocode location.");
          } finally {
            setGeocoding(false);
          }
        },
        (err) => {
          console.warn('Geolocation denied', err);
          toast.error("Location access denied.");
          setGeocoding(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleSelectLocationFromList = (loc) => {
    if (activeField === 'origin') {
      setOrigin(loc);
      setOriginText(loc.label);
      setActiveField('destination');
      if (destinationInputRef.current) destinationInputRef.current.focus();
    } else {
      setDestination(loc);
      setDestinationText(loc.label);
      setActiveField('origin');
    }
  };

  const geocodeAddress = async (address) => {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${mapsApiKey}`);
      const data = await res.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng, label: data.results[0].formatted_address };
      }
    } catch (err) {
      console.error('Geocoding failed for', address, err);
    }
    
    return { lat: 12.9716, lng: 77.5946, label: address };
  };

  const handleSubmit = async () => {
    if (!originText || !destinationText) {
      toast.error('Please select both pickup and dropoff locations.');
      return;
    }

    setLoading(true);
    try {
      let finalOrigin = origin;
      let finalDest = destination;

      if (!finalOrigin || finalOrigin.label !== originText) {
        const geoResult = await geocodeAddress(originText);
        finalOrigin = { label: geoResult.label, geo: { lat: geoResult.lat, lng: geoResult.lng } };
      }
      
      if (!finalDest || finalDest.label !== destinationText) {
        const geoResult = await geocodeAddress(destinationText);
        finalDest = { label: geoResult.label, geo: { lat: geoResult.lat, lng: geoResult.lng } };
      }

      const trip = await fetchWithAuth('/trip', {
        method: 'POST',
        body: JSON.stringify({
          type: 'on_demand',
          isOnDemand: true,
          status: 'PENDING_APPROVAL',
          origin: { label: finalOrigin.label, geo: finalOrigin.geo },
          destination: { label: finalDest.label, geo: finalDest.geo },
          scheduledWindow: { start: new Date().toISOString() }
        })
      });
      
      toast.success('Ride request sent to coordinator!');
      navigate(`/track/${trip._id}`, { replace: true });
    } catch (err) {
      toast.error('Failed to request ride: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-32">
      
      <header className="flex items-center justify-between p-4 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <FiArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-2xl font-black tracking-tight">Drop</h1>
        </div>
        <button className="flex items-center gap-1 border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-gray-50">
          For me <FiChevronDown size={16} />
        </button>
      </header>

      <div className="px-4">
        {}
        <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.08)] border border-gray-100 p-4 mb-4 relative z-10">
          
          <div className="relative">
            {}
            <div className="absolute left-[9px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-gray-300"></div>
            
            {}
            <div 
              className={`flex items-center gap-4 mb-3 border-b border-gray-100 pb-3 transition-all ${activeField === 'origin' ? 'opacity-100' : 'opacity-60'}`}
              onClick={() => { setActiveField('origin'); if(originInputRef.current) originInputRef.current.focus(); }}
            >
              <div className={`w-5 h-5 rounded-full border-[3px] bg-white z-10 shrink-0 ${activeField === 'origin' ? 'border-green-600' : 'border-gray-400'}`}></div>
              
              <div className="flex-1 flex items-center gap-2">
                {}
                {originText.length === 0 && (
                  <button 
                    onClick={handleUseCurrentLocation}
                    disabled={geocoding}
                    className="text-brand-600 hover:bg-brand-50 rounded-full transition-colors flex-shrink-0 flex items-center justify-center w-8 h-8 -ml-2"
                    title="Use Current Location"
                  >
                    {geocoding ? (
                      <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiCrosshair size={18} />
                    )}
                  </button>
                )}
                
                <input 
                  ref={originInputRef}
                  type="text" 
                  placeholder={originText.length === 0 && !geocoding ? "Enter Pickup Location" : (geocoding ? "Locating..." : "")}
                  value={originText}
                  onChange={(e) => {
                    setOriginText(e.target.value);
                    if(e.target.value === '') setOrigin(null);
                  }}
                  className="w-full bg-transparent text-gray-900 font-semibold focus:outline-none truncate placeholder-gray-400"
                />
              </div>
            </div>

            {}
            <div 
              className={`flex items-center gap-4 transition-all ${activeField === 'destination' ? 'opacity-100' : 'opacity-60'}`}
              onClick={() => { setActiveField('destination'); if(destinationInputRef.current) destinationInputRef.current.focus(); }}
            >
              <div className={`w-5 h-5 rounded-full border-2 z-10 shrink-0 flex items-center justify-center ${activeField === 'destination' ? 'bg-orange-600 border-orange-200' : 'bg-gray-400 border-gray-100'}`}>
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <input 
                  ref={destinationInputRef}
                  type="text" 
                  placeholder="Where do you want to go?"
                  value={destinationText}
                  onChange={(e) => {
                    setDestinationText(e.target.value);
                    if(e.target.value === '') setDestination(null);
                  }}
                  className="w-full bg-transparent text-gray-900 font-semibold focus:outline-none truncate placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 bg-white shadow-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
            <FiMapPin size={18} /> Select on map
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 bg-white shadow-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
            <FiPlus size={18} /> Add stops
          </button>
        </div>

        {/* Recent Locations List */}
        <div className="space-y-0 relative z-0">
          {DEFAULT_LOCATIONS.map((loc, index) => (
            <div key={loc.id} className="relative">
              <div 
                onClick={() => handleSelectLocationFromList(loc)}
                className="flex items-start gap-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="mt-1 text-gray-400">
                  <FiClock size={22} />
                </div>
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-0.5">{loc.label}</h3>
                  <p className="text-gray-500 text-sm truncate">{loc.sub}</p>
                </div>
                <div className="text-gray-400 hover:text-red-500 transition-colors p-2 -mr-2">
                  <FiHeart size={22} />
                </div>
              </div>
              {index !== DEFAULT_LOCATIONS.length - 1 && (
                <div className="w-full h-px border-b border-dashed border-gray-200 ml-10"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Confirm Button at Bottom */}
      {originText && destinationText && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] animate-slide-up z-30">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Confirm & Book Ride'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
