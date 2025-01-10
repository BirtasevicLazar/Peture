import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    if (timer > 0) {
        return;
    }
    
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/login`, formData);
        localStorage.setItem('token', response.data.access_token);
        navigate('/dashboard');
    } catch (error) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Prijava
          </h2>
          <p className="text-sm text-gray-600">
            Dobrodošli nazad! Prijavite se na svoj nalog
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-center">
            <span className="mr-2">⚠️</span>
            <p>{error} {timer > 0 ? `${timer} sekundi` : ''}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email adresa
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                placeholder="vasa@email.com"
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Lozinka
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                placeholder="Unesite lozinku"
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={timer > 0}
            className={`w-full flex justify-center py-3 px-4 rounded-lg text-white text-sm font-semibold transition duration-150 ${
              timer > 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {timer > 0 ? `Sačekajte ${timer}s` : 'Prijavite se'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Nemate nalog?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150">
              Registrujte se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
