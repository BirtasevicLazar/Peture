import { useState, useEffect } from 'react';
import axios from 'axios';

const Services = ({ workerId }) => {
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    naziv: '',
    opis: '',
    cena: '',
    trajanje: '30'
  });
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    if (workerId) {
      fetchServices();
    }
  }, [workerId]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
        naziv: '',
        opis: '',
        cena: '',
        trajanje: '30'
    });
    setErrors({});
    setSelectedService(null);
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        naziv: service.naziv,
        opis: service.opis || '',
        cena: service.cena.toString(),
        trajanje: service.trajanje.toString()
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        worker_id: workerId,
        naziv: formData.naziv,
        opis: formData.opis || '',
        cena: parseFloat(formData.cena),
        trajanje: parseInt(formData.trajanje)
      };

      if (selectedService) {
        await axios.put(`${import.meta.env.VITE_API_URL}/services/${selectedService.id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/services`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log('Service created:', response.data);
      }
      setIsModalOpen(false);
      fetchServices();
      resetForm();
    } catch (error) {
      console.error('Error submitting service:', error.response?.data);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Došlo je do greške prilikom čuvanja usluge.' });
      }
    }
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovu uslugu?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/services/${serviceId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  return (
    <div className="h-full pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Usluge</h2>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent 
                     text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                     transition-colors duration-200 shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Dodaj uslugu
          </button>
        </div>
      </div>

      {/* Services Table/Cards Container */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="hidden md:block"> {/* Desktop table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naziv</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cena (RSD)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajanje (min)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
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
                      <div className="text-sm font-medium text-green-600">{service.cena} RSD</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{service.trajanje} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(service)}
                        className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-150"
                      >
                        <span className="sr-only">Izmeni</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-150"
                      >
                        <span className="sr-only">Obriši</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          <div className="divide-y divide-gray-200">
            {services.map((service) => (
              <div key={service.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-gray-900">{service.naziv}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">{service.opis || '-'}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenModal(service)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="flex items-center text-sm font-medium text-green-600">
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.cena} RSD
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.trajanje} min
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedService ? 'Izmeni uslugu' : 'Dodaj uslugu'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors duration-150"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naziv</label>
                  <input
                    type="text"
                    name="naziv"
                    value={formData.naziv}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.naziv && <p className="mt-1 text-sm text-red-600">{errors.naziv}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea
                    name="opis"
                    value={formData.opis}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.opis && <p className="mt-1 text-sm text-red-600">{errors.opis}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cena (RSD)</label>
                  <input
                    type="number"
                    name="cena"
                    value={formData.cena}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.cena && <p className="mt-1 text-sm text-red-600">{errors.cena}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trajanje (min)</label>
                  <select
                    name="trajanje"
                    value={formData.trajanje}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {[15, 30, 45, 60, 90, 120, 150, 180].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} minuta
                      </option>
                    ))}
                  </select>
                  {errors.trajanje && <p className="mt-1 text-sm text-red-600">{errors.trajanje}</p>}
                </div>
                {errors.general && (
                  <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600">
                    {errors.general}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                             rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                             focus:ring-green-500 transition-colors duration-200"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg 
                             hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                             focus:ring-green-500 transition-colors duration-200"
                  >
                    {selectedService ? 'Sačuvaj' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
