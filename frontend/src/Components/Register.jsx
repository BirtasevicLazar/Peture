import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [timer, setTimer] = useState(0);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false
  });
  const navigate = useNavigate();

  const validationMessages = {
    length: 'Najmanje 8 karaktera',
    uppercase: 'Jedno veliko slovo',
    lowercase: 'Jedno malo slovo',
    number: 'Jedan broj',
    special: 'Jedan specijalni karakter (@$!%*?&)',
    match: 'Lozinke se poklapaju'
  };

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validatePassword = (password, confirmation) => {
    const validations = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password),
      match: password === confirmation && password !== ''
    };
    setPasswordValidation(validations);
    return Object.values(validations).every(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'password') {
        validatePassword(value, newData.password_confirmation);
      }
      if (name === 'password_confirmation') {
        validatePassword(newData.password, value);
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timer > 0) {
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/register`, formData);
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 429) {
        setTimer(30);
        setGeneralError('Previše pokušaja. Pokušajte ponovo za');
        setErrors({});
      } else if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        setGeneralError('');
      } else {
        setGeneralError(error.response?.data?.message || 'Došlo je do greške');
        setErrors({});
      }
    }
  };

  const isFormValid = () => {
    return formData.name && 
           formData.email && 
           Object.values(passwordValidation).every(Boolean);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Registracija
          </h2>
          <p className="text-sm text-gray-600">
            Kreirajte svoj nalog i pridružite se našoj zajednici
          </p>
        </div>
        
        {generalError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p>{generalError} {timer > 0 ? `${timer} sekundi` : ''}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Ime i prezime
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                placeholder="Unesite ime i prezime"
                onChange={handleChange}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

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
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-2">⚠️</span>
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </p>
              )}
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
              <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2">
                {Object.entries(passwordValidation).map(([key, value]) => (
                  <p key={key} className={`text-sm flex items-center ${value ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{value ? '✓' : '○'}</span>
                    {validationMessages[key]}
                  </p>
                ))}
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                Potvrdite lozinku
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                required
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                placeholder="Ponovite lozinku"
                onChange={handleChange}
              />
              {formData.password_confirmation && (
                <p className={`text-xs mt-1 flex items-center ${passwordValidation.match ? 'text-green-500' : 'text-red-500'}`}>
                  {passwordValidation.match ? '✓' : '✗'} Lozinke se poklapaju
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid() || timer > 0}
            className={`w-full flex justify-center py-3 px-4 rounded-lg text-white text-sm font-semibold transition duration-150 ${
              !isFormValid() || timer > 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {timer > 0 ? `Sačekajte ${timer}s` : 'Registrujte se'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Već imate nalog?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150">
              Prijavite se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
