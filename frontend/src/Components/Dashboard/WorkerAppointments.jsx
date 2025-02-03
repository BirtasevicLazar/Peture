import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format, addDays, subDays, parseISO, isSameDay, isWithinInterval } from 'date-fns';
import { sr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const WorkerAppointments = ({ workerId }) => {
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
  const queryClient = useQueryClient();

  // Fetch worker off days
  const { data: offDays } = useQuery({
    queryKey: ['worker-off-days', workerId],
    queryFn: () => fetchWorkerOffDays(workerId)
  });

  // Check if selected date is within any off day period
  const getOffDay = (date) => {
    if (!offDays?.length) return null;
    
    return offDays.find(offDay => {
      const start = parseISO(offDay.start_date);
      const end = parseISO(offDay.end_date);
      return isWithinInterval(date, { start, end });
    });
  };

  // Fetch appointments for selected date
  const { data, isLoading, error } = useQuery({
    queryKey: ['worker-appointments', workerId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const offDay = getOffDay(selectedDate);
      if (offDay) {
        return { is_off_day: true, off_day: offDay };
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/worker/${workerId}/appointments`,
        {
          params: {
            date: format(selectedDate, 'yyyy-MM-dd')
          },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      return { ...response.data, is_off_day: false };
    },
    enabled: !!workerId,
    staleTime: 30000, // 30 sekundi
    cacheTime: 300000, // 5 minuta
    retry: 1
  });

  // Generisanje vremenskih slotova na osnovu time_slot-a radnika
  const timeSlots = useMemo(() => {
    if (!data?.worker?.time_slot || !data?.schedule) return [];

    const slots = [];
    const timeSlot = Math.abs(data.worker.time_slot);
    const [startHour, startMinute] = data.schedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = data.schedule.end_time.split(':').map(Number);

    // Zaokruži početno vreme na najbliži slot
    let currentMinute = startMinute;
    if (startMinute % timeSlot !== 0) {
      currentMinute = Math.floor(startMinute / timeSlot) * timeSlot;
    }
    let currentHour = startHour;

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

  // Nađi termin koji počinje u datom slotu ili se preklapa sa njim
  const findAppointmentsInSlot = (timeSlot) => {
    if (!data?.appointments?.length) return [];

    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const slotTime = slotHour * 60 + slotMinute;
    const nextSlotTime = slotTime + Math.abs(data.worker.time_slot);

    return data.appointments.filter(app => {
      const [appStartHour, appStartMinute] = app.start_time.split(':').map(Number);
      const [appEndHour, appEndMinute] = app.end_time.split(':').map(Number);
      const appStartTime = appStartHour * 60 + appStartMinute;
      const appEndTime = appEndHour * 60 + appEndMinute;

      // Termin pripada ovom slotu ako počinje unutar njega
      return appStartTime >= slotTime && appStartTime < nextSlotTime;
    });
  };

  // Izračunaj visinu termina na osnovu trajanja
  const calculateAppointmentHeight = (appointment) => {
    if (!data?.worker?.time_slot) return 40;
    
    const currentTimeSlot = Math.abs(data.worker.time_slot);
    const duration = appointment.service_duration;
    const baseHeight = Math.abs(data.worker.time_slot) <= 10 ? 32 : 
                      Math.abs(data.worker.time_slot) >= 60 ? 60 : 
                      Math.abs(data.worker.time_slot) >= 30 ? 48 : 40;
    
    // Izračunaj visinu proporcionalno trajanju
    const heightRatio = duration / currentTimeSlot;
    return baseHeight * heightRatio;
  };

  // Izračunaj poziciju termina unutar slota
  const calculateAppointmentPosition = (appointment, timeSlot) => {
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const [appStartHour, appStartMinute] = appointment.start_time.split(':').map(Number);
    
    const slotTime = slotHour * 60 + slotMinute;
    const appStartTime = appStartHour * 60 + appStartMinute;
    const timeSlotDuration = Math.abs(data.worker.time_slot);
    
    // Izračunaj offset u minutima i pretvori u procenat
    const offsetMinutes = appStartTime - slotTime;
    const offsetPercentage = (offsetMinutes / timeSlotDuration) * 100;
    
    return Math.min(Math.max(0, offsetPercentage), 100);
  };

  // Proveri da li je slot zauzet terminom koji je počeo ranije
  const isSlotOccupied = (timeSlot) => {
    if (!data?.appointments?.length) return false;

    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const slotTime = slotHour * 60 + slotMinute;

    return data.appointments.some(app => {
      const [appStartHour, appStartMinute] = app.start_time.split(':').map(Number);
      const [appEndHour, appEndMinute] = app.end_time.split(':').map(Number);
      const appStartTime = appStartHour * 60 + appStartMinute;
      const appEndTime = appEndHour * 60 + appEndMinute;
      
      return slotTime > appStartTime && slotTime < appEndTime;
    });
  };

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

  // Proveri da li je termin već prikazan u prethodnom slotu
  const isAppointmentAlreadyShown = (appointment, timeSlot) => {
    if (!appointment) return false;

    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const [appStartHour, appStartMinute] = appointment.start_time.split(':').map(Number);
    const slotTime = slotHour * 60 + slotMinute;
    const appStartTime = appStartHour * 60 + appStartMinute;

    return slotTime > appStartTime;
  };

  // Proveri da li je datum u prošlosti
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Proveri da li je vremenski slot prošao
  const isPastTimeSlot = (timeSlot) => {
    const now = new Date();
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(hours, minutes, 0, 0);
    return slotDateTime < now;
  };

  // Formatiranje broja telefona
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{3})(\d{3,4})/, '$1 $2 $3');
  };

  const handleSlotClick = (timeSlot) => {
    const slotDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')} ${timeSlot}`);
    
    if (slotDateTime < new Date()) {
      toast.error('Nije moguće zakazati termin u prošlosti');
      return;
    }

    const appointments = findAppointmentsInSlot(timeSlot);
    if (appointments.length > 0) {
      setSelectedAppointment(appointments[0]);
    } else if (!isBreakTime(timeSlot) && data.schedule.is_working) {
      setSelectedSlot(timeSlot);
      setShowCreateModal(true);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmitting(true);

    try {
      const appointmentDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`);
      
      if (appointmentDateTime < new Date()) {
        toast.error('Nije moguće kreirati termin u prošlosti');
        setIsSubmitting(false);
        return;
      }

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
      
      queryClient.setQueryData(['worker-appointments', workerId, format(selectedDate, 'yyyy-MM-dd')], updatedResponse.data);
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
      toast.error(error.response?.data?.message || 'Došlo je do greške prilikom kreiranja termina');
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
          <p className="text-sm font-medium text-red-800">{error.message}</p>
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
              {getOffDay(selectedDate) && (
                <span className="ml-2 text-sm font-normal text-red-500">
                  (Neradan dan)
                </span>
              )}
              {!data?.schedule?.is_working && !getOffDay(selectedDate) && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Ne radi)
                </span>
              )}
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
        {data?.is_off_day ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Neradan dan
              </h3>
              {data.off_day?.reason && (
                <p className="text-sm text-gray-600 max-w-md">
                  {data.off_day.reason}
                </p>
              )}
              <div className="mt-4 text-sm text-gray-500">
                {format(parseISO(data.off_day?.start_date), "d. MMMM yyyy.", { locale: sr })}
                {data.off_day?.start_date !== data.off_day?.end_date && (
                  <>
                    {' - '}
                    {format(parseISO(data.off_day?.end_date), "d. MMMM yyyy.", { locale: sr })}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : !data?.schedule?.is_working ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Ne radi
              </h3>
              <p className="text-sm text-gray-600 max-w-md">
                Radnik ne radi ovog dana prema rasporedu
              </p>
            </div>
          </div>
        ) : data?.schedule ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[300px]">
                {timeSlots.map((timeSlot, index) => {
                  const appointments = findAppointmentsInSlot(timeSlot);
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
                        ${!appointments.length && !isBreak && !isPast && data.schedule.is_working ? 'cursor-pointer hover:bg-green-50/30' : ''}
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
                        ) : appointments.map((appointment, appIndex) => (
                          <div
                            key={appointment.id || appIndex}
                            onClick={() => setSelectedAppointment(appointment)}
                            className={`
                              absolute left-0 right-0 mx-1.5 rounded-xl border overflow-hidden shadow-sm cursor-pointer
                              transition-all duration-300 hover:scale-[1.02] hover:shadow-md
                              ${isPastTimeSlot(appointment.start_time) ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-100 hover:bg-green-100/80'}
                            `}
                            style={{
                              height: `${calculateAppointmentHeight(appointment)}px`,
                              top: `${calculateAppointmentPosition(appointment, timeSlot)}%`,
                              zIndex: 10,
                              transition: 'all 0.3s ease-in-out'
                            }}
                          >
                            <div className="px-2 h-full flex flex-col justify-center">
                              <div className="flex items-center justify-between gap-2 w-full">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className={`text-xs leading-none font-medium truncate flex-shrink-0 ${isPastTimeSlot(appointment.start_time) ? 'text-gray-600' : 'text-green-800'}`}>
                                    {appointment.service_name}
                                  </div>
                                  <div className="w-1 h-1 rounded-full bg-gray-200 flex-shrink-0"></div>
                                  <div className={`text-xs leading-none truncate ${isPastTimeSlot(appointment.start_time) ? 'text-gray-500' : 'text-green-700'}`}>
                                    {appointment.customer_name}
                                  </div>
                                </div>
                                <div className={`text-[11px] leading-none whitespace-nowrap flex-shrink-0 ${isPastTimeSlot(appointment.start_time) ? 'text-gray-500' : 'text-green-600'}`}>
                                  {appointment.start_time} - {appointment.end_time}
                                </div>
                              </div>
                              {calculateAppointmentHeight(appointment) >= 48 && (
                                <div className="mt-1 flex items-center gap-2">
                                  <div className={`text-[11px] leading-none truncate ${isPastTimeSlot(appointment.start_time) ? 'text-gray-500' : 'text-green-600'}`}>
                                    {formatPhoneNumber(appointment.customer_phone)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
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