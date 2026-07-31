export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const toRadians = (deg) => (deg * Math.PI) / 180;
  
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
};

export const estimateEtaFallback = (lat1, lon1, lat2, lon2) => {
  const distanceMeters = haversineDistance(lat1, lon1, lat2, lon2);
  const speedMetersPerSec = (30 * 1000) / 3600; 
  return Math.round(distanceMeters / speedMetersPerSec);
};
