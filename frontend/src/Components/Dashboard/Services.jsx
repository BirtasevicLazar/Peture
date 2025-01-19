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
    trajanje: ''
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
        trajanje: ''
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
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Dodaj uslugu
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="hidden md:block"> {/* Desktop table */}
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
                <tr key={service.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{service.naziv}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{service.opis || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{service.cena}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{service.trajanje}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(service)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Izmeni
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Obriši
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="text-base font-semibold text-gray-900">{service.naziv}</div>
                    <div className="text-sm text-gray-600">{service.opis || '-'}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium text-green-600">{service.cena} RSD</span>
                      <span className="text-sm text-gray-500">{service.trajanje} min</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleOpenModal(service)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full mx-4 md:mx-auto md:max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {selectedService ? 'Izmeni uslugu' : 'Dodaj uslugu'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Naziv</label>
                  <input
                    type="text"
                    name="naziv"
                    value={formData.naziv}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.naziv && <p className="text-red-500 text-xs mt-1">{errors.naziv}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Opis</label>
                  <textarea
                    name="opis"
                    value={formData.opis}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.opis && <p className="text-red-500 text-xs mt-1">{errors.opis}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cena (RSD)</label>
                  <input
                    type="number"
                    name="cena"
                    value={formData.cena}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.cena && <p className="text-red-500 text-xs mt-1">{errors.cena}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trajanje (min)</label>
                  <input
                    type="number"
                    name="trajanje"
                    value={formData.trajanje}
                    onChange={handleInputChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.trajanje && <p className="text-red-500 text-xs mt-1">{errors.trajanje}</p>}
                </div>
              </div>
              {errors.general && (
                <div className="mb-4 text-red-500 text-sm">
                  {errors.general}
                </div>
              )}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  {selectedService ? 'Sačuvaj' : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
