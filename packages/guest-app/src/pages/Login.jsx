import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth } from '../api/client';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('user')) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchWithAuth('/auth/login', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight text-brand-600">
            ApnaRide
          </h1>
          <p className="text-gray-500 mt-2">Smart Cab Dispatch System</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="guest@dispatch.com"
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
          <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium text-sm">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
}
