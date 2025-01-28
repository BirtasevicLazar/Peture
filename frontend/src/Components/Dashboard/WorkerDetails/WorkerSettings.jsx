import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const WorkerSettings = ({ worker, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    email: '',
    telefon: '',
    profile_image: null
  });

  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (worker) {
      setFormData({
        ime: worker.ime || '',
        prezime: worker.prezime || '',
        email: worker.email || '',
        telefon: worker.telefon || '',
        profile_image: null
      });
      // Postavi preview slike ako radnik ima sliku
      if (worker.profile_image) {
        setPreviewImage(`${import.meta.env.VITE_API_URL}/worker-image/${worker.profile_image.split('/').pop()}`);
      }
    }
  }, [worker]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profile_image: file }));
      // Kreiraj preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('ime', formData.ime);
      formDataToSend.append('prezime', formData.prezime);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telefon', formData.telefon || '');
      formDataToSend.append('time_slot', worker.time_slot);
      
      if (formData.profile_image) {
        formDataToSend.append('profile_image', formData.profile_image);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/workers/${worker.id}?_method=PUT`,
        formDataToSend,
        { 
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          } 
        }
      );

      if (response.data && response.data.worker) {
        onUpdate(response.data.worker);
        setIsModalOpen(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Došlo je do greške prilikom ažuriranja radnika.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Niste autorizovani');
        return;
      }

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/workers/${worker.id}`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success('Radnik je uspešno obrisan');
      setShowDeleteConfirm(false);
      // Vratite se na listu radnika
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Greška prilikom brisanja radnika:', error);
      if (error.response?.status === 404) {
        toast.error('Radnik nije pronađen');
      } else if (error.response?.status === 403) {
        toast.error('Nemate dozvolu za brisanje ovog radnika');
      } else {
        toast.error(error.response?.data?.message || 'Došlo je do greške prilikom brisanja radnika');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pt-6">
      {/* Worker Info Card */}
      <div className="px-4 space-y-3">
        {/* Profilna slika */}
        <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="relative">
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt={`${worker?.ime} ${worker?.prezime}`}
                  className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-400/80 to-blue-500/80 
                            flex items-center justify-center text-white text-2xl font-light shadow-lg">
                  {worker?.ime?.[0]}{worker?.prezime?.[0]}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm text-green-600 bg-green-50 
                       hover:bg-green-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Promeni sliku
            </button>
          </div>
        </div>

        {/* Info sekcije */}
        <div className="bg-white p-3 shadow-sm border border-gray-100 rounded-lg">
          <h4 className="text-sm font-normal text-gray-500 mb-3 text-center">Osnovni podaci</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-gray-500">Ime</span>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm font-normal text-gray-900">{worker?.ime}</p>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500">Prezime</span>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm font-normal text-gray-900">{worker?.prezime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kontakt informacije */}
        <div className="bg-white p-3 shadow-sm border border-gray-100 rounded-lg">
          <h4 className="text-sm font-normal text-gray-500 mb-3 text-center">Kontakt informacije</h4>
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-xs text-gray-500">Email</span>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-normal text-gray-900 break-all">{worker?.email}</p>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500">Telefon</span>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <p className="text-sm font-normal text-gray-900">{worker?.telefon || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Akcije */}
        <div className="flex flex-col gap-2 pt-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm 
                     text-green-600 bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg
                     transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Izmeni podatke
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm 
                     text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg
                     transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Obriši radnika
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="min-h-screen px-4 text-center">
            <div className="flex items-center justify-center min-h-screen">
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-lg shadow-xl p-6 text-left transform transition-all"
              >
                {/* Modal Header */}
                <div className="text-center mb-6 relative">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute right-0 top-0 text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Izmena podataka radnika
                  </h3>
                </div>

                {/* Image Upload Section */}
                <div className="mb-6">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt="Preview"
                          className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="h-32 w-32 rounded-full bg-gradient-to-br from-green-400/80 to-blue-500/80 
                                    flex items-center justify-center text-white text-3xl font-light shadow-lg">
                          {worker?.ime?.[0]}{worker?.prezime?.[0]}
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border 
                                  border-gray-300 rounded-lg shadow-sm text-sm text-gray-700 
                                  hover:bg-gray-50 focus-within:ring-2 focus-within:ring-green-500 
                                  focus-within:ring-offset-2">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Izaberi sliku
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    {errors.profile_image && (
                      <p className="mt-2 text-sm text-red-600">{errors.profile_image}</p>
                    )}
                  </div>
                </div>

                {/* Rest of the form */}
                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                    <p className="text-sm text-red-700">{errors.general}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-6">
                    {/* Ime i Prezime */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-normal text-gray-700 mb-2 text-center">
                          Ime <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="ime"
                          value={formData.ime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 
                                   focus:ring-green-500 focus:border-green-500 transition-colors duration-200
                                   text-center"
                          placeholder="Unesite ime"
                        />
                        {errors.ime && (
                          <p className="mt-2 text-sm text-red-600 text-center">{errors.ime}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-normal text-gray-700 mb-2 text-center">
                          Prezime <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="prezime"
                          value={formData.prezime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 
                                   focus:ring-green-500 focus:border-green-500 transition-colors duration-200
                                   text-center"
                          placeholder="Unesite prezime"
                        />
                        {errors.prezime && (
                          <p className="mt-2 text-sm text-red-600 text-center">{errors.prezime}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-normal text-gray-700 mb-2 text-center">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 
                                 focus:ring-green-500 focus:border-green-500 transition-colors duration-200
                                 text-center"
                        placeholder="primer@email.com"
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600 text-center">{errors.email}</p>
                      )}
                    </div>

                    {/* Telefon */}
                    <div>
                      <label className="block text-sm font-normal text-gray-700 mb-2 text-center">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        name="telefon"
                        value={formData.telefon}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 
                                 focus:ring-green-500 focus:border-green-500 transition-colors duration-200
                                 text-center"
                        placeholder="Unesite broj telefona"
                      />
                      {errors.telefon && (
                        <p className="mt-2 text-sm text-red-600 text-center">{errors.telefon}</p>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col gap-3 pt-6 border-t">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 text-sm font-normal text-white bg-green-600 
                               rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 
                               focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sačuvavanje...' : 'Sačuvaj izmene'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-full px-4 py-3 text-sm font-normal text-gray-700 bg-white 
                               border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none 
                               focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                               transition-all duration-200"
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="min-h-screen px-4 text-center">
            <div className="flex items-center justify-center min-h-screen">
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 text-left transform transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-normal text-gray-900">
                      Brisanje radnika
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Da li ste sigurni da želite da obrišete radnika {worker?.ime} {worker?.prezime}? Ova akcija je nepovratna.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2.5 text-sm font-normal text-gray-700 bg-white border border-gray-300 
                             rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                             focus:ring-red-500 transition-all duration-200"
                  >
                    Otkaži
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 text-sm font-normal text-white bg-red-600 rounded-xl 
                             hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                             focus:ring-red-500 transition-all duration-200 disabled:opacity-50 
                             disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Brisanje...' : 'Obriši'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerSettings; 