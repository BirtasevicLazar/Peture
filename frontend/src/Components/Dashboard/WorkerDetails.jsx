import { useState, useEffect } from 'react';
import axios from 'axios';
import WorkSchedule from './WorkerDetails/WorkSchedule';
import Services from './WorkerDetails/Services';

const WorkerDetails = ({ workerId }) => {
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' ili 'services'

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
      </div>

      {/* Conditional rendering based on active tab */}
      {activeTab === 'schedule' ? (
        <WorkSchedule workerId={workerId} />
      ) : (
        <Services workerId={workerId} />
      )}
    </div>
  );
};

export default WorkerDetails;
