import { Trip } from '../../models/Trip.js';
import { Driver } from '../../models/Driver.js';

export const getOverview = async (req, res) => {
  try {
    const activeTripsCount = await Trip.countDocuments({ status: { $in: ['ASSIGNED', 'DRIVER_EN_ROUTE_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'GUEST_ONBOARD', 'IN_PROGRESS'] } });
    const totalDriversCount = await Driver.countDocuments();
    const onlineDriversCount = await Driver.countDocuments({ onDuty: true });

    const onDemandRequestsCount = await Trip.countDocuments({ isOnDemand: true, status: 'PENDING_APPROVAL' });
    const unassignableCount = await Trip.countDocuments({ status: 'PENDING_ASSIGNMENT' });
    
    res.json({
      activeTrips: activeTripsCount,
      driversOnline: `${onlineDriversCount}/${totalDriversCount}`,
      onDemandRequests: onDemandRequestsCount,
      unassignable: unassignableCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
