import { useState, useEffect } from 'react';
import axios from 'axios';
import WorkSchedule from './WorkerDetails/WorkSchedule';
import Services from './WorkerDetails/Services';
import TimeSlotSettings from './WorkerDetails/TimeSlotSettings';

const WorkerDetails = ({ workerId }) => {
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule', 'services' ili 'timeSlot'
  const [worker, setWorker] = useState(null);

  useEffect(() => {
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
    fetchWorker();
  }, [workerId]);

  return (
    <div className="h-full pb-20 lg:pb-0">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'schedule'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Radno vreme
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'services'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Usluge
        </button>
        <button
          onClick={() => setActiveTab('timeSlot')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'timeSlot'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Termini
        </button>
      </div>

      {/* Conditional rendering based on active tab */}
      {activeTab === 'schedule' && <WorkSchedule workerId={workerId} />}
      {activeTab === 'services' && <Services workerId={workerId} />}
      {activeTab === 'timeSlot' && worker && (
        <TimeSlotSettings workerId={workerId} initialTimeSlot={worker.time_slot} />
      )}
    </div>
  );
};

export default WorkerDetails;
