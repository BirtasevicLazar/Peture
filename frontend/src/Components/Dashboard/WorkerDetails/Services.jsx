import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

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

  const handleDeleteClick = (service) => {
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteService = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/services/${serviceToDelete.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      await fetchServices();
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Došlo je do greške prilikom brisanja usluge.');
    }
  };

  useEffect(() => {
    if (workerId) {
      fetchWorker();
      fetchServices();
    }
  }, [workerId]);

  return (
    <div className="w-full pt-6">
      <div className="px-4 space-y-4">
        {/* Desktop prikaz */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Naziv</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Opis</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Cena</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Trajanje</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((service) => (
                  <tr 
                    key={service.id} 
                    className="group hover:bg-gray-50/50 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{service.naziv}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-2">{service.opis || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700">
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.cena} RSD
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700">
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.trajanje} min
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenServiceModal(service)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                                   bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Izmeni
                        </button>
                        <button
                          onClick={() => handleDeleteClick(service)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 
                                   bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
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

        {/* Mobilni prikaz */}
        <div className="lg:hidden space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-medium text-gray-900">{service.naziv}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenServiceModal(service)}
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(service)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.opis || '-'}</p>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center p-2 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Cena</span>
                      <span className="text-sm font-medium text-gray-900">{service.cena} RSD</span>
                    </div>
                  </div>

                  <div className="flex items-center p-2 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Trajanje</span>
                      <span className="text-sm font-medium text-gray-900">{service.trajanje} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dugme za dodavanje */}
        <button
          onClick={() => handleOpenServiceModal()}
          className="w-full flex items-center justify-center gap-2 p-4 
                   bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl
                   transition-colors duration-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm font-medium">Dodaj novu uslugu</span>
        </button>

        {/* Modal */}
        <AnimatePresence>
          {isServiceModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
                   onClick={() => setIsServiceModalOpen(false)} />
              
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
                  <div className="p-6">
                    {/* Modal header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {selectedService ? 'Izmeni uslugu' : 'Dodaj uslugu'}
                          </h3>
                          <p className="text-sm text-gray-500">Popunite detalje o usluzi</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsServiceModalOpen(false);
                          resetServiceForm();
                        }}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Modal body */}
                    <form onSubmit={handleServiceSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1.5">
                          Naziv <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="naziv"
                          value={serviceFormData.naziv}
                          onChange={handleServiceInputChange}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                   focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Unesite naziv usluge"
                        />
                        {errors.naziv && <p className="mt-1 text-xs text-red-600">{errors.naziv}</p>}
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1.5">Opis</label>
                        <textarea
                          name="opis"
                          value={serviceFormData.opis}
                          onChange={handleServiceInputChange}
                          rows="3"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                   focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Unesite opis usluge"
                        />
                        {errors.opis && <p className="mt-1 text-xs text-red-600">{errors.opis}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1.5">
                            Cena (RSD) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="cena"
                            value={serviceFormData.cena}
                            onChange={handleServiceInputChange}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0.00"
                          />
                          {errors.cena && <p className="mt-1 text-xs text-red-600">{errors.cena}</p>}
                        </div>

                        <div>
                          <label className="block text-sm text-gray-700 mb-1.5">
                            Trajanje (min) <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="trajanje"
                            value={serviceFormData.trajanje}
                            onChange={handleServiceInputChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                                     focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            {getDurationOptions().map((duration) => (
                              <option key={duration} value={duration}>
                                {duration} minuta
                              </option>
                            ))}
                          </select>
                          {errors.trajanje && <p className="mt-1 text-xs text-red-600">{errors.trajanje}</p>}
                        </div>
                      </div>

                      {/* Errors display */}
                      {errors.general && (
                        <div className="p-4 bg-red-50 rounded-xl">
                          <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                      )}

                      {/* Modal footer */}
                      <div className="flex justify-end gap-3 pt-6 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            setIsServiceModalOpen(false);
                            resetServiceForm();
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
                          {selectedService ? 'Sačuvaj' : 'Dodaj'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal za brisanje */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
                   onClick={() => setIsDeleteModalOpen(false)} />
              
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Brisanje usluge
                          </h3>
                          <p className="text-sm text-gray-500">Ova akcija je nepovratna</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        Da li ste sigurni da želite da obrišete uslugu <span className="font-medium text-gray-900">{serviceToDelete?.naziv}</span>?
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                                 rounded-xl hover:bg-gray-50"
                      >
                        Otkaži
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteService}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl 
                                 hover:bg-red-700"
                      >
                        Obriši
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Services; 