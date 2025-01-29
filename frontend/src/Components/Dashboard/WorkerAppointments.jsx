import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, addDays, subDays, parseISO, isSameDay } from 'date-fns';
import { sr } from 'date-fns/locale';

const WorkerAppointments = ({ workerId }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_id: '',
    duration: 30
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Učitaj podatke kada se promeni datum ili radnik
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/worker/${workerId}/appointments`,
          {
            params: {
              date: format(selectedDate, 'yyyy-MM-dd')
            },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Došlo je do greške prilikom učitavanja podataka.');
      } finally {
        setIsLoading(false);
      }
    };

    if (workerId) {
      fetchData();
    }
  }, [workerId, selectedDate]);

  // Generisanje vremenskih slotova na osnovu time_slot-a radnika
  const timeSlots = useMemo(() => {
    if (!data?.worker?.time_slot || !data?.schedule) return [];

    const slots = [];
    const timeSlot = data.worker.time_slot;
    const [startHour, startMinute] = data.schedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = data.schedule.end_time.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      slots.push(
        `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      );

      currentMinute += timeSlot;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    return slots;
  }, [data?.worker?.time_slot, data?.schedule]);

  // Proveri da li je slot u pauzi
  const isBreakTime = (timeSlot) => {
    if (!data?.schedule?.has_break) return false;

    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const [breakStartHour, breakStartMinute] = data.schedule.break_start.split(':').map(Number);
    const [breakEndHour, breakEndMinute] = data.schedule.break_end.split(':').map(Number);

    const slotMinutes = slotHour * 60 + slotMinute;
    const breakStartMinutes = breakStartHour * 60 + breakStartMinute;
    const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

    return slotMinutes >= breakStartMinutes && slotMinutes < breakEndMinutes;
  };

  // Nađi termin koji počinje u datom slotu
  const findAppointment = (timeSlot) => {
    return data?.appointments.find(app => app.start_time === timeSlot);
  };

  // Izračunaj visinu termina na osnovu trajanja
  const calculateAppointmentHeight = (appointment) => {
    if (!data?.worker?.time_slot) return 40;
    
    const timeSlot = Math.abs(data.worker.time_slot);
    const duration = appointment.service_duration;
    const numberOfSlots = Math.ceil(duration / timeSlot);
    
    // Osnovna visina za jedan slot
    let baseHeight = 40;
    
    // Prilagodi osnovnu visinu prema time slotu
    if (timeSlot <= 10) {
      baseHeight = 32;
    } else if (timeSlot <= 15) {
      baseHeight = 38;
    } else if (timeSlot <= 20) {
      baseHeight = 40;
    } else if (timeSlot <= 30) {
      baseHeight = 48;
    } else {
      baseHeight = 60;
    }
    
    // Izračunaj ukupnu visinu
    let totalHeight = baseHeight * numberOfSlots;
    
    // Oduzmi 1px za svaku granicu između redova
    totalHeight = totalHeight - (numberOfSlots - 1);
    
    return totalHeight;
  };

  // Proveri da li je datum u prošlosti
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Proveri da li je vremenski slot prošao
  const isPastTimeSlot = (timeSlot) => {
    if (!isSameDay(selectedDate, new Date())) return false;
    const now = new Date();
    const [hours, minutes] = timeSlot.split(':').map(Number);
    return now.getHours() > hours || (now.getHours() === hours && now.getMinutes() > minutes);
  };

  // Formatiranje broja telefona
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{3})(\d{3,4})/, '$1 $2 $3');
  };

  const handleSlotClick = (timeSlot) => {
    if (!data?.schedule?.is_working) return;
    
    const appointment = findAppointment(timeSlot);
    if (appointment) {
      setSelectedAppointment(appointment);
      return;
    }

    if (isPastTimeSlot(timeSlot)) return;
    if (isBreakTime(timeSlot)) return;

    setSelectedSlot(timeSlot);
    setShowCreateModal(true);
    setCreateFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      service_id: '',
      duration: data?.worker?.time_slot || 30
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmitting(true);

    try {
      const formData = {
        ...createFormData,
        worker_id: workerId,
        start_time: `${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`
      };

      // Ako nije izabrana usluga, dodaj podatke za proizvoljnu uslugu
      if (!formData.service_id) {
        formData.custom_service_name = 'Termin bez usluge';
        formData.custom_service_duration = formData.duration;
        delete formData.duration;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/worker/appointments/create`,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Osveži listu termina
      const updatedResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/worker/${workerId}/appointments`,
        {
          params: {
            date: format(selectedDate, 'yyyy-MM-dd')
          },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      setData(updatedResponse.data);
      setShowCreateModal(false);
      setSelectedSlot(null);
      setCreateFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        service_id: '',
        duration: data?.worker?.time_slot || 30
      });
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Došlo je do greške prilikom kreiranja termina');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/50 backdrop-blur-sm p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.worker?.time_slot) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">
          Radnik nema definisan vremenski interval za termine
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Navigacija po datumima */}
      <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => setSelectedDate(prev => subDays(prev, 1))}
            className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 active:scale-95"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center flex-1">
            <div className="text-sm font-medium text-gray-600">
              {format(selectedDate, "EEEE", { locale: sr })}
            </div>
            <div className="text-lg font-medium text-gray-900">
              {format(selectedDate, "d. MMMM yyyy.", { locale: sr })}
            </div>
          </div>
          
          <button
            onClick={() => setSelectedDate(prev => addDays(prev, 1))}
            className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-95"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid sa terminima */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {data?.schedule ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[300px]">
                {timeSlots.map((timeSlot, index) => {
                  const appointment = findAppointment(timeSlot);
                  const isBreak = isBreakTime(timeSlot);
                  const isFullHour = timeSlot.endsWith(':00');
                  const isPast = isPastTimeSlot(timeSlot);

                  return (
                    <div
                      key={timeSlot}
                      className={`
                        flex border-b border-gray-100 relative
                        ${isFullHour ? 'bg-gray-50/30' : ''}
                        ${!data.schedule.is_working ? 'opacity-50' : ''}
                        ${isPast ? 'bg-gray-50/50' : ''}
                        ${!appointment && !isBreak && !isPast && data.schedule.is_working ? 'cursor-pointer hover:bg-green-50/30' : ''}
                        transition-colors duration-200
                      `}
                      style={{ 
                        height: `${Math.abs(data.worker.time_slot) <= 10 ? '32px' : 
                                Math.abs(data.worker.time_slot) >= 60 ? '60px' : 
                                Math.abs(data.worker.time_slot) >= 30 ? '48px' : '40px'}`
                      }}
                      onClick={() => handleSlotClick(timeSlot)}
                    >
                      <div className="w-16 flex-shrink-0 border-r border-gray-100 flex items-center h-full">
                        <div className="px-2 py-1.5 w-full">
                          <div className="text-xs font-medium text-gray-500 truncate">
                            {timeSlot}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 relative h-full">
                        {isBreak ? (
                          <div className="absolute inset-0 bg-gray-50/80 flex items-center justify-center">
                            <span className="text-xs text-gray-400">Pauza</span>
                          </div>
                        ) : appointment && (
                          <div
                            onClick={() => setSelectedAppointment(appointment)}
                            className={`
                              absolute left-0 right-0 mx-1.5 rounded-xl border overflow-hidden shadow-sm cursor-pointer
                              transition-all duration-300 hover:scale-[1.02] hover:shadow-md
                              ${isPast ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-100 hover:bg-green-100/80'}
                            `}
                            style={{
                              height: `${calculateAppointmentHeight(appointment)}px`,
                              top: 0,
                              zIndex: 10,
                              transition: 'all 0.3s ease-in-out'
                            }}
                          >
                            <div className="px-2 h-full flex flex-col justify-center">
                              <div className="flex items-center justify-between gap-2 w-full">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className={`text-xs leading-none font-medium truncate flex-shrink-0 ${isPast ? 'text-gray-600' : 'text-green-800'}`}>
                                    {appointment.service_name}
                                  </div>
                                  <div className="w-1 h-1 rounded-full bg-gray-200 flex-shrink-0"></div>
                                  <div className={`text-xs leading-none truncate ${isPast ? 'text-gray-500' : 'text-green-700'}`}>
                                    {appointment.customer_name}
                                  </div>
                                </div>
                                <div className={`text-[11px] leading-none whitespace-nowrap flex-shrink-0 ${isPast ? 'text-gray-500' : 'text-green-600'}`}>
                                  {appointment.start_time} - {appointment.end_time}
                                </div>
                              </div>
                              {calculateAppointmentHeight(appointment) >= 48 && (
                                <div className="mt-1 flex items-center gap-2">
                                  <div className={`text-[11px] leading-none truncate ${isPast ? 'text-gray-500' : 'text-green-600'}`}>
                                    {formatPhoneNumber(appointment.customer_phone)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center text-sm text-gray-500">
            Radnik ne radi na izabrani dan
          </div>
        )}
      </div>

      {/* Modal za kreiranje termina */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    Novi termin
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    {format(selectedDate, "EEEE, d. MMMM yyyy.", { locale: sr })} u {selectedSlot}
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              {createError && (
                <div className="bg-red-50 text-red-800 rounded-xl p-4 text-sm">
                  {createError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700">
                    Usluga (opciono)
                  </label>
                  <select
                    id="service"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-xl"
                    value={createFormData.service_id}
                    onChange={(e) => {
                      const serviceId = e.target.value;
                      const selectedService = data?.worker?.services?.find(s => s.id === parseInt(serviceId));
                      setCreateFormData(prev => ({
                        ...prev,
                        service_id: serviceId,
                        duration: selectedService ? selectedService.trajanje : data?.worker?.time_slot || 30
                      }));
                    }}
                  >
                    <option value="">Bez usluge</option>
                    {data?.worker?.services?.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.naziv} ({service.trajanje} min) - {service.cena} RSD
                      </option>
                    ))}
                  </select>
                </div>

                {!createFormData.service_id && (
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Trajanje termina (min)
                    </label>
                    <input
                      type="number"
                      id="duration"
                      min={data?.worker?.time_slot}
                      step={data?.worker?.time_slot}
                      className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                      value={createFormData.duration}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      required={!createFormData.service_id}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Trajanje mora biti deljivo sa {data?.worker?.time_slot} minuta
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
                    Ime i prezime klijenta
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    value={createFormData.customer_name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    id="customer_phone"
                    className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    value={createFormData.customer_phone}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700">
                    Email (opciono)
                  </label>
                  <input
                    type="email"
                    id="customer_email"
                    className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    value={createFormData.customer_email}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`
                    px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl shadow-sm
                    hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isSubmitting ? 'Kreiranje...' : 'Kreiraj termin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal za prikaz detalja termina */}
      {selectedAppointment && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" 
          onClick={() => setSelectedAppointment(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all duration-300" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header sa vremenom termina */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-300">
                      {format(selectedDate, "EEEE", { locale: sr })}
                    </span>
                  </div>
                  <div className="text-2xl font-medium text-white">
                    {selectedAppointment.start_time} - {selectedAppointment.end_time}
                  </div>
                  <div className="text-sm text-gray-300 mt-0.5">
                    {format(selectedDate, "d. MMMM yyyy.", { locale: sr })}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded-xl"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Usluga */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-xl">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500">Usluga</div>
                  <div className="text-base font-medium text-gray-900 mt-0.5">{selectedAppointment.service_name}</div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{selectedAppointment.service_duration} minuta</span>
                  </div>
                </div>
              </div>

              {/* Klijent */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-xl">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500">Klijent</div>
                  <div className="text-base font-medium text-gray-900 mt-0.5">{selectedAppointment.customer_name}</div>
                  
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <a 
                      href={`tel:${selectedAppointment.customer_phone}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {formatPhoneNumber(selectedAppointment.customer_phone)}
                    </a>
                    
                    {selectedAppointment.customer_email && (
                      <a 
                        href={`mailto:${selectedAppointment.customer_email}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {selectedAppointment.customer_email}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-xl">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-800">
                      Zakazan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerAppointments; 