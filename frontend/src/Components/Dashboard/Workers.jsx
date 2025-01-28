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
            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-wide">Radnici</h1>
            <p className="text-green-50/90 mt-1 text-sm font-light">Upravljajte svojim timom na jednom mestu</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                     text-sm font-light rounded-xl text-green-600 bg-white hover:bg-green-50 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                     transition-all duration-200 shadow-md transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
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
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Desktop View */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            {workers.map((worker) => (
              <div
                key={worker.id}
                onClick={() => onWorkerSelect(worker)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 
                         overflow-hidden cursor-pointer border border-gray-100 group"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    {worker.profile_image ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL}/worker-image/${worker.profile_image.split('/').pop()}`}
                        alt={`${worker.ime} ${worker.prezime}`}
                        className="h-14 w-14 rounded-xl object-cover shadow-md transform group-hover:scale-110 transition-all duration-300"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-400/80 to-blue-500/80 
                                  flex items-center justify-center text-white text-xl font-light shadow-md
                                  transform group-hover:scale-110 transition-all duration-300">
                        {worker.ime[0]}{worker.prezime[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-light text-gray-900 tracking-wide">
                        {worker.ime} {worker.prezime}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600 font-light">
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate tracking-wide">{worker.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 font-light">
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate tracking-wide">{worker.telefon || 'Nije uneto'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                onClick={() => onWorkerSelect(worker)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 
                         overflow-hidden cursor-pointer border border-gray-100 group"
              >
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    {worker.profile_image ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL}/worker-image/${worker.profile_image.split('/').pop()}`}
                        alt={`${worker.ime} ${worker.prezime}`}
                        className="h-12 w-12 rounded-lg object-cover shadow-md transform group-hover:scale-110 transition-all duration-300"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-400/80 to-blue-500/80 
                                  flex items-center justify-center text-white text-base font-light transform 
                                  group-hover:scale-110 transition-all duration-300">
                        {worker.ime[0]}{worker.prezime[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-light text-gray-900 tracking-wide">
                        {worker.ime} {worker.prezime}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-xs text-gray-600 font-light">
                      <svg className="w-3.5 h-3.5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate tracking-wide">{worker.email}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 font-light">
                      <svg className="w-3.5 h-3.5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate tracking-wide">{worker.telefon || 'Nije uneto'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal za dodavanje radnika sa animacijama */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            {/* Overlay sa animacijom */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              aria-hidden="true"
            />

            {/* Vertikalno centriranje */}
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            {/* Modal sadržaj sa animacijom */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative inline-block w-full max-w-2xl p-6 my-8 text-left align-middle bg-white 
                       rounded-2xl shadow-xl transform transition-all animate-modal-slide-up"
            >
              {/* Modal header sa gradijentom */}
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-xl bg-white text-gray-400 hover:text-gray-500 focus:outline-none 
                           transition-colors duration-200 p-2 hover:bg-gray-100"
                >
                  <span className="sr-only">Zatvori</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-white">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-light text-gray-900 tracking-wide">
                    Dodaj radnika
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 font-light">
                    Unesite osnovne informacije o radniku
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-6">
                    {/* Osnovni podaci */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-light text-gray-700 mb-2">
                            Ime <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="ime"
                            value={formData.ime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 
                                     focus:ring-green-500 focus:border-transparent transition-all duration-200
                                     text-sm font-light"
                            placeholder="Unesite ime"
                          />
                          {errors.ime && (
                            <p className="mt-2 text-sm text-red-600 font-light">{errors.ime}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-light text-gray-700 mb-2">
                            Prezime <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="prezime"
                            value={formData.prezime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 
                                     focus:ring-green-500 focus:border-transparent transition-all duration-200
                                     text-sm font-light"
                            placeholder="Unesite prezime"
                          />
                          {errors.prezime && (
                            <p className="mt-2 text-sm text-red-600 font-light">{errors.prezime}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 
                                   focus:ring-green-500 focus:border-transparent transition-all duration-200
                                   text-sm font-light"
                          placeholder="primer@email.com"
                        />
                        {errors.email && (
                          <p className="mt-2 text-sm text-red-600 font-light">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-light text-gray-700 mb-2">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          name="telefon"
                          value={formData.telefon}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 
                                   focus:ring-green-500 focus:border-transparent transition-all duration-200
                                   text-sm font-light"
                          placeholder="Unesite broj telefona"
                        />
                        {errors.telefon && (
                          <p className="mt-2 text-sm text-red-600 font-light">{errors.telefon}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal footer */}
                  <div className="flex flex-col sm:flex-row-reverse gap-3 pt-6 border-t">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 justify-center px-4 py-3 text-sm font-light text-white 
                               bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 
                               focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 
                               disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]
                               ${isSubmitting ? 'cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" 
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Dodavanje...
                        </div>
                      ) : 'Dodaj radnika'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-3 text-sm font-light text-gray-700 bg-white 
                               border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none 
                               focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                               transition-all duration-200 transform hover:scale-[1.02]"
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
