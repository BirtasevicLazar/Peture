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
    { 
      id: 'schedule', 
      name: 'Radno vreme', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'services', 
      name: 'Usluge', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: 'timeSlot', 
      name: 'Interval', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      id: 'settings', 
      name: 'Podešavanja', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
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
      {/* Tabs - dodajemo sticky pozicioniranje */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-center max-w-7xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center py-4 px-1 
                ${activeTab === tab.id
                  ? 'border-b-2 border-gray-900'
                  : 'border-b-2 border-transparent'
                }
                transition-all duration-200
              `}
            >
              <span className={`
                p-2 rounded-xl mb-1
                ${activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
                }
                transition-colors duration-200
              `}>
                {tab.icon}
              </span>
              <span className={`
                text-xs font-medium
                ${activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-500'
                }
              `}>
                {tab.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab sadržaj - podešavamo overflow */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="min-h-[calc(100vh-8rem)] w-full pb-20 md:pb-0">
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
