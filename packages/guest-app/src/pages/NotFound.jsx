import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <FiAlertCircle className="text-red-500 text-5xl" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Oops! We couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-full shadow-[0_10px_20px_rgba(20,184,166,0.2)] transition-all flex items-center gap-2"
      >
        <FiArrowLeft /> Back to Home
      </button>
    </div>
  );
}
