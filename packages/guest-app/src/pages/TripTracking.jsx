import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMapPin, FiNavigation, FiArrowLeft, FiClock, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useTripSocket } from '../sockets/useTripSocket';
import { useTripStore } from '../store/tripStore';

export default function TripTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  useTripSocket(id);
  
  const { currentTrip, driverLocation, eta, setTrip } = useTripStore();
  const [mapsApiKey, setMapsApiKey] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  useEffect(() => {
    import('../api/client').then(({ fetchWithAuth }) => {
      fetchWithAuth('/config/maps')
        .then(data => setMapsApiKey(data.apiKey))
        .catch(err => console.error(err));
        
      if (!currentTrip || currentTrip._id !== id) {
        fetchWithAuth(`/trip/${id}`)
          .then(data => setTrip(data))
          .catch(err => console.error(err));
      }
    });
  }, [id, currentTrip, setTrip]);

  useEffect(() => {
    if (!mapsApiKey || !currentTrip || !mapRef.current) return;

    const updateRoute = () => {
      if (!window.google) return;
      
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          zoom: 14,
          center: { lat: 12.9716, lng: 77.5946 }, 
          disableDefaultUI: true,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
          ]
        });

        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: false,
          polylineOptions: { strokeColor: '#14b8a6', strokeWeight: 5 }
        });
      }
      
      let routeOrigin = { lat: parseFloat(currentTrip.origin?.geo?.lat), lng: parseFloat(currentTrip.origin?.geo?.lng) };
      let routeDest = { lat: parseFloat(currentTrip.destination?.geo?.lat), lng: parseFloat(currentTrip.destination?.geo?.lng) };

      if (isNaN(routeOrigin.lat) || isNaN(routeOrigin.lng) || isNaN(routeDest.lat) || isNaN(routeDest.lng)) {
        console.error("Invalid coordinates for guest tracking", { routeOrigin, routeDest });
        return;
      }

      if (Math.abs(routeOrigin.lat - routeDest.lat) < 0.0001 && Math.abs(routeOrigin.lng - routeDest.lng) < 0.0001) {
        mapInstanceRef.current.setCenter(routeOrigin);
        mapInstanceRef.current.setZoom(16);
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
  }, [mapsApiKey, currentTrip?._id, currentTrip?.origin?.geo?.lat, currentTrip?.origin?.geo?.lng, currentTrip?.destination?.geo?.lat, currentTrip?.destination?.geo?.lng]);

  if (!currentTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 font-semibold tracking-wide">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  const isPendingApproval = currentTrip.status === 'PENDING_APPROVAL' || currentTrip.status === 'REQUESTED';
  const isFindingDriver = currentTrip.status === 'PENDING_ASSIGNMENT';
  const hasDriver = ['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(currentTrip.status);

  return (
    <div className="relative min-h-screen flex flex-col w-full mx-auto bg-gray-100 overflow-hidden font-sans">
      
      {}
      <div ref={mapRef} className="absolute inset-0 z-0" id="track-map">
        {!mapsApiKey && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        )}
      </div>

      {}
      <header className="absolute top-0 left-0 w-full z-10 p-4 pt-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate('/')} 
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-800 hover:bg-gray-50 transition-colors pointer-events-auto"
        >
          <FiArrowLeft size={24} />
        </button>
        {isPendingApproval && (
          <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-bold shadow-md pointer-events-auto flex items-center gap-2 text-sm">
            <FiInfo size={16} /> Awaiting Approval
          </div>
        )}
      </header>

      {}
      <div className="absolute bottom-0 left-0 w-full z-20 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] animate-slide-up pb-4 pt-2">
        {}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2"></div>

        <div className="px-5">
          {}
          {isPendingApproval && (
            <div className="mb-3 flex items-center gap-3 bg-amber-50 p-3 rounded-2xl border border-amber-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <FiClock className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Request Sent to Coordinator</h3>
                <p className="text-amber-800 text-xs font-medium mt-0.5">Waiting for admin approval before assigning a driver.</p>
              </div>
            </div>
          )}

          {isFindingDriver && (
            <div className="mb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <div className="w-5 h-5 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Finding your driver...</h3>
                <p className="text-gray-500 text-xs font-medium">Connecting to the nearest captain</p>
              </div>
            </div>
          )}

          {hasDriver && currentTrip.driverId && (
            <div className="mb-3 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-yellow-400 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                      <span className="text-xl font-black text-yellow-900">{currentTrip.driverId.userId?.name?.charAt(0) || 'D'}</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                      <FiCheckCircle size={8} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{currentTrip.driverId.userId?.name || 'Captain Assigned'}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                        {currentTrip.driverId.vehicle?.plateNumber || 'KA-01-AB-1234'}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500">• {currentTrip.driverId.vehicle?.type || 'Sedan'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center bg-gray-50 rounded-2xl px-3 py-1.5 border border-gray-100">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">ETA</p>
                  <div className="text-xl font-black text-gray-900">
                    {eta ? `${Math.ceil(eta / 60)}` : '--'}
                    <span className="text-xs font-bold text-gray-500 ml-1">min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          <div className="w-full h-px bg-gray-100 mb-3"></div>

          {}
          <div className="space-y-3 relative pl-2">
            <div className="flex gap-3 items-start relative z-10">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm z-10 mt-1"></div>
                <div className="w-px h-8 bg-gray-200 absolute top-4 left-[5px] -z-10"></div>
              </div>
              <div className="-mt-0.5 w-full">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pickup</p>
                <p className="font-semibold text-gray-900 text-base leading-tight break-words">{currentTrip.origin.label}</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start relative z-10">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm z-10 mt-1"></div>
              </div>
              <div className="-mt-0.5 w-full">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dropoff</p>
                <p className="font-semibold text-gray-900 text-base leading-tight break-words">{currentTrip.destination.label}</p>
              </div>
            </div>
          </div>
          
          {}
          {hasDriver && (
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl transition-colors text-sm">
                Share Trip
              </button>
              <button className="w-12 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition-colors">
                <FiInfo size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
