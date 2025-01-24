import { useState, useEffect } from 'react';
import axios from 'axios';

const Workers = ({ onWorkerSelect }) => {
  const [workers, setWorkers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    email: '',
    telefon: '',
    time_slot: '15'
  });
  const [errors, setErrors] = useState({});
  const [hasServices, setHasServices] = useState(false);
  const [workerServices, setWorkerServices] = useState([]);

  const fetchWorkers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/workers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchWorkerServices = async (workerId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/services?worker_id=${workerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWorkerServices(response.data);
    } catch (error) {
      console.error('Error fetching worker services:', error);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      setHasServices(selectedWorker.services && selectedWorker.services.length > 0);
      fetchWorkerServices(selectedWorker.id);
    }
  }, [selectedWorker]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Resetuj grešku za time_slot kada se promeni vrednost
    if (name === 'time_slot') {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.time_slot;
        return newErrors;
      });
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ ime: '', prezime: '', email: '', telefon: '', time_slot: '15' });
    setErrors({});
    setSelectedWorker(null);
  };

  const handleOpenModal = (worker = null) => {
    if (worker) {
      setSelectedWorker(worker);
      setFormData({
        ime: worker.ime,
        prezime: worker.prezime,
        email: worker.email,
        telefon: worker.telefon,
        time_slot: worker.time_slot
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Provera da li postoji greška za time_slot
    if (errors.time_slot) {
      return;
    }
    
    try {
      if (selectedWorker) {
        await axios.put(`${import.meta.env.VITE_API_URL}/workers/${selectedWorker.id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/workers`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      setIsModalOpen(false);
      resetForm();
      fetchWorkers();
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  const handleDelete = async (workerId, e) => {
    e.stopPropagation(); // Prevent row click
    if (window.confirm('Da li ste sigurni da želite da obrišete ovog radnika?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/workers/${workerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchWorkers();
      } catch (error) {
        console.error('Error deleting worker:', error);
      }
    }
  };

  const isTimeSlotDisabled = (value) => {
    // Ako nema usluga ili nije selektovan radnik, sve opcije su dostupne
    if (!hasServices || !selectedWorker) return false;
    
    // Ako postoji greška za trenutni time_slot, opcija je onemogućena
    if (errors.time_slot && Math.abs(parseInt(formData.time_slot)) === Math.abs(value)) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="h-full pb-20 lg:pb-0">
      {/* Moderan Header */}
      <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-xl shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Radnici</h1>
            <p className="text-green-50 mt-1">Upravljajte svojim timom na jednom mestu</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                     text-sm font-medium rounded-xl text-green-600 bg-white hover:bg-green-50 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                     transition-all duration-200 shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Dodaj radnika
          </button>
        </div>
      </div>

      {/* Kontejner za kartice/tabelu */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vremenski slot
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workers.map((worker) => (
                  <tr 
                    key={worker.id}
                    onClick={() => onWorkerSelect(worker)}
                    className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 
                                        flex items-center justify-center text-white font-medium">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {worker.time_slot} min
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(worker);
                          }}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDelete(worker.id, e)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobilne kartice */}
        <div className="lg:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                onClick={() => onWorkerSelect(worker)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                     bg-green-100 text-green-800 mt-1">
                        {worker.time_slot} min
                      </span>
                    </div>
                  </div>
                  
                  {/* Worker Info */}
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

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(worker);
                      }}
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
                      onClick={(e) => handleDelete(worker.id, e)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              aria-hidden="true"
            />

            {/* Modal pozicioniranje */}
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            {/* Modal sadržaj */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative inline-block transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle"
            >
              {/* Modal header */}
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
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
                      {selectedWorker ? 'Izmeni podatke o radniku' : 'Dodaj radnika'}
                    </h3>
                  </div>
                </div>

                <form id="worker-form" onSubmit={handleSubmit} className="max-h-[calc(100vh-200px)] overflow-y-auto px-4 sm:px-6">
                  <div className="space-y-6">
                    {/* Osnovni podaci */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Osnovni podaci</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="col-span-1">
                          <label htmlFor="ime" className="block text-sm font-medium text-gray-700">
                            Ime <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="ime"
                            type="text"
                            name="ime"
                            value={formData.ime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-200"
                            required
                          />
                          {errors.ime && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.ime}
                            </p>
                          )}
                        </div>
                        <div className="col-span-1">
                          <label htmlFor="prezime" className="block text-sm font-medium text-gray-700">
                            Prezime <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="prezime"
                            type="text"
                            name="prezime"
                            value={formData.prezime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-200"
                            required
                          />
                          {errors.prezime && (
                            <p className="mt-1 text-sm text-red-600">
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
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-200"
                            required
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600">
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
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-200"
                            required
                          />
                          {errors.telefon && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.telefon}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Način rada sa terminima */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Način rada sa terminima</h3>
                      
                      {/* Info box */}
                      <div className="rounded-lg bg-blue-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-blue-800">Kako izabrati način rada?</h4>
                            <p className="mt-2 text-sm text-blue-700">
                              Izaberite način koji najbolje odgovara vašem stilu rada i vrsti usluga koje pružate.
                              Ovo podešavanje određuje kako će klijenti videti slobodne termine za zakazivanje.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Time slot options */}
                      <div className="space-y-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                          <fieldset>
                            <legend className="text-base font-medium text-gray-900">Klasičan prikaz termina</legend>
                            <p className="text-sm text-gray-500 mt-1">
                              Termini su podeljeni na fiksne intervale. Idealno za standardizovane usluge.
                            </p>
                            {errors.time_slot && (
                              <div className="mt-2 rounded-md bg-red-50 p-4">
                                <div className="flex">
                                  <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm text-red-700">{errors.time_slot}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="mt-4 space-y-3">
                              {[10, 15, 20, 30, 60].map(value => (
                                <label
                                  key={value}
                                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200
                                    ${parseInt(formData.time_slot) === value 
                                      ? 'border-green-500 bg-green-50' 
                                      : 'border-gray-200 bg-white hover:bg-gray-50'}
                                    ${isTimeSlotDisabled(value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <input
                                    type="radio"
                                    name="time_slot"
                                    value={value}
                                    checked={parseInt(formData.time_slot) === value}
                                    onChange={handleInputChange}
                                    className="sr-only"
                                    disabled={isTimeSlotDisabled(value)}
                                  />
                                  <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center">
                                      <div className="text-sm">
                                        <p className="font-medium text-gray-900">{value} minuta</p>
                                        <p className="text-gray-500">
                                          {value === 10 && "Za najkraće usluge"}
                                          {value === 15 && "Za kratke usluge"}
                                          {value === 20 && "Idealno za većinu usluga"}
                                          {value === 30 && "Za duže tretmane"}
                                          {value === 60 && "Za dugačke tretmane"}
                                        </p>
                                      </div>
                                    </div>
                                    {parseInt(formData.time_slot) === value && (
                                      <svg 
                                        className="h-5 w-5 text-green-600" 
                                        viewBox="0 0 20 20" 
                                        fill="currentColor"
                                      >
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                          <fieldset>
                            <legend className="text-base font-medium text-gray-900">Prikaz prema trajanju usluge</legend>
                            <p className="text-sm text-gray-500 mt-1">
                              Termini se automatski prilagođavaju trajanju svake usluge.
                            </p>
                            <div className="mt-4 space-y-3">
                              {[-10, -15, -20, -30, -60].map(value => (
                                <label
                                  key={value}
                                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200
                                    ${parseInt(formData.time_slot) === value 
                                      ? 'border-green-500 bg-green-50' 
                                      : 'border-gray-200 bg-white hover:bg-gray-50'}
                                    ${isTimeSlotDisabled(value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <input
                                    type="radio"
                                    name="time_slot"
                                    value={value}
                                    checked={parseInt(formData.time_slot) === value}
                                    onChange={handleInputChange}
                                    className="sr-only"
                                    disabled={isTimeSlotDisabled(value)}
                                  />
                                  <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center">
                                      <div className="text-sm">
                                        <p className="font-medium text-gray-900">{Math.abs(value)} minuta</p>
                                        <p className="text-gray-500">
                                          {value === -10 && "Za najkraće usluge sa prilagođenim trajanjem"}
                                          {value === -15 && "Za precizno praćenje kraćih usluga"}
                                          {value === -20 && "Optimalno za mešavinu različitih usluga"}
                                          {value === -30 && "Za salone sa pretežno dužim tretmanima"}
                                          {value === -60 && "Za salone sa dugačkim tretmanima"}
                                        </p>
                                      </div>
                                    </div>
                                    {parseInt(formData.time_slot) === value && (
                                      <svg 
                                        className="h-5 w-5 text-green-600" 
                                        viewBox="0 0 20 20" 
                                        fill="currentColor"
                                      >
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        </div>
                      </div>

                      {/* Warning for existing services */}
                      {hasServices && (
                        <div className="rounded-lg bg-yellow-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-yellow-800">Napomena</h4>
                              <p className="mt-2 text-sm text-yellow-700">
                                Pošto već imate postavljene usluge, možete samo promeniti način rada za trenutnu 
                                dužinu termina od {Math.abs(selectedWorker.time_slot)} minuta (klasičan/prema trajanju).
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Modal footer */}
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 sticky bottom-0 mt-6">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
                    >
                      {selectedWorker ? 'Sačuvaj' : 'Dodaj'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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
