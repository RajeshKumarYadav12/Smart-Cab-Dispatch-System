import { useState, useEffect, useRef } from 'react';
import { FiPower, FiMapPin, FiCheckCircle, FiNavigation, FiPhone, FiUser, FiClock } from 'react-icons/fi';
import { fetchWithAuth } from '../../api/client';
import { toast } from 'sonner';

export default function MyTrip() {
  const [onDuty, setOnDuty] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapsApiKey, setMapsApiKey] = useState(null);
  const [etaText, setEtaText] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  const socketRef = useRef(null);

  useEffect(() => {
    import('socket.io-client').then(({ io }) => {
      const user = localStorage.getItem('user');
      if (user) {
        socketRef.current = io('/', { withCredentials: true });
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('driver:location:update', { lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        },
        (err) => console.warn('Driver geolocation error', err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    if (!mapsApiKey || !currentTrip || !mapRef.current) return;

    const updateRoute = () => {
      if (!window.google) return;
      
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          zoom: 14,
          center: { lat: 12.9716, lng: 77.5946 }, 
          disableDefaultUI: true,
          padding: { top: 80, bottom: 220, left: 20, right: 20 },
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
        });

        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: false,
          polylineOptions: { strokeColor: '#14b8a6', strokeWeight: 6 }
        });
      }

      let routeOrigin = { lat: parseFloat(currentTrip.origin?.geo?.lat), lng: parseFloat(currentTrip.origin?.geo?.lng) };
      let routeDest = { lat: parseFloat(currentTrip.destination?.geo?.lat), lng: parseFloat(currentTrip.destination?.geo?.lng) };
      
      if (isNaN(routeOrigin.lat) || isNaN(routeOrigin.lng) || isNaN(routeDest.lat) || isNaN(routeDest.lng)) {
        console.error("Invalid coordinates for route", { routeOrigin, routeDest });
        return;
      }

      if (driverLocation?.lat) {
        if (!window.driverMarker) {
          window.driverMarker = new window.google.maps.Marker({
            map: mapInstanceRef.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            }
          });
        }
        window.driverMarker.setPosition({ lat: driverLocation.lat, lng: driverLocation.lng });
      }

      if (Math.abs(routeOrigin.lat - routeDest.lat) < 0.0001 && Math.abs(routeOrigin.lng - routeDest.lng) < 0.0001) {
        mapInstanceRef.current.setCenter(routeOrigin);
        mapInstanceRef.current.setZoom(16);
        setEtaText('Arrived');
        return;
      }

      const googleOrigin = new window.google.maps.LatLng(routeOrigin.lat, routeOrigin.lng);
      const googleDest = new window.google.maps.LatLng(routeDest.lat, routeDest.lng);

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: googleOrigin,
        destination: googleDest,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
          if (result.routes[0]?.legs[0]?.duration?.text) {
            setEtaText(result.routes[0].legs[0].duration.text);
          }
        } else {
          console.warn("Directions request failed", status, "Using fallback polyline.");
          if (window.fallbackPolyline) window.fallbackPolyline.setMap(null);
          window.fallbackPolyline = new window.google.maps.Polyline({
            path: [googleOrigin, googleDest],
            geodesic: true,
            strokeColor: '#14b8a6',
            strokeOpacity: 1.0,
            strokeWeight: 5
          });
          window.fallbackPolyline.setMap(mapInstanceRef.current);
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(googleOrigin);
          bounds.extend(googleDest);
          mapInstanceRef.current.fitBounds(bounds);
        }

        setTimeout(() => {
          if (mapInstanceRef.current) {
            window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
          }
        }, 500);
      });
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = updateRoute;
      document.head.appendChild(script);
    } else {
      updateRoute();
    }
  }, [mapsApiKey, currentTrip?._id, currentTrip?.status, driverLocation?.lat, driverLocation?.lng]);

  const loadDriverState = async () => {
    try {
      if (!mapsApiKey) {
        fetchWithAuth('/config/maps')
          .then(data => setMapsApiKey(data.apiKey))
          .catch(err => console.error(err));
      }

      try {
        const statusRes = await fetchWithAuth('/driver/status');
        setOnDuty(statusRes.onDuty);
        setDriverProfile({ userId: statusRes.userId, vehicle: statusRes.vehicle });
      } catch (err) {
        
        console.warn("Driver profile not found for this user");
        toast.error("Driver profile not found. Please log in as a Driver.");
        setLoading(false);
        return; 
      }
      
      const tripsRes = await fetchWithAuth('/trip/me');
      if (tripsRes && tripsRes.length > 0) {
        setCurrentTrip(tripsRes[0]);
      } else {
        setCurrentTrip(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverState();
    const interval = setInterval(loadDriverState, 5000); 
    return () => clearInterval(interval);
  }, []);

  const toggleDuty = async () => {
    try {
      const res = await fetchWithAuth('/driver/status', {
        method: 'PATCH',
        body: JSON.stringify({ onDuty: !onDuty })
      });
      setOnDuty(res.onDuty);
      toast.success(`You are now ${res.onDuty ? 'Online' : 'Offline'}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const advanceStatus = async (overrideStatus = null) => {
    if (!currentTrip) return;
    
    let nextStatus = overrideStatus || currentTrip.status;
    if (!overrideStatus) {
      switch(currentTrip.status) {
        case 'ASSIGNED': nextStatus = 'DRIVER_EN_ROUTE_TO_PICKUP'; break;
        case 'DRIVER_EN_ROUTE_TO_PICKUP': nextStatus = 'ARRIVED_AT_PICKUP'; break;
        case 'ARRIVED_AT_PICKUP': nextStatus = 'GUEST_ONBOARD'; break;
        case 'GUEST_ONBOARD': nextStatus = 'IN_PROGRESS'; break;
        case 'IN_PROGRESS': nextStatus = 'COMPLETED'; break;
        default: return;
      }
    }
    
    try {
      await fetchWithAuth(`/trip/${currentTrip._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });

      await loadDriverState();
    } catch (err) {
      toast.error('Failed to update trip status');
    }
  };

  const rejectTrip = async () => {
    if (!currentTrip) return;
    try {
      await fetchWithAuth(`/trip/${currentTrip._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PENDING_APPROVAL' })
      });
      await loadDriverState();
    } catch (err) {
      toast.error('Failed to reject trip');
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
    </div>
  );

  const guest = currentTrip?.guestIds?.[0]?.userId;

  const getStatusText = (status) => {
    switch(status) {
      case 'ASSIGNED': return 'Accept Trip';
      case 'DRIVER_EN_ROUTE_TO_PICKUP': return 'Arrived at Pickup';
      case 'ARRIVED_AT_PICKUP': return 'Guest Boarded';
      case 'GUEST_ONBOARD': return 'Start Trip';
      case 'IN_PROGRESS': return 'Complete Dropoff';
      default: return 'Update Status';
    }
  };

  return (
    <div className={`w-full min-h-screen flex flex-col relative ${currentTrip ? 'bg-transparent' : 'bg-gray-50'}`}>
      
      {}
      <div ref={mapRef} className="absolute inset-0 z-0 bg-gray-100" style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }} id="driver-map">
        {!mapsApiKey && <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>}
      </div>

      {}
      <header className={`p-4 flex items-center justify-between sticky top-0 z-20 ${currentTrip ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white shadow-sm'}`}>
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900">ApnaRide</h1>
          <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Driver Terminal {driverProfile ? `• ${driverProfile.userId?.name || 'Driver'}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDuty}
            className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
              onDuty 
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${onDuty ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></span>
            {onDuty ? 'ONLINE' : 'OFFLINE'}
          </button>
          
          <button
            onClick={async () => {
              try {
                await fetchWithAuth('/auth/logout', { method: 'POST' });
              } catch (e) {
                console.error(e);
              }
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col relative z-10 pointer-events-none">
        {!onDuty ? (
          <div className="bg-white p-10 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center mt-8 animate-fade-in border border-gray-100 relative z-10 max-w-md mx-auto w-full">
            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6 text-gray-300 shadow-inner">
              <FiPower size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">You are Offline</h2>
            <p className="text-gray-500">Go online to start receiving dispatch assignments and help guests reach their destinations.</p>
          </div>
        ) : !currentTrip ? (
          <div className="bg-white p-10 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center mt-8 animate-fade-in border border-brand-100 relative overflow-hidden z-10 max-w-md mx-auto w-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-300 via-brand-500 to-brand-300 animate-pulse"></div>
            <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center mb-6 text-brand-500 relative">
              <div className="absolute inset-0 rounded-full border-4 border-brand-200 animate-ping opacity-20"></div>
              <FiNavigation size={48} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Finding a Trip</h2>
            <p className="text-gray-500">You are on duty. Our dispatch engine is actively matching you with the nearest guest.</p>
          </div>
        ) : (
          <div className="h-full flex flex-col w-full relative z-10 animate-slide-up flex-1">
            
            {/* Map UI elements can go here if needed, ETA moved to bottom sheet */}

            <div className="mt-auto mb-4 px-4 w-full flex flex-col gap-2 pointer-events-auto max-w-sm mx-auto">
              {/* Sleek Bottom Info Sheet */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-600"></div>
                
                <div className="flex justify-between items-center mb-3 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {currentTrip.status.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-full px-2 py-0.5 shadow-sm">
                      <FiClock className="text-brand-600" size={10} />
                      <span className="font-bold text-gray-900 text-[10px]">{etaText || '-- mins'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <FiUser size={12} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{guest?.name || 'Guest'}</p>
                    </div>
                    {guest?.phone && (
                      <a href={`tel:${guest.phone}`} className="ml-1 w-6 h-6 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100">
                        <FiPhone size={12} />
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
                    <div className="w-0.5 h-4 bg-gray-200 my-1"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Pickup</p>
                      <p className="font-semibold text-gray-900 text-xs truncate">{currentTrip.origin?.label || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Dropoff</p>
                      <p className="font-semibold text-gray-900 text-xs truncate">{currentTrip.destination?.label || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {}
              {currentTrip.status === 'ASSIGNED' ? (
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={rejectTrip}
                    className="flex-1 bg-white text-red-600 border border-red-200 rounded-xl py-3 px-3 font-bold text-sm shadow-sm hover:bg-red-50 transition-all flex justify-center items-center gap-1 active:scale-[0.98]"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => advanceStatus('DRIVER_EN_ROUTE_TO_PICKUP')}
                    className="flex-[2] bg-gray-900 text-white rounded-xl py-3 px-4 font-bold text-sm shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:bg-gray-800 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    Accept Trip <FiCheckCircle size={18} className="opacity-90" />
                  </button>
                </div>
              ) : currentTrip.status === 'IN_PROGRESS' ? (
                <div className="flex flex-col gap-2 w-full">
                  <button 
                    onClick={() => advanceStatus()}
                    className="w-full bg-gray-900 text-white rounded-xl py-3 px-4 font-bold text-sm shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:bg-gray-800 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    <span>Complete Dropoff (Stay Online)</span>
                    <FiCheckCircle size={18} className="opacity-80" />
                  </button>
                  <button 
                    onClick={async () => {
                      await advanceStatus();
                      if (onDuty) await toggleDuty();
                    }}
                    className="w-full bg-white text-gray-700 border border-gray-200 rounded-xl py-3 px-4 font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    <span>Complete & Take a Break</span>
                    <FiPower size={18} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => advanceStatus()}
                  className="w-full bg-gray-900 text-white rounded-xl py-3 px-4 font-bold text-sm shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:bg-gray-800 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  <span>{getStatusText(currentTrip.status)}</span>
                  <FiCheckCircle size={18} className="opacity-80" />
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
