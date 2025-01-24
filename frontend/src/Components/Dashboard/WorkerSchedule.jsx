import { useState, useEffect } from 'react';
import axios from 'axios';

const WorkerSchedule = ({ workerId }) => {
  const [schedules, setSchedules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [formData, setFormData] = useState({
    is_working: true,
    start_time: "09:00",
    end_time: "17:00",
    has_break: false,
    break_start: "13:00",
    break_end: "14:00"
  });
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
      // Ensure we only set schedules for the current worker
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
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
      setFormData({
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
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workerId || !selectedDay) return;

    try {
      const payload = {
        worker_id: workerId,
        day_of_week: selectedDay.id,
        ...formData
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
      setIsModalOpen(false);
      await fetchSchedules(); // Refresh schedules after update
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
    <div className="h-full pb-20 lg:pb-0">
      {/* Moderan Header */}
      <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-xl shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Raspored rada</h2>
            <p className="text-green-50 mt-1">Upravljajte radnim vremenom i pauzama</p>
          </div>
        </div>
      </div>

      {/* Raspored Container */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop prikaz */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dan</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Radno vreme</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {daysOfWeek.map((day) => {
                  const schedule = getScheduleForDay(day.id);
                  return (
                    <tr 
                      key={day.id} 
                      className="hover:bg-gray-50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{day.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                            schedule?.is_working 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            schedule?.is_working ? 'bg-green-600' : 'bg-gray-500'
                          }`}></span>
                          {schedule?.is_working ? 'Radno' : 'Neradno'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {schedule?.is_working ? (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-900 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {schedule.start_time} - {schedule.end_time}
                            </div>
                            {schedule.has_break && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pauza: {schedule.break_start} - {schedule.break_end}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">Nije radno</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(day)}
                          className="inline-flex items-center px-3 py-1.5 text-green-600 hover:text-green-900 
                                   hover:bg-green-50 rounded-lg transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          {schedule ? 'Izmeni' : 'Postavi'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobilni prikaz */}
        <div className="lg:hidden">
          <div className="grid grid-cols-1 gap-4 p-4">
            {daysOfWeek.map((day) => {
              const schedule = getScheduleForDay(day.id);
              return (
                <div
                  key={day.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4"
                >
                  <div className="flex flex-col space-y-4">
                    {/* Dan i Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-base font-semibold text-gray-900">{day.name}</span>
                        <span 
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            schedule?.is_working 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            schedule?.is_working ? 'bg-green-600' : 'bg-gray-500'
                          }`}></span>
                          {schedule?.is_working ? 'Radno' : 'Neradno'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenModal(day)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 
                                 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Izmeni
                      </button>
                    </div>

                    {/* Radno vreme i pauza */}
                    {schedule?.is_working && (
                      <div className="space-y-3 bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-medium">Radno vreme:</span>
                            <span className="ml-2">{schedule.start_time} - {schedule.end_time}</span>
                          </div>
                        </div>

                        {schedule.has_break && (
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <span className="font-medium">Pauza:</span>
                              <span className="ml-2">{schedule.break_start} - {schedule.break_end}</span>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="min-h-screen px-4 text-center">
            {/* Vertikalno centriranje */}
            <div className="flex items-center justify-center min-h-screen">
              {/* Modal sadržaj */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 text-left 
                         transform transition-all mx-auto"
              >
                {/* Modal header */}
                <div className="flex items-center justify-between mb-6 border-b pb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedDay?.name} - Radno vreme
                  </h3>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 
                             focus:outline-none transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal body */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                      <input
                        type="checkbox"
                        id="is_working"
                        name="is_working"
                        checked={formData.is_working}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-green-600 rounded-lg border-gray-300 focus:ring-green-500 
                                 transition-colors duration-200 cursor-pointer"
                      />
                      <label htmlFor="is_working" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                        Radni dan
                      </label>
                    </div>

                    {formData.is_working && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Početak</label>
                            <input
                              type="time"
                              name="start_time"
                              value={formData.start_time}
                              onChange={handleInputChange}
                              className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                       focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kraj</label>
                            <input
                              type="time"
                              name="end_time"
                              value={formData.end_time}
                              onChange={handleInputChange}
                              className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                       focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                            />
                          </div>
                        </div>

                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                          <input
                            type="checkbox"
                            id="has_break"
                            name="has_break"
                            checked={formData.has_break}
                            onChange={handleInputChange}
                            className="h-5 w-5 text-green-600 rounded-lg border-gray-300 focus:ring-green-500 
                                     transition-colors duration-200 cursor-pointer"
                          />
                          <label htmlFor="has_break" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                            Pauza
                          </label>
                        </div>

                        {formData.has_break && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Početak pauze</label>
                              <input
                                type="time"
                                name="break_start"
                                value={formData.break_start}
                                onChange={handleInputChange}
                                className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                         focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Kraj pauze</label>
                              <input
                                type="time"
                                name="break_end"
                                value={formData.break_end}
                                onChange={handleInputChange}
                                className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                         focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modal footer */}
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          resetForm();
                        }}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                                 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                                 focus:ring-green-500 transition-all duration-200"
                      >
                        Otkaži
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl 
                                 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                                 focus:ring-green-500 transition-all duration-200"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerSchedule;
