import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const WorkSchedule = ({ workerId }) => {
  // State za raspored
  const [schedules, setSchedules] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    is_working: true,
    start_time: "09:00",
    end_time: "17:00",
    has_break: false,
    break_start: "13:00",
    break_end: "14:00"
  });

  // State za greške
  const [errors, setErrors] = useState({});

  const daysOfWeek = [
    { id: 1, name: 'Ponedeljak' },
    { id: 2, name: 'Utorak' },
    { id: 3, name: 'Sreda' },
    { id: 4, name: 'Četvrtak' },
    { id: 5, name: 'Petak' },
    { id: 6, name: 'Subota' },
    { id: 0, name: 'Nedelja' }
  ];

  // Reset schedules when workerId changes
  useEffect(() => {
    setSchedules([]);
    if (workerId) {
      fetchSchedules();
    }
  }, [workerId]);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/work-schedules?worker_id=${workerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data && Array.isArray(response.data)) {
        const workerSchedules = response.data.filter(schedule => schedule.worker_id === workerId);
        setSchedules(workerSchedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setScheduleFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setScheduleFormData({
      is_working: true,
      start_time: "09:00",
      end_time: "17:00",
      has_break: false,
      break_start: "13:00",
      break_end: "14:00"
    });
    setErrors({});
    setSelectedDay(null);
  };

  const handleOpenModal = (day = null) => {
    if (!workerId) return;
    
    const existingSchedule = schedules.find(s => s.day_of_week === day?.id && s.worker_id === workerId);
    
    if (day && existingSchedule) {
      setSelectedDay(day);
      setScheduleFormData({
        is_working: existingSchedule.is_working,
        start_time: existingSchedule.start_time,
        end_time: existingSchedule.end_time,
        has_break: existingSchedule.has_break,
        break_start: existingSchedule.break_start || "13:00",
        break_end: existingSchedule.break_end || "14:00"
      });
    } else if (day) {
      resetForm();
      setSelectedDay(day);
    } else {
      resetForm();
      setSelectedDay(null);
    }
    setIsScheduleModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workerId || !selectedDay) return;

    try {
      const payload = {
        worker_id: workerId,
        day_of_week: selectedDay.id,
        ...scheduleFormData
      };

      const existingSchedule = schedules.find(s => s.day_of_week === selectedDay.id && s.worker_id === workerId);

      if (existingSchedule) {
        await axios.put(`${import.meta.env.VITE_API_URL}/work-schedules/${existingSchedule.id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/work-schedules`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      setIsScheduleModalOpen(false);
      await fetchSchedules();
      resetForm();
    } catch (error) {
      console.error('Error submitting schedule:', error.response?.data);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Došlo je do greške prilikom čuvanja rasporeda.' });
      }
    }
  };

  const getScheduleForDay = (dayId) => {
    return schedules.find(s => s.day_of_week === dayId && s.worker_id === workerId);
  };

  return (
    <div className="min-h-full w-full bg-gray-50/50">
      <div className="max-w-7xl mx-auto pt-6">
        {/* Desktop prikaz */}
        <div className="hidden lg:block px-4 pb-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Dan</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/4">Radno vreme</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {daysOfWeek.map((day, index) => (
                  <tr 
                    key={day.id}
                    className={`group hover:bg-gray-50/50 transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-gray-200 transition-colors duration-200">
                          {day.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-900">{day.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span 
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-normal ${
                          getScheduleForDay(day.id)?.is_working 
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          getScheduleForDay(day.id)?.is_working ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        {getScheduleForDay(day.id)?.is_working ? 'Radno' : 'Neradno'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {getScheduleForDay(day.id)?.is_working && (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600 flex items-center">
                            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center mr-2">
                              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span>{getScheduleForDay(day.id)?.start_time} - {getScheduleForDay(day.id)?.end_time}</span>
                          </div>
                          {getScheduleForDay(day.id)?.has_break && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center mr-2">
                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span>Pauza: {getScheduleForDay(day.id)?.break_start} - {getScheduleForDay(day.id)?.break_end}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenModal(day)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 
                                 bg-green-50 rounded-lg hover:bg-green-100
                                 transition-colors duration-200"
                      >
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {getScheduleForDay(day.id) ? 'Izmeni' : 'Postavi'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobilni prikaz */}
        <div className="lg:hidden">
          <div className="space-y-3">
            {daysOfWeek.map((day) => {
              const schedule = getScheduleForDay(day.id);
              return (
                <div
                  key={day.id}
                  className="bg-white shadow-sm border-b border-gray-100"
                >
                  <div className="px-4 py-3">
                    {/* Zaglavlje kartice */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
                          {day.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm text-gray-900 block mb-1">{day.name}</span>
                          <span 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-normal ${
                              schedule?.is_working 
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              schedule?.is_working ? 'bg-green-500' : 'bg-gray-400'
                            }`}></span>
                            {schedule?.is_working ? 'Radno' : 'Neradno'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenModal(day)}
                        className="p-2 -m-2 text-green-600 hover:text-green-700"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>

                    {/* Detalji radnog vremena */}
                    {schedule?.is_working && (
                      <div className="space-y-2">
                        <div className="flex items-center p-2.5 bg-gray-50 rounded-lg">
                          <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Radno vreme</span>
                            <div className="text-sm text-gray-900">{schedule.start_time} - {schedule.end_time}</div>
                          </div>
                        </div>

                        {schedule.has_break && (
                          <div className="flex items-center p-2.5 bg-gray-50 rounded-lg">
                            <div className="w-7 h-7 rounded-md bg-orange-50 flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Pauza</span>
                              <div className="text-sm text-gray-900">{schedule.break_start} - {schedule.break_end}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-gray-500/75 backdrop-blur-sm"
          >
            <div className="min-h-screen px-4 text-center flex items-center justify-center">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-4 text-left mx-auto"
              >
                {/* Modal header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
                      {selectedDay?.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{selectedDay?.name}</h3>
                      <p className="text-xs text-gray-500">Podešavanje radnog vremena</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsScheduleModalOpen(false);
                      resetForm();
                    }}
                    className="p-2 -m-2 text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal body */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="is_working"
                        name="is_working"
                        checked={scheduleFormData.is_working}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500 
                                 transition-colors duration-200 cursor-pointer"
                      />
                      <label htmlFor="is_working" className="ml-3 text-sm text-gray-700 cursor-pointer">
                        Radni dan
                      </label>
                    </div>

                    {scheduleFormData.is_working && (
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-700">Radno vreme</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Početak</label>
                              <input
                                type="time"
                                name="start_time"
                                value={scheduleFormData.start_time}
                                onChange={handleInputChange}
                                className="w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-1
                                         focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Kraj</label>
                              <input
                                type="time"
                                name="end_time"
                                value={scheduleFormData.end_time}
                                onChange={handleInputChange}
                                className="w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-1
                                         focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-md bg-orange-50 flex items-center justify-center">
                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-700">Pauza</span>
                            </div>
                            <div className="relative inline-block w-8 align-middle select-none">
                              <input
                                type="checkbox"
                                id="has_break"
                                name="has_break"
                                checked={scheduleFormData.has_break}
                                onChange={handleInputChange}
                                className="absolute block w-4 h-4 rounded-full bg-white border-2 appearance-none cursor-pointer
                                         right-0 checked:right-0 checked:border-green-500 checked:bg-green-500 transition-all duration-200"
                              />
                              <label
                                htmlFor="has_break"
                                className="block h-4 w-8 rounded-full bg-gray-300 cursor-pointer transition-colors duration-200
                                         peer-checked:bg-green-100"
                              ></label>
                            </div>
                          </div>

                          {scheduleFormData.has_break && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Početak pauze</label>
                                <input
                                  type="time"
                                  name="break_start"
                                  value={scheduleFormData.break_start}
                                  onChange={handleInputChange}
                                  className="w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-1
                                           focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Kraj pauze</label>
                                <input
                                  type="time"
                                  name="break_end"
                                  value={scheduleFormData.break_end}
                                  onChange={handleInputChange}
                                  className="w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-1
                                           focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Errors display */}
                    {Object.keys(errors).length > 0 && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs">
                        <ul className="list-disc list-inside space-y-1">
                          {Object.values(errors).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Modal footer */}
                    <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                      <button
                        type="button"
                        onClick={() => {
                          setIsScheduleModalOpen(false);
                          resetForm();
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 
                                 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Otkaži
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg 
                                 hover:bg-green-700 transition-colors duration-200"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkSchedule; 