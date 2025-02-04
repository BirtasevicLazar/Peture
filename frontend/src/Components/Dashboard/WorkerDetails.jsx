import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchWorkerById } from '../../api/workers';
import WorkSchedule from './WorkerDetails/WorkSchedule';
import Services from './WorkerDetails/Services';
import TimeSlotSettings from './WorkerDetails/TimeSlotSettings';
import WorkerSettings from './WorkerDetails/WorkerSettings';
import OffDays from './WorkerDetails/OffDays';
import { toast } from 'react-hot-toast';

const WorkerDetails = ({ workerId }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [prevTab, setPrevTab] = useState('schedule');
  const queryClient = useQueryClient();
  const contentRef = useRef(null);

  // Funkcija za scroll na vrh
  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Handler za promenu taba koji uključuje scroll
  const handleTabChange = (tab) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
    scrollToTop();
  };

  // Funkcija za izračunavanje pozicije taba
  const getTabPosition = (tab) => {
    switch(tab) {
      case 'schedule': return 0;
      case 'services': return 20;
      case 'time_slot': return 40;
      case 'off_days': return 60;
      case 'settings': return 80;
      default: return 0;
    }
  };

  // Query za fetch radnika
  const { data: worker, isLoading, error } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => fetchWorkerById(workerId),
    onError: (error) => {
      console.error('Error fetching worker:', error);
      toast.error('Došlo je do greške prilikom učitavanja podataka o radniku.');
    }
  });

  const handleWorkerUpdate = (updatedWorker) => {
    // Ažuriramo keš sa novim podacima
    queryClient.setQueryData(['worker', workerId], updatedWorker);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-sm text-gray-900">Došlo je do greške prilikom učitavanja podataka o radniku.</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full relative">
      {/* Tabs */}
      <div className="flex items-center justify-center border-b border-gray-100">
        <button
          onClick={() => handleTabChange('schedule')}
          className={`flex-1 flex items-center justify-center p-4 relative transition-colors duration-200 hover:bg-gray-50 ${
            activeTab === 'schedule' ? 'text-green-500' : 'text-gray-400'
          }`}
          title="Radno vreme"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className={`absolute bottom-0 left-0 w-full h-0.5 transition-transform duration-300 ease-out ${
            activeTab === 'schedule' ? 'bg-green-500 scale-x-100' : 'bg-green-500 scale-x-0'
          }`} />
        </button>

        <button
          onClick={() => handleTabChange('services')}
          className={`flex-1 flex items-center justify-center p-4 relative transition-colors duration-200 hover:bg-gray-50 ${
            activeTab === 'services' ? 'text-green-500' : 'text-gray-400'
          }`}
          title="Usluge"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <div className={`absolute bottom-0 left-0 w-full h-0.5 transition-transform duration-300 ease-out ${
            activeTab === 'services' ? 'bg-green-500 scale-x-100' : 'bg-green-500 scale-x-0'
          }`} />
        </button>

        <button
          onClick={() => handleTabChange('time_slot')}
          className={`flex-1 flex items-center justify-center p-4 relative transition-colors duration-200 hover:bg-gray-50 ${
            activeTab === 'time_slot' ? 'text-green-500' : 'text-gray-400'
          }`}
          title="Interval termina"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 12v3m0 0v3m0-3h3m-3 0H9" />
          </svg>
          <div className={`absolute bottom-0 left-0 w-full h-0.5 transition-transform duration-300 ease-out ${
            activeTab === 'time_slot' ? 'bg-green-500 scale-x-100' : 'bg-green-500 scale-x-0'
          }`} />
        </button>

        <button
          onClick={() => handleTabChange('off_days')}
          className={`flex-1 flex items-center justify-center p-4 relative transition-colors duration-200 hover:bg-gray-50 ${
            activeTab === 'off_days' ? 'text-green-500' : 'text-gray-400'
          }`}
          title="Neradni dani"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className={`absolute bottom-0 left-0 w-full h-0.5 transition-transform duration-300 ease-out ${
            activeTab === 'off_days' ? 'bg-green-500 scale-x-100' : 'bg-green-500 scale-x-0'
          }`} />
        </button>

        <button
          onClick={() => handleTabChange('settings')}
          className={`flex-1 flex items-center justify-center p-4 relative transition-colors duration-200 hover:bg-gray-50 ${
            activeTab === 'settings' ? 'text-green-500' : 'text-gray-400'
          }`}
          title="Podešavanja"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className={`absolute bottom-0 left-0 w-full h-0.5 transition-transform duration-300 ease-out ${
            activeTab === 'settings' ? 'bg-green-500 scale-x-100' : 'bg-green-500 scale-x-0'
          }`} />
        </button>
      </div>

      {/* Tab sadržaj */}
      <div className="flex-1 overflow-y-auto bg-gray-50" ref={contentRef}>
        <div className="min-h-[calc(100vh-8rem)] w-full pb-20 md:pb-0">
          {activeTab === 'schedule' && <WorkSchedule workerId={workerId} />}
          {activeTab === 'services' && <Services workerId={workerId} />}
          {activeTab === 'time_slot' && worker && (
            <TimeSlotSettings workerId={workerId} initialTimeSlot={worker.time_slot} />
          )}
          {activeTab === 'off_days' && <OffDays workerId={workerId} />}
          {activeTab === 'settings' && worker && (
            <WorkerSettings worker={worker} onUpdate={handleWorkerUpdate} />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDetails;
