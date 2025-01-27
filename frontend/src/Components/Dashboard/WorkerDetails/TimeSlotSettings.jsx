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
      setShowConfirmModal(false);
      setPendingTimeSlot(null);
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Način rada sa terminima</h3>
      
      {/* Info box */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">Kako izabrati način rada?</h4>
            <p className="mt-2 text-sm text-blue-700">
              Izaberite način koji najbolje odgovara vašem stilu rada i vrsti usluga koje pružate.
              Ovo podešavanje određuje kako će klijenti videti slobodne termine za zakazivanje.
            </p>
          </div>
        </div>
      </div>

      {/* Time slot options */}
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <fieldset>
            <legend className="text-base font-medium text-gray-900">Klasičan prikaz termina</legend>
            <p className="text-sm text-gray-500 mt-1">
              Termini su podeljeni na fiksne intervale. Idealno za standardizovane usluge.
            </p>
            {errors.time_slot && (
              <div className="mt-2 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errors.time_slot}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 space-y-3">
              {[10, 15, 20, 30, 60].map(value => (
                <label
                  key={value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200
                    ${parseInt(timeSlot) === value 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'}
                    ${isTimeSlotDisabled(value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="time_slot"
                    value={value}
                    checked={parseInt(timeSlot) === value}
                    onChange={(e) => handleTimeSlotSelect(e.target.value)}
                    className="sr-only"
                    disabled={isTimeSlotDisabled(value)}
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{value} minuta</p>
                        <p className="text-gray-500">
                          {value === 10 && "Za najkraće usluge"}
                          {value === 15 && "Za kratke usluge"}
                          {value === 20 && "Idealno za većinu usluga"}
                          {value === 30 && "Za duže tretmane"}
                          {value === 60 && "Za dugačke tretmane"}
                        </p>
                      </div>
                    </div>
                    {parseInt(timeSlot) === value && (
                      <svg 
                        className="h-5 w-5 text-green-600" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <fieldset>
            <legend className="text-base font-medium text-gray-900">Prikaz prema trajanju usluge</legend>
            <p className="text-sm text-gray-500 mt-1">
              Termini se automatski prilagođavaju trajanju svake usluge.
            </p>
            <div className="mt-4 space-y-3">
              {[-10, -15, -20, -30, -60].map(value => (
                <label
                  key={value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200
                    ${parseInt(timeSlot) === value 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'}
                    ${isTimeSlotDisabled(value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="time_slot"
                    value={value}
                    checked={parseInt(timeSlot) === value}
                    onChange={(e) => handleTimeSlotSelect(e.target.value)}
                    className="sr-only"
                    disabled={isTimeSlotDisabled(value)}
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{Math.abs(value)} minuta</p>
                        <p className="text-gray-500">
                          {value === -10 && "Za najkraće usluge sa prilagođenim trajanjem"}
                          {value === -15 && "Za precizno praćenje kraćih usluga"}
                          {value === -20 && "Optimalno za mešavinu različitih usluga"}
                          {value === -30 && "Za salone sa pretežno dužim tretmanima"}
                          {value === -60 && "Za salone sa dugačkim tretmanima"}
                        </p>
                      </div>
                    </div>
                    {parseInt(timeSlot) === value && (
                      <svg 
                        className="h-5 w-5 text-green-600" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {/* Warning for existing services */}
      {hasServices && (
        <div className="rounded-lg bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">Napomena</h4>
              <p className="mt-2 text-sm text-yellow-700">
                Pošto već imate postavljene usluge, možete samo promeniti način rada za trenutnu 
                dužinu termina od {Math.abs(timeSlot)} minuta (klasičan/prema trajanju).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => {
                setShowConfirmModal(false);
                setPendingTimeSlot(null);
              }}
            />

            {/* Centriranje modala */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div className="relative inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 mx-4">
              <div>
                {/* Close button */}
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingTimeSlot(null);
                    }}
                  >
                    <span className="sr-only">Zatvori</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Potvrda promene vremenskog slota
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Da li ste sigurni da želite da promenite vremenski slot na {Math.abs(pendingTimeSlot)} minuta?
                    </p>
                    {hasServices && (
                      <p className="mt-2 text-sm text-yellow-600 font-medium">
                        Napomena: Ova promena može uticati na postojeće termine.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm transition-colors duration-200"
                  onClick={handleConfirmTimeSlotChange}
                >
                  Potvrdi
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-colors duration-200"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingTimeSlot(null);
                  }}
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