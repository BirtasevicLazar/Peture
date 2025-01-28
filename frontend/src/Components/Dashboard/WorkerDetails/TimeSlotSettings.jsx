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
    setPendingTimeSlot(value);
    setShowConfirmModal(true);
  };

  const handleConfirmTimeSlotChange = async () => {
    setLoading(true);
    try {
      if (!worker || !pendingTimeSlot) return;

      const updatedData = {
        ...worker,
        time_slot: pendingTimeSlot
      };

      await axios.put(
        `${import.meta.env.VITE_API_URL}/workers/${workerId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      setTimeSlot(pendingTimeSlot);
      setErrors({});
      setShowConfirmModal(false);
      setPendingTimeSlot(null);
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
    if (errors.time_slot && Math.abs(parseInt(timeSlot)) === Math.abs(value)) {
      return true;
    }
    return false;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Current Setting Info */}
      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Trenutno: {Math.abs(timeSlot)} min {parseInt(timeSlot) < 0 ? '(dinamično)' : '(fiksno)'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors.time_slot && (
        <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-700">{errors.time_slot}</p>
          </div>
        </div>
      )}

      {/* Time Slots Grid */}
      <div className="space-y-4">
        {/* Classic View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Fiksni intervali</h3>
                <p className="text-xs text-gray-500">Standardni termini</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      <span className={`text-sm font-medium ${parseInt(timeSlot) === value ? 'text-white' : 'text-gray-900'}`}>
                        {value}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-gray-900">min</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Dinamični intervali</h3>
                <p className="text-xs text-gray-500">Prema trajanju usluge</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      <span className={`text-sm font-medium ${parseInt(timeSlot) === -value ? 'text-white' : 'text-gray-900'}`}>
                        {value}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-gray-900">min</p>
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
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex-shrink-0 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-900">Napomena</h4>
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
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                 aria-hidden="true"
                 onClick={() => !loading && setShowConfirmModal(false)}></div>

            <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all w-full max-w-sm mx-auto">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Promena načina rada
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Da li želite da promenite na {Math.abs(pendingTimeSlot)} min
                      {pendingTimeSlot < 0 ? ' (dinamično)' : ' (fiksno)'}?
                      {hasServices && ' Ovo može uticati na termine.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 flex flex-col-reverse gap-2 sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmTimeSlotChange}
                  className={`flex-1 sm:flex-none inline-flex justify-center items-center rounded-lg px-3 py-2 text-sm font-medium text-white
                    ${loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500 focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                    } transition-all duration-200`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Čuvanje...
                    </>
                  ) : 'Potvrdi'}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 sm:flex-none inline-flex justify-center rounded-lg px-3 py-2 text-sm font-medium text-gray-900 
                           bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                           transition-all duration-200 border border-gray-300"
                >
                  Otkaži
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