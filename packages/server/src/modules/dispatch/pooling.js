import { haversineDistance } from '../../../../shared/utils/geo.js';

export const clusterTrips = (trips, maxTimeDiffMinutes = 15, maxGeoDiffMeters = 2000) => {
  const pools = [];
  const visited = new Set();
  
  for (let i = 0; i < trips.length; i++) {
    if (visited.has(i)) continue;
    
    const baseTrip = trips[i];
    const currentPool = [baseTrip];
    visited.add(i);
    
    for (let j = i + 1; j < trips.length; j++) {
      if (visited.has(j)) continue;
      const candidateTrip = trips[j];

      const distance = haversineDistance(
        baseTrip.destination.geo.lat, baseTrip.destination.geo.lng,
        candidateTrip.destination.geo.lat, candidateTrip.destination.geo.lng
      );
      
      if (distance > maxGeoDiffMeters) continue;

      const timeDiff = Math.abs(new Date(baseTrip.requestedAt).getTime() - new Date(candidateTrip.requestedAt).getTime());
      if (timeDiff > maxTimeDiffMinutes * 60 * 1000) continue;
      
      currentPool.push(candidateTrip);
      visited.add(j);
    }
    
    pools.push(currentPool);
  }
  
  return pools;
};
