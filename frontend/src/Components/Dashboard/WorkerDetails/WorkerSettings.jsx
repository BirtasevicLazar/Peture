import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWorker, deleteWorker } from '../../../api/workers';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const WorkerSettings = ({ worker, onUpdate }) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    email: '',
    telefon: '',
    profile_image: null,
    booking_window: 30
  });

  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (worker) {
      setFormData({
        ime: worker.ime || '',
        prezime: worker.prezime || '',
        email: worker.email || '',
        telefon: worker.telefon || '',
        profile_image: null,
        booking_window: worker.booking_window || 30
      });
      if (worker.profile_image) {
        setPreviewImage(`${import.meta.env.VITE_API_URL}/worker-image/${worker.profile_image.split('/').pop()}`);
      }
    }
  }, [worker]);

  // Mutation za ažuriranje osnovnih podataka
  const updateWorkerMutation = useMutation({
    mutationFn: ({ workerId, formData }) => updateWorker({ workerId, formData }),
    onSuccess: (data) => {
      if (data && data.worker) {
        onUpdate(data.worker);
        setIsInfoModalOpen(false);
        toast.success('Podaci su uspešno ažurirani');
        queryClient.invalidateQueries(['worker', worker.id]);
      }
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error('Došlo je do greške prilikom ažuriranja podataka');
      }
    }
  });

  // Mutation za ažuriranje slike
  const updateImageMutation = useMutation({
    mutationFn: ({ workerId, formData }) => updateWorker({ workerId, formData }),
    onSuccess: (data) => {
      if (data && data.worker) {
        onUpdate(data.worker);
        setIsImageModalOpen(false);
        toast.success('Slika je uspešno ažurirana');
        queryClient.invalidateQueries(['worker', worker.id]);
      }
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error('Došlo je do greške prilikom ažuriranja slike');
      }
    }
  });

  // Mutation za brisanje radnika
  const deleteWorkerMutation = useMutation({
    mutationFn: (workerId) => deleteWorker(workerId),
    onSuccess: () => {
      toast.success('Radnik je uspešno obrisan');
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries(['workers']);
      setTimeout(() => {
        window.location.href = '/dashboard?tab=workers';
      }, 10);
    },
    onError: () => {
      toast.error('Došlo je do greške prilikom brisanja radnika');
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profile_image: 'Slika ne sme biti veća od 2MB' }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profile_image: 'Molimo vas izaberite sliku' }));
        return;
      }
      setFormData(prev => ({ ...prev, profile_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('ime', formData.ime);
    formDataToSend.append('prezime', formData.prezime);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('telefon', formData.telefon || '');
    formDataToSend.append('time_slot', worker.time_slot);
    formDataToSend.append('booking_window', formData.booking_window);
    formDataToSend.append('_method', 'PUT');

    updateWorkerMutation.mutate({ 
      workerId: worker.id, 
      formData: formDataToSend 
    });
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    if (formData.profile_image) {
      formDataToSend.append('profile_image', formData.profile_image);
    }
    formDataToSend.append('_method', 'PUT');

    updateImageMutation.mutate({ 
      workerId: worker.id, 
      formData: formDataToSend 
    });
  };

  const handleDelete = () => {
    deleteWorkerMutation.mutate(worker.id);
  };

  return (
    <div className="w-full pt-6">
      <div className="px-4 space-y-4">
        {/* Hero Section with Image */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="h-48 sm:h-72 md:h-80 lg:h-96 relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800">
            {previewImage ? (
              <img 
                src={previewImage} 
                alt={`${worker?.ime} ${worker?.prezime}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl text-white font-light">
                  {worker?.ime?.[0]}{worker?.prezime?.[0]}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-xl font-medium text-white">
                    {worker?.ime} {worker?.prezime}
                  </h1>
                  <p className="text-gray-300 text-sm mt-0.5">Radnik</p>
                </div>
                <button
                  onClick={() => setIsImageModalOpen(true)}
                  className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white 
                           hover:bg-white/20 transition-all duration-200 text-sm font-medium
                           flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Promeni sliku</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Informacije o radniku</h2>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="px-3 py-1.5 bg-gray-900 rounded-lg text-white 
                       hover:bg-gray-800 transition-all duration-200 text-sm font-medium
                       flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="hidden sm:inline">Izmeni podatke</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Ime</span>
              <div className="flex items-center gap-2 bg-gray-50/50 rounded-lg p-2.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">{worker?.ime}</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-gray-500">Prezime</span>
              <div className="flex items-center gap-2 bg-gray-50/50 rounded-lg p-2.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">{worker?.prezime}</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-gray-500">Email</span>
              <div className="flex items-center gap-2 bg-gray-50/50 rounded-lg p-2.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">{worker?.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-gray-500">Telefon</span>
              <div className="flex items-center gap-2 bg-gray-50/50 rounded-lg p-2.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">{worker?.telefon || '-'}</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-gray-500">Period zakazivanja</span>
              <div className="flex items-center gap-2 bg-gray-50/50 rounded-lg p-2.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">{worker?.booking_window || 30} dana unapred</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm 
                       text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg
                       transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Obriši radnika
            </button>
          </div>
        </div>
      </div>

      {/* Image Edit Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-medium text-gray-900">
                    Promeni profilnu sliku
                  </h3>
                  <button
                    onClick={() => setIsImageModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleImageSubmit} className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      {previewImage ? (
                        <div className="relative">
                          <img 
                            src={previewImage} 
                            alt="Preview"
                            className="w-40 h-40 rounded-2xl object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImage(null);
                              setFormData(prev => ({ ...prev, profile_image: null }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 
                                     hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => document.getElementById('worker_image').click()}
                          className="w-40 h-40 flex flex-col items-center justify-center border-2 
                                   border-dashed border-gray-300 rounded-2xl hover:border-gray-400 
                                   transition-colors group"
                        >
                          <svg className="w-8 h-8 text-gray-400 group-hover:text-gray-500" 
                               fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                  d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="mt-2 text-sm text-gray-500 group-hover:text-gray-600">
                            Dodaj sliku
                          </span>
                          <span className="mt-1 text-xs text-gray-400">
                            PNG, JPG do 2MB
                          </span>
                        </button>
                      )}
                    </div>
                    <input
                      id="worker_image"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {errors.profile_image && (
                      <p className="mt-2 text-sm text-red-600 text-center">{errors.profile_image}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-6 border-t">
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.profile_image}
                      className="w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 
                               rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 
                               disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sačuvavanje...' : 'Sačuvaj sliku'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsImageModalOpen(false)}
                      className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white 
                               border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
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

      {/* Info Edit Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-medium text-gray-900">
                    Izmeni podatke
                  </h3>
                  <button
                    onClick={() => setIsInfoModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ime <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="ime"
                        value={formData.ime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="Unesite ime"
                      />
                      {errors.ime && (
                        <p className="mt-2 text-sm text-red-600">{errors.ime}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prezime <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="prezime"
                        value={formData.prezime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="Unesite prezime"
                      />
                      {errors.prezime && (
                        <p className="mt-2 text-sm text-red-600">{errors.prezime}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="email@primer.com"
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        name="telefon"
                        value={formData.telefon}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="+381 xx xxx xxxx"
                      />
                      {errors.telefon && (
                        <p className="mt-2 text-sm text-red-600">{errors.telefon}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Period zakazivanja (dana unapred)
                      </label>
                      <select
                        name="booking_window"
                        value={formData.booking_window}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        <option value="7">7 dana</option>
                        <option value="14">14 dana</option>
                        <option value="30">30 dana</option>
                        <option value="60">60 dana</option>
                        <option value="90">90 dana</option>
                      </select>
                      {errors.booking_window && (
                        <p className="mt-2 text-sm text-red-600">{errors.booking_window}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-6 border-t">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 
                               rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 
                               disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sačuvavanje...' : 'Sačuvaj izmene'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInfoModalOpen(false)}
                      className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white 
                               border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Brisanje radnika
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Da li ste sigurni da želite da obrišete radnika {worker?.ime} {worker?.prezime}? 
                    Ova akcija je nepovratna.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-red-600 
                           rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 
                           disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Brisanje...' : 'Da, obriši radnika'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white 
                           border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Ne, otkaži
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerSettings; 