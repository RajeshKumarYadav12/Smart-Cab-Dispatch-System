import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleGate from './routes/RoleGate';
import Dashboard from './pages/admin/Dashboard';
import MyTrip from './pages/driver/MyTrip';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen font-sans text-gray-900 flex flex-col">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/admin/*" element={
            <RoleGate allowedRoles={['admin']}>
              <Dashboard />
            </RoleGate>
          } />
          
          <Route path="/driver/*" element={
            <RoleGate allowedRoles={['driver']}>
              <MyTrip />
            </RoleGate>
          } />

          {}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
