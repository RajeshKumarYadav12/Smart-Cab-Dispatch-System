import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { FiMap, FiClock, FiPackage, FiGlobe, FiUser } from 'react-icons/fi';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import TripTracking from './pages/TripTracking';
import RequestRide from './pages/RequestRide';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) return <Navigate to="/login" />;
  return children;
};

const BottomNav = () => {
  const location = useLocation();
  const hideOnPaths = ['/login', '/register', '/track', '/request'];
  
  if (hideOnPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const navItems = [
    { name: 'Ride', icon: FiMap, path: '/' },
    { name: 'Ownly', icon: FiClock, path: '/ownly' },
    { name: 'Parcel', icon: FiPackage, path: '/parcel' },
    { name: 'Travel', icon: FiGlobe, path: '/travel' },
    { name: 'Profile', icon: FiUser, path: '/profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe pt-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50 rounded-t-3xl">
      <div className="flex justify-around items-center px-2 pb-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all duration-300 ${isActive ? 'text-brand-600 scale-110 -translate-y-1' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isActive ? 'bg-brand-50' : 'bg-transparent'}`}>
                <Icon size={22} className={isActive ? 'drop-shadow-md' : ''} />
                {isActive && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-500"></div>}
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-brand-700' : 'text-gray-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden font-sans pb-24">
      {children}
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" theme="dark" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
        <Route path="/track/:id" element={<ProtectedRoute><TripTracking /></ProtectedRoute>} />
        <Route path="/request" element={<ProtectedRoute><Layout><RequestRide /></Layout></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
