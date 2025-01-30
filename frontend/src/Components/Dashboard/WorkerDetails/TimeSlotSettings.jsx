import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWorkerById, updateWorker } from '../../../api/workers';
import { fetchServices } from '../../../api/services';
import { toast } from 'react-hot-toast';

const TimeSlotSettings = ({ workerId, initialTimeSlot }) => {
  const [timeSlot, setTimeSlot] = useState(initialTimeSlot);
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTimeSlot, setPendingTimeSlot] = useState(null);

  const queryClient = useQueryClient();

  // Query za fetch radnika
  const { data: worker } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => fetchWorkerById(workerId)
  });

  // Query za fetch usluga
  const { data: workerServices = [] } = useQuery({
    queryKey: ['services', workerId],
    queryFn: () => fetchServices(workerId)
  });

  // Mutation za update radnika
  const updateWorkerMutation = useMutation({
    mutationFn: ({ workerId, formData }) => updateWorker({ workerId, formData }),
    onSuccess: (data) => {
      if (data && data.worker) {
        setTimeSlot(pendingTimeSlot);
        setErrors({});
        setShowConfirmation(false);
        setPendingTimeSlot(null);
        queryClient.invalidateQueries(['worker', workerId]);
        toast.success('Uspešno ste promenili vremenski interval');
      }
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          time_slot: 'Došlo je do greške prilikom ažuriranja time slot-a'
        });
      }
      toast.error('Greška pri ažuriranju vremenskog intervala');
    }
  });

  const handleTimeSlotSelect = (value) => {
    if (workerServices.length > 0) {
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
    if (!worker || !pendingTimeSlot) return;

    const formDataToSend = new FormData();
    formDataToSend.append('ime', worker.ime);
    formDataToSend.append('prezime', worker.prezime);
    formDataToSend.append('email', worker.email);
    formDataToSend.append('telefon', worker.telefon || '');
    formDataToSend.append('time_slot', pendingTimeSlot);
    formDataToSend.append('booking_window', worker.booking_window || 30);
    formDataToSend.append('_method', 'PUT');

    updateWorkerMutation.mutate({ workerId, formData: formDataToSend });
  };

  const isTimeSlotDisabled = (value) => {
    if (!workerServices.length) return false;
    
    return workerServices.some(service => {
      const serviceTime = service.trajanje;
      const slotTime = Math.abs(value);
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
        {workerServices.length > 0 && (
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