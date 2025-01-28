import { useState, useEffect } from 'react';
import axios from 'axios';

const Workers = ({ onWorkerSelect }) => {
  const [workers, setWorkers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    email: '',
    telefon: '',
    time_slot: '15'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/workers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Očisti grešku za to polje kada korisnik počne da kuca
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const resetForm = () => {
    setFormData({
      ime: '',
      prezime: '',
      email: '',
      telefon: '',
      time_slot: '15'
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/workers`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsModalOpen(false);
      resetForm();
      fetchWorkers();
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full pb-20 lg:pb-0">
      {/* Moderan Header sa gradijentom i animacijom */}
      <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-xl shadow-lg mb-8 transform hover:scale-[1.01] transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Radnici</h1>
            <p className="text-green-50 mt-1">Upravljajte svojim timom na jednom mestu</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                     text-sm font-medium rounded-xl text-green-600 bg-white hover:bg-green-50 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                     transition-all duration-200 shadow-md transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Dodaj radnika
          </button>
        </div>
      </div>

      {/* Loading stanje */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        /* Kontejner za kartice/tabelu */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
          {/* Desktop tabela */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ime i prezime
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefon
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workers.map((worker) => (
                    <tr 
                      key={worker.id}
                      onClick={() => onWorkerSelect(worker)}
                      className="hover:bg-gray-50 transition-all duration-200 cursor-pointer transform hover:scale-[1.01]"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 
                                          flex items-center justify-center text-white font-medium shadow-md">
                              {worker.ime[0]}{worker.prezime[0]}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{worker.ime} {worker.prezime}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{worker.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{worker.telefon}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobilne kartice sa animacijama */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  onClick={() => onWorkerSelect(worker)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02]"
                >
                  <div className="p-4 sm:p-5">
                    {/* Worker Header */}
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 
                                    flex items-center justify-center text-white text-lg font-medium shadow-md">
                        {worker.ime[0]}{worker.prezime[0]}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {worker.ime} {worker.prezime}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Worker Info sa ikonicama */}
                    <div className="space-y-2.5">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{worker.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="truncate">{worker.telefon}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal za dodavanje radnika sa animacijama */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Animirani overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              aria-hidden="true"
            />

            {/* Modal pozicioniranje */}
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            {/* Modal sadržaj sa animacijom */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative inline-block transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle animate-modal-up"
            >
              {/* Modal header */}
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none transition-colors duration-200"
                >
                  <span className="sr-only">Zatvori</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-white">
                <div className="px-4 pt-5 pb-4 sm:p-6">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                      Dodaj radnika
                    </h3>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="px-4 sm:px-6">
                  <div className="space-y-6">
                    {/* Osnovni podaci */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Osnovni podaci</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="ime" className="block text-sm font-medium text-gray-700">
                            Ime <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="ime"
                            type="text"
                            name="ime"
                            value={formData.ime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                          {errors.ime && (
                            <p className="mt-1 text-sm text-red-600 animate-fade-in">
                              {errors.ime}
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="prezime" className="block text-sm font-medium text-gray-700">
                            Prezime <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="prezime"
                            type="text"
                            name="prezime"
                            value={formData.prezime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                          {errors.prezime && (
                            <p className="mt-1 text-sm text-red-600 animate-fade-in">
                              {errors.prezime}
                            </p>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600 animate-fade-in">
                              {errors.email}
                            </p>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label htmlFor="telefon" className="block text-sm font-medium text-gray-700">
                            Telefon <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="telefon"
                            type="tel"
                            name="telefon"
                            value={formData.telefon}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                          {errors.telefon && (
                            <p className="mt-1 text-sm text-red-600 animate-fade-in">
                              {errors.telefon}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Modal footer */}
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 sticky bottom-0 mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`inline-flex w-full justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto
                        ${isSubmitting ? 
                          'bg-gray-400 cursor-not-allowed' : 
                          'bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                        } transition-all duration-200 transform hover:scale-105`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Dodavanje...
                        </>
                      ) : 'Dodaj'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all duration-200 transform hover:scale-105"
                    >
                      Otkaži
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
