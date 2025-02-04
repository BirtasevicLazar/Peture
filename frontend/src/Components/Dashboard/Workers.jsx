import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWorkers, createWorker } from '../../api/workers';
import { toast } from 'react-hot-toast';

const Workers = ({ onWorkerSelect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    email: '',
    telefon: '',
    time_slot: '15',
    profile_image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  // Query za fetch radnika
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: fetchWorkers,
    onError: (error) => {
      toast.error('Greška pri učitavanju radnika');
      console.error('Error fetching workers:', error);
    }
  });

  // Mutation za kreiranje radnika
  const createWorkerMutation = useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      queryClient.invalidateQueries(['workers']);
      setIsModalOpen(false);
      resetForm();
      toast.success('Radnik uspešno dodat');
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      toast.error('Greška pri dodavanju radnika');
    }
  });

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_image' && files?.length > 0) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profile_image: 'Slika ne sme biti veća od 2MB' }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profile_image: 'Molimo vas izaberite sliku' }));
        return;
      }
      setFormData(prev => ({ ...prev, profile_image: file }));
      setImagePreview(URL.createObjectURL(file));
      if (errors.profile_image) {
        setErrors(prev => ({ ...prev, profile_image: null }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      ime: '',
      prezime: '',
      email: '',
      telefon: '',
      time_slot: '15',
      profile_image: null
    });
    setImagePreview(null);
    setErrors({});
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });

    createWorkerMutation.mutate(formDataToSend);
  };

  const nextStep = () => {
    let hasErrors = false;
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.ime) {
        newErrors.ime = 'Ime je obavezno';
        hasErrors = true;
      }
      if (!formData.prezime) {
        newErrors.prezime = 'Prezime je obavezno';
        hasErrors = true;
      }
    } 
    else if (currentStep === 2) {
      if (!formData.email) {
        newErrors.email = 'Email je obavezan';
        hasErrors = true;
      }
      // Telefon nije obavezan
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleNext = (e) => {
    e.preventDefault(); // Sprečavamo submit forme
    nextStep();
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Main Content */}
      <div className="w-full bg-white h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Action Button */}
          <div className="mb-8">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-gray-900 rounded-xl shadow-lg flex items-center justify-center
                       space-x-2 hover:bg-gray-800 transition-all text-white h-14"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium">Dodaj radnika</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  onClick={() => onWorkerSelect(worker)}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 
                           cursor-pointer group overflow-hidden border border-gray-100"
                >
                  {/* Worker Image */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    {worker.profile_image ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL}/worker-image/${worker.profile_image.split('/').pop()}`}
                        alt={`${worker.ime} ${worker.prezime}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 
                                    flex items-center justify-center text-white text-4xl font-medium">
                        {worker.ime[0]}{worker.prezime[0]}
                      </div>
                    )}
                  </div>

                  {/* Worker Info */}
                  <div className="p-6 space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-medium text-gray-900">
                        {worker.ime} {worker.prezime}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Radnik</p>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center text-sm text-gray-600 justify-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{worker.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 justify-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="truncate">{worker.telefon || 'Nije uneto'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-medium text-gray-900">
                    Dodaj radnika - Korak {currentStep} od 3
                  </h3>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 h-1 mt-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-gray-900 h-full transition-all duration-300"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ime
                        </label>
                        <input
                          type="text"
                          name="ime"
                          value={formData.ime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                   focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                          placeholder="Unesite ime"
                        />
                        {errors.ime && (
                          <p className="mt-1 text-sm text-red-600">{errors.ime}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prezime
                        </label>
                        <input
                          type="text"
                          name="prezime"
                          value={formData.prezime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                   focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                          placeholder="Unesite prezime"
                        />
                        {errors.prezime && (
                          <p className="mt-1 text-sm text-red-600">{errors.prezime}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                   focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                          placeholder="email@primer.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          name="telefon"
                          value={formData.telefon}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                   focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                          placeholder="+381 xx xxx xxxx"
                        />
                        {errors.telefon && (
                          <p className="mt-1 text-sm text-red-600">{errors.telefon}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Profilna slika (opciono)
                        </label>
                        <div className="mt-2 flex justify-center rounded-lg border border-gray-300 px-6 py-8">
                          <div className="text-center">
                            {imagePreview ? (
                              <div className="relative mx-auto w-40 h-40 mb-4">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="rounded-lg object-cover w-full h-full"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview(null);
                                    setFormData(prev => ({ ...prev, profile_image: null }));
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => document.getElementById('profile_image').click()}
                                className="flex flex-col items-center justify-center w-40 h-40 mx-auto border-2 
                                         border-dashed border-gray-300 rounded-lg hover:border-gray-400 
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
                            <input
                              id="profile_image"
                              name="profile_image"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        {errors.profile_image && (
                          <p className="mt-2 text-sm text-red-600">{errors.profile_image}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between gap-3 pt-6 mt-6 border-t">
                    <button
                      type="button"
                      onClick={currentStep === 1 ? () => {
                        setIsModalOpen(false);
                        resetForm();
                      } : prevStep}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                               rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      {currentStep === 1 ? 'Otkaži' : 'Nazad'}
                    </button>
                    {currentStep === 3 ? (
                      <button
                        type="submit"
                        className="px-6 py-2 text-sm font-medium text-white bg-gray-900 
                                 rounded-xl hover:bg-gray-800 transition-colors"
                      >
                        Dodaj radnika
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-6 py-2 text-sm font-medium text-white bg-gray-900 
                                 rounded-xl hover:bg-gray-800 transition-colors"
                      >
                        Nastavi
                      </button>
                    )}
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
