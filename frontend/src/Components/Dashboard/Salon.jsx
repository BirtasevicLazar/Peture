import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSalonData, updateSalonDetails } from '../../api/salon';
import { toast } from 'react-hot-toast';

const Salon = () => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [editData, setEditData] = useState({});
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Kopiraj link');
  const [isCopying, setIsCopying] = useState(false);

  const queryClient = useQueryClient();

  // Query za fetch podataka o salonu
  const { data: salonData = {}, isLoading } = useQuery({
    queryKey: ['salon'],
    queryFn: fetchSalonData,
    onError: (error) => {
      toast.error('Greška pri učitavanju podataka o salonu');
      console.error('Error fetching salon data:', error);
    }
  });

  // Mutation za ažuriranje podataka o salonu
  const updateSalonMutation = useMutation({
    mutationFn: updateSalonDetails,
    onSuccess: (data) => {
      queryClient.setQueryData(['salon'], data);
      setIsDetailsModalOpen(false);
      setIsImageModalOpen(false);
      setErrors({});
      if (editData.imagePreview) {
        URL.revokeObjectURL(editData.imagePreview);
      }
      setEditData({});
      toast.success('Podaci su uspešno sačuvani');
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ 
          [isImageModalOpen ? 'salon_image' : 'general']: error.response.data.message 
        });
      } else {
        setErrors({ 
          [isImageModalOpen ? 'salon_image' : 'general']: 'Došlo je do greške prilikom čuvanja podataka' 
        });
      }
      toast.error('Greška pri čuvanju podataka');
    }
  });

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'salon_image' && files?.[0]) {
      if (files[0].size > 2 * 1024 * 1024) {
        setErrors({
          salon_image: 'Slika ne sme biti veća od 2MB'
        });
        return;
      }
      
      if (!files[0].type.startsWith('image/')) {
        setErrors({
          salon_image: 'Molimo vas odaberite sliku (PNG, JPG, JPEG)'
        });
        return;
      }

      setErrors({});
      setEditData({ 
        ...editData, 
        [name]: files[0],
        imagePreview: URL.createObjectURL(files[0])
      });
    } else {
      setEditData({ ...editData, [name]: value });
    }
  };

  const handleOpenDetailsModal = () => {
    setEditData({
      salon_name: salonData.salon_name || '',
      address: salonData.address || '',
      city: salonData.city || '',
      phone: salonData.phone || '',
      email: salonData.email || '',
      description: salonData.description || ''
    });
    setIsDetailsModalOpen(true);
    setErrors({});
  };

  const handleOpenImageModal = () => {
    setEditData({
      salon_image: null,
      imagePreview: salonData.salon_image || null
    });
    setIsImageModalOpen(true);
    setErrors({});
  };

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    
    const formData = new FormData();
    
    if (type === 'details') {
      Object.keys(editData).forEach(key => {
        if (key !== 'imagePreview') {
          formData.append(key, editData[key]);
        }
      });
    } else if (type === 'image') {
      formData.append('salon_name', salonData.salon_name || '');
      formData.append('email', salonData.email || '');
      formData.append('phone', salonData.phone || '');
      formData.append('city', salonData.city || '');
      formData.append('address', salonData.address || '');
      formData.append('description', salonData.description || '');
      
      if (!editData.salon_image) {
        setErrors({ salon_image: 'Molimo vas odaberite sliku' });
        return;
      }
      formData.append('salon_image', editData.salon_image);
    }

    updateSalonMutation.mutate(formData);
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/booking/${salonData.slug}`;
    
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    
    try {
      tempInput.select();
      document.execCommand('copy');
      
      setIsCopying(true);
      setCopyButtonText('Kopirano!');
      
      setTimeout(() => {
        setIsCopying(false);
        setCopyButtonText('Kopiraj link');
      }, 2000);
    } catch (err) {
      console.error('Greška pri kopiranju:', err);
      setCopyButtonText('Greška pri kopiranju');
      setTimeout(() => setCopyButtonText('Kopiraj link'), 2000);
    } finally {
      document.body.removeChild(tempInput);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative w-full h-[40vh] md:h-[50vh] bg-gradient-to-br from-gray-900 to-gray-800">
        {salonData.salon_image ? (
          <>
            <img 
              src={salonData.salon_image} 
              alt={salonData.salon_name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Change Image Button - Floating */}
        <div className="absolute bottom-4 inset-x-4">
          <div className="flex justify-between items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-medium text-white truncate">
              {salonData.salon_name || 'Vaš salon'}
            </h1>
            <button
              onClick={handleOpenImageModal}
              className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full 
                       shadow-lg flex items-center space-x-2 hover:bg-white transition-all"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Promeni sliku</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Upravljajte informacijama o vašem salonu</span>
            </div>
            <button
              onClick={handleOpenDetailsModal}
              className="w-full sm:w-auto px-4 py-2 bg-gray-900 rounded-xl text-white 
                       hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm font-medium">Izmeni detalje</span>
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-4">
                  Kontakt informacije
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Telefon</p>
                      <p className="text-gray-600">{salonData.phone || 'Nije uneto'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">{salonData.email || 'Nije uneto'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-4 sm:col-span-2">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Adresa</p>
                      <p className="text-gray-600">
                        {salonData.address ? (
                          <>
                            {salonData.address}
                            <br />
                            {salonData.city}
                          </>
                        ) : (
                          'Nije uneto'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-4">
                  Opis salona
                </h2>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-600 leading-relaxed">
                    {salonData.description || 'Dodajte opis vašeg salona da bi klijenti mogli da saznaju više o vama i vašim uslugama.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking URL */}
            <div>
              <h2 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-4">
                Link za rezervacije
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Podelite ovaj link sa vašim klijentima da bi mogli da rezervišu termine online:
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/booking/${salonData.slug}`}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleCopyUrl}
                    disabled={isCopying}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2
                              bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {isCopying ? (
                      <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                    <span className="text-sm font-medium">{copyButtonText}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-medium text-gray-900">
                    Izmeni detalje salona
                  </h3>
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={(e) => handleSubmit(e, 'details')} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Naziv salona
                      </label>
                      <input
                        type="text"
                        name="salon_name"
                        value={editData.salon_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                      {errors.salon_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.salon_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editData.email || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        type="text"
                        name="phone"
                        value={editData.phone || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grad
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={editData.city || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresa
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={editData.address || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opis salona
                      </label>
                      <textarea
                        name="description"
                        rows="4"
                        value={editData.description || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 
                                 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        setErrors({});
                      }}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                               rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-sm font-medium text-white bg-gray-900 
                               rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      Sačuvaj
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-medium text-gray-900">
                    Promeni sliku salona
                  </h3>
                  <button
                    onClick={() => {
                      setIsImageModalOpen(false);
                      setErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={(e) => handleSubmit(e, 'image')} className="space-y-6">
                  <div>
                    {editData.imagePreview || salonData.salon_image ? (
                      <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4">
                        <img
                          src={editData.imagePreview || salonData.salon_image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 
                                  border-dashed rounded-xl hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-gray-600 
                                          hover:text-gray-500 focus-within:outline-none">
                            <span>Otpremite sliku</span>
                            <input
                              type="file"
                              name="salon_image"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleInputChange}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG do 2MB</p>
                      </div>
                    </div>
                    {errors.salon_image && (
                      <p className="mt-1 text-sm text-red-600">{errors.salon_image}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setIsImageModalOpen(false);
                        setErrors({});
                      }}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                               rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-sm font-medium text-white bg-gray-900 
                               rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      Sačuvaj
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

export default Salon;