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
      
      // Filtriramo termine koji su prošli
      const now = new Date();
      const filteredAppointments = response.data.filter(appointment => {
        const appointmentDateTime = new Date(`${appointment.date} ${appointment.start_time}`);
        return appointmentDateTime > now;
      });
      
      setAppointments(filteredAppointments || []);
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

  const renderAppointments = () => {
    if (appointments.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm">
          Nema dostupnih termina za izabrani datum
        </div>
      );
    }

    // Proveravamo da li je izabrani datum danas
    const isToday = new Date().toDateString() === selectedDate.toDateString();

    return (
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
          {appointments.map((slot) => {
            // Ako je danas, proveravamo da li je vreme prošlo
            if (isToday) {
              const now = new Date();
              const [hours, minutes] = slot.start_time.split(':').map(Number);
              const slotTime = new Date(selectedDate);
              slotTime.setHours(hours, minutes, 0, 0);
              
              if (slotTime < now) {
                return null; // Ne prikazujemo prošle termine
              }
            }

            return (
              <button
                key={slot.id}
                onClick={() => setSelectedTime(slot)}
                className={`
                  p-3 rounded-lg text-sm transition-all duration-200
                  ${selectedTime?.id === slot.id
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-white hover:bg-green-50 border border-gray-200'
                  }
                `}
              >
                <div className="font-medium">{slot.start_time}</div>
                <div className="text-xs mt-1 opacity-75">
                  {slot.duration} min
                </div>
                <div className="text-xs mt-1 font-medium">
                  {slot.price} RSD
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Dodajemo funkciju za formatiranje datuma
  const formatDate = (date) => {
    const months = [
      'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
      'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}. ${month} ${year}`;
  };

  // Prikaz detalja rezervacije
  const renderBookingSummary = () => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">Detalji rezervacije</h3>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="text-gray-500">Salon</span>
              <span className="font-medium text-gray-900">{salon?.salon_name}</span>
            </p>
            {salon?.address && (
              <p className="flex justify-between">
                <span className="text-gray-500">Adresa</span>
                <span className="font-medium text-gray-900">{salon.address}</span>
              </p>
            )}
            <p className="flex justify-between">
              <span className="text-gray-500">Frizer</span>
              <span className="font-medium text-gray-900">{selectedWorker?.ime} {selectedWorker?.prezime}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Usluga</span>
              <span className="font-medium text-gray-900">{selectedService?.naziv}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Datum</span>
              <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Vreme</span>
              <span className="font-medium text-gray-900">{selectedTime?.start_time}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Trajanje</span>
              <span className="font-medium text-gray-900">{selectedService?.trajanje} min</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Cena</span>
              <span className="font-medium text-gray-900">{selectedService?.cena} RSD</span>
            </p>
          </div>
        </div>
      </div>
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
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-8">
              <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
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
                focus:ring-green-500 shadow-sm"
            >
              Zakaži novi termin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Meta tag za sprečavanje zumiranja */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      
      {apiError && <ErrorMessage message={apiError} />}
      
      <div className="pt-28 pb-16 px-3 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header sa nazivom salona */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
              {salon?.salon_name || 'Zakazivanje termina'}
            </h1>
            {salon && (
              <div className="flex flex-col items-center text-gray-600 text-sm sm:text-base space-y-2">
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="break-words text-center">{salon.address}</span>
                </p>
                {salon.phone && (
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{salon.phone}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mb-8 sm:mb-12">
            <div className="relative px-4 sm:px-12">
              {/* Progress bar linija */}
              <div className="absolute top-[14px] sm:top-[18px] left-[35px] right-[35px] sm:left-[47px] sm:right-[47px]">
                <div className="h-0.5 bg-gray-200 w-full">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Koraci */}
              <div className="relative flex justify-between">
                {steps.map((s) => (
                  <div key={s.number} className="flex flex-col items-center">
                    <div 
                      className={`
                        w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
                        transition-all duration-300 relative z-10 text-xs sm:text-sm
                        ${step > s.number 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                          : step === s.number 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white ring-2 ring-green-100 shadow-md' 
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        }
                      `}
                    >
                      {step > s.number ? '✓' : s.number}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 
                        overflow-hidden mb-8">
            <div className="p-3 sm:p-6">
              {/* Step 1 - Worker Selection */}
              {step === 1 && (
                <div className="space-y-4">
                  {workers.map(worker => (
                    <button
                      key={worker.id}
                      onClick={() => setSelectedWorker(worker)}
                      className={`
                        w-full rounded-xl text-left transition-all duration-200 border overflow-hidden
                        ${selectedWorker?.id === worker.id 
                          ? 'bg-green-50 border-green-500 shadow-lg scale-[1.02]' 
                          : 'bg-white border-gray-200 hover:border-green-500 hover:shadow-md hover:scale-[1.01]'}
                      `}
                    >
                      <div className="sm:flex">
                        {/* Слика и основне информације */}
                        <div className="relative sm:w-1/3 md:w-1/4">
                          {worker.profile_image ? (
                            <img 
                              src={`${import.meta.env.VITE_API_URL}/worker-image/${worker.profile_image.split('/').pop()}`}
                              alt={`${worker.ime} ${worker.prezime}`}
                              className="w-full h-48 sm:h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div className="w-full h-48 sm:h-full min-h-[12rem] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                              <span className="text-4xl font-medium text-gray-400">
                                {worker.ime[0]}{worker.prezime[0]}
                              </span>
                            </div>
                          )}
                          {/* Беџ за искуство */}
                          {worker.godine_iskustva && (
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                              {worker.godine_iskustva} година искуства
                            </div>
                          )}
                        </div>

                        {/* Информације и услуге */}
                        <div className="flex-1 p-4">
                          <div className="sm:flex justify-between items-start gap-4">
                            <div>
                              <h3 className={`
                                font-medium text-lg sm:text-xl mb-1
                                ${selectedWorker?.id === worker.id ? 'text-green-600' : 'text-gray-900'}
                              `}>
                                {worker.ime} {worker.prezime}
                              </h3>
                              {worker.specijalnost && (
                                <p className="text-sm text-gray-600 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {worker.specijalnost}
                                </p>
                              )}
                              {worker.opis && (
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 sm:line-clamp-3">
                                  {worker.opis}
                                </p>
                              )}
                            </div>
                            
                            {/* Радно време */}
                            {worker.radno_vreme && (
                              <div className="hidden sm:block text-right text-sm">
                                <p className="text-gray-600 font-medium mb-1">Радно време</p>
                                <p className="text-gray-500">{worker.radno_vreme}</p>
                              </div>
                            )}
                          </div>

                          {/* Преглед услуга */}
                          {worker.services && worker.services.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-600 mb-2">Услуге:</p>
                              <div className="flex flex-wrap gap-2">
                                {worker.services.slice(0, 4).map(service => (
                                  <div 
                                    key={service.id}
                                    className="bg-gray-50 px-3 py-1.5 rounded-full text-sm text-gray-600 flex items-center"
                                  >
                                    <span>{service.naziv}</span>
                                    <span className="ml-2 text-xs text-gray-400">{service.trajanje}мин</span>
                                  </div>
                                ))}
                                {worker.services.length > 4 && (
                                  <div className="bg-gray-50 px-3 py-1.5 rounded-full text-sm text-gray-500">
                                    +{worker.services.length - 4} још
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Додатне информације у гриду */}
                          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {worker.broj_klijenata && (
                              <div className="bg-gray-50 p-2 rounded-lg text-center">
                                <p className="text-lg font-medium text-gray-700">{worker.broj_klijenata}+</p>
                                <p className="text-xs text-gray-500">задовољних клијената</p>
                              </div>
                            )}
                            {worker.prosecna_ocena && (
                              <div className="bg-gray-50 p-2 rounded-lg text-center">
                                <p className="text-lg font-medium text-gray-700">
                                  {worker.prosecna_ocena}
                                  <span className="text-yellow-400 ml-1">★</span>
                                </p>
                                <p className="text-xs text-gray-500">просечна оцена</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Мобилни приказ радног времена */}
                      {worker.radno_vreme && (
                        <div className="sm:hidden border-t border-gray-100 px-4 py-2 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">Радно време:</span> {worker.radno_vreme}
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2 - Service Selection */}
              {step === 2 && (
                <div className="space-y-2">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`
                        w-full p-3 sm:p-4 rounded-xl text-left transition-all duration-200 border
                        ${selectedService?.id === service.id 
                          ? 'bg-green-50 border-green-500 shadow-sm' 
                          : 'bg-white border-gray-200 hover:border-green-500 hover:shadow-sm'}
                      `}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm sm:text-base font-medium truncate ${
                            selectedService?.id === service.id ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {service.naziv}
                          </h3>
                          {service.opis && (
                            <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5 line-clamp-2">
                              {service.opis}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900">
                            {service.cena} RSD
                          </p>
                          <p className="text-[11px] sm:text-sm text-gray-500">
                            {service.trajanje} min
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3 - Date & Time Selection */}
              {step === 3 && (
                <div className="space-y-4">
                  <input
                    type="date"
                    className="w-full p-3 sm:p-4 rounded-xl bg-white border text-sm
                             border-gray-200 hover:border-green-500 focus:border-green-500 
                             focus:ring-0 transition-all duration-200"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <div className="bg-white rounded-xl border border-gray-200">
                    {renderAppointments()}
                  </div>
                </div>
              )}

              {/* Step 4 - Customer Information */}
              {step === 4 && (
                <div className="max-w-md mx-auto space-y-4">
                  {renderBookingSummary()}
                  
                  <div className="space-y-3 mt-4">
                    {[
                      { 
                        id: 'customer_name', 
                        label: 'Ime i prezime', 
                        type: 'text',
                        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                      },
                      { 
                        id: 'customer_email', 
                        label: 'Email adresa', 
                        type: 'email',
                        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                      },
                      { 
                        id: 'customer_phone', 
                        label: 'Broj telefona', 
                        type: 'tel',
                        icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                      }
                    ].map(field => (
                      <div key={field.id}>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={field.icon} />
                            </svg>
                          </div>
                          <input
                            type={field.type}
                            value={formData[field.id]}
                            onChange={(e) => setFormData({
                              ...formData,
                              [field.id]: e.target.value
                            })}
                            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white border
                                     border-gray-200 hover:border-green-500 focus:border-green-500 
                                     focus:ring-0 transition-all duration-200"
                            placeholder={`Unesite ${field.label.toLowerCase()}`}
                          />
                        </div>
                        {errors[field.id] && (
                          <p className="mt-1 text-[11px] sm:text-sm text-red-500 flex items-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors[field.id]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-3 sm:px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 
                           hover:text-gray-900 transition-colors focus:outline-none rounded-lg"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Nazad
                </button>
              ) : (
                <div />
              )}
              
              <button
                onClick={handleNext}
                disabled={isLoading}
                className={`
                  flex items-center px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg text-white 
                  transition-all duration-200
                  ${!isStepComplete(step) 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {getButtonText()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 