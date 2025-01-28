import { useState, useEffect } from 'react';
import axios from 'axios';
import WorkSchedule from './WorkerDetails/WorkSchedule';
import Services from './WorkerDetails/Services';
import TimeSlotSettings from './WorkerDetails/TimeSlotSettings';
import WorkerSettings from './WorkerDetails/WorkerSettings';

const WorkerDetails = ({ workerId }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorker = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/workers/${workerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setWorker(response.data);
      } catch (error) {
        setError('Došlo je do greške prilikom učitavanja podataka o radniku.');
        console.error('Error fetching worker:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorker();
  }, [workerId]);

  const handleWorkerUpdate = (updatedWorker) => {
    setWorker(updatedWorker);
  };

  const tabs = [
    { id: 'schedule', name: 'Radno vreme', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'services', name: 'Usluge', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )},
    { id: 'timeSlot', name: 'Intervali', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { id: 'settings', name: 'Podešavanja', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )}
  ];

  if (loading) {
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
          <h3 className="mt-2 text-sm text-gray-900">{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full relative">
      {/* Tabs */}
      <div className="bg-white shadow-sm flex-shrink-0">
        <div className="sm:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full py-3 pl-3 pr-10 text-base focus:border-green-500 focus:outline-none 
                     focus:ring-green-500 sm:text-sm border-b border-gray-200 bg-white"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="hidden sm:block">
          <nav className="flex" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 group inline-flex items-center justify-center py-4 px-1 border-b-2 text-sm
                  ${activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  transition-all duration-200 focus:outline-none
                `}
              >
                <span className={`
                  ${activeTab === tab.id
                    ? 'text-green-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                  mr-2 transition-colors duration-200
                `}>
                  {tab.icon}
                </span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab sadržaj */}
      <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
        <div className="min-h-full w-full pb-20 md:pb-0">
          {activeTab === 'schedule' && <WorkSchedule workerId={workerId} />}
          {activeTab === 'services' && <Services workerId={workerId} />}
          {activeTab === 'timeSlot' && worker && (
            <TimeSlotSettings workerId={workerId} initialTimeSlot={worker.time_slot} />
          )}
          {activeTab === 'settings' && worker && (
            <WorkerSettings worker={worker} onUpdate={handleWorkerUpdate} />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDetails;
