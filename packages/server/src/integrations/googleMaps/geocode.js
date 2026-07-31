import { env } from '../../config/env.js';

export const geocodeAddress = async (address) => {
  if (!env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key') {
    console.warn('Google Maps API key missing. Returning dummy geocode data.');
    return { lat: 40.7128, lng: -74.0060 }; 
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${env.GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' || data.results.length === 0) {
      throw new Error(`Geocoding failed for address: ${address}`);
    }
    
    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  } catch (error) {
    console.error(`Geocoding error: ${error.message}`);
    throw error;
  }
};
