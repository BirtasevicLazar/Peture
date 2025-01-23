import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { sr } from 'date-fns/locale';

const WorkerAppointments = ({ workerId }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    const duration = appointment.service_duration;
    return Math.max(40, (duration / data.worker.time_slot) * 30);
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
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
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
    <div className="h-full pb-16 lg:pb-0">
      {/* Navigacija po datumima */}
      <div className="bg-white px-3 py-2 rounded-lg shadow-sm mb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setSelectedDate(prev => subDays(prev, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {format(selectedDate, "EEEE", { locale: sr })}
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {format(selectedDate, "d. MMMM yyyy.", { locale: sr })}
            </div>
            {data?.schedule && (
              <div className="text-xs text-gray-500 mt-0.5">
                {data.schedule.start_time} - {data.schedule.end_time}
                {data.schedule.has_break && ` (Pauza: ${data.schedule.break_start} - ${data.schedule.break_end})`}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setSelectedDate(prev => addDays(prev, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid sa terminima */}
      {data?.schedule ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[300px]">
              {timeSlots.map((timeSlot, index) => {
                const appointment = findAppointment(timeSlot);
                const isBreak = isBreakTime(timeSlot);
                const isFullHour = timeSlot.endsWith(':00');

                return (
                  <div
                    key={timeSlot}
                    className={`
                      flex border-b border-gray-100 relative
                      ${isFullHour ? 'bg-gray-50/30' : ''}
                      ${!data.schedule.is_working ? 'opacity-50' : ''}
                    `}
                    style={{ height: '30px' }}
                  >
                    <div className="w-16 flex-shrink-0 border-r border-gray-100 px-2 py-1">
                      <div className="text-xs font-medium text-gray-500">
                        {timeSlot}
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      {isBreak ? (
                        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                          <span className="text-xs text-gray-400">Pauza</span>
                        </div>
                      ) : appointment && (
                        <div
                          className="absolute left-0 right-0 mx-1 bg-green-50 rounded border border-green-100 overflow-hidden shadow-sm"
                          style={{
                            height: `${calculateAppointmentHeight(appointment)}px`,
                            zIndex: 10
                          }}
                        >
                          <div className="p-1.5 h-full flex flex-col justify-between">
                            <div>
                              <div className="text-xs font-medium text-green-800 truncate">
                                {appointment.service_name}
                              </div>
                              <div className="text-xs text-green-700 truncate">
                                {appointment.customer_name}
                              </div>
                            </div>
                            {calculateAppointmentHeight(appointment) >= 60 && (
                              <div className="text-xs text-green-600 flex items-center justify-between">
                                <span className="truncate">{appointment.customer_phone}</span>
                                <span>{appointment.start_time} - {appointment.end_time}</span>
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
        <div className="bg-white rounded-lg p-4 text-center text-sm text-gray-500">
          Radnik ne radi na izabrani dan
        </div>
      )}
    </div>
  );
};

export default WorkerAppointments; 