import { env } from '../../config/env.js';
import { estimateEtaFallback, haversineDistance } from '../../../../shared/utils/geo.js';

export const getDistanceMatrix = async (origins, destinations) => {
  
  if (!env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key') {
    return origins.map(orig => {
      return destinations.map(dest => {
        const distance = Math.round(haversineDistance(orig.lat, orig.lng, dest.lat, dest.lng));
        const duration = estimateEtaFallback(orig.lat, orig.lng, dest.lat, dest.lng);
        return {
          distance: { value: distance },
          duration: { value: duration }
        };
      });
    });
  }

  const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
  const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
  
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&key=${env.GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.warn(`Distance Matrix API returned status: ${data.status}. Using fallback.`);
      throw new Error(`Distance Matrix API Error: ${data.status}`);
    }
    
    return data.rows.map(row => 
      row.elements.map(el => {
        if (el.status !== 'OK') {
          return { distance: { value: 999999 }, duration: { value: 999999 } };
        }
        return {
          distance: el.distance, 
          duration: el.duration
        };
      })
    );
  } catch (error) {
    console.error(`Distance Matrix integration failed: ${error.message}`);
    
    return origins.map(orig => {
      return destinations.map(dest => {
        const distance = Math.round(haversineDistance(orig.lat, orig.lng, dest.lat, dest.lng));
        const duration = estimateEtaFallback(orig.lat, orig.lng, dest.lat, dest.lng);
        return {
          distance: { value: distance },
          duration: { value: duration }
        };
      });
    });
  }
};
