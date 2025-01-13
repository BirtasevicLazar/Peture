import { useState, useEffect } from 'react';
import axios from 'axios';

const Salon = () => {
  const [salonData, setSalonData] = useState({
    salon_name: '',
    address: '',
    city: '',
    phone: '',
    email: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchSalonData();
  }, []);

  const fetchSalonData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSalonData(response.data);
    } catch (error) {
      console.error('Error fetching salon data:', error);
    }
  };

  const handleInputChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleOpenModal = () => {
    setEditData({ ...salonData });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/user/update`, editData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSalonData(response.data.user);
      setIsModalOpen(false);
      setErrors({});
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Informacije o salonu</h2>
        <button
          onClick={handleOpenModal}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Izmeni podatke
        </button>
      </div>

      {/* Salon Info Card */}
      <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Naziv salona</label>
            <p className="mt-1 text-lg text-gray-900">{salonData.salon_name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-lg text-gray-900">{salonData.email || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Adresa</label>
            <p className="mt-1 text-lg text-gray-900">{salonData.address || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Grad</label>
            <p className="mt-1 text-lg text-gray-900">{salonData.city || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Telefon</label>
            <p className="mt-1 text-lg text-gray-900">{salonData.phone || '-'}</p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Izmeni podatke o salonu</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Naziv salona</label>
                  <input
                    type="text"
                    name="salon_name"
                    value={editData.salon_name || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.salon_name && <p className="text-red-500 text-xs mt-1">{errors.salon_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresa</label>
                  <input
                    type="text"
                    name="address"
                    value={editData.address || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grad</label>
                  <input
                    type="text"
                    name="city"
                    value={editData.city || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="text"
                    name="phone"
                    value={editData.phone || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrors({});
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Sačuvaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salon;