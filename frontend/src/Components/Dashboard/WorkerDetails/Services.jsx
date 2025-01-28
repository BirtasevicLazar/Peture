import { useState, useEffect } from 'react';
import axios from 'axios';

const Services = ({ workerId }) => {
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

  // State za greške
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    if (workerId) {
      fetchWorker();
      fetchServices();
    }
  }, [workerId]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Error Display */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Services Container */}
      <div className="space-y-4">
        {/* Desktop table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                        <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {service.cena} RSD
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {service.trajanje} min
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleOpenServiceModal(service)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 
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
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 
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

          {/* Mobile view */}
          <div className="md:hidden divide-y divide-gray-200">
            {services.map((service) => (
              <div key={service.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{service.naziv}</h3>
                    <p className="text-sm text-gray-500 mt-1">{service.opis || '-'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {service.cena} RSD
                  </div>
                  <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {service.trajanje} min
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    onClick={() => handleOpenServiceModal(service)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 
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
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 
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
            ))}
          </div>
        </div>

        {/* Add Service Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => handleOpenServiceModal()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 
                     bg-white hover:bg-gray-50 text-green-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">Dodaj novu uslugu</span>
          </button>
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
  );
};

export default Services; 