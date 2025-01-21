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
    <div className="h-full pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Informacije o salonu</h2>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent 
                     text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                     transition-colors duration-200 shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Izmeni podatke
          </button>
        </div>
      </div>

      {/* Salon Info Card */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

      {/* Booking URL Section */}
      <BookingUrl />

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Izmeni podatke o salonu</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naziv salona</label>
                  <input
                    type="text"
                    name="salon_name"
                    value={editData.salon_name || ''}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.salon_name && <p className="mt-1 text-sm text-red-600">{errors.salon_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email || ''}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresa</label>
                  <input
                    type="text"
                    name="address"
                    value={editData.address || ''}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grad</label>
                  <input
                    type="text"
                    name="city"
                    value={editData.city || ''}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    name="phone"
                    value={editData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setErrors({});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Sačuvaj
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

export default Salon;