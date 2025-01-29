import { useState, useEffect } from 'react';
import axios from 'axios';

const TimeSlotSettings = ({ workerId, initialTimeSlot }) => {
  const [timeSlot, setTimeSlot] = useState(initialTimeSlot);
  const [errors, setErrors] = useState({});
  const [hasServices, setHasServices] = useState(false);
  const [workerServices, setWorkerServices] = useState([]);
  const [worker, setWorker] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTimeSlot, setPendingTimeSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchWorkerServices();
    fetchWorker();
  }, [workerId]);

  const fetchWorker = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/workers/${workerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWorker(response.data);
    } catch (error) {
      console.error('Error fetching worker:', error);
    }
  };

  const fetchWorkerServices = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/services?worker_id=${workerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWorkerServices(response.data);
      setHasServices(response.data.length > 0);
    } catch (error) {
      console.error('Error fetching worker services:', error);
    }
  };

  const handleTimeSlotSelect = (value) => {
    if (hasServices) {
      const incompatibleServices = workerServices.filter(service => {
        const serviceTime = service.trajanje;
        const slotTime = Math.abs(value);
        
        // Usluga mora biti deljiva sa time slotom
        return serviceTime % slotTime !== 0;
      });
      
      if (incompatibleServices.length > 0) {
        setErrors({
          time_slot: `Ne možete postaviti trajanje na ${Math.abs(value)} min jer nije kompatibilno sa sledećim uslugama: ${
            incompatibleServices.map(s => `${s.naziv} (${s.trajanje} min)`).join(', ')
          }`
        });
        return;
      }
    }
    
    setPendingTimeSlot(value);
    setShowConfirmation(true);
  };

  const handleConfirmTimeSlotChange = async () => {
    setLoading(true);
    try {
      if (!worker || !pendingTimeSlot) return;

      const updatedData = {
        ime: worker.ime,
        prezime: worker.prezime,
        email: worker.email,
        telefon: worker.telefon,
        time_slot: pendingTimeSlot
      };

      await axios.put(
        `${import.meta.env.VITE_API_URL}/workers/${workerId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      setTimeSlot(pendingTimeSlot);
      setErrors({});
      setShowConfirmation(false);
      setPendingTimeSlot(null);
      
      // Osvežavamo podatke o radniku
      fetchWorker();
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const isTimeSlotDisabled = (value) => {
    if (!hasServices) return false;
    
    // Proveravamo da li postoji neka usluga koja nije kompatibilna sa time slotom
    return workerServices.some(service => {
      const serviceTime = service.trajanje;
      const slotTime = Math.abs(value);
      
      // Usluga mora biti deljiva sa time slotom
      return serviceTime % slotTime !== 0;
    });
  };

  return (
    <div className="w-full pt-6">
      {/* Current Setting Info */}
      <div className="mb-3 px-4">
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-900">
                {Math.abs(timeSlot)} min {parseInt(timeSlot) < 0 ? '(dinamično)' : '(fiksno)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors.time_slot && (
        <div className="mb-3 px-4">
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-700">{errors.time_slot}</p>
            </div>
          </div>
        </div>
      )}

      {/* Time Slots Grid */}
      <div className="space-y-3 px-4">
        {/* Classic View */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm text-gray-900">Fiksni intervali</h3>
                <p className="text-xs text-gray-500">Standardni termini</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {[10, 15, 20, 30, 60].map(value => (
                <button
                  key={value}
                  onClick={() => handleTimeSlotSelect(value)}
                  disabled={isTimeSlotDisabled(value)}
                  className={`relative p-2 rounded-lg transition-all duration-200
                    ${parseInt(timeSlot) === value
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-white border-2 border-gray-100 hover:border-green-200 hover:bg-green-50/50'
                    } ${isTimeSlotDisabled(value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                      ${parseInt(timeSlot) === value ? 'bg-green-500' : 'bg-gray-100'}`}
                    >
                      <span className={`text-sm font-normal ${parseInt(timeSlot) === value ? 'text-white' : 'text-gray-900'}`}>
                        {value}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-normal text-gray-900">min</p>
                      <p className="text-xs text-gray-500 truncate">
                        {value === 10 && "Brze"}
                        {value === 15 && "Kratke"}
                        {value === 20 && "Srednje"}
                        {value === 30 && "Standard"}
                        {value === 60 && "Duge"}
                      </p>
                    </div>
                    {parseInt(timeSlot) === value && (
                      <svg className="w-4 h-4 text-green-500 absolute right-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic View */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm text-gray-900">Dinamični intervali</h3>
                <p className="text-xs text-gray-500">Prema trajanju usluge</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {[10, 15, 20, 30, 60].map(value => (
                <button
                  key={-value}
                  onClick={() => handleTimeSlotSelect(-value)}
                  disabled={isTimeSlotDisabled(-value)}
                  className={`relative p-2 rounded-lg transition-all duration-200
                    ${parseInt(timeSlot) === -value
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-white border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50'
                    } ${isTimeSlotDisabled(-value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                      ${parseInt(timeSlot) === -value ? 'bg-blue-500' : 'bg-gray-100'}`}
                    >
                      <span className={`text-sm font-normal ${parseInt(timeSlot) === -value ? 'text-white' : 'text-gray-900'}`}>
                        {value}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-normal text-gray-900">min</p>
                      <p className="text-xs text-gray-500 truncate">
                        {value === 10 && "Flex brze"}
                        {value === 15 && "Flex kratke"}
                        {value === 20 && "Flex srednje"}
                        {value === 30 && "Flex standard"}
                        {value === 60 && "Flex duge"}
                      </p>
                    </div>
                    {parseInt(timeSlot) === -value && (
                      <svg className="w-4 h-4 text-blue-500 absolute right-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Services Warning */}
        {hasServices && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex-shrink-0 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-normal text-amber-900">Napomena</h4>
                <p className="mt-1 text-xs text-amber-700">
                  Zbog postojećih usluga, možete samo promeniti način rada za trenutnu 
                  dužinu termina od {Math.abs(timeSlot)} minuta.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-5">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-white">
                  Potvrda promene
                </h3>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                Da li ste sigurni da želite da promenite vremenski interval? Ova promena će uticati na sve buduće termine.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Otkaži
                </button>
                <button
                  onClick={handleConfirmTimeSlotChange}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Potvrdi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotSettings; 