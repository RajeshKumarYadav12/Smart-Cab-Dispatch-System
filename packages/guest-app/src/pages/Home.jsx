import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiCalendar, FiClock, FiSearch, FiInfo, FiMenu, FiLogOut } from 'react-icons/fi';
import { fetchWithAuth } from '../api/client';
import { useTripStore } from '../store/tripStore';

export default function Home() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setTrip } = useTripStore();
  const [mapsApiKey, setMapsApiKey] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({ lat: 12.9716, lng: 77.5946 }); 

  useEffect(() => {
    
    fetchWithAuth('/config/maps')
      .then(data => setMapsApiKey(data.apiKey))
      .catch(console.error);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Geolocation denied', err),
        { enableHighAccuracy: true }
      );
    }

    const loadTrips = async () => {
      try {
        const data = await fetchWithAuth('/trip/me');
        setTrips(data || []);
      } catch (err) {
        console.error('Failed to load trips', err);
      } finally {
        setLoading(false);
      }
    };
    loadTrips();
  }, []);

  useEffect(() => {
    if (!mapsApiKey) return;

    const initMap = () => {
      if (!window.google) return;
      const mapElement = document.getElementById('home-map');
      if (mapElement && !mapElement.hasChildNodes()) {
        new window.google.maps.Map(mapElement, {
          center: currentLocation,
          zoom: 15,
          disableDefaultUI: true,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
          ]
        });
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [mapsApiKey, currentLocation]);

  const handleTrack = (trip) => {
    setTrip(trip);
    navigate(`/track/${trip._id}`);
  };

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const activeTrips = trips.filter(t => ['REQUESTED', 'PENDING_APPROVAL', 'PENDING_ASSIGNMENT', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(t.status));
  const scheduledTrips = trips.filter(t => !['REQUESTED', 'PENDING_APPROVAL', 'PENDING_ASSIGNMENT', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(t.status));

  return (
    <div className="relative min-h-screen flex flex-col w-full mx-auto bg-gray-100 overflow-hidden font-sans">
      
      {}
      <div className="absolute inset-0 z-0" id="home-map">
        {!mapsApiKey && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        )}
      </div>

      {}
      <header className="absolute top-0 left-0 w-full z-10 p-4 pt-6 flex items-center justify-between pointer-events-none">
        <button className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-800 hover:bg-gray-50 transition-colors pointer-events-auto">
          <FiMenu size={24} />
        </button>
        <button onClick={handleLogout} className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors pointer-events-auto">
          <FiLogOut size={22} />
        </button>
      </header>

      {}
      <div className="absolute top-28 left-4 right-4 z-10 animate-slide-down">
        <div 
          onClick={() => navigate('/request')}
          className="bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-4 flex items-center gap-3 cursor-pointer border border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <FiSearch className="text-gray-900 text-xl ml-2 shrink-0" />
          <span className="text-gray-900 font-bold text-lg">Where do you want to go?</span>
        </div>
      </div>

      {}
      <div className="absolute bottom-0 left-0 w-full z-20 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] animate-slide-up pb-8 pt-2 max-h-[50vh] flex flex-col">
        {}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 shrink-0"></div>

        <div className="px-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="space-y-4 animate-pulse pt-4">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-16 bg-gray-100 rounded-2xl w-full"></div>
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              
              {}
              {activeTrips.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                    </span>
                    Active Requests
                  </h2>
                  
                  <div className="space-y-3">
                    {activeTrips.map(trip => {
                      const isPending = ['PENDING_APPROVAL', 'REQUESTED', 'PENDING_ASSIGNMENT'].includes(trip.status);
                      
                      return (
                        <div 
                          key={trip._id} 
                          onClick={() => handleTrack(trip)}
                          className="bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-brand-100 text-brand-600'}`}>
                                {isPending ? <FiClock size={16} /> : <FiMapPin size={16} />}
                              </div>
                              <span className="font-bold text-gray-900 text-sm">{trip.status.replace(/_/g, ' ')}</span>
                            </div>
                            <span className="text-brand-600 text-xs font-bold bg-brand-50 px-2 py-1 rounded-lg">TRACK</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <p className="text-sm font-semibold text-gray-600 truncate">{trip.origin.label}</p>
                          </div>
                          <div className="ml-[3px] border-l-2 border-dotted border-gray-300 h-3 my-1"></div>
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <p className="text-sm font-semibold text-gray-900 truncate">{trip.destination.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {}
              <section>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiCalendar size={14} />
                  Scheduled Itinerary
                </h2>

                {scheduledTrips.length > 0 ? (
                  <div className="space-y-3">
                    {scheduledTrips.map(trip => (
                      <div key={trip._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                          <div className="inline-block px-2 py-1 rounded-md bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider">
                            {trip.type.replace('_', ' ')}
                          </div>
                          <div className="text-gray-900 text-sm font-black flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-sm">
                            <FiClock size={14} className="text-brand-500" />
                            {new Date(trip.scheduledWindow.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <p className="text-sm font-semibold text-gray-600 truncate">{trip.origin.label}</p>
                        </div>
                        <div className="ml-[3px] border-l-2 border-dotted border-gray-300 h-3 my-1"></div>
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{trip.destination.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <FiInfo size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm font-medium">No scheduled trips on your itinerary.</p>
                  </div>
                )}
              </section>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
