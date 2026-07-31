import { useState, useEffect } from 'react';
import { FiUsers, FiTruck, FiAlertCircle, FiBarChart2, FiNavigation, FiCheck, FiMapPin, FiClock, FiPhone } from 'react-icons/fi';
import { fetchWithAuth } from '../../api/client';
import { toast } from 'sonner';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [statsData, setStatsData] = useState({
    activeTrips: 0,
    driversOnline: '0/0',
    onDemandRequests: 0,
    unassignable: 0
  });
  
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [guests, setGuests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: '', email: '', phone: '', vehicleNumber: '', seatCapacity: 4, luggageCapacity: 2, vehicleType: 'Sedan' });
  
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestForm, setGuestForm] = useState(null);

  const loadData = async () => {
    try {
      const [stats, drvRes, tripRes, guestRes] = await Promise.all([
        fetchWithAuth('/stats/overview'),
        fetchWithAuth('/driver'),
        fetchWithAuth('/trip'),
        fetchWithAuth('/guest')
      ]);
      setStatsData(stats);
      setDrivers(drvRes);
      setTrips(tripRes);
      setGuests(guestRes);
      setPendingRequests(tripRes.filter(t => t.status === 'PENDING_APPROVAL' || t.status === 'REQUESTED'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id) => {
    try {
      setPendingRequests(prev => prev.filter(r => r._id !== id));
      await fetchWithAuth(`/trip/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PENDING_ASSIGNMENT' })
      });
      toast.success('Trip approved. Dispatch engine will assign a driver soon.');
      loadData();
    } catch (err) {
      toast.error('Failed to approve trip');
      loadData(); 
    }
  };

  const handleDecline = async (id) => {
    try {
      await fetchWithAuth(`/trip/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED', cancellationReason: 'Declined by Admin' })
      });
      toast.success('Trip declined.');
      loadData();
    } catch (err) {
      toast.error('Failed to decline trip');
    }
  };

  const handleOnboardDriver = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/driver/onboard', {
        method: 'POST',
        body: JSON.stringify(driverForm)
      });
      toast.success(`Driver ${res.driver.userId?.name || driverForm.name} onboarded! Default password: ${res.defaultPassword}`);
      setShowDriverModal(false);
      setDriverForm({ name: '', email: '', phone: '', vehicleNumber: '', seatCapacity: 4, luggageCapacity: 2, vehicleType: 'Sedan' });
      loadData();
    } catch (err) {
      toast.error('Failed to onboard driver: ' + err.message);
    }
  };

  const handleUpdateGuest = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`/guest/${guestForm._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ partySize: guestForm.partySize, luggageCount: guestForm.luggageCount })
      });
      toast.success('Guest details updated successfully');
      setShowGuestModal(false);
      loadData();
    } catch (err) {
      toast.error('Failed to update guest');
    }
  };

  const stats = [
    { label: 'Active Trips', value: statsData.activeTrips, icon: FiNavigation, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Drivers Online', value: statsData.driversOnline, icon: FiTruck, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'On-Demand Requests', value: pendingRequests.length, icon: FiUsers, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Unassignable', value: statsData.unassignable, icon: FiAlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const getTabIcon = (tab) => {
    switch(tab) {
      case 'overview': return <FiBarChart2 size={18} />;
      case 'trips': return <FiNavigation size={18} />;
      case 'drivers': return <FiTruck size={18} />;
      case 'guests': return <FiUsers size={18} />;
      case 'on_demand': return <FiUsers size={18} />;
      default: return <FiBarChart2 size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex">
      {}
      <aside className="w-64 shrink-0 pr-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <FiMapPin className="text-brand-500" />
          Ops Center
        </h1>
        <nav className="space-y-2">
          {['overview', 'trips', 'drivers', 'guests', 'on_demand'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-brand-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getTabIcon(tab)}
              <span className="capitalize">{tab.replace('_', ' ')}</span>
              {tab === 'on_demand' && pendingRequests.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiAlertCircle size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {}
      <main className="flex-1">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold capitalize text-gray-800">{activeTab.replace('_', ' ')}</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Updates Active
            </span>
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shadow-sm">
              A
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {}
            <div className="grid grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="glass-card p-6 flex items-start gap-4 transition-transform hover:-translate-y-1">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-sm`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <FiAlertCircle className="text-amber-500" /> Requires Attention
              </h3>
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">No pending requests at the moment.</p>
                ) : (
                  pendingRequests.slice(0, 3).map(req => (
                    <div key={req._id} className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="badge bg-purple-100 text-purple-700 mb-2 font-semibold text-xs">On-Demand Request</span>
                        <p className="font-medium text-gray-900 text-lg">Guest: {req.guestIds?.[0]?.userId?.name || 'Guest'} (Party of {req.guestIds?.length || 1})</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <FiNavigation className="text-purple-400"/>
                          To: {req.destination?.label}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleDecline(req._id)} className="btn-secondary text-gray-600 py-2 hover:bg-white transition-colors">Decline</button>
                        <button onClick={() => handleApprove(req._id)} className="btn-primary py-2 px-6 shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                          <FiCheck /> Approve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Fleet Roster</h3>
              <button 
                onClick={() => setShowDriverModal(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                + Onboard Driver
              </button>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Driver Name</th>
                  <th className="pb-3 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Phone</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium text-gray-900">{d.userId?.name}</td>
                    <td className="py-4 text-gray-600 flex items-center gap-2">
                      <FiTruck className="text-gray-400"/>
                      {d.vehicle?.plateNumber} ({d.vehicle?.type})
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        d.status === 'offline' ? 'bg-gray-100 text-gray-600' :
                        d.status === 'online_idle' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {d.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 text-gray-600">{d.userId?.phone}</td>
                  </tr>
                ))}
                {drivers.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-8 text-gray-500">No drivers registered.</td></tr>
                )}
              </tbody>
            </table>
            
            {showDriverModal && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-xl font-bold mb-4">Onboard New Driver</h3>
                  <form onSubmit={handleOnboardDriver} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                      <input required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-2" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input required type="email" className="w-full border border-gray-300 rounded-xl px-4 py-2" value={driverForm.email} onChange={e => setDriverForm({...driverForm, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input required type="tel" className="w-full border border-gray-300 rounded-xl px-4 py-2" value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Plate Number</label>
                      <input required type="text" className="w-full border border-gray-300 rounded-xl px-4 py-2" value={driverForm.vehicleNumber} onChange={e => setDriverForm({...driverForm, vehicleNumber: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seat Capacity</label>
                        <input type="number" min="1" className="w-full border border-gray-300 rounded-xl px-4 py-2" value={driverForm.seatCapacity} onChange={e => setDriverForm({...driverForm, seatCapacity: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Luggage Capacity</label>
                        <input type="number" min="0" className="w-full border border-gray-300 rounded-xl px-4 py-2" value={driverForm.luggageCapacity} onChange={e => setDriverForm({...driverForm, luggageCapacity: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setShowDriverModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-xl transition-colors">Cancel</button>
                      <button type="submit" className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-xl transition-colors shadow-md">Create Profile</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="glass-card p-6 animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Guest Manifest</h3>
            </div>
            
            <div className="grid gap-4">
              {guests.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">No guests registered.</p>
              ) : (
                guests.map(g => (
                  <div key={g._id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{g.userId?.name} <span className="text-sm font-normal text-gray-500">({g.userId?.email})</span></p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span><FiPhone className="inline mr-1" />{g.userId?.phone}</span>
                        <span><FiUsers className="inline mr-1" />Party of {g.partySize}</span>
                        <span>Luggage: {g.luggageCount}</span>
                      </div>
                    </div>
                    <button onClick={() => { setGuestForm(g); setShowGuestModal(true); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
                      Edit Details
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {showGuestModal && guestForm && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-xl font-bold mb-4">Edit Guest Details</h3>
                  <form onSubmit={handleUpdateGuest} className="space-y-4">
                    <p className="text-sm text-gray-500 mb-2">Guest: <span className="font-bold text-gray-800">{guestForm.userId?.name}</span></p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
                        <input type="number" min="1" className="w-full border border-gray-300 rounded-xl px-4 py-2" value={guestForm.partySize} onChange={e => setGuestForm({...guestForm, partySize: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Luggage</label>
                        <input type="number" min="0" className="w-full border border-gray-300 rounded-xl px-4 py-2" value={guestForm.luggageCount} onChange={e => setGuestForm({...guestForm, luggageCount: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setShowGuestModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-xl transition-colors">Cancel</button>
                      <button type="submit" className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-xl transition-colors shadow-md">Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'trips' && (
          <div className="glass-card p-6 animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Trip ID</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Driver</th>
                  <th className="pb-3 font-medium">Route</th>
                  <th className="pb-3 font-medium text-right">Actions (Manual Override)</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(t => (
                  <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-mono text-xs text-gray-500">#{t._id.slice(-6)}</td>
                    <td className="py-4">
                      <span className="badge bg-brand-50 text-brand-700 text-xs font-semibold">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 text-gray-900 font-medium">{t.driverId?.userId?.name || 'Unassigned'}</td>
                    <td className="py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[150px]">{t.origin?.label}</span>
                        <FiNavigation className="text-gray-300 shrink-0"/>
                        <span className="truncate max-w-[150px]">{t.destination?.label}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleDecline(t._id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold">Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {trips.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 text-gray-500">No active trips.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'on_demand' && (
          <div className="glass-card p-6 animate-fade-in space-y-4">
             {pendingRequests.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">No pending on-demand requests.</p>
              ) : (
                pendingRequests.map(req => (
                  <div key={req._id} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="badge bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-wider">Pending Approval</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><FiClock/> {new Date(req.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-xl mb-1">Guest: {req.guestIds?.[0]?.userId?.name || 'Guest'} (Party of {req.guestIds?.length || 1})</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiMapPin className="text-gray-400"/>
                        <span>{req.origin?.label}</span>
                        <span className="text-gray-300">→</span>
                        <span className="font-medium text-gray-800">{req.destination?.label}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleDecline(req._id)} className="btn-secondary text-gray-600 px-6 py-2.5 font-medium hover:bg-gray-100">Decline</button>
                      <button onClick={() => handleApprove(req._id)} className="btn-primary px-8 py-2.5 font-medium shadow-md hover:shadow-lg flex items-center gap-2">
                        <FiCheck strokeWidth={3}/> Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
          </div>
        )}

      </main>
    </div>
  );
}
