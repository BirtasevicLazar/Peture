import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Workers from './Workers';
import Salon from './Salon';
import Services from './Services';
import WorkerSchedule from './WorkerSchedule';

const Dashboard = () => {
  const [activeComponent, setActiveComponent] = useState('workers');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent going back
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function(event) {
      window.history.pushState(null, '', window.location.href);
    };

    return () => {
      window.onpopstate = null;
    };
  }, []);

  const handleLogout = () => {
    window.onpopstate = null; // Remove the navigation prevention
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'salon', label: 'Salon', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'workers', label: 'Radnici', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'settings', label: 'Podešavanja', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  const workerSubmenuItems = [
    { id: 'schedule', label: 'Radno vreme', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', component: null },
    { id: 'services', label: 'Usluge', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', component: Services },
    { id: 'appointments', label: 'Termini', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', component: null },
  ];

  const handleSubmenuClick = (itemId) => {
    setActiveSubmenu(itemId);
    setActiveComponent('worker-details'); // Add this new state to handle worker details view
  };

  const renderMainContent = () => {
    if (activeComponent === 'salon') {
      return <Salon />;
    }

    if (activeComponent === 'workers') {
      return <Workers onWorkerSelect={(worker) => {
        setSelectedWorker(worker);
        setActiveSubmenu(null);
        setActiveComponent('worker-details');
      }} />;
    }

    if (activeComponent === 'worker-details') {
      if (activeSubmenu === 'services') {
        return (
          <div>
            <div className="mb-6 flex items-center">
              <button
                onClick={() => {
                  setActiveComponent('workers');
                  setSelectedWorker(null);
                  setActiveSubmenu(null);
                }}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                Usluge - {selectedWorker?.ime} {selectedWorker?.prezime}
              </h1>
            </div>
            <Services workerId={selectedWorker?.id} />
          </div>
        );
      } else if (activeSubmenu === 'schedule') {
        return (
          <div>
            <div className="mb-6 flex items-center">
              <button
                onClick={() => {
                  setActiveComponent('workers');
                  setSelectedWorker(null);
                  setActiveSubmenu(null);
                }}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                Radno vreme - {selectedWorker?.ime} {selectedWorker?.prezime}
              </h1>
            </div>
            <WorkerSchedule workerId={selectedWorker?.id} />
          </div>
        );
      }
      // Add other submenu components here (schedule, appointments)
      return null;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-40">
        <div className="px-4">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              {selectedWorker ? (
                <button
                  onClick={() => {
                    setActiveComponent('workers');
                    setSelectedWorker(null);
                    setActiveSubmenu(null);
                  }}
                  className="lg:hidden inline-flex items-center p-2 rounded-md text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : null}
              <div className="flex-shrink-0 flex items-center ml-2">
                <span className="text-xl font-bold text-green-600">Peture</span>
              </div>
            </div>
            
            {selectedWorker && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  {selectedWorker.ime} {selectedWorker.prezime}
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)] pt-14">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200">
          {/* Existing sidebar content */}
          <nav className="mt-5 px-2 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveComponent(item.id);
                  setSelectedWorker(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`${
                  activeComponent === item.id && !selectedWorker
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                } group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <svg
                  className={`${
                    activeComponent === item.id && !selectedWorker ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-5 w-5`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}

            {/* Worker Submenu */}
            {selectedWorker && (
              <div className="ml-4 mt-2 border-l-2 border-green-100">
                <div className="py-2 px-2 text-sm font-medium text-gray-500">
                  {selectedWorker.ime} {selectedWorker.prezime}
                </div>
                {workerSubmenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSubmenuClick(item.id)}
                    className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md"
                  >
                    <svg
                      className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {renderMainContent()}
          </div>
        </main>

        {/* Mobile Bottom Navigation - hidden on desktop */}
        {!selectedWorker ? (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
            <div className="flex justify-around">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveComponent(item.id);
                    setSelectedWorker(null);
                  }}
                  className={`flex flex-col items-center py-2 px-4 ${
                    activeComponent === item.id
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
            <div className="flex justify-around">
              {workerSubmenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSubmenuClick(item.id)}
                  className={`flex flex-col items-center py-2 px-4 ${
                    activeSubmenu === item.id
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
