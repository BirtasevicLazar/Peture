import { useState, useEffect } from 'react';
import axios from 'axios';

const WorkerDetails = ({ workerId }) => {
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

  // State za usluge
  const [services, setServices] = useState([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [worker, setWorker] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    naziv: '',
    opis: '',
    cena: '',
    trajanje: ''
  });

  // Zajednički state za greške
  const [errors, setErrors] = useState({});

  // Zajednički state za aktivni tab
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' ili 'services'

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

  // Dodajemo funkcije za usluge
  const fetchWorker = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/workers/${workerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWorker(response.data);
      setServiceFormData(prev => ({
        ...prev,
        trajanje: response.data.time_slot.toString()
      }));
    } catch (error) {
      console.error('Error fetching worker:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/services?worker_id=${workerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleServiceInputChange = (e) => {
    setServiceFormData({ ...serviceFormData, [e.target.name]: e.target.value });
  };

  const resetServiceForm = () => {
    setServiceFormData({
      naziv: '',
      opis: '',
      cena: '',
      trajanje: worker ? worker.time_slot.toString() : ''
    });
    setErrors({});
    setSelectedService(null);
  };

  const handleOpenServiceModal = (service = null) => {
    if (service) {
      setSelectedService(service);
      setServiceFormData({
        naziv: service.naziv,
        opis: service.opis || '',
        cena: service.cena.toString(),
        trajanje: service.trajanje.toString()
      });
    } else {
      resetServiceForm();
    }
    setIsServiceModalOpen(true);
  };

  const getDurationOptions = () => {
    if (!worker?.time_slot) return [];
    
    const timeSlot = Math.abs(parseInt(worker.time_slot));
    const maxDuration = 180; // Maksimalno trajanje od 3 sata
    const options = [];
    
    for (let duration = timeSlot; duration <= maxDuration && options.length < 20; duration += timeSlot) {
      options.push(duration);
    }
    
    return options;
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        worker_id: workerId,
        naziv: serviceFormData.naziv,
        opis: serviceFormData.opis || '',
        cena: parseFloat(serviceFormData.cena),
        trajanje: parseInt(serviceFormData.trajanje)
      };

      let response;
      if (selectedService) {
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/services/${selectedService.id}`, 
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/services`, 
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      }

      setIsServiceModalOpen(false);
      await fetchServices();
      resetServiceForm();
    } catch (error) {
      console.error('Error submitting service:', error.response?.data);
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        const formattedErrors = {};
        Object.keys(serverErrors).forEach(key => {
          formattedErrors[key] = Array.isArray(serverErrors[key]) 
            ? serverErrors[key][0] 
            : serverErrors[key];
        });
        setErrors(formattedErrors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Došlo je do greške prilikom čuvanja usluge.' });
      }
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovu uslugu?')) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/services/${serviceId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        await fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Došlo je do greške prilikom brisanja usluge.');
      }
    }
  };

  // Dodajemo useEffect za inicijalno učitavanje
  useEffect(() => {
    if (workerId) {
      fetchWorker();
      fetchServices();
      fetchSchedules();
    }
  }, [workerId]);

  return (
    <div className="h-full pb-20 lg:pb-0">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'schedule'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Radno vreme
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'services'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Usluge
        </button>
      </div>

      {/* Conditional rendering based on active tab */}
      {activeTab === 'schedule' ? (
        <div>
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
          {isScheduleModalOpen && (
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
                          setIsScheduleModalOpen(false);
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
                            checked={scheduleFormData.is_working}
                            onChange={handleInputChange}
                            className="h-5 w-5 text-green-600 rounded-lg border-gray-300 focus:ring-green-500 
                                     transition-colors duration-200 cursor-pointer"
                          />
                          <label htmlFor="is_working" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                            Radni dan
                          </label>
                        </div>

                        {scheduleFormData.is_working && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Početak</label>
                                <input
                                  type="time"
                                  name="start_time"
                                  value={scheduleFormData.start_time}
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
                                  value={scheduleFormData.end_time}
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
                                checked={scheduleFormData.has_break}
                                onChange={handleInputChange}
                                className="h-5 w-5 text-green-600 rounded-lg border-gray-300 focus:ring-green-500 
                                         transition-colors duration-200 cursor-pointer"
                              />
                              <label htmlFor="has_break" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                                Pauza
                              </label>
                            </div>

                            {scheduleFormData.has_break && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Početak pauze</label>
                                  <input
                                    type="time"
                                    name="break_start"
                                    value={scheduleFormData.break_start}
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
                                    value={scheduleFormData.break_end}
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
                              setIsScheduleModalOpen(false);
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
      ) : (
        // Services content
        <div>
          {/* Header */}
          <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-xl shadow-lg mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Usluge</h2>
                <p className="text-green-50 mt-1">Upravljajte svojim uslugama na jednom mestu</p>
              </div>
              <button
                onClick={() => handleOpenServiceModal()}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                         text-sm font-medium rounded-xl text-green-600 bg-white hover:bg-green-50 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                         transition-all duration-200 shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Dodaj uslugu
              </button>
            </div>
          </div>

          {/* Services Container */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naziv</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opis</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cena (RSD)</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajanje (min)</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{service.naziv}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 line-clamp-2">{service.opis || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {service.cena} RSD
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {service.trajanje} min
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => handleOpenServiceModal(service)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 
                                       bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Izmeni
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 
                                       bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Obriši
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              <div className="grid grid-cols-1 gap-4 p-4">
                {services.map((service) => (
                  <div key={service.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-gray-900">{service.naziv}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{service.opis || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {service.cena} RSD
                        </div>
                        <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {service.trajanje} min
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleOpenServiceModal(service)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 
                                   bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Izmeni
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 
                                   bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Obriši
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Service Modal */}
          {isServiceModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
              <div className="min-h-screen px-4 text-center">
                <div className="flex items-center justify-center min-h-screen">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 text-left 
                             transform transition-all mx-auto"
                  >
                    <div className="flex items-center justify-between mb-6 border-b pb-3">
                      <h3 className="text-xl font-medium text-gray-900">
                        {selectedService ? 'Izmeni uslugu' : 'Dodaj uslugu'}
                      </h3>
                      <button
                        onClick={() => {
                          setIsServiceModalOpen(false);
                          resetServiceForm();
                        }}
                        className="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 
                                 focus:outline-none transition-colors duration-200"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                      <form onSubmit={handleServiceSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Naziv <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="naziv"
                            value={serviceFormData.naziv}
                            onChange={handleServiceInputChange}
                            className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                     focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                            placeholder="Unesite naziv usluge"
                          />
                          {errors.naziv && <p className="mt-1 text-sm text-red-600">{errors.naziv}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                          <textarea
                            name="opis"
                            value={serviceFormData.opis}
                            onChange={handleServiceInputChange}
                            rows="3"
                            className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                     focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                            placeholder="Unesite opis usluge"
                          />
                          {errors.opis && <p className="mt-1 text-sm text-red-600">{errors.opis}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cena (RSD) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="cena"
                              value={serviceFormData.cena}
                              onChange={handleServiceInputChange}
                              min="0"
                              step="0.01"
                              className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                       focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                              placeholder="0.00"
                            />
                            {errors.cena && <p className="mt-1 text-sm text-red-600">{errors.cena}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Trajanje (min) <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="trajanje"
                              value={serviceFormData.trajanje}
                              onChange={handleServiceInputChange}
                              className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                       focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                            >
                              {getDurationOptions().map((duration) => (
                                <option key={duration} value={duration}>
                                  {duration} minuta
                                </option>
                              ))}
                            </select>
                            {errors.trajanje && <p className="mt-1 text-sm text-red-600">{errors.trajanje}</p>}
                          </div>
                        </div>

                        {errors.general && (
                          <div className="p-3 rounded-xl bg-red-50 text-sm text-red-600">
                            {errors.general}
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                          <button
                            type="button"
                            onClick={() => {
                              setIsServiceModalOpen(false);
                              resetServiceForm();
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
                            {selectedService ? 'Sačuvaj' : 'Dodaj'}
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
      )}
    </div>
  );
};

export default WorkerDetails;
