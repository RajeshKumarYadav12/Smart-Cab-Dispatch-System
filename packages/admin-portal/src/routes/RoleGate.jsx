import { Navigate } from 'react-router-dom';

export default function RoleGate({ allowedRoles, children }) {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (!allowedRoles.includes(user.role)) {
      
      if (user.role === 'admin') return <Navigate to="/admin" replace />;
      if (user.role === 'driver') return <Navigate to="/driver" replace />;
      return <Navigate to="/login" replace />;
    }
    return children;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
}
