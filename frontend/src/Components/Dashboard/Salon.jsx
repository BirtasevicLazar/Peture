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

  const BookingUrl = () => {
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(false);
    const bookingUrl = `${window.location.origin}/booking/${salonData.slug}`;

    const handleCopy = async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          // Za moderne browsere
          await navigator.clipboard.writeText(bookingUrl);
          setCopied(true);
        } else {
          // Fallback za starije browsere
          const textArea = document.createElement("textarea");
          textArea.value = bookingUrl;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            document.execCommand('copy');
            textArea.remove();
            setCopied(true);
          } catch (err) {
            console.error('Greška pri kopiranju:', err);
            setError(true);
            textArea.remove();
            return;
          }
        }
        
        setTimeout(() => {
          setCopied(false);
          setError(false);
        }, 2000);
      } catch (err) {
        console.error('Greška pri kopiranju:', err);
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    };

    return (
      <div className="mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Link za rezervacije</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              className="w-full p-3 border rounded-lg bg-gray-50 text-gray-600 pr-4 text-sm sm:text-base"
            />
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 w-full sm:w-auto
              ${error 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
          >
            {error ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">Greška</span>
              </>
            ) : copied ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Kopirano!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span className="font-medium">Kopiraj</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
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

      {/* Salon Info Card - Mobile Optimized */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 md:p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Naziv salona</label>
              <p className="mt-1 text-base font-medium text-gray-900">{salonData.salon_name || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
              <p className="mt-1 text-base text-gray-900">{salonData.email || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Adresa</label>
              <p className="mt-1 text-base text-gray-900">{salonData.address || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Grad</label>
              <p className="mt-1 text-base text-gray-900">{salonData.city || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</label>
              <p className="mt-1 text-base text-gray-900">{salonData.phone || '-'}</p>
            </div>
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
      <BookingUrl />
    </div>
  );
};

export default Salon;