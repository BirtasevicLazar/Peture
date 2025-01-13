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
    telefon: ''
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
    setFormData({ ime: '', prezime: '', email: '', telefon: '' });
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
        telefon: worker.telefon
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Radnici</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Dodaj radnika
        </button>
      </div>

      {/* Workers Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ime i prezime</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workers.map((worker) => (
              <tr 
                key={worker.id} 
                onClick={() => onWorkerSelect(worker)}
                className="hover:bg-gray-50"
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(worker);
                    }}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    Izmeni
                  </button>
                  <button
                    onClick={(e) => handleDelete(worker.id, e)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {selectedWorker ? 'Izmeni podatke o radniku' : 'Dodaj radnika'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ime</label>
                  <input
                    type="text"
                    name="ime"
                    value={formData.ime}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.ime && <p className="text-red-500 text-xs mt-1">{errors.ime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prezime</label>
                  <input
                    type="text"
                    name="prezime"
                    value={formData.prezime}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.prezime && <p className="text-red-500 text-xs mt-1">{errors.prezime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="text"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.telefon && <p className="text-red-500 text-xs mt-1">{errors.telefon}</p>}
                </div>
              </div>
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
                  {selectedWorker ? 'Sačuvaj' : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
