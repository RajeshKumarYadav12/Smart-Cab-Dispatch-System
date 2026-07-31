import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success(`Welcome back, ${data.user.name}`);
      
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'driver') navigate('/driver');
      else {
        toast.error('Guests must use the Guest App');
        localStorage.removeItem('user');
        
        try {
          await fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (e) {
          
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="glass-card w-full max-w-md p-8 shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-violet-600">Staff Portal</h1>
          <p className="text-gray-500 mt-2">ApnaRide Dispatch System</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="admin@dispatch.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary w-full mt-6"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/register" className="text-brand-600 hover:underline">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
}
