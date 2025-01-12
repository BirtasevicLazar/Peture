import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    salon_name: '',
    address: '',
    city: '',
    phone: ''
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
  const [step, setStep] = useState(1);
  const [finalStepErrors, setFinalStepErrors] = useState({});
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const validationMessages = {
    length: 'Najmanje 8 karaktera',
    uppercase: 'Jedno veliko slovo',
    lowercase: 'Jedno malo slovo',
    number: 'Jedan broj',
    special: 'Jedan specijalni karakter (@$!%*?&)',
    match: 'Lozinke se poklapaju'
  };

  const stepTitles = [
    "Osnovni podaci",
    "Podaci o salonu",
    "Verifikacija"
  ];

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validatePassword = useCallback((password, confirmation) => {
    const validations = {
      length: password && password.length >= 8,
      uppercase: password && /[A-Z]/.test(password),
      lowercase: password && /[a-z]/.test(password),
      number: password && /[0-9]/.test(password),
      special: password && /[@$!%*?&]/.test(password),
      match: password && confirmation && password === confirmation
    };
    setPasswordValidation(validations);
    return Object.values(validations).every(Boolean);
  }, []);

  useEffect(() => {
    setEmailError('');
    setGeneralError('');
  }, [step]);

  const isFormValid = useCallback(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-Z\s]+$/;

    return (
      formData.name && 
      formData.name.length <= 55 &&
      nameRegex.test(formData.name) &&
      formData.email &&
      emailRegex.test(formData.email) &&
      Object.values(passwordValidation).every(Boolean)
    );
  }, [formData.name, formData.email, passwordValidation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const sanitizedValue = (() => {
      switch (name) {
        case 'name':
          return value.replace(/[^a-zA-Z\s]/g, '').slice(0, 55);
        case 'phone':
          return value.replace(/[^0-9+\-\s]/g, '').slice(0, 20);
        case 'email':
          return value.toLowerCase().trim();
        default:
          return value;
      }
    })();

    setFormData(prev => {
      const newData = { ...prev, [name]: sanitizedValue };
      
      if (name === 'email') {
        setEmailError('');
      }
      if (name === 'password' || name === 'password_confirmation') {
        validatePassword(
          name === 'password' ? sanitizedValue : newData.password,
          name === 'password_confirmation' ? sanitizedValue : newData.password_confirmation
        );
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timer > 0 || !isFormValid()) return;

    try {
      setGeneralError('');
      setEmailError('');
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/register`, formData);
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (error) {
      const errorResponse = error.response;
      
      if (!errorResponse) {
        setGeneralError('Greška u povezivanju sa serverom. Proverite vašu internet konekciju.');
        return;
      }

      switch (errorResponse.status) {
        case 429:
          setTimer(30);
          setGeneralError('Previše pokušaja. Pokušajte ponovo za');
          break;
        case 422:
          if (errorResponse.data.errors?.email) {
            setEmailError(errorResponse.data.errors.email[0]);
          } else {
            setGeneralError('Proverite unete podatke i pokušajte ponovo.');
          }
          break;
        case 500:
          setGeneralError('Došlo je do greške na serveru. Pokušajte ponovo kasnije.');
          break;
        default:
          setGeneralError('Došlo je do neočekivane greške. Pokušajte ponovo.');
      }
    }
  };

  const canProgressToNextStep = useCallback(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-Z\s]+$/;

    switch(step) {
      case 1:
        return (
          formData.name &&
          formData.name.length <= 55 &&
          nameRegex.test(formData.name) &&
          formData.email &&
          emailRegex.test(formData.email)
        );
      case 2:
        return (
          formData.salon_name &&
          formData.salon_name.length <= 100 &&
          formData.address &&
          formData.address.length <= 255 &&
          formData.city &&
          formData.city.length <= 100 &&
          formData.phone &&
          formData.phone.length <= 20
        );
      case 3:
        return Object.values(passwordValidation).every(Boolean);
      default:
        return false;
    }
  }, [step, formData, passwordValidation]);

  const nextStep = useCallback(() => {
    if (step < 3 && canProgressToNextStep()) {
      setStep(prev => prev + 1);
    }
  }, [step, canProgressToNextStep]);

  const prevStep = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  }, [step]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Registracija
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Korak {step} od 3: {stepTitles[step-1]}
          </p>
          
          <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${(step/3)*100}%` }}
            />
          </div>
        </div>

        {generalError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p>{generalError} {timer > 0 ? `${timer} sekundi` : ''}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Ime i prezime
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
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
                  value={formData.email}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                  placeholder="vasa@email.com"
                  onChange={handleChange}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label htmlFor="salon_name" className="block text-sm font-medium text-gray-700">
                  Ime salona
                </label>
                <input
                  id="salon_name"
                  name="salon_name"
                  type="text"
                  value={formData.salon_name}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                  placeholder="Unesite ime salona"
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Adresa
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    placeholder="Unesite adresu"
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    Grad
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    placeholder="Unesite grad"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Broj telefona
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                  placeholder="Unesite broj telefona"
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              {emailError && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-center gap-3 animate-fade-in">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-red-700 font-medium">{emailError}</p>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                    >
                      Kliknite ovde da promenite email adresu
                    </button>
                  </div>
                </div>
              )}
              
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
              </div>
            </div>
          )}

          <div className="flex justify-between space-x-4 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition duration-150"
              >
                Nazad
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProgressToNextStep()}
                className={`flex-1 py-3 px-4 rounded-lg text-white transition duration-150 
                  ${canProgressToNextStep() 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
                    : 'bg-gray-400 cursor-not-allowed'}`}
              >
                Dalje
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isFormValid() || timer > 0}
                className={`flex-1 py-3 px-4 rounded-lg text-white transition duration-150 
                  ${isFormValid() && !timer > 0
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
                    : 'bg-gray-400 cursor-not-allowed'}`}
              >
                {timer > 0 ? `Sačekajte ${timer}s` : 'Registrujte se'}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Već imate nalog?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150">
            Prijavite se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
