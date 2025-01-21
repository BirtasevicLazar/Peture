import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BookingPage = () => {
  const { salonId } = useParams();
  const [step, setStep] = useState(1);
  const [salon, setSalon] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Dodajemo funkcije za drag scroll
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef(null);

  // Dodajemo state za praćenje scroll pozicije
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(100);

  useEffect(() => {
    fetchSalonData();
  }, [salonId]);

  useEffect(() => {
    if (selectedWorker) {
      setServices(selectedWorker.services);
      setSelectedService(null);
      setSelectedTime(null);
    }
  }, [selectedWorker]);

  useEffect(() => {
    if (selectedWorker && selectedService && selectedDate) {
      fetchAvailableAppointments();
    }
  }, [selectedWorker, selectedService, selectedDate]);

  // Dodajemo useEffect za praćenje scroll pozicije
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const element = scrollRef.current;
        const scrollLeft = element.scrollLeft;
        const maxScroll = element.scrollWidth - element.clientWidth;
        const progress = (scrollLeft / maxScroll) * 100;
        const width = (element.clientWidth / element.scrollWidth) * 100;
        
        setScrollProgress(progress || 0);
        setScrollWidth(width || 100);
      }
    };

    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      handleScroll(); // Inicijalno postavljanje
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [appointments]); // Dodajemo appointments kao dependency da bi se ažuriralo kada se učitaju novi termini

  const showError = (message) => {
    setApiError(message);
    setTimeout(() => setApiError(null), 5000);
  };

  const fetchSalonData = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/salon/${salonId}`);
      
      if (!response.data) {
        throw new Error('Salon nije pronađen');
      }
      
      setSalon(response.data);
      setWorkers(response.data.workers || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        'Došlo je do greške prilikom učitavanja podataka o salonu';
      showError(errorMessage);
      setSalon(null);
      setWorkers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableAppointments = async () => {
    if (!selectedWorker || !selectedService || !selectedDate) return;

    try {
      setIsLoading(true);
      setApiError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/appointments/available`, {
        params: {
          worker_id: selectedWorker.id,
          service_id: selectedService.id,
          date: selectedDate.toISOString().split('T')[0]
        }
      });
      
      setAppointments(response.data || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        'Došlo je do greške prilikom učitavanja dostupnih termina';
      showError(errorMessage);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      setErrors({});

      if (!selectedWorker || !selectedService || !selectedTime || 
          !formData.customer_name || !formData.customer_email || !formData.customer_phone) {
        throw new Error('Molimo popunite sva obavezna polja');
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/appointments/book`, {
        worker_id: selectedWorker.id,
        service_id: selectedService.id,
        start_time: `${selectedTime.date} ${selectedTime.start_time}`,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone
      });

      setBookingSuccess(true);
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors || {};
        setErrors({
          customer_name: validationErrors.customer_name?.[0],
          customer_email: validationErrors.customer_email?.[0],
          customer_phone: validationErrors.customer_phone?.[0],
          submit: 'Molimo ispravite greške u formi'
        });
      } else if (error.response?.status === 409) {
        showError('Izabrani termin je već zauzet. Molimo izaberite drugi termin.');
        setSelectedTime(null);
        await fetchAvailableAppointments();
      } else if (error.response?.status === 404) {
        showError('Radnik ili usluga više nisu dostupni');
      } else {
        showError(error.response?.data?.message || 'Došlo je do greške prilikom zakazivanja termina');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^(\+381|0)[\d]{8,10}$/;
    return re.test(phone.replace(/\s+/g, ''));
  };

  const validateStep = () => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!selectedWorker) {
          newErrors.worker = 'Molimo vas da izaberete radnika';
        }
        break;
      case 2:
        if (!selectedService) {
          newErrors.service = 'Molimo vas da izaberete uslugu';
        }
        break;
      case 3:
        if (!selectedTime) {
          newErrors.time = 'Molimo vas da izaberete termin';
        }
        break;
      case 4:
        if (!formData.customer_name?.trim()) {
          newErrors.customer_name = 'Ime i prezime su obavezni';
        }
        if (!formData.customer_email?.trim()) {
          newErrors.customer_email = 'Email adresa je obavezna';
        } else if (!validateEmail(formData.customer_email)) {
          newErrors.customer_email = 'Unesite ispravnu email adresu';
        }
        if (!formData.customer_phone?.trim()) {
          newErrors.customer_phone = 'Broj telefona je obavezan';
        } else if (!validatePhone(formData.customer_phone)) {
          newErrors.customer_phone = 'Unesite ispravan broj telefona (npr. 0641234567)';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepComplete = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return !!selectedWorker;
      case 2:
        return !!selectedService;
      case 3:
        return !!selectedTime;
      case 4:
        return !!formData.customer_name && 
               !!formData.customer_email && 
               !!formData.customer_phone;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!isStepComplete(step)) {
      validateStep();
      return;
    }
    
    if (step === 4) {
      handleBooking();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    setStep(s => s - 1);
    setErrors({});
  };

  const handleScrollLeft = () => {
    const container = document.querySelector('.scroll-container');
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    const container = document.querySelector('.scroll-container');
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const steps = [
    { 
      number: 1, 
      title: 'Radnika', 
      description: 'Izaberite svog radnika',
      selectText: 'Izaberite radnika'
    },
    { 
      number: 2, 
      title: 'Uslugu', 
      description: 'Odaberite željenu uslugu',
      selectText: 'Izaberite uslugu'
    },
    { 
      number: 3, 
      title: 'Termin', 
      description: 'Odaberite slobodan termin',
      selectText: 'Izaberite termin'
    },
    { 
      number: 4, 
      title: 'Podaci', 
      description: 'Unesite svoje podatke',
      selectText: 'Popunite podatke'
    }
  ];

  const ErrorMessage = ({ message }) => (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );

  const getButtonText = () => {
    if (isLoading) {
      return (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Učitavanje...
        </>
      );
    }

    if (step === 4) {
      return 'Potvrdi rezervaciju';
    }

    if (!isStepComplete(step)) {
      return (
        <span className="flex items-center">
          {steps[step - 1].selectText}
          <svg className="w-5 h-5 ml-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      );
    }

    return (
      <span className="flex items-center">
        Nastavi
        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 pt-28">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-green-100 border-t-green-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-white pt-28 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-8">
            <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-light text-gray-900 mb-4">
            Uspešno zakazano
          </h2>
          <p className="text-gray-500 mb-8">
            Potvrda rezervacije je poslata na vašu email adresu
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent 
              text-base font-medium rounded-full text-white bg-green-500 hover:bg-green-600 
              transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-green-500"
          >
            Zakaži novi termin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28">
      {apiError && <ErrorMessage message={apiError} />}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            {salon?.salon_name || 'Zakazivanje termina'}
          </h1>
          {salon && <p className="text-gray-500">{salon.adresa}</p>}
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
            <div className="relative flex justify-between">
              {steps.map((s) => (
                <div key={s.number} className="flex flex-col items-center">
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300 relative z-10
                      ${step > s.number 
                        ? 'bg-green-500 text-white' 
                        : step === s.number 
                          ? 'bg-green-500 text-white ring-4 ring-green-100' 
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {step > s.number ? '✓' : s.number}
                  </div>
                  <div className="absolute top-12 -left-1/2 w-32 text-center">
                    <p className={`text-sm font-medium ${
                      step >= s.number ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {s.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                      {s.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            {/* Step 1 - Worker Selection */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map(worker => (
                  <button
                    key={worker.id}
                    onClick={() => setSelectedWorker(worker)}
                    className={`
                      group p-6 rounded-xl text-left transition-all duration-200
                      ${selectedWorker?.id === worker.id 
                        ? 'bg-green-50 border-2 border-green-500' 
                        : 'bg-gray-50 border-2 border-transparent hover:border-green-500'}
                    `}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        transition-colors duration-200
                        ${selectedWorker?.id === worker.id 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-white text-gray-400 group-hover:text-green-500'}
                      `}>
                        <span className="text-lg font-medium">
                          {worker.ime[0]}{worker.prezime[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className={`
                          font-medium transition-colors duration-200
                          ${selectedWorker?.id === worker.id ? 'text-green-600' : 'text-gray-900'}
                        `}>
                          {worker.ime} {worker.prezime}
                        </h3>
                        {worker.specijalnost && (
                          <p className="text-sm text-gray-500 mt-1">{worker.specijalnost}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 - Service Selection */}
            {step === 2 && (
              <div className="space-y-3">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all duration-200
                      ${selectedService?.id === service.id 
                        ? 'bg-green-50 border-2 border-green-500' 
                        : 'bg-gray-50 border-2 border-transparent hover:border-green-500'}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-medium ${
                          selectedService?.id === service.id ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {service.naziv}
                        </h3>
                        {service.opis && (
                          <p className="text-sm text-gray-500 mt-1">{service.opis}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{service.cena} RSD</p>
                        <p className="text-sm text-gray-500">{service.trajanje} min</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3 - Date & Time Selection */}
            {step === 3 && (
              <div className="space-y-6">
                <input
                  type="date"
                  className="w-full p-4 rounded-xl bg-gray-50 border-2 border-transparent
                    focus:border-green-500 focus:ring-0 transition-all duration-200"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  min={new Date().toISOString().split('T')[0]}
                />
                <div className="relative bg-white rounded-xl p-4 shadow-sm">
                  {/* Kontejner za termine */}
                  <div className="relative">
                    <div 
                      ref={scrollRef}
                      className="overflow-x-auto relative select-none bg-gray-50/50 rounded-lg pb-4"
                      onMouseDown={handleMouseDown}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onMouseMove={handleMouseMove}
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#22c55e #f3f4f6'
                      }}
                    >
                      <div className="flex space-x-3 min-w-max px-4 py-2">
                        {appointments.map(time => (
                          <button
                            key={time.id}
                            onClick={() => setSelectedTime(time)}
                            className={`
                              relative flex-shrink-0 px-6 py-4 rounded-xl text-center transition-all duration-200 
                              min-w-[120px] group hover:-translate-y-0.5
                              ${selectedTime?.id === time.id 
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                                : 'bg-white hover:bg-green-50 text-gray-900 hover:shadow-md'}
                            `}
                          >
                            <span className="block text-lg font-medium">
                              {time.start_time}
                            </span>
                            {selectedTime?.id === time.id && (
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 - Customer Information */}
            {step === 4 && (
              <div className="max-w-md mx-auto space-y-6">
                {[
                  { id: 'customer_name', label: 'Ime i prezime', type: 'text' },
                  { id: 'customer_email', label: 'Email adresa', type: 'email' },
                  { id: 'customer_phone', label: 'Broj telefona', type: 'tel' }
                ].map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={formData[field.id]}
                      onChange={(e) => setFormData({
                        ...formData,
                        [field.id]: e.target.value
                      })}
                      className="w-full p-4 rounded-xl bg-gray-50 border-2 border-transparent
                        focus:border-green-500 focus:ring-0 transition-all duration-200"
                    />
                    {errors[field.id] && (
                      <p className="mt-1 text-sm text-red-500">{errors[field.id]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-900 
                  transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-green-500"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
                </svg>
                Nazad
              </button>
            ) : <div />}
            
            <button
              onClick={handleNext}
              disabled={isLoading}
              className={`
                flex items-center px-8 py-3 rounded-xl text-white transition-all duration-200
                ${!isStepComplete(step) 
                  ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' 
                  : 'bg-green-500 hover:bg-green-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
              `}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 