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
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 transform hover:shadow-lg transition-all duration-300">
        <h3 className="text-lg font-light text-gray-900 mb-4 tracking-wide">Link za rezervacije</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-600 
                       text-sm sm:text-base font-light tracking-wide focus:ring-2 focus:ring-green-500 
                       focus:border-transparent transition-all duration-200"
            />
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center px-6 py-3 rounded-xl transition-all duration-200 
                     w-full sm:w-auto font-light text-sm ${
              error 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
            } transform hover:scale-105`}
          >
            {error ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Greška</span>
              </>
            ) : copied ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Kopirano!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Kopiraj</span>
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
      <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-xl shadow-lg mb-8 transform hover:scale-[1.01] transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide">Informacije o salonu</h2>
            <p className="text-green-50/90 mt-1 text-sm font-light">Upravljajte informacijama o vašem salonu</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                     text-sm font-light rounded-xl text-green-600 bg-white hover:bg-green-50 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                     transition-all duration-200 shadow-md transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Izmeni podatke
          </button>
        </div>
      </div>

      {/* Salon Info Card */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden mb-8 border border-gray-100 transform hover:shadow-lg transition-all duration-300">
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl transform group-hover:scale-110 transition-all duration-300">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-light text-gray-500">Naziv salona</label>
                <p className="mt-1 text-base font-light text-gray-900 tracking-wide">{salonData.salon_name || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl transform group-hover:scale-110 transition-all duration-300">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-light text-gray-500">Email</label>
                <p className="mt-1 text-base font-light text-gray-900 tracking-wide">{salonData.email || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl transform group-hover:scale-110 transition-all duration-300">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-light text-gray-500">Adresa</label>
                <p className="mt-1 text-base font-light text-gray-900 tracking-wide">{salonData.address || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl transform group-hover:scale-110 transition-all duration-300">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-light text-gray-500">Grad</label>
                <p className="mt-1 text-base font-light text-gray-900 tracking-wide">{salonData.city || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl transform group-hover:scale-110 transition-all duration-300">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-light text-gray-500">Telefon</label>
                <p className="mt-1 text-base font-light text-gray-900 tracking-wide">{salonData.phone || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking URL Section */}
      <BookingUrl />

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="min-h-screen px-4 text-center">
            {/* Vertikalno centriranje */}
            <div className="flex items-center justify-center min-h-screen">
              {/* Modal sadržaj */}
              <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all mx-auto">
                {/* Modal header sa gradijentom */}
                <div className="bg-gradient-to-r from-green-50 to-green-100/50 px-6 py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Izmeni podatke o salonu
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Ažurirajte informacije o vašem salonu
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setErrors({});
                      }}
                      className="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 
                               focus:outline-none transition-colors duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal body */}
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Naziv salona <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="salon_name"
                        value={editData.salon_name || ''}
                        onChange={handleInputChange}
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                        placeholder="Unesite naziv salona"
                      />
                      {errors.salon_name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.salon_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editData.email || ''}
                        onChange={handleInputChange}
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                        placeholder="primer@email.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresa <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={editData.address || ''}
                        onChange={handleInputChange}
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                        placeholder="Unesite adresu"
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={editData.city || ''}
                        onChange={handleInputChange}
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                        placeholder="Unesite grad"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={editData.phone || ''}
                        onChange={handleInputChange}
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 
                                 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                        placeholder="Unesite broj telefona"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Modal footer */}
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setErrors({});
                        }}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                                 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                                 focus:ring-green-500 transition-all duration-200"
                      >
                        Otkaži
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl 
                                 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                                 focus:ring-green-500 transition-all duration-200"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salon;