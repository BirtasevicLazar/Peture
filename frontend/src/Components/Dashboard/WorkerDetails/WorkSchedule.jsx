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
    
    if (type === 'checkbox') {
      if (name === 'has_break') {
        setScheduleFormData(prev => ({
          ...prev,
          has_break: checked,
          break_start: checked ? prev.break_start : "13:00",
          break_end: checked ? prev.break_end : "14:00"
        }));
      } else {
        setScheduleFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setScheduleFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
        is_working: scheduleFormData.is_working,
        start_time: scheduleFormData.start_time,
        end_time: scheduleFormData.end_time,
        has_break: scheduleFormData.has_break,
        break_start: scheduleFormData.has_break ? scheduleFormData.break_start : null,
        break_end: scheduleFormData.has_break ? scheduleFormData.break_end : null
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
    <div className="w-full pt-6">
      <div className="px-4 space-y-4">
        {/* Desktop prikaz */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 w-1/4">Dan</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 w-1/4">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 w-2/4">Radno vreme</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 w-1/4">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {daysOfWeek.map((day) => (
                  <tr key={day.id} className="group hover:bg-gray-50/50 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 
                                    group-hover:bg-gray-200 transition-colors duration-200">
                          <span className="text-sm font-medium">{day.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{day.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium ${
                        getScheduleForDay(day.id)?.is_working 
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          getScheduleForDay(day.id)?.is_working ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        {getScheduleForDay(day.id)?.is_working ? 'Radno' : 'Neradno'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getScheduleForDay(day.id)?.is_working && (
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-600">{getScheduleForDay(day.id)?.start_time} - {getScheduleForDay(day.id)?.end_time}</span>
                          </div>
                          {getScheduleForDay(day.id)?.has_break && (
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-500">Pauza: {getScheduleForDay(day.id)?.break_start} - {getScheduleForDay(day.id)?.break_end}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(day)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                                 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
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
        <div className="lg:hidden space-y-4">
          {daysOfWeek.map((day) => {
            const schedule = getScheduleForDay(day.id);
            return (
              <div
                key={day.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-500">{day.name.charAt(0)}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 block mb-1">{day.name}</span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium ${
                          schedule?.is_working 
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            schedule?.is_working ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          {schedule?.is_working ? 'Radno' : 'Neradno'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenModal(day)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                               bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      {schedule ? 'Izmeni' : 'Postavi'}
                    </button>
                  </div>

                  {schedule?.is_working && (
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gray-50/50 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Radno vreme</span>
                          <span className="text-sm font-medium text-gray-900">{schedule.start_time} - {schedule.end_time}</span>
                        </div>
                      </div>

                      {schedule.has_break && (
                        <div className="flex items-center p-3 bg-gray-50/50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Pauza</span>
                            <span className="text-sm font-medium text-gray-900">{schedule.break_start} - {schedule.break_end}</span>
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

      {/* Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
                 onClick={() => setIsScheduleModalOpen(false)} />
            
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
                <div className="p-6">
                  {/* Modal header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-500">{selectedDay?.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{selectedDay?.name}</h3>
                        <p className="text-sm text-gray-500">Podešavanje radnog vremena</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsScheduleModalOpen(false);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Modal body */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center p-4 bg-gray-50/50 rounded-xl">
                      <input
                        type="checkbox"
                        id="is_working"
                        name="is_working"
                        checked={scheduleFormData.is_working}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      <label htmlFor="is_working" className="ml-3 text-sm font-medium text-gray-900 cursor-pointer">
                        Radni dan
                      </label>
                    </div>

                    {scheduleFormData.is_working && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900">Radno vreme</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-500 mb-1.5">Početak</label>
                              <input
                                type="time"
                                name="start_time"
                                value={scheduleFormData.start_time}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                         focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-500 mb-1.5">Kraj</label>
                              <input
                                type="time"
                                name="end_time"
                                value={scheduleFormData.end_time}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                         focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-gray-900">Pauza</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                name="has_break"
                                checked={scheduleFormData.has_break}
                                onChange={handleInputChange}
                                className="sr-only"
                              />
                              <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                                scheduleFormData.has_break ? 'bg-green-500' : 'bg-gray-200'
                              }`}>
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                                  scheduleFormData.has_break ? 'translate-x-6' : 'translate-x-1'
                                } shadow-md mt-0.5`} />
                              </div>
                            </label>
                          </div>

                          {scheduleFormData.has_break && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <label className="block text-sm text-gray-500 mb-1.5">Početak pauze</label>
                                <input
                                  type="time"
                                  name="break_start"
                                  value={scheduleFormData.break_start}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                           focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-500 mb-1.5">Kraj pauze</label>
                                <input
                                  type="time"
                                  name="break_end"
                                  value={scheduleFormData.break_end}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                           focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Errors display */}
                    {Object.keys(errors).length > 0 && (
                      <div className="p-4 bg-red-50 rounded-xl">
                        <ul className="list-disc list-inside space-y-1">
                          {Object.values(errors).map((error, index) => (
                            <li key={index} className="text-sm text-red-600">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Modal footer */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => {
                          setIsScheduleModalOpen(false);
                          resetForm();
                        }}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                                 rounded-xl hover:bg-gray-50"
                      >
                        Otkaži
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl 
                                 hover:bg-gray-800"
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