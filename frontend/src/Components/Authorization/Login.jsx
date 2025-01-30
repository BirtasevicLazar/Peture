import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timer > 0) return;
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/login`, formData);
      
      // Čuvanje tokena i user podataka
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('user_id', response.data.user.id);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error); // Dodajemo logging
      if (error.response?.status === 429) {
        setTimer(30);
        setError('Previše pokušaja. Pokušajte ponovo za');
      } else if (error.response?.status === 401) {
        setError(error.response.data.message || 'Pogrešni podaci za prijavu');
      } else {
        setError('Došlo je do greške prilikom prijave');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-normal text-gray-900 mb-2">
            Dobrodošli nazad
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Prijavite se na svoj nalog
          </p>
          
          <div className="w-full h-1 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full mb-8" />
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 font-normal">
              {error} {timer > 0 ? `${timer} sekundi` : ''}
            </p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-normal text-gray-700">
                Email adresa
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500 transition duration-150"
                placeholder="vasa@email.com"
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-normal text-gray-700">
                Lozinka
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500 transition duration-150"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={timer > 0}
              className={`w-full py-3 px-4 rounded-lg text-white text-sm font-normal transition duration-150 
                ${timer > 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600'
                }`}
            >
              {timer > 0 ? `Sačekajte ${timer}s` : 'Prijavite se'}
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={(e) => setFormData({...formData, remember: e.target.checked})}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Zapamti me
              </label>
            </div>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              ili
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600">
          Nemate nalog?{' '}
          <Link to="/register" className="font-normal text-green-600 hover:text-green-500 transition duration-150">
            Registrujte se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
