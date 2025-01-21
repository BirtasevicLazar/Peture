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
    time_slot: '30'
  });
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ ime: '', prezime: '', email: '', telefon: '', time_slot: '30' });
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

  return (
    <div className="h-full pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Radnici</h1>
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
            Dodaj radnika
          </button>
        </div>
      </div>

      {/* Workers Table/Cards Container */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="hidden md:block"> {/* Desktop table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ime i prezime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vremenski slot</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workers.map((worker) => (
                  <tr 
                    key={worker.id} 
                    onClick={() => onWorkerSelect(worker)}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
                      <div className="text-sm font-medium text-gray-900">{worker.ime} {worker.prezime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
                      <div className="text-sm text-gray-500">{worker.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
                      <div className="text-sm text-gray-500">{worker.telefon}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
                      <div className="text-sm text-gray-500">{worker.time_slot} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(worker);
                        }}
                        className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-150"
                      >
                        <span className="sr-only">Izmeni</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(worker.id, e)}
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
            {workers.map((worker) => (
              <div 
                key={worker.id}
                onClick={() => onWorkerSelect(worker)}
                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="text-base font-semibold text-gray-900">
                      {worker.ime} {worker.prezime}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <div className="text-sm text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {worker.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {worker.telefon}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Vremenski slot: {worker.time_slot} min
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(worker);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(worker.id, e)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedWorker ? 'Izmeni podatke o radniku' : 'Dodaj radnika'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ime</label>
                  <input
                    type="text"
                    name="ime"
                    value={formData.ime}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.ime && <p className="mt-1 text-sm text-red-600">{errors.ime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prezime</label>
                  <input
                    type="text"
                    name="prezime"
                    value={formData.prezime}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.prezime && <p className="mt-1 text-sm text-red-600">{errors.prezime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.telefon && <p className="mt-1 text-sm text-red-600">{errors.telefon}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vremenski slot (min)</label>
                  <select
                    name="time_slot"
                    value={formData.time_slot}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="15">15 minuta</option>
                    <option value="30">30 minuta</option>
                    <option value="45">45 minuta</option>
                    <option value="60">60 minuta</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Ovo je najmanja jedinica vremena za zakazivanje termina
                  </p>
                </div>
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
                    {selectedWorker ? 'Sačuvaj' : 'Dodaj'}
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

export default Workers;
